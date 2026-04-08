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

interface OddOneOutContent {
  items: Array<{ emoji: string; label: string }>
  correct: string
  categoryName: string
  difficulty?: string
}

export function OddOneOut() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId, addStars } = useSessionStore()
  const { speak } = useTTS()
  const { startTimer, stopTimer } = useActivityTimer()

  const [content, setContent] = useState<OddOneOutContent | null>(null)
  const [difficulty, setDifficulty] = useState<string>('EASY')
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState(0)
  const [shakeOption, setShakeOption] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [correctSelected, setCorrectSelected] = useState<string | null>(null)

  useEffect(() => {
    apiClient
      .get('/activities/ODD_ONE_OUT/content')
      .then((r) => {
        const data = r.data as OddOneOutContent
        setContent(data)
        setDifficulty(data.difficulty ?? 'EASY')
      })
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && content) {
      startTimer()
      speak('¿Cuál no pertenece al grupo?')
    }
  }, [loading, content, startTimer, speak])

  const handleAnswer = (label: string) => {
    if (success) return
    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    if (label === content?.correct) {
      setSuccess(true)
      setCorrectSelected(label)
      const stars: 1 | 2 | 3 = newAttempts === 1 ? 3 : newAttempts === 2 ? 2 : 1
      addStars(stars)
      const durationSecs = stopTimer()
      if (sessionId) {
        sessionsApi
          .logActivity(sessionId, {
            activityType: 'ODD_ONE_OUT',
            difficulty,
            starsEarned: stars,
            durationSecs,
          })
          .catch(() => {})
      }
      speak(`¡Correcto! ${content.correct} no es ${content.categoryName}`).then(() => {
        navigate('/patient/activity-result', {
          state: { starsEarned: stars, activityType: 'ODD_ONE_OUT', patientName: patient?.name ?? '' },
        })
      })
    } else {
      setShakeOption(label)
      setTimeout(() => setShakeOption(null), 600)
      if (newAttempts >= 3) {
        addStars(1)
        const durationSecs = stopTimer()
        if (sessionId) {
          sessionsApi
            .logActivity(sessionId, {
              activityType: 'ODD_ONE_OUT',
              difficulty,
              starsEarned: 1,
              durationSecs,
            })
            .catch(() => {})
        }
        speak(`¡Lo intentaste! El que no pertenece es ${content?.correct}`).then(() => {
          navigate('/patient/activity-result', {
            state: { starsEarned: 1, activityType: 'ODD_ONE_OUT', patientName: patient?.name ?? '' },
          })
        })
      } else {
        speak('Mirá bien los grupos')
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
      {/* Instruction */}
      <div className="flex items-center gap-3 mt-4">
        <p
          style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: '#5C4033',
            fontFamily: 'Nunito, sans-serif',
            textAlign: 'center',
          }}
        >
          ¿Cuál no pertenece al grupo?
        </p>
        <button
          onClick={() => speak('¿Cuál no pertenece al grupo?')}
          style={{ fontSize: '1.8rem', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Escuchar instrucción"
        >
          🔊
        </button>
      </div>

      {/* 2x2 grid of items */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          width: '100%',
          maxWidth: '360px',
        }}
      >
        {content.items.map((item) => {
          const isShaking = shakeOption === item.label
          const isCorrectItem = correctSelected === item.label
          return (
            <motion.button
              key={item.label}
              animate={isShaking ? { x: [-8, 8, -6, 6, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => handleAnswer(item.label)}
              disabled={success || attempts >= 3}
              style={{
                minHeight: '110px',
                borderRadius: '20px',
                backgroundColor: isCorrectItem ? '#8FBC8F' : '#FFCBA440',
                border: isCorrectItem ? '4px solid #5C8F5C' : '2px solid #FFCBA4',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: success || attempts >= 3 ? 'default' : 'pointer',
                fontFamily: 'Nunito, sans-serif',
                padding: '12px',
              }}
            >
              <span style={{ fontSize: '3rem' }}>{item.emoji}</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#5C4033' }}>{item.label}</span>
            </motion.button>
          )
        })}
      </div>

      {attempts > 0 && !success && attempts < 3 && (
        <p style={{ color: '#8D7061', fontSize: '1.1rem', fontFamily: 'Nunito, sans-serif' }}>
          ¡Mirá bien! ¿Cuál es diferente?
        </p>
      )}
    </div>
  )
}
