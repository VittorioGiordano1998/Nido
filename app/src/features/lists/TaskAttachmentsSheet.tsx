import { useEffect, useRef, useState } from 'react'

import { Button, ErrorBanner, TextArea, TextInput } from '../../ui/components'
import { CloseIcon, ImageIcon, LinkIcon, TrashIcon } from '../../ui/icons'
import type { AttachmentKind, TaskAttachment } from './useTaskAttachments'

const TABS: Array<{ key: AttachmentKind; label: string }> = [
  { key: 'photo', label: 'Foto' },
  { key: 'link', label: 'Link' },
  { key: 'note', label: 'Nota' },
]

interface TaskAttachmentsSheetProps {
  taskTitle: string
  attachments: TaskAttachment[]
  photoUrls: Record<string, string>
  onAdd: (kind: AttachmentKind, value: string, caption: string | null) => Promise<unknown>
  onAddPhoto: (file: File, caption: string | null) => Promise<unknown>
  onDelete: (attachment: TaskAttachment) => Promise<unknown>
  onClose: () => void
}

/** Bottom sheet attached to one list item: current attachments plus add controls. */
export function TaskAttachmentsSheet({
  taskTitle,
  attachments,
  photoUrls,
  onAdd,
  onAddPhoto,
  onDelete,
  onClose,
}: TaskAttachmentsSheetProps) {
  const [tab, setTab] = useState<AttachmentKind>('photo')
  const [caption, setCaption] = useState('')
  const [link, setLink] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

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
    const value = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`
    try {
      void new URL(value)
    } catch {
      setFormError('Il link non sembra valido.')
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

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-30 flex items-end justify-center bg-scrim backdrop-blur-[2px] sm:items-center sm:p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Allegati di ${taskTitle}`}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-canvas p-5 shadow-xl sm:rounded-3xl"
      >
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink">Allegati</h2>
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
                            className="h-14 w-14 rounded-lg object-cover ring-1 ring-line"
                          />
                        </a>
                      ) : (
                        <span className="h-14 w-14 shrink-0 animate-pulse rounded-lg bg-surface-muted" />
                      )}
                      <span className="min-w-0 flex-1 text-sm text-ink-soft">
                        {attachment.caption ?? 'Foto'}
                      </span>
                      <DeleteButton onClick={() => handleDelete(attachment)} disabled={busy} />
                    </div>
                  ) : attachment.kind === 'link' ? (
                    <div className="flex items-center gap-3 rounded-xl bg-surface-soft p-2">
                      <a
                        href={attachment.value}
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
                  Resta privata della coppia. Massimo 5 MB.
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

            {formError && <ErrorBanner message={formError} />}
          </div>
        </div>
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
