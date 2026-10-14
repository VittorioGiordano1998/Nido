import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { CalendarPage } from '../features/calendar/CalendarPage'
import { CapsulesPage } from '../features/capsules/CapsulesPage'
import { FactsPage } from '../features/facts/FactsPage'
import { LoginPage } from '../features/auth/LoginPage'
import { HomePage } from '../features/home/HomePage'
import { ListsPage } from '../features/lists/ListsPage'
import { ListView } from '../features/lists/ListView'
import { NotesPage } from '../features/notes/NotesPage'
import { PairPage } from '../features/coupling/PairPage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { QuestionPage } from '../features/question/QuestionPage'
import { UsPage } from '../features/us/UsPage'
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
              <Route path="/us/facts" element={<FactsPage />} />
              <Route path="/us/capsules" element={<CapsulesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
