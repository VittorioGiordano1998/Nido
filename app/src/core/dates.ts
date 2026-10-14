const dateIt = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function parseIsoDate(iso: string): Date | null {
  const parsed = new Date(`${iso}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** Giorni trascorsi da una data ISO (es. inizio relazione) a oggi, in giorni di calendario. */
export function daysSince(iso: string, today = new Date()): number | null {
  const start = parseIsoDate(iso)
  if (!start) return null
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.max(0, Math.floor((todayUtc - startUtc) / 86_400_000))
}

export function formatDateIt(iso: string): string {
  const date = parseIsoDate(iso)
  return date ? dateIt.format(date) : iso
}
