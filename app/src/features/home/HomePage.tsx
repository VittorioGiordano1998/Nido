import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { formatTimeIt, greetingFor, toDateKey } from '../../core/dates'
import { ButtonLink, Card, EmptyState } from '../../ui/components'
import { CalendarIllustration, ChecklistIllustration, NestIllustration } from '../../ui/illustrations'
import { ChevronRightIcon, LockIcon } from '../../ui/icons'
import { SectionHeader } from '../../ui/PageHeader'
import BlurText from '../../ui/reactbits/BlurText'
import { CardListSkeleton } from '../../ui/Skeleton'
import { useAuth } from '../auth/AuthProvider'
import { useUpcomingEvents } from '../calendar/useEvents'
import { useCouple } from '../coupling/CoupleProvider'
import { useOpenTasks } from '../lists/useLists'
import { MoodCard } from '../mood/MoodCard'
import { notePreview, useNotes } from '../notes/useNotes'
import { DailyQuestionCard } from '../question/DailyQuestionCard'
import { useSettings } from '../settings/SettingsProvider'
import { StickyCard } from '../stickies/StickyCard'
import { HomeHero } from './HomeHero'
import { NextMomentCard } from './NextMomentCard'
import { pickNextMoment } from './nextMoment'
import { OnThisDayCard } from './OnThisDayCard'
import { WeekStrip } from './WeekStrip'

/** Enough upcoming occurrences to find an occasion beyond the three listed. */
const UPCOMING_WINDOW = 12
const LISTED_EVENTS = 3

const todayLabel = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const monthLabel = new Intl.DateTimeFormat('it-IT', { month: 'short' })

/** A small calendar leaf: month over day number. */
function DateBadge({ iso }: { iso: string }) {
  const date = new Date(iso)
  return (
    <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-accent-50 text-accent-ink ring-1 ring-accent-200/70">
      <span className="text-[9px] font-bold uppercase leading-none tracking-wide">
        {monthLabel.format(date).replace('.', '')}
      </span>
      <span className="mt-0.5 font-display text-lg font-semibold leading-none tabular-nums">
        {date.getDate()}
      </span>
    </span>
  )
}

export function HomePage() {
  const { session } = useAuth()
  const { couple } = useCouple()
  const { enabled } = useSettings()
  const { events, upcoming, loading: upcomingLoading } = useUpcomingEvents(UPCOMING_WINDOW)
  const { openTasks, loading: tasksLoading } = useOpenTasks(3)
  const { notes, loading: notesLoading } = useNotes()
  const [now] = useState(() => new Date())

  const myId = session?.user.id
  const members = useMemo(() => couple?.members ?? [], [couple])
  const me = members.find((member) => member.userId === myId)
  const partner = members.find((member) => member.userId !== myId)
  const latestNote = notes[0] ?? null
  const listedEvents = upcoming.slice(0, LISTED_EVENTS)
  const nextMoment = pickNextMoment(upcoming)

  return (
    <div className="space-y-6 pt-2">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-glyph">
          {todayLabel.format(now)}
        </p>
        <BlurText
          text={me?.displayName ? `${greetingFor(now)}, ${me.displayName}` : greetingFor(now)}
          className="font-display text-balance text-[1.75rem] font-semibold leading-tight text-ink lg:text-4xl"
          delay={90}
          stepDuration={0.28}
          direction="top"
        />
        <p className="text-sm text-ink-muted">
          {partner
            ? `Ecco cosa vi aspetta, a te e a ${partner.displayName}.`
            : 'Il tuo spazio è pronto: invita il partner per riempirlo insieme.'}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
        <div className="space-y-6">
          <HomeHero />

          {enabled.calendar && nextMoment && (
            <NextMomentCard occurrence={nextMoment} />
          )}

          {enabled.calendar && (
            <section className="space-y-2.5">
              <SectionHeader title="La settimana" to="/calendar" linkLabel="Calendario" />
              <WeekStrip events={events} myId={myId} />
            </section>
          )}

          {enabled.us && <MoodCard />}

          {enabled.us && <DailyQuestionCard />}

          {enabled.us && <StickyCard />}
        </div>

        <div className="space-y-6">
          {enabled.us && <OnThisDayCard />}

          {enabled.calendar && (
            <section className="space-y-2.5">
              <SectionHeader title="Prossimi eventi" to="/calendar" linkLabel="Tutti" />
              {upcomingLoading ? (
                <CardListSkeleton rows={2} />
              ) : listedEvents.length === 0 ? (
                <EmptyState
                  illustration={<CalendarIllustration className="h-10 w-10 text-accent-glyph" />}
                  title="Ancora nessun evento"
                  description="Aggiungete il primo appuntamento: apparirà qui per entrambi."
                  action={<ButtonLink to="/calendar">Apri il calendario</ButtonLink>}
                />
              ) : (
                <Card className="divide-y divide-line/70 py-1.5">
                  {listedEvents.map((occurrence) => (
                    <Link
                      key={occurrence.key}
                      to="/calendar"
                      state={{ dateKey: toDateKey(new Date(occurrence.startAt)) }}
                      viewTransition
                      className="group flex items-center gap-3 py-2.5"
                    >
                      <DateBadge iso={occurrence.startAt} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-semibold text-ink">
                            {occurrence.event.title}
                          </span>
                          {occurrence.event.visibility === 'private' && (
                            <LockIcon className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                          )}
                        </span>
                        <span className="block truncate text-xs text-ink-muted">
                          {occurrence.event.allDay
                            ? 'Tutto il giorno'
                            : formatTimeIt(occurrence.startAt)}
                          {occurrence.event.location ? ` · ${occurrence.event.location}` : ''}
                          {occurrence.recurring ? ' · si ripete' : ''}
                        </span>
                      </span>
                      <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-faint transition group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </Card>
              )}
            </section>
          )}

          {enabled.lists && (
            <section className="space-y-2.5">
              <SectionHeader title="Attività aperte" to="/lists" linkLabel="Liste" />
              {tasksLoading ? (
                <CardListSkeleton rows={2} />
              ) : openTasks.length === 0 ? (
                <EmptyState
                  illustration={<ChecklistIllustration className="h-10 w-10 text-accent-glyph" />}
                  title="Nessuna attività"
                  description="Le liste condivise sono vuote: aggiungete qualcosa insieme."
                  action={<ButtonLink to="/lists">Apri le liste</ButtonLink>}
                />
              ) : (
                <Card className="divide-y divide-line/70 py-1.5">
                  {openTasks.map((task) => (
                    <Link
                      key={task.id}
                      to={`/lists/${task.listId}`}
                      viewTransition
                      className="group flex items-center gap-3 py-2.5"
                    >
                      <span
                        aria-hidden="true"
                        className="h-5 w-5 shrink-0 rounded-full ring-2 ring-line-strong transition group-hover:ring-accent-400"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {task.title}
                        </span>
                        <span className="block truncate text-xs text-ink-muted">
                          {task.listTitle}
                        </span>
                      </span>
                      <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-faint transition group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </Card>
              )}
            </section>
          )}

          <section className="space-y-2.5">
            <SectionHeader title="Note" to="/notes" linkLabel="Tutte" />
            {notesLoading ? (
              <CardListSkeleton rows={1} />
            ) : latestNote === null ? (
              <EmptyState
                illustration={<NestIllustration className="h-10 w-10 text-accent-glyph" />}
                title="Nessuna nota"
                description="Aprite il blocchetto condiviso per il primo appunto."
                action={<ButtonLink to="/notes">Apri le note</ButtonLink>}
              />
            ) : (
              <Link to="/notes" state={{ noteId: latestNote.id }} viewTransition className="block">
                <Card interactive>
                  <span className="block truncate font-display text-base font-semibold text-ink">
                    {latestNote.title.trim() || 'Senza titolo'}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted line-clamp-2">
                    {notePreview(latestNote)}
                  </span>
                </Card>
              </Link>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
