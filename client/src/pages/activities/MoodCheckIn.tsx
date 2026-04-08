import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import apiClient from '../../api/client'
import { useAuthStore } from '../../store/auth.store'
import { useSessionStore } from '../../store/session.store'
import { useTTS } from '../../hooks/useTTS'

interface MoodOption {
  emoji: string
  label: string
  value: string
  color: string
}

const MOODS: MoodOption[] = [
  { emoji: '😄', label: 'Muy bien', value: 'VERY_HAPPY', color: '#FFF3A3' },
  { emoji: '🙂', label: 'Bien', value: 'HAPPY', color: '#8FBC8F' },
  { emoji: '😐', label: 'Regular', value: 'NEUTRAL', color: '#87CEEB' },
  { emoji: '😴', label: 'Cansado', value: 'TIRED', color: '#D8B4FE' },
  { emoji: '😟', label: 'Preocupado', value: 'ANXIOUS', color: '#FFCBA4' },
]

export function MoodCheckIn() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId } = useSessionStore()
  const { speak } = useTTS()
  const [selected, setSelected] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    speak('¿Cómo te sentís hoy?')
  }, [speak])

  const handleSelect = async (mood: MoodOption) => {
    if (saved) return
    setSelected(mood.value)

    try {
      await apiClient.post('/mood', {
        patientId: patient?.id,
        mood: mood.value,
        sessionId: sessionId ?? undefined,
      })
    } catch {
      // Offline — still continue
    }

    setSaved(true)
    speak(`Gracias. Me alegra saber que estás ${mood.label.toLowerCase()}.`).then(() => {
      navigate('/patient')
    })
  }

  return (
    <div
      className="flex flex-col items-center gap-8 px-6 py-10 min-h-screen"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      {/* Question */}
      <div className="flex items-center gap-3 mt-4">
        <p
          style={{
            fontSize: '2.2rem',
            fontWeight: 900,
            color: '#5C4033',
            fontFamily: 'Nunito, sans-serif',
            textAlign: 'center',
          }}
        >
          ¿Cómo te sentís hoy?
        </p>
        <button
          onClick={() => speak('¿Cómo te sentís hoy?')}
          style={{ fontSize: '1.8rem', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Escuchar pregunta"
        >
          🔊
        </button>
      </div>

      {saved ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="flex flex-col items-center gap-4"
        >
          <span style={{ fontSize: '5rem' }}>💚</span>
          <p
            style={{
              fontSize: '2rem',
              fontWeight: 900,
              color: '#5C4033',
              fontFamily: 'Nunito, sans-serif',
              textAlign: 'center',
            }}
          >
            ¡Gracias por contarnos!
          </p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-3 w-full" style={{ maxWidth: '360px' }}>
          {MOODS.map((mood, idx) => (
            <motion.button
              key={mood.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(mood)}
              disabled={saved}
              style={{
                minHeight: '90px',
                borderRadius: '20px',
                backgroundColor: selected === mood.value ? mood.color : '#FFF8F0',
                border: selected === mood.value ? `4px solid #5C4033` : `3px solid ${mood.color}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px 20px',
                cursor: 'pointer',
                fontFamily: 'Nunito, sans-serif',
                width: '100%',
              }}
            >
              <span style={{ fontSize: '2.5rem' }}>{mood.emoji}</span>
              <span
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  color: '#5C4033',
                }}
              >
                {mood.label}
              </span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}
