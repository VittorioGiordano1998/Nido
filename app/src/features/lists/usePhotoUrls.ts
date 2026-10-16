import { useEffect, useState } from 'react'

import { signPhotoUrls } from './photos'

/** Signed URLs for a changing set of photo paths (covers and others). */
export function usePhotoUrls(paths: Array<string | null | undefined>): Record<string, string> {
  const key = [...new Set(paths.filter((path): path is string => Boolean(path)))].sort().join('|')
  const [urls, setUrls] = useState<Record<string, string>>({})

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
