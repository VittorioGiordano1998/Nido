import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Card, EmptyState, ErrorBanner } from '../../ui/components'
import { CameraIllustration } from '../../ui/illustrations'
import { ChevronLeftIcon, PlusIcon } from '../../ui/icons'
import { GridSkeleton } from '../../ui/Skeleton'
import { useToast } from '../../ui/toast'
import { useCouple } from '../coupling/CoupleProvider'
import { MemoryCard } from './MemoryCard'
import { MemoryDetail } from './MemoryDetail'
import { MemoryEditor } from './MemoryEditor'
import { useMemories } from './useMemories'
import type { Memory, MemoryInput } from './useMemories'

const ALL = 'all'

/** Ricordi (TASK-MEMO-…-001): the couple's photo journal, polaroid grid,
 *  year filter, detail sheet with delete + undo. */
export function MemoriesPage() {
  const { couple } = useCouple()
  const { memories, urls, loading, error, createMemory, deleteMemory, restoreMemory, purgePhoto } =
    useMemories()
  const { showToast } = useToast()

  const [editorOpen, setEditorOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [year, setYear] = useState<string>(ALL)

  const detail = memories.find((memory) => memory.id === detailId) ?? null

  const years = useMemo(
    () =>
      [...new Set(memories.map((memory) => memory.takenOn.slice(0, 4)))].sort((a, b) =>
        b.localeCompare(a),
      ),
    [memories],
  )
  const visible = useMemo(
    () => (year === ALL ? memories : memories.filter((memory) => memory.takenOn.startsWith(year))),
    [memories, year],
  )

  function nameOf(userId: string): string {
    return couple?.members.find((member) => member.userId === userId)?.displayName ?? '—'
  }

  async function handleSave(input: MemoryInput) {
    setSaving(true)
    setFormError(null)
    try {
      await createMemory(input)
      setEditorOpen(false)
      showToast({ message: 'Ricordo salvato.', tone: 'success' })
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

      {loading ? (
        <GridSkeleton cells={4} />
      ) : visible.length === 0 ? (
        <EmptyState
          illustration={<CameraIllustration className="h-14 w-14 text-accent-glyph" />}
          title={memories.length === 0 ? 'Nessun ricordo' : 'Nessun ricordo in questo anno'}
          description={
            memories.length === 0
              ? 'Salvate il primo momento: una foto e una riga bastano.'
              : 'Scegli un altro anno o aggiungi un ricordo.'
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
          onSave={(input) => void handleSave(input)}
          onClose={() => setEditorOpen(false)}
        />
      )}

      {detail && (
        <MemoryDetail
          memory={detail}
          url={urls[detail.photoPath] ?? null}
          authorName={nameOf(detail.createdBy)}
          busy={busy}
          onDelete={() => void handleDelete(detail)}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  )
}
