import { useState } from 'react'

import { Button } from '../../ui/components'

const SLIDES = [
  {
    title: 'Benvenuti nel nido',
    body: 'Il posto privato dove tenete le cose vostre: appuntamenti, liste, note e piccoli rituali.',
  },
  {
    title: 'Tutto in due',
    body: 'Quasi tutto è condiviso con il partner. Quello che scegliete di tenere per voi resta solo vostro.',
  },
  {
    title: 'Da dove iniziare',
    body: 'Create la coppia con un codice invito, poi aprite la prima lista insieme.',
  },
] as const

/** First-run intro slides; Profilo remounts the same overlay to reopen it. */
export function OnboardingSlides({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0)

  const slide = SLIDES[index]
  const last = index === SLIDES.length - 1

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-40 flex items-center justify-center bg-scrim p-6 backdrop-blur-[2px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Introduzione a Nido"
        className="w-full max-w-md rounded-3xl bg-canvas p-6 shadow-xl"
      >
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-ink-faint transition hover:text-ink-soft"
          >
            Salta
          </button>
        </div>

        <div className="space-y-3 pb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-glyph">Nido</p>
          <h2 className="text-2xl font-bold text-ink">{slide.title}</h2>
          <p className="text-sm text-ink-muted">{slide.body}</p>
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
      </div>
    </div>
  )
}
