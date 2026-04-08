import { useState, useRef, useCallback } from 'react'

interface WordGridProps {
  grid: string[][]
  words: string[]
  onWordFound: (word: string) => void
  onComplete: () => void
}

interface CellPos {
  row: number
  col: number
}

function getWordFromSelection(grid: string[][], selection: CellPos[]): string {
  return selection.map((p) => grid[p.row]?.[p.col] ?? '').join('')
}

function checkWordMatch(word: string, candidate: string): boolean {
  return candidate === word || candidate === word.split('').reverse().join('')
}

export function WordGrid({ grid, words, onWordFound, onComplete }: WordGridProps) {
  const [selecting, setSelecting] = useState<CellPos[]>([])
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set())
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set())
  const tableRef = useRef<HTMLTableElement>(null)
  const touchActiveRef = useRef(false)

  const getCellFromPoint = useCallback(
    (x: number, y: number): CellPos | null => {
      if (!tableRef.current) return null
      const cells = tableRef.current.querySelectorAll('td')
      for (const cell of cells) {
        const rect = cell.getBoundingClientRect()
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          const row = Number(cell.dataset.row)
          const col = Number(cell.dataset.col)
          return { row, col }
        }
      }
      return null
    },
    []
  )

  const commitSelection = useCallback(
    (sel: CellPos[]) => {
      const candidate = getWordFromSelection(grid, sel)
      let found = false
      for (const word of words) {
        if (!foundWords.has(word) && checkWordMatch(word.toUpperCase(), candidate.toUpperCase())) {
          const newFoundCells = new Set(foundCells)
          sel.forEach((p) => newFoundCells.add(`${p.row}-${p.col}`))
          setFoundCells(newFoundCells)
          const newFoundWords = new Set(foundWords)
          newFoundWords.add(word)
          setFoundWords(newFoundWords)
          onWordFound(word)
          if (newFoundWords.size === words.length) {
            onComplete()
          }
          found = true
          break
        }
      }
      if (!found) {
        // no match — just clear
      }
      setSelecting([])
    },
    [grid, words, foundWords, foundCells, onWordFound, onComplete]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      touchActiveRef.current = true
      const touch = e.touches[0]
      const pos = getCellFromPoint(touch.clientX, touch.clientY)
      if (pos) setSelecting([pos])
    },
    [getCellFromPoint]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchActiveRef.current) return
      e.preventDefault()
      const touch = e.touches[0]
      const pos = getCellFromPoint(touch.clientX, touch.clientY)
      if (!pos) return
      setSelecting((prev) => {
        const last = prev[prev.length - 1]
        if (last && last.row === pos.row && last.col === pos.col) return prev
        return [...prev, pos]
      })
    },
    [getCellFromPoint]
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      touchActiveRef.current = false
      setSelecting((sel) => {
        if (sel.length > 0) commitSelection(sel)
        return []
      })
    },
    [commitSelection]
  )

  const handleMouseDown = useCallback((row: number, col: number) => {
    setSelecting([{ row, col }])
  }, [])

  const handleMouseEnter = useCallback((row: number, col: number) => {
    setSelecting((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      if (last.row === row && last.col === col) return prev
      return [...prev, { row, col }]
    })
  }, [])

  const handleMouseUp = useCallback(() => {
    setSelecting((sel) => {
      if (sel.length > 0) commitSelection(sel)
      return []
    })
  }, [commitSelection])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'flex-start' }}>
      {/* Grid */}
      <div
        style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
        onMouseUp={handleMouseUp}
      >
        <table
          ref={tableRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            borderCollapse: 'separate',
            borderSpacing: '3px',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          <tbody>
            {grid.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((letter, cIdx) => {
                  const key = `${rIdx}-${cIdx}`
                  const isSelected = selecting.some((p) => p.row === rIdx && p.col === cIdx)
                  const isFound = foundCells.has(key)
                  return (
                    <td
                      key={cIdx}
                      data-row={rIdx}
                      data-col={cIdx}
                      onMouseDown={() => handleMouseDown(rIdx, cIdx)}
                      onMouseEnter={() => handleMouseEnter(rIdx, cIdx)}
                      style={{
                        width: '44px',
                        height: '44px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        borderRadius: '8px',
                        backgroundColor: isFound
                          ? '#8FBC8F'
                          : isSelected
                          ? '#FFF3A3'
                          : '#FFF8F0',
                        border: isFound
                          ? '2px solid #5C8F5C'
                          : isSelected
                          ? '2px solid #F5A623'
                          : '2px solid #E8D8CC',
                        fontSize: '1.1rem',
                        fontWeight: 900,
                        color: '#5C4033',
                        fontFamily: 'Nunito, sans-serif',
                        cursor: 'default',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      {letter}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Word list */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxWidth: '360px' }}>
        {words.map((word) => (
          <span
            key={word}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: foundWords.has(word) ? '#8FBC8F' : '#FFCBA4',
              color: '#5C4033',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 800,
              fontSize: '1.1rem',
              textDecoration: foundWords.has(word) ? 'line-through' : 'none',
              opacity: foundWords.has(word) ? 0.7 : 1,
            }}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  )
}
