import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { useSettingsStore } from '../store/settings.store'
import { useTTS } from '../hooks/useTTS'
import { useMedicationAlarm } from '../hooks/useMedicationAlarm'
import { MedicationAlarmModal } from '../components/patient/MedicationAlarmModal'

const NAV_ITEMS = [
  { path: '/patient', icon: '🏠', label: 'Inicio' },
  { path: '/patient/agenda', icon: '🗓️', label: 'Agenda' },
  { path: '/patient/gallery', icon: '📷', label: 'Recuerdos' },
  { path: '/patient/breathing', icon: '🌸', label: 'Calma' },
]

export function PatientLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const patient = useAuthStore((s) => s.patient)
  const logout = useAuthStore((s) => s.logout)
  const { darkMode, ttsEnabled, toggleTts } = useSettingsStore()
  const { stop } = useTTS()

  const { alarmActive, currentMed, dismissAlarm } = useMedicationAlarm(patient?.id)

  const now = new Date()
  const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  function handleLogout() {
    stop()
    logout()
    navigate('/login')
  }

  return (
    <div className={`min-h-dvh flex flex-col ${darkMode ? 'bg-[#1C1A2E]' : 'bg-[#FFF8F0]'}`}>
      {/* Header */}
      <header className={`safe-top px-5 pt-4 pb-3 flex items-center justify-between ${darkMode ? 'bg-[#2A2840]' : 'bg-white'} shadow-sm`}>
        <div>
          <p className={`text-sm font-bold capitalize ${darkMode ? 'text-[#F5E6C8]' : 'text-[#8D7061]'}`}>{dateStr}</p>
          <p className={`text-xl font-black ${darkMode ? 'text-[#F5E6C8]' : 'text-[#5C4033]'}`}>{timeStr} hs</p>
          {patient?.name && (
            <p className={`text-base font-bold mt-0.5 ${darkMode ? 'text-[#C8B4A0]' : 'text-[#8D7061]'}`}>
              Hola, <span className={`font-black ${darkMode ? 'text-[#F5E6C8]' : 'text-[#5C4033]'}`}>{patient.name}</span> 👋
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTts}
            className={`text-2xl p-2 rounded-xl transition-all ${ttsEnabled ? 'bg-[#C8E6C8]' : 'bg-gray-100'}`}
            aria-label={ttsEnabled ? 'Desactivar voz' : 'Activar voz'}
          >
            {ttsEnabled ? '🔊' : '🔇'}
          </button>
          <button
            onClick={handleLogout}
            className={`text-2xl p-2 rounded-xl transition-all ${darkMode ? 'bg-[#3A3858]' : 'bg-gray-100'}`}
            aria-label="Cerrar sesión"
          >
            🚪
          </button>
          {patient?.photoUrl ? (
            <img src={patient.photoUrl} alt={patient.name} className="w-10 h-10 rounded-full object-cover border-2 border-[#FFCBA4]" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#FFCBA4] flex items-center justify-center text-xl">👤</div>
          )}
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Navegación inferior */}
      <nav className={`safe-bottom ${darkMode ? 'bg-[#2A2840]' : 'bg-white'} shadow-lg border-t ${darkMode ? 'border-[#3A3858]' : 'border-[#FFE4CC]'}`}>
        <div className="flex justify-around py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => { stop(); navigate(item.path) }}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all min-w-[60px] ${
                  isActive
                    ? darkMode ? 'bg-[#3A3858]' : 'bg-[#FFF3A3]'
                    : ''
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className={`text-xs font-bold ${
                  isActive
                    ? darkMode ? 'text-[#F5E6C8]' : 'text-[#5C4033]'
                    : darkMode ? 'text-[#9C8C7A]' : 'text-[#8D7061]'
                }`}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Medication alarm modal - rendered above everything */}
      {alarmActive && currentMed && (
        <MedicationAlarmModal medication={currentMed} onDismiss={dismissAlarm} />
      )}
    </div>
  )
}
