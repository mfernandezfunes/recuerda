import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import apiClient from '../../api/client'
import { useAuthStore } from '../../store/auth.store'
import { useSessionStore } from '../../store/session.store'
import { useTTS } from '../../hooks/useTTS'
import { useActivityTimer } from '../../hooks/useActivityTimer'
import { sessionsApi } from '../../api/sessions.api'
import { FlipCard } from '../../components/activities/FlipCard'
import { LoadingScreen } from '../../components/shared/LoadingScreen'
import { ErrorScreen } from '../../components/shared/ErrorScreen'

interface Pair {
  id: string
  emoji: string
  label: string
}

interface MemoryCard {
  uid: string
  pairId: string
  emoji: string
  label: string
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function MemoryCards() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId, addStars } = useSessionStore()
  const { speak } = useTTS()
  const { startTimer, stopTimer } = useActivityTimer()

  const [cards, setCards] = useState<MemoryCard[]>([])
  const [difficulty, setDifficulty] = useState<string>('EASY')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [flippedIds, setFlippedIds] = useState<string[]>([])
  const [matchedIds, setMatchedIds] = useState<string[]>([])
  const [attempts, setAttempts] = useState(0)
  const [isChecking, setIsChecking] = useState(false)
  const [numPairs, setNumPairs] = useState(3)

  useEffect(() => {
    apiClient
      .get('/activities/MEMORY_CARDS/content', {
        params: { patientId: patient?.id },
      })
      .then((r) => {
        const responseData = r.data as { pairs: Pair[]; difficulty?: string }
        setDifficulty(responseData.difficulty ?? 'EASY')
        const pairs: Pair[] = responseData.pairs
        setNumPairs(pairs.length)
        const doubled: MemoryCard[] = pairs.flatMap((p) => [
          { uid: `${p.id}-a`, pairId: p.id, emoji: p.emoji, label: p.label },
          { uid: `${p.id}-b`, pairId: p.id, emoji: p.emoji, label: p.label },
        ])
        setCards(shuffleArray(doubled))
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [patient?.id])

  useEffect(() => {
    if (!loading && !error) {
      startTimer()
      speak('Encontrá los pares. ¡A darle!')
    }
  }, [loading, error, startTimer, speak])

  const handleCardClick = useCallback(
    (uid: string) => {
      if (isChecking) return
      if (flippedIds.includes(uid)) return
      if (matchedIds.includes(uid)) return
      if (flippedIds.length === 2) return

      const newFlipped = [...flippedIds, uid]
      setFlippedIds(newFlipped)

      if (newFlipped.length === 2) {
        setAttempts((a) => a + 1)
        setIsChecking(true)
        const [id1, id2] = newFlipped
        const card1 = cards.find((c) => c.uid === id1)!
        const card2 = cards.find((c) => c.uid === id2)!

        setTimeout(() => {
          if (card1.pairId === card2.pairId) {
            const newMatched = [...matchedIds, id1, id2]
            setMatchedIds(newMatched)
            setFlippedIds([])
            setIsChecking(false)

            if (newMatched.length === cards.length) {
              const totalAttempts = attempts + 1
              const stars: 1 | 2 | 3 =
                totalAttempts <= numPairs + 2 ? 3 : totalAttempts <= numPairs + 5 ? 2 : 1
              addStars(stars)
              const durationSecs = stopTimer()
              if (sessionId) {
                sessionsApi
                  .logActivity(sessionId, {
                    activityType: 'MEMORY_CARDS',
                    difficulty,
                    starsEarned: stars,
                    durationSecs,
                  })
                  .catch(() => {})
              }
              speak('¡Encontraste todos los pares! ¡Qué memoria!').then(() => {
                navigate('/patient/activity-result', {
                  state: { starsEarned: stars, activityType: 'MEMORY_CARDS', patientName: patient?.name ?? '' },
                })
              })
            }
          } else {
            setFlippedIds([])
            setIsChecking(false)
          }
        }, 1000)
      }
    },
    [
      isChecking,
      flippedIds,
      matchedIds,
      cards,
      attempts,
      numPairs,
      difficulty,
      addStars,
      stopTimer,
      sessionId,
      speak,
      navigate,
      patient?.name,
    ]
  )

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen message="No se pudo cargar la actividad" />

  const cols = cards.length <= 6 ? 3 : 4

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
            Memoria
          </p>
          <button
            onClick={() => speak('Encontrá los pares iguales')}
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

      {/* Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '12px',
          width: '100%',
          maxWidth: '480px',
        }}
      >
        {cards.map((card) => {
          const isFlipped = flippedIds.includes(card.uid)
          const isMatched = matchedIds.includes(card.uid)
          return (
            <FlipCard
              key={card.uid}
              frontContent={<span style={{ fontSize: '2rem' }}>🎴</span>}
              backContent={
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '2.2rem' }}>{card.emoji}</span>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: '#5C4033',
                      fontFamily: 'Nunito, sans-serif',
                      textAlign: 'center',
                    }}
                  >
                    {card.label}
                  </span>
                </div>
              }
              isFlipped={isFlipped}
              isMatched={isMatched}
              onClick={() => handleCardClick(card.uid)}
            />
          )
        })}
      </motion.div>
    </div>
  )
}
