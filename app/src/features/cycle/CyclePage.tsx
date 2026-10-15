import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  addMonths,
  formatDateIt,
  formatMonthYearIt,
  monthCells,
  startOfMonth,
  toDateKey,
} from '../../core/dates'
import { Button, Card, ErrorBanner, Select, Spinner, TextInput } from '../../ui/components'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon } from '../../ui/icons'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'
import { CycleLogEditor } from './CycleLogEditor'
import { useCycle } from './useCycle'
import type { CycleLogInput, ShareLevel } from './useCycle'

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'] as const

const LEVEL_LABEL: Record<ShareLevel, string> = {
  summary: 'Riepilogo',
  dates_only: 'Solo date',
}

export function CyclePage() {
  const { session } = useAuth()
  const { couple } = useCouple()
  const {
    consentAt,
    consentLoading,
    logs,
    shares,
    loading,
    error,
    setConsent,
    saveLog,
    deleteLog,
    sharePeriod,
    deleteShare,
  } = useCycle()

  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedKey, setSelectedKey] = useState(() => toDateKey(new Date()))
  const [editorOpen, setEditorOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [consentBusy, setConsentBusy] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareStart, setShareStart] = useState('')
  const [shareEnd, setShareEnd] = useState('')
  const [shareLevel, setShareLevel] = useState<ShareLevel>('summary')

  const myId = session?.user.id
  const [todayKey] = useState(() => toDateKey(new Date()))
  const cells = useMemo(() => monthCells(month), [month])
  const byDay = useMemo(() => {
    const map = new Map<string, (typeof logs)[number]>()
    for (const log of logs) map.set(log.logDate, log)
    return map
  }, [logs])

  const selectedLog = byDay.get(selectedKey) ?? null

  function nameOf(userId: string): string {
    return couple?.members.find((member) => member.userId === userId)?.displayName ?? '—'
  }

  async function handleConsent() {
    setConsentBusy(true)
    setFormError(null)
    try {
      await setConsent(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setConsentBusy(false)
    }
  }

  async function handleRevoke() {
    if (
      !window.confirm(
        'Disattivare il diario? I segni restano salvati e li ritrovi riattivandolo.',
      )
    ) {
      return
    }
    setConsentBusy(true)
    setFormError(null)
    try {
      await setConsent(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setConsentBusy(false)
    }
  }

  async function handleSave(input: CycleLogInput) {
    setSaving(true)
    setFormError(null)
    try {
      await saveLog(selectedKey, input)
      setEditorOpen(false)
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
      await deleteLog(id)
      setEditorOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Errore durante l'eliminazione.")
    } finally {
      setSaving(false)
    }
  }

  async function handleShare() {
    if (!shareStart) {
      setFormError('Serve la data di inizio.')
      return
    }
    if (shareEnd && shareEnd < shareStart) {
      setFormError('La fine è prima dell’inizio.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      await sharePeriod(shareStart, shareEnd || null, shareLevel)
      setShareStart('')
      setShareEnd('')
      setShareLevel('summary')
      setShareOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteShare(id: string) {
    if (!window.confirm('Rimuovere questo riepilogo condiviso?')) return
    setFormError(null)
    try {
      await deleteShare(id)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Errore durante l'eliminazione.")
    }
  }

  if (consentLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    )
  }

  if (consentAt === null) {
    return (
      <div className="space-y-5 pt-2">
        <header className="flex items-start gap-2">
          <Link
            to="/profile"
            aria-label="Torna al Profilo"
            className="mt-0.5 rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-soft"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-ink">Ciclo</h1>
            <p className="text-sm text-ink-muted">Un diario personale, con riepiloghi
              condivisibili quando vuoi.</p>
          </div>
        </header>

        {formError && <ErrorBanner message={formError} />}

        <Card className="space-y-3">
          <p className="text-sm font-semibold text-ink">Questo diario è solo tuo</p>
          <p className="text-xs text-ink-muted">
            I segni del ciclo sono dati personali e restano visibili solo a te: il partner vede
            soltanto i riepiloghi che scegli di condividere. Attivandolo acconsenti a salvarli su
            questo account.
          </p>
          <Button onClick={() => void handleConsent()} loading={consentBusy} className="w-full">
            Attiva il diario
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5 pt-2">
      <header className="flex items-start gap-2">
        <Link
          to="/profile"
          aria-label="Torna al Profilo"
          className="mt-0.5 rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-soft"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-ink">Ciclo</h1>
          <p className="text-sm text-ink-muted">
            Solo tuo; al partner arrivano soltanto i riepiloghi che condividi.
          </p>
        </div>
      </header>

      {error && <ErrorBanner message={error} />}
      {formError && <ErrorBanner message={formError} />}

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Mese precedente"
            onClick={() => setMonth((current) => addMonths(current, -1))}
            className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-soft hover:text-ink"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-semibold capitalize text-ink">
            {formatMonthYearIt(month)}
          </h2>
          <button
            type="button"
            aria-label="Mese successivo"
            onClick={() => setMonth((current) => addMonths(current, 1))}
            className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-soft hover:text-ink"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
          {WEEKDAYS.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const logged = byDay.has(cell.key)
            const isSelected = cell.key === selectedKey
            const isToday = cell.key === todayKey
            return (
              <button
                key={cell.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedKey(cell.key)}
                className={`flex flex-col items-center rounded-xl py-1.5 text-sm font-medium transition ${
                  isSelected
                    ? 'bg-accent-600 text-white'
                    : isToday
                      ? 'bg-accent-100 text-accent-ink hover:bg-accent-200'
                      : cell.inMonth
                        ? 'text-ink-soft hover:bg-surface-soft'
                        : 'text-ink-faint hover:bg-surface-soft'
                }`}
              >
                <span>{cell.date.getDate()}</span>
                <span
                  className={`mt-0.5 h-1 w-1 rounded-full ${
                    logged ? (isSelected ? 'bg-white' : 'bg-accent-500') : 'bg-transparent'
                  }`}
                />
              </button>
            )
          })}
        </div>
      </Card>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          {formatDateIt(selectedKey)}
        </h2>

        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : selectedLog ? (
          <Card className="space-y-2">
            <p className="text-sm text-ink-soft">
              {selectedLog.flow !== null ? `Flusso ${selectedLog.flow}/5` : 'Flusso —'}
              {selectedLog.mood !== null ? ` · Umore ${selectedLog.mood}/5` : ''}
            </p>
            {selectedLog.symptoms.length > 0 && (
              <p className="text-xs text-ink-muted">{selectedLog.symptoms.join(' · ')}</p>
            )}
            {selectedLog.notes && <p className="text-xs text-ink-muted">{selectedLog.notes}</p>}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setFormError(null)
                  setEditorOpen(true)
                }}
              >
                Modifica
              </Button>
              <Button
                variant="ghost"
                onClick={() => void handleDelete(selectedLog.id)}
                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
              >
                <TrashIcon className="h-4 w-4" /> Elimina
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="flex items-center justify-between gap-3">
            <p className="text-xs text-ink-muted">Nessun segno per questo giorno.</p>
            <button
              type="button"
              onClick={() => {
                setFormError(null)
                setEditorOpen(true)
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-accent-700"
            >
              <PlusIcon className="h-4 w-4" /> Aggiungi
            </button>
          </Card>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Riepiloghi condivisi
        </h2>

        {shares.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line-strong bg-surface/60 px-4 py-4 text-center text-xs text-ink-faint">
            Nessun riepilogo condiviso.
          </p>
        ) : (
          <ul className="space-y-2">
            {shares.map((share) => (
              <li key={share.id}>
                <Card className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {share.periodEnd
                        ? `${formatDateIt(share.periodStart)} → ${formatDateIt(share.periodEnd)}`
                        : `Dal ${formatDateIt(share.periodStart)}`}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {share.userId === myId ? 'Tu' : nameOf(share.userId)} ·{' '}
                      {LEVEL_LABEL[share.shareLevel]}
                    </p>
                  </div>
                  {share.userId === myId && (
                    <button
                      type="button"
                      aria-label="Rimuovi il riepilogo"
                      onClick={() => void handleDeleteShare(share.id)}
                      className="rounded-lg p-1.5 text-ink-faint transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/60 dark:hover:text-red-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}

        {shareOpen ? (
          <Card className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <TextInput
                type="date"
                value={shareStart}
                onChange={(changeEvent) => setShareStart(changeEvent.target.value)}
                aria-label="Inizio periodo"
              />
              <TextInput
                type="date"
                value={shareEnd}
                onChange={(changeEvent) => setShareEnd(changeEvent.target.value)}
                aria-label="Fine periodo (facoltativa)"
              />
            </div>
            <Select
              value={shareLevel}
              onChange={(changeEvent) => setShareLevel(changeEvent.target.value as ShareLevel)}
            >
              <option value="summary">Riepilogo</option>
              <option value="dates_only">Solo date</option>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                disabled={saving}
                onClick={() => setShareOpen(false)}
              >
                Annulla
              </Button>
              <Button
                className="flex-1"
                loading={saving}
                disabled={!shareStart}
                onClick={() => void handleShare()}
              >
                Condividi
              </Button>
            </div>
          </Card>
        ) : (
          <Button variant="secondary" className="w-full" onClick={() => setShareOpen(true)}>
            Condividi un riepilogo
          </Button>
        )}
      </section>

      <button
        type="button"
        onClick={() => void handleRevoke()}
        disabled={consentBusy}
        className="w-full pb-2 text-center text-xs text-ink-faint transition hover:text-ink-soft disabled:opacity-50"
      >
        Disattiva il diario
      </button>

      {editorOpen && (
        <CycleLogEditor
          key={selectedKey}
          dateKey={selectedKey}
          log={selectedLog}
          saving={saving}
          error={formError}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  )
}
