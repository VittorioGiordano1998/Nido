import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { useCouple } from '../features/coupling/CoupleProvider'
import { FullPageSpinner } from '../ui/components'

export function RequireAuth() {
  const { session, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

export function RequireCouple() {
  const { couple, loading } = useCouple()
  if (loading) return <FullPageSpinner />
  if (!couple) return <Navigate to="/pair" replace />
  return <Outlet />
}
