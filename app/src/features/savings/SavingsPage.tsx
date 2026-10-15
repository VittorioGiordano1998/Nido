import { useState } from 'react'
import { Link } from 'react-router-dom'

import { formatDateIt } from '../../core/dates'
import { Card, EmptyState, ErrorBanner, Spinner } from '../../ui/components'
import { ChevronLeftIcon, PlusIcon } from '../../ui/icons'
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
  const { projects, loading, error, createProject, updateProject, deleteProject } = useSavings()

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
    setSaving(true)
    setFormError(null)
    try {
      await deleteProject(id)
      setEditor(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Errore durante l'eliminazione.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 pt-2">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Link
            to="/us"
            aria-label="Torna a Noi"
            className="mt-0.5 rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-soft"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-ink">Risparmi</h1>
            <p className="text-sm text-ink-muted">
              Gli obiettivi di coppia, un po' alla volta.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError(null)
            setEditor({ project: null })
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
        >
          <PlusIcon className="h-4 w-4" /> Nuovo
        </button>
      </header>

      {error && <ErrorBanner message={error} />}
      {formError && <ErrorBanner message={formError} />}

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="Nessun progetto"
          description="Crea il primo obiettivo: una cifra, una data e la barra che cresce insieme."
        />
      ) : (
        <ul className="space-y-2">
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
                  <Card className="space-y-2 transition hover:ring-accent-300">
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
