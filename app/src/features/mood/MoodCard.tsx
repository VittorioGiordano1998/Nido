import { useEffect, useState } from 'react'

import { Card, ErrorBanner, TextInput } from '../../ui/components'
import { Skeleton } from '../../ui/Skeleton'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'
import { MOOD_LEVELS, moodLevel, useMoods } from './useMoods'

const weekdayNarrow = new Intl.DateTimeFormat('it-IT', { weekday: 'narrow' })

/**
 * Home card "Come stai oggi?" (TASK-MOOD-…-001): one tap a day, the partner's
 * mood visible as soon as they record it, a 7-day strip and a personal streak.
 */
export function MoodCard() {
  const { session } = useAuth()
  const { couple } = useCouple()
  const { loading, myToday, partnerToday, week, streak, setMood } = useMoods()
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const myId = session?.user.id
  const partner = couple?.members.find((member) => member.userId !== myId)

  useEffect(() => {
    setNote(myToday?.note ?? '')
  }, [myToday?.note, myToday?.mood])

  // A check-in is a two-person ritual: nothing to show without a partner.
  if (!partner) return null

  async function choose(value: number) {
    setSaving(true)
    setError(null)
    try {
      await setMood(value, note)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  async function commitNote() {
    if (!myToday || saving) return
    if ((myToday.note ?? '') === note.trim()) return
    setSaving(true)
    setError(null)
    try {
      await setMood(myToday.mood, note)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="space-y-2" aria-hidden="true">
        <Skeleton className="h-4 w-36" />
        <div className="rounded-3xl bg-surface/60 p-4 ring-1 ring-line/50">
          <Skeleton className="h-10" />
          <Skeleton className="mt-3 h-4 w-2/3" />
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Come stai oggi?
        </h2>
        {streak > 0 && (
          <span className="rounded-full bg-sage-100 px-2.5 py-1 text-[11px] font-semibold text-sage-700 dark:bg-sage-700/30 dark:text-sage-300">
            {streak} {streak === 1 ? 'giorno' : 'giorni'}
          </span>
        )}
      </div>

      <Card className="space-y-3">
        <div className="flex justify-between gap-1" role="group" aria-label="Il tuo umore di oggi">
          {MOOD_LEVELS.map((level) => {
            const selected = myToday?.mood === level.value
            return (
              <button
                key={level.value}
                type="button"
                disabled={saving}
                aria-pressed={selected}
                onClick={() => void choose(level.value)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 transition disabled:opacity-60 ${
                  selected
                    ? 'bg-accent-50 ring-2 ring-accent-300 dark:bg-accent-50'
                    : 'hover:bg-surface-soft'
                }`}
              >
                <span className="text-2xl" aria-hidden="true">
                  {level.emoji}
                </span>
                <span className="text-[10px] font-semibold text-ink-muted">{level.label}</span>
              </button>
            )
          })}
        </div>

        <TextInput
          value={note}
          onChange={(changeEvent) => setNote(changeEvent.target.value)}
          onBlur={() => void commitNote()}
          onKeyDown={(keyEvent) => {
            if (keyEvent.key === 'Enter') keyEvent.currentTarget.blur()
          }}
          placeholder={myToday ? 'Una nota per il partner (facoltativa)' : 'Prima scegli come stai'}
          disabled={!myToday || saving}
          maxLength={120}
          aria-label="Nota di oggi"
          className="px-3 py-2 text-xs"
        />

        <p className="text-sm text-ink-soft">
          {partnerToday ? (
            <>
              <span aria-hidden="true">{moodLevel(partnerToday.mood).emoji}</span>{' '}
              <strong className="font-semibold">{partner.displayName}</strong>{' '}
              <span className="text-ink-muted">
                oggi: {moodLevel(partnerToday.mood).label.toLowerCase()}
              </span>
              {partnerToday.note && (
                <span className="block text-xs text-ink-muted">«{partnerToday.note}»</span>
              )}
            </>
          ) : (
            <span className="text-ink-muted">
              {partner.displayName} non ha ancora fatto il check-in oggi.
            </span>
          )}
        </p>

        <div aria-label="Ultimi sette giorni" className="space-y-1">
          <div className="grid grid-cols-7 gap-1 text-center">
            {week.map((day) => (
              <span key={day.dateKey} className="text-[10px] font-semibold text-ink-faint">
                {weekdayNarrow.format(new Date(`${day.dateKey}T00:00:00`))}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {week.map((day) => (
              <span
                key={day.dateKey}
                title={
                  day.mine ? `Tu: ${moodLevel(day.mine.mood).label}` : 'Tu: nessun check-in'
                }
                className="text-sm"
              >
                {day.mine ? moodLevel(day.mine.mood).emoji : <span className="text-ink-faint">·</span>}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {week.map((day) => (
              <span
                key={day.dateKey}
                title={
                  day.theirs
                    ? `${partner.displayName}: ${moodLevel(day.theirs.mood).label}`
                    : `${partner.displayName}: nessun check-in`
                }
                className="text-sm opacity-80"
              >
                {day.theirs ? (
                  moodLevel(day.theirs.mood).emoji
                ) : (
                  <span className="text-ink-faint">·</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {error && <ErrorBanner message={error} />}
      </Card>
    </section>
  )
}
