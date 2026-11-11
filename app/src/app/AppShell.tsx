import { Suspense, lazy, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { requestAppResync } from '../core/resync'
import { useAuth } from '../features/auth/AuthProvider'
import { OnboardingSlides } from '../features/auth/OnboardingSlides'
import { useOnboarding } from '../features/auth/useOnboarding'
import { useEventReminders } from '../features/calendar/reminders'
import { useCouple } from '../features/coupling/CoupleProvider'
import type { QuickAddResult } from '../features/quickadd/QuickAdd'
import { useSettings } from '../features/settings/SettingsProvider'
import { Avatar } from '../ui/Avatar'
import { Brand } from '../ui/Brand'
import {
  CalendarIcon,
  HeartIcon,
  HomeIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
  UserIcon,
} from '../ui/icons'
import { useToast } from '../ui/toast'
import { ErrorBoundary } from './ErrorBoundary'
import { titleForPath } from './titles'

// Both overlays load on first use: they pull in the editors and every
// section hook, which the first paint does not need.
const QuickAdd = lazy(() => import('../features/quickadd/QuickAdd'))
const SearchOverlay = lazy(() => import('../features/search/SearchOverlay'))

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true, section: null },
  { to: '/calendar', label: 'Calendario', icon: CalendarIcon, end: false, section: 'calendar' },
  { to: '/lists', label: 'Liste', icon: ListIcon, end: false, section: 'lists' },
  { to: '/us', label: 'Noi', icon: HeartIcon, end: false, section: 'us' },
  { to: '/profile', label: 'Profilo', icon: UserIcon, end: false, section: null },
] as const

/** Typing in a field must not trigger the single-key shortcuts. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}

/**
 * The app frame. On phones: a slim header, the page and a floating bottom bar
 * with the quick-add button in the middle. From `lg` up: a fixed sidebar with
 * the same destinations, search and quick add, and a wide content column.
 */
export function AppShell() {
  const { session } = useAuth()
  const { couple } = useCouple()
  const { enabled, remindersEnabled } = useSettings()
  const { status, complete } = useOnboarding()
  useEventReminders(remindersEnabled)
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [searchOpen, setSearchOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  function handleQuickAddDone(result: QuickAddResult) {
    setQuickAddOpen(false)
    // The page underneath has its own copy of the data: bring it up to date.
    requestAppResync()
    showToast({
      message: result.message,
      tone: 'success',
      action: {
        label: 'Apri',
        onAction: () => void navigate(result.to, { state: result.state, viewTransition: true }),
      },
    })
  }

  // Per-route document title (TASK-UI-…-004).
  useEffect(() => {
    document.title = titleForPath(location.pathname)
  }, [location.pathname])

  // Global search shortcuts: Ctrl/⌘+K anywhere, "/" outside text fields.
  useEffect(() => {
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      const isPalette = (keyEvent.ctrlKey || keyEvent.metaKey) && keyEvent.key.toLowerCase() === 'k'
      const isSlash = keyEvent.key === '/' && !isTypingTarget(keyEvent.target)
      if (!isPalette && !isSlash) return
      keyEvent.preventDefault()
      setSearchOpen(true)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const myId = session?.user.id
  const partner = couple?.members.find((member) => member.userId !== myId)

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.section === null || enabled[item.section],
  )
  // The quick-add button sits in the middle of the bottom bar.
  const half = Math.ceil(visibleItems.length / 2)
  const leftItems = visibleItems.slice(0, half)
  const rightItems = visibleItems.slice(half)

  const bottomLink = (item: (typeof NAV_ITEMS)[number]) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      viewTransition
      className={({ isActive }) =>
        `group flex flex-1 flex-col items-center gap-0.5 py-2 text-[10.5px] font-semibold transition ${
          isActive ? 'text-accent-ink' : 'text-ink-faint hover:text-ink-soft'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors duration-200 ${
              isActive ? 'bg-accent-100' : 'group-hover:bg-surface-muted'
            }`}
          >
            <item.icon className="h-[22px] w-[22px]" />
          </span>
          {item.label}
        </>
      )}
    </NavLink>
  )

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-line/70 bg-surface/60 px-4 py-7 backdrop-blur lg:flex">
        <div className="px-3">
          <Brand size="lg" />
          <p className="mt-1 text-xs text-ink-faint">
            {couple?.name?.trim() || 'Lo spazio della vostra coppia'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2.5 text-left text-sm text-ink-faint shadow-card ring-1 ring-line/70 transition hover:text-ink-soft hover:ring-line-strong"
        >
          <SearchIcon className="h-4 w-4" />
          <span className="flex-1">Cerca…</span>
          <kbd className="rounded-md bg-surface-muted px-1.5 py-0.5 font-sans text-[10px] font-semibold text-ink-muted">
            Ctrl K
          </kbd>
        </button>

        <nav aria-label="Sezioni" className="flex flex-col gap-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              viewTransition
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-accent-100 text-accent-ink'
                    : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setQuickAddOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-accent-600/25 transition hover:shadow-lg hover:shadow-accent-600/35 active:scale-[0.98]"
        >
          <PlusIcon className="h-4 w-4" /> Aggiungi
        </button>

        {partner && (
          <div className="mt-auto flex items-center gap-3 rounded-2xl bg-surface px-3 py-2.5 shadow-card ring-1 ring-line/60">
            <Avatar name={partner.displayName} url={partner.avatarUrl} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink">
                {partner.displayName}
              </span>
              <span className="block text-xs text-ink-faint">Nel nido con te</span>
            </span>
          </div>
        )}
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        {/* Phone header */}
        <header className="sticky top-0 z-10 flex items-center justify-between bg-canvas/85 px-5 py-3 backdrop-blur lg:hidden">
          <Brand />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Cerca"
              className="rounded-full p-2 text-ink-muted transition hover:bg-surface-muted hover:text-ink"
            >
              <SearchIcon className="h-5 w-5" />
            </button>
            {partner && (
              <Avatar name={partner.displayName} url={partner.avatarUrl} size="md" labelled />
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-md flex-1 px-5 pb-8 pt-1 sm:max-w-2xl lg:max-w-5xl lg:px-10 lg:pb-14 lg:pt-9">
          {/* Soft entrance on route change (TASK-UI-…-005); reduced motion off in CSS.
              The boundary remounts per route, so a broken page never traps the shell. */}
          <div key={location.pathname} className="page-enter">
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>

        {/* Phone bottom bar */}
        <nav
          aria-label="Sezioni"
          className="sticky bottom-0 z-10 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-1 lg:hidden"
        >
          <div className="mx-auto flex max-w-md items-end rounded-[1.75rem] bg-surface/90 px-1.5 shadow-lift ring-1 ring-line/60 backdrop-blur">
            {leftItems.map(bottomLink)}
            <div className="flex w-16 shrink-0 justify-center">
              <button
                type="button"
                onClick={() => setQuickAddOpen(true)}
                aria-label="Aggiungi"
                className="-mt-5 mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-white shadow-lg shadow-accent-600/35 ring-4 ring-canvas transition active:scale-95"
              >
                <PlusIcon className="h-6 w-6" />
              </button>
            </div>
            {rightItems.map(bottomLink)}
          </div>
        </nav>
      </div>

      <Suspense fallback={null}>
        {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
        {quickAddOpen && (
          <QuickAdd onDone={handleQuickAddDone} onClose={() => setQuickAddOpen(false)} />
        )}
      </Suspense>

      {status === 'todo' && <OnboardingSlides onClose={() => void complete()} />}
    </div>
  )
}
