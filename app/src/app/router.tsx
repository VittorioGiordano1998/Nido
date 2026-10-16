import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { BucketPage } from '../features/bucket/BucketPage'
import { CalendarPage } from '../features/calendar/CalendarPage'
import { CapsulesPage } from '../features/capsules/CapsulesPage'
import { CyclePage } from '../features/cycle/CyclePage'
import { DecisionsPage } from '../features/decisions/DecisionsPage'
import { FactsPage } from '../features/facts/FactsPage'
import { LoginPage } from '../features/auth/LoginPage'
import { HomePage } from '../features/home/HomePage'
import { ListsPage } from '../features/lists/ListsPage'
import { ListView } from '../features/lists/ListView'
import { LoyaltyPage } from '../features/loyalty/LoyaltyPage'
import { MemoriesPage } from '../features/memories/MemoriesPage'
import { NotesPage } from '../features/notes/NotesPage'
import { PairPage } from '../features/coupling/PairPage'
import { PickPage } from '../features/pick/PickPage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { QuestionPage } from '../features/question/QuestionPage'
import { SavingsPage } from '../features/savings/SavingsPage'
import { UsPage } from '../features/us/UsPage'
import { PlanPage } from '../features/weekplan/PlanPage'
import { WishlistPage } from '../features/wishlist/WishlistPage'
import { AppShell } from './AppShell'
import { RequireAuth, RequireCouple } from './guards'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/pair" element={<PairPage />} />
          <Route element={<RequireCouple />}>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/lists" element={<ListsPage />} />
              <Route path="/lists/:id" element={<ListView />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/us" element={<UsPage />} />
              <Route path="/us/question" element={<QuestionPage />} />
              <Route path="/us/decisions" element={<DecisionsPage />} />
              <Route path="/us/wishlist" element={<WishlistPage />} />
              <Route path="/us/plan" element={<PlanPage />} />
              <Route path="/us/savings" element={<SavingsPage />} />
              <Route path="/us/loyalty" element={<LoyaltyPage />} />
              <Route path="/us/facts" element={<FactsPage />} />
              <Route path="/us/capsules" element={<CapsulesPage />} />
              <Route path="/us/memories" element={<MemoriesPage />} />
              <Route path="/us/bucket" element={<BucketPage />} />
              <Route path="/us/pick" element={<PickPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/cycle" element={<CyclePage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
