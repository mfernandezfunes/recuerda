import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/auth.store'
import { useSessionStore } from '../../store/session.store'
import { useTTS } from '../../hooks/useTTS'
import { sessionsApi } from '../../api/sessions.api'
import apiClient from '../../api/client'
import { ACTIVITY_META } from '../../types'
import type { ActivityType } from '../../types'
import { getLevel } from '../../utils/levels'

const ALL_ACTIVITIES: ActivityType[] = [
  'MEMORY_CARDS', 'WHAT_DAY_IS_IT', 'WHO_IS_THIS', 'FIND_OBJECT',
  'SERIES_PATTERNS', 'WORD_SEARCH', 'COMPLETE_SONG', 'ORDER_STORY',
  'SIMPLE_PUZZLE', 'COLORING', 'WHAT_IS_MISSING', 'PROVERBS',
  'ODD_ONE_OUT', 'SIMPLE_MATH', 'SUDOKU', 'COLOR_MATCH', 'WHAT_IS_THIS_OBJECT',
]

export function PatientHome() {
  const patient = useAuthStore((s) => s.patient)
  const { setSession, clearSession, setLifetimeStats, lifetimeStars, lifetimeActivities, streak } = useSessionStore()
  const { speak } = useTTS()
  const navigate = useNavigate()
  const [enabledActivities, setEnabledActivities] = useState<ActivityType[]>(ALL_ACTIVITIES)

  // Load enabled activities
  useEffect(() => {
    if (!patient?.id) return
    apiClient.get('/patient/activity-settings')
      .then((r) => {
        const settings = r.data as { activityType: ActivityType; enabled: boolean; order: number }[]
        const enabled = settings
          .filter((s) => s.enabled && ALL_ACTIVITIES.includes(s.activityType))
          .sort((a, b) => a.order - b.order)
          .map((s) => s.activityType)
        if (enabled.length > 0) setEnabledActivities(enabled)
      })
      .catch(() => {})
  }, [patient?.id])

  // Load lifetime stats
  useEffect(() => {
    if (!patient?.id) return
    apiClient.get('/patient/stats')
      .then((r) => {
        setLifetimeStats(r.data as { totalStars: number; activitiesCompleted: number; streak: number })
      })
      .catch(() => {})
  }, [patient?.id])

  // Session lifecycle
  useEffect(() => {
    if (!patient?.id) return

    let sid: string | null = null

    sessionsApi.startSession(patient.id)
      .then((r) => {
        sid = r.data.sessionId
        setSession(sid)
      })
      .catch(() => {})

    return () => {
      if (sid) {
        sessionsApi.endSession(sid).catch(() => {})
        clearSession()
      }
    }
  }, [patient?.id])

  // Greeting TTS
  useEffect(() => {
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'buenos días' : hour < 18 ? 'buenas tardes' : 'buenas noches'
    speak(`¡${greeting}, ${patient?.name}! ¿Qué actividad querés hacer hoy?`)
  }, [])

  const hour = new Date().getHours()
  const greetingText =
    hour < 12 ? '¡Buenos días' : hour < 18 ? '¡Buenas tardes' : '¡Buenas noches'

  const level = getLevel(lifetimeStars)

  return (
    <div className="px-5 py-6 space-y-6">
      {/* Saludo cálido */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-black text-[#5C4033]">
          {greetingText}, {patient?.name}! 👋
        </h2>
        <p className="text-lg text-[#8D7061] font-semibold mt-1">
          Estamos felices de verte. ¿Qué actividad querés hacer hoy?
        </p>
      </motion.div>

      {/* Tarjeta de nivel y puntuación */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          backgroundColor: level.color + '50',
          border: `2px solid ${level.color}`,
          borderRadius: 24,
          padding: '16px 20px',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '2rem' }}>{level.emoji}</span>
            <div>
              <p style={{ fontSize: '1rem', fontWeight: 900, color: '#5C4033', fontFamily: 'Nunito, sans-serif' }}>
                Nivel {level.number} — {level.name}
              </p>
              <p style={{ fontSize: '0.85rem', color: '#8D7061', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
                {lifetimeStars} ⭐ totales · {lifetimeActivities} actividades
              </p>
            </div>
          </div>
          {streak > 0 && (
            <div
              style={{
                backgroundColor: '#FFCBA4',
                borderRadius: 14,
                padding: '6px 12px',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '1.2rem', fontWeight: 900, color: '#5C4033', fontFamily: 'Nunito, sans-serif', lineHeight: 1 }}>
                🔥 {streak}
              </p>
              <p style={{ fontSize: '0.7rem', color: '#8D7061', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                días
              </p>
            </div>
          )}
        </div>

        {/* Barra de progreso al siguiente nivel */}
        {level.number < 5 && (
          <div>
            <div
              style={{
                height: 10,
                backgroundColor: '#E5E7EB',
                borderRadius: 99,
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${level.progress}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                style={{
                  height: '100%',
                  backgroundColor: level.color.replace('50', ''),
                  borderRadius: 99,
                }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: '#8D7061', fontFamily: 'Nunito, sans-serif', fontWeight: 600, marginTop: 4 }}>
              {level.progress}% hacia Nivel {level.number + 1}
            </p>
          </div>
        )}
        {level.number === 5 && (
          <p style={{ fontSize: '0.85rem', color: '#5C4033', fontFamily: 'Nunito, sans-serif', fontWeight: 800, textAlign: 'center' }}>
            ¡Nivel máximo alcanzado! 👑
          </p>
        )}
      </motion.div>

      {/* Actividades */}
      <div className="grid grid-cols-2 gap-4">
        {enabledActivities.map((type, i) => {
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

        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          onClick={() => navigate('/patient/activity/mood_checkin')}
          className="w-full bg-[#FFCBA440] border-2 border-[#FFCBA4] rounded-3xl py-4 px-5 flex items-center gap-4"
        >
          <span className="text-4xl">😊</span>
          <div className="text-left">
            <p className="font-black text-[#5C4033] text-lg">¿Cómo me sentís hoy?</p>
            <p className="text-[#8D7061] text-sm font-semibold">Contanos cómo estás</p>
          </div>
        </motion.button>
      </div>
    </div>
  )
}
