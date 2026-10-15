type IconProps = { className?: string }

function baseProps(className: string) {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  }
}

export function HomeIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v10h12V10" />
    </svg>
  )
}

export function CalendarIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <rect x="4" y="5" width="16" height="15" rx="2.5" />
      <path d="M8 3.5V6M16 3.5V6M4 10h16" />
    </svg>
  )
}

export function ListIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </svg>
  )
}

export function HeartIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <path d="M12 20.3C7.2 16.6 4 13.6 4 10.3 4 7.9 5.8 6 8.2 6c1.4 0 2.8.7 3.8 2 1-1.3 2.4-2 3.8-2C18.2 6 20 7.9 20 10.3c0 3.3-3.2 6.3-8 10z" />
    </svg>
  )
}

export function UserIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
    </svg>
  )
}

export function CopyIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

export function CheckIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <path d="M5 12.5 10 17.5 19 7" />
    </svg>
  )
}

export function PlusIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function LockIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </svg>
  )
}

export function TrashIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <path d="M5 7h14M10 7V5h4v2M8 7l.8 12h6.4L16 7" />
      <path d="M10.5 11v4.5M13.5 11v4.5" />
    </svg>
  )
}

export function ChevronLeftIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <path d="M14.5 6 9 12l5.5 6" />
    </svg>
  )
}

export function ChevronRightIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <path d="M9.5 6 15 12l-5.5 6" />
    </svg>
  )
}

export function CloseIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

export function BellIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <path d="M12 4a5 5 0 0 1 5 5v4l1.5 3h-13L7 13V9a5 5 0 0 1 5-5z" />
      <path d="M10 19.5a2.1 2.1 0 0 0 4 0" />
    </svg>
  )
}
