import { useCallback, useMemo, useState } from 'react'

import { DEFAULT_FEATURED, US_FEATURES } from './features'
import { parseUsage, rankFeatured } from './hubUsage'
import type { UsageCounts } from './hubUsage'

/**
 * Per-device usage of the "Noi" features (state layer). Like the enabled
 * sections, it is a local preference kept in localStorage: it only decides
 * which three tiles sit on top of the hub.
 */

const STORAGE_KEY = 'nido.us.usage.v1'
const CATALOG = US_FEATURES.map((feature) => feature.to)

function loadUsage(): UsageCounts {
  try {
    return parseUsage(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return {}
  }
}

export function useHubUsage() {
  // Read once per visit: the order must not shuffle under the finger.
  const [counts] = useState(loadUsage)

  const featured = useMemo(() => rankFeatured(counts, CATALOG, DEFAULT_FEATURED), [counts])

  const recordOpen = useCallback((route: string) => {
    try {
      const current = loadUsage()
      current[route] = (current[route] ?? 0) + 1
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    } catch {
      // Private mode: the ranking is best-effort, the hub still works.
    }
  }, [])

  return { featured, recordOpen }
}
