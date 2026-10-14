#!/usr/bin/env node
// Scaffold bootstrap (cross-platform).
//
// The one implementation behind `sh tools/scaffold.sh`, `tools\scaffold.ps1` and
// `node tools/scaffold.mjs` — the sh and ps1 copies are shims over this file, and the
// MCP configurations point here directly because `node` runs on every OS while `sh` does not.
//
// What it does (PLAN-PIETRORUSSO-010 phase 6, decision 18):
//
//   1. Inside a template checkout — the root carries `packages/engine/bin/scaffold.mjs` or one
//      of its earlier layouts — it runs that engine. That is how this repository and any
//      checkout developed with `--addon-dir` work, with no network and no cache.
//   2. In a scaffolded project it resolves `@youbiquo/scaffold-engine` from the machine's
//      registry (`SCAFFOLD_REGISTRY`, else `registry=` in `~/.npmrc`), or from the package
//      cache when the exact version is already there, verifies the tarball against the
//      packument's sha512 (the legacy sha1 shasum as the documented fallback), unpacks it
//      under `$SCAFFOLD_CACHE/pkg/<package>/<version>/` and runs that copy.
//
// The registry is machine configuration and never repository content: nothing in the project
// names a host, so a merged change cannot redirect the toolchain. Nothing is ever cloned —
// that is what makes `.mcp.json` safe, and why `git` is not required to start the engine.
//
// Resolution order for the engine version:
//
//   local checkout -> `lock.engine` pin (when a project carries one; nothing writes it yet)
//   -> the registry's `next`/`latest` dist-tag for the project's channel -> the newest
//   cached version -> a failure that names the repair.
//
// The cache layout and the marker are `packages/engine/lib/cache.mjs`'s; a version this file
// seeds is a cache hit for the engine. The tarball reader and the SRI check are a deliberate
// seed copy of `packages/engine/lib/npm.mjs`: this file runs before any engine exists, so it
// cannot import one. `engine/lib/npm.mjs` is canonical, and a parity test keeps the two equal.
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import zlib from "node:zlib";

export const ENGINE_PACKAGE = "@youbiquo/scaffold-engine";
export const CACHE_MARKER = ".scaffold-pkg.json";
export const MAX_PACKUMENT_BYTES = 8 * 1024 * 1024;
export const MAX_TARBALL_BYTES = 128 * 1024 * 1024;
export const MAX_EXTRACTED_TAR_BYTES = 256 * 1024 * 1024;

// A registry that answers slowly must not hold an MCP session's startup open forever.
const FETCH_TIMEOUT_MS = 15_000;

// The engine has moved twice: extensions/engine/engine.mjs, then packages/engine/engine.mjs,
// now packages/engine/bin/scaffold.mjs. A checkout on any side of those moves still runs.
const ENGINE_CANDIDATES = [
    "packages/engine/bin/scaffold.mjs",
    "packages/engine/engine.mjs",
    "extensions/engine/engine.mjs",
];

const MCP_CANDIDATES = ["packages/mcp/bin/server.mjs"];

function fail(message) {
    process.stderr.write(`scaffold: ${message}\n`);
    process.exit(1);
}

function warn(message) {
    process.stderr.write(`scaffold: ${message}\n`);
}

/** The first engine layout that exists, else the current one so the error names it. */
export function engineIn(checkout) {
    for (const candidate of ENGINE_CANDIDATES) {
        const full = path.join(checkout, ...candidate.split("/"));
        if (fs.existsSync(full)) {
            return full;
        }
    }
    return path.join(checkout, ...ENGINE_CANDIDATES[0].split("/"));
}

/** The first MCP layout that exists, else the current one so the error names it. */
export function mcpIn(checkout) {
    for (const candidate of MCP_CANDIDATES) {
        const full = path.join(checkout, ...candidate.split("/"));
        if (fs.existsSync(full)) {
            return full;
        }
    }
    return path.join(checkout, ...MCP_CANDIDATES[0].split("/"));
}

/** The `--target` the mcp branch was given, or null. */
export function targetFrom(args) {
    for (let index = 0; index < args.length; index++) {
        if (args[index] === "--target" && index + 1 < args.length) {
            return args[index + 1];
        }
        if (args[index].startsWith("--target=")) {
            return args[index].slice("--target=".length);
        }
    }
    return null;
}

/** `$SCAFFOLD_CACHE` (resolved) or `~/.scaffold-cache` — the rule `cache.mjs:cacheRoot` uses. */
export function cacheRootOf(env = process.env, home = os.homedir()) {
    return env.SCAFFOLD_CACHE ? path.resolve(env.SCAFFOLD_CACHE) : path.join(home, ".scaffold-cache");
}

/** One package version in the cache — the layout `engine/lib/cache.mjs:packageDir` writes. */
export function packageDirIn(cacheRoot, packageName, version) {
    return path.join(cacheRoot, "pkg", ...packageName.split("/"), version);
}

export function isCachedIn(cacheRoot, packageName, version) {
    return fs.existsSync(path.join(packageDirIn(cacheRoot, packageName, version), CACHE_MARKER));
}

export function npmrcPath(env = process.env) {
    return env.NPM_CONFIG_USERCONFIG || path.join(os.homedir(), ".npmrc");
}

export function npmrcText(env = process.env) {
    try {
        return fs.readFileSync(npmrcPath(env), "utf8");
    } catch {
        return "";
    }
}

/** `registry=<url>` from the npmrc, the line an unscoped machine has. First one wins. */
export function npmrcRegistry(text) {
    for (const line of text.split(/\r?\n/)) {
        const match = /^\s*registry\s*=\s*(\S+)\s*$/.exec(line);
        if (match) {
            return match[1].replace(/\/+$/, "");
        }
    }
    return null;
}

/** Decision 2's order: an explicit value, then `SCAFFOLD_REGISTRY`, then `~/.npmrc`. */
export function registryFor({ env = process.env, npmrc = "" } = {}) {
    const chosen = (env.SCAFFOLD_REGISTRY || npmrcRegistry(npmrc) || "").trim();
    return chosen ? chosen.replace(/\/+$/, "") : null;
}

/**
 * The auth header for a registry, from the `//host/path/:_authToken=<token>` lines npmrc
 * carries (the legacy `//host/path/:_auth=` included). npm's rule is the longest matching
 * prefix; the engine's `registry-url.mjs:authFor` is the same rule and the same parser.
 */
export function authFor(registry, npmrc = "") {
    if (!registry) {
        return {};
    }
    let target;
    try {
        target = new URL(registry);
    } catch {
        return {};
    }
    const full = `${target.host}${target.pathname.replace(/\/+$/, "")}`;
    let best = null;
    for (const raw of npmrc.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line.startsWith("//")) {
            continue;
        }
        const colon = line.indexOf(":", 2);
        const equals = colon === -1 ? -1 : line.indexOf("=", colon);
        if (colon === -1 || equals === -1) {
            continue;
        }
        const key = line.slice(colon + 1, equals).trim();
        if (key !== "_authToken" && key !== "_auth") {
            continue;
        }
        const prefix = line.slice(2, colon).replace(/\/+$/, "");
        if (prefix !== full && !full.startsWith(`${prefix}/`)) {
            continue;
        }
        if (!best || prefix.length > best.prefix.length) {
            best = { prefix, key, value: line.slice(equals + 1).trim() };
        }
    }
    if (!best || !best.value) {
        return {};
    }
    return { authorization: best.key === "_authToken" ? `Bearer ${best.value}` : `Basic ${best.value}` };
}

/** `<registry>/<name>` — the packument path, with a scoped name's `/` escaped the way npm writes it. */
export function packumentUrl(registry, name) {
    return `${registry}/${name.replace("/", "%2f")}`;
}

const VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

/**
 * The engine version a project's lock pins, or null. Only the fixed engine package and a plain
 * semver are honored: the lock is repository content, and a version is the only thing it may
 * say about the toolchain — never a package name or a path (PLAN-PIETRORUSSO-010 decision 1).
 */
export function enginePin(lock) {
    const pin = lock && lock.engine && typeof lock.engine === "object" ? lock.engine : null;
    if (!pin || typeof pin.version !== "string" || !VERSION_RE.test(pin.version)) {
        return null;
    }
    return { version: pin.version, integrity: typeof pin.integrity === "string" && pin.integrity ? pin.integrity : null };
}

/** Semver precedence, narrowed to the versions a package version can carry (prerelease allowed). */
export function compareVersions(a, b) {
    const parse = (text) => (text.split("-")[0] ?? "").split(".").map((part) => Number(part));
    const [av, bv] = [parse(a), parse(b)];
    for (let i = 0; i < 3; i++) {
        const diff = (av[i] ?? 0) - (bv[i] ?? 0);
        if (diff !== 0) {
            return diff > 0 ? 1 : -1;
        }
    }
    const apre = a.includes("-");
    const bpre = b.includes("-");
    if (apre !== bpre) {
        return apre ? -1 : 1;
    }
    return a === b ? 0 : a > b ? 1 : -1;
}

function releaseFrom(dist, version) {
    if (!dist || typeof dist !== "object" || typeof dist.tarball !== "string") {
        return null;
    }
    return {
        version,
        tarball: dist.tarball,
        integrity: typeof dist.integrity === "string" && dist.integrity.trim() !== "" ? dist.integrity : null,
        shasum: typeof dist.shasum === "string" && /^[0-9a-f]{40}$/i.test(dist.shasum) ? dist.shasum.toLowerCase() : null,
    };
}

/** One named version from a packument, or null when the document does not carry it. */
export function releaseAt(packument, version) {
    const entry = packument && packument.versions && packument.versions[version];
    return entry && typeof entry === "object" ? releaseFrom(entry.dist, version) : null;
}

/**
 * The release the project's channel names: `stable` is `latest`, `next` is `next`, and a
 * missing tag falls back to the other one (the engine package is published under `latest`,
 * so a `next` project on a registry that carries only releases still resolves). Null when the
 * document is malformed or carries no usable version.
 */
export function pickEngineRelease(packument, channel) {
    if (!packument || typeof packument !== "object" || Array.isArray(packument)) {
        return null;
    }
    const tags = packument["dist-tags"];
    const order = channel === "next" ? ["next", "latest"] : ["latest", "next"];
    for (const tag of order) {
        if (tags && typeof tags[tag] === "string") {
            const release = releaseAt(packument, tags[tag]);
            if (release) {
                return release;
            }
        }
    }
    return null;
}

/**
 * Verifies downloaded bytes against the release's SRI, falling back to the legacy sha1
 * shasum, and refuses bytes nothing vouches for. Same rule as `engine/lib/npm.mjs:verifyBytes`.
 */
export function verifySRI(release, bytes) {
    if (release.integrity) {
        for (const token of release.integrity.trim().split(/\s+/)) {
            const dash = token.indexOf("-");
            const algorithm = dash > 0 ? token.slice(0, dash).toLowerCase() : "";
            if (!["sha512", "sha384", "sha256"].includes(algorithm)) {
                continue;
            }
            const expected = token.slice(dash + 1);
            const actual = crypto.createHash(algorithm).update(bytes).digest("base64");
            if (actual !== expected) {
                throw new Error(`integrity mismatch for ${release.tarball} (expected ${algorithm}-${expected})`);
            }
            return;
        }
        throw new Error(`no usable integrity in the packument for ${release.tarball} (${release.integrity})`);
    }
    if (release.shasum) {
        const actual = crypto.createHash("sha1").update(bytes).digest("hex");
        if (actual !== release.shasum) {
            throw new Error(`checksum mismatch for ${release.tarball} (expected ${release.shasum}, got ${actual})`);
        }
        return;
    }
    throw new Error(`no integrity information for ${release.tarball}; refusing to install`);
}

const TAR_BLOCK = 512;
const REGULAR_FILE = new Set(["0", "\0", ""]);

/** A ustar/PAX string field: the bytes up to the first NUL, trimmed of padding. */
function tarField(block, offset, length) {
    const slice = block.subarray(offset, offset + length);
    const end = slice.indexOf(0);
    return slice.subarray(0, end === -1 ? slice.length : end).toString("utf8").trim();
}

function tarSize(block) {
    const text = tarField(block, 124, 12);
    if (text === "") {
        return 0;
    }
    const size = parseInt(text, 8);
    if (!Number.isFinite(size) || size < 0) {
        throw new Error("malformed tar header: unreadable size field");
    }
    return size;
}

function tarName(header) {
    const name = tarField(header, 0, 100);
    const prefix = tarField(header, 345, 155);
    return prefix ? `${prefix}/${name}` : name;
}

/** A PAX extended header payload: `%d key=value\n` records, `%d` counting the record itself. */
function paxRecords(payload) {
    const records = new Map();
    let offset = 0;
    while (offset < payload.length) {
        const space = payload.indexOf(0x20, offset);
        if (space === -1) {
            break;
        }
        const length = parseInt(payload.subarray(offset, space).toString("utf8"), 10);
        if (!Number.isFinite(length) || length <= 0 || offset + length > payload.length) {
            break;
        }
        const record = payload.subarray(offset, offset + length).toString("utf8").replace(/\n$/, "");
        const body = record.slice(space - offset + 1);
        const equals = body.indexOf("=");
        if (equals > 0) {
            records.set(body.slice(0, equals), body.slice(equals + 1));
        }
        offset += length;
    }
    return records;
}

function stripPackagePrefix(name) {
    return name.startsWith("package/") ? name.slice("package/".length) : name;
}

/**
 * Every regular file in an npm tarball, without a tar dependency: gunzip with an output cap,
 * walk the ustar entries, apply PAX/GNU long-name and path overrides, and map each file's
 * `package/`-stripped path to its bytes. The canonical copy lives in `engine/lib/npm.mjs`.
 */
export function extractEntries(tgz, maxOutputLength = MAX_EXTRACTED_TAR_BYTES) {
    let tar;
    try {
        tar = zlib.gunzipSync(tgz, { maxOutputLength });
    } catch (err) {
        if (err && err.code === "ERR_BUFFER_TOO_LARGE") {
            throw new Error(`the tarball decompresses past ${maxOutputLength} bytes`);
        }
        throw err;
    }
    const entries = new Map();
    let offset = 0;
    let pending = new Map();
    while (offset + TAR_BLOCK <= tar.length) {
        const header = tar.subarray(offset, offset + TAR_BLOCK);
        offset += TAR_BLOCK;
        if (header.every((byte) => byte === 0)) {
            break;
        }
        const typeflag = String.fromCharCode(header[156] ?? 0);
        const size = tarSize(header);
        const payload = tar.subarray(offset, offset + size);
        offset += size + ((TAR_BLOCK - (size % TAR_BLOCK)) % TAR_BLOCK);
        if (typeflag === "x") {
            pending = paxRecords(payload);
            continue;
        }
        if (typeflag === "L") {
            pending.set("path", tarField(payload, 0, payload.length));
            continue;
        }
        const name = pending.get("path") ?? tarName(header);
        pending = new Map();
        if (REGULAR_FILE.has(typeflag)) {
            entries.set(stripPackagePrefix(name), Buffer.from(payload));
        }
    }
    return entries;
}

const MAX_REDIRECTS = 5;

/** Reads a response whole, refusing to buffer more than `limit` bytes. */
function readCapped(stream, limit) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let total = 0;
        stream.on("data", (chunk) => {
            total += chunk.length;
            if (total > limit) {
                stream.destroy();
                reject(new Error(`response exceeded ${limit} bytes`));
                return;
            }
            chunks.push(Buffer.from(chunk));
        });
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
    });
}

/**
 * One HTTPS GET, redirects followed but never off https, capped while reading so an oversized
 * response is refused before it is whole, and timed out so a dead registry cannot hang an MCP
 * session. The engine's `lib/npm.mjs:get` is the reference implementation; this is its seed
 * copy (the engine's client is the one the extension and the addon fetches use).
 */
function httpsGet(url, { headers = {}, limit, what, redirects = 0 } = {}) {
    return new Promise((resolve, reject) => {
        if (redirects > MAX_REDIRECTS) {
            reject(new Error(`too many redirects for ${url}`));
            return;
        }
        let parsed;
        try {
            parsed = new URL(url);
        } catch {
            reject(new Error(`${what} is not a URL: ${url}`));
            return;
        }
        if (parsed.protocol !== "https:") {
            reject(new Error(`${what} is not https: ${url} — configure SCAFFOLD_REGISTRY (or registry= in ~/.npmrc) with an https registry`));
            return;
        }
        const request = https.get(parsed, { headers }, (res) => {
            const status = res.statusCode ?? 0;
            if (status >= 300 && status < 400 && res.headers.location) {
                let next;
                try {
                    next = new URL(res.headers.location, parsed);
                } catch (err) {
                    res.resume();
                    reject(err);
                    return;
                }
                res.resume();
                if (next.protocol !== "https:") {
                    reject(new Error(`the redirect for ${url} left https: ${next.href}`));
                    return;
                }
                resolve(httpsGet(next.href, { headers, limit, what, redirects: redirects + 1 }));
                return;
            }
            if (status !== 200) {
                res.resume();
                reject(new Error(`GET ${url} returned ${status}`));
                return;
            }
            readCapped(res, limit).then(resolve, reject);
        });
        request.on("error", reject);
        request.setTimeout(FETCH_TIMEOUT_MS, () => {
            request.destroy(new Error(`GET ${url} timed out after ${FETCH_TIMEOUT_MS} ms`));
        });
    });
}

async function fetchPackument(registry, packageName, headers) {
    const bytes = await httpsGet(packumentUrl(registry, packageName), {
        headers,
        limit: MAX_PACKUMENT_BYTES,
        what: "the registry",
    });
    return JSON.parse(bytes.toString("utf8"));
}

/** Unpacks `entries` under `dest`, refusing anything that would land outside it. */
function unpack(entries, dest) {
    const root = path.resolve(dest);
    for (const [rel, bytes] of entries) {
        const target = path.resolve(root, ...rel.split("/"));
        if (target !== root && !target.startsWith(root + path.sep)) {
            throw new Error(`the tarball entry "${rel}" escapes the package directory`);
        }
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, bytes);
    }
}

/**
 * Installs one package version the way `engine/lib/cache.mjs:installDir` does: unpack into a
 * sibling directory, write the marker last, then rename into place, so a crash never leaves a
 * partial unpack looking like a hit.
 */
function installPackage(dir, bytes, marker) {
    const staging = `${dir}.tmp-${process.pid}-${crypto.randomBytes(4).toString("hex")}`;
    fs.rmSync(staging, { recursive: true, force: true });
    fs.mkdirSync(staging, { recursive: true });
    try {
        unpack(extractEntries(bytes), staging);
        fs.writeFileSync(path.join(staging, CACHE_MARKER), JSON.stringify(marker, null, 2) + "\n", "utf8");
        fs.rmSync(dir, { recursive: true, force: true });
        fs.mkdirSync(path.dirname(dir), { recursive: true });
        fs.renameSync(staging, dir);
    } catch (err) {
        fs.rmSync(staging, { recursive: true, force: true });
        throw err;
    }
}

async function ensureEngine({ cacheRoot, packageName, release, headers }) {
    const dir = packageDirIn(cacheRoot, packageName, release.version);
    if (fs.existsSync(path.join(dir, CACHE_MARKER))) {
        return dir;
    }
    const bytes = await httpsGet(release.tarball, {
        headers,
        limit: MAX_TARBALL_BYTES,
        what: "the engine tarball",
    });
    verifySRI(release, bytes);
    installPackage(dir, bytes, { package: packageName, version: release.version, integrity: release.integrity });
    return dir;
}

function readLock(root) {
    try {
        const parsed = JSON.parse(fs.readFileSync(path.join(root, ".scaffold", "lock.json"), "utf8"));
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
        return null;
    }
}

function newestCachedEngine(cacheRoot, packageName) {
    const dir = path.join(cacheRoot, "pkg", ...packageName.split("/"));
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return null;
    }
    const versions = entries
        .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(dir, entry.name, CACHE_MARKER)))
        .map((entry) => entry.name)
        .sort(compareVersions);
    return versions.length > 0 ? versions[versions.length - 1] : null;
}

function packageEntry(cacheRoot, packageName, version) {
    const dir = packageDirIn(cacheRoot, packageName, version);
    return {
        engine: path.join(dir, "engine", "bin", "scaffold.mjs"),
        mcp: path.join(dir, "mcp", "bin", "server.mjs"),
        version,
    };
}

/**
 * Where the engine to run comes from: the local checkout when there is one, else the lock pin,
 * else the registry, else the newest cached version. Throws when nothing can answer.
 */
async function resolveEngine(root, args, env) {
    const local = engineIn(root);
    if (fs.existsSync(local)) {
        return { engine: local, mcp: mcpIn(root), version: "checkout" };
    }

    const cacheRoot = cacheRootOf(env);
    const lock = readLock(root);
    const pin = enginePin(lock);
    const packageName = ENGINE_PACKAGE;
    const pinnedVersion = pin ? pin.version : null;

    if (pinnedVersion && isCachedIn(cacheRoot, packageName, pinnedVersion)) {
        return packageEntry(cacheRoot, packageName, pinnedVersion);
    }

    if (!args.includes("--offline")) {
        const registry = registryFor({ env, npmrc: npmrcText(env) });
        if (registry) {
            const headers = authFor(registry, npmrcText(env));
            try {
                const packument = await fetchPackument(registry, packageName, headers);
                let release = pinnedVersion
                    ? releaseAt(packument, pinnedVersion)
                    : pickEngineRelease(packument, lock && lock.channel);
                if (!release) {
                    throw new Error(pinnedVersion
                        ? `the registry has no ${packageName}@${pinnedVersion}`
                        : `the registry has no usable release of ${packageName}`);
                }
                if (pinnedVersion && pin.integrity) {
                    if (release.integrity && release.integrity !== pin.integrity) {
                        throw new Error(
                            `the lock pins ${pin.integrity} for ${packageName}@${pinnedVersion} but the registry offers ${release.integrity}`,
                        );
                    }
                    release = { ...release, integrity: pin.integrity };
                }
                await ensureEngine({ cacheRoot, packageName, release, headers });
                return packageEntry(cacheRoot, packageName, release.version);
            } catch (err) {
                warn(`${err.message} — falling back to the cached engine`);
            }
        } else {
            warn("no registry configured (set SCAFFOLD_REGISTRY or `registry=` in ~/.npmrc)");
        }
    }

    const cached = newestCachedEngine(cacheRoot, packageName);
    if (cached) {
        warn(`using ${packageName}@${cached} from the cache`);
        return packageEntry(cacheRoot, packageName, cached);
    }
    throw new Error(
        pinnedVersion
            ? `cache miss for ${packageName}@${pinnedVersion} and no registry to fetch it from (fix: configure the registry, or run \`scaffold cache add <tgz>\`)`
            : `no cached ${packageName} and no registry to fetch it from (fix: configure SCAFFOLD_REGISTRY or \`registry=\` in ~/.npmrc, or run \`scaffold cache add <tgz>\`)`,
    );
}

export async function main(argv = process.argv.slice(2), env = process.env) {
    const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
    const { engine, mcp } = await resolveEngine(root, argv, env);
    if (!fs.existsSync(engine)) {
        fail(`no engine at ${engine} — provision the cache with \`scaffold cache add <engine.tgz>\``);
    }

    // The mcp branch starts the stdio server from the same resolved package, with the project
    // root as --target. The warnings above go to stderr, so stdout stays protocol-clean.
    if (argv[0] === "mcp") {
        if (!fs.existsSync(mcp)) {
            fail(`no MCP server at ${mcp}`);
        }
        const target = targetFrom(argv.slice(1)) || root;
        process.exit(spawnSync(process.execPath, [mcp, "--target", target], { stdio: "inherit" }).status ?? 1);
    }

    const hasTarget = argv.includes("--target") || argv.some((arg) => arg.startsWith("--target="));
    const forward = hasTarget ? argv : [...argv, "--target", root];
    process.exit(spawnSync(process.execPath, [engine, ...forward], { stdio: "inherit" }).status ?? 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
}
