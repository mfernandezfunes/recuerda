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

interface WhatIsThisObjectContent {
  emoji: string
  correct: string
  options: string[]
  difficulty?: string
}

export function WhatIsThisObject() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId, addStars } = useSessionStore()
  const { speak } = useTTS()
  const { startTimer, stopTimer } = useActivityTimer()

  const [content, setContent] = useState<WhatIsThisObjectContent | null>(null)
  const [difficulty, setDifficulty] = useState('EASY')
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState(0)
  const [shake, setShake] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    apiClient
      .get('/activities/WHAT_IS_THIS_OBJECT/content')
      .then((r) => {
        const data = r.data as WhatIsThisObjectContent
        setContent(data)
        setDifficulty(data.difficulty ?? 'EASY')
      })
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && content) {
      startTimer()
      speak('¿Qué es esto?')
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
          .logActivity(sessionId, { activityType: 'WHAT_IS_THIS_OBJECT', difficulty, starsEarned: stars, durationSecs })
          .catch(() => {})
      }
      speak(`¡Muy bien! Es ${content.correct}`).then(() => {
        navigate('/patient/activity-result', {
          state: { starsEarned: stars, activityType: 'WHAT_IS_THIS_OBJECT', patientName: patient?.name ?? '' },
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
            .logActivity(sessionId, { activityType: 'WHAT_IS_THIS_OBJECT', difficulty, starsEarned: 1, durationSecs })
            .catch(() => {})
        }
        speak(`¡Lo intentaste! Es ${content.correct}`).then(() => {
          navigate('/patient/activity-result', {
            state: { starsEarned: 1, activityType: 'WHAT_IS_THIS_OBJECT', patientName: patient?.name ?? '' },
          })
        })
      } else {
        speak('Ese no es. ¿Qué es esto?')
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
        <p style={{ fontSize: '2.2rem', fontWeight: 900, color: '#5C4033', fontFamily: 'Nunito, sans-serif' }}>
          ¿Qué es esto?
        </p>
        <button
          onClick={() => speak('¿Qué es esto?')}
          style={{ fontSize: '1.8rem', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          🔊
        </button>
      </div>

      {/* Imagen (emoji grande) */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
        style={{
          fontSize: '10rem',
          lineHeight: 1,
          padding: '24px 32px',
          backgroundColor: '#FFCBA440',
          borderRadius: 28,
          border: '4px solid #FFCBA4',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}
      >
        {content.emoji}
      </motion.div>

      {/* Opciones de palabras */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          width: '100%',
          maxWidth: 360,
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
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAnswer(opt)}
              disabled={!!selected || attempts >= 3}
              style={{
                height: 72,
                borderRadius: 20,
                backgroundColor: isCorrect ? '#8FBC8F' : '#87CEEB40',
                border: isCorrect ? '4px solid #5C8F5C' : '3px solid #87CEEB',
                fontSize: '1.5rem',
                fontWeight: 900,
                color: '#5C4033',
                fontFamily: 'Nunito, sans-serif',
                cursor: selected || attempts >= 3 ? 'default' : 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            >
              {opt}
            </motion.button>
          )
        })}
      </div>

      {attempts > 0 && !selected && attempts < 3 && (
        <p style={{ color: '#8D7061', fontSize: '1.1rem', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
          ¡Mirá bien la imagen!
        </p>
      )}
    </div>
  )
}
