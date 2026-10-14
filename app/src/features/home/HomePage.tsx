import { Link } from 'react-router-dom'

import { daysSince, formatDateIt, formatShortDateIt, formatTimeIt } from '../../core/dates'
import { Card, EmptyState, Spinner } from '../../ui/components'
import { ChevronRightIcon, HeartIcon, LockIcon } from '../../ui/icons'
import BlurText from '../../ui/reactbits/BlurText'
import CountUp from '../../ui/reactbits/CountUp'
import { useAuth } from '../auth/AuthProvider'
import { useUpcomingEvents } from '../calendar/useEvents'
import { useCouple } from '../coupling/CoupleProvider'
import { useOpenTasks } from '../lists/useLists'
import { notePreview, useNotes } from '../notes/useNotes'
import { useSettings } from '../settings/SettingsProvider'

const todayLabel = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date())

function sectionTitle(title: string) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">{title}</h2>
  )
}

export function HomePage() {
  const { session } = useAuth()
  const { couple } = useCouple()
  const { enabled } = useSettings()
  const { upcoming, loading: upcomingLoading } = useUpcomingEvents(3)
  const { openTasks, loading: tasksLoading } = useOpenTasks(3)
  const { notes, loading: notesLoading } = useNotes()

  const myId = session?.user.id
  const me = couple?.members.find((member) => member.userId === myId)
  const partner = couple?.members.find((member) => member.userId !== myId)
  const days = couple?.startedAt ? daysSince(couple.startedAt) : null
  const latestNote = notes[0] ?? null

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

      {enabled.calendar && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            {sectionTitle('Prossimi eventi')}
            <Link to="/calendar" className="text-xs font-semibold text-clay-700 hover:underline">
              Calendario
            </Link>
          </div>
          {upcomingLoading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : upcoming.length === 0 ? (
            <EmptyState
              title="Ancora nessun evento"
              description="Aggiungi il primo appuntamento dal calendario: apparirà qui."
            />
          ) : (
            <Card className="divide-y divide-stone-100">
              {upcoming.map((event) => (
                <Link
                  key={event.id}
                  to="/calendar"
                  className="flex items-center gap-3 py-2.5 first:pt-1 last:pb-1"
                >
                  <span className="w-12 shrink-0 text-xs font-semibold capitalize text-stone-500">
                    {formatShortDateIt(event.startAt)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-stone-800">
                        {event.title}
                      </span>
                      {event.visibility === 'private' && (
                        <LockIcon className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                      )}
                    </span>
                    <span className="block text-xs text-stone-500">
                      {event.allDay ? 'Tutto il giorno' : formatTimeIt(event.startAt)}
                      {event.location ? ` · ${event.location}` : ''}
                    </span>
                  </span>
                </Link>
              ))}
            </Card>
          )}
        </section>
      )}

      {enabled.lists && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            {sectionTitle('Attività aperte')}
            <Link to="/lists" className="text-xs font-semibold text-clay-700 hover:underline">
              Liste
            </Link>
          </div>
          {tasksLoading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : openTasks.length === 0 ? (
            <EmptyState
              title="Nessuna attività"
              description="Le liste condivise sono vuote: aggiungete qualcosa insieme."
            />
          ) : (
            <Card className="divide-y divide-stone-100">
              {openTasks.map((task) => (
                <Link
                  key={task.id}
                  to={`/lists/${task.listId}`}
                  className="flex items-center gap-3 py-2.5 first:pt-1 last:pb-1"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-stone-800">
                      {task.title}
                    </span>
                    <span className="block text-xs text-stone-500">{task.listTitle}</span>
                  </span>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-stone-300" />
                </Link>
              ))}
            </Card>
          )}
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          {sectionTitle('Note')}
          <Link to="/notes" className="text-xs font-semibold text-clay-700 hover:underline">
            Tutte
          </Link>
        </div>
        {notesLoading ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : latestNote === null ? (
          <EmptyState
            title="Nessuna nota"
            description="Aprite il blocchetto condiviso per il primo appunto."
          />
        ) : (
          <Link to="/notes" className="block">
            <Card className="transition hover:ring-clay-300">
              <span className="block truncate text-sm font-semibold text-stone-800">
                {latestNote.title.trim() || 'Senza titolo'}
              </span>
              <span className="mt-0.5 block text-xs text-stone-500 line-clamp-2">
                {notePreview(latestNote)}
              </span>
            </Card>
          </Link>
        )}
      </section>
    </div>
  )
}
