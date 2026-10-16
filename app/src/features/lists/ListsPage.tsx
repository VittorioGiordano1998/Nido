import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { Button, EmptyState, ErrorBanner, Spinner, TextInput } from '../../ui/components'
import { ChevronRightIcon, ListIcon, PlusIcon } from '../../ui/icons'
import { BackdropPhoto } from './BackdropPhoto'
import { useLists } from './useLists'
import { usePhotoUrls } from './usePhotoUrls'

export function ListsPage() {
  const { lists, tasks, loading, error, createList } = useLists()
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const coverUrls = usePhotoUrls(lists.map((list) => list.coverPath))

  const counts = useMemo(() => {
    const map = new Map<string, { open: number; total: number }>()
    for (const task of tasks) {
      const current = map.get(task.listId) ?? { open: 0, total: 0 }
      current.total += 1
      if (!task.done) current.open += 1
      map.set(task.listId, current)
    }
    return map
  }, [tasks])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    setCreating(true)
    setFormError(null)
    try {
      await createList(title)
      setNewTitle('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di creazione.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-5 pt-2">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-ink">Liste</h1>
        <p className="text-sm text-ink-muted">
          Spesa, film, valigie: tutto quello che fate insieme.
        </p>
      </header>

      {error && <ErrorBanner message={error} />}

      <form onSubmit={(event) => void handleCreate(event)} className="flex items-center gap-2">
        <TextInput
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Nuova lista (es. Spesa)"
        />
        <Button type="submit" loading={creating} aria-label="Crea lista" className="shrink-0">
          <PlusIcon className="h-4 w-4" />
        </Button>
      </form>
      {formError && <ErrorBanner message={formError} />}

      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : lists.length === 0 ? (
        <EmptyState
          icon={<ListIcon className="h-8 w-8 text-ink-faint" />}
          title="Nessuna lista"
          description="Create la prima: spesa, film da vedere, valigie…"
        />
      ) : (
        <ul className="space-y-2">
          {lists.map((list) => {
            const count = counts.get(list.id) ?? { open: 0, total: 0 }
            const coverUrl = list.coverPath ? (coverUrls[list.coverPath] ?? null) : null
            return (
              <li key={list.id}>
                <Link to={`/lists/${list.id}`} className="block">
                  <div
                    className={`relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl shadow-sm ring-1 ring-line/70 transition hover:ring-accent-300 ${
                      coverUrl ? 'h-24' : 'bg-surface p-4'
                    }`}
                  >
                    {coverUrl && list.coverPath && (
                      <BackdropPhoto
                        url={coverUrl}
                        framing={{ x: list.coverX, y: list.coverY, zoom: list.coverZoom }}
                      />
                    )}
                    <span className={`relative z-10 min-w-0 ${coverUrl ? 'pl-4' : ''}`}>
                      <span
                        className={`block truncate text-sm font-semibold ${
                          coverUrl ? 'text-white' : 'text-ink'
                        }`}
                      >
                        {list.title}
                      </span>
                      <span
                        className={`block text-xs ${coverUrl ? 'text-white/80' : 'text-ink-muted'}`}
                      >
                        {count.open} da fare · {count.total} in totale
                      </span>
                    </span>
                    <ChevronRightIcon
                      className={`relative z-10 h-5 w-5 shrink-0 ${
                        coverUrl ? 'mr-4 text-white/85' : 'text-ink-faint'
                      }`}
                    />
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
