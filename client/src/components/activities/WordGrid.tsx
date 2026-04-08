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
  const containerRef = useRef<HTMLDivElement>(null)

  const getCellFromPoint = useCallback((x: number, y: number): CellPos | null => {
    if (!containerRef.current) return null
    const cells = containerRef.current.querySelectorAll<HTMLElement>('[data-row]')
    for (const cell of cells) {
      const rect = cell.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return { row: Number(cell.dataset.row), col: Number(cell.dataset.col) }
      }
    }
    return null
  }, [])

  const commitSelection = useCallback(
    (sel: CellPos[]) => {
      const candidate = getWordFromSelection(grid, sel)
      for (const word of words) {
        if (!foundWords.has(word) && checkWordMatch(word.toUpperCase(), candidate.toUpperCase())) {
          const newFoundCells = new Set(foundCells)
          sel.forEach((p) => newFoundCells.add(`${p.row}-${p.col}`))
          setFoundCells(newFoundCells)
          const newFoundWords = new Set(foundWords)
          newFoundWords.add(word)
          setFoundWords(newFoundWords)
          onWordFound(word)
          if (newFoundWords.size === words.length) onComplete()
          break
        }
      }
      setSelecting([])
    },
    [grid, words, foundWords, foundCells, onWordFound, onComplete]
  )

  // Pointer events work on both mouse and touch; touch-action:none prevents
  // the browser from scrolling while the user is selecting letters.
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      const pos = getCellFromPoint(e.clientX, e.clientY)
      if (pos) setSelecting([pos])
    },
    [getCellFromPoint]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.buttons === 0) return
      const pos = getCellFromPoint(e.clientX, e.clientY)
      if (!pos) return
      setSelecting((prev) => {
        const last = prev[prev.length - 1]
        if (last && last.row === pos.row && last.col === pos.col) return prev
        return [...prev, pos]
      })
    },
    [getCellFromPoint]
  )

  const handlePointerUp = useCallback(() => {
    setSelecting((sel) => {
      if (sel.length > 0) commitSelection(sel)
      return []
    })
  }, [commitSelection])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'flex-start' }}>
      {/* Grid */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        <table
          style={{ borderCollapse: 'separate', borderSpacing: '3px' }}
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
                      style={{
                        width: '44px',
                        height: '44px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        borderRadius: '8px',
                        backgroundColor: isFound ? '#8FBC8F' : isSelected ? '#FFF3A3' : '#FFF8F0',
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
                        pointerEvents: 'none', // let the container handle all pointer events
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
