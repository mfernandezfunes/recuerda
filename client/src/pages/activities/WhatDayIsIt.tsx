import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import apiClient from '../../api/client'
import { useAuthStore } from '../../store/auth.store'
import { useSessionStore } from '../../store/session.store'
import { useTTS } from '../../hooks/useTTS'
import { useActivityTimer } from '../../hooks/useActivityTimer'
import { sessionsApi } from '../../api/sessions.api'
import { LoadingScreen } from '../../components/shared/LoadingScreen'
import { ErrorScreen } from '../../components/shared/ErrorScreen'

interface WhatDayContent {
  question: string
  correct: string
  options: string[]
}

const DAY_ICONS: Record<string, string> = {
  Lunes: '🌙',
  Martes: '🔴',
  Miércoles: '💚',
  Jueves: '⚡',
  Viernes: '🎉',
  Sábado: '☀️',
  Domingo: '🌟',
}

export function WhatDayIsIt() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId, addStars } = useSessionStore()
  const { speak } = useTTS()
  const { startTimer, stopTimer } = useActivityTimer()

  const [content, setContent] = useState<WhatDayContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState(0)
  const [selectedWrong, setSelectedWrong] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    apiClient
      .get('/activities/WHAT_DAY_IS_IT/content', { params: { difficulty: 'EASY' } })
      .then((r) => setContent(r.data as WhatDayContent))
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && content) {
      startTimer()
      speak(content.question)
    }
  }, [loading, content, startTimer, speak])

  const handleAnswer = (option: string) => {
    if (success) return
    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    if (option === content?.correct) {
      setSuccess(true)
      const stars: 1 | 2 | 3 = newAttempts === 1 ? 3 : newAttempts === 2 ? 2 : 1
      addStars(stars)
      const durationSecs = stopTimer()
      if (sessionId) {
        sessionsApi
          .logActivity(sessionId, {
            activityType: 'WHAT_DAY_IS_IT',
            difficulty: 'EASY',
            starsEarned: stars,
            durationSecs,
          })
          .catch(() => {})
      }
      speak(`¡Correcto! Hoy es ${option}`)
      setTimeout(() => {
        navigate('/patient/activity-result', {
          state: { starsEarned: stars, activityType: 'WHAT_DAY_IS_IT', patientName: patient?.name ?? '' },
        })
      }, 1500)
    } else {
      setSelectedWrong(option)
      setTimeout(() => setSelectedWrong(null), 600)
      if (newAttempts >= 3) {
        addStars(1)
        const durationSecs = stopTimer()
        if (sessionId) {
          sessionsApi
            .logActivity(sessionId, {
              activityType: 'WHAT_DAY_IS_IT',
              difficulty: 'EASY',
              starsEarned: 1,
              durationSecs,
            })
            .catch(() => {})
        }
        speak(`¡Igual lo intentaste bien! Hoy es ${content?.correct}`)
        setTimeout(() => {
          navigate('/patient/activity-result', {
            state: { starsEarned: 1, activityType: 'WHAT_DAY_IS_IT', patientName: patient?.name ?? '' },
          })
        }, 2000)
      } else {
        speak('Pensá bien. ¿Qué día es hoy?')
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
      {/* Question */}
      <div className="flex items-center gap-3 mt-4">
        <p
          style={{
            fontSize: '2.2rem',
            fontWeight: 900,
            color: '#5C4033',
            fontFamily: 'Nunito, sans-serif',
            textAlign: 'center',
          }}
        >
          {content.question}
        </p>
        <button
          onClick={() => speak(content.question)}
          style={{ fontSize: '1.8rem', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Escuchar pregunta"
        >
          🔊
        </button>
      </div>

      {/* Options grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          width: '100%',
          maxWidth: '440px',
        }}
      >
        {content.options.map((opt) => {
          const icon = DAY_ICONS[opt] ?? '📅'
          const isWrong = selectedWrong === opt
          const isCorrect = success && opt === content.correct
          return (
            <motion.button
              key={opt}
              animate={isWrong ? { x: [-8, 8, -6, 6, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => handleAnswer(opt)}
              disabled={success || attempts >= 3}
              style={{
                minHeight: '100px',
                borderRadius: '20px',
                backgroundColor: isCorrect ? '#8FBC8F' : '#FFF3A3',
                border: isCorrect ? '4px solid #5C8F5C' : '3px solid transparent',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: success || attempts >= 3 ? 'default' : 'pointer',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              <span style={{ fontSize: '2.5rem' }}>{icon}</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#5C4033' }}>{opt}</span>
            </motion.button>
          )
        })}
      </div>

      {attempts > 0 && !success && attempts < 3 && (
        <p style={{ color: '#8D7061', fontSize: '1.1rem', fontFamily: 'Nunito, sans-serif' }}>
          ¡Vos podés! Intentá de nuevo.
        </p>
      )}
    </div>
  )
}
