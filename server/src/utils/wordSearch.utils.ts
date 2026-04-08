export const WORD_THEMES: Record<string, string[]> = {
  frutas: ['MANZANA', 'PERA', 'UVA', 'FRESA', 'LIMON', 'NARANJA'],
  animales: ['GATO', 'PERRO', 'VACA', 'PATO', 'LEON', 'OSO'],
  colores: ['ROJO', 'AZUL', 'VERDE', 'ROSA', 'GRIS'],
  familia: ['MAMA', 'PAPA', 'HIJO', 'NIETO', 'ABUELO'],
}

type Direction = { dr: number; dc: number }

const DIRECTIONS: Direction[] = [
  { dr: 0, dc: 1 },   // horizontal →
  { dr: 1, dc: 0 },   // vertical ↓
]

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function randomLetter(): string {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function tryPlace(
  grid: string[][],
  word: string,
  size: number,
  dir: Direction
): boolean {
  const maxRow = size - (dir.dr === 0 ? 0 : word.length - 1)
  const maxCol = size - (dir.dc === 0 ? 0 : dir.dc > 0 ? word.length - 1 : 0)
  const minCol = dir.dc < 0 ? word.length - 1 : 0

  // Collect candidate starting positions
  const positions: Array<[number, number]> = []
  for (let r = 0; r < maxRow; r++) {
    for (let c = minCol; c < maxCol; c++) {
      positions.push([r, c])
    }
  }

  const shuffledPositions = shuffle(positions)

  for (const [startR, startC] of shuffledPositions) {
    let fits = true
    for (let i = 0; i < word.length; i++) {
      const r = startR + dir.dr * i
      const c = startC + dir.dc * i
      if (r < 0 || r >= size || c < 0 || c >= size) {
        fits = false
        break
      }
      const cell = grid[r][c]
      if (cell !== '' && cell !== word[i]) {
        fits = false
        break
      }
    }
    if (fits) {
      for (let i = 0; i < word.length; i++) {
        grid[startR + dir.dr * i][startC + dir.dc * i] = word[i]
      }
      return true
    }
  }
  return false
}

export function generateWordSearchGrid(
  words: string[],
  size: number
): { grid: string[][]; placedWords: string[] } {
  const grid: string[][] = Array.from({ length: size }, () =>
    Array(size).fill('')
  )

  const placedWords: string[] = []
  const shuffledDirs = shuffle(DIRECTIONS)

  for (const word of words) {
    const upper = word.toUpperCase()
    let placed = false
    for (const dir of shuffledDirs) {
      if (tryPlace(grid, upper, size, dir)) {
        placedWords.push(upper)
        placed = true
        break
      }
    }
    if (!placed) {
      // Try all directions
      for (const dir of DIRECTIONS) {
        if (tryPlace(grid, upper, size, dir)) {
          placedWords.push(upper)
          break
        }
      }
    }
  }

  // Fill empty cells with random letters
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = randomLetter()
      }
    }
  }

  return { grid, placedWords }
}
