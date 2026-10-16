/**
 * Small original line illustrations for empty states (TASK-UI-…-002).
 * Views only: stroke uses currentColor so the caller tints them with theme
 * tokens; no fonts, no assets, no data.
 */

type IllustrationProps = { className?: string }

function svgProps(className: string) {
  return {
    viewBox: '0 0 48 48',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  }
}

/** Nido: a nest with a small heart resting inside. */
export function NestIllustration({ className = 'h-14 w-14' }: IllustrationProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M9 29c1.5-2.6 7.6-4 15-4s13.5 1.4 15 4" />
      <path d="M10 29c-1.4 8 4.4 12 14 12s15.4-4 14-12" />
      <path d="M13.5 33.5c3.4 1.6 7 2.4 10.5 2.4s7.1-.8 10.5-2.4" />
      <path d="M24 21.5c-2.6-2.2-5-3.8-5-6.2 0-1.7 1.3-3 3-3 1 0 1.6.4 2 1 .4-.6 1-1 2-1 1.7 0 3 1.3 3 3 0 2.4-2.4 4-5 6.2z" />
    </svg>
  )
}

/** Heart: a soft heart with a small sparkle. */
export function HeartIllustration({ className = 'h-14 w-14' }: IllustrationProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M24 39C15.8 32.4 10 27 10 20.6 10 16.4 13.2 13 17.4 13c2.5 0 5 1.2 6.6 3.4C25.6 14.2 28.1 13 30.6 13 34.8 13 38 16.4 38 20.6 38 27 32.2 32.4 24 39z" />
      <path d="M38 9.5v3.6M36.2 11.3h3.6" />
    </svg>
  )
}

/** Camera: a photo moment, for the memories journal. */
export function CameraIllustration({ className = 'h-14 w-14' }: IllustrationProps) {
  return (
    <svg {...svgProps(className)}>
      <rect x="8" y="15" width="32" height="22" rx="4" />
      <path d="M18 15l2.4-4h7.2L30 15" />
      <circle cx="24" cy="25.5" r="6" />
      <circle cx="33" cy="20" r="1" />
    </svg>
  )
}

/** Calendar with a heart: a shared day. */
export function CalendarIllustration({ className = 'h-14 w-14' }: IllustrationProps) {
  return (
    <svg {...svgProps(className)}>
      <rect x="9" y="12" width="30" height="27" rx="4" />
      <path d="M9 20h30M17 8.5V14M31 8.5V14" />
      <path d="M24 32.5c-2.2-1.9-4.2-3.2-4.2-5.2 0-1.4 1.1-2.5 2.5-2.5.8 0 1.4.3 1.7.8.3-.5.9-.8 1.7-.8 1.4 0 2.5 1.1 2.5 2.5 0 2-2 3.3-4.2 5.2z" />
    </svg>
  )
}

/** Sparkles: a small burst, for celebrations and pickers. */
export function SparkleIllustration({ className = 'h-14 w-14' }: IllustrationProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M24 9l2.6 8.4L35 20l-8.4 2.6L24 31l-2.6-8.4L13 20l8.4-2.6z" />
      <path d="M35.5 29.5l1.2 3.8 3.8 1.2-3.8 1.2-1.2 3.8-1.2-3.8-3.8-1.2 3.8-1.2z" />
    </svg>
  )
}

/** Checklist: three lines, one checked — for the bucket list. */
export function ChecklistIllustration({ className = 'h-14 w-14' }: IllustrationProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M14 15.5h22M14 24h22M14 32.5h14" />
      <path d="M8 14.5l1.6 1.6L12.4 13" />
      <path d="M8 23l1.6 1.6L12.4 21.5" />
    </svg>
  )
}
