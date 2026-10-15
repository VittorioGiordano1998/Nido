import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { Button, Card, EmptyState, ErrorBanner, Spinner, TextInput } from '../../ui/components'
import { ChevronRightIcon, ListIcon, PlusIcon } from '../../ui/icons'
import { useLists } from './useLists'

export function ListsPage() {
  const { lists, tasks, loading, error, createList } = useLists()
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

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
            return (
              <li key={list.id}>
                <Link to={`/lists/${list.id}`} className="block">
                  <Card className="flex items-center justify-between gap-3 transition hover:ring-accent-300">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {list.title}
                      </span>
                      <span className="block text-xs text-ink-muted">
                        {count.open} da fare · {count.total} in totale
                      </span>
                    </span>
                    <ChevronRightIcon className="h-5 w-5 shrink-0 text-ink-faint" />
                  </Card>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
