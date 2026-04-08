import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import apiClient from '../../api/client'
import { useAuthStore } from '../../store/auth.store'
import { useTTS } from '../../hooks/useTTS'
import { BigButton } from '../../components/ui/BigButton'
import { LoadingScreen } from '../../components/shared/LoadingScreen'

interface MediaFile {
  id: string
  url: string
  label?: string
  type: string
}

export function MemoryGallery() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { speak } = useTTS()

  const [photos, setPhotos] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    apiClient
      .get('/media', { params: { patientId: patient?.id } })
      .then((r) => {
        const all = r.data as MediaFile[]
        setPhotos(all.filter((m) => m.type === 'IMAGE'))
      })
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false))
  }, [patient?.id])

  useEffect(() => {
    if (photos.length > 0 && photos[currentIndex]) {
      const label = photos[currentIndex].label
      if (label) {
        speak(label)
      }
    }
  }, [currentIndex, photos, speak])

  const goNext = () => {
    setDirection(1)
    setCurrentIndex((i) => Math.min(i + 1, photos.length - 1))
  }

  const goPrev = () => {
    setDirection(-1)
    setCurrentIndex((i) => Math.max(i - 1, 0))
  }

  if (loading) return <LoadingScreen message="Cargando tus recuerdos..." />

  if (photos.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-8 px-6"
        style={{ backgroundColor: '#FFF8F0' }}
      >
        <span style={{ fontSize: '5rem' }}>📷</span>
        <p
          style={{
            fontSize: '1.8rem',
            fontWeight: 900,
            color: '#5C4033',
            fontFamily: 'Nunito, sans-serif',
            textAlign: 'center',
            maxWidth: '380px',
          }}
        >
          Tu cuidador todavía no subió fotos. ¡Pedile que lo haga!
        </p>
        <div style={{ width: '240px' }}>
          <BigButton label="Volver" emoji="🏠" onClick={() => navigate('/patient')} size="lg" />
        </div>
      </div>
    )
  }

  const current = photos[currentIndex]

  return (
    <div
      className="flex flex-col items-center gap-6 px-4 py-8 min-h-screen"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      <p
        style={{
          fontSize: '2rem',
          fontWeight: 900,
          color: '#5C4033',
          fontFamily: 'Nunito, sans-serif',
        }}
      >
        Mis recuerdos 📷
      </p>

      {/* Photo display */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '24px',
          aspectRatio: '4/3',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ x: direction * 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <img
              src={current.url}
              alt={current.label ?? 'Recuerdo'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Label */}
      {current.label && (
        <div className="flex items-center gap-2">
          <p
            style={{
              fontSize: '1.6rem',
              fontWeight: 900,
              color: '#5C4033',
              fontFamily: 'Nunito, sans-serif',
              textAlign: 'center',
            }}
          >
            {current.label}
          </p>
          <button
            onClick={() => current.label && speak(current.label!)}
            style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
            aria-label="Escuchar nombre"
          >
            🔊
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-4 items-center">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goPrev}
          disabled={currentIndex === 0}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: currentIndex === 0 ? '#E8D8CC' : '#FFCBA4',
            border: 'none',
            fontSize: '2rem',
            cursor: currentIndex === 0 ? 'default' : 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            opacity: currentIndex === 0 ? 0.5 : 1,
          }}
        >
          ◀
        </motion.button>

        <p style={{ color: '#8D7061', fontSize: '1.1rem', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
          {currentIndex + 1} / {photos.length}
        </p>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goNext}
          disabled={currentIndex === photos.length - 1}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: currentIndex === photos.length - 1 ? '#E8D8CC' : '#FFCBA4',
            border: 'none',
            fontSize: '2rem',
            cursor: currentIndex === photos.length - 1 ? 'default' : 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            opacity: currentIndex === photos.length - 1 ? 0.5 : 1,
          }}
        >
          ▶
        </motion.button>
      </div>

      <div style={{ width: '240px' }}>
        <BigButton label="Volver" emoji="🏠" onClick={() => navigate('/patient')} color="#D8B4FE" size="lg" />
      </div>
    </div>
  )
}
