import { useMemo, useState } from 'react'

import { formatShortDateIt } from '../../core/dates'
import { Card, EmptyState, ErrorBanner } from '../../ui/components'
import { NestIllustration } from '../../ui/illustrations'
import { SearchField } from '../../ui/SearchField'
import { CardListSkeleton } from '../../ui/Skeleton'
import { PlusIcon } from '../../ui/icons'
import { useToast } from '../../ui/toast'
import { NoteEditor } from './NoteEditor'
import { notePreview, useNotes } from './useNotes'
import type { Note, NoteInput } from './useNotes'

export function NotesPage() {
  const { notes, loading, error, createNote, updateNote, deleteNote, restoreNote } = useNotes()
  const { showToast } = useToast()
  const [editor, setEditor] = useState<{ note: Note | null } | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  // Client-side filter over title and body (TASK-SEARCH-…-001).
  const normalizedQuery = query.trim().toLowerCase()
  const visibleNotes = useMemo(() => {
    if (!normalizedQuery) return notes
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(normalizedQuery) ||
        note.body.toLowerCase().includes(normalizedQuery),
    )
  }, [notes, normalizedQuery])

  function openNew() {
    setFormError(null)
    setEditor({ note: null })
  }

  function openNote(note: Note) {
    setFormError(null)
    setEditor({ note })
  }

  function closeEditor() {
    setEditor(null)
    setFormError(null)
  }

  async function handleSave(input: NoteInput) {
    if (!editor) return
    setSaving(true)
    setFormError(null)
    try {
      if (editor.note) await updateNote(editor.note.id, input)
      else await createNote(input)
      setEditor(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const deleted = notes.find((note) => note.id === id) ?? null
    setSaving(true)
    setFormError(null)
    try {
      await deleteNote(id)
      setEditor(null)
      if (deleted) {
        showToast({
          message: 'Nota eliminata.',
          action: { label: 'Annulla', onAction: () => void restoreNote(deleted) },
        })
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Errore durante l'eliminazione.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 pt-2">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-balance text-2xl font-bold text-ink">Note</h1>
          <p className="text-sm text-ink-muted">Il blocchetto condiviso della coppia.</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
        >
          <PlusIcon className="h-4 w-4" /> Nota
        </button>
      </header>

      {error && <ErrorBanner message={error} />}

      {notes.length >= 4 && (
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Cerca nelle note…"
          label="Cerca tra le note"
        />
      )}

      {loading ? (
        <CardListSkeleton rows={3} />
      ) : notes.length === 0 ? (
        <EmptyState
          illustration={<NestIllustration className="h-14 w-14 text-accent-glyph" />}
          title="Nessuna nota"
          description="La prima nota può essere qualsiasi cosa: un codice, un'idea, un promemoria."
          action={
            <button
              type="button"
              onClick={openNew}
              className="rounded-xl bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
            >
              Scrivi la prima nota
            </button>
          }
        />
      ) : visibleNotes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line-strong bg-surface/60 px-4 py-6 text-center text-sm text-ink-faint">
          Nessuna nota corrisponde a «{query.trim()}».
        </p>
      ) : (
        <ul className="space-y-2">
          {visibleNotes.map((note) => (
            <li key={note.id}>
              <button type="button" onClick={() => openNote(note)} className="w-full">
                <Card className="w-full text-left transition hover:ring-accent-300">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {note.title.trim() || 'Senza titolo'}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted line-clamp-2">
                    {notePreview(note)}
                  </span>
                  <span className="mt-1 block text-[11px] text-ink-faint">
                    {formatShortDateIt(note.updatedAt)}
                  </span>
                </Card>
              </button>
            </li>
          ))}
        </ul>
      )}

      {editor && (
        <NoteEditor
          key={editor.note?.id ?? 'new'}
          note={editor.note}
          saving={saving}
          error={formError}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={closeEditor}
        />
      )}
    </div>
  )
}
