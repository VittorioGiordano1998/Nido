import { Card } from '../../ui/components'
import { SECTION_DEFS, useSettings } from '../settings/SettingsProvider'

export function SectionsCard() {
  const { enabled, toggle } = useSettings()

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Sezioni attive
      </h2>
      <div className="space-y-4">
        {SECTION_DEFS.map((section) => (
          <div key={section.key} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">{section.label}</p>
              <p className="text-xs text-ink-muted">{section.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled[section.key]}
              aria-label={`Attiva o disattiva ${section.label}`}
              onClick={() => toggle(section.key)}
              className={`h-6 w-11 shrink-0 rounded-full transition ${
                enabled[section.key] ? 'bg-accent-600' : 'bg-line-strong'
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white shadow transition ${
                  enabled[section.key] ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </Card>
  )
}
