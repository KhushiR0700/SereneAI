import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AmbientBackground } from '@/components/AmbientBackground'
import { CustomCursor } from '@/components/CustomCursor'
import { GradientDefs } from '@/components/GradientDefs'
import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spinner } from '@/components/Spinner'

const AuthPage = lazy(() => import('@/pages/AuthPage'))
const AppLayout = lazy(() => import('@/layouts/AppLayout'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const InterviewStudio = lazy(() => import('@/pages/InterviewStudio'))
const GrowthAnalytics = lazy(() => import('@/pages/GrowthAnalytics'))
const Reports = lazy(() => import('@/pages/Reports'))
const PronunciationLab = lazy(() => import('@/pages/PronunciationLab'))
const QuestionLibrary = lazy(() => import('@/pages/QuestionLibrary'))
const Profile = lazy(() => import('@/pages/Profile'))
const Settings = lazy(() => import('@/pages/Settings'))
const MFASetup = lazy(() => import('@/pages/MFASetup'))
import AuthCallback from '@/pages/AuthCallback'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <Spinner />
  if (!session) return <Navigate to="/" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <Spinner />
  // Only redirect if we have a session AND a profile (profile fetch completed)
  if (session) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={
        <PublicRoute><AuthPage /></PublicRoute>
      } />
      <Route element={
        <ProtectedRoute><AppLayout /></ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/studio" element={<InterviewStudio />} />
        <Route path="/analytics" element={<GrowthAnalytics />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/pronunciation" element={<PronunciationLab />} />
        <Route path="/library" element={<QuestionLibrary />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/auth/mfa-setup" element={<MFASetup />} />
      </Route>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AmbientBackground />
      <CustomCursor />
      <GradientDefs />
      <Suspense fallback={<Spinner />}>
        <AppRoutes />
      </Suspense>
    </AuthProvider>
  )
}
