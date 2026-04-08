import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth.store'
import { useSettingsStore } from './store/settings.store'
import { useEffect } from 'react'

import { CaregiverLogin } from './pages/auth/CaregiverLogin'
import { PatientSelect } from './pages/auth/PatientSelect'
import { PatientPinLogin } from './pages/auth/PatientPinLogin'

import { PatientLayout } from './layouts/PatientLayout'
import { CaregiverLayout } from './layouts/CaregiverLayout'
import { ProtectedRoute } from './components/shared/ProtectedRoute'

import { PatientHome } from './pages/patient/PatientHome'
import { PatientAgenda } from './pages/patient/PatientAgenda'
import { ActivityRouter } from './pages/activities/ActivityRouter'
import { ActivityResult } from './pages/activities/ActivityResult'
import { MemoryGallery } from './pages/activities/MemoryGallery'
import { BreathingExercise } from './pages/activities/BreathingExercise'
import { CaregiverDashboard } from './pages/caregiver/CaregiverDashboard'
import { PatientList } from './pages/caregiver/PatientList'
import { PatientDetail } from './pages/caregiver/PatientDetail'
import { PatientProgress } from './pages/caregiver/PatientProgress'
import { ManageMedia } from './pages/caregiver/ManageMedia'
import { CaregiverProgress } from './pages/caregiver/CaregiverProgress'
import { CaregiverSettings } from './pages/caregiver/CaregiverSettings'

function RootRedirect() {
  const { isAuthenticated, role } = useAuthStore()
  if (!isAuthenticated) return <CaregiverLogin />
  return <Navigate to={role === 'caregiver' ? '/caregiver' : '/patient'} replace />
}

export default function App() {
  const { darkMode } = useSettingsStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/patient-select" element={<PatientSelect />} />
        <Route path="/patient-pin/:patientId" element={<PatientPinLogin />} />

        {/* Paciente */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute role="patient">
              <PatientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PatientHome />} />
          <Route path="activity/:type" element={<ActivityRouter />} />
          <Route path="activity-result" element={<ActivityResult />} />
          <Route path="agenda" element={<PatientAgenda />} />
          <Route path="gallery" element={<MemoryGallery />} />
          <Route path="breathing" element={<BreathingExercise />} />
        </Route>

        {/* Cuidador */}
        <Route
          path="/caregiver"
          element={
            <ProtectedRoute role="caregiver">
              <CaregiverLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CaregiverDashboard />} />
          <Route path="patients" element={<PatientList />} />
          <Route path="patients/:patientId" element={<PatientDetail />} />
          <Route path="patients/:patientId/progress" element={<PatientProgress />} />
          <Route path="patients/:patientId/media" element={<ManageMedia />} />
          <Route path="progress" element={<CaregiverProgress />} />
          <Route path="settings" element={<CaregiverSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
