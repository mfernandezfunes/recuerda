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

interface MathGridCell {
  value: number | null
  fixed: boolean
}

interface MathGridContent {
  size: number
  grid: MathGridCell[][]
  solution: number[][]
  rowOps: string[]
  colOps: string[]
  rowResults: number[]
  colResults: number[]
  difficulty?: string
}

const CELL_SIZE = 80
const OP_SIZE = 32

export function MathGrid() {
  const navigate = useNavigate()
  const { patient } = useAuthStore()
  const { sessionId, addStars } = useSessionStore()
  const { speak } = useTTS()
  const { startTimer, stopTimer } = useActivityTimer()

  const [content, setContent] = useState<MathGridContent | null>(null)
  const [difficulty, setDifficulty] = useState('EASY')
  const [board, setBoard] = useState<(number | null)[][]>([])
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [mistakes, setMistakes] = useState(0)

  useEffect(() => {
    apiClient
      .get('/activities/MATH_GRID/content', { params: { patientId: patient?.id } })
      .then((r) => {
        const data = r.data as MathGridContent
        setContent(data)
        setDifficulty(data.difficulty ?? 'EASY')
        setBoard(data.grid.map((row) => row.map((cell) => cell.value)))
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [patient?.id])

  useEffect(() => {
    if (!loading && !error) {
      startTimer()
      speak('Completá la grilla matemática. Tocá los círculos vacíos para agregar números.')
    }
  }, [loading, error])

  function isFixed(r: number, c: number) {
    return content?.grid[r][c].fixed ?? false
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
    setSelected((prev) => (prev?.[0] === r && prev?.[1] === c ? null : [r, c]))
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
      const stars: 1 | 2 | 3 = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1
      addStars(stars)
      if (sessionId) {
        sessionsApi
          .logActivity(sessionId, { activityType: 'MATH_GRID', difficulty, starsEarned: stars, durationSecs })
          .catch(() => {})
      }
      speak('¡Excelente! ¡Completaste la grilla!').then(() => {
        navigate('/patient/activity-result', {
          state: { starsEarned: stars, activityType: 'MATH_GRID', patientName: patient?.name ?? '' },
        })
      })
    }
  }

  if (loading) return <LoadingScreen />
  if (error || !content) return <ErrorScreen message="No se pudo cargar la grilla" />

  const { size, rowOps, colOps, rowResults, colResults } = content
  const maxNumber = difficulty === 'EASY' ? 10 : difficulty === 'MEDIUM' ? 12 : 15
  const numbers = Array.from({ length: maxNumber }, (_, i) => i + 1)

  const BG: Record<string, string> = {
    fixed: '#F0E8DF',
    correct: '#C8EEC8',
    wrong: '#FFD8CC',
    selected: '#FFF3A3',
    empty: '#FFFFFF',
  }
  const BORDER: Record<string, string> = {
    fixed: '3px solid #D8C8BC',
    correct: '3px solid #8FBC8F',
    wrong: '3px solid #E08060',
    selected: '4px solid #F5A623',
    empty: '3px solid #E8D8CC',
  }

  return (
    <div
      className="flex flex-col items-center gap-6 px-4 py-8 min-h-screen"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 w-full" style={{ maxWidth: 480 }}>
        <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#5C4033', fontFamily: 'Nunito, sans-serif' }}>
          🔢 Math Grid
        </p>
        <button
          onClick={() => speak('Completá la grilla matemática. Tocá los círculos vacíos para agregar números.')}
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

      <p style={{ fontSize: '1.1rem', color: '#8D7061', fontFamily: 'Nunito, sans-serif', fontWeight: 600, textAlign: 'center' }}>
        Completá los círculos para que las operaciones sean correctas
      </p>

      {/* Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        {board.map((row, r) => (
          <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {row.map((val, c) => {
              const state = cellState(r, c)
              return (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Cell */}
                  <motion.div
                    whileTap={state !== 'fixed' ? { scale: 0.92 } : {}}
                    onClick={() => handleCellPress(r, c)}
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      borderRadius: '50%',
                      backgroundColor: BG[state],
                      border: BORDER[state],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: state === 'fixed' ? 'default' : 'pointer',
                      boxShadow: '0 3px 8px rgba(0,0,0,0.1)',
                      position: 'relative',
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {val !== null && (
                        <motion.span
                          key={val}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          style={{
                            fontSize: '2rem',
                            fontWeight: 900,
                            color:
                              state === 'fixed'
                                ? '#5C4033'
                                : state === 'correct'
                                ? '#3A8A3A'
                                : state === 'wrong'
                                ? '#C05030'
                                : '#5C4033',
                            fontFamily: 'Nunito, sans-serif',
                            lineHeight: 1,
                          }}
                        >
                          {val}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Row operator */}
                  {c < size - 1 && (
                    <span
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: '#8D7061',
                        fontFamily: 'Nunito, sans-serif',
                        width: OP_SIZE,
                        textAlign: 'center',
                      }}
                    >
                      {rowOps[r]}
                    </span>
                  )}

                  {/* Row result */}
                  {c === size - 1 && (
                    <>
                      <span
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: 800,
                          color: '#8D7061',
                          fontFamily: 'Nunito, sans-serif',
                          width: OP_SIZE,
                          textAlign: 'center',
                        }}
                      >
                        =
                      </span>
                      <div
                        style={{
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          borderRadius: '50%',
                          backgroundColor: '#E8DFD0',
                          border: '3px solid #C8B8A0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '1.8rem',
                            fontWeight: 900,
                            color: '#5C4033',
                            fontFamily: 'Nunito, sans-serif',
                          }}
                        >
                          {rowResults[r]}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ))}

        {/* Column operators row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: -4 }}>
          {Array.from({ length: size }).map((_, c) => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  width: CELL_SIZE,
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#8D7061',
                  fontFamily: 'Nunito, sans-serif',
                  textAlign: 'center',
                }}
              >
                {colOps[c]}
              </span>
              {c < size - 1 && <span style={{ width: OP_SIZE }} />}
            </div>
          ))}
        </div>

        {/* Column results row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {colResults.map((result, c) => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  borderRadius: '50%',
                  backgroundColor: '#E8DFD0',
                  border: '3px solid #C8B8A0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                }}
              >
                <span
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 900,
                    color: '#5C4033',
                    fontFamily: 'Nunito, sans-serif',
                  }}
                >
                  {result}
                </span>
              </div>
              {c < size - 1 && <span style={{ width: OP_SIZE }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Number pad */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 10,
              width: '100%',
              maxWidth: 360,
              marginTop: 8,
            }}
          >
            {numbers.map((n) => (
              <motion.button
                key={n}
                whileTap={{ scale: 0.88 }}
                onClick={() => handleNumber(n)}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 14,
                  backgroundColor: '#FFCBA4',
                  border: '3px solid #E8A070',
                  fontSize: '1.6rem',
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

      {selected && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            const [r, c] = selected
            if (isFixed(r, c)) return
            const newBoard = board.map((row) => [...row])
            newBoard[r][c] = null
            setBoard(newBoard)
            setSelected(null)
          }}
          style={{
            marginTop: 4,
            padding: '12px 36px',
            borderRadius: 14,
            backgroundColor: '#F0E8DF',
            border: '3px solid #D8C8BC',
            fontSize: '1.1rem',
            fontWeight: 800,
            color: '#8D7061',
            fontFamily: 'Nunito, sans-serif',
            cursor: 'pointer',
          }}
        >
          🗑️ Limpiar
        </motion.button>
      )}

      {!selected && (
        <p style={{ fontSize: '1rem', color: '#8D7061', fontFamily: 'Nunito, sans-serif', textAlign: 'center' }}>
          Tocá un círculo vacío para completarlo
        </p>
      )}
    </div>
  )
}
