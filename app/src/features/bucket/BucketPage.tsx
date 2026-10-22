import { useState } from 'react'
import { Link } from 'react-router-dom'

import { formatDateIt } from '../../core/dates'
import { Button, Card, EmptyState, ErrorBanner, TextInput } from '../../ui/components'
import { ChecklistIllustration } from '../../ui/illustrations'
import { ChevronLeftIcon, TrashIcon } from '../../ui/icons'
import { CardListSkeleton } from '../../ui/Skeleton'
import { useToast } from '../../ui/toast'
import { MemoryEditor } from '../memories/MemoryEditor'
import type { MemoryEditorInput } from '../memories/MemoryEditor'
import { useMemories } from '../memories/useMemories'
import { BucketDoneSheet } from './BucketDoneSheet'
import { useBucket } from './useBucket'
import type { BucketItem } from './useBucket'

function CheckCircle({
  done,
  className = 'h-6 w-6',
}: {
  done: boolean
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex ${className} shrink-0 items-center justify-center rounded-full ring-1 transition ${
        done ? 'bg-accent-600 ring-accent-600 text-white' : 'bg-surface ring-line-strong text-transparent'
      }`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-4 w-4">
        <path d="M5 12.5 10 17.5 19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

/** Bucket list (TASK-BUCKET-…-001): experiences to do together, checked with
 *  an optional linked memory in Ricordi. */
export function BucketPage() {
  const { open, done, loading, error, addItem, toggleItem, deleteItem, restoreItem } = useBucket()
  const { memories, urls, createMemory } = useMemories()
  const { showToast } = useToast()

  const [draft, setDraft] = useState('')
  const [adding, setAdding] = useState(false)
  const [completing, setCompleting] = useState<BucketItem | null>(null)
  const [memoryFor, setMemoryFor] = useState<BucketItem | null>(null)
  const [savingMemory, setSavingMemory] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function memoryOf(item: BucketItem): { caption: string; path: string } | null {
    const memory = memories.find((entry) => entry.bucketItemId === item.id)
    return memory ? { caption: memory.caption, path: memory.photoPath } : null
  }

  async function handleAdd() {
    if (!draft.trim() || adding) return
    setAdding(true)
    setFormError(null)
    try {
      await addItem(draft)
      setDraft('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setAdding(false)
    }
  }

  async function markDone(item: BucketItem) {
    try {
      await toggleItem(item.id, true)
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : 'Errore di aggiornamento.',
        tone: 'error',
      })
    }
  }

  async function handleCheck(item: BucketItem) {
    if (item.doneAt !== null) {
      try {
        await toggleItem(item.id, false)
      } catch (err) {
        showToast({
          message: err instanceof Error ? err.message : 'Errore di aggiornamento.',
          tone: 'error',
        })
      }
      return
    }
    setCompleting(item)
  }

  async function handleDelete(item: BucketItem) {
    try {
      await deleteItem(item.id)
      showToast({
        message: 'Voce eliminata.',
        action: { label: 'Annulla', onAction: () => void restoreItem(item) },
      })
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : "Errore durante l'eliminazione.",
        tone: 'error',
      })
    }
  }

  async function handleSaveMemory(input: MemoryEditorInput) {
    if (!memoryFor || !input.file) return
    setSavingMemory(true)
    setFormError(null)
    try {
      await createMemory({
        file: input.file,
        caption: input.caption,
        takenOn: input.takenOn,
        bucketItemId: memoryFor.id,
      })
      setMemoryFor(null)
      showToast({ message: 'Ricordo salvato.', tone: 'success' })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setSavingMemory(false)
    }
  }

  function renderItem(item: BucketItem) {
    const memory = memoryOf(item)
    const isDone = item.doneAt !== null
    return (
      <li key={item.id} className="flex items-center gap-3 py-2.5 first:pt-1 last:pb-1">
        <button
          type="button"
          onClick={() => void handleCheck(item)}
          aria-label={isDone ? `Segna come da fare: ${item.title}` : `Fatto: ${item.title}`}
          className="shrink-0 rounded-full transition hover:opacity-80"
        >
          <CheckCircle done={isDone} />
        </button>

        <span className="min-w-0 flex-1">
          <span
            className={`block text-sm font-semibold ${
              isDone ? 'text-ink-muted line-through' : 'text-ink'
            }`}
          >
            {item.title}
          </span>
          <span className="block text-xs text-ink-muted">
            {isDone && item.doneAt ? `Fatto il ${formatDateIt(item.doneAt.slice(0, 10))}` : item.note}
          </span>
        </span>

        {memory && (
          <Link
            to="/us/memories"
            viewTransition
            title={memory.caption || 'Ricordo'}
            className="h-9 w-9 shrink-0 overflow-hidden rounded-lg ring-1 ring-line"
          >
            {urls[memory.path] ? (
              <img
                src={urls[memory.path]}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="block h-full w-full bg-surface-muted" />
            )}
          </Link>
        )}

        <button
          type="button"
          aria-label={`Elimina: ${item.title}`}
          onClick={() => void handleDelete(item)}
          className="shrink-0 rounded-lg p-1.5 text-ink-faint transition hover:bg-surface-soft hover:text-red-500"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </li>
    )
  }

  return (
    <div className="space-y-5 pt-2">
      <header className="flex items-start gap-2">
        <Link
          to="/us"
          aria-label="Torna a Noi"
          viewTransition
          className="mt-0.5 rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-soft"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <div className="space-y-1">
          <h1 className="text-balance text-2xl font-bold text-ink">Bucket list</h1>
          <p className="text-sm text-ink-muted">
            Le cose che volete fare insieme, spuntate una alla volta.
          </p>
        </div>
      </header>

      {error && <ErrorBanner message={error} />}

      <div className="flex items-center gap-2">
        <TextInput
          id="bucket-new-item"
          value={draft}
          onChange={(changeEvent) => setDraft(changeEvent.target.value)}
          onKeyDown={(keyEvent) => {
            if (keyEvent.key === 'Enter') void handleAdd()
          }}
          placeholder="Es. vedere il mare d'inverno…"
          maxLength={140}
          disabled={adding}
          aria-label="Nuova voce della bucket list"
        />
        <Button
          type="button"
          onClick={() => void handleAdd()}
          loading={adding}
          disabled={!draft.trim()}
          className="shrink-0 px-3.5 py-3 text-xs"
        >
          Aggiungi
        </Button>
      </div>

      {formError && !memoryFor && <ErrorBanner message={formError} />}

      {loading ? (
        <CardListSkeleton rows={4} />
      ) : open.length === 0 && done.length === 0 ? (
        <EmptyState
          illustration={<ChecklistIllustration className="h-14 w-14 text-accent-glyph" />}
          title="La lista è vuota"
          description="Scrivete la prima cosa da fare insieme: un viaggio, un corso, una cena strana."
          action={
            <button
              type="button"
              onClick={() => document.getElementById('bucket-new-item')?.focus()}
              className="rounded-xl bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
            >
              Aggiungi la prima voce
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {open.length > 0 && (
            <Card className="divide-y divide-line">
              <ul>{open.map((item) => renderItem(item))}</ul>
            </Card>
          )}

          {done.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Fatte ({done.length})
              </h2>
              <Card className="divide-y divide-line">
                <ul>{done.map((item) => renderItem(item))}</ul>
              </Card>
            </section>
          )}
        </div>
      )}

      {completing && (
        <BucketDoneSheet
          title={completing.title}
          busy={false}
          onClose={() => setCompleting(null)}
          onWithoutMemory={() => {
            const item = completing
            setCompleting(null)
            void markDone(item)
          }}
          onWithMemory={() => {
            const item = completing
            setCompleting(null)
            void markDone(item)
            setFormError(null)
            setMemoryFor(item)
          }}
        />
      )}

      {memoryFor && (
        <MemoryEditor
          bucketTitle={memoryFor.title}
          saving={savingMemory}
          error={formError}
          onSave={(input) => void handleSaveMemory(input)}
          onClose={() => {
            setMemoryFor(null)
            setFormError(null)
          }}
        />
      )}
    </div>
  )
}
