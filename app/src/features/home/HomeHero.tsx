import { Link } from 'react-router-dom'

import { daysSince, formatDateIt } from '../../core/dates'
import { HeartIcon } from '../../ui/icons'
import CountUp from '../../ui/reactbits/CountUp'
import { Skeleton } from '../../ui/Skeleton'
import { useAuth } from '../auth/AuthProvider'
import { BackdropPhoto } from '../lists/BackdropPhoto'
import { useCouple } from '../coupling/CoupleProvider'
import { useCoupleHero } from '../coupling/useCoupleHero'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Home hero (TASK-HOME-…-002): warm gradient by default, the couple's cover
 * photo when set (framing respected), days together and the two members.
 */
export function HomeHero() {
  const { session } = useAuth()
  const { couple } = useCouple()
  const { framing, url, loading } = useCoupleHero()

  const days = couple?.startedAt ? daysSince(couple.startedAt) : null
  const members = couple?.members ?? []
  const myId = session?.user.id
  const partner = members.find((member) => member.userId !== myId)
  const onPhoto = Boolean(url)

  if (loading) {
    return (
      <section
        aria-hidden="true"
        className="rounded-3xl bg-surface/60 p-5 ring-1 ring-line/50"
      >
        <div className="flex items-end gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className={`relative overflow-hidden rounded-3xl shadow-sm ring-1 ring-line/60 ${
        onPhoto
          ? ''
          : 'bg-gradient-to-br from-accent-200 via-accent-50 to-sage-100 dark:from-accent-200 dark:via-accent-50 dark:to-surface-soft'
      }`}
    >
      {url && <BackdropPhoto url={url} framing={framing} />}
      {!onPhoto && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-accent-300/50 blur-2xl"
        />
      )}

      <div className={`relative space-y-3 p-5 ${onPhoto ? 'text-white' : 'text-ink'}`}>
        <div className="flex items-end gap-3">
          <HeartIcon
            className={`h-9 w-9 shrink-0 ${onPhoto ? 'text-white' : 'text-accent-glyph'}`}
          />
          <div>
            {days !== null && couple?.startedAt ? (
              <>
                <CountUp
                  to={days}
                  separator="."
                  duration={1.4}
                  className={`text-4xl font-extrabold tabular-nums ${onPhoto ? '' : 'text-accent-ink'}`}
                />
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    onPhoto ? 'text-white/85' : 'text-accent-glyph'
                  }`}
                >
                  giorni insieme
                </p>
                <p className={`text-xs ${onPhoto ? 'text-white/75' : 'text-ink-muted'}`}>
                  dal {formatDateIt(couple.startedAt)}
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold">
                La vostra storia inizia qui: il contatore parte dal giorno che scegliete voi.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {members.map((member) => (
            <span
              key={member.userId}
              className={`flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-3 text-xs font-semibold ${
                onPhoto ? 'bg-white/20' : 'bg-surface/80 ring-1 ring-line'
              }`}
            >
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-white/40"
                />
              ) : (
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                    onPhoto ? 'bg-white/25 text-white' : 'bg-sage-300 text-sage-700'
                  }`}
                >
                  {initials(member.displayName)}
                </span>
              )}
              {member.displayName}
            </span>
          ))}
        </div>

        {!partner && (
          <Link
            to="/pair"
            viewTransition
            className={`inline-flex rounded-xl px-4 py-2 text-sm font-semibold transition ${
              onPhoto
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-accent-600 text-white hover:bg-accent-700'
            }`}
          >
            Invita il partner
          </Link>
        )}
      </div>
    </section>
  )
}
