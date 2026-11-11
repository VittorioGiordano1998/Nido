/**
 * Ranking of the "Noi" features by how often this device opens them. Pure:
 * the storage side lives in `useHubUsage`.
 */

export type UsageCounts = Record<string, number>

/**
 * The `size` routes to feature on top: the most opened first, ties broken by
 * the catalog order, then the defaults fill what usage does not cover yet.
 * Routes that are no longer in the catalog are ignored.
 */
export function rankFeatured(
  counts: UsageCounts,
  catalog: readonly string[],
  defaults: readonly string[],
  size = 3,
): string[] {
  const used = catalog
    .filter((route) => (counts[route] ?? 0) > 0)
    .sort(
      (a, b) =>
        (counts[b] ?? 0) - (counts[a] ?? 0) || catalog.indexOf(a) - catalog.indexOf(b),
    )
  const fill = [...defaults, ...catalog].filter(
    (route) => catalog.includes(route) && !used.includes(route),
  )
  return [...new Set([...used, ...fill])].slice(0, size)
}

/** Parses the stored counters, dropping anything that is not a positive number. */
export function parseUsage(raw: string | null): UsageCounts {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
    const counts: UsageCounts = {}
    for (const [route, value] of Object.entries(parsed)) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        counts[route] = Math.floor(value)
      }
    }
    return counts
  } catch {
    return {}
  }
}
