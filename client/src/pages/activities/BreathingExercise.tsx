import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/auth.store'
import { useSessionStore } from '../../store/session.store'
import { useTTS } from '../../hooks/useTTS'
import { useActivityTimer } from '../../hooks/useActivityTimer'
import { sessionsApi } from '../../api/sessions.api'
import { BigButton } from '../../components/ui/BigButton'

type Phase = 'inhala' | 'sostén' | 'exhala'

const PHASE_CONFIG: Record<Phase, { label: string; duration: number; size: number; color: string }> = {
  inhala: { label: 'Inhala', duration: 4, size: 200, color: '#D8B4FE' },
  sostén: { label: 'Sostén', duration: 2, size: 200, color: '#87CEEB' },
  exhala: { label: 'Exhala', duration: 6, size: 100, color: '#8FBC8F' },
}

const PHASES: Phase[] = ['inhala', 'sostén', 'exhala']
const TOTAL_CYCLES = 3

export function BreathingExercise() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId, addStars } = useSessionStore()
  const { speak } = useTTS()
  const { startTimer, stopTimer } = useActivityTimer()

  const [phase, setPhase] = useState<Phase>('inhala')
  const [cycle, setCycle] = useState(0)
  const [paused, setPaused] = useState(false)
  const [done, setDone] = useState(false)
  const [started, setStarted] = useState(false)

  const handleComplete = useCallback(() => {
    setDone(true)
    addStars(3)
    const durationSecs = stopTimer()
    if (sessionId) {
      sessionsApi
        .logActivity(sessionId, {
          activityType: 'BREATHING',
          difficulty: 'EASY',
          starsEarned: 3,
          durationSecs,
        })
        .catch(() => {})
    }
    speak('¡Muy bien! Hiciste todos los ciclos de respiración.')
    setTimeout(() => {
      navigate('/patient/activity-result', {
        state: { starsEarned: 3, activityType: 'BREATHING', patientName: patient?.name ?? '' },
      })
    }, 3000)
  }, [addStars, stopTimer, sessionId, speak, navigate, patient?.name])

  useEffect(() => {
    if (!started || paused || done) return

    const config = PHASE_CONFIG[phase]
    speak(config.label)

    const timer = setTimeout(() => {
      const phaseIdx = PHASES.indexOf(phase)
      const nextPhaseIdx = (phaseIdx + 1) % PHASES.length
      const nextPhase = PHASES[nextPhaseIdx]

      if (phaseIdx === PHASES.length - 1) {
        // completed a cycle
        const newCycle = cycle + 1
        if (newCycle >= TOTAL_CYCLES) {
          handleComplete()
          return
        }
        setCycle(newCycle)
      }

      setPhase(nextPhase)
    }, config.duration * 1000)

    return () => clearTimeout(timer)
  }, [phase, paused, done, started, cycle, speak, handleComplete])

  const handleStart = () => {
    setStarted(true)
    startTimer()
    speak('Inhala')
  }

  const currentConfig = PHASE_CONFIG[phase]

  if (!started) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-10 px-6"
        style={{ backgroundColor: '#FFF8F0' }}
      >
        <span style={{ fontSize: '4rem' }}>🌸</span>
        <p
          style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: '#5C4033',
            fontFamily: 'Nunito, sans-serif',
            textAlign: 'center',
          }}
        >
          Ejercicio de respiración
        </p>
        <p
          style={{
            fontSize: '1.4rem',
            color: '#8D7061',
            fontFamily: 'Nunito, sans-serif',
            textAlign: 'center',
            maxWidth: '340px',
          }}
        >
          Vamos a hacer 3 ciclos de respiración. Seguí el círculo.
        </p>
        <div style={{ width: '260px' }}>
          <BigButton label="Empezar" emoji="🌸" color="#D8B4FE" onClick={handleStart} size="lg" />
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-8 px-6"
        style={{ backgroundColor: '#FFF8F0' }}
      >
        <span style={{ fontSize: '5rem' }}>🌟</span>
        <p
          style={{
            fontSize: '2.2rem',
            fontWeight: 900,
            color: '#5C4033',
            fontFamily: 'Nunito, sans-serif',
            textAlign: 'center',
          }}
        >
          ¡Muy bien!
        </p>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-10 px-6"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      {/* Cycle indicator */}
      <p
        style={{
          fontSize: '1.2rem',
          color: '#8D7061',
          fontFamily: 'Nunito, sans-serif',
          fontWeight: 700,
        }}
      >
        Ciclo {cycle + 1} de {TOTAL_CYCLES}
      </p>

      {/* Animated circle */}
      <div style={{ position: 'relative', width: '240px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ width: phase === 'inhala' ? 100 : 200, height: phase === 'inhala' ? 100 : 200 }}
            animate={{
              width: currentConfig.size,
              height: currentConfig.size,
              opacity: phase === 'sostén' ? [1, 0.7, 1, 0.7, 1] : 1,
            }}
            transition={{
              duration: currentConfig.duration,
              ease: phase === 'inhala' ? 'easeIn' : phase === 'exhala' ? 'easeOut' : 'linear',
              opacity: phase === 'sostén' ? { duration: currentConfig.duration, repeat: 0 } : undefined,
            }}
            style={{
              borderRadius: '50%',
              backgroundColor: currentConfig.color,
              boxShadow: `0 0 40px ${currentConfig.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
            }}
          >
            <span
              style={{
                fontSize: '1.8rem',
                fontWeight: 900,
                color: '#5C4033',
                fontFamily: 'Nunito, sans-serif',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              {currentConfig.label}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Phase label */}
      <p
        style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          color: '#5C4033',
          fontFamily: 'Nunito, sans-serif',
        }}
      >
        {currentConfig.label}
      </p>

      {/* Pause button */}
      <div style={{ width: '200px' }}>
        <BigButton
          label={paused ? 'Continuar' : 'Pausar'}
          emoji={paused ? '▶' : '⏸'}
          color="#FFF3A3"
          onClick={() => setPaused((p) => !p)}
          size="md"
        />
      </div>
    </div>
  )
}
