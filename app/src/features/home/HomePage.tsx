import { Link } from 'react-router-dom'

import { formatShortDateIt, formatTimeIt } from '../../core/dates'
import { Card, EmptyState } from '../../ui/components'
import { CalendarIllustration, ChecklistIllustration, NestIllustration } from '../../ui/illustrations'
import { ChevronRightIcon, LockIcon } from '../../ui/icons'
import { CardListSkeleton } from '../../ui/Skeleton'
import BlurText from '../../ui/reactbits/BlurText'
import { useAuth } from '../auth/AuthProvider'
import { useUpcomingEvents } from '../calendar/useEvents'
import { useCouple } from '../coupling/CoupleProvider'
import { HomeHero } from './HomeHero'
import { useOpenTasks } from '../lists/useLists'
import { notePreview, useNotes } from '../notes/useNotes'
import { MoodCard } from '../mood/MoodCard'
import { DailyQuestionCard } from '../question/DailyQuestionCard'
import { useSettings } from '../settings/SettingsProvider'
import { StickyCard } from '../stickies/StickyCard'

const todayLabel = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date())

function sectionTitle(title: string) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{title}</h2>
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
  const latestNote = notes[0] ?? null

  return (
    <div className="space-y-5 pt-2">
      <header className="space-y-1">
        <p className="text-xs capitalize text-ink-faint">{todayLabel}</p>
        <BlurText
          text={`Ciao, ${me?.displayName ?? 'ciao'}`}
          className="text-balance text-2xl font-bold text-ink"
          delay={90}
          stepDuration={0.28}
          direction="top"
        />
        <p className="text-sm text-ink-muted">
          {partner
            ? `Voi due, insieme da qui. ${partner.displayName} è connesso/a.`
            : 'Il tuo spazio è pronto: invita il partner per riempirlo insieme.'}
        </p>
      </header>

      <HomeHero />

      {enabled.us && <MoodCard />}

      {enabled.us && <DailyQuestionCard />}

      {enabled.us && <StickyCard />}

      {enabled.calendar && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            {sectionTitle('Prossimi eventi')}
            <Link
              to="/calendar"
              viewTransition
              className="text-xs font-semibold text-accent-ink hover:underline"
            >
              Calendario
            </Link>
          </div>
          {upcomingLoading ? (
            <CardListSkeleton rows={2} />
          ) : upcoming.length === 0 ? (
            <EmptyState
              illustration={<CalendarIllustration className="h-12 w-12 text-accent-glyph" />}
              title="Ancora nessun evento"
              description="Aggiungete il primo appuntamento: apparirà qui per entrambi."
              action={
                <Link
                  to="/calendar"
                  viewTransition
                  className="rounded-xl bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
                >
                  Apri il calendario
                </Link>
              }
            />
          ) : (
            <Card className="divide-y divide-line">
              {upcoming.map((occurrence) => (
                <Link
                  key={occurrence.key}
                  to="/calendar"
                  viewTransition
                  className="flex items-center gap-3 py-2.5 first:pt-1 last:pb-1"
                >
                  <span className="w-12 shrink-0 text-xs font-semibold capitalize tabular-nums text-ink-muted">
                    {formatShortDateIt(occurrence.startAt)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-ink">
                        {occurrence.event.title}
                      </span>
                      {occurrence.event.visibility === 'private' && (
                        <LockIcon className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                      )}
                    </span>
                    <span className="block text-xs text-ink-muted">
                      {occurrence.event.allDay ? 'Tutto il giorno' : formatTimeIt(occurrence.startAt)}
                      {occurrence.event.location ? ` · ${occurrence.event.location}` : ''}
                      {occurrence.recurring ? ' · si ripete' : ''}
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
            <Link
              to="/lists"
              viewTransition
              className="text-xs font-semibold text-accent-ink hover:underline"
            >
              Liste
            </Link>
          </div>
          {tasksLoading ? (
            <CardListSkeleton rows={2} />
          ) : openTasks.length === 0 ? (
            <EmptyState
              illustration={<ChecklistIllustration className="h-12 w-12 text-accent-glyph" />}
              title="Nessuna attività"
              description="Le liste condivise sono vuote: aggiungete qualcosa insieme."
              action={
                <Link
                  to="/lists"
                  viewTransition
                  className="rounded-xl bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
                >
                  Apri le liste
                </Link>
              }
            />
          ) : (
            <Card className="divide-y divide-line">
              {openTasks.map((task) => (
                <Link
                  key={task.id}
                  to={`/lists/${task.listId}`}
                  viewTransition
                  className="flex items-center gap-3 py-2.5 first:pt-1 last:pb-1"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {task.title}
                    </span>
                    <span className="block text-xs text-ink-muted">{task.listTitle}</span>
                  </span>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-faint" />
                </Link>
              ))}
            </Card>
          )}
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          {sectionTitle('Note')}
          <Link
            to="/notes"
            viewTransition
            className="text-xs font-semibold text-accent-ink hover:underline"
          >
            Tutte
          </Link>
        </div>
        {notesLoading ? (
          <CardListSkeleton rows={1} />
        ) : latestNote === null ? (
          <EmptyState
            illustration={<NestIllustration className="h-12 w-12 text-accent-glyph" />}
            title="Nessuna nota"
            description="Aprite il blocchetto condiviso per il primo appunto."
            action={
              <Link
                to="/notes"
                viewTransition
                className="rounded-xl bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
              >
                Apri le note
              </Link>
            }
          />
        ) : (
          <Link to="/notes" viewTransition className="block">
            <Card className="transition hover:ring-accent-300">
              <span className="block truncate text-sm font-semibold text-ink">
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
  )
}
