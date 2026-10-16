/**
 * Per-route document titles (TASK-UI-…-004). Longest-prefix match over the
 * routes declared in `app/src/app/router.tsx`, so the browser tab says where
 * you are instead of always "Nido".
 */

const BASE = 'Nido'

const ROUTE_TITLES: Array<[prefix: string, title: string]> = [
  ['/calendar', 'Calendario'],
  ['/lists', 'Liste'],
  ['/notes', 'Note'],
  ['/us/question', 'Domanda del giorno'],
  ['/us/facts', "Cosa c'è da sapere"],
  ['/us/capsules', 'Capsule del tempo'],
  ['/us/decisions', 'Decisioni alla cieca'],
  ['/us/wishlist', 'Wishlist'],
  ['/us/plan', 'Piano settimanale'],
  ['/us/savings', 'Risparmi'],
  ['/us/loyalty', 'Tessere'],
  ['/us/memories', 'Ricordi'],
  ['/us/bucket', 'Bucket list'],
  ['/us/pick', 'Scegli per noi'],
  ['/us', 'Noi'],
  ['/profile', 'Profilo'],
  ['/cycle', 'Ciclo'],
  ['/pair', 'Invita il partner'],
  ['/login', 'Accedi'],
]

export function titleForPath(pathname: string): string {
  let best: string | null = null
  let bestLength = 0
  for (const [prefix, title] of ROUTE_TITLES) {
    const matches = pathname === prefix || pathname.startsWith(`${prefix}/`)
    if (matches && prefix.length > bestLength) {
      best = title
      bestLength = prefix.length
    }
  }
  return best ? `${best} · ${BASE}` : BASE
}
