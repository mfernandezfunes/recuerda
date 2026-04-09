import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { StarReward } from '../../components/ui/StarReward'
import { BigButton } from '../../components/ui/BigButton'
import { useTTS } from '../../hooks/useTTS'
import { ConfettiEffect } from '../../components/patient/ConfettiEffect'

interface ResultState {
  starsEarned: 1 | 2 | 3
  activityType: string
  patientName: string
}

const MESSAGES = [
  '¡Lo lograste!',
  '¡Sos increíble!',
  '¡Muy bien!',
  '¡Qué bien lo hiciste!',
]

export function ActivityResult() {
  const location = useLocation()
  const navigate = useNavigate()
  const { speak } = useTTS()
  const state = location.state as ResultState | null

  const stars = (state?.starsEarned ?? 2) as 1 | 2 | 3
  const name = state?.patientName ?? ''
  const msg = name
    ? `¡Muy bien, ${name}! ¡Lo lograste!`
    : MESSAGES[Math.floor(Math.random() * MESSAGES.length)]

  useEffect(() => {
    const timer = setTimeout(() => speak(msg), 600)
    return () => clearTimeout(timer)
  }, [speak, msg])

  useEffect(() => {
    const timer = setTimeout(() => navigate('/patient'), 8000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-10 px-6"
      style={{
        background: 'linear-gradient(160deg, #FFF8F0 0%, #FFCBA4 50%, #D8B4FE 100%)',
      }}
    >
      <ConfettiEffect active={stars === 3} />
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      >
        <StarReward stars={stars} patientName={name} />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        style={{
          fontSize: '2rem',
          fontWeight: 900,
          color: '#5C4033',
          fontFamily: 'Nunito, sans-serif',
          textAlign: 'center',
        }}
      >
        {msg}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.5 }}
        className="flex flex-col gap-4 w-full"
        style={{ maxWidth: '320px' }}
      >
        {state?.activityType && (
          <BigButton
            label="Jugar de nuevo"
            emoji="🔄"
            color="#8FBC8F"
            onClick={() => navigate(`/patient/activity/${state.activityType.toLowerCase()}`, { replace: true })}
            size="lg"
          />
        )}
        <BigButton
          label="Otra actividad"
          emoji="🎯"
          color="#87CEEB"
          onClick={() => navigate('/patient')}
          size="lg"
        />
        <BigButton
          label="Descansar un momento"
          emoji="😌"
          color="#D8B4FE"
          onClick={() => navigate('/patient')}
          size="lg"
        />
      </motion.div>

      <p
        style={{
          fontSize: '1rem',
          color: '#8D7061',
          fontFamily: 'Nunito, sans-serif',
          marginTop: '8px',
        }}
      >
        Volviendo automáticamente en unos segundos...
      </p>
    </div>
  )
}
