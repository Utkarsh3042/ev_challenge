import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { FormPage } from './pages/FormPage'
import { ScorePage } from './pages/ScorePage'
import SuccessPage from './pages/SuccessPage'
import AdminLayout from './pages/admin/layout'
import AdminOverview from './pages/admin/page'
import AdminLogin from './pages/admin/login/page'
import AdminRiders from './pages/admin/riders/page'
import AdminLeads from './pages/admin/leads/page'
import AdminLeaderboard from './pages/admin/leaderboard/page'
import AdminMessages from './pages/admin/messages/page'

function LangWrapper({ Component }: { Component: React.ComponentType<{ params: { lang: string } }> }) {
  const { lang } = useParams<{ lang: string }>()
  return <Component params={{ lang: lang || 'en' }} />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/en" replace />} />
        
        {/* Public Routes with Lang */}
        <Route path="/:lang">
          <Route index element={<LandingPage />} />
          <Route path="form" element={<FormPage />} />
          <Route path="form/success" element={<LangWrapper Component={SuccessPage} />} />
          <Route path="score" element={<ScorePage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout><AdminOverview /></AdminLayout>} />
        <Route path="/admin/login" element={<AdminLayout><AdminLogin /></AdminLayout>} />
        <Route path="/admin/riders" element={<AdminLayout><AdminRiders /></AdminLayout>} />
        <Route path="/admin/leads" element={<AdminLayout><AdminLeads /></AdminLayout>} />
        <Route path="/admin/leaderboard" element={<AdminLayout><AdminLeaderboard /></AdminLayout>} />
        <Route path="/admin/messages" element={<AdminLayout><AdminMessages /></AdminLayout>} />
      </Routes>
    </BrowserRouter>
  )
}
