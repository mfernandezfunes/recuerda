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
import { CaregiverDashboard } from './pages/caregiver/CaregiverDashboard'

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
          <Route path="activity/:type" element={<div className="p-8 text-center text-2xl font-black text-[#5C4033]">Actividad en construcción 🚧</div>} />
          <Route path="agenda" element={<div className="p-8 text-center text-2xl font-black text-[#5C4033]">Mi Agenda 🗓️</div>} />
          <Route path="gallery" element={<div className="p-8 text-center text-2xl font-black text-[#5C4033]">Mis Recuerdos 📷</div>} />
          <Route path="breathing" element={<div className="p-8 text-center text-2xl font-black text-[#5C4033]">Respiración 🌸</div>} />
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
          <Route path="patients" element={<div className="text-center p-8">Pacientes — próximamente</div>} />
          <Route path="progress" element={<div className="text-center p-8">Progreso — próximamente</div>} />
          <Route path="settings" element={<div className="text-center p-8">Configuración — próximamente</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
