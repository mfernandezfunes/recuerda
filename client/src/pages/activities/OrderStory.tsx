import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import apiClient from '../../api/client'
import { useAuthStore } from '../../store/auth.store'
import { useSessionStore } from '../../store/session.store'
import { useTTS } from '../../hooks/useTTS'
import { useActivityTimer } from '../../hooks/useActivityTimer'
import { sessionsApi } from '../../api/sessions.api'
import { LoadingScreen } from '../../components/shared/LoadingScreen'
import { ErrorScreen } from '../../components/shared/ErrorScreen'

interface StoryImage {
  id: string
  emoji: string
  label: string
  correctPosition: number
}

interface StoryContent {
  images: StoryImage[]
  title: string
}

function SortableItem({ id, emoji, label }: { id: string; emoji: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border-2 ${
        isDragging ? 'border-[#8FBC8F] shadow-lg opacity-80' : 'border-transparent'
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        className="text-2xl cursor-grab active:cursor-grabbing text-[#FFCBA4] select-none"
        style={{ touchAction: 'none' }}
      >
        ≡
      </span>
      <span className="text-5xl">{emoji}</span>
      <span className="text-xl font-bold text-[#5C4033]" style={{ fontFamily: 'Nunito, sans-serif' }}>
        {label}
      </span>
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

export function OrderStory() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId, addStars } = useSessionStore()
  const { speak } = useTTS()
  const { startTimer, stopTimer } = useActivityTimer()

  const [content, setContent] = useState<StoryContent | null>(null)
  const [items, setItems] = useState<StoryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'try-again' | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  )

  useEffect(() => {
    apiClient
      .get('/activities/ORDER_STORY/content', {
        params: { patientId: patient?.id, difficulty: 'EASY' },
      })
      .then((r) => {
        const data = r.data as StoryContent
        setContent(data)
        setItems(shuffleArray(data.images))
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [patient?.id])

  useEffect(() => {
    if (!loading && !error) {
      startTimer()
      speak('Poné las imágenes en el orden correcto')
    }
  }, [loading, error, startTimer, speak])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id)
        const newIndex = prev.findIndex((i) => i.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  function checkOrder() {
    const newAttempts = attempts + 1
    setAttempts(newAttempts)
    const isCorrect = items.every((item, index) => item.correctPosition === index)

    if (isCorrect) {
      setFeedback('correct')
      const stars: 1 | 2 | 3 = newAttempts === 1 ? 3 : newAttempts === 2 ? 2 : 1
      addStars(stars)
      const durationSecs = stopTimer()
      if (sessionId) {
        sessionsApi
          .logActivity(sessionId, {
            activityType: 'ORDER_STORY',
            difficulty: 'EASY',
            starsEarned: stars,
            durationSecs,
          })
          .catch(() => {})
      }
      speak('¡Muy bien! ¡Pusiste todo en orden!')
      setTimeout(() => {
        navigate('/patient/activity-result', {
          state: {
            starsEarned: stars,
            activityType: 'ORDER_STORY',
            patientName: patient?.name ?? '',
          },
        })
      }, 1500)
    } else {
      setFeedback('try-again')
      speak('Casi... intentá de nuevo')
      setTimeout(() => setFeedback(null), 2000)
    }
  }

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
            Ordena el cuento
          </p>
          <button
            onClick={() => speak('Poné las imágenes en el orden correcto')}
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

      {/* Title */}
      {content && (
        <p
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: '#5C4033',
            fontFamily: 'Nunito, sans-serif',
            textAlign: 'center',
          }}
        >
          {content.title}
        </p>
      )}

      {/* Instruction */}
      <p
        style={{
          fontSize: '1.1rem',
          color: '#8D7061',
          fontFamily: 'Nunito, sans-serif',
          textAlign: 'center',
        }}
      >
        Arrastrá las imágenes para ordenarlas
      </p>

      {/* Sortable List */}
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <SortableItem key={item.id} id={item.id} emoji={item.emoji} label={item.label} />
            ))}
          </SortableContext>
        </DndContext>
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
          Casi... intentá de nuevo 😊
        </motion.p>
      )}

      {/* Check Button */}
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          onClick={checkOrder}
          disabled={feedback === 'correct'}
          style={{
            width: '100%',
            padding: '20px',
            backgroundColor: '#8FBC8F',
            borderRadius: '20px',
            border: 'none',
            fontSize: '1.5rem',
            fontWeight: 900,
            color: '#fff',
            fontFamily: 'Nunito, sans-serif',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          ✅ Comprobar
        </motion.button>
      </div>
    </div>
  )
}
