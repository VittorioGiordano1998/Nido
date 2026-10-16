/**
 * App resync bus (TASK-ROB-…-002).
 *
 * On mobile the PWA stays suspended for hours: when it comes back the Realtime
 * channel may still be reconnecting and the lists can show stale data. The
 * state hooks subscribe here with their own `refresh`; one event on return to
 * the foreground (or when the network comes back) refreshes them silently.
 */

type ResyncListener = () => void

const listeners = new Set<ResyncListener>()
let wired = false

function emit(): void {
  for (const listener of listeners) {
    try {
      listener()
    } catch {
      // One failing listener must never break the others.
    }
  }
}

function onVisibilityChange(): void {
  if (document.visibilityState === 'visible') emit()
}

function wire(): void {
  if (wired) return
  wired = true
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('online', emit)
}

/** Registers a silent refresh; returns the unsubscribe function. */
export function subscribeToAppResync(listener: ResyncListener): () => void {
  wire()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
