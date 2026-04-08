import { Difficulty } from '@prisma/client'
import { prisma } from '../config/database'
import { generateWordSearchGrid, WORD_THEMES } from '../utils/wordSearch.utils'
import { v4 as uuidv4 } from 'uuid'

// ─── Helpers ────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── WHO_IS_THIS ─────────────────────────────────────────────────────────────

export async function generateWhoIsThisContent(
  patientId: string,
  _difficulty: Difficulty
): Promise<{
  member: { name: string; relation: string; photoUrl: string }
  options: string[]
} | null> {
  const members = await prisma.familyMember.findMany({
    where: { patientId },
  })

  if (members.length === 0) return null

  const correct = randomFrom(members)
  const distractors = shuffle(members.filter((m) => m.id !== correct.id)).slice(0, 2)

  // If fewer than 3 members, pad with placeholder names
  const wrongNames: string[] = [
    ...distractors.map((m) => m.name),
    ...(distractors.length < 2 ? ['Desconocido', 'Visitante'].slice(0, 2 - distractors.length) : []),
  ]

  const options = shuffle([correct.name, ...wrongNames.slice(0, 2)])

  return {
    member: {
      name: correct.name,
      relation: correct.relation,
      photoUrl: correct.photoUrl,
    },
    options,
  }
}

// ─── WHAT_DAY_IS_IT ──────────────────────────────────────────────────────────

export async function generateWhatDayIsItContent(
  difficulty: Difficulty
): Promise<{
  question: string
  correct: string
  options: string[]
}> {
  const now = new Date()

  const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ]

  if (difficulty === 'EASY') {
    const correct = DAYS_ES[now.getDay()] ?? DAYS_ES[0]
    const wrongDays = shuffle(DAYS_ES.filter((d) => d !== correct)).slice(0, 3)
    return {
      question: '¿Qué día es hoy?',
      correct,
      options: shuffle([correct, ...wrongDays]),
    }
  }

  if (difficulty === 'MEDIUM') {
    const correct = MONTHS_ES[now.getMonth()] ?? MONTHS_ES[0]
    const wrongMonths = shuffle(MONTHS_ES.filter((m) => m !== correct)).slice(0, 3)
    return {
      question: '¿En qué mes estamos?',
      correct,
      options: shuffle([correct, ...wrongMonths]),
    }
  }

  // HARD: year
  const correct = String(now.getFullYear())
  const wrongYears = [
    String(now.getFullYear() - 1),
    String(now.getFullYear() + 1),
    String(now.getFullYear() - 2),
  ]
  return {
    question: '¿En qué año estamos?',
    correct,
    options: shuffle([correct, ...wrongYears]),
  }
}

// ─── MEMORY_CARDS ────────────────────────────────────────────────────────────

const MEMORY_CARD_POOL: Array<{ emoji: string; label: string }> = [
  { emoji: '🐱', label: 'Gato' },
  { emoji: '🐶', label: 'Perro' },
  { emoji: '🐦', label: 'Pájaro' },
  { emoji: '🌷', label: 'Tulipán' },
  { emoji: '🍎', label: 'Manzana' },
  { emoji: '🌙', label: 'Luna' },
  { emoji: '⭐', label: 'Estrella' },
  { emoji: '🌈', label: 'Arcoíris' },
  { emoji: '🏠', label: 'Casa' },
  { emoji: '🌸', label: 'Flor' },
  { emoji: '🍓', label: 'Fresa' },
  { emoji: '🐠', label: 'Pez' },
]

export async function generateMemoryCardsContent(
  _patientId: string,
  difficulty: Difficulty
): Promise<{
  pairs: Array<{ id: string; emoji: string; label: string }>
}> {
  const pairsCount = difficulty === 'EASY' ? 3 : difficulty === 'MEDIUM' ? 4 : 6
  const selected = shuffle(MEMORY_CARD_POOL).slice(0, pairsCount)

  const pairs = selected.map((item) => ({
    id: uuidv4(),
    emoji: item.emoji,
    label: item.label,
  }))

  return { pairs }
}

// ─── FIND_OBJECT ──────────────────────────────────────────────────────────────

const FIND_OBJECT_POOL: Array<{ emoji: string; name: string; article: string }> = [
  { emoji: '🍎', name: 'Manzana', article: 'la' },
  { emoji: '🐱', name: 'Gato', article: 'el' },
  { emoji: '🌷', name: 'Flor', article: 'la' },
  { emoji: '🍓', name: 'Fresa', article: 'la' },
  { emoji: '🚗', name: 'Auto', article: 'el' },
  { emoji: '🏠', name: 'Casa', article: 'la' },
  { emoji: '☀️', name: 'Sol', article: 'el' },
  { emoji: '🍦', name: 'Helado', article: 'el' },
  { emoji: '🎈', name: 'Globo', article: 'el' },
  { emoji: '🐶', name: 'Perro', article: 'el' },
]

export async function generateFindObjectContent(
  _difficulty: Difficulty
): Promise<{
  target: { label: string; emoji: string; article: string }
  options: Array<{ label: string; emoji: string; isCorrect: boolean }>
}> {
  const shuffled = shuffle(FIND_OBJECT_POOL).slice(0, 3)
  const target = shuffled[0]

  const options = shuffle(
    shuffled.map((item) => ({
      label: item.name,
      emoji: item.emoji,
      isCorrect: item.name === target.name,
    }))
  )

  return { target: { label: target.name, emoji: target.emoji, article: target.article }, options }
}

// ─── SERIES_PATTERNS ─────────────────────────────────────────────────────────

export async function generateSeriesPatternsContent(
  difficulty: Difficulty
): Promise<{
  sequence: (string | number)[]
  correct: string | number
  options: (string | number)[]
  type: 'numbers' | 'colors' | 'shapes'
}> {
  if (difficulty === 'EASY') {
    // Simple number sequence +2
    const start = Math.floor(Math.random() * 5) + 1
    const step = 2
    const seq = [start, start + step, start + step * 2, '?']
    const correct = start + step * 3
    const options = shuffle([correct, correct + 1, correct - 1, correct + step])
    return { sequence: seq, correct, options, type: 'numbers' }
  }

  if (difficulty === 'MEDIUM') {
    // Colors pattern
    const COLORS = ['🔴', '🟡', '🔵', '🟢', '🟠', '🟣']
    const pattern = shuffle(COLORS).slice(0, 2)
    const seq = [pattern[0], pattern[1], pattern[0], '?']
    const correct = pattern[1]
    const distractors = shuffle(COLORS.filter((c) => c !== correct)).slice(0, 3)
    return {
      sequence: seq,
      correct,
      options: shuffle([correct, ...distractors]),
      type: 'colors',
    }
  }

  // HARD: multiply sequence
  const start = Math.floor(Math.random() * 3) + 2
  const factor = 2
  const seq = [start, start * factor, start * factor * factor, '?']
  const correct = start * factor * factor * factor
  const options = shuffle([correct, correct + 2, correct - 2, correct * 2])
  return { sequence: seq, correct, options, type: 'numbers' }
}

// ─── WORD_SEARCH ──────────────────────────────────────────────────────────────

export async function generateWordSearchContent(
  difficulty: Difficulty
): Promise<{
  grid: string[][]
  words: string[]
  theme: string
}> {
  const size = difficulty === 'EASY' ? 5 : difficulty === 'MEDIUM' ? 6 : 7
  const wordCount = difficulty === 'EASY' ? 3 : difficulty === 'MEDIUM' ? 4 : 5

  const themeKeys = Object.keys(WORD_THEMES)
  const theme = randomFrom(themeKeys)
  const themeWords = shuffle(WORD_THEMES[theme]).slice(0, wordCount)

  // Filter words that fit in the grid
  const fittingWords = themeWords.filter((w) => w.length <= size)
  const { grid, placedWords } = generateWordSearchGrid(fittingWords, size)

  return { grid, words: placedWords, theme }
}

// ─── ORDER_STORY ──────────────────────────────────────────────────────────────

const STORY_THEMES = [
  {
    title: 'Un día en el parque',
    images: [
      { emoji: '🌅', description: 'Amanecer' },
      { emoji: '🚶', description: 'Caminando' },
      { emoji: '🌳', description: 'En el parque' },
      { emoji: '🍦', description: 'Tomando helado' },
    ],
  },
  {
    title: 'Preparando el desayuno',
    images: [
      { emoji: '⏰', description: 'Despertarse' },
      { emoji: '🚿', description: 'Ducharse' },
      { emoji: '🍳', description: 'Cocinar' },
      { emoji: '☕', description: 'Tomar café' },
    ],
  },
  {
    title: 'Visita al jardín',
    images: [
      { emoji: '🌱', description: 'Plantar semilla' },
      { emoji: '💧', description: 'Regar' },
      { emoji: '🌿', description: 'Crecer' },
      { emoji: '🌺', description: 'Florecer' },
    ],
  },
]

export async function generateOrderStoryContent(
  difficulty: Difficulty
): Promise<{
  images: Array<{ id: string; emoji: string; label: string; correctPosition: number }>
  title: string
}> {
  const story = randomFrom(STORY_THEMES)
  const count = difficulty === 'EASY' ? 3 : difficulty === 'MEDIUM' ? 4 : 4
  const selected = story.images.slice(0, count)

  const images = selected.map((img, idx) => ({
    id: uuidv4(),
    emoji: img.emoji,
    label: img.description,
    correctPosition: idx,
  }))

  return { images: shuffle(images), title: story.title }
}

// ─── WHAT_IS_MISSING ─────────────────────────────────────────────────────────

const WHAT_IS_MISSING_POOL: Array<{ emoji: string; label: string }> = [
  { emoji: '🍎', label: 'Manzana' },
  { emoji: '🍊', label: 'Naranja' },
  { emoji: '🍇', label: 'Uvas' },
  { emoji: '🍓', label: 'Frutilla' },
  { emoji: '🍋', label: 'Limón' },
  { emoji: '🥝', label: 'Kiwi' },
  { emoji: '🍑', label: 'Durazno' },
  { emoji: '🍉', label: 'Sandía' },
  { emoji: '🌽', label: 'Choclo' },
  { emoji: '🥕', label: 'Zanahoria' },
  { emoji: '🍄', label: 'Hongo' },
  { emoji: '🥑', label: 'Palta' },
  { emoji: '🐶', label: 'Perro' },
  { emoji: '🐱', label: 'Gato' },
  { emoji: '🐦', label: 'Pájaro' },
  { emoji: '🐠', label: 'Pez' },
]

export async function generateWhatIsMissingContent(difficulty: Difficulty): Promise<{
  allItems: Array<{ id: string; emoji: string; label: string }>
  correct: string
  options: string[]
}> {
  const totalCount = difficulty === 'EASY' ? 5 : difficulty === 'MEDIUM' ? 6 : 7

  const selected = shuffle(WHAT_IS_MISSING_POOL).slice(0, totalCount)
  // Pick a random item to be "the missing one"
  const missingIndex = Math.floor(Math.random() * totalCount)
  const missingItem = selected[missingIndex]

  const allItems = selected.map((item) => ({
    id: uuidv4(),
    emoji: item.emoji,
    label: item.label,
  }))

  const distractors = shuffle(
    WHAT_IS_MISSING_POOL
      .filter((i) => !selected.some((s) => s.label === i.label))
  ).slice(0, 3)

  const options = shuffle([missingItem.label, ...distractors.map((d) => d.label)])

  return { allItems, correct: missingItem.label, options }
}

// ─── PROVERBS ─────────────────────────────────────────────────────────────────

const PROVERBS_POOL = [
  { first: 'Camarón que se duerme...', correct: 'se lo lleva la corriente' },
  { first: 'A mal tiempo...', correct: 'buena cara' },
  { first: 'No hay mal que por bien...', correct: 'no venga' },
  { first: 'En boca cerrada...', correct: 'no entran moscas' },
  { first: 'Más vale tarde...', correct: 'que nunca' },
  { first: 'Al que madruga...', correct: 'Dios lo ayuda' },
  { first: 'Dime con quién andás...', correct: 'y te diré quién sos' },
  { first: 'No hay rosa sin...', correct: 'espinas' },
  { first: 'Ojos que no ven...', correct: 'corazón que no siente' },
  { first: 'Querer es...', correct: 'poder' },
  { first: 'A caballo regalado...', correct: 'no se le miran los dientes' },
  { first: 'El que ríe último...', correct: 'ríe mejor' },
  { first: 'Más vale pájaro en mano...', correct: 'que cien volando' },
  { first: 'Perro que ladra...', correct: 'no muerde' },
]

export async function generateProverbsContent(difficulty: Difficulty): Promise<{
  firstPart: string
  correct: string
  options: string[]
}> {
  const shuffledPool = shuffle(PROVERBS_POOL)
  const chosen = shuffledPool[0]

  const distractors = shuffledPool
    .slice(1)
    .filter((p) => p.correct !== chosen.correct)
    .slice(0, 3)
    .map((p) => p.correct)

  const options = shuffle([chosen.correct, ...distractors])

  return { firstPart: chosen.first, correct: chosen.correct, options }
}

// ─── ODD_ONE_OUT ──────────────────────────────────────────────────────────────

const ODD_SETS = [
  {
    category: 'Frutas',
    members: [{ emoji: '🍎', label: 'Manzana' }, { emoji: '🍊', label: 'Naranja' }, { emoji: '🍇', label: 'Uvas' }],
    odd: { emoji: '🥕', label: 'Zanahoria' },
  },
  {
    category: 'Animales',
    members: [{ emoji: '🐶', label: 'Perro' }, { emoji: '🐱', label: 'Gato' }, { emoji: '🐦', label: 'Pájaro' }],
    odd: { emoji: '🚗', label: 'Auto' },
  },
  {
    category: 'Verduras',
    members: [{ emoji: '🥕', label: 'Zanahoria' }, { emoji: '🌽', label: 'Choclo' }, { emoji: '🥦', label: 'Brócoli' }],
    odd: { emoji: '🍓', label: 'Frutilla' },
  },
  {
    category: 'Medios de transporte',
    members: [{ emoji: '🚗', label: 'Auto' }, { emoji: '🚌', label: 'Colectivo' }, { emoji: '✈️', label: 'Avión' }],
    odd: { emoji: '🐶', label: 'Perro' },
  },
  {
    category: 'Colores',
    members: [{ emoji: '🔴', label: 'Rojo' }, { emoji: '🔵', label: 'Azul' }, { emoji: '🟢', label: 'Verde' }],
    odd: { emoji: '🔨', label: 'Martillo' },
  },
  {
    category: 'Instrumentos musicales',
    members: [{ emoji: '🎸', label: 'Guitarra' }, { emoji: '🎹', label: 'Piano' }, { emoji: '🥁', label: 'Batería' }],
    odd: { emoji: '🍕', label: 'Pizza' },
  },
  {
    category: 'Cosas del hogar',
    members: [{ emoji: '🛋️', label: 'Sillón' }, { emoji: '🛏️', label: 'Cama' }, { emoji: '🚿', label: 'Ducha' }],
    odd: { emoji: '🦁', label: 'León' },
  },
  {
    category: 'Flores',
    members: [{ emoji: '🌹', label: 'Rosa' }, { emoji: '🌷', label: 'Tulipán' }, { emoji: '🌸', label: 'Flor de cerezo' }],
    odd: { emoji: '🍺', label: 'Cerveza' },
  },
]

export async function generateOddOneOutContent(difficulty: Difficulty): Promise<{
  items: Array<{ emoji: string; label: string }>
  correct: string
  categoryName: string
}> {
  const availableSets = difficulty === 'EASY' ? ODD_SETS.slice(0, 4) : ODD_SETS
  const chosen = randomFrom(availableSets)

  const items = shuffle([...chosen.members, chosen.odd])

  return {
    items,
    correct: chosen.odd.label,
    categoryName: chosen.category,
  }
}

// ─── SIMPLE_MATH ──────────────────────────────────────────────────────────────

export async function generateSimpleMathContent(difficulty: Difficulty): Promise<{
  questionText: string
  a: number
  b: number
  operation: '+' | '-'
  correct: number
  options: number[]
}> {
  let a: number
  let b: number
  let operation: '+' | '-'

  if (difficulty === 'EASY') {
    a = Math.floor(Math.random() * 5) + 1
    b = Math.floor(Math.random() * 5) + 1
    operation = '+'
  } else if (difficulty === 'MEDIUM') {
    a = Math.floor(Math.random() * 10) + 1
    b = Math.floor(Math.random() * 10) + 1
    operation = Math.random() < 0.5 ? '+' : '-'
    if (operation === '-' && b > a) {
      ;[a, b] = [b, a]
    }
  } else {
    a = Math.floor(Math.random() * 20) + 1
    b = Math.floor(Math.random() * 20) + 1
    operation = Math.random() < 0.5 ? '+' : '-'
    if (operation === '-' && b > a) {
      ;[a, b] = [b, a]
    }
  }

  const correct = operation === '+' ? a + b : a - b

  const distractorCandidates = [
    correct + 1,
    correct - 1,
    correct + 2,
    correct - 2,
    correct + 3,
  ].filter((n) => n !== correct && n >= 0)

  const distractors = shuffle([...new Set(distractorCandidates)]).slice(0, 3)
  const options = shuffle([correct, ...distractors])

  return {
    questionText: `${a} ${operation} ${b} = ?`,
    a,
    b,
    operation,
    correct,
    options,
  }
}

// ─── COMPLETE_SONG ────────────────────────────────────────────────────────────

export async function generateCompleteSongContent(
  patientId: string
): Promise<{
  audioUrl: string
  lyricFragment: string
  correct: string
  options: string[]
} | null> {
  const audioFile = await prisma.mediaFile.findFirst({
    where: { patientId, type: 'AUDIO', usedInActivity: 'COMPLETE_SONG' },
  })

  if (!audioFile) return null

  const fragment = audioFile.label || 'Canción'
  const placeholder = fragment + ' ___'
  const correct = 'corazón'
  const options = shuffle([correct, 'amor', 'canción', 'vida'])

  return {
    audioUrl: audioFile.url,
    lyricFragment: placeholder,
    correct,
    options,
  }
}

// ─── SIMPLE PUZZLE ────────────────────────────────────────────────────────────

export function generateSimplePuzzleContent(difficulty: Difficulty): {
  emoji: string
  label: string
  gridSize: number
} {
  const EASY_PUZZLES = [
    { emoji: '🌈', label: 'Arco iris' },
    { emoji: '🌻', label: 'Girasol' },
    { emoji: '🦋', label: 'Mariposa' },
    { emoji: '⭐', label: 'Estrella' },
  ]
  const MEDIUM_PUZZLES = [
    { emoji: '🏡', label: 'Casa' },
    { emoji: '🌸', label: 'Flor' },
    { emoji: '🍎', label: 'Manzana' },
    { emoji: '🐶', label: 'Perro' },
    { emoji: '🎨', label: 'Arte' },
  ]

  const pool = difficulty === Difficulty.EASY ? EASY_PUZZLES : MEDIUM_PUZZLES
  const picked = pool[Math.floor(Math.random() * pool.length)]
  const gridSize = difficulty === Difficulty.EASY ? 2 : 3

  return { ...picked, gridSize }
}

// ─── SUDOKU ───────────────────────────────────────────────────────────────────

interface SudokuPuzzle {
  puzzle: (number | null)[][]
  solution: number[][]
  size: 4
}

// Valid 4x4 Sudoku puzzles. null = empty cell for the player to fill.
const SUDOKU_PUZZLES_EASY: SudokuPuzzle[] = [
  {
    size: 4,
    solution: [[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]],
    puzzle:   [[1,null,3,null],[null,4,null,2],[2,null,4,null],[null,3,null,1]],
  },
  {
    size: 4,
    solution: [[2,1,4,3],[4,3,2,1],[1,2,3,4],[3,4,1,2]],
    puzzle:   [[null,1,null,3],[4,null,2,null],[null,2,null,4],[3,null,1,null]],
  },
  {
    size: 4,
    solution: [[3,4,1,2],[1,2,3,4],[4,3,2,1],[2,1,4,3]],
    puzzle:   [[3,null,null,2],[null,2,3,null],[4,null,null,1],[null,1,4,null]],
  },
  {
    size: 4,
    solution: [[4,3,2,1],[2,1,4,3],[3,4,1,2],[1,2,3,4]],
    puzzle:   [[null,3,null,1],[2,null,4,null],[null,4,null,2],[1,null,3,null]],
  },
]

const SUDOKU_PUZZLES_MEDIUM: SudokuPuzzle[] = [
  {
    size: 4,
    solution: [[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]],
    puzzle:   [[1,null,null,4],[null,4,null,null],[null,null,4,null],[null,null,null,1]],
  },
  {
    size: 4,
    solution: [[2,1,4,3],[4,3,2,1],[1,2,3,4],[3,4,1,2]],
    puzzle:   [[2,null,null,null],[null,null,2,null],[null,2,null,null],[null,null,null,2]],
  },
  {
    size: 4,
    solution: [[3,4,1,2],[1,2,3,4],[4,3,2,1],[2,1,4,3]],
    puzzle:   [[3,null,null,null],[null,2,null,null],[null,null,2,null],[null,null,null,3]],
  },
]

export function generateSudokuContent(difficulty: Difficulty): SudokuPuzzle {
  const pool = difficulty === Difficulty.EASY ? SUDOKU_PUZZLES_EASY : SUDOKU_PUZZLES_MEDIUM
  return pool[Math.floor(Math.random() * pool.length)]
}
