import { useState } from 'react'

import { Button } from '../../ui/components'
import { useAuth } from '../auth/AuthProvider'
import { OnboardingSlides } from '../auth/OnboardingSlides'
import { CoupleCard } from './CoupleCard'
import { PersonalizationCard } from './PersonalizationCard'
import { ProfileCard } from './ProfileCard'
import { SectionsCard } from './SectionsCard'
import { SecurityCard } from './SecurityCard'

export function ProfilePage() {
  const { session, signOut } = useAuth()
  const [introOpen, setIntroOpen] = useState(false)

  return (
    <div className="space-y-5 pt-2">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-ink">Profilo</h1>
        <p className="text-sm text-ink-muted">
          I tuoi dati, la vostra coppia e le sezioni attive.
        </p>
      </header>

      <ProfileCard />
      <PersonalizationCard />
      <SecurityCard />
      <CoupleCard />
      <SectionsCard />

      <Button variant="ghost" className="w-full" onClick={() => setIntroOpen(true)}>
        Rivedi l'introduzione
      </Button>

      <Button variant="secondary" className="w-full" onClick={() => void signOut()}>
        Esci
      </Button>

      <p className="pb-2 text-center text-xs text-ink-faint">Nido · M1 — {session?.user.email}</p>

      {introOpen && <OnboardingSlides onClose={() => setIntroOpen(false)} />}
    </div>
  )
}
