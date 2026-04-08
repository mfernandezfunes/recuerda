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

interface SeriesContent {
  sequence: (number | string)[]
  correct: number | string
  options: (number | string)[]
  type?: 'numbers' | 'colors' | 'shapes'
}

const COLOR_MAP: Record<string, string> = {
  rojo: '#FF6B6B',
  azul: '#87CEEB',
  verde: '#8FBC8F',
  amarillo: '#FFF3A3',
  naranja: '#FFCBA4',
  lila: '#D8B4FE',
  rosa: '#FFB6C1',
}

function SequenceItem({ value, isQuestion }: { value: number | string; isQuestion: boolean }) {
  if (isQuestion) {
    return (
      <div
        style={{
          width: 64,
          height: 64,
          border: '3px dashed #8D7061',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          fontWeight: 900,
          color: '#8D7061',
          flexShrink: 0,
        }}
      >
        ?
      </div>
    )
  }

  const strVal = String(value)
  const colorKey = strVal.toLowerCase()
  if (COLOR_MAP[colorKey]) {
    return (
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: COLOR_MAP[colorKey],
          border: '3px solid rgba(0,0,0,0.1)',
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <div
      style={{
        minWidth: 56,
        height: 64,
        borderRadius: '12px',
        backgroundColor: '#FFF3A3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 8px',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#5C4033', fontFamily: 'Nunito, sans-serif' }}>
        {value}
      </span>
    </div>
  )
}

export function SeriesPatterns() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId, addStars } = useSessionStore()
  const { speak } = useTTS()
  const { startTimer, stopTimer } = useActivityTimer()

  const [content, setContent] = useState<SeriesContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState(0)
  const [shakeOption, setShakeOption] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    apiClient
      .get('/activities/SERIES_PATTERNS/content', { params: { difficulty: 'EASY' } })
      .then((r) => setContent(r.data as SeriesContent))
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && content) {
      startTimer()
      speak('¿Qué número sigue en la serie?')
    }
  }, [loading, content, startTimer, speak])

  const handleAnswer = (option: number | string) => {
    if (success) return
    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    if (String(option) === String(content?.correct)) {
      setSuccess(true)
      const stars: 1 | 2 | 3 = newAttempts === 1 ? 3 : newAttempts === 2 ? 2 : 1
      addStars(stars)
      const durationSecs = stopTimer()
      if (sessionId) {
        sessionsApi
          .logActivity(sessionId, {
            activityType: 'SERIES_PATTERNS',
            difficulty: 'EASY',
            starsEarned: stars,
            durationSecs,
          })
          .catch(() => {})
      }
      speak(`¡Muy bien! El número que sigue es ${option}`).then(() => {
        navigate('/patient/activity-result', {
          state: { starsEarned: stars, activityType: 'SERIES_PATTERNS', patientName: patient?.name ?? '' },
        })
      })
    } else {
      setShakeOption(String(option))
      setTimeout(() => setShakeOption(null), 500)
      if (newAttempts >= 3) {
        addStars(1)
        const durationSecs = stopTimer()
        if (sessionId) {
          sessionsApi
            .logActivity(sessionId, {
              activityType: 'SERIES_PATTERNS',
              difficulty: 'EASY',
              starsEarned: 1,
              durationSecs,
            })
            .catch(() => {})
        }
        speak(`¡Lo intentaste! La respuesta era ${content?.correct}`).then(() => {
          navigate('/patient/activity-result', {
            state: { starsEarned: 1, activityType: 'SERIES_PATTERNS', patientName: patient?.name ?? '' },
          })
        })
      } else {
        speak('Mirá bien la serie. ¿Qué patrón ves?')
      }
    }
  }

  if (loading) return <LoadingScreen />
  if (!content) return <ErrorScreen message="No se pudo cargar la actividad" />

  return (
    <div
      className="flex flex-col items-center gap-10 px-6 py-10 min-h-screen"
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
          ¿Qué sigue en la serie?
        </p>
        <button
          onClick={() => speak('¿Qué número sigue en la serie?')}
          style={{ fontSize: '1.8rem', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Escuchar instrucción"
        >
          🔊
        </button>
      </div>

      {/* Sequence */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          padding: '20px',
          backgroundColor: '#FFCBA4',
          borderRadius: '20px',
          minWidth: '280px',
        }}
      >
        {content.sequence.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SequenceItem value={item} isQuestion={String(item) === '?'} />
            {idx < content.sequence.length - 1 && (
              <span style={{ fontSize: '1.4rem', color: '#8D7061', fontWeight: 900 }}>→</span>
            )}
          </div>
        ))}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3 w-full" style={{ maxWidth: '320px' }}>
        {content.options.map((opt) => {
          const isShaking = shakeOption === String(opt)
          return (
            <motion.div
              key={String(opt)}
              animate={isShaking ? { x: [-8, 8, -6, 6, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <BigButton
                label={String(opt)}
                onClick={() => handleAnswer(opt)}
                disabled={success || attempts >= 3}
                color={success && String(opt) === String(content.correct) ? '#8FBC8F' : '#FFF3A3'}
                size="lg"
              />
            </motion.div>
          )
        })}
      </div>

      {attempts > 0 && !success && attempts < 3 && (
        <p style={{ color: '#8D7061', fontSize: '1.1rem', fontFamily: 'Nunito, sans-serif' }}>
          ¡Mirá el patrón! Podés hacerlo.
        </p>
      )}
    </div>
  )
}
