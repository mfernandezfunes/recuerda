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

interface WordBuilderContent {
  mother: string
  hidden: string
  tiles: string[]
  showFirstLetter: boolean
  difficulty?: string
}

export function WordBuilder() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId, addStars } = useSessionStore()
  const { speak } = useTTS()
  const { startTimer, stopTimer } = useActivityTimer()

  const [content, setContent] = useState<WordBuilderContent | null>(null)
  const [difficulty, setDifficulty] = useState('EASY')
  const [loading, setLoading] = useState(true)

  // Tiles: each has a letter, an index (unique), and whether it's been used
  const [usedTileIndices, setUsedTileIndices] = useState<number[]>([])
  // The letters placed in the answer slots
  const [placed, setPlaced] = useState<Array<{ letter: string; tileIdx: number } | null>>([])
  // Which tile is shaking (wrong tap)
  const [shakingIdx, setShakingIdx] = useState<number | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [solved, setSolved] = useState(false)

  useEffect(() => {
    apiClient
      .get('/activities/WORD_BUILDER/content')
      .then((r) => {
        const data = r.data as WordBuilderContent
        setContent(data)
        setDifficulty(data.difficulty ?? 'EASY')
        // Pre-fill first slot if showFirstLetter
        const slots = Array(data.hidden.length).fill(null)
        if (data.showFirstLetter) {
          // Find the first tile that matches the first letter of hidden
          const firstLetter = data.hidden[0]
          const tileIdx = data.tiles.findIndex((t) => t === firstLetter)
          if (tileIdx !== -1) {
            slots[0] = { letter: firstLetter, tileIdx }
            setUsedTileIndices([tileIdx])
          }
        }
        setPlaced(slots)
      })
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && content) {
      startTimer()
      speak('Encontrá la palabra escondida usando las letras de arriba')
    }
  }, [loading, content])

  // Find the next empty slot index
  function nextEmptySlot(slots: typeof placed): number {
    return slots.findIndex((s) => s === null)
  }

  function handleTileTap(tileIdx: number) {
    if (!content || solved) return
    if (usedTileIndices.includes(tileIdx)) return

    const letter = content.tiles[tileIdx]
    const slotIdx = nextEmptySlot(placed)
    if (slotIdx === -1) return

    const expectedLetter = content.hidden[slotIdx]

    if (letter === expectedLetter) {
      // Correct
      const newPlaced = [...placed]
      newPlaced[slotIdx] = { letter, tileIdx }
      setPlaced(newPlaced)
      setUsedTileIndices([...usedTileIndices, tileIdx])

      // Check if complete
      if (newPlaced.every((s) => s !== null)) {
        const newAttempts = attempts + 1
        const stars: 1 | 2 | 3 = newAttempts <= 1 ? 3 : newAttempts <= 3 ? 2 : 1
        setSolved(true)
        addStars(stars)
        const durationSecs = stopTimer()
        if (sessionId) {
          sessionsApi
            .logActivity(sessionId, { activityType: 'WORD_BUILDER', difficulty, starsEarned: stars, durationSecs })
            .catch(() => {})
        }
        speak(`¡Muy bien! La palabra es ${content.hidden}`).then(() => {
          navigate('/patient/activity-result', {
            state: { starsEarned: stars, activityType: 'WORD_BUILDER', patientName: patient?.name ?? '' },
          })
        })
      }
    } else {
      // Wrong — shake the tile
      setAttempts((a) => a + 1)
      setShakingIdx(tileIdx)
      setTimeout(() => setShakingIdx(null), 500)
      speak('Esa no es. Seguí buscando.')
    }
  }

  // Remove the last placed letter (undo)
  function handleUndo() {
    if (!content || solved) return
    // Find the last filled slot that is not the pre-filled first letter
    const startSlot = content.showFirstLetter ? 1 : 0
    let lastFilledIdx = -1
    for (let i = placed.length - 1; i >= startSlot; i--) {
      if (placed[i] !== null) { lastFilledIdx = i; break }
    }
    if (lastFilledIdx === -1) return

    const tileIdx = placed[lastFilledIdx]!.tileIdx
    const newPlaced = [...placed]
    newPlaced[lastFilledIdx] = null
    setPlaced(newPlaced)
    setUsedTileIndices(usedTileIndices.filter((i) => i !== tileIdx))
  }

  if (loading) return <LoadingScreen />
  if (!content) return <ErrorScreen message="No se pudo cargar la actividad" />

  const filledCount = placed.filter(Boolean).length
  const totalSlots = content.hidden.length

  return (
    <div
      className="flex flex-col items-center gap-6 px-5 py-8 min-h-screen"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      {/* Instrucción */}
      <div className="flex items-center gap-3 mt-2">
        <p style={{ fontSize: '1.9rem', fontWeight: 900, color: '#5C4033', fontFamily: 'Nunito, sans-serif', textAlign: 'center' }}>
          Encontrá la palabra escondida
        </p>
        <button
          onClick={() => speak('Encontrá la palabra escondida usando las letras de arriba')}
          style={{ fontSize: '1.6rem', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          🔊
        </button>
      </div>

      {/* Palabra madre */}
      <div
        style={{
          backgroundColor: '#C8E6C840',
          border: '3px solid #C8E6C8',
          borderRadius: 20,
          padding: '10px 20px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '0.85rem', color: '#8D7061', fontFamily: 'Nunito, sans-serif', fontWeight: 700, marginBottom: 4 }}>
          Palabra madre
        </p>
        <p style={{ fontSize: '2.2rem', fontWeight: 900, color: '#5C4033', fontFamily: 'Nunito, sans-serif', letterSpacing: 6 }}>
          {content.mother}
        </p>
      </div>

      {/* Fichas de letras */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 360 }}>
        {content.tiles.map((letter, idx) => {
          const isUsed = usedTileIndices.includes(idx)
          const isShaking = shakingIdx === idx
          return (
            <motion.button
              key={idx}
              animate={isShaking ? { x: [-6, 6, -5, 5, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              whileTap={!isUsed ? { scale: 0.9 } : {}}
              onClick={() => handleTileTap(idx)}
              disabled={isUsed || solved}
              style={{
                width: 62,
                height: 62,
                borderRadius: 16,
                backgroundColor: isUsed ? '#E5E7EB' : '#87CEEB40',
                border: isUsed ? '3px solid #D1D5DB' : '3px solid #87CEEB',
                fontSize: '1.8rem',
                fontWeight: 900,
                color: isUsed ? '#9CA3AF' : '#5C4033',
                fontFamily: 'Nunito, sans-serif',
                cursor: isUsed || solved ? 'default' : 'pointer',
                boxShadow: isUsed ? 'none' : '0 4px 10px rgba(0,0,0,0.08)',
                transition: 'background-color 0.2s, border-color 0.2s',
              }}
            >
              {letter}
            </motion.button>
          )
        })}
      </div>

      {/* Slots de respuesta */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {placed.map((slot, idx) => {
          const isPreFilled = content.showFirstLetter && idx === 0
          return (
            <AnimatePresence key={idx} mode="wait">
              {slot ? (
                <motion.div
                  key="filled"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: 16,
                    backgroundColor: isPreFilled ? '#C8E6C8' : '#8FBC8F40',
                    border: isPreFilled ? '3px solid #8FBC8F' : '3px solid #5C8F5C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    fontWeight: 900,
                    color: '#5C4033',
                    fontFamily: 'Nunito, sans-serif',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                  }}
                >
                  {slot.letter}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: 16,
                    backgroundColor: '#F9FAFB',
                    border: '3px dashed #D1D5DB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    color: '#D1D5DB',
                  }}
                >
                  _
                </motion.div>
              )}
            </AnimatePresence>
          )
        })}
      </div>

      {/* Progreso */}
      <p style={{ fontSize: '1rem', color: '#8D7061', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
        {filledCount} de {totalSlots} letras
      </p>

      {/* Botón deshacer */}
      {filledCount > (content.showFirstLetter ? 1 : 0) && !solved && (
        <button
          onClick={handleUndo}
          style={{
            backgroundColor: '#FFCBA440',
            border: '2px solid #FFCBA4',
            borderRadius: 16,
            padding: '10px 24px',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#5C4033',
            fontFamily: 'Nunito, sans-serif',
            cursor: 'pointer',
          }}
        >
          ↩ Borrar última
        </button>
      )}
    </div>
  )
}
