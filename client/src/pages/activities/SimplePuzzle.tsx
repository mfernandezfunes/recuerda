import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { motion } from 'framer-motion'
import apiClient from '../../api/client'
import { useAuthStore } from '../../store/auth.store'
import { useSessionStore } from '../../store/session.store'
import { useTTS } from '../../hooks/useTTS'
import { useActivityTimer } from '../../hooks/useActivityTimer'
import { sessionsApi } from '../../api/sessions.api'
import { LoadingScreen } from '../../components/shared/LoadingScreen'
import { ErrorScreen } from '../../components/shared/ErrorScreen'

interface PuzzleContent {
  emoji: string
  label: string
  gridSize: number
  difficulty?: string
}

interface Piece {
  id: string
  position: number
  emoji: string
  bgColor: string
}

// Color palettes for pieces
const EASY_EMOJIS = ['🔴', '🟡', '🟢', '🔵']
const MEDIUM_COLORS = [
  '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF',
  '#FF922B', '#CC5DE8', '#F06595', '#74C0FC', '#A9E34B',
]

function PieceTile({
  piece,
  size,
}: {
  piece: Piece
  size: number
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: piece.id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        width: size,
        height: size,
        backgroundColor: piece.bgColor,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size > 80 ? '2.2rem' : '1.8rem',
        fontWeight: 900,
        color: '#fff',
        fontFamily: 'Nunito, sans-serif',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.4 : 1,
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {piece.emoji}
    </div>
  )
}

function PuzzleSlot({
  slotIndex,
  placedPiece,
  gridSize,
}: {
  slotIndex: number
  placedPiece: Piece | null
  gridSize: number
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${slotIndex}` })
  const slotSize = gridSize === 2 ? 110 : 80

  return (
    <div
      ref={setNodeRef}
      style={{
        width: slotSize,
        height: slotSize,
        borderRadius: '12px',
        border: isOver ? '3px solid #8FBC8F' : '3px dashed #FFCBA4',
        backgroundColor: placedPiece
          ? placedPiece.bgColor
          : isOver
          ? 'rgba(143,188,143,0.15)'
          : 'rgba(255,203,164,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: slotSize > 90 ? '2.2rem' : '1.6rem',
        fontWeight: 900,
        color: '#fff',
        fontFamily: 'Nunito, sans-serif',
        transition: 'background-color 0.2s, border-color 0.2s',
        position: 'relative',
      }}
    >
      {placedPiece ? (
        <motion.div
          initial={{ scale: 0.7 }}
          animate={{ scale: 1 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
        >
          {placedPiece.emoji}
        </motion.div>
      ) : (
        <span style={{ color: '#FFCBA4', fontSize: '1.2rem', fontWeight: 700 }}>
          {slotIndex + 1}
        </span>
      )}
    </div>
  )
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function SimplePuzzle() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId, addStars } = useSessionStore()
  const { speak } = useTTS()
  const { startTimer, stopTimer } = useActivityTimer()

  const [content, setContent] = useState<PuzzleContent | null>(null)
  const [difficulty, setDifficulty] = useState<string>('EASY')
  const [pieces, setPieces] = useState<Piece[]>([])
  const [poolPieces, setPoolPieces] = useState<Piece[]>([])
  const [slotMap, setSlotMap] = useState<Record<number, Piece | null>>({})
  const [activePiece, setActivePiece] = useState<Piece | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [moves, setMoves] = useState(0)
  const movesRef = useRef(0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    apiClient
      .get('/activities/SIMPLE_PUZZLE/content', {
        params: { patientId: patient?.id },
      })
      .then((r) => {
        const data = r.data as PuzzleContent
        setContent(data)
        setDifficulty(data.difficulty ?? 'EASY')
        const n = data.gridSize * data.gridSize
        const allPieces: Piece[] = Array.from({ length: n }, (_, i) => ({
          id: `piece-${i}`,
          position: i,
          emoji: n <= 4 ? EASY_EMOJIS[i] : String(i + 1),
          bgColor: n <= 4
            ? ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'][i]
            : MEDIUM_COLORS[i % MEDIUM_COLORS.length],
        }))
        setPieces(allPieces)
        setPoolPieces(shuffleArray(allPieces))
        const initialSlots: Record<number, Piece | null> = {}
        for (let i = 0; i < n; i++) initialSlots[i] = null
        setSlotMap(initialSlots)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [patient?.id])

  useEffect(() => {
    if (!loading && !error) {
      startTimer()
      speak('Armá el rompecabezas. Arrastrá cada pieza a su lugar')
    }
  }, [loading, error, startTimer, speak])

  function handleDragStart(event: DragStartEvent) {
    const piece = pieces.find((p) => p.id === event.active.id)
    setActivePiece(piece ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActivePiece(null)
    const { active, over } = event
    if (!over) return

    const overId = over.id as string
    if (!overId.startsWith('slot-')) return

    const slotIndex = parseInt(overId.replace('slot-', ''), 10)
    const draggedPiece = pieces.find((p) => p.id === active.id)
    if (!draggedPiece) return

    // Don't allow dropping on already-filled slot
    if (slotMap[slotIndex] !== null) return

    movesRef.current += 1
    setMoves(movesRef.current)

    if (draggedPiece.position === slotIndex) {
      // Correct slot — place it
      setSlotMap((prev) => ({ ...prev, [slotIndex]: draggedPiece }))
      setPoolPieces((prev) => prev.filter((p) => p.id !== draggedPiece.id))

      // Check completion
      const newSlotMap = { ...slotMap, [slotIndex]: draggedPiece }
      const totalSlots = Object.keys(newSlotMap).length
      const filledCorrectly = Object.values(newSlotMap).filter(Boolean).length

      if (filledCorrectly === totalSlots) {
        const n = totalSlots
        const m = movesRef.current
        const stars: 1 | 2 | 3 = m <= n + 2 ? 3 : m <= n + 5 ? 2 : 1
        addStars(stars)
        const durationSecs = stopTimer()
        if (sessionId) {
          sessionsApi
            .logActivity(sessionId, {
              activityType: 'SIMPLE_PUZZLE',
              difficulty,
              starsEarned: stars,
              durationSecs,
            })
            .catch(() => {})
        }
        speak('¡Excelente! ¡Armaste el rompecabezas!').then(() => {
          navigate('/patient/activity-result', {
            state: {
              starsEarned: stars,
              activityType: 'SIMPLE_PUZZLE',
              patientName: patient?.name ?? '',
            },
          })
        })
      }
    }
    // If incorrect: piece just returns to pool (stays in pool, no action needed)
  }

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen message="No se pudo cargar la actividad" />
  if (!content) return null

  const gridSize = content.gridSize
  const slotSize = gridSize === 2 ? 110 : 80
  const pieceSize = gridSize === 2 ? 90 : 70

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
            🧩 Rompecabezas
          </p>
          <button
            onClick={() => speak('Arrastrá cada pieza a su lugar')}
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
          Movimientos: {moves}
        </p>
      </div>

      {/* Label */}
      <p
        style={{
          fontSize: '1.3rem',
          fontWeight: 700,
          color: '#5C4033',
          fontFamily: 'Nunito, sans-serif',
        }}
      >
        {content.emoji} {content.label}
      </p>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, ${slotSize}px)`,
            gap: '8px',
          }}
        >
          {Object.entries(slotMap).map(([idx, piece]) => (
            <PuzzleSlot
              key={idx}
              slotIndex={parseInt(idx, 10)}
              placedPiece={piece}
              gridSize={gridSize}
            />
          ))}
        </div>

        {/* Instruction */}
        <p
          style={{
            fontSize: '1rem',
            color: '#8D7061',
            fontFamily: 'Nunito, sans-serif',
            textAlign: 'center',
          }}
        >
          Arrastrá las piezas de abajo a los lugares numerados
        </p>

        {/* Pool */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(255,203,164,0.2)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '480px',
            minHeight: '100px',
          }}
        >
          {poolPieces.map((piece) => (
            <PieceTile key={piece.id} piece={piece} size={pieceSize} />
          ))}
          {poolPieces.length === 0 && (
            <p
              style={{
                color: '#8FBC8F',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 700,
                fontSize: '1.1rem',
              }}
            >
              ¡Todas las piezas colocadas!
            </p>
          )}
        </div>

        <DragOverlay>
          {activePiece ? (
            <div
              style={{
                width: pieceSize,
                height: pieceSize,
                backgroundColor: activePiece.bgColor,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.2rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                opacity: 0.9,
              }}
            >
              {activePiece.emoji}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
