import { useMemo, useState } from 'react'

import { CardListSkeleton } from '../../ui/Skeleton'
import { Button, Card, EmptyState, ErrorBanner, Field, TextInput } from '../../ui/components'
import { Sheet } from '../../ui/Sheet'
import { PlusIcon, TrashIcon } from '../../ui/icons'
import { PageHeader } from '../../ui/PageHeader'
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
    <Sheet title={fact ? 'Modifica scheda' : 'Nuova scheda'} onClose={onClose}>
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
                  className="rounded-full bg-surface-soft px-2.5 py-1 text-xs font-semibold text-ink-soft transition hover:bg-accent-100 hover:text-accent-ink"
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
              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
            >
              <TrashIcon className="h-4 w-4" /> Elimina
            </Button>
          )}
        </div>
      </div>
    </Sheet>
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
        ? 'bg-accent-600 text-white ring-accent-600'
        : 'bg-surface text-ink-soft ring-line hover:bg-surface-soft'
    }`
  }

  return (
    <div className="space-y-5 pt-2">
      <PageHeader
        title="Cosa c'è da sapere"
        description="Le cose utili da ricordare, senza doverle chiedere."
        backTo="/us"
        backLabel="Torna a Noi"
        action={
          <Button
            size="sm"
            onClick={() => {
              setFormError(null)
              setEditor({ fact: null, subjectId: activeSubject })
            }}
            disabled={!activeSubject}
          >
            <PlusIcon className="h-4 w-4" /> Scheda
          </Button>
        }
      />

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
        <CardListSkeleton rows={3} />
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
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {category}
              </h2>
              <ul className="grid grid-cols-1 items-start gap-2.5 sm:grid-cols-2">
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
                      <Card interactive className="flex items-center justify-between gap-3 text-left">
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold uppercase tracking-wide text-ink-faint">
                            {fact.label}
                          </span>
                          <span className="block truncate text-sm font-semibold text-ink">
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
