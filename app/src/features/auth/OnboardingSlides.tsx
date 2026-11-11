import { useState } from 'react'

import { Button } from '../../ui/components'
import { CalendarIllustration, HeartIllustration, NestIllustration } from '../../ui/illustrations'
import { Sheet } from '../../ui/Sheet'

const SLIDES = [
  {
    title: 'Benvenuti nel nido',
    body: 'Il posto privato dove tenete le cose vostre: appuntamenti, liste, note e piccoli rituali.',
    illustration: NestIllustration,
  },
  {
    title: 'Tutto in due',
    body: 'Quasi tutto è condiviso con il partner. Quello che scegliete di tenere per voi resta solo vostro.',
    illustration: HeartIllustration,
  },
  {
    title: 'Da dove iniziare',
    body: 'Create la coppia con un codice invito, poi aprite la prima lista insieme.',
    illustration: CalendarIllustration,
  },
] as const

/** First-run intro slides; Profilo remounts the same overlay to reopen it. */
export function OnboardingSlides({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0)

  const slide = SLIDES[index]
  const last = index === SLIDES.length - 1

  return (
    <Sheet
      title="Introduzione a Nido"
      onClose={onClose}
      dismissOnScrim={false}
      closeSlot={
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-ink-faint transition hover:bg-surface-muted hover:text-ink-soft"
        >
          Salta
        </button>
      }
    >
      <div key={slide.title} className="page-enter space-y-3 pb-6 pt-2 text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-50 ring-1 ring-accent-200/70">
          <slide.illustration className="h-11 w-11 text-accent-glyph" />
        </span>
        <p className="font-display text-2xl font-semibold text-ink">{slide.title}</p>
        <p className="text-pretty text-sm text-ink-muted">{slide.body}</p>
      </div>

      <div className="mb-4 flex items-center justify-center gap-1.5">
        {SLIDES.map((item, dotIndex) => (
          <span
            key={item.title}
            className={`h-1.5 rounded-full transition-all ${
              dotIndex === index ? 'w-4 bg-accent-600' : 'w-1.5 bg-line-strong'
            }`}
          />
        ))}
      </div>

      <Button className="w-full" onClick={() => (last ? onClose() : setIndex(index + 1))}>
        {last ? 'Iniziamo' : 'Avanti'}
      </Button>
    </Sheet>
  )
}
