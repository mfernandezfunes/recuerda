import { useAuthStore } from '../../store/auth.store'

export function CaregiverDashboard() {
  const caregiver = useAuthStore((s) => s.caregiver)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#5C4033]">
          Hola, {caregiver?.name} 👋
        </h2>
        <p className="text-[#8D7061] font-semibold">Panel de cuidador</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: '👥', label: 'Pacientes', desc: 'Gestionar pacientes', color: '#87CEEB' },
          { icon: '📊', label: 'Progreso', desc: 'Ver estadísticas', color: '#C8E6C8' },
          { icon: '🖼️', label: 'Fotos y audio', desc: 'Subir contenido', color: '#FFCBA4' },
          { icon: '⚙️', label: 'Actividades', desc: 'Configurar dificultad', color: '#FFF3A3' },
        ].map((item) => (
          <button
            key={item.label}
            className="rounded-2xl p-5 flex flex-col gap-3 text-left shadow-sm active:scale-95 transition-all"
            style={{ backgroundColor: item.color + '40', border: `2px solid ${item.color}` }}
          >
            <span className="text-4xl">{item.icon}</span>
            <div>
              <p className="font-black text-[#5C4033]">{item.label}</p>
              <p className="text-xs text-[#8D7061] font-semibold">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
