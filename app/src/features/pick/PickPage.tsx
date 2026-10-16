import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button, Card, EmptyState } from '../../ui/components'
import { SparkleIllustration } from '../../ui/illustrations'
import { ChevronLeftIcon } from '../../ui/icons'
import { useCouple } from '../coupling/CoupleProvider'
import { useLists } from '../lists/useLists'
import { useWeekPlan } from '../weekplan/useWeekPlan'
import { useWishlist } from '../wishlist/useWishlist'

type PoolKey = 'lists' | 'wishlist' | 'plans' | 'couple'

interface Candidate {
  label: string
  hint?: string
}

const POOLS: Array<{ key: PoolKey; label: string; empty: string; to: string }> = [
  { key: 'lists', label: 'Liste', empty: 'Nessuna attività aperta nelle liste.', to: '/lists' },
  { key: 'wishlist', label: 'Wishlist', empty: 'Nessun desiderio in attesa.', to: '/us/wishlist' },
  { key: 'plans', label: 'Piani', empty: 'Nessun piano proposto finora.', to: '/us/plan' },
  { key: 'couple', label: 'Noi due', empty: '', to: '/us' },
]

const DRAW_MS = 1100
const CYCLE_MS = 90

/**
 * Scegli per noi (TASK-PICK-…-001): an indecision breaker — draws at random
 * from lists, wishlist, weekly plans or the two of you. Pure client: reads
 * the existing hooks, writes nothing.
 */
export function PickPage() {
  const { couple } = useCouple()
  const { lists, tasks } = useLists()
  const { items: wishes } = useWishlist()
  const { plans } = useWeekPlan()

  const [pool, setPool] = useState<PoolKey>('lists')
  const [drawing, setDrawing] = useState(false)
  const [shown, setShown] = useState<string | null>(null)
  const [winner, setWinner] = useState<Candidate | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending) {
        window.clearInterval(timer)
        window.clearTimeout(timer)
      }
    }
  }, [])

  const candidatesByPool = useMemo<Record<PoolKey, Candidate[]>>(() => {
    const listTitle = new Map(lists.map((entry) => [entry.id, entry.title]))
    const memberName = (id: string) =>
      couple?.members.find((member) => member.userId === id)?.displayName ?? '—'
    return {
      lists: tasks
        .filter((task) => !task.done)
        .map((task) => ({ label: task.title, hint: listTitle.get(task.listId) })),
      wishlist: wishes
        .filter((wish) => !wish.purchased)
        .map((wish) => ({ label: wish.title, hint: `desiderio di ${memberName(wish.ownerId)}` })),
      plans: plans.map((plan) => ({
        label: plan.proposal,
        hint: plan.status === 'accepted' ? 'piano accettato' : 'proposta',
      })),
      couple: (couple?.members ?? []).map((member) => ({
        label: member.displayName,
        hint: 'tocca a…',
      })),
    }
  }, [lists, tasks, wishes, plans, couple])

  const candidates = candidatesByPool[pool]

  function draw() {
    if (drawing || candidates.length === 0) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setWinner(null)
    setDrawing(true)

    function settle() {
      const pick = candidates[Math.floor(Math.random() * candidates.length)] ?? null
      setWinner(pick)
      setShown(pick?.label ?? null)
      setDrawing(false)
    }

    if (reduced || candidates.length === 1) {
      settle()
      return
    }

    const interval = window.setInterval(() => {
      setShown(candidates[Math.floor(Math.random() * candidates.length)]?.label ?? null)
    }, CYCLE_MS)
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval)
      settle()
    }, DRAW_MS)
    timers.current.push(interval, timeout)
  }

  const activePool = POOLS.find((entry) => entry.key === pool) ?? POOLS[0]

  return (
    <div className="space-y-5 pt-2">
      <header className="flex items-start gap-2">
        <Link
          to="/us"
          aria-label="Torna a Noi"
          viewTransition
          className="mt-0.5 rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-soft"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <div className="space-y-1">
          <h1 className="text-balance text-2xl font-bold text-ink">Scegli per noi</h1>
          <p className="text-sm text-ink-muted">
            Quando non sapete decidere, decide la sorte: cosa guardare, cosa mangiare, chi tocca.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Da dove estrarre">
        {POOLS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            aria-pressed={pool === entry.key}
            onClick={() => {
              setPool(entry.key)
              setWinner(null)
              setShown(null)
            }}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              pool === entry.key
                ? 'bg-accent-600 text-white'
                : 'bg-surface text-ink-muted ring-1 ring-line hover:text-ink'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {candidates.length === 0 ? (
        <EmptyState
          illustration={<SparkleIllustration className="h-14 w-14 text-accent-glyph" />}
          title="Non c'è niente da estrarre"
          description={activePool.empty}
          action={
            pool !== 'couple' ? (
              <Link
                to={activePool.to}
                viewTransition
                className="rounded-xl bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
              >
                Apri {activePool.label}
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card className="space-y-4 text-center">
          <div className="flex min-h-24 items-center justify-center px-2">
            <p
              className={`text-balance text-xl font-bold ${
                drawing ? 'text-ink-muted' : 'text-ink'
              } ${!shown ? 'text-ink-faint' : ''}`}
            >
              {shown ?? 'Premi «Estrai» e lascia decidere al caso.'}
            </p>
          </div>

          {winner && !drawing && (
            <p className="text-xs text-ink-muted">{winner.hint ?? 'Estratto per voi.'}</p>
          )}

          <Button type="button" onClick={draw} loading={drawing} className="w-full">
            {winner ? 'Ripeti' : 'Estrai'}
          </Button>
        </Card>
      )}

      <p className="text-center text-xs text-ink-faint">
        Un tocco di fortuna non sostituisce una decisione: se non convince, si ripete.
      </p>
    </div>
  )
}
