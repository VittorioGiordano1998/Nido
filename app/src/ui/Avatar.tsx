/**
 * Avatar: the member's photo, or their initials on a sage disc.
 * `onPhoto` is the translucent variant used over a cover photo.
 */

const SIZES = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
} as const

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

interface AvatarProps {
  name: string
  url?: string | null
  size?: keyof typeof SIZES
  onPhoto?: boolean
  /** Shown as tooltip and alt text; decorative when false. */
  labelled?: boolean
  className?: string
}

export function Avatar({
  name,
  url,
  size = 'md',
  onPhoto = false,
  labelled = false,
  className = '',
}: AvatarProps) {
  if (url) {
    return (
      <img
        src={url}
        alt={labelled ? name : ''}
        title={labelled ? name : undefined}
        className={`shrink-0 rounded-full object-cover ring-2 ${
          onPhoto ? 'ring-white/50' : 'ring-surface'
        } ${SIZES[size]} ${className}`}
      />
    )
  }
  return (
    <span
      title={labelled ? name : undefined}
      aria-hidden={labelled ? undefined : true}
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${
        onPhoto ? 'bg-white/25 text-white' : 'bg-sage-soft text-sage-ink ring-2 ring-surface'
      } ${SIZES[size]} ${className}`}
    >
      {initials(name)}
    </span>
  )
}
