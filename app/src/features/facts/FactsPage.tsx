import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  Spinner,
  TextInput,
} from '../../ui/components'
import { ChevronLeftIcon, CloseIcon, PlusIcon, TrashIcon } from '../../ui/icons'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'
import { useFacts } from './useFacts'
import type { PartnerFact } from './useFacts'

const CATEGORY_SUGGESTIONS = ['Taglie', 'Gusti', 'Allergie', 'Altro'] as const

interface FactDraft {
  category: string
  label: string
  value: string
}

interface EditorState {
  fact: PartnerFact | null
  subjectId: string
}

function FactEditor({
  fact,
  saving,
  error,
  onSave,
  onDelete,
  onClose,
}: {
  fact: PartnerFact | null
  saving: boolean
  error: string | null
  onSave: (draft: FactDraft) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}) {
  const [category, setCategory] = useState(fact?.category ?? '')
  const [label, setLabel] = useState(fact?.label ?? '')
  const [value, setValue] = useState(fact?.value ?? '')
  const [validationError, setValidationError] = useState<string | null>(null)

  async function handleSubmit() {
    const trimmedLabel = label.trim()
    if (!trimmedLabel) {
      setValidationError('Serve una voce (es. "Scarpe").')
      return
    }
    setValidationError(null)
    await onSave({ category: category.trim(), label: trimmedLabel, value: value.trim() })
  }

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-30 flex items-end justify-center bg-stone-900/30 backdrop-blur-[2px] sm:items-center sm:p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={fact ? 'Modifica scheda' : 'Nuova scheda'}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-cream p-5 shadow-xl sm:rounded-3xl"
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">
            {fact ? 'Modifica scheda' : 'Nuova scheda'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4">
          <Field label="Voce">
            <TextInput
              autoFocus
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Es. Numero di scarpe"
            />
          </Field>
          <Field label="Valore">
            <TextInput
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Es. 42"
            />
          </Field>
          <Field label="Categoria">
            <div className="space-y-2">
              <TextInput
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Es. Taglie"
              />
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setCategory(suggestion)}
                    className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600 transition hover:bg-clay-100 hover:text-clay-700"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </Field>

          {validationError && <ErrorBanner message={validationError} />}
          {error && <ErrorBanner message={error} />}

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              loading={saving}
              onClick={() => void handleSubmit()}
              className="flex-1"
            >
              {fact ? 'Salva' : 'Aggiungi'}
            </Button>
            {fact && (
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                onClick={() => {
                  if (window.confirm('Eliminare questa scheda?')) void onDelete(fact.id)
                }}
                className="text-red-600 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4" /> Elimina
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function FactsPage() {
  const { session } = useAuth()
  const { couple } = useCouple()
  const { facts, loading, error, createFact, updateFact, deleteFact } = useFacts()

  const myId = session?.user.id
  const partner = couple?.members.find((member) => member.userId !== myId)
  const partnerName = partner?.displayName ?? 'partner'

  const [subjectTab, setSubjectTab] = useState<'partner' | 'me'>('partner')
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const activeSubject = (subjectTab === 'partner' ? partner?.userId : myId) ?? ''
  const visibleFacts = facts.filter((fact) => fact.subjectId === activeSubject)

  const groups = useMemo(() => {
    const map = new Map<string, PartnerFact[]>()
    for (const fact of visibleFacts) {
      const key = fact.category?.trim() || 'Senza categoria'
      const list = map.get(key) ?? []
      list.push(fact)
      map.set(key, list)
    }
    return [...map.entries()]
  }, [visibleFacts])

  function closeEditor() {
    setEditor(null)
    setFormError(null)
  }

  async function handleSave(draft: FactDraft) {
    if (!editor) return
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        category: draft.category || null,
        label: draft.label,
        value: draft.value || null,
      }
      if (editor.fact) await updateFact(editor.fact.id, payload)
      else await createFact({ subjectId: editor.subjectId, ...payload })
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
      await deleteFact(id)
      setEditor(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Errore durante l'eliminazione.")
    } finally {
      setSaving(false)
    }
  }

  function tabClass(active: boolean): string {
    return `rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition ${
      active
        ? 'bg-clay-600 text-white ring-clay-600'
        : 'bg-white text-stone-700 ring-stone-200 hover:bg-stone-50'
    }`
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
            <h1 className="text-2xl font-bold text-stone-900">Cosa c'è da sapere</h1>
            <p className="text-sm text-stone-500">
              Le cose utili da ricordare, senza doverle chiedere.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError(null)
            setEditor({ fact: null, subjectId: activeSubject })
          }}
          disabled={!activeSubject}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-clay-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-clay-700 disabled:cursor-not-allowed disabled:bg-clay-300"
        >
          <PlusIcon className="h-4 w-4" /> Scheda
        </button>
      </header>

      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setSubjectTab('partner')}
          className={tabClass(subjectTab === 'partner')}
        >
          Su {partnerName}
        </button>
        <button
          type="button"
          onClick={() => setSubjectTab('me')}
          className={tabClass(subjectTab === 'me')}
        >
          Su di me
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          title="Nessuna scheda"
          description={
            subjectTab === 'partner'
              ? `Aggiungi quello che sai di ${partnerName}: taglie, gusti, allergie…`
              : 'Anche il partner può compilare le tue, o puoi farlo tu.'
          }
        />
      ) : (
        <div className="space-y-4">
          {groups.map(([category, factsInGroup]) => (
            <section key={category} className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                {category}
              </h2>
              <ul className="space-y-2">
                {factsInGroup.map((fact) => (
                  <li key={fact.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setFormError(null)
                        setEditor({ fact, subjectId: fact.subjectId })
                      }}
                      className="w-full"
                    >
                      <Card className="flex items-center justify-between gap-3 text-left transition hover:ring-clay-300">
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold uppercase tracking-wide text-stone-400">
                            {fact.label}
                          </span>
                          <span className="block truncate text-sm font-semibold text-stone-800">
                            {fact.value || '—'}
                          </span>
                        </span>
                      </Card>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {editor && (
        <FactEditor
          key={editor.fact?.id ?? 'new'}
          fact={editor.fact}
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
