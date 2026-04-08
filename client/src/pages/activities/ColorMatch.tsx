import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import apiClient from '../../api/client'
import { useAuthStore } from '../../store/auth.store'
import { useSessionStore } from '../../store/session.store'
import { useTTS } from '../../hooks/useTTS'
import { useActivityTimer } from '../../hooks/useActivityTimer'
import { sessionsApi } from '../../api/sessions.api'
import { LoadingScreen } from '../../components/shared/LoadingScreen'
import { ErrorScreen } from '../../components/shared/ErrorScreen'

interface ColorMatchContent {
  targetColor: { name: string; hex: string }
  options: string[]
  correct: string
  difficulty?: string
}

export function ColorMatch() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId, addStars } = useSessionStore()
  const { speak } = useTTS()
  const { startTimer, stopTimer } = useActivityTimer()

  const [content, setContent] = useState<ColorMatchContent | null>(null)
  const [difficulty, setDifficulty] = useState('EASY')
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState(0)
  const [shake, setShake] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    apiClient
      .get('/activities/COLOR_MATCH/content')
      .then((r) => {
        const data = r.data as ColorMatchContent
        setContent(data)
        setDifficulty(data.difficulty ?? 'EASY')
      })
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && content) {
      startTimer()
      speak('¿Cómo se llama este color?')
    }
  }, [loading, content])

  function handleAnswer(option: string) {
    if (!content || selected) return
    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    if (option === content.correct) {
      setSelected(option)
      const stars: 1 | 2 | 3 = newAttempts === 1 ? 3 : newAttempts === 2 ? 2 : 1
      addStars(stars)
      const durationSecs = stopTimer()
      if (sessionId) {
        sessionsApi
          .logActivity(sessionId, { activityType: 'COLOR_MATCH', difficulty, starsEarned: stars, durationSecs })
          .catch(() => {})
      }
      speak(`¡Correcto! Es el color ${content.correct}`).then(() => {
        navigate('/patient/activity-result', {
          state: { starsEarned: stars, activityType: 'COLOR_MATCH', patientName: patient?.name ?? '' },
        })
      })
    } else {
      setShake(option)
      setTimeout(() => setShake(null), 600)
      if (newAttempts >= 3) {
        addStars(1)
        const durationSecs = stopTimer()
        if (sessionId) {
          sessionsApi
            .logActivity(sessionId, { activityType: 'COLOR_MATCH', difficulty, starsEarned: 1, durationSecs })
            .catch(() => {})
        }
        speak(`¡Lo intentaste! El color es ${content.correct}`).then(() => {
          navigate('/patient/activity-result', {
            state: { starsEarned: 1, activityType: 'COLOR_MATCH', patientName: patient?.name ?? '' },
          })
        })
      } else {
        speak('Ese no es. ¿Cuál es el nombre de este color?')
      }
    }
  }

  if (loading) return <LoadingScreen />
  if (!content) return <ErrorScreen message="No se pudo cargar la actividad" />

  return (
    <div
      className="flex flex-col items-center gap-8 px-6 py-10 min-h-screen"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      {/* Instrucción */}
      <div className="flex items-center gap-3 mt-4">
        <p style={{ fontSize: '2rem', fontWeight: 900, color: '#5C4033', fontFamily: 'Nunito, sans-serif', textAlign: 'center' }}>
          ¿Cómo se llama este color?
        </p>
        <button
          onClick={() => speak('¿Cómo se llama este color?')}
          style={{ fontSize: '1.8rem', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          🔊
        </button>
      </div>

      {/* Color grande */}
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
        style={{
          width: 180,
          height: 180,
          borderRadius: '50%',
          backgroundColor: content.targetColor.hex,
          boxShadow: `0 8px 40px ${content.targetColor.hex}88`,
          border: '6px solid rgba(255,255,255,0.6)',
        }}
      />

      {/* Opciones */}
      <AnimatePresence>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: content.options.length <= 3 ? `repeat(${content.options.length}, 1fr)` : 'repeat(2, 1fr)',
            gap: 14,
            width: '100%',
            maxWidth: 380,
          }}
        >
          {content.options.map((opt) => {
            const isCorrect = selected === opt
            const isShaking = shake === opt
            return (
              <motion.button
                key={opt}
                animate={isShaking ? { x: [-8, 8, -6, 6, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => handleAnswer(opt)}
                disabled={!!selected || attempts >= 3}
                style={{
                  height: 72,
                  borderRadius: 20,
                  backgroundColor: isCorrect ? '#8FBC8F' : '#FFCBA4',
                  border: isCorrect ? '4px solid #5C8F5C' : '2px solid #E8A070',
                  fontSize: '1.4rem',
                  fontWeight: 900,
                  color: '#5C4033',
                  fontFamily: 'Nunito, sans-serif',
                  cursor: selected || attempts >= 3 ? 'default' : 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                {opt}
              </motion.button>
            )
          })}
        </div>
      </AnimatePresence>

      {attempts > 0 && !selected && attempts < 3 && (
        <p style={{ color: '#8D7061', fontSize: '1.1rem', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
          ¡Mirá bien el color! ¿Cómo se llama?
        </p>
      )}
    </div>
  )
}
