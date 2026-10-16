import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { toDateKey } from '../../core/dates'
import { Card, EmptyState, ErrorBanner } from '../../ui/components'
import { CameraIllustration } from '../../ui/illustrations'
import { ChevronLeftIcon, PlusIcon } from '../../ui/icons'
import { SearchField } from '../../ui/SearchField'
import { GridSkeleton } from '../../ui/Skeleton'
import { useToast } from '../../ui/toast'
import { useCouple } from '../coupling/CoupleProvider'
import { MemoryCard } from './MemoryCard'
import { MemoryDetail } from './MemoryDetail'
import { MemoryEditor } from './MemoryEditor'
import type { MemoryEditorInput } from './MemoryEditor'
import { useMemories } from './useMemories'
import type { Memory } from './useMemories'

const ALL = 'all'

/** Ricordi (TASK-MEMO-…-001): the couple's photo journal, polaroid grid,
 *  year filter, "un anno fa oggi" strip, search, detail with edit/delete. */
export function MemoriesPage() {
  const { couple } = useCouple()
  const {
    memories,
    urls,
    loading,
    error,
    createMemory,
    updateMemory,
    deleteMemory,
    restoreMemory,
    purgePhoto,
  } = useMemories()
  const { showToast } = useToast()

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Memory | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [year, setYear] = useState<string>(ALL)
  const [query, setQuery] = useState('')
  // Captured once: "today" must not be recomputed on every render.
  const [today] = useState(() => {
    const now = new Date()
    return { monthDay: toDateKey(now).slice(5), year: now.getFullYear() }
  })

  const detail = memories.find((memory) => memory.id === detailId) ?? null

  const years = useMemo(
    () =>
      [...new Set(memories.map((memory) => memory.takenOn.slice(0, 4)))].sort((a, b) =>
        b.localeCompare(a),
      ),
    [memories],
  )

  const normalizedQuery = query.trim().toLowerCase()
  const visible = useMemo(
    () =>
      memories.filter(
        (memory) =>
          (year === ALL || memory.takenOn.startsWith(year)) &&
          (!normalizedQuery || memory.caption.toLowerCase().includes(normalizedQuery)),
      ),
    [memories, year, normalizedQuery],
  )

  // "Un anno fa oggi": same calendar day, earlier years (TASK-MEMO-…-002).
  const onThisDay = useMemo(
    () =>
      memories
        .filter(
          (memory) =>
            memory.takenOn.slice(5) === today.monthDay &&
            Number(memory.takenOn.slice(0, 4)) < today.year,
        )
        .sort((a, b) => b.takenOn.localeCompare(a.takenOn)),
    [memories, today],
  )
  const yearsAgo = onThisDay[0]
    ? Math.max(1, today.year - Number(onThisDay[0].takenOn.slice(0, 4)))
    : 0

  function nameOf(userId: string): string {
    return couple?.members.find((member) => member.userId === userId)?.displayName ?? '—'
  }

  async function handleCreate(input: MemoryEditorInput) {
    if (!input.file) return
    setSaving(true)
    setFormError(null)
    try {
      await createMemory({
        file: input.file,
        caption: input.caption,
        takenOn: input.takenOn,
      })
      setEditorOpen(false)
      showToast({ message: 'Ricordo salvato.', tone: 'success' })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(input: MemoryEditorInput) {
    if (!editing) return
    setSaving(true)
    setFormError(null)
    try {
      await updateMemory(editing.id, { caption: input.caption, takenOn: input.takenOn })
      setEditing(null)
      showToast({ message: 'Ricordo aggiornato.', tone: 'success' })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(memory: Memory) {
    setBusy(true)
    try {
      await deleteMemory(memory.id)
      setDetailId(null)
      showToast({
        message: 'Ricordo eliminato.',
        action: { label: 'Annulla', onAction: () => void restoreMemory(memory) },
        // Undo closed: the photo object can go if nothing references it.
        onExpire: () => void purgePhoto(memory.photoPath),
      })
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : "Errore durante l'eliminazione.",
        tone: 'error',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5 pt-2">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Link
            to="/us"
            aria-label="Torna a Noi"
            viewTransition
            className="mt-0.5 rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-soft"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <div className="space-y-1">
            <h1 className="text-balance text-2xl font-bold text-ink">Ricordi</h1>
            <p className="text-sm text-ink-muted">
              Il diario per immagini: una foto, una data, un posto nel tempo.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError(null)
            setEditorOpen(true)
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
        >
          <PlusIcon className="h-4 w-4" /> Ricordo
        </button>
      </header>

      {error && <ErrorBanner message={error} />}

      {onThisDay.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {yearsAgo === 1 ? 'Un anno fa oggi' : `${yearsAgo} anni fa oggi`}
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {onThisDay.map((memory) => (
              <button
                key={memory.id}
                type="button"
                onClick={() => setDetailId(memory.id)}
                className="flex w-40 shrink-0 items-center gap-2 rounded-2xl bg-surface p-2 text-left shadow-sm ring-1 ring-line/70 transition hover:ring-accent-300"
              >
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
                  {urls[memory.photoPath] ? (
                    <img
                      src={urls[memory.photoPath]}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-ink">
                    {memory.caption.trim() || 'Un ricordo'}
                  </span>
                  <span className="block text-[11px] text-ink-muted">
                    {memory.takenOn.slice(0, 4)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {years.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {[ALL, ...years].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setYear(value)}
              aria-pressed={year === value}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                year === value
                  ? 'bg-accent-600 text-white'
                  : 'bg-surface-soft text-ink-muted hover:text-ink'
              }`}
            >
              {value === ALL ? 'Tutti' : value}
            </button>
          ))}
        </div>
      )}

      {memories.length >= 4 && (
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Cerca tra le didascalie…"
          label="Cerca tra i ricordi"
        />
      )}

      {loading ? (
        <GridSkeleton cells={4} />
      ) : visible.length === 0 ? (
        <EmptyState
          illustration={<CameraIllustration className="h-14 w-14 text-accent-glyph" />}
          title={memories.length === 0 ? 'Nessun ricordo' : 'Nessun ricordo qui'}
          description={
            memories.length === 0
              ? 'Salvate il primo momento: una foto e una riga bastano.'
              : 'Scegli un altro anno, un altro testo, o aggiungi un ricordo.'
          }
          action={
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className="rounded-xl bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
            >
              Aggiungi il primo ricordo
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-0.5">
          {visible.map((memory, index) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              url={urls[memory.photoPath] ?? null}
              index={index}
              onOpen={() => setDetailId(memory.id)}
            />
          ))}
        </div>
      )}

      {memories.length > 0 && (
        <Card className="bg-accent-50 ring-accent-200">
          <p className="text-xs text-ink-muted">
            I ricordi si vedono in due: quando ne salvi uno, il partner lo vede subito. La bucket
            list può lasciare qui i suoi momenti.
          </p>
        </Card>
      )}

      {editorOpen && (
        <MemoryEditor
          saving={saving}
          error={formError}
          onSave={(input) => void handleCreate(input)}
          onClose={() => setEditorOpen(false)}
        />
      )}

      {editing && (
        <MemoryEditor
          memory={editing}
          photoUrl={urls[editing.photoPath] ?? null}
          saving={saving}
          error={formError}
          onSave={(input) => void handleUpdate(input)}
          onClose={() => {
            setEditing(null)
            setFormError(null)
          }}
        />
      )}

      {detail && (
        <MemoryDetail
          memory={detail}
          url={urls[detail.photoPath] ?? null}
          authorName={nameOf(detail.createdBy)}
          busy={busy}
          onEdit={() => {
            setFormError(null)
            setEditing(detail)
            setDetailId(null)
          }}
          onDelete={() => void handleDelete(detail)}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  )
}
