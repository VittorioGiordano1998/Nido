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

const timeIt = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' })
const shortDateIt = new Intl.DateTimeFormat('it-IT', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})
const monthYearIt = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' })

/** Chiave locale `YYYY-MM-DD` di una data (il giorno del calendario, non l'istante UTC). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Data locale dalla chiave `YYYY-MM-DD` (mezzanotte locale). */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

/** 42 celle (6 settimane, settimana che inizia di lunedì) per la griglia mensile. */
export function monthCells(month: Date): Array<{ date: Date; key: string; inMonth: boolean }> {
  const first = startOfMonth(month)
  const mondayOffset = (first.getDay() + 6) % 7
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - mondayOffset)
  const cells: Array<{ date: Date; key: string; inMonth: boolean }> = []
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    cells.push({
      date,
      key: toDateKey(date),
      inMonth: date.getMonth() === month.getMonth(),
    })
  }
  return cells
}

export function formatTimeIt(iso: string): string {
  return timeIt.format(new Date(iso))
}

export function formatShortDateIt(iso: string): string {
  return shortDateIt.format(new Date(iso))
}

export function formatMonthYearIt(date: Date): string {
  return monthYearIt.format(date)
}

/** `HH:mm` locale di un istante ISO, per gli input `type="time"`. */
export function toTimeInput(iso: string): string {
  const date = new Date(iso)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
