import { useEffect, useState, useRef } from 'react'
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

  const [difficulty] = useState<string>('EASY')
  const [phase, setPhase] = useState<Phase>('inhala')
  const [cycle, setCycle] = useState(0)
  const [paused, setPaused] = useState(false)
  const [done, setDone] = useState(false)
  const [started, setStarted] = useState(false)

  // Stable refs so the timer effect doesn't re-run when callbacks change identity
  const speakRef = useRef(speak)
  const navigateRef = useRef(navigate)
  const sessionIdRef = useRef(sessionId)
  const addStarsRef = useRef(addStars)
  const stopTimerRef = useRef(stopTimer)
  const patientNameRef = useRef(patient?.name)

  useEffect(() => { speakRef.current = speak })
  useEffect(() => { navigateRef.current = navigate })
  useEffect(() => { sessionIdRef.current = sessionId })
  useEffect(() => { addStarsRef.current = addStars })
  useEffect(() => { stopTimerRef.current = stopTimer })
  useEffect(() => { patientNameRef.current = patient?.name })

  // Handle completion separately, reading from refs
  useEffect(() => {
    if (!done) return
    addStarsRef.current(3)
    const durationSecs = stopTimerRef.current()
    if (sessionIdRef.current) {
      sessionsApi
        .logActivity(sessionIdRef.current, {
          activityType: 'BREATHING',
          difficulty,
          starsEarned: 3,
          durationSecs,
        })
        .catch(() => {})
    }
    speakRef.current('¡Muy bien! Hiciste todos los ciclos de respiración.')
    const t = setTimeout(() => {
      navigateRef.current('/patient/activity-result', {
        state: { starsEarned: 3, activityType: 'BREATHING', patientName: patientNameRef.current ?? '' },
      })
    }, 3000)
    return () => clearTimeout(t)
  }, [done])

  // Timer: only depends on primitive state values — never recreated by callback identity changes
  useEffect(() => {
    if (!started || paused || done) return

    const config = PHASE_CONFIG[phase]
    speakRef.current(config.label)

    const timer = setTimeout(() => {
      const phaseIdx = PHASES.indexOf(phase)
      const isLastPhase = phaseIdx === PHASES.length - 1

      if (isLastPhase) {
        const newCycle = cycle + 1
        if (newCycle >= TOTAL_CYCLES) {
          setDone(true)
          return
        }
        setCycle(newCycle)
      }

      setPhase(PHASES[(phaseIdx + 1) % PHASES.length])
    }, config.duration * 1000)

    return () => clearTimeout(timer)
  }, [phase, paused, done, started, cycle])

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
