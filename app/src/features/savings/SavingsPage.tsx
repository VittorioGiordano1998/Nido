import { useState } from 'react'

import { CardListSkeleton } from '../../ui/Skeleton'
import { formatDateIt } from '../../core/dates'
import { Button, Card, EmptyState, ErrorBanner } from '../../ui/components'
import { PlusIcon } from '../../ui/icons'
import { SparkleIllustration } from '../../ui/illustrations'
import { useToast } from '../../ui/toast'
import { PageHeader } from '../../ui/PageHeader'
import { SavingsEditor } from './SavingsEditor'
import { useSavings } from './useSavings'
import type { SavingsInput, SavingsProject } from './useSavings'

function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

function progressPercent(project: SavingsProject): number {
  if (project.targetAmount <= 0) return 0
  return Math.min(100, Math.round((project.currentAmount / project.targetAmount) * 100))
}

export function SavingsPage() {
  const { projects, loading, error, createProject, updateProject, deleteProject, restoreProject } =
    useSavings()
  const { showToast } = useToast()

  const [editor, setEditor] = useState<{ project: SavingsProject | null } | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSave(input: SavingsInput) {
    if (!editor) return
    setSaving(true)
    setFormError(null)
    try {
      if (editor.project) await updateProject(editor.project.id, input)
      else await createProject(input)
      setEditor(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const deleted = projects.find((project) => project.id === id) ?? null
    setSaving(true)
    setFormError(null)
    try {
      await deleteProject(id)
      setEditor(null)
      if (deleted) {
        showToast({
          message: 'Progetto eliminato.',
          action: { label: 'Annulla', onAction: () => void restoreProject(deleted) },
        })
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Errore durante l'eliminazione.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 pt-2">
      <PageHeader
        title="Risparmi"
        description="Gli obiettivi di coppia, un po' alla volta."
        backTo="/us"
        backLabel="Torna a Noi"
        action={
          <Button
            size="sm"
            onClick={() => {
              setFormError(null)
              setEditor({ project: null })
            }}
          >
            <PlusIcon className="h-4 w-4" /> Nuovo
          </Button>
        }
      />

      {error && <ErrorBanner message={error} />}
      {formError && <ErrorBanner message={formError} />}

      {loading ? (
        <CardListSkeleton rows={2} />
      ) : projects.length === 0 ? (
        <EmptyState
          illustration={<SparkleIllustration className="h-14 w-14 text-accent-glyph" />}
          title="Nessun progetto"
          description="Crea il primo obiettivo: una cifra, una data e la barra che cresce insieme."
          action={
            <Button
              size="sm"
              onClick={() => {
                setFormError(null)
                setEditor({ project: null })
              }}
            >
              Crea il primo obiettivo
            </Button>
          }
        />
      ) : (
        <ul className="stagger grid grid-cols-1 items-start gap-2.5 sm:grid-cols-2">
          {projects.map((project) => {
            const percent = progressPercent(project)
            const done = project.currentAmount >= project.targetAmount
            return (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={() => {
                    setFormError(null)
                    setEditor({ project })
                  }}
                  className="w-full text-left"
                >
                  <Card interactive className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{project.title}</p>
                        <p className="text-xs text-ink-muted">
                          {formatPrice(project.currentAmount, project.currency)} di{' '}
                          {formatPrice(project.targetAmount, project.currency)}
                          {project.deadline ? ` · entro ${formatDateIt(project.deadline)}` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-accent-100 px-2.5 py-1 text-[11px] font-semibold text-accent-ink">
                        {percent}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-soft">
                      <div
                        className={`h-full rounded-full ${done ? 'bg-sage-500' : 'bg-accent-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    {done && (
                      <p className="text-xs font-semibold text-sage-700 dark:text-sage-300">
                        Obiettivo raggiunto 🎉
                      </p>
                    )}
                  </Card>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {editor && (
        <SavingsEditor
          key={editor.project?.id ?? 'new'}
          project={editor.project}
          saving={saving}
          error={formError}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  )
}
