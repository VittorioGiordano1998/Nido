import { supabase } from './supabase'

/**
 * Photo pipeline shared by every feature that uploads images (list photos,
 * list covers, avatars): client-side downscale, upload to a private bucket
 * keyed by couple, and signed URLs. Only state-layer modules call these.
 */

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024

/** Private storage buckets used by the photo pipeline. */
export const LIST_PHOTO_BUCKET = 'list-photos'
export const AVATAR_BUCKET = 'avatars'

const DEFAULT_MAX_SIDE = 1600
const DEFAULT_QUALITY = 0.82
/** Small enough to keep as-is even without re-encoding. */
const KEEP_AS_IS_BYTES = 900 * 1024
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24
/** A cached URL is reused only while it has this much life left. */
const SIGNED_URL_REUSE_MARGIN_MS = 5 * 60 * 1000

/**
 * Signed URLs kept for the session. A fresh signature is a new URL, so the
 * browser cache misses on every re-sign and the photo downloads again; reusing
 * the same URL lets the cache answer on navigation back to a screen.
 */
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>()

export interface PhotoOptions {
  /** Longest side kept when downscaling (default 1600). */
  maxSide?: number
  /** JPEG quality used when re-encoding (default 0.82). */
  quality?: number
}

/** `{couple_id}/{uuid}.{ext}`; the first segment is what the storage policies read. */
export function photoPathFor(coupleId: string, file: File): string {
  const rawExt = file.name.includes('.') ? (file.name.split('.').pop() ?? 'jpg') : 'jpg'
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'jpg'
  return `${coupleId}/${crypto.randomUUID()}.${ext}`
}

/**
 * Re-encodes a photo to at most `maxSide` px on its longest side (JPEG), so
 * uploads stay light and zooming keeps enough pixels. Already-small JPEGs pass
 * through untouched; failures fall back to the original file.
 */
export async function downscaleImage(file: File, options: PhotoOptions = {}): Promise<File> {
  const maxSide = options.maxSide ?? DEFAULT_MAX_SIDE
  const quality = options.quality ?? DEFAULT_QUALITY
  if (!file.type.startsWith('image/')) throw new Error('Serve un file immagine.')
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error('La foto supera 5 MB: scegline una più leggera.')
  }
  if (typeof createImageBitmap !== 'function') return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  const longest = Math.max(bitmap.width, bitmap.height)
  const scale = Math.min(1, maxSide / longest)
  if (scale === 1 && (file.type === 'image/jpeg' || file.size <= KEEP_AS_IS_BYTES)) {
    bitmap.close()
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    return file
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  )
  if (!blob) return file
  const name = file.name.replace(/\.[^.]+$/, '') || 'foto'
  return new File([blob], `${name}.jpg`, { type: 'image/jpeg' })
}

/** Downscales and uploads to `bucket`; returns the storage path to store. */
export async function uploadPhoto(
  bucket: string,
  coupleId: string,
  file: File,
  options: PhotoOptions = {},
): Promise<string> {
  const prepared = await downscaleImage(file, options)
  const path = photoPathFor(coupleId, prepared)
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, prepared, { contentType: prepared.type })
  if (error) {
    // Storage answers "Bucket not found" when the bucket was never created on
    // the project: point at the setup step instead of the raw API message.
    if (/bucket not found/i.test(error.message)) {
      throw new Error(
        `Il bucket «${bucket}» non esiste su Supabase: applica lo script apply dedicato nel SQL Editor.`,
      )
    }
    throw new Error(error.message)
  }
  return path
}

/**
 * Signed URLs already known for these paths, read synchronously: no network,
 * so a screen can paint its photos on the very first render.
 */
export function cachedSignedUrls(bucket: string, paths: string[]): Record<string, string> {
  const now = Date.now()
  const urls: Record<string, string> = {}
  for (const path of paths) {
    const cached = signedUrlCache.get(`${bucket}|${path}`)
    if (cached && cached.expiresAt - now > SIGNED_URL_REUSE_MARGIN_MS) urls[path] = cached.url
  }
  return urls
}

/**
 * Warms the browser cache with photos a screen is about to show, so opening
 * that screen paints them from memory. Best effort: the screen still loads
 * its own photos if this fails.
 */
export function preloadPhotos(bucket: string, paths: string[]): void {
  void signPhotoUrls(bucket, paths)
    .then((urls) => {
      for (const url of Object.values(urls)) {
        const image = new Image()
        image.decoding = 'async'
        image.src = url
      }
    })
    .catch(() => {
      // Nothing to report: the screen loads the photos itself.
    })
}

/** Signed URLs for a set of paths of one bucket, keyed by path. */
export async function signPhotoUrls(
  bucket: string,
  paths: string[],
  ttlSeconds = SIGNED_URL_TTL_SECONDS,
): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))]
  if (unique.length === 0) return {}

  const urls = cachedSignedUrls(bucket, unique)
  const missing = unique.filter((path) => !(path in urls))
  if (missing.length === 0) return urls

  const now = Date.now()

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(missing, ttlSeconds)
  if (error) throw new Error(error.message)
  for (const entry of data ?? []) {
    if (entry.signedUrl && entry.path) {
      urls[entry.path] = entry.signedUrl
      signedUrlCache.set(`${bucket}|${entry.path}`, {
        url: entry.signedUrl,
        expiresAt: now + ttlSeconds * 1000,
      })
    }
  }
  return urls
}
