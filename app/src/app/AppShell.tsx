import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { OnboardingSlides } from '../features/auth/OnboardingSlides'
import { useOnboarding } from '../features/auth/useOnboarding'
import { useEventReminders } from '../features/calendar/reminders'
import { useCouple } from '../features/coupling/CoupleProvider'
import { useSettings } from '../features/settings/SettingsProvider'
import { CalendarIcon, HeartIcon, HomeIcon, ListIcon, UserIcon } from '../ui/icons'
import { ErrorBoundary } from './ErrorBoundary'
import { titleForPath } from './titles'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true, section: null },
  { to: '/calendar', label: 'Calendario', icon: CalendarIcon, end: false, section: 'calendar' },
  { to: '/lists', label: 'Liste', icon: ListIcon, end: false, section: 'lists' },
  { to: '/us', label: 'Noi', icon: HeartIcon, end: false, section: 'us' },
  { to: '/profile', label: 'Profilo', icon: UserIcon, end: false, section: null },
] as const

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function AppShell() {
  const { session } = useAuth()
  const { couple } = useCouple()
  const { enabled, remindersEnabled } = useSettings()
  const { status, complete } = useOnboarding()
  useEventReminders(remindersEnabled)
  const location = useLocation()

  // Per-route document title (TASK-UI-…-004).
  useEffect(() => {
    document.title = titleForPath(location.pathname)
  }, [location.pathname])

  const myId = session?.user.id
  const partner = couple?.members.find((member) => member.userId !== myId)

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.section === null || enabled[item.section],
  )

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-canvas/90 px-5 py-3 backdrop-blur">
        <span className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="h-2.5 w-2.5 rounded-full bg-accent-500" />
          Nido
        </span>
        {partner &&
          (partner.avatarUrl ? (
            <img
              src={partner.avatarUrl}
              alt={partner.displayName}
              title={partner.displayName}
              className="h-8 w-8 rounded-full object-cover ring-1 ring-line"
            />
          ) : (
            <span
              title={partner.displayName}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-300 text-xs font-bold text-sage-700 dark:bg-sage-700 dark:text-sage-100"
            >
              {initials(partner.displayName)}
            </span>
          ))}
      </header>

      <main className="flex-1 px-5 pb-6 pt-1">
        {/* Soft entrance on route change (TASK-UI-…-005); reduced motion off in CSS.
            The boundary remounts per route, so a broken page never traps the shell. */}
        <div key={location.pathname} className="page-enter">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>

      <nav className="sticky bottom-0 z-10 border-t border-line/70 bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="flex">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              viewTransition
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${
                  isActive ? 'text-accent-ink' : 'text-ink-faint hover:text-ink-soft'
                }`
              }
            >
              <item.icon className="h-6 w-6" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {status === 'todo' && <OnboardingSlides onClose={() => void complete()} />}
    </div>
  )
}
