import { StrictMode } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppRouter } from './app/router'
import { isSupabaseConfigured } from './core/env'
import { SetupScreen } from './core/SetupScreen'
import { AuthProvider } from './features/auth/AuthProvider'
import { CoupleProvider } from './features/coupling/CoupleProvider'
import { SettingsProvider } from './features/settings/SettingsProvider'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Elemento #root non trovato')

function SetupGate({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured) return <SetupScreen />
  return <>{children}</>
}

createRoot(rootEl).render(
  <StrictMode>
    <SetupGate>
      <SettingsProvider>
        <AuthProvider>
          <CoupleProvider>
            <AppRouter />
          </CoupleProvider>
        </AuthProvider>
      </SettingsProvider>
    </SetupGate>
  </StrictMode>,
)
