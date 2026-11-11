import { useState } from 'react'
import type { ComponentType, FormEvent } from 'react'

import { toDateKey } from '../../core/dates'
import {
  Button,
  ButtonLink,
  ErrorBanner,
  Field,
  IconTile,
  Select,
  Spinner,
  TextInput,
} from '../../ui/components'
import type { Tone } from '../../ui/components'
import { CalendarIcon, CameraIcon, ChecklistIcon, NoteIcon } from '../../ui/icons'
import { Sheet } from '../../ui/Sheet'
import { useAuth } from '../auth/AuthProvider'
import { EventEditor } from '../calendar/EventEditor'
import { useEvents } from '../calendar/useEvents'
import type { EventInput } from '../calendar/useEvents'
import { useCouple } from '../coupling/CoupleProvider'
import { useLists } from '../lists/useLists'
import { MemoryEditor } from '../memories/MemoryEditor'
import type { MemoryEditorInput } from '../memories/MemoryEditor'
import { useMemories } from '../memories/useMemories'
import { NoteEditor } from '../notes/NoteEditor'
import { useNotes } from '../notes/useNotes'
import type { NoteInput } from '../notes/useNotes'
import { useSettings } from '../settings/SettingsProvider'
import type { SectionKey } from '../settings/SettingsProvider'

/**
 * Quick add (TASK-QADD-…-001): create an event, a list item, a note or a
 * memory from any page. The chooser comes first; each choice mounts the
 * section's own hook and editor, so nothing is fetched until it is needed.
 */

type QuickKind = 'event' | 'task' | 'note' | 'memory'

/** What the shell shows once something was created: a toast and where to open it. */
export interface QuickAddResult {
  message: string
  to: string
  state?: unknown
}

interface StepProps {
  onDone: (result: QuickAddResult) => void
  onClose: () => void
}

const KINDS: ReadonlyArray<{
  kind: QuickKind
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  tone: Tone
  /** Section that must be enabled; null = always available. */
  section: SectionKey | null
}> = [
  {
    kind: 'event',
    title: 'Evento',
    description: 'Un appuntamento nel calendario',
    icon: CalendarIcon,
    tone: 'accent',
    section: 'calendar',
  },
  {
    kind: 'task',
    title: 'Voce di lista',
    description: 'Da aggiungere a una lista',
    icon: ChecklistIcon,
    tone: 'sage',
    section: 'lists',
  },
  {
    kind: 'note',
    title: 'Nota',
    description: 'Un appunto condiviso',
    icon: NoteIcon,
    tone: 'honey',
    section: null,
  },
  {
    kind: 'memory',
    title: 'Ricordo',
    description: 'Una foto per il vostro diario',
    icon: CameraIcon,
    tone: 'plain',
    section: 'us',
  },
]

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function QuickEvent({ onDone, onClose }: StepProps) {
  const { session } = useAuth()
  const { couple } = useCouple()
  const { createEvent } = useEvents()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [todayKey] = useState(() => toDateKey(new Date()))

  async function handleSave(input: EventInput) {
    setSaving(true)
    setError(null)
    try {
      await createEvent(input)
      onDone({
        message: 'Evento aggiunto al calendario.',
        to: '/calendar',
        state: { dateKey: toDateKey(new Date(input.startAt)) },
      })
    } catch (err) {
      setError(errorText(err, 'Errore di salvataggio.'))
      setSaving(false)
    }
  }

  return (
    <EventEditor
      event={null}
      defaultDateKey={todayKey}
      members={(couple?.members ?? []).map((member) => ({
        userId: member.userId,
        displayName: member.displayName,
      }))}
      myId={session?.user.id ?? null}
      saving={saving}
      error={error}
      onSave={handleSave}
      onDelete={async () => {}}
      onClose={onClose}
    />
  )
}

function QuickNote({ onDone, onClose }: StepProps) {
  const { createNote } = useNotes()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(input: NoteInput) {
    setSaving(true)
    setError(null)
    try {
      await createNote(input)
      onDone({ message: 'Nota salvata.', to: '/notes' })
    } catch (err) {
      setError(errorText(err, 'Errore di salvataggio.'))
      setSaving(false)
    }
  }

  return (
    <NoteEditor
      note={null}
      saving={saving}
      error={error}
      onSave={handleSave}
      onDelete={async () => {}}
      onClose={onClose}
    />
  )
}

function QuickMemory({ onDone, onClose }: StepProps) {
  const { createMemory } = useMemories()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(input: MemoryEditorInput) {
    if (!input.file) return
    setSaving(true)
    setError(null)
    try {
      await createMemory({ file: input.file, caption: input.caption, takenOn: input.takenOn })
      onDone({ message: 'Ricordo salvato.', to: '/us/memories' })
    } catch (err) {
      setError(errorText(err, 'Errore di salvataggio.'))
      setSaving(false)
    }
  }

  return (
    <MemoryEditor
      saving={saving}
      error={error}
      onSave={(input) => void handleSave(input)}
      onClose={onClose}
    />
  )
}

function QuickTask({ onDone, onClose }: StepProps) {
  const { lists, loading, error: loadError, addTask } = useLists()
  const [listId, setListId] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Until the user picks one, the first list is the target.
  const targetId = listId || lists[0]?.id || ''
  const target = lists.find((list) => list.id === targetId)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || !target) return
    setSaving(true)
    setError(null)
    try {
      await addTask(target.id, trimmed)
      onDone({ message: `Aggiunto a «${target.title}».`, to: `/lists/${target.id}` })
    } catch (err) {
      setError(errorText(err, 'Errore di salvataggio.'))
      setSaving(false)
    }
  }

  return (
    <Sheet title="Nuova voce" onClose={onClose}>
      {loading ? (
        <div className="flex justify-center py-8 text-accent-glyph">
          <Spinner />
        </div>
      ) : lists.length === 0 ? (
        <div className="space-y-4 pb-2 text-center">
          <p className="text-sm text-ink-muted">
            Non c'è ancora nessuna lista: createne una, poi le voci si aggiungono da qui.
          </p>
          <ButtonLink to="/lists" onClick={onClose}>
            Apri le liste
          </ButtonLink>
        </div>
      ) : (
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <Field label="Lista">
            <Select value={targetId} onChange={(event) => setListId(event.target.value)}>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Cosa aggiungere">
            <TextInput
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Es. Latte"
              autoFocus
              required
            />
          </Field>
          {loadError && <ErrorBanner message={loadError} />}
          {error && <ErrorBanner message={error} />}
          <Button type="submit" loading={saving} className="w-full">
            Aggiungi alla lista
          </Button>
        </form>
      )}
    </Sheet>
  )
}

const STEPS: Record<QuickKind, ComponentType<StepProps>> = {
  event: QuickEvent,
  task: QuickTask,
  note: QuickNote,
  memory: QuickMemory,
}

export default function QuickAdd({
  onDone,
  onClose,
}: {
  onDone: (result: QuickAddResult) => void
  onClose: () => void
}) {
  const { enabled } = useSettings()
  const [kind, setKind] = useState<QuickKind | null>(null)

  if (kind) {
    const Step = STEPS[kind]
    return <Step onDone={onDone} onClose={onClose} />
  }

  const choices = KINDS.filter((entry) => entry.section === null || enabled[entry.section])

  return (
    <Sheet title="Cosa aggiungiamo?" onClose={onClose}>
      <div className="stagger grid grid-cols-2 gap-2.5 pb-1">
        {choices.map((entry) => (
          <button
            key={entry.kind}
            type="button"
            onClick={() => setKind(entry.kind)}
            className="flex flex-col items-start gap-3 rounded-2xl bg-surface p-4 text-left shadow-card ring-1 ring-line/60 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:ring-accent-300"
          >
            <IconTile tone={entry.tone} size="lg">
              <entry.icon className="h-6 w-6" />
            </IconTile>
            <span>
              <span className="block font-display text-lg font-semibold leading-tight text-ink">
                {entry.title}
              </span>
              <span className="mt-0.5 block text-xs text-ink-muted">{entry.description}</span>
            </span>
          </button>
        ))}
      </div>
    </Sheet>
  )
}
