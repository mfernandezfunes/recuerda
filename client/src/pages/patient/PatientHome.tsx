import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/auth.store'
import { useTTS } from '../../hooks/useTTS'
import { ACTIVITY_META } from '../../types'
import type { ActivityType } from '../../types'

const TODAY_ACTIVITIES: ActivityType[] = [
  'MEMORY_CARDS',
  'WHAT_DAY_IS_IT',
  'WHO_IS_THIS',
  'FIND_OBJECT',
  'SERIES_PATTERNS',
  'WORD_SEARCH',
]

export function PatientHome() {
  const patient = useAuthStore((s) => s.patient)
  const { speak } = useTTS()
  const navigate = useNavigate()

  useEffect(() => {
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'buenos días' : hour < 18 ? 'buenas tardes' : 'buenas noches'
    speak(`¡${greeting}, ${patient?.name}! ¿Qué actividad querés hacer hoy?`)
  }, [])

  return (
    <div className="px-5 py-6 space-y-6">
      {/* Saludo */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-black text-[#5C4033]">
          ¡Hola, {patient?.name}! 👋
        </h2>
        <p className="text-lg text-[#8D7061] font-semibold mt-1">¿Qué querés hacer hoy?</p>
      </motion.div>

      {/* Actividades */}
      <div className="grid grid-cols-2 gap-4">
        {TODAY_ACTIVITIES.map((type, i) => {
          const meta = ACTIVITY_META[type]
          return (
            <motion.button
              key={type}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/patient/activity/${type.toLowerCase()}`)}
              className="rounded-3xl p-5 flex flex-col items-center gap-3 shadow-sm active:shadow-none transition-all min-h-[130px] justify-center"
              style={{ backgroundColor: meta.color + '40', border: `2px solid ${meta.color}` }}
            >
              <span className="text-5xl">{meta.icon}</span>
              <span className="text-base font-black text-[#5C4033] text-center leading-tight">
                {meta.label}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* Acciones rápidas */}
      <div className="space-y-3">
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          onClick={() => navigate('/patient/breathing')}
          className="w-full bg-[#D8B4FE40] border-2 border-[#D8B4FE] rounded-3xl py-4 px-5 flex items-center gap-4"
        >
          <span className="text-4xl">🌸</span>
          <div className="text-left">
            <p className="font-black text-[#5C4033] text-lg">Ejercicio de respiración</p>
            <p className="text-[#8D7061] text-sm font-semibold">Un momento de calma</p>
          </div>
        </motion.button>
      </div>
    </div>
  )
}
