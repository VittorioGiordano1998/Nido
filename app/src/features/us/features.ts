import type { ComponentType } from 'react'

import {
  CameraIcon,
  CardIcon,
  ChatIcon,
  ChecklistIcon,
  CoinIcon,
  CompassIcon,
  DiceIcon,
  GiftIcon,
  HourglassIcon,
  InfoIcon,
  SplitIcon,
} from '../../ui/icons'

/**
 * The catalog of the "Noi" features: one entry per sub-page, grouped by
 * theme. The hub renders it and the global search offers it as destinations.
 */

export type UsGroupKey = 'rituals' | 'memories' | 'practical'

export interface UsFeature {
  to: string
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  group: UsGroupKey
}

export const US_GROUPS: ReadonlyArray<{
  key: UsGroupKey
  title: string
  description: string
  tone: 'accent' | 'sage' | 'honey'
}> = [
  {
    key: 'rituals',
    title: 'Rituali',
    description: 'Piccole abitudini da fare in due.',
    tone: 'accent',
  },
  {
    key: 'memories',
    title: 'Ricordi e sogni',
    description: 'Quello che avete vissuto e quello che verrà.',
    tone: 'sage',
  },
  {
    key: 'practical',
    title: 'Pratico',
    description: 'Le cose utili, sempre a portata di mano.',
    tone: 'honey',
  },
]

export const US_FEATURES: readonly UsFeature[] = [
  {
    to: '/us/question',
    title: 'Domanda del giorno',
    description: 'Risposte segrete, rivelate insieme.',
    icon: ChatIcon,
    group: 'rituals',
  },
  {
    to: '/us/plan',
    title: 'Piano settimanale',
    description: 'Una proposta a settimana.',
    icon: CompassIcon,
    group: 'rituals',
  },
  {
    to: '/us/pick',
    title: 'Scegli per noi',
    description: 'Quando non sapete decidere.',
    icon: DiceIcon,
    group: 'rituals',
  },
  {
    to: '/us/decisions',
    title: 'Decisioni alla cieca',
    description: 'Votate di nascosto, poi si svela.',
    icon: SplitIcon,
    group: 'rituals',
  },
  {
    to: '/us/memories',
    title: 'Ricordi',
    description: 'Il diario fotografico della coppia.',
    icon: CameraIcon,
    group: 'memories',
  },
  {
    to: '/us/bucket',
    title: 'Bucket list',
    description: 'Le cose da fare insieme.',
    icon: ChecklistIcon,
    group: 'memories',
  },
  {
    to: '/us/capsules',
    title: 'Capsule del tempo',
    description: 'Note che si aprono il giorno scelto.',
    icon: HourglassIcon,
    group: 'memories',
  },
  {
    to: '/us/wishlist',
    title: 'Wishlist',
    description: 'Desideri e radar delle occasioni.',
    icon: GiftIcon,
    group: 'memories',
  },
  {
    to: '/us/savings',
    title: 'Risparmi',
    description: 'Obiettivi di coppia che crescono.',
    icon: CoinIcon,
    group: 'practical',
  },
  {
    to: '/us/loyalty',
    title: 'Tessere',
    description: 'Le tessere dei negozi, al banco.',
    icon: CardIcon,
    group: 'practical',
  },
  {
    to: '/us/facts',
    title: "Cosa c'è da sapere",
    description: 'Taglie, gusti, allergie.',
    icon: InfoIcon,
    group: 'practical',
  },
]

/** Shown on top before this device has any usage to rank by. */
export const DEFAULT_FEATURED: readonly string[] = ['/us/question', '/us/memories', '/us/bucket']
