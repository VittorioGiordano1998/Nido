import { useState } from 'react'
import { Link } from 'react-router-dom'

import { formatDateIt, fromDateKey, toDateKey } from '../../core/dates'
import { Card, EmptyState, ErrorBanner, Spinner } from '../../ui/components'
import { ChevronLeftIcon, PlusIcon } from '../../ui/icons'
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
  const { capsules, loading, error, createCapsule, updateCapsule, deleteCapsule } = useCapsules()
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
    setSaving(true)
    setFormError(null)
    try {
      await deleteCapsule(id)
      setEditor(null)
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
          <Card className="w-full text-left transition hover:ring-clay-300">
            <span className="block truncate text-sm font-semibold text-stone-800">
              {capsule.title.trim() || 'Senza titolo'}
            </span>
            <span className="mt-0.5 block text-xs text-stone-500">
              {statusLabel(capsule, todayKey)}
            </span>
            {capsule.body.trim() && (
              <span
                className={`mt-2 block text-sm ${
                  open ? 'text-stone-700' : 'text-stone-500 italic'
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
        <Card className="ring-sage-300">
          <span className="block truncate text-sm font-semibold text-stone-800">
            {capsule.title.trim() || 'Senza titolo'}
          </span>
          <span className="mt-0.5 block text-xs text-sage-700">
            Aperta il {formatDateIt(capsule.opensAt)}
          </span>
          {capsule.body.trim() && (
            <span className="mt-2 block whitespace-pre-wrap text-sm text-stone-700">
              {capsule.body}
            </span>
          )}
        </Card>
      </li>
    )
  }

  return (
    <div className="space-y-5 pt-2">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Link
            to="/us"
            aria-label="Torna a Noi"
            className="mt-0.5 rounded-lg p-1.5 text-stone-500 transition hover:bg-stone-100"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-stone-900">Capsule del tempo</h1>
            <p className="text-sm text-stone-500">
              Scrivi oggi, leggi il giorno scelto: il partner non può aprirla prima.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-clay-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-clay-700"
        >
          <PlusIcon className="h-4 w-4" /> Capsula
        </button>
      </header>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : mine.length === 0 && theirs.length === 0 ? (
        <EmptyState
          title="Nessuna capsula"
          description="Scrivete qualcosa oggi e scegliete il giorno in cui l'altro lo leggerà."
        />
      ) : (
        <div className="space-y-4">
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              Le tue capsule
            </h2>
            {mine.length === 0 ? (
              <EmptyState
                title="Nessuna capsula tua"
                description="Sigilla la prima: il testo resta chiuso fino alla data scelta."
              />
            ) : (
              <ul className="space-y-2">{mine.map((capsule) => renderMine(capsule))}</ul>
            )}
          </section>

          {theirs.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Capsule aperte del partner
              </h2>
              <ul className="space-y-2">{theirs.map((capsule) => renderTheirs(capsule))}</ul>
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
