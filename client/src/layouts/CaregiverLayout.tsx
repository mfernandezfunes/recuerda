import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'

const NAV_ITEMS = [
  { path: '/caregiver', icon: '🏠', label: 'Inicio', exact: true },
  { path: '/caregiver/patients', icon: '👥', label: 'Pacientes' },
  { path: '/caregiver/progress', icon: '📊', label: 'Progreso' },
  { path: '/caregiver/settings', icon: '⚙️', label: 'Config' },
]

export function CaregiverLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { caregiver, logout } = useAuthStore()

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧠</span>
          <div>
            <h1 className="text-lg font-black text-[#5C4033] leading-none">Recuerda</h1>
            <p className="text-xs text-[#8D7061] font-semibold">{caregiver?.name}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="text-sm font-bold text-[#8D7061] bg-gray-100 px-4 py-2 rounded-xl hover:bg-gray-200 transition-all"
        >
          Salir
        </button>
      </header>

      {/* Nav (desktop: sidebar, mobile: bottom) */}
      {/* Mobile top nav */}
      <nav className="bg-white border-b border-gray-100 overflow-x-auto">
        <div className="flex min-w-max px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path) && item.path !== '/caregiver'

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-[#8FBC8F] text-[#5C4033]'
                    : 'border-transparent text-[#8D7061] hover:text-[#5C4033]'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
