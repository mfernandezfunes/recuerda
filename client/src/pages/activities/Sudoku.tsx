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
  size: 4 | 6 | 9
  boxRows: number
  boxCols: number
  difficulty?: string
}

const CELL_SIZE: Record<number, number> = { 4: 72, 6: 54, 9: 38 }
const FONT_SIZE: Record<number, string> = { 4: '1.8rem', 6: '1.4rem', 9: '1.1rem' }
const BTN_SIZE: Record<number, number> = { 4: 68, 6: 56, 9: 44 }

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
      const size = content?.size ?? 4
      speak(`Completá el Sudoku. Cada fila y columna debe tener los números del 1 al ${size}`)
    }
  }, [loading, error])

  function isFixed(r: number, c: number) {
    return content?.puzzle[r][c] !== null
  }

  function cellState(r: number, c: number): 'fixed' | 'correct' | 'wrong' | 'selected' | 'empty' {
    if (isFixed(r, c)) return 'fixed'
    const val = board[r]?.[c]
    const sel = selected?.[0] === r && selected?.[1] === c
    if (val !== null && val === content?.solution[r][c]) return 'correct'
    if (val !== null && val !== content?.solution[r][c]) return 'wrong'
    if (sel) return 'selected'
    return 'empty'
  }

  function handleCellPress(r: number, c: number) {
    if (isFixed(r, c)) return
    setSelected((prev) =>
      prev?.[0] === r && prev?.[1] === c ? null : [r, c]
    )
  }

  function handleNumber(n: number) {
    if (!selected || !content) return
    const [r, c] = selected
    if (isFixed(r, c)) return

    const newBoard = board.map((row) => [...row])
    newBoard[r][c] = n

    if (n !== content.solution[r][c]) setMistakes((m) => m + 1)

    setBoard(newBoard)
    setSelected(null)

    const allCorrect = newBoard.every((row, ri) =>
      row.every((val, ci) => val === content.solution[ri][ci])
    )
    if (allCorrect) {
      const durationSecs = stopTimer()
      const stars: 1 | 2 | 3 = mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1
      addStars(stars)
      if (sessionId) {
        sessionsApi
          .logActivity(sessionId, { activityType: 'SUDOKU', difficulty, starsEarned: stars, durationSecs })
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

  const { size, boxRows, boxCols } = content
  const cellSize = CELL_SIZE[size]
  const fontSize = FONT_SIZE[size]
  const btnSize = BTN_SIZE[size]
  const numbers = Array.from({ length: size }, (_, i) => i + 1)

  const BG: Record<string, string> = {
    fixed: '#F0E8DF',
    correct: '#C8EEC8',
    wrong: '#FFD8CC',
    selected: '#FFF3A3',
    empty: '#FFFAF5',
  }
  const BORDER: Record<string, string> = {
    fixed: '2px solid #D8C8BC',
    correct: '2px solid #8FBC8F',
    wrong: '2px solid #E08060',
    selected: '3px solid #F5A623',
    empty: '2px solid #E8D8CC',
  }

  return (
    <div
      className="flex flex-col items-center gap-5 px-4 py-8 min-h-screen"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 w-full" style={{ maxWidth: 480 }}>
        <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#5C4033', fontFamily: 'Nunito, sans-serif' }}>
          🔢 Sudoku {size}×{size}
        </p>
        <button
          onClick={() => speak(`Completá el Sudoku. Cada fila y columna debe tener los números del 1 al ${size}`)}
          style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          🔊
        </button>
        {mistakes > 0 && (
          <p style={{ marginLeft: 'auto', fontSize: '1rem', color: '#E08060', fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}>
            Errores: {mistakes}
          </p>
        )}
      </div>

      <p style={{ fontSize: '1rem', color: '#8D7061', fontFamily: 'Nunito, sans-serif', fontWeight: 600, textAlign: 'center' }}>
        Sin repetir números en cada fila, columna ni caja
      </p>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
          gap: 0,
          border: '3px solid #5C4033',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {board.map((row, r) =>
          row.map((val, c) => {
            const state = cellState(r, c)
            const thickRight = (c + 1) % boxCols === 0 && c < size - 1
            const thickBottom = (r + 1) % boxRows === 0 && r < size - 1

            return (
              <motion.div
                key={`${r}-${c}`}
                whileTap={state !== 'fixed' ? { scale: 0.9 } : {}}
                onClick={() => handleCellPress(r, c)}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: BG[state],
                  border: BORDER[state],
                  borderRight: thickRight ? '3px solid #5C4033' : BORDER[state].replace('3px', '1px').replace('2px', '1px'),
                  borderBottom: thickBottom ? '3px solid #5C4033' : BORDER[state].replace('3px', '1px').replace('2px', '1px'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: state === 'fixed' ? 'default' : 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <AnimatePresence mode="wait">
                  {val !== null && (
                    <motion.span
                      key={val}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{
                        fontSize,
                        fontWeight: 900,
                        color:
                          state === 'fixed' ? '#5C4033' :
                          state === 'correct' ? '#3A8A3A' :
                          state === 'wrong' ? '#C05030' : '#5C4033',
                        fontFamily: 'Nunito, sans-serif',
                        lineHeight: 1,
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            style={{
              display: 'grid',
              gridTemplateColumns: size === 9 ? 'repeat(5, 1fr)' : `repeat(${size}, 1fr)`,
              gap: 10,
              width: '100%',
              maxWidth: 360,
            }}
          >
            {numbers.map((n) => (
              <motion.button
                key={n}
                whileTap={{ scale: 0.88 }}
                onClick={() => handleNumber(n)}
                style={{
                  width: btnSize,
                  height: btnSize,
                  borderRadius: 14,
                  backgroundColor: '#FFCBA4',
                  border: '2px solid #E8A070',
                  fontSize: size === 9 ? '1.3rem' : '1.8rem',
                  fontWeight: 900,
                  color: '#5C4033',
                  fontFamily: 'Nunito, sans-serif',
                  cursor: 'pointer',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
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
