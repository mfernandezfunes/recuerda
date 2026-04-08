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

interface SimpleMathContent {
  questionText: string
  a: number
  b: number
  operation: '+' | '-'
  correct: number
  options: number[]
}

const APPLE_EMOJI = '🍎'

export function SimpleMath() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId, addStars } = useSessionStore()
  const { speak } = useTTS()
  const { startTimer, stopTimer } = useActivityTimer()

  const [content, setContent] = useState<SimpleMathContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState(0)
  const [shakeOption, setShakeOption] = useState<number | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    apiClient
      .get('/activities/SIMPLE_MATH/content', { params: { difficulty: 'EASY' } })
      .then((r) => setContent(r.data as SimpleMathContent))
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && content) {
      startTimer()
      speak(`¿Cuánto es? ${content.questionText.replace('?', '')}`)
    }
  }, [loading, content, startTimer, speak])

  const handleAnswer = (option: number) => {
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
            activityType: 'SIMPLE_MATH',
            difficulty: 'EASY',
            starsEarned: stars,
            durationSecs,
          })
          .catch(() => {})
      }
      speak(`¡Exacto! ${content.questionText.replace('?', String(content.correct))}`).then(() => {
        navigate('/patient/activity-result', {
          state: { starsEarned: stars, activityType: 'SIMPLE_MATH', patientName: patient?.name ?? '' },
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
              activityType: 'SIMPLE_MATH',
              difficulty: 'EASY',
              starsEarned: 1,
              durationSecs,
            })
            .catch(() => {})
        }
        speak(`¡Lo intentaste! La respuesta es ${content?.correct}`).then(() => {
          navigate('/patient/activity-result', {
            state: { starsEarned: 1, activityType: 'SIMPLE_MATH', patientName: patient?.name ?? '' },
          })
        })
      } else {
        speak('Pensá de nuevo. ¿Cuánto es?')
      }
    }
  }

  if (loading) return <LoadingScreen />
  if (!content) return <ErrorScreen message="No se pudo cargar la actividad" />

  const showVisual = content.a <= 5 && content.b <= 5
  const aEmojis = Array.from({ length: content.a }, (_, i) => i)
  const bEmojis = Array.from({ length: content.b }, (_, i) => i)

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
          ¿Cuánto es?
        </p>
        <button
          onClick={() => speak(`¿Cuánto es? ${content.questionText.replace('?', '')}`)}
          style={{ fontSize: '1.8rem', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Escuchar pregunta"
        >
          🔊
        </button>
      </div>

      {/* Question card */}
      <div
        style={{
          backgroundColor: '#FFF3A3',
          borderRadius: '24px',
          padding: '28px 36px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          width: '100%',
          maxWidth: '360px',
        }}
      >
        <p
          style={{
            fontSize: '3.5rem',
            fontWeight: 900,
            color: '#5C4033',
            fontFamily: 'Nunito, sans-serif',
            lineHeight: 1,
          }}
        >
          {content.questionText}
        </p>

        {/* Visual emoji representation */}
        {showVisual && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '4px' }}>
              {aEmojis.map((i) => (
                <span key={`a-${i}`} style={{ fontSize: '1.8rem' }}>{APPLE_EMOJI}</span>
              ))}
              {content.operation === '+' && (
                <span style={{ fontSize: '1.8rem', margin: '0 4px' }}>➕</span>
              )}
              {content.operation === '-' && (
                <span style={{ fontSize: '1.8rem', margin: '0 4px' }}>➖</span>
              )}
              {bEmojis.map((i) => (
                <span key={`b-${i}`} style={{ fontSize: '1.8rem' }}>{APPLE_EMOJI}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3 w-full" style={{ maxWidth: '320px' }}>
        {content.options.map((opt) => {
          const isShaking = shakeOption === opt
          return (
            <motion.div
              key={opt}
              animate={isShaking ? { x: [-8, 8, -6, 6, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <BigButton
                label={String(opt)}
                onClick={() => handleAnswer(opt)}
                disabled={success || attempts >= 3}
                color={success && opt === content.correct ? '#8FBC8F' : '#C8E6C8'}
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
