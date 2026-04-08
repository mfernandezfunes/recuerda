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

interface WhatIsMissingContent {
  allItems: Array<{ id: string; emoji: string; label: string }>
  correct: string
  options: string[]
  difficulty?: string
}

export function WhatIsMissing() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId, addStars } = useSessionStore()
  const { speak } = useTTS()
  const { startTimer, stopTimer } = useActivityTimer()

  const [content, setContent] = useState<WhatIsMissingContent | null>(null)
  const [difficulty, setDifficulty] = useState<string>('EASY')
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<'memorize' | 'guess'>('memorize')
  const [attempts, setAttempts] = useState(0)
  const [shakeOption, setShakeOption] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    apiClient
      .get('/activities/WHAT_IS_MISSING/content')
      .then((r) => {
        const data = r.data as WhatIsMissingContent
        setContent(data)
        setDifficulty(data.difficulty ?? 'EASY')
      })
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && content) {
      startTimer()
      speak('¡Recordá todos los objetos!')
    }
  }, [loading, content, startTimer, speak])

  useEffect(() => {
    if (phase === 'memorize') {
      const t = setTimeout(() => setPhase('guess'), 4000)
      return () => clearTimeout(t)
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'guess' && content) {
      speak('¿Qué objeto falta?')
    }
  }, [phase, content, speak])

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
            activityType: 'WHAT_IS_MISSING',
            difficulty,
            starsEarned: stars,
            durationSecs,
          })
          .catch(() => {})
      }
      speak(`¡Muy bien! Faltaba la ${content.correct}`).then(() => {
        navigate('/patient/activity-result', {
          state: { starsEarned: stars, activityType: 'WHAT_IS_MISSING', patientName: patient?.name ?? '' },
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
              activityType: 'WHAT_IS_MISSING',
              difficulty,
              starsEarned: 1,
              durationSecs,
            })
            .catch(() => {})
        }
        speak(`¡Lo intentaste bien! Faltaba ${content?.correct}`).then(() => {
          navigate('/patient/activity-result', {
            state: { starsEarned: 1, activityType: 'WHAT_IS_MISSING', patientName: patient?.name ?? '' },
          })
        })
      } else {
        speak('Pensá bien. ¿Qué objeto no está?')
      }
    }
  }

  if (loading) return <LoadingScreen />
  if (!content) return <ErrorScreen message="No se pudo cargar la actividad" />

  // Memorize: show all items. Guess: replace the missing one with a ? placeholder.
  const gridItems = phase === 'memorize'
    ? content.allItems
    : content.allItems.map((item) =>
        item.label === content.correct
          ? { ...item, emoji: '❓', label: '?' }
          : item
      )

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
          {phase === 'memorize' ? '¡Recordá todos los objetos!' : '¿Qué objeto falta?'}
        </p>
        <button
          onClick={() => speak(phase === 'memorize' ? '¡Recordá todos los objetos!' : '¿Qué objeto falta?')}
          style={{ fontSize: '1.8rem', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Escuchar instrucción"
        >
          🔊
        </button>
      </div>

      {/* Items grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        {gridItems.map((item) => {
          const isMissing = phase === 'guess' && item.label === '?'
          return (
            <div
              key={item.id}
              style={{
                minHeight: '90px',
                minWidth: '80px',
                borderRadius: '16px',
                backgroundColor: isMissing ? 'transparent' : '#FFCBA440',
                border: isMissing ? '3px dashed #8D7061' : '2px solid #FFCBA4',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '8px',
              }}
            >
              <span style={{ fontSize: isMissing ? '2rem' : '2.5rem' }}>{item.emoji}</span>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#8D7061',
                  fontFamily: 'Nunito, sans-serif',
                  textAlign: 'center',
                }}
              >
                {item.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Options — only in guess phase */}
      {phase === 'guess' && (
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
                  label={opt}
                  onClick={() => handleAnswer(opt)}
                  disabled={success || attempts >= 3}
                  color={success && opt === content.correct ? '#8FBC8F' : '#87CEEB40'}
                  size="lg"
                />
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Memorize countdown hint */}
      {phase === 'memorize' && (
        <p style={{ color: '#8D7061', fontSize: '1.1rem', fontFamily: 'Nunito, sans-serif' }}>
          Mirá bien... después te preguntamos 👀
        </p>
      )}

      {phase === 'guess' && attempts > 0 && !success && attempts < 3 && (
        <p style={{ color: '#8D7061', fontSize: '1.1rem', fontFamily: 'Nunito, sans-serif' }}>
          ¡Vos podés! Intentá de nuevo.
        </p>
      )}
    </div>
  )
}
