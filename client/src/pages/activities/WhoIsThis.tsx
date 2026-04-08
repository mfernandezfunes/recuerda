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

interface WhoIsThisContent {
  member: { name: string; relation: string; photoUrl?: string }
  options: string[]
  difficulty?: string
}

function playSuccessSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(523, ctx.currentTime)
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15)
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.6)
  } catch {
    // AudioContext not available
  }
}

export function WhoIsThis() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId, addStars } = useSessionStore()
  const { speak } = useTTS()
  const { startTimer, stopTimer } = useActivityTimer()

  const [content, setContent] = useState<WhoIsThisContent | null>(null)
  const [difficulty, setDifficulty] = useState<string>('EASY')
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState(0)
  const [success, setSuccess] = useState(false)
  const [shakePhoto, setShakePhoto] = useState(false)

  useEffect(() => {
    apiClient
      .get('/activities/WHO_IS_THIS/content', {
        params: { patientId: patient?.id },
      })
      .then((r) => {
        const data = r.data as WhoIsThisContent
        setContent(data)
        setDifficulty(data.difficulty ?? 'EASY')
      })
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [patient?.id])

  useEffect(() => {
    if (!loading && content) {
      startTimer()
      speak(`¿Quién es esta persona?`)
    }
  }, [loading, content, startTimer, speak])

  const handleAnswer = (option: string) => {
    if (success) return
    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    if (option === content?.member.name) {
      setSuccess(true)
      playSuccessSound()
      const stars: 1 | 2 | 3 = newAttempts === 1 ? 3 : newAttempts === 2 ? 2 : 1
      addStars(stars)
      const durationSecs = stopTimer()
      if (sessionId) {
        sessionsApi
          .logActivity(sessionId, {
            activityType: 'WHO_IS_THIS',
            difficulty,
            starsEarned: stars,
            durationSecs,
          })
          .catch(() => {})
      }
      speak(`¡Muy bien! Es ${content?.member.name}`).then(() => {
        navigate('/patient/activity-result', {
          state: { starsEarned: stars, activityType: 'WHO_IS_THIS', patientName: patient?.name ?? '' },
        })
      })
    } else {
      setShakePhoto(true)
      setTimeout(() => setShakePhoto(false), 600)
      if (newAttempts >= 3) {
        // After 3 attempts, advance with 1 star
        addStars(1)
        const durationSecs = stopTimer()
        if (sessionId) {
          sessionsApi
            .logActivity(sessionId, {
              activityType: 'WHO_IS_THIS',
              difficulty,
              starsEarned: 1,
              durationSecs,
            })
            .catch(() => {})
        }
        speak(`¡Igual lo intentaste muy bien! Es ${content?.member.name}`).then(() => {
          navigate('/patient/activity-result', {
            state: { starsEarned: 1, activityType: 'WHO_IS_THIS', patientName: patient?.name ?? '' },
          })
        })
      } else {
        speak('Mirá bien la foto. ¿Quién será?')
      }
    }
  }

  if (loading) return <LoadingScreen />
  if (!content) return <ErrorScreen message="No se pudo cargar la actividad" />

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 py-8"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      {/* Instruction */}
      <div className="flex items-center gap-3">
        <p
          style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: '#5C4033',
            fontFamily: 'Nunito, sans-serif',
            textAlign: 'center',
          }}
        >
          ¿Quién es esta persona?
        </p>
        <button
          onClick={() => speak('¿Quién es esta persona?')}
          style={{
            fontSize: '1.8rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
          }}
          aria-label="Escuchar instrucción"
        >
          🔊
        </button>
      </div>

      {/* Photo */}
      <motion.div
        animate={shakePhoto ? { x: [-10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: 200,
          height: 200,
          borderRadius: '50%',
          overflow: 'hidden',
          border: success ? '6px solid #8FBC8F' : '4px solid #FFCBA4',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFCBA4',
          flexShrink: 0,
        }}
      >
        {content.member.photoUrl ? (
          <img
            src={content.member.photoUrl}
            alt="Familiar"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: '6rem' }}>👤</span>
        )}
      </motion.div>

      {/* Options */}
      <div className="flex flex-col gap-3 w-full" style={{ maxWidth: '340px' }}>
        {content.options.map((opt) => (
          <BigButton
            key={opt}
            label={opt}
            onClick={() => handleAnswer(opt)}
            disabled={success || attempts >= 3}
            color={success && opt === content.member.name ? '#8FBC8F' : '#FFCBA4'}
            size="lg"
          />
        ))}
      </div>

      {attempts > 0 && !success && attempts < 3 && (
        <p style={{ color: '#8D7061', fontSize: '1.1rem', fontFamily: 'Nunito, sans-serif' }}>
          Intentá de nuevo, ¡vos podés!
        </p>
      )}
    </div>
  )
}
