import { Link } from 'react-router-dom'

import { Card } from '../../ui/components'
import { ChevronRightIcon } from '../../ui/icons'

/** Profilo entry point for the personal cycle diary (consent-gated page).
 *  Hidden for a male profile (TASK-CYC-...-002); unset keeps it visible so
 *  rolling out never hides an existing diary before the profile is set. */
export function CycleCard({ visible = true }: { visible?: boolean }) {
  if (!visible) return null

  return (
    <Link to="/cycle" className="block">
      <Card className="flex items-center justify-between gap-3 transition hover:ring-accent-300">
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink">Ciclo</span>
          <span className="block text-xs text-ink-muted">
            Diario personale con riepiloghi condivisibili.
          </span>
        </span>
        <ChevronRightIcon className="h-5 w-5 shrink-0 text-ink-faint" />
      </Card>
    </Link>
  )
}
