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
import { BigButton } from '../../components/ui/BigButton'

interface ProverbsContent {
  firstPart: string
  correct: string
  options: string[]
  difficulty?: string
}

export function Proverbs() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId, addStars } = useSessionStore()
  const { speak } = useTTS()
  const { startTimer, stopTimer } = useActivityTimer()

  const [content, setContent] = useState<ProverbsContent | null>(null)
  const [difficulty, setDifficulty] = useState<string>('EASY')
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState(0)
  const [shakeOption, setShakeOption] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    apiClient
      .get('/activities/PROVERBS/content')
      .then((r) => {
        const data = r.data as ProverbsContent
        setContent(data)
        setDifficulty(data.difficulty ?? 'EASY')
      })
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && content) {
      startTimer()
      speak(`¿Cómo termina el refrán? ${content.firstPart}`)
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
            activityType: 'PROVERBS',
            difficulty,
            starsEarned: stars,
            durationSecs,
          })
          .catch(() => {})
      }
      speak(`¡Muy bien! '${content.firstPart} ${content.correct}'`).then(() => {
        navigate('/patient/activity-result', {
          state: { starsEarned: stars, activityType: 'PROVERBS', patientName: patient?.name ?? '' },
        })
      })
    } else {
      setShakeOption(option)
      setTimeout(() => setShakeOption(null), 600)
      if (newAttempts >= 3) {
        addStars(1)
        const durationSecs = stopTimer()
        if (sessionId) {
          sessionsApi
            .logActivity(sessionId, {
              activityType: 'PROVERBS',
              difficulty,
              starsEarned: 1,
              durationSecs,
            })
            .catch(() => {})
        }
        speak(`¡Lo intentaste! El refrán dice: ${content?.firstPart} ${content?.correct}`).then(() => {
          navigate('/patient/activity-result', {
            state: { starsEarned: 1, activityType: 'PROVERBS', patientName: patient?.name ?? '' },
          })
        })
      } else {
        speak('Pensá un momento. ¿Cómo suena el refrán?')
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
          ¿Cómo termina el refrán?
        </p>
        <button
          onClick={() => speak(`¿Cómo termina el refrán? ${content.firstPart}`)}
          style={{ fontSize: '1.8rem', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Escuchar refrán"
        >
          🔊
        </button>
      </div>

      {/* Proverb first part card */}
      <div
        style={{
          backgroundColor: '#FFF3A3',
          borderRadius: '24px',
          padding: '28px 24px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '1.9rem',
            fontWeight: 900,
            color: '#5C4033',
            fontFamily: 'Nunito, sans-serif',
            lineHeight: 1.3,
          }}
        >
          {content.firstPart}
        </p>
        <p
          style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: '#8D7061',
            fontFamily: 'Nunito, sans-serif',
            marginTop: '8px',
          }}
        >
          ...
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3 w-full" style={{ maxWidth: '440px' }}>
        {content.options.map((opt) => {
          const isShaking = shakeOption === opt
          return (
            <motion.div
              key={opt}
              animate={isShaking ? { x: [-8, 8, -6, 6, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <BigButton
                label={opt}
                onClick={() => handleAnswer(opt)}
                disabled={success || attempts >= 3}
                color={success && opt === content.correct ? '#8FBC8F' : '#D8B4FE40'}
                size="lg"
              />
            </motion.div>
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
