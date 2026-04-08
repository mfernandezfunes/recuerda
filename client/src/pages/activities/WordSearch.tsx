import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../../api/client'
import { useAuthStore } from '../../store/auth.store'
import { useSessionStore } from '../../store/session.store'
import { useTTS } from '../../hooks/useTTS'
import { useActivityTimer } from '../../hooks/useActivityTimer'
import { sessionsApi } from '../../api/sessions.api'
import { WordGrid } from '../../components/activities/WordGrid'
import { LoadingScreen } from '../../components/shared/LoadingScreen'
import { ErrorScreen } from '../../components/shared/ErrorScreen'

interface WordSearchContent {
  grid: string[][]
  words: string[]
  theme: string
}

export function WordSearch() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId, addStars } = useSessionStore()
  const { speak } = useTTS()
  const { startTimer, stopTimer } = useActivityTimer()

  const [content, setContent] = useState<WordSearchContent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient
      .get('/activities/WORD_SEARCH/content', { params: { difficulty: 'EASY' } })
      .then((r) => setContent(r.data as WordSearchContent))
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && content) {
      startTimer()
      speak(`Encontrá las palabras de ${content.theme}`)
    }
  }, [loading, content, startTimer, speak])

  const handleComplete = () => {
    const elapsed = stopTimer()
    // Stars based on time: fast (<60s)=3, normal(<120s)=2, slow=1
    const stars: 1 | 2 | 3 = elapsed < 60 ? 3 : elapsed < 120 ? 2 : 1
    addStars(stars)
    if (sessionId) {
      sessionsApi
        .logActivity(sessionId, {
          activityType: 'WORD_SEARCH',
          difficulty: 'EASY',
          starsEarned: stars,
          durationSecs: elapsed,
        })
        .catch(() => {})
    }
    speak('¡Encontraste todas las palabras! ¡Excelente!').then(() => {
      navigate('/patient/activity-result', {
        state: { starsEarned: stars, activityType: 'WORD_SEARCH', patientName: patient?.name ?? '' },
      })
    })
  }

  if (loading) return <LoadingScreen />
  if (!content) return <ErrorScreen message="No se pudo cargar la actividad" />

  return (
    <div
      className="flex flex-col items-center gap-6 px-4 py-8 min-h-screen"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      {/* Instruction */}
      <div className="flex items-center gap-3">
        <p
          style={{
            fontSize: '1.8rem',
            fontWeight: 900,
            color: '#5C4033',
            fontFamily: 'Nunito, sans-serif',
            textAlign: 'center',
          }}
        >
          Encontrá las palabras de{' '}
          <span style={{ color: '#8D4E00' }}>{content.theme}</span>
        </p>
        <button
          onClick={() => speak(`Encontrá las palabras de ${content.theme}`)}
          style={{ fontSize: '1.6rem', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Escuchar instrucción"
        >
          🔊
        </button>
      </div>

      <WordGrid
        grid={content.grid}
        words={content.words}
        onWordFound={(w) => speak(`¡Encontraste ${w}!`)}
        onComplete={handleComplete}
      />
    </div>
  )
}
