import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { patientsApi } from '../../api/patients.api'
import type { Patient } from '../../types'

interface Alert {
  id: string
  patientId: string
  patientName: string
  type: 'inactivity' | 'low_mood' | 'other'
  message: string
}

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

export function CaregiverDashboard() {
  const caregiver = useAuthStore((s) => s.caregiver)
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await patientsApi.list()
        const list: Patient[] = Array.isArray(res.data) ? res.data : []
        setPatients(list)

        // Fetch alerts for all patients
        const allAlerts: Alert[] = []
        await Promise.all(
          list.map(async (p) => {
            try {
              const aRes = await patientsApi.getAlerts(p.id)
              const pAlerts = Array.isArray(aRes.data) ? aRes.data : []
              pAlerts.forEach((a: Omit<Alert, 'patientName'>) => {
                allAlerts.push({ ...a, patientId: p.id, patientName: p.name })
              })
            } catch {
              // ignore per-patient alert failures
            }
          })
        )
        setAlerts(allAlerts)
      } catch {
        // API not reachable — keep empty
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-black text-[#5C4033]">
          {greeting()}, {caregiver?.name} 👋
        </h2>
        <p className="text-[#8D7061] font-semibold text-sm">Panel de cuidador</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center border border-gray-100">
          <p className="text-3xl font-black text-[#8FBC8F]">{patients.length}</p>
          <p className="text-xs font-bold text-[#5C4033] mt-1">Pacientes</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center border border-gray-100">
          <p className="text-3xl font-black text-[#87CEEB]">—</p>
          <p className="text-xs font-bold text-[#5C4033] mt-1">Último acceso</p>
        </div>
        <div
          className={`rounded-2xl p-4 shadow-sm text-center border ${
            alerts.length > 0
              ? 'bg-orange-50 border-orange-200'
              : 'bg-white border-gray-100'
          }`}
        >
          <p
            className={`text-3xl font-black ${
              alerts.length > 0 ? 'text-orange-500' : 'text-[#FFF3A3]'
            }`}
          >
            {alerts.length}
          </p>
          <p className="text-xs font-bold text-[#5C4033] mt-1">Alertas</p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-black text-[#5C4033] text-sm uppercase tracking-wide">
            Alertas pendientes
          </h3>
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 flex items-start gap-3"
            >
              <span className="text-xl mt-0.5">
                {alert.type === 'inactivity' ? '😴' : alert.type === 'low_mood' ? '😔' : '⚠️'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#5C4033] text-sm">{alert.patientName}</p>
                <p className="text-xs text-orange-700 mt-0.5">{alert.message}</p>
              </div>
              <span className="bg-orange-400 text-white text-xs font-bold px-2 py-1 rounded-full shrink-0">
                {alert.type === 'inactivity' ? 'Inactividad' : 'Ánimo bajo'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Patients list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-[#5C4033] text-sm uppercase tracking-wide">
            Mis pacientes
          </h3>
          <button
            onClick={() => navigate('/caregiver/patients')}
            className="text-xs font-bold text-[#8FBC8F] hover:underline"
          >
            Ver todos →
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-[#8D7061] font-semibold text-sm">
            Cargando pacientes…
          </div>
        ) : patients.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
            <p className="text-4xl mb-2">👥</p>
            <p className="font-bold text-[#5C4033]">Sin pacientes todavía</p>
            <p className="text-sm text-[#8D7061] mt-1">
              Agregá tu primer paciente desde la sección Pacientes
            </p>
            <button
              onClick={() => navigate('/caregiver/patients')}
              className="mt-4 bg-[#8FBC8F] text-white font-bold rounded-xl px-5 py-2 text-sm"
            >
              Ir a Pacientes
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {patients.map((patient) => {
              const patientAlerts = alerts.filter((a) => a.patientId === patient.id)
              return (
                <div
                  key={patient.id}
                  className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-3"
                >
                  {patient.photoUrl ? (
                    <img
                      src={patient.photoUrl}
                      alt={patient.name}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#FFCBA4] flex items-center justify-center text-xl shrink-0">
                      👤
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[#5C4033]">{patient.name}</p>
                    {(patient as Patient & { birthDate?: string }).birthDate && (
                      <p className="text-xs text-[#8D7061] font-semibold">
                        {calcAge((patient as Patient & { birthDate?: string }).birthDate!)} años
                      </p>
                    )}
                  </div>
                  {patientAlerts.length > 0 && (
                    <span className="bg-orange-400 text-white text-xs font-bold px-2 py-1 rounded-full shrink-0">
                      {patientAlerts.length} alerta{patientAlerts.length > 1 ? 's' : ''}
                    </span>
                  )}
                  <button
                    onClick={() => navigate(`/caregiver/patients/${patient.id}`)}
                    className="bg-[#8FBC8F] text-white font-bold rounded-xl px-3 py-2 text-sm shrink-0"
                  >
                    Ver detalle
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick access */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: '👥', label: 'Pacientes', desc: 'Gestionar pacientes', color: '#87CEEB', path: '/caregiver/patients' },
          { icon: '📊', label: 'Progreso', desc: 'Ver estadísticas', color: '#C8E6C8', path: '/caregiver/patients' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="rounded-2xl p-5 flex flex-col gap-3 text-left shadow-sm active:scale-95 transition-all border-2"
            style={{ backgroundColor: item.color + '40', borderColor: item.color }}
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
