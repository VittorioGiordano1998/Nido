import { useState } from 'react'

import { CardListSkeleton } from '../../ui/Skeleton'
import { formatDateIt, fromDateKey, toDateKey } from '../../core/dates'
import { Button, Card, EmptyState, ErrorBanner } from '../../ui/components'
import { NestIllustration } from '../../ui/illustrations'
import { PlusIcon } from '../../ui/icons'
import { useToast } from '../../ui/toast'
import { PageHeader } from '../../ui/PageHeader'
import { useAuth } from '../auth/AuthProvider'
import { CapsuleEditor } from './CapsuleEditor'
import { useCapsules } from './useCapsules'
import type { Capsule, CapsuleInput } from './useCapsules'

function daysUntil(dateKey: string, todayKey: string): number {
  const target = fromDateKey(dateKey).getTime()
  const today = fromDateKey(todayKey).getTime()
  return Math.round((target - today) / 86_400_000)
}

function statusLabel(capsule: Capsule, todayKey: string): string {
  if (capsule.opensAt <= todayKey) return `Aperta il ${formatDateIt(capsule.opensAt)}`
  const days = daysUntil(capsule.opensAt, todayKey)
  if (days === 0) return 'Si apre oggi'
  if (days === 1) return 'Si apre domani'
  return `Si apre il ${formatDateIt(capsule.opensAt)} · tra ${days} giorni`
}

export function CapsulesPage() {
  const { session } = useAuth()
  const { capsules, loading, error, createCapsule, updateCapsule, deleteCapsule, restoreCapsule } =
    useCapsules()
  const { showToast } = useToast()
  const [todayKey] = useState(() => toDateKey(new Date()))
  const [editor, setEditor] = useState<{ capsule: Capsule | null } | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const myId = session?.user.id
  const mine = capsules.filter((capsule) => capsule.createdBy === myId)
  const theirs = capsules.filter((capsule) => capsule.createdBy !== myId)

  function openNew() {
    setFormError(null)
    setEditor({ capsule: null })
  }

  function openEdit(capsule: Capsule) {
    setFormError(null)
    setEditor({ capsule })
  }

  function closeEditor() {
    setEditor(null)
    setFormError(null)
  }

  async function handleSave(input: CapsuleInput) {
    if (!editor) return
    setSaving(true)
    setFormError(null)
    try {
      if (editor.capsule) await updateCapsule(editor.capsule.id, input)
      else await createCapsule(input)
      setEditor(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const deleted = capsules.find((capsule) => capsule.id === id) ?? null
    setSaving(true)
    setFormError(null)
    try {
      await deleteCapsule(id)
      setEditor(null)
      if (deleted) {
        showToast({
          message: 'Capsula eliminata.',
          action: { label: 'Annulla', onAction: () => void restoreCapsule(deleted) },
        })
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Errore durante l'eliminazione.")
    } finally {
      setSaving(false)
    }
  }

  function renderMine(capsule: Capsule) {
    const open = capsule.opensAt <= todayKey
    return (
      <li key={capsule.id}>
        <button type="button" onClick={() => openEdit(capsule)} className="w-full">
          <Card interactive className="w-full text-left">
            <span className="block truncate text-sm font-semibold text-ink">
              {capsule.title.trim() || 'Senza titolo'}
            </span>
            <span className="mt-0.5 block text-xs text-ink-muted">
              {statusLabel(capsule, todayKey)}
            </span>
            {capsule.body.trim() && (
              <span
                className={`mt-2 block text-sm ${
                  open ? 'text-ink-soft' : 'text-ink-muted italic'
                }`}
              >
                {capsule.body}
              </span>
            )}
          </Card>
        </button>
      </li>
    )
  }

  function renderTheirs(capsule: Capsule) {
    return (
      <li key={capsule.id}>
        <Card className="ring-sage-300 dark:ring-sage-700">
          <span className="block truncate text-sm font-semibold text-ink">
            {capsule.title.trim() || 'Senza titolo'}
          </span>
          <span className="mt-0.5 block text-xs text-sage-700 dark:text-sage-300">
            Aperta il {formatDateIt(capsule.opensAt)}
          </span>
          {capsule.body.trim() && (
            <span className="mt-2 block whitespace-pre-wrap text-sm text-ink-soft">
              {capsule.body}
            </span>
          )}
        </Card>
      </li>
    )
  }

  return (
    <div className="space-y-5 pt-2">
      <PageHeader
        title="Capsule del tempo"
        description="Scrivi oggi, leggi il giorno scelto: il partner non può aprirla prima."
        backTo="/us"
        backLabel="Torna a Noi"
        action={
          <Button size="sm" onClick={openNew}>
            <PlusIcon className="h-4 w-4" /> Capsula
          </Button>
        }
      />

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <CardListSkeleton rows={3} />
      ) : mine.length === 0 && theirs.length === 0 ? (
        <EmptyState
          illustration={<NestIllustration className="h-14 w-14 text-accent-glyph" />}
          title="Nessuna capsula"
          description="Scrivete qualcosa oggi e scegliete il giorno in cui l'altro lo leggerà."
          action={
            <Button
              size="sm"
              onClick={openNew}
            >
              Scrivi la prima capsula
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Le tue capsule
            </h2>
            {mine.length === 0 ? (
              <EmptyState
                title="Nessuna capsula tua"
                description="Sigilla la prima: il testo resta chiuso fino alla data scelta."
              />
            ) : (
              <ul className="grid grid-cols-1 items-start gap-2.5 sm:grid-cols-2">{mine.map((capsule) => renderMine(capsule))}</ul>
            )}
          </section>

          {theirs.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Capsule aperte del partner
              </h2>
              <ul className="grid grid-cols-1 items-start gap-2.5 sm:grid-cols-2">{theirs.map((capsule) => renderTheirs(capsule))}</ul>
            </section>
          )}
        </div>
      )}

      {editor && (
        <CapsuleEditor
          key={editor.capsule?.id ?? 'new'}
          capsule={editor.capsule}
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
