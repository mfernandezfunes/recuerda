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

interface SudokuContent {
  puzzle: (number | null)[][]
  solution: number[][]
  size: 4
  difficulty?: string
}

export function Sudoku() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId, addStars } = useSessionStore()
  const { speak } = useTTS()
  const { startTimer, stopTimer } = useActivityTimer()

  const [content, setContent] = useState<SudokuContent | null>(null)
  const [difficulty, setDifficulty] = useState('EASY')
  const [board, setBoard] = useState<(number | null)[][]>([])
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [mistakes, setMistakes] = useState(0)

  useEffect(() => {
    apiClient
      .get('/activities/SUDOKU/content', { params: { patientId: patient?.id } })
      .then((r) => {
        const data = r.data as SudokuContent
        setContent(data)
        setDifficulty(data.difficulty ?? 'EASY')
        setBoard(data.puzzle.map((row) => [...row]))
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [patient?.id])

  useEffect(() => {
    if (!loading && !error) {
      startTimer()
      speak('Completá el Sudoku. Cada fila y columna debe tener los números del 1 al 4')
    }
  }, [loading, error])

  function isFixed(r: number, c: number): boolean {
    return content?.puzzle[r][c] !== null
  }

  function isCorrect(r: number, c: number): boolean {
    const val = board[r]?.[c]
    return val !== null && val === content?.solution[r][c]
  }

  function handleCellPress(r: number, c: number) {
    if (isFixed(r, c)) return
    setSelected([r, c])
  }

  function handleNumber(n: number) {
    if (!selected || !content) return
    const [r, c] = selected
    if (isFixed(r, c)) return

    const newBoard = board.map((row) => [...row])
    newBoard[r][c] = n

    const correct = n === content.solution[r][c]
    if (!correct) setMistakes((m) => m + 1)

    setBoard(newBoard)
    setSelected(null)

    // Check completion: all cells filled correctly
    const allCorrect = newBoard.every((row, ri) =>
      row.every((val, ci) => val === content.solution[ri][ci])
    )
    if (allCorrect) {
      const durationSecs = stopTimer()
      const stars: 1 | 2 | 3 = mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1
      addStars(stars)
      if (sessionId) {
        sessionsApi
          .logActivity(sessionId, {
            activityType: 'SUDOKU',
            difficulty,
            starsEarned: stars,
            durationSecs,
          })
          .catch(() => {})
      }
      speak('¡Excelente! ¡Completaste el Sudoku!').then(() => {
        navigate('/patient/activity-result', {
          state: { starsEarned: stars, activityType: 'SUDOKU', patientName: patient?.name ?? '' },
        })
      })
    }
  }

  if (loading) return <LoadingScreen />
  if (error || !content) return <ErrorScreen message="No se pudo cargar el Sudoku" />

  const size = content.size

  return (
    <div
      className="flex flex-col items-center gap-6 px-4 py-8 min-h-screen"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 w-full" style={{ maxWidth: 400 }}>
        <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#5C4033', fontFamily: 'Nunito, sans-serif' }}>
          🔢 Sudoku
        </p>
        <button
          onClick={() => speak('Completá el Sudoku. Cada fila y columna debe tener los números del 1 al 4')}
          style={{ fontSize: '1.6rem', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          🔊
        </button>
        {mistakes > 0 && (
          <p style={{ marginLeft: 'auto', fontSize: '1rem', color: '#E08060', fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}>
            Errores: {mistakes}
          </p>
        )}
      </div>

      <p style={{ fontSize: '1.1rem', color: '#8D7061', fontFamily: 'Nunito, sans-serif', fontWeight: 600, textAlign: 'center' }}>
        Completá con los números del 1 al 4 —<br />sin repetir en cada fila ni columna
      </p>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gap: 4,
          padding: 8,
          backgroundColor: '#5C4033',
          borderRadius: 16,
        }}
      >
        {board.map((row, r) =>
          row.map((val, c) => {
            const fixed = isFixed(r, c)
            const correct = val !== null && isCorrect(r, c)
            const wrong = val !== null && !correct && !fixed
            const sel = selected?.[0] === r && selected?.[1] === c

            // Draw thicker borders for 2x2 box boundaries
            const borderRight = (c + 1) % 2 === 0 && c < size - 1 ? '3px solid #5C4033' : '2px solid #E8D8CC'
            const borderBottom = (r + 1) % 2 === 0 && r < size - 1 ? '3px solid #5C4033' : '2px solid #E8D8CC'

            return (
              <motion.div
                key={`${r}-${c}`}
                whileTap={!fixed ? { scale: 0.92 } : {}}
                onClick={() => handleCellPress(r, c)}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 10,
                  backgroundColor: fixed
                    ? '#F0E8DF'
                    : correct
                    ? '#C8EEC8'
                    : sel
                    ? '#FFF3A3'
                    : '#FFFAF5',
                  border: sel
                    ? '3px solid #F5A623'
                    : correct
                    ? '2px solid #8FBC8F'
                    : wrong
                    ? '2px solid #E08060'
                    : '2px solid #E8D8CC',
                  borderRight,
                  borderBottom,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: fixed ? 'default' : 'pointer',
                  transition: 'background-color 0.15s',
                }}
              >
                <AnimatePresence mode="wait">
                  {val !== null && (
                    <motion.span
                      key={val}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: 900,
                        color: fixed ? '#5C4033' : correct ? '#3A8A3A' : wrong ? '#C05030' : '#5C4033',
                        fontFamily: 'Nunito, sans-serif',
                      }}
                    >
                      {val}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Number buttons */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{ display: 'flex', gap: 16 }}
          >
            {[1, 2, 3, 4].map((n) => (
              <motion.button
                key={n}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleNumber(n)}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  backgroundColor: '#FFCBA4',
                  border: '2px solid #E8A070',
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: '#5C4033',
                  fontFamily: 'Nunito, sans-serif',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                {n}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!selected && (
        <p style={{ fontSize: '1rem', color: '#8D7061', fontFamily: 'Nunito, sans-serif', textAlign: 'center' }}>
          Tocá una celda vacía para completarla
        </p>
      )}
    </div>
  )
}
