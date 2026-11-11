import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { formatShortDateIt } from '../../core/dates'
import { Button, Card, EmptyState, ErrorBanner, NoMatches } from '../../ui/components'
import { NestIllustration } from '../../ui/illustrations'
import { SearchField } from '../../ui/SearchField'
import { CardListSkeleton } from '../../ui/Skeleton'
import { PlusIcon } from '../../ui/icons'
import { useToast } from '../../ui/toast'
import { PageHeader } from '../../ui/PageHeader'
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

  // Home and the global search land here on a given note: open it once per
  // navigation, as soon as the notes are loaded.
  const location = useLocation()
  const requestedId = (location.state as { noteId?: unknown } | null)?.noteId
  const [handledKey, setHandledKey] = useState<string | null>(null)
  if (typeof requestedId === 'string' && !loading && handledKey !== location.key) {
    setHandledKey(location.key)
    const requested = notes.find((note) => note.id === requestedId)
    if (requested) setEditor({ note: requested })
  }

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
      <PageHeader
        title="Note"
        description="Il blocchetto condiviso della coppia."
        action={
          <Button size="sm" onClick={openNew}>
            <PlusIcon className="h-4 w-4" /> Nota
          </Button>
        }
      />

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
            <Button
              size="sm"
              onClick={openNew}
            >
              Scrivi la prima nota
            </Button>
          }
        />
      ) : visibleNotes.length === 0 ? (
        <NoMatches>
          Nessuna nota corrisponde a «{query.trim()}».
        </NoMatches>
      ) : (
        <ul className="stagger grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleNotes.map((note) => (
            <li key={note.id}>
              <button type="button" onClick={() => openNote(note)} className="h-full w-full">
                <Card interactive className="h-full w-full text-left">
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
