import { useMemo, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { CardListSkeleton } from '../../ui/Skeleton'
import { Button, EmptyState, ErrorBanner, TextInput } from '../../ui/components'
import { BellIcon, CheckIcon, ChevronLeftIcon, CopyIcon, ImageIcon, PlusIcon, TrashIcon } from '../../ui/icons'
import { useToast } from '../../ui/toast'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'
import { useNudges } from '../nudges/useNudges'
import { BackdropEditor } from './BackdropEditor'
import { BackdropPhoto } from './BackdropPhoto'
import { DEFAULT_FRAMING } from './photos'
import type { Framing } from './photos'
import { ReuseListSheet } from './ReuseListSheet'
import { TaskAttachmentsSheet } from './TaskAttachmentsSheet'
import { useLists } from './useLists'
import type { Task } from './useLists'
import { useTaskAttachments } from './useTaskAttachments'
import type { TaskAttachment } from './useTaskAttachments'
import { usePhotoUrls } from './usePhotoUrls'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function photoPaths(rows: TaskAttachment[]): string[] {
  return [...new Set(rows.filter((row) => row.kind === 'photo').map((row) => row.value))]
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
    restoreTask,
    deleteList,
    restoreList,
    reuseList,
    renameList,
    uploadCover,
    setCover,
    clearCover,
    discardPhoto,
    releaseCoversForPath,
  } = useLists()
  const { showToast } = useToast()
  const {
    byTask,
    photoUrls,
    addAttachment,
    attachPhoto,
    deleteAttachment,
    removeStoredPhotos,
    setBackdrop,
    clearBackdrop,
  } = useTaskAttachments()

  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [titleDraft, setTitleDraft] = useState<string | null>(null)
  const [reuseOpen, setReuseOpen] = useState(false)
  const [reuseBusy, setReuseBusy] = useState(false)
  const [reuseError, setReuseError] = useState<string | null>(null)
  const [attachmentsTask, setAttachmentsTask] = useState<Task | null>(null)
  const [coverEditor, setCoverEditor] = useState<{
    url: string
    path: string
    framing: Framing
    isNew: boolean
  } | null>(null)
  const [coverBusy, setCoverBusy] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)
  const coverFileRef = useRef<HTMLInputElement>(null)

  const myId = session?.user.id
  const partner = couple?.members.find((member) => member.userId !== myId) ?? null
  const list = lists.find((item) => item.id === id) ?? null
  const listTasks = useMemo(() => tasks.filter((task) => task.listId === id), [tasks, id])
  const openTasks = listTasks.filter((task) => !task.done)
  const doneTasks = listTasks.filter((task) => task.done)
  const coverUrls = usePhotoUrls([list?.coverPath ?? null])
  const coverUrl = list?.coverPath ? (coverUrls[list.coverPath] ?? null) : null

  if (loading) {
    return (
      <CardListSkeleton rows={4} />
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
          <h1 className="text-balance text-2xl font-bold text-ink">Lista</h1>
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

  /** Attachments of one item: the cover referencing one of its photos is
   *  cleared first, then the photo objects that stay unused are removed. */
  async function releasePhotos(rows: TaskAttachment[]) {
    for (const path of photoPaths(rows)) await releaseCoversForPath(path)
    await removeStoredPhotos(rows)
  }

  async function handleDeleteTask(taskId: string) {
    const deleted = tasks.find((task) => task.id === taskId) ?? null
    try {
      await releasePhotos(byTask.get(taskId) ?? [])
      await deleteTask(taskId)
      if (deleted) {
        showToast({
          message: 'Elemento eliminato.',
          action: { label: 'Annulla', onAction: () => void restoreTask(deleted) },
        })
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di eliminazione.')
    }
  }

  async function handleAttachmentDelete(attachment: TaskAttachment) {
    if (attachment.kind === 'photo') await releaseCoversForPath(attachment.value)
    await deleteAttachment(attachment)
  }

  async function handleReuse(title: string) {
    if (!list) return
    setReuseBusy(true)
    setReuseError(null)
    try {
      const listTasks = tasks
        .filter((task) => task.listId === list.id)
        .sort((a, b) => a.position - b.position)
      const newId = await reuseList(list, listTasks, title)
      setReuseOpen(false)
      showToast({ message: 'Lista creata.', tone: 'success' })
      navigate(`/lists/${newId}`)
    } catch (err) {
      setReuseError(err instanceof Error ? err.message : 'Errore di creazione.')
    } finally {
      setReuseBusy(false)
    }
  }

  async function handleDeleteList() {
    if (!list) return
    const deletedList = list
    const listTasks = tasks.filter((task) => task.listId === list.id)
    if (!window.confirm(`Eliminare la lista "${list.title}" e i suoi elementi?`)) return
    try {
      const listTaskIds = new Set(listTasks.map((task) => task.id))
      const rows = [...listTaskIds].flatMap((taskId) => byTask.get(taskId) ?? [])
      await releasePhotos(rows)
      if (list.coverPath) await discardPhoto(list.coverPath)
      await deleteList(list.id)
      navigate('/lists')
      showToast({
        message: 'Lista eliminata.',
        action: {
          label: 'Annulla',
          onAction: () => void restoreList(deletedList, listTasks),
        },
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di eliminazione.')
    }
  }

  async function handleCoverPicked(file: File) {
    setCoverError(null)
    setCoverBusy(true)
    try {
      const path = await uploadCover(file)
      setCoverEditor({ url: URL.createObjectURL(file), path, framing: DEFAULT_FRAMING, isNew: true })
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : 'Errore di caricamento.')
    } finally {
      setCoverBusy(false)
    }
  }

  function openCoverEditor() {
    if (!list) return
    setCoverError(null)
    if (list.coverPath && coverUrl) {
      setCoverEditor({
        url: coverUrl,
        path: list.coverPath,
        framing: { x: list.coverX, y: list.coverY, zoom: list.coverZoom },
        isNew: false,
      })
    } else {
      coverFileRef.current?.click()
    }
  }

  function closeCoverEditor() {
    if (coverEditor?.isNew) {
      URL.revokeObjectURL(coverEditor.url)
      void discardPhoto(coverEditor.path)
    }
    setCoverEditor(null)
    setCoverError(null)
  }

  async function handleCoverSave(framing: Framing) {
    if (!list || !coverEditor) return
    setCoverBusy(true)
    setCoverError(null)
    try {
      await setCover(list.id, coverEditor.path, framing)
      if (coverEditor.isNew) URL.revokeObjectURL(coverEditor.url)
      setCoverEditor(null)
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setCoverBusy(false)
    }
  }

  async function handleCoverRemove() {
    if (!list) return
    if (!window.confirm('Rimuovere la copertina della lista?')) return
    setCoverBusy(true)
    setCoverError(null)
    try {
      await clearCover(list.id)
      if (coverEditor?.isNew) URL.revokeObjectURL(coverEditor.url)
      setCoverEditor(null)
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setCoverBusy(false)
    }
  }

  function renderTask(task: Task) {
    const assignee = task.assignedTo
      ? couple?.members.find((member) => member.userId === task.assignedTo)
      : undefined
    const doneBy = task.doneBy
      ? couple?.members.find((member) => member.userId === task.doneBy)
      : undefined
    const backdrop = (byTask.get(task.id) ?? []).find(
      (attachment) => attachment.kind === 'photo' && attachment.isBackdrop && photoUrls[attachment.value],
    )
    const backdropUrl = backdrop ? photoUrls[backdrop.value] : null
    const hasBackdrop = Boolean(backdropUrl && backdrop)

    function openDetails() {
      setAttachmentsTask(task)
    }

    function onRowKeyDown(keyEvent: ReactKeyboardEvent<HTMLDivElement>) {
      if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
        keyEvent.preventDefault()
        openDetails()
      }
    }

    return (
      <li key={task.id}>
        <div
          role="button"
          tabIndex={0}
          aria-label={`Apri i dettagli: ${task.title}`}
          onClick={openDetails}
          onKeyDown={onRowKeyDown}
          className="relative flex h-24 cursor-pointer items-center gap-3 overflow-hidden rounded-2xl bg-surface px-4 shadow-sm ring-1 ring-line/70 transition hover:ring-accent-300"
        >
          {hasBackdrop && backdropUrl && backdrop && (
            <span className={task.done ? 'opacity-60 saturate-50' : ''}>
              <BackdropPhoto
                url={backdropUrl}
                framing={{ x: backdrop.bgX, y: backdrop.bgY, zoom: backdrop.bgZoom }}
              />
            </span>
          )}

          <div className="relative z-10 flex w-full items-center gap-3">
            <button
              type="button"
              role="checkbox"
              aria-checked={task.done}
              aria-label={task.done ? `Segna come da fare: ${task.title}` : `Segna come fatto: ${task.title}`}
              onClick={(clickEvent) => {
                clickEvent.stopPropagation()
                void handleToggle(task)
              }}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1 transition ${
                task.done
                  ? 'bg-sage-500 text-white ring-sage-500'
                  : hasBackdrop
                    ? 'bg-black/25 text-transparent ring-white/70 hover:text-white'
                    : 'bg-surface text-transparent ring-line-strong hover:text-accent-glyph hover:ring-accent-400'
              }`}
            >
              <CheckIcon className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-0 flex-1">
              <span
                className={`block truncate text-sm font-semibold ${
                  task.done
                    ? hasBackdrop
                      ? 'text-white/75 line-through'
                      : 'text-ink-faint line-through'
                    : hasBackdrop
                      ? 'text-white'
                      : 'text-ink'
                }`}
              >
                {task.title}
              </span>
              {task.done && doneBy && (
                <span className={`block text-xs ${hasBackdrop ? 'text-white/70' : 'text-ink-faint'}`}>
                  fatto da {doneBy.displayName}
                </span>
              )}
            </span>
            {!task.done && (
              <button
                type="button"
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation()
                  cycleAssignee(task)
                }}
                title={
                  assignee ? `Assegnato a ${assignee.displayName}: clicca per cambiare` : 'Assegna a…'
                }
                aria-label="Cambia assegnazione"
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition ${
                  assignee
                    ? assignee.userId === myId
                      ? hasBackdrop
                        ? 'bg-white/25 text-white'
                        : 'bg-accent-100 text-accent-ink'
                      : hasBackdrop
                        ? 'bg-white/20 text-white'
                        : 'bg-sage-100 text-sage-700 dark:bg-sage-700/30 dark:text-sage-300'
                    : hasBackdrop
                      ? 'bg-white/15 text-white/80 hover:bg-white/25'
                      : 'bg-surface-soft text-ink-faint hover:bg-surface-muted'
                }`}
              >
                {assignee ? (
                assignee.avatarUrl ? (
                  <img
                    src={assignee.avatarUrl}
                    alt=""
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  initials(assignee.displayName)
                )
              ) : (
                '—'
              )}
              </button>
            )}
            {!task.done && partner && (
              <button
                type="button"
                aria-label={`Ricorda a ${partner.displayName}: ${task.title}`}
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation()
                  void handleNudge(task.id, task.title)
                }}
                className={`rounded-lg p-1.5 transition ${
                  hasBackdrop
                    ? 'text-white/85 hover:bg-white/15 hover:text-white'
                    : 'text-ink-muted hover:bg-accent-50 hover:text-accent-ink'
                }`}
              >
                <BellIcon className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              aria-label={`Elimina ${task.title}`}
              onClick={(clickEvent) => {
                clickEvent.stopPropagation()
                void handleDeleteTask(task.id)
              }}
              className={`rounded-lg p-1.5 transition ${
                hasBackdrop
                  ? 'text-white/85 hover:bg-red-500/80 hover:text-white'
                  : 'text-ink-faint hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/60 dark:hover:text-red-400'
              }`}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </li>
    )
  }

  return (
    <div className="space-y-5 pt-2">
      <header className={`relative overflow-hidden rounded-2xl ${coverUrl ? 'p-3' : ''}`}>
        {coverUrl && list.coverPath && (
          <BackdropPhoto
            url={coverUrl}
            framing={{ x: list.coverX, y: list.coverY, zoom: list.coverZoom }}
          />
        )}
        <div className="relative flex items-start gap-2">
          <Link
            to="/lists"
            aria-label="Torna alle liste"
            className={`mt-0.5 rounded-lg p-1.5 transition ${
              coverUrl
                ? 'text-white/90 hover:bg-white/15'
                : 'text-ink-muted hover:bg-surface-soft'
            }`}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            {titleDraft === null ? (
              <button
                type="button"
                onClick={() => setTitleDraft(list.title)}
                title="Rinomina"
                className={`max-w-full truncate text-left text-2xl font-bold ${
                  coverUrl ? 'text-white' : 'text-ink'
                }`}
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
            <p className={`text-sm ${coverUrl ? 'text-white/80' : 'text-ink-muted'}`}>
              {openTasks.length} da fare · {doneTasks.length} completate
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {!coverUrl && (
                <button
                  type="button"
                  disabled={coverBusy}
                  onClick={openCoverEditor}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface-soft px-3 py-1 text-[11px] font-semibold text-ink-soft transition hover:bg-surface-muted disabled:opacity-50"
                >
                  <ImageIcon className="h-3.5 w-3.5" /> Aggiungi copertina
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setReuseError(null)
                  setReuseOpen(true)
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                  coverUrl
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-surface-soft text-ink-soft hover:bg-surface-muted'
                }`}
              >
                <CopyIcon className="h-3.5 w-3.5" /> Riusa lista
              </button>
            </div>
          </div>
          {coverUrl && (
            <button
              type="button"
              disabled={coverBusy}
              onClick={openCoverEditor}
              aria-label="Cambia copertina"
              title="Cambia copertina"
              className="rounded-lg p-1.5 text-white/90 transition hover:bg-white/15 disabled:opacity-50"
            >
              <ImageIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      <input
        ref={coverFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(changeEvent) => {
          const file = changeEvent.target.files?.[0]
          changeEvent.target.value = ''
          if (file) void handleCoverPicked(file)
        }}
      />

      {error && <ErrorBanner message={error} />}
      {formError && <ErrorBanner message={formError} />}
      {coverError && !coverEditor && <ErrorBanner message={coverError} />}

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
          listTitle={list.title}
          attachments={byTask.get(attachmentsTask.id) ?? []}
          photoUrls={photoUrls}
          coverPath={list.coverPath}
          coverFraming={{ x: list.coverX, y: list.coverY, zoom: list.coverZoom }}
          onAdd={(kind, value, caption) =>
            addAttachment(attachmentsTask.id, kind, value, caption)
          }
          onAddPhoto={(file, caption) => attachPhoto(attachmentsTask.id, file, caption)}
          onDelete={handleAttachmentDelete}
          onSetBackdrop={setBackdrop}
          onClearBackdrop={clearBackdrop}
          onSetCover={(attachment, framing) => setCover(list.id, attachment.value, framing)}
          onClose={() => setAttachmentsTask(null)}
        />
      )}

      {coverEditor && (
        <BackdropEditor
          title="Copertina della lista"
          sample={list.title}
          url={coverEditor.url}
          initial={coverEditor.framing}
          busy={coverBusy}
          error={coverError}
          onSave={(framing) => void handleCoverSave(framing)}
          onRemove={list.coverPath ? () => void handleCoverRemove() : undefined}
          removeLabel="Rimuovi copertina"
          onClose={closeCoverEditor}
        />
      )}

      {reuseOpen && (
        <ReuseListSheet
          sourceTitle={list.title}
          itemCount={tasks.filter((task) => task.listId === list.id).length}
          busy={reuseBusy}
          error={reuseError}
          onConfirm={(title) => void handleReuse(title)}
          onClose={() => setReuseOpen(false)}
        />
      )}
    </div>
  )
}
