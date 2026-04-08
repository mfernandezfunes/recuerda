import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import apiClient from '../../api/client'
import { useAuthStore } from '../../store/auth.store'
import { useSessionStore } from '../../store/session.store'
import { useTTS } from '../../hooks/useTTS'
import { useActivityTimer } from '../../hooks/useActivityTimer'
import { sessionsApi } from '../../api/sessions.api'
import { BigButton } from '../../components/ui/BigButton'
import { LoadingScreen } from '../../components/shared/LoadingScreen'
import { ErrorScreen } from '../../components/shared/ErrorScreen'

interface SongContent {
  audioUrl: string | null
  lyricFragment: string
  correct: string
  options: string[]
}

export function CompleteSong() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId, addStars } = useSessionStore()
  const { speak } = useTTS()
  const { startTimer, stopTimer } = useActivityTimer()

  const audioRef = useRef<HTMLAudioElement>(null)
  const [content, setContent] = useState<SongContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'correct' | 'try-again' | null>(null)
  const [answered, setAnswered] = useState(false)

  useEffect(() => {
    apiClient
      .get('/activities/COMPLETE_SONG/content', {
        params: { patientId: patient?.id, difficulty: 'EASY' },
      })
      .then((r) => {
        setContent(r.data as SongContent)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [patient?.id])

  useEffect(() => {
    if (!loading && !error) {
      startTimer()
      speak('Escuchá la canción y completá la letra')
    }
  }, [loading, error, startTimer, speak])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onDurationChange = () => setDuration(audio.duration)
    const onEnded = () => setIsPlaying(false)
    const onError = () => setAudioError(true)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [content])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().catch(() => setAudioError(true))
      setIsPlaying(true)
    }
  }

  function handleOptionSelect(option: string) {
    if (answered) return
    setSelectedOption(option)
    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    if (option === content?.correct) {
      setFeedback('correct')
      setAnswered(true)
      const stars: 1 | 2 | 3 = newAttempts === 1 ? 3 : newAttempts === 2 ? 2 : 1
      addStars(stars)
      const durationSecs = stopTimer()
      if (sessionId) {
        sessionsApi
          .logActivity(sessionId, {
            activityType: 'COMPLETE_SONG',
            difficulty: 'EASY',
            starsEarned: stars,
            durationSecs,
          })
          .catch(() => {})
      }
      speak('¡Muy bien! ¡Eso es!').then(() => {
        navigate('/patient/activity-result', {
          state: {
            starsEarned: stars,
            activityType: 'COMPLETE_SONG',
            patientName: patient?.name ?? '',
          },
        })
      })
    } else {
      setFeedback('try-again')
      speak('Casi... probá de nuevo')
      setTimeout(() => {
        setFeedback(null)
        setSelectedOption(null)
      }, 1500)
    }
  }

  function renderLyricWithBlank() {
    if (!content) return null
    const parts = content.lyricFragment.split('___')
    return (
      <p
        style={{
          fontSize: '2rem',
          fontWeight: 900,
          color: '#5C4033',
          fontFamily: 'Nunito, sans-serif',
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        {parts[0]}
        <span
          style={{
            display: 'inline-block',
            borderBottom: '4px solid #FFCBA4',
            minWidth: '120px',
            textAlign: 'center',
            color: feedback === 'correct' ? '#8FBC8F' : '#FFCBA4',
            fontStyle: 'italic',
          }}
        >
          {feedback === 'correct' && selectedOption ? selectedOption : '___'}
        </span>
        {parts[1] ?? ''}
      </p>
    )
  }

  function formatTime(secs: number) {
    if (!isFinite(secs)) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const hasAudio = content?.audioUrl && !audioError

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen message="No se pudo cargar la actividad" />

  return (
    <div
      className="flex flex-col items-center gap-6 px-4 py-8 min-h-screen"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full" style={{ maxWidth: '480px' }}>
        <div className="flex items-center gap-3">
          <p
            style={{
              fontSize: '1.8rem',
              fontWeight: 900,
              color: '#5C4033',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            🎵 Completa la canción
          </p>
          <button
            onClick={() => speak('Escuchá la canción y completá la letra')}
            style={{ fontSize: '1.6rem', background: 'none', border: 'none', cursor: 'pointer' }}
            aria-label="Escuchar instrucción"
          >
            🔊
          </button>
        </div>
        <p
          style={{
            fontSize: '1.1rem',
            color: '#8D7061',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
          }}
        >
          Intentos: {attempts}
        </p>
      </div>

      {/* Audio section */}
      {hasAudio ? (
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#fff',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          {/* Hidden audio element */}
          <audio ref={audioRef} src={content!.audioUrl!} preload="auto" />

          {/* Play button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={togglePlay}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#D8B4FE',
              border: 'none',
              fontSize: '2.2rem',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(216,180,254,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? '⏸' : '▶️'}
          </motion.button>

          {/* Progress bar */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#EEE',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                  backgroundColor: '#D8B4FE',
                  borderRadius: '4px',
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                color: '#8D7061',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#fff',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '3rem' }}>🎵</p>
          <p
            style={{
              fontSize: '1rem',
              color: '#8D7061',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 600,
            }}
          >
            {audioError
              ? 'El audio no está disponible en este momento'
              : 'El cuidador no subió audio todavía'}
          </p>
          <p
            style={{
              fontSize: '0.9rem',
              color: '#BFAA9B',
              fontFamily: 'Nunito, sans-serif',
              marginTop: '4px',
            }}
          >
            Modo práctica — completá la letra
          </p>
        </div>
      )}

      {/* Lyric */}
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#fff',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          textAlign: 'center',
        }}
      >
        {renderLyricWithBlank()}
      </div>

      {/* Feedback */}
      {feedback === 'try-again' && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontSize: '1.2rem',
            color: '#FF922B',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
          }}
        >
          Casi... probá de nuevo 😊
        </motion.p>
      )}

      {/* Options */}
      {!answered && content && (
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <p
            style={{
              fontSize: '1.1rem',
              color: '#5C4033',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            ¿Qué palabra falta?
          </p>
          {content.options.map((option) => (
            <BigButton
              key={option}
              label={option}
              color={selectedOption === option && feedback === 'try-again' ? '#FFE4CC' : '#D8B4FE'}
              onClick={() => handleOptionSelect(option)}
              disabled={answered}
            />
          ))}
        </div>
      )}
    </div>
  )
}
