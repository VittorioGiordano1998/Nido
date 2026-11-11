import { daysSince, formatDateIt } from '../../core/dates'
import { Avatar } from '../../ui/Avatar'
import { ButtonLink } from '../../ui/components'
import { HeartIcon } from '../../ui/icons'
import CountUp from '../../ui/reactbits/CountUp'
import { Skeleton } from '../../ui/Skeleton'
import { useAuth } from '../auth/AuthProvider'
import { BackdropPhoto } from '../lists/BackdropPhoto'
import { useCouple } from '../coupling/CoupleProvider'
import { useCoupleHero } from '../coupling/useCoupleHero'

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
        className="flex min-h-48 items-end rounded-[1.75rem] bg-surface/60 p-5 ring-1 ring-line/50"
      >
        <div className="flex-1 space-y-2">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </section>
    )
  }

  return (
    <section
      className={`relative flex min-h-48 flex-col justify-end overflow-hidden rounded-[1.75rem] shadow-card ring-1 ring-line/60 lg:min-h-60 ${
        onPhoto ? '' : 'bg-gradient-to-br from-accent-200 via-accent-50 to-sage-soft'
      }`}
    >
      {url && <BackdropPhoto url={url} framing={framing} />}
      {!onPhoto && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-14 -top-14 h-52 w-52 rounded-full bg-accent-300/50 blur-3xl"
          />
          <HeartIcon className="pointer-events-none absolute -right-6 -top-4 h-40 w-40 rotate-12 text-accent-300/40" />
        </>
      )}

      <div className={`relative space-y-4 p-5 ${onPhoto ? 'text-white' : 'text-ink'}`}>
        {days !== null && couple?.startedAt ? (
          <div>
            <p className="flex items-baseline gap-2">
              <CountUp
                to={days}
                separator="."
                duration={1.4}
                className={`font-display text-6xl font-semibold leading-none tabular-nums ${
                  onPhoto ? '' : 'text-accent-ink'
                }`}
              />
              <span
                className={`font-display text-xl font-semibold ${
                  onPhoto ? 'text-white/90' : 'text-accent-ink'
                }`}
              >
                giorni insieme
              </span>
            </p>
            <p className={`mt-1 text-xs ${onPhoto ? 'text-white/80' : 'text-ink-muted'}`}>
              dal {formatDateIt(couple.startedAt)}
            </p>
          </div>
        ) : (
          <p className="max-w-xs font-display text-xl font-semibold text-balance">
            La vostra storia inizia qui: il contatore parte dal giorno che scegliete voi.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {members.map((member) => (
            <span
              key={member.userId}
              className={`flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-3 text-xs font-semibold backdrop-blur ${
                onPhoto ? 'bg-white/20' : 'bg-surface/75 ring-1 ring-line/70'
              }`}
            >
              <Avatar
                name={member.displayName}
                url={member.avatarUrl}
                size="sm"
                onPhoto={onPhoto}
                className="ring-0"
              />
              {member.displayName}
            </span>
          ))}
          {!partner && (
            <ButtonLink
              to="/pair"
              className={onPhoto ? 'bg-none bg-white/25 shadow-none hover:bg-white/35' : ''}
            >
              Invita il partner
            </ButtonLink>
          )}
        </div>
      </div>
    </section>
  )
}
