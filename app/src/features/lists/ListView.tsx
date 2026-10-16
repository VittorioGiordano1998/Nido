import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Button, Card, EmptyState, ErrorBanner, Spinner, TextInput } from '../../ui/components'
import {
  BellIcon,
  CheckIcon,
  ChevronLeftIcon,
  LinkIcon,
  PaperclipIcon,
  PlusIcon,
  TrashIcon,
} from '../../ui/icons'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'
import { useNudges } from '../nudges/useNudges'
import { TaskAttachmentsSheet } from './TaskAttachmentsSheet'
import { useLists } from './useLists'
import type { Task } from './useLists'
import { useTaskAttachments } from './useTaskAttachments'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function ListView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { couple } = useCouple()
  const { sendNudge } = useNudges()
  const {
    lists,
    tasks,
    loading,
    error,
    addTask,
    toggleTask,
    setTaskAssignee,
    deleteTask,
    deleteList,
    renameList,
  } = useLists()
  const {
    byTask,
    photoUrls,
    addAttachment,
    attachPhoto,
    deleteAttachment,
    removeStoredPhotos,
  } = useTaskAttachments()

  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [titleDraft, setTitleDraft] = useState<string | null>(null)
  const [attachmentsTask, setAttachmentsTask] = useState<Task | null>(null)

  const myId = session?.user.id
  const partner = couple?.members.find((member) => member.userId !== myId) ?? null
  const list = lists.find((item) => item.id === id) ?? null
  const listTasks = useMemo(() => tasks.filter((task) => task.listId === id), [tasks, id])
  const openTasks = listTasks.filter((task) => !task.done)
  const doneTasks = listTasks.filter((task) => task.done)

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    )
  }

  if (!list) {
    return (
      <div className="space-y-5 pt-2">
        <header className="flex items-center gap-2">
          <Link
            to="/lists"
            aria-label="Torna alle liste"
            className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-soft"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-ink">Lista</h1>
        </header>
        <EmptyState title="Lista non trovata" description="Potrebbe essere stata eliminata." />
      </div>
    )
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault()
    if (!list) return
    const title = newTitle.trim()
    if (!title) return
    setAdding(true)
    setFormError(null)
    try {
      await addTask(list.id, title)
      setNewTitle('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di aggiunta.')
    } finally {
      setAdding(false)
    }
  }

  async function handleRename() {
    if (!list) return
    const next = titleDraft?.trim() ?? ''
    setTitleDraft(null)
    if (!next || next === list.title) return
    try {
      await renameList(list.id, next)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di rinomina.')
    }
  }

  async function handleToggle(task: Task) {
    if (!myId) return
    try {
      await toggleTask(task.id, !task.done, myId)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di aggiornamento.')
    }
  }

  function cycleAssignee(task: Task) {
    if (!myId || !couple) return
    const order: Array<string | null> = [null, myId, ...couple.members.map((m) => m.userId).filter((memberId) => memberId !== myId)]
    const currentIndex = order.indexOf(task.assignedTo)
    const next = order[(currentIndex + 1) % order.length] ?? null
    void setTaskAssignee(task.id, next).catch((err: unknown) =>
      setFormError(err instanceof Error ? err.message : 'Errore di assegnazione.'),
    )
  }

  async function handleNudge(taskId: string, title: string) {
    if (!partner) return
    try {
      await sendNudge(partner.userId, {
        taskId,
        message: `Ricordati: ${title.length > 80 ? `${title.slice(0, 77)}…` : title}`,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore invio promemoria.')
    }
  }

  async function handleDeleteTask(taskId: string) {
    try {
      await removeStoredPhotos(byTask.get(taskId) ?? [])
      await deleteTask(taskId)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di eliminazione.')
    }
  }

  async function handleDeleteList() {
    if (!list) return
    if (!window.confirm(`Eliminare la lista "${list.title}" e i suoi elementi?`)) return
    try {
      const listTaskIds = new Set(tasks.filter((task) => task.listId === list.id).map((task) => task.id))
      await removeStoredPhotos(
        [...listTaskIds].flatMap((taskId) => byTask.get(taskId) ?? []),
      )
      await deleteList(list.id)
      navigate('/lists')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di eliminazione.')
    }
  }

  function renderTask(task: Task) {
    const assignee = task.assignedTo
      ? couple?.members.find((member) => member.userId === task.assignedTo)
      : undefined
    const doneBy = task.doneBy
      ? couple?.members.find((member) => member.userId === task.doneBy)
      : undefined
    const taskAttachments = byTask.get(task.id) ?? []
    const photos = taskAttachments.filter((attachment) => attachment.kind === 'photo')
    const links = taskAttachments.filter((attachment) => attachment.kind === 'link')
    const notes = taskAttachments.filter((attachment) => attachment.kind === 'note')
    return (
      <li key={task.id}>
        <Card className="flex items-center gap-3 py-3">
          <button
            type="button"
            role="checkbox"
            aria-checked={task.done}
            aria-label={task.done ? `Segna come da fare: ${task.title}` : `Segna come fatto: ${task.title}`}
            onClick={() => void handleToggle(task)}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1 transition ${
              task.done
                ? 'bg-sage-500 text-white ring-sage-500'
                : 'bg-surface text-transparent ring-line-strong hover:text-accent-glyph hover:ring-accent-400'
            }`}
          >
            <CheckIcon className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-0 flex-1">
            <span
              className={`block truncate text-sm font-semibold ${
                task.done ? 'text-ink-faint line-through' : 'text-ink'
              }`}
            >
              {task.title}
            </span>
            {task.done && doneBy && (
              <span className="block text-xs text-ink-faint">fatto da {doneBy.displayName}</span>
            )}
            {taskAttachments.length > 0 && (
              <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {photos.slice(0, 3).map((photo) =>
                  photoUrls[photo.value] ? (
                    <a
                      key={photo.id}
                      href={photoUrls[photo.value]}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0"
                    >
                      <img
                        src={photoUrls[photo.value]}
                        alt={photo.caption ?? 'Allegato'}
                        className="h-9 w-9 rounded-lg object-cover ring-1 ring-line"
                      />
                    </a>
                  ) : (
                    <span
                      key={photo.id}
                      className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-surface-muted"
                    />
                  ),
                )}
                {photos.length > 3 && (
                  <span className="text-[11px] font-semibold text-ink-faint">
                    +{photos.length - 3}
                  </span>
                )}
                {links.slice(0, 2).map((link) => (
                  <a
                    key={link.id}
                    href={link.value}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-[10rem] items-center gap-1 rounded-full bg-surface-soft px-2 py-0.5 text-[11px] text-ink-soft hover:bg-surface-muted"
                  >
                    <LinkIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{link.caption ?? link.value}</span>
                  </a>
                ))}
                {links.length > 2 && (
                  <span className="text-[11px] font-semibold text-ink-faint">
                    +{links.length - 2}
                  </span>
                )}
                {notes.length > 0 && (
                  <span className="w-full truncate text-xs text-ink-muted">
                    {notes[0]?.value}
                    {notes.length > 1 ? ` · +${notes.length - 1}` : ''}
                  </span>
                )}
              </span>
            )}
          </span>
          {!task.done && (
            <button
              type="button"
              onClick={() => cycleAssignee(task)}
              title={
                assignee ? `Assegnato a ${assignee.displayName}: clicca per cambiare` : 'Assegna a…'
              }
              aria-label="Cambia assegnazione"
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition ${
                assignee
                  ? assignee.userId === myId
                    ? 'bg-accent-100 text-accent-ink'
                    : 'bg-sage-100 text-sage-700 dark:bg-sage-700/30 dark:text-sage-300'
                  : 'bg-surface-soft text-ink-faint hover:bg-surface-muted'
              }`}
            >
              {assignee ? initials(assignee.displayName) : '—'}
            </button>
          )}
          <button
            type="button"
            aria-label={
              taskAttachments.length > 0
                ? `Allegati (${taskAttachments.length}): ${task.title}`
                : `Aggiungi allegati: ${task.title}`
            }
            onClick={() => setAttachmentsTask(task)}
            className="relative shrink-0 rounded-lg p-1.5 text-ink-muted transition hover:bg-accent-50 hover:text-accent-ink"
          >
            <PaperclipIcon className="h-4 w-4" />
            {taskAttachments.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent-600 px-0.5 text-[9px] font-bold text-white">
                {taskAttachments.length}
              </span>
            )}
          </button>
          {!task.done && partner && (
            <button
              type="button"
              aria-label={`Ricorda a ${partner.displayName}: ${task.title}`}
              onClick={() => void handleNudge(task.id, task.title)}
              className="rounded-lg p-1.5 text-ink-muted transition hover:bg-accent-50 hover:text-accent-ink"
            >
              <BellIcon className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            aria-label={`Elimina ${task.title}`}
            onClick={() => void handleDeleteTask(task.id)}
            className="rounded-lg p-1.5 text-ink-faint transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/60 dark:hover:text-red-400"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </Card>
      </li>
    )
  }

  return (
    <div className="space-y-5 pt-2">
      <header className="flex items-start gap-2">
        <Link
          to="/lists"
          aria-label="Torna alle liste"
          className="mt-0.5 rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-soft"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          {titleDraft === null ? (
            <button
              type="button"
              onClick={() => setTitleDraft(list.title)}
              title="Rinomina"
              className="max-w-full truncate text-left text-2xl font-bold text-ink"
            >
              {list.title}
            </button>
          ) : (
            <TextInput
              autoFocus
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              onBlur={() => void handleRename()}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur()
              }}
              className="text-lg font-bold"
            />
          )}
          <p className="text-sm text-ink-muted">
            {openTasks.length} da fare · {doneTasks.length} completate
          </p>
        </div>
      </header>

      {error && <ErrorBanner message={error} />}
      {formError && <ErrorBanner message={formError} />}

      <form onSubmit={(event) => void handleAdd(event)} className="flex items-center gap-2">
        <TextInput
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Aggiungi un elemento"
        />
        <Button type="submit" loading={adding} aria-label="Aggiungi" className="shrink-0">
          <PlusIcon className="h-4 w-4" />
        </Button>
      </form>

      {listTasks.length === 0 ? (
        <EmptyState title="Lista vuota" description="Aggiungi il primo elemento qui sopra." />
      ) : (
        <div className="space-y-4">
          <ul className="space-y-2">{openTasks.map((task) => renderTask(task))}</ul>
          {doneTasks.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Completati
              </h2>
              <ul className="space-y-2">{doneTasks.map((task) => renderTask(task))}</ul>
            </div>
          )}
        </div>
      )}

      <Button
        variant="ghost"
        className="w-full text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
        onClick={() => void handleDeleteList()}
      >
        <TrashIcon className="h-4 w-4" /> Elimina lista
      </Button>

      {attachmentsTask && (
        <TaskAttachmentsSheet
          taskTitle={attachmentsTask.title}
          attachments={byTask.get(attachmentsTask.id) ?? []}
          photoUrls={photoUrls}
          onAdd={(kind, value, caption) =>
            addAttachment(attachmentsTask.id, kind, value, caption)
          }
          onAddPhoto={(file, caption) => attachPhoto(attachmentsTask.id, file, caption)}
          onDelete={deleteAttachment}
          onClose={() => setAttachmentsTask(null)}
        />
      )}
    </div>
  )
}
