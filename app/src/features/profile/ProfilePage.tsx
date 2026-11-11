import { useState } from 'react'

import { env } from '../../core/env'
import { Button } from '../../ui/components'
import { PageHeader } from '../../ui/PageHeader'
import { useAuth } from '../auth/AuthProvider'
import { OnboardingSlides } from '../auth/OnboardingSlides'
import { CoupleCard } from './CoupleCard'
import { CoverCard } from './CoverCard'
import { CycleCard } from './CycleCard'
import { DeleteAccountCard } from './DeleteAccountCard'
import { EmailCard } from './EmailCard'
import { ExportCard } from './ExportCard'
import { NotificationsCard } from './NotificationsCard'
import { PersonalizationCard } from './PersonalizationCard'
import { ProfileCard } from './ProfileCard'
import { SectionsCard } from './SectionsCard'
import { SecurityCard } from './SecurityCard'
import { TestToolsCard } from './TestToolsCard'
import { useProfile } from './useProfile'

export function ProfilePage() {
  const { session, signOut } = useAuth()
  const [introOpen, setIntroOpen] = useState(false)
  const profile = useProfile()

  return (
    <div className="space-y-5 pt-2">
      <PageHeader
        title="Profilo"
        description="I tuoi dati, la vostra coppia e le sezioni attive."
      />

      {/* Two balanced columns on desktop; each card stays whole. */}
      <div className="space-y-5 lg:columns-2 lg:gap-5 lg:space-y-0 lg:[&>*]:mb-5 lg:[&>*]:break-inside-avoid">
      <ProfileCard profile={profile} />
      <PersonalizationCard />
      <CoverCard />
      <NotificationsCard />
      <EmailCard />
      <SecurityCard />
      <CycleCard visible={!profile.loading && profile.sex !== 'male'} />
      <CoupleCard />
      <SectionsCard />
      {env.testToolsEnabled && <TestToolsCard />}
      <ExportCard />
      <DeleteAccountCard />
      </div>

      <div className="space-y-3 lg:max-w-sm">

      <Button variant="ghost" className="w-full" onClick={() => setIntroOpen(true)}>
        Rivedi l'introduzione
      </Button>

      <Button variant="secondary" className="w-full" onClick={() => void signOut()}>
        Esci
      </Button>
      </div>

      <p className="pb-2 text-center text-xs text-ink-faint">Nido · M1 — {session?.user.email}</p>

      {introOpen && <OnboardingSlides onClose={() => setIntroOpen(false)} />}
    </div>
  )
}
