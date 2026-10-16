import { Link } from 'react-router-dom'

import { Card } from '../../ui/components'
import {
  CameraIcon,
  CardIcon,
  ChatIcon,
  ChecklistIcon,
  ChevronRightIcon,
  CoinIcon,
  CompassIcon,
  DiceIcon,
  GiftIcon,
  HeartIcon,
  HourglassIcon,
  InfoIcon,
  SplitIcon,
} from '../../ui/icons'
import { NudgeCard } from '../nudges/NudgeCard'

const TINTS = [
  'bg-accent-100 text-accent-ink dark:bg-accent-100 dark:text-accent-ink',
  'bg-sage-100 text-sage-700 dark:bg-sage-700/30 dark:text-sage-300',
  'bg-surface-muted text-ink-soft',
]

const FEATURES = [
  {
    to: '/us/question',
    title: 'Domanda del giorno',
    description: 'Risposte segrete, rivelate insieme.',
    icon: ChatIcon,
  },
  {
    to: '/us/memories',
    title: 'Ricordi',
    description: 'Il diario fotografico della coppia.',
    icon: CameraIcon,
  },
  {
    to: '/us/bucket',
    title: 'Bucket list',
    description: 'Le cose da fare insieme.',
    icon: ChecklistIcon,
  },
  {
    to: '/us/pick',
    title: 'Scegli per noi',
    description: 'Quando non sapete decidere.',
    icon: DiceIcon,
  },
  {
    to: '/us/decisions',
    title: 'Decisioni alla cieca',
    description: 'Votate di nascosto, poi si svela.',
    icon: SplitIcon,
  },
  {
    to: '/us/wishlist',
    title: 'Wishlist',
    description: 'Desideri e radar delle occasioni.',
    icon: GiftIcon,
  },
  {
    to: '/us/plan',
    title: 'Piano settimanale',
    description: 'Una proposta a settimana.',
    icon: CompassIcon,
  },
  {
    to: '/us/savings',
    title: 'Risparmi',
    description: 'Obiettivi di coppia che crescono.',
    icon: CoinIcon,
  },
  {
    to: '/us/loyalty',
    title: 'Tessere',
    description: 'Le tessere dei negozi, al banco.',
    icon: CardIcon,
  },
  {
    to: '/us/facts',
    title: "Cosa c'è da sapere",
    description: 'Taglie, gusti, allergie.',
    icon: InfoIcon,
  },
  {
    to: '/us/capsules',
    title: 'Capsule del tempo',
    description: 'Note che si aprono il giorno scelto.',
    icon: HourglassIcon,
  },
] as const

/** The "Noi" hub: one tinted icon tile per feature (TASK-UI-…-003). */
export function UsPage() {
  return (
    <div className="space-y-5 pt-2">
      <header className="space-y-1">
        <h1 className="text-balance text-2xl font-bold text-ink">Noi</h1>
        <p className="text-sm text-ink-muted">Piccoli rituali quotidiani da fare in due.</p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        {FEATURES.map((feature, index) => (
          <Link key={feature.to} to={feature.to} viewTransition className="block h-full">
            <Card className="flex h-full flex-col gap-2.5 transition hover:ring-accent-300">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  TINTS[index % TINTS.length]
                }`}
              >
                <feature.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">{feature.title}</span>
                <span className="mt-0.5 block text-xs text-ink-muted">{feature.description}</span>
              </span>
              <ChevronRightIcon className="h-4 w-4 self-end text-ink-faint" />
            </Card>
          </Link>
        ))}
      </div>

      <NudgeCard />

      <Card className="flex items-center gap-4 bg-accent-50 ring-accent-200">
        <HeartIcon className="h-8 w-8 shrink-0 text-accent-glyph" />
        <p className="text-xs text-ink-muted">
          Le sezioni si accendono con calma, una alla volta: quando una è pronta compare qui.
        </p>
      </Card>
    </div>
  )
}
