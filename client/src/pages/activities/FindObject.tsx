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

interface Option {
  emoji: string
  label: string
  isCorrect: boolean
}

interface FindObjectContent {
  target: { emoji: string; label: string; article: string }
  options: Option[]
  difficulty?: string
}

export function FindObject() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId, addStars } = useSessionStore()
  const { speak } = useTTS()
  const { startTimer, stopTimer } = useActivityTimer()

  const [content, setContent] = useState<FindObjectContent | null>(null)
  const [difficulty, setDifficulty] = useState<string>('EASY')
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<'memorize' | 'find'>('memorize')
  const [countdown, setCountdown] = useState(0)
  const [removedOptions, setRemovedOptions] = useState<string[]>([])
  const [shakeOption, setShakeOption] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    apiClient
      .get('/activities/FIND_OBJECT/content')
      .then((r) => {
        const data = r.data as FindObjectContent
        setContent(data)
        setDifficulty(data.difficulty ?? 'EASY')
      })
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [])

  const MEMORIZE_SECS: Record<string, number> = { EASY: 10, MEDIUM: 7, HARD: 5 }

  useEffect(() => {
    if (!loading && content) {
      startTimer()
      const secs = MEMORIZE_SECS[difficulty] ?? 8
      setCountdown(secs)
      speak(`Mirá bien ${content.target.article} ${content.target.label}. Tenés ${secs} segundos para memorizarlo.`)
    }
  }, [loading, content])

  useEffect(() => {
    if (phase !== 'memorize' || countdown <= 0) return
    if (countdown === 1) {
      const timer = setTimeout(() => {
        setPhase('find')
        speak(`¿Dónde está ${content?.target.article} ${content?.target.label}?`)
      }, 1000)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, phase])

  const handleOptionClick = (option: Option) => {
    if (success || removedOptions.includes(option.label)) return
    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    if (option.isCorrect) {
      setSuccess(true)
      const stars: 1 | 2 | 3 = newAttempts === 1 ? 3 : newAttempts === 2 ? 2 : 1
      addStars(stars)
      const durationSecs = stopTimer()
      if (sessionId) {
        sessionsApi
          .logActivity(sessionId, {
            activityType: 'FIND_OBJECT',
            difficulty,
            starsEarned: stars,
            durationSecs,
          })
          .catch(() => {})
      }
      speak(`¡Muy bien! Esa es ${content?.target.article} ${content?.target.label}`).then(() => {
        navigate('/patient/activity-result', {
          state: { starsEarned: stars, activityType: 'FIND_OBJECT', patientName: patient?.name ?? '' },
        })
      })
    } else {
      setShakeOption(option.label)
      setTimeout(() => {
        setShakeOption(null)
        setRemovedOptions((prev) => [...prev, option.label])
      }, 600)
      speak('Ese no es. Seguí buscando.')
    }
  }

  if (loading) return <LoadingScreen />
  if (!content) return <ErrorScreen message="No se pudo cargar la actividad" />

  const visibleOptions = content.options.filter((o) => !removedOptions.includes(o.label))

  return (
    <div
      className="flex flex-col items-center gap-8 px-6 py-10 min-h-screen"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      <AnimatePresence mode="wait">
        {phase === 'memorize' ? (
          <motion.div
            key="memorize"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 mt-8"
          >
            <p style={{ fontSize: '1.6rem', fontWeight: 900, color: '#5C4033', fontFamily: 'Nunito, sans-serif', textAlign: 'center' }}>
              ¡Memorizá este objeto!
            </p>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{
                fontSize: '8rem',
                padding: '32px',
                backgroundColor: '#FFCBA4',
                borderRadius: '24px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              }}
            >
              {content.target.emoji}
            </motion.div>
            <p style={{ fontSize: '2rem', fontWeight: 900, color: '#8D4E00', fontFamily: 'Nunito, sans-serif' }}>
              {content.target.label}
            </p>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: '#FFF3A3',
                border: '4px solid #F5A623',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 900,
                color: '#8D4E00',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              {countdown}
            </div>
            <p style={{ fontSize: '1rem', color: '#8D7061', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
              segundos para memorizar
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="find"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-8 w-full"
          >
            {/* Instruction */}
            <div className="flex items-center gap-3 mt-4">
              <p style={{ fontSize: '2rem', fontWeight: 900, color: '#5C4033', fontFamily: 'Nunito, sans-serif', textAlign: 'center' }}>
                ¿Dónde está {content.target.article}{' '}
                <span style={{ color: '#8D4E00' }}>{content.target.label}</span>?
              </p>
              <button
                onClick={() => speak(`¿Dónde está ${content.target.article} ${content.target.label}?`)}
                style={{ fontSize: '1.8rem', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                🔊
              </button>
            </div>

            {/* Options */}
            <div className="flex gap-4 flex-wrap justify-center" style={{ maxWidth: '500px' }}>
              <AnimatePresence>
                {visibleOptions.map((opt) => {
                  const isShaking = shakeOption === opt.label
                  const isCorrectSelected = success && opt.isCorrect
                  return (
                    <motion.button
                      key={opt.label}
                      initial={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      animate={
                        isShaking
                          ? { x: [-10, 10, -8, 8, 0] }
                          : isCorrectSelected
                          ? { scale: [1, 1.15, 1] }
                          : { x: 0 }
                      }
                      transition={{ duration: 0.5 }}
                      onClick={() => handleOptionClick(opt)}
                      disabled={success}
                      style={{
                        minHeight: '140px',
                        width: '140px',
                        borderRadius: '20px',
                        backgroundColor: isCorrectSelected ? '#8FBC8F' : '#87CEEB',
                        border: isCorrectSelected ? '4px solid #5C8F5C' : '3px solid transparent',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: success ? 'default' : 'pointer',
                        fontFamily: 'Nunito, sans-serif',
                      }}
                    >
                      <span style={{ fontSize: '4rem' }}>{opt.emoji}</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#5C4033' }}>
                        {opt.label}
                      </span>
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
