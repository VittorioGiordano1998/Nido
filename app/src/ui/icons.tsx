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

export function MinusIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <path d="M5 12h14" />
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

export function PaperclipIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <path d="M20 11.5 12.3 19a4.7 4.7 0 0 1-6.6-6.6l7.6-7.6a3.1 3.1 0 0 1 4.4 4.4l-7.6 7.6a1.6 1.6 0 0 1-2.2-2.2l7-7" />
    </svg>
  )
}

export function ImageIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <rect x="4" y="5" width="16" height="14" rx="2.5" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m5.5 17 4.5-4.5 3 3 2.5-2.5 3 3" />
    </svg>
  )
}

export function LinkIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <path d="M10.5 13.5a4 4 0 0 1 0-5.6l2-2a4 4 0 0 1 5.6 5.6l-1.4 1.4" />
      <path d="M13.5 10.5a4 4 0 0 1 0 5.6l-2 2a4 4 0 0 1-5.6-5.6l1.4-1.4" />
    </svg>
  )
}

export function ChatIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <path d="M12 5c4.6 0 8 3 8 6.8s-3.4 6.7-8 6.7c-.7 0-1.4-.1-2-.2L6 20l.9-3.2C5.7 15.6 4 13.8 4 11.8 4 8 7.4 5 12 5z" />
    </svg>
  )
}

export function InfoIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  )
}

export function HourglassIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <path d="M7 4h10M7 20h10" />
      <path d="M8 4c0 3.2 1.6 4.8 4 8-2.4 3.2-4 4.8-4 8" />
      <path d="M16 4c0 3.2-1.6 4.8-4 8 2.4 3.2 4 4.8 4 8" />
    </svg>
  )
}

export function SplitIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <path d="M8 4v3.5c0 2 1 3 3 3.8L17 14" />
      <path d="M8 20v-3.5c0-2 1-3 3-3.8l6-2.7" />
      <path d="m15 5.5 2.5 2L15 9.5" />
      <path d="m15 14.5 2.5 2-2.5 2" />
    </svg>
  )
}

export function GiftIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <rect x="4.5" y="10" width="15" height="9.5" rx="1.5" />
      <path d="M4.5 13h15M12 10v9.5" />
      <path d="M12 10c-2.8 0-4.5-1-4.5-2.7A1.8 1.8 0 0 1 9.3 5.5C11 5.5 12 7.5 12 10zm0 0c2.8 0 4.5-1 4.5-2.7A1.8 1.8 0 0 0 14.7 5.5C13 5.5 12 7.5 12 10z" />
    </svg>
  )
}

export function CompassIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <circle cx="12" cy="12" r="8" />
      <path d="m14.8 9.2-1.5 4.1-4.1 1.5 1.5-4.1z" />
    </svg>
  )
}

export function CoinIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <circle cx="12" cy="12" r="8" />
      <path d="M14.5 9.5a3 3 0 0 0-2.5-1.3c-1.4 0-2.5.9-2.5 2 0 2.8 5 1.6 5 4.2 0 1.2-1.1 2-2.5 2a3 3 0 0 1-2.5-1.3" />
      <path d="M12 7v10" />
    </svg>
  )
}

export function CardIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <rect x="4" y="7" width="16" height="10.5" rx="2" />
      <path d="M7 14.5v-2M9.5 14.5v-2M12 14.5v-2M14.5 14.5v-2" />
    </svg>
  )
}

export function CameraIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <rect x="4" y="8" width="16" height="11" rx="2.5" />
      <path d="m9 8 1.2-2h3.6L15 8" />
      <circle cx="12" cy="13.2" r="3.2" />
    </svg>
  )
}

export function ChecklistIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <path d="m4.5 7 1.5 1.5L8.5 6M4.5 12.5 6 14l2.5-2.5M4.5 18l1.5 1.5L8.5 17" />
      <path d="M11 7h9M11 13h9M11 19h9" />
    </svg>
  )
}

export function DiceIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <rect x="4.5" y="4.5" width="15" height="15" rx="3" />
      <path d="M9 9h.01M15 9h.01M12 12h.01M9 15h.01M15 15h.01" />
    </svg>
  )
}

export function SparklesIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...baseProps(className)}>
      <path d="M12 4.5 13.6 9l4.5 1.6-4.5 1.6L12 16.7l-1.6-4.5L5.9 10.6 10.4 9z" />
      <path d="M17.5 15.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" />
    </svg>
  )
}
