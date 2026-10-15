import { Link } from 'react-router-dom'

import { formatDateIt } from '../../core/dates'
import { Card } from '../../ui/components'
import { useCouple } from '../coupling/CoupleProvider'

export function CoupleCard() {
  const { couple } = useCouple()

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        La vostra coppia
      </h2>
      <div className="space-y-2 text-sm">
        <p className="font-semibold text-ink">{couple?.name ?? 'Senza nome'}</p>
        {couple?.startedAt && (
          <p className="text-ink-muted">Insieme dal {formatDateIt(couple.startedAt)}</p>
        )}
        <ul className="space-y-1 pt-1">
          {couple?.members.map((member) => (
            <li key={member.userId} className="flex items-center justify-between text-ink-soft">
              <span>{member.displayName}</span>
              <span className="text-xs text-ink-faint">
                entrato il {formatDateIt(member.joinedAt.slice(0, 10))}
              </span>
            </li>
          ))}
        </ul>
        {couple && couple.members.length < 2 && (
          <p className="pt-2 text-xs text-ink-muted">
            Manca il partner:{' '}
            <Link to="/pair" className="font-semibold text-accent-ink hover:underline">
              condividi il codice invito
            </Link>
            .
          </p>
        )}
      </div>
    </Card>
  )
}
