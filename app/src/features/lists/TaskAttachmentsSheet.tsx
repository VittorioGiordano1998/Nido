import { useEffect, useRef, useState } from 'react'

import { parseLinkInput, safeHttpUrl } from '../../core/links'
import { Button, ErrorBanner, TextArea, TextInput } from '../../ui/components'
import { CloseIcon, ImageIcon, LinkIcon, TrashIcon } from '../../ui/icons'
import { BackdropEditor } from './BackdropEditor'
import { DEFAULT_FRAMING } from './photos'
import type { Framing } from './photos'
import type { AttachmentKind, TaskAttachment } from './useTaskAttachments'

const TABS: Array<{ key: AttachmentKind; label: string }> = [
  { key: 'photo', label: 'Foto' },
  { key: 'link', label: 'Link' },
  { key: 'note', label: 'Nota' },
]

interface FramingTarget {
  attachment: TaskAttachment
  target: 'backdrop' | 'cover'
  initial: Framing
}

interface TaskAttachmentsSheetProps {
  taskTitle: string
  listTitle: string
  attachments: TaskAttachment[]
  photoUrls: Record<string, string>
  coverPath: string | null
  coverFraming: Framing
  onAdd: (kind: AttachmentKind, value: string, caption: string | null) => Promise<unknown>
  onAddPhoto: (file: File, caption: string | null) => Promise<unknown>
  onDelete: (attachment: TaskAttachment) => Promise<unknown>
  onSetBackdrop: (attachment: TaskAttachment, framing: Framing) => Promise<unknown>
  onClearBackdrop: (attachment: TaskAttachment) => Promise<unknown>
  onSetCover: (attachment: TaskAttachment, framing: Framing) => Promise<unknown>
  onClose: () => void
}

/** Bottom sheet attached to one list item: everything about the item (photos
 *  with the backdrop/cover actions, links, notes) plus the framing editor. */
export function TaskAttachmentsSheet({
  taskTitle,
  listTitle,
  attachments,
  photoUrls,
  coverPath,
  coverFraming,
  onAdd,
  onAddPhoto,
  onDelete,
  onSetBackdrop,
  onClearBackdrop,
  onSetCover,
  onClose,
}: TaskAttachmentsSheetProps) {
  const [tab, setTab] = useState<AttachmentKind>('photo')
  const [caption, setCaption] = useState('')
  const [link, setLink] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [editor, setEditor] = useState<FramingTarget | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape' && !editor) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [editor, onClose])

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setFormError(null)
    try {
      await action()
      return true
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
      return false
    } finally {
      setBusy(false)
    }
  }

  async function handlePhoto(file: File) {
    const saved = await run(() => onAddPhoto(file, caption.trim() || null))
    if (saved) setCaption('')
  }

  async function handleLink() {
    const raw = link.trim()
    if (!raw) return
    const value = parseLinkInput(raw)
    if (!value) {
      setFormError('Il link non sembra valido: usa un indirizzo http:// o https://.')
      return
    }
    const saved = await run(() => onAdd('link', value, caption.trim() || null))
    if (saved) {
      setLink('')
      setCaption('')
    }
  }

  async function handleNote() {
    const value = note.trim()
    if (!value) return
    const saved = await run(() => onAdd('note', value, null))
    if (saved) setNote('')
  }

  function handleDelete(attachment: TaskAttachment) {
    if (!window.confirm('Rimuovere questo allegato?')) return
    void run(() => onDelete(attachment))
  }

  function openFraming(attachment: TaskAttachment, target: 'backdrop' | 'cover') {
    setFormError(null)
    const initial =
      target === 'backdrop'
        ? { x: attachment.bgX, y: attachment.bgY, zoom: attachment.bgZoom }
        : coverPath === attachment.value
          ? coverFraming
          : DEFAULT_FRAMING
    setEditor({ attachment, target, initial })
  }

  async function handleFramingSave(framing: Framing) {
    if (!editor) return
    setBusy(true)
    setFormError(null)
    try {
      if (editor.target === 'backdrop') await onSetBackdrop(editor.attachment, framing)
      else await onSetCover(editor.attachment, framing)
      setEditor(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemoveBackdrop() {
    if (!editor) return
    setBusy(true)
    setFormError(null)
    try {
      await onClearBackdrop(editor.attachment)
      setEditor(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-30 flex items-end justify-center bg-scrim backdrop-blur-[2px] sm:items-center sm:p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Voce ${taskTitle}`}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-canvas p-5 shadow-xl sm:rounded-3xl"
      >
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink">Voce</h2>
            <p className="truncate text-xs text-ink-muted">{taskTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-soft hover:text-ink-soft"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4">
          {attachments.length > 0 ? (
            <ul className="space-y-2">
              {attachments.map((attachment) => (
                <li key={attachment.id}>
                  {attachment.kind === 'photo' ? (
                    <div className="flex items-center gap-3 rounded-xl bg-surface-soft p-2">
                      {photoUrls[attachment.value] ? (
                        <a
                          href={photoUrls[attachment.value]}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0"
                        >
                          <img
                            src={photoUrls[attachment.value]}
                            alt={attachment.caption ?? 'Foto'}
                            className="h-16 w-16 rounded-lg object-cover ring-1 ring-line"
                          />
                        </a>
                      ) : (
                        <span className="h-16 w-16 shrink-0 animate-pulse rounded-lg bg-surface-muted" />
                      )}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="truncate text-sm text-ink-soft">
                          {attachment.caption ?? 'Foto'}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {attachment.isBackdrop ? (
                            <span className="rounded-full bg-accent-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              Sfondo
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => openFraming(attachment, 'backdrop')}
                              className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-accent-ink ring-1 ring-line transition hover:ring-accent-400 disabled:opacity-50"
                            >
                              Usa come sfondo
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => openFraming(attachment, 'cover')}
                            className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-accent-ink ring-1 ring-line transition hover:ring-accent-400 disabled:opacity-50"
                          >
                            {coverPath === attachment.value ? 'Copertina · inquadra' : 'Copertina'}
                          </button>
                        </div>
                      </div>
                      <DeleteButton onClick={() => handleDelete(attachment)} disabled={busy} />
                    </div>
                  ) : attachment.kind === 'link' ? (
                    <div className="flex items-center gap-3 rounded-xl bg-surface-soft p-2">
                      <a
                        href={safeHttpUrl(attachment.value) ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-w-0 flex-1 items-center gap-2 text-sm text-accent-ink hover:underline"
                      >
                        <LinkIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{attachment.caption ?? attachment.value}</span>
                      </a>
                      <DeleteButton onClick={() => handleDelete(attachment)} disabled={busy} />
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 rounded-xl bg-surface-soft p-2">
                      <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm text-ink-soft">
                        {attachment.value}
                      </p>
                      <DeleteButton onClick={() => handleDelete(attachment)} disabled={busy} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-line-strong bg-surface/60 px-4 py-4 text-center text-xs text-ink-faint">
              Nessun allegato per questo elemento.
            </p>
          )}

          <div className="space-y-3 border-t border-line pt-4">
            <div className="flex gap-2" role="tablist" aria-label="Tipo di allegato">
              {TABS.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === entry.key}
                  onClick={() => {
                    setTab(entry.key)
                    setFormError(null)
                  }}
                  className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    tab === entry.key
                      ? 'bg-accent-600 text-white'
                      : 'bg-surface-soft text-ink-soft hover:bg-surface-muted'
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>

            {tab === 'photo' && (
              <div className="space-y-2">
                <TextInput
                  value={caption}
                  onChange={(changeEvent) => setCaption(changeEvent.target.value)}
                  placeholder="Didascalia (facoltativa)"
                  disabled={busy}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4" /> Scegli una foto
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(changeEvent) => {
                    const file = changeEvent.target.files?.[0]
                    changeEvent.target.value = ''
                    if (file) void handlePhoto(file)
                  }}
                />
                <p className="text-xs text-ink-faint">
                  Resta privata della coppia. Massimo 5 MB; la foto viene ottimizzata.
                </p>
              </div>
            )}

            {tab === 'link' && (
              <div className="space-y-2">
                <TextInput
                  type="url"
                  inputMode="url"
                  autoCapitalize="none"
                  value={link}
                  onChange={(changeEvent) => setLink(changeEvent.target.value)}
                  placeholder="https://…"
                  disabled={busy}
                />
                <TextInput
                  value={caption}
                  onChange={(changeEvent) => setCaption(changeEvent.target.value)}
                  placeholder="Didascalia (facoltativa)"
                  disabled={busy}
                />
                <Button
                  type="button"
                  className="w-full"
                  loading={busy}
                  disabled={!link.trim()}
                  onClick={() => void handleLink()}
                >
                  Aggiungi link
                </Button>
              </div>
            )}

            {tab === 'note' && (
              <div className="space-y-2">
                <TextArea
                  rows={2}
                  value={note}
                  onChange={(changeEvent) => setNote(changeEvent.target.value)}
                  placeholder="Scrivi la nota…"
                  disabled={busy}
                />
                <Button
                  type="button"
                  className="w-full"
                  loading={busy}
                  disabled={!note.trim()}
                  onClick={() => void handleNote()}
                >
                  Aggiungi nota
                </Button>
              </div>
            )}

            {formError && !editor && <ErrorBanner message={formError} />}
          </div>
        </div>

        {editor && photoUrls[editor.attachment.value] && (
          <BackdropEditor
            title={editor.target === 'backdrop' ? 'Sfondo della voce' : 'Copertina della lista'}
            sample={editor.target === 'backdrop' ? taskTitle : listTitle}
            url={photoUrls[editor.attachment.value] as string}
            initial={editor.initial}
            busy={busy}
            error={formError}
            onSave={(framing) => void handleFramingSave(framing)}
            onRemove={
              editor.target === 'backdrop' ? () => void handleRemoveBackdrop() : undefined
            }
            removeLabel="Rimuovi sfondo"
            onClose={() => {
              setEditor(null)
              setFormError(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

function DeleteButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      aria-label="Rimuovi l'allegato"
      onClick={onClick}
      disabled={disabled}
      className="shrink-0 rounded-lg p-1.5 text-ink-faint transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-950/60 dark:hover:text-red-400"
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  )
}
