import { Link } from 'react-router-dom'

import { Card } from '../../ui/components'
import { ChevronRightIcon, HeartIcon } from '../../ui/icons'

const FEATURES = [
  {
    to: '/us/question',
    title: 'Domanda del giorno',
    description: 'Rispondete in segreto e scoprite le risposte insieme.',
    ready: true,
  },
  {
    to: '/us/facts',
    title: "Cosa c'è da sapere",
    description: 'Taglie, gusti, allergie: le cose utili a portata di mano.',
    ready: true,
  },
  {
    to: '/us/capsules',
    title: 'Capsule del tempo',
    description: 'Note che si aprono il giorno che scegliete voi.',
    ready: true,
  },
  {
    to: '/us/decisions',
    title: 'Decisioni alla cieca',
    description: 'Votate di nascosto, poi la scelta si svela.',
    ready: false,
  },
  {
    to: '/us/wishlist',
    title: 'Wishlist',
    description: 'I desideri di ognuno, con il radar regali in arrivo.',
    ready: false,
  },
  {
    to: '/us/plan',
    title: 'Piano settimanale',
    description: 'Una proposta a settimana da fare insieme.',
    ready: false,
  },
  {
    to: '/us/nudges',
    title: 'Promemoria al partner',
    description: 'Un tocco per ricordargli qualcosa.',
    ready: false,
  },
] as const

export function UsPage() {
  return (
    <div className="space-y-5 pt-2">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-stone-900">Noi</h1>
        <p className="text-sm text-stone-500">
          Piccoli rituali quotidiani da fare in due.
        </p>
      </header>

      <ul className="space-y-2">
        {FEATURES.map((feature) =>
          feature.ready ? (
            <li key={feature.to}>
              <Link to={feature.to} className="block">
                <Card className="flex items-center justify-between gap-3 transition hover:ring-clay-300">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-stone-800">
                      {feature.title}
                    </span>
                    <span className="block text-xs text-stone-500">{feature.description}</span>
                  </span>
                  <ChevronRightIcon className="h-5 w-5 shrink-0 text-stone-400" />
                </Card>
              </Link>
            </li>
          ) : (
            <li key={feature.to}>
              <Card className="flex items-center justify-between gap-3 bg-white/60">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-stone-500">
                    {feature.title}
                  </span>
                  <span className="block text-xs text-stone-400">{feature.description}</span>
                </span>
                <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  presto
                </span>
              </Card>
            </li>
          ),
        )}
      </ul>

      <Card className="flex items-center gap-4 bg-clay-50 ring-clay-200">
        <HeartIcon className="h-8 w-8 shrink-0 text-clay-500" />
        <p className="text-xs text-stone-500">
          Le sezioni si accendono con calma, una alla volta: quando una è pronta compare qui.
        </p>
      </Card>
    </div>
  )
}
