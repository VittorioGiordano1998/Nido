import { useEffect, useId, useRef } from 'react'

/** Open modal layers, bottom to top: Escape closes the last one only. */
const openLayers: string[] = []

/**
 * What every modal surface shares (sheets, the search overlay): Escape closes
 * the topmost layer only, and the page behind stops scrolling while any layer
 * is open.
 */
export function useModalLayer(onClose: () => void): void {
  const layerId = useId()
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    openLayers.push(layerId)
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key !== 'Escape') return
      if (openLayers[openLayers.length - 1] !== layerId) return
      keyEvent.stopPropagation()
      onCloseRef.current()
    }
    window.addEventListener('keydown', onKeyDown)

    // Nested layers find the page already locked and restore that same value.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      const index = openLayers.indexOf(layerId)
      if (index !== -1) openLayers.splice(index, 1)
    }
  }, [layerId])
}
