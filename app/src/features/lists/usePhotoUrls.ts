import { useEffect, useState } from 'react'

import { cachedSignedUrls } from '../../core/photos'

import { PHOTO_BUCKET, signPhotoUrls } from './photos'

/** Signed URLs for a changing set of photo paths (covers and others). */
export function usePhotoUrls(paths: Array<string | null | undefined>): Record<string, string> {
  const key = [...new Set(paths.filter((path): path is string => Boolean(path)))].sort().join('|')
  // Starts from the cache so a screen mounted after a preload paints at once.
  const [urls, setUrls] = useState<Record<string, string>>(() =>
    cachedSignedUrls(PHOTO_BUCKET, key ? key.split('|') : []),
  )

  useEffect(() => {
    const list = key ? key.split('|') : []
    if (list.length === 0) {
      setUrls({})
      return
    }
    let active = true
    void signPhotoUrls(list)
      .then((map) => {
        if (active) setUrls(map)
      })
      .catch(() => {
        // Un URL mancante mostra solo il placeholder: niente da segnalare qui.
      })
    return () => {
      active = false
    }
  }, [key])

  return urls
}
