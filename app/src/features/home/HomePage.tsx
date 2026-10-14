import { Link } from 'react-router-dom'

import { daysSince, formatDateIt } from '../../core/dates'
import { Card, EmptyState } from '../../ui/components'
import { HeartIcon } from '../../ui/icons'
import BlurText from '../../ui/reactbits/BlurText'
import CountUp from '../../ui/reactbits/CountUp'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'

const todayLabel = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date())

export function HomePage() {
  const { session } = useAuth()
  const { couple } = useCouple()

  const myId = session?.user.id
  const me = couple?.members.find((member) => member.userId === myId)
  const partner = couple?.members.find((member) => member.userId !== myId)
  const days = couple?.startedAt ? daysSince(couple.startedAt) : null

  return (
    <div className="space-y-5 pt-2">
      <header className="space-y-1">
        <p className="text-xs capitalize text-stone-400">{todayLabel}</p>
        <BlurText
          text={`Ciao, ${me?.displayName ?? 'ciao'}`}
          className="text-2xl font-bold text-stone-900"
          delay={90}
          stepDuration={0.28}
          direction="top"
        />
        <p className="text-sm text-stone-500">
          {partner
            ? `Voi due, insieme da qui. ${partner.displayName} è connesso/a.`
            : 'Il tuo spazio è pronto: invita il partner per riempirlo insieme.'}
        </p>
      </header>

      {partner === undefined && (
        <Card className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-stone-800">Completa la coppia</p>
            <p className="text-xs text-stone-500">Manca il secondo posto nel nido.</p>
          </div>
          <Link
            to="/pair"
            className="rounded-xl bg-clay-600 px-4 py-2 text-sm font-semibold text-white hover:bg-clay-700"
          >
            Invita
          </Link>
        </Card>
      )}

      {days !== null && (
        <Card className="flex items-center gap-4 bg-clay-50 ring-clay-200">
          <HeartIcon className="h-8 w-8 text-clay-500" />
          <div>
            <CountUp
              to={days}
              separator="."
              duration={1.4}
              className="text-3xl font-bold text-clay-700"
            />
            <p className="text-xs font-semibold uppercase tracking-wide text-clay-600">
              giorni insieme
            </p>
            {couple?.startedAt && (
              <p className="text-xs text-stone-500">dal {formatDateIt(couple.startedAt)}</p>
            )}
          </div>
        </Card>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Prossimi eventi
        </h2>
        <EmptyState
          title="Ancora nessun evento"
          description="Il calendario condiviso arriva con la Fase 1: eventi, ricorrenze e promemoria."
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Attività aperte
        </h2>
        <EmptyState
          title="Nessuna attività"
          description="Le liste condivise (spesa, film, viaggi…) arrivano con la Fase 1."
        />
      </section>
    </div>
  )
}
