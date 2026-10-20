/**
 * Returns the normalized URL when `raw` is a web link (http or https), else
 * null. Every user-supplied link goes through here before it becomes an
 * `href`: a `javascript:` or `data:` value must never reach the page.
 */
export function safeHttpUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim()
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

/** Same check for a field typed by the user: a bare `example.com` gets `https://`. */
export function parseLinkInput(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null
  return safeHttpUrl(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`)
}
