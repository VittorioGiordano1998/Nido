import { Link } from 'react-router-dom'

import { IconTile } from '../../ui/components'
import { ChevronRightIcon } from '../../ui/icons'
import { PageHeader, SectionHeader } from '../../ui/PageHeader'
import { NudgeCard } from '../nudges/NudgeCard'
import { US_FEATURES, US_GROUPS } from './features'
import type { UsFeature } from './features'
import { useHubUsage } from './useHubUsage'

const FEATURED_SURFACES = [
  'bg-gradient-to-br from-accent-200 via-accent-50 to-surface ring-accent-200',
  'bg-sage-soft ring-sage-ink/15',
  'bg-honey-soft ring-honey-ink/15',
] as const

const FEATURED_GLYPHS = ['text-accent-ink', 'text-sage-ink', 'text-honey-ink'] as const

/**
 * The "Noi" hub (TASK-US-…-001): the three features this device opens most on
 * top, then every feature grouped by theme.
 */
export function UsPage() {
  const { featured, recordOpen } = useHubUsage()
  const featuredFeatures = featured
    .map((route) => US_FEATURES.find((feature) => feature.to === route))
    .filter((feature): feature is UsFeature => feature !== undefined)

  return (
    <div className="space-y-7 pt-2">
      <PageHeader title="Noi" description="Piccoli rituali quotidiani da fare in due." />

      <section className="space-y-2.5">
        <SectionHeader title="In evidenza" />
        <div className="stagger grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {featuredFeatures.map((feature, index) => (
            <Link
              key={feature.to}
              to={feature.to}
              viewTransition
              onClick={() => recordOpen(feature.to)}
              className={`group relative flex items-center gap-3 overflow-hidden rounded-3xl p-4 shadow-card ring-1 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:min-h-36 sm:flex-col sm:items-start sm:justify-between ${
                FEATURED_SURFACES[index % FEATURED_SURFACES.length]
              }`}
            >
              <feature.icon
                className={`pointer-events-none absolute -bottom-5 -right-4 h-24 w-24 opacity-15 ${
                  FEATURED_GLYPHS[index % FEATURED_GLYPHS.length]
                }`}
              />
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface/75 ring-1 ring-line/40 ${
                  FEATURED_GLYPHS[index % FEATURED_GLYPHS.length]
                }`}
              >
                <feature.icon className="h-6 w-6" />
              </span>
              <span className="relative min-w-0">
                <span className="block font-display text-lg font-semibold leading-tight text-ink">
                  {feature.title}
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">{feature.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3 lg:gap-6">
        {US_GROUPS.map((group) => (
          <section key={group.key} className="space-y-2.5">
            <div>
              <SectionHeader title={group.title} />
              <p className="text-xs text-ink-muted">{group.description}</p>
            </div>
            <ul className="overflow-hidden rounded-2xl bg-surface shadow-card ring-1 ring-line/60">
              {US_FEATURES.filter((feature) => feature.group === group.key).map((feature) => (
                <li key={feature.to} className="border-b border-line/60 last:border-b-0">
                  <Link
                    to={feature.to}
                    viewTransition
                    onClick={() => recordOpen(feature.to)}
                    className="group flex items-center gap-3 px-3.5 py-3 transition hover:bg-surface-soft"
                  >
                    <IconTile tone={group.tone}>
                      <feature.icon className="h-5 w-5" />
                    </IconTile>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {feature.title}
                      </span>
                      <span className="block truncate text-xs text-ink-muted">
                        {feature.description}
                      </span>
                    </span>
                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-faint transition group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="lg:max-w-md">
        <NudgeCard />
      </div>
    </div>
  )
}
