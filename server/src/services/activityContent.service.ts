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

const FIND_OBJECT_POOL: Array<{ emoji: string; name: string }> = [
  { emoji: '🍎', name: 'Manzana' },
  { emoji: '🐱', name: 'Gato' },
  { emoji: '🌷', name: 'Flor' },
  { emoji: '🍓', name: 'Fresa' },
  { emoji: '🚗', name: 'Auto' },
  { emoji: '🏠', name: 'Casa' },
  { emoji: '☀️', name: 'Sol' },
  { emoji: '🍦', name: 'Helado' },
  { emoji: '🎈', name: 'Globo' },
  { emoji: '🐶', name: 'Perro' },
]

export async function generateFindObjectContent(
  _difficulty: Difficulty
): Promise<{
  target: { name: string; emoji: string }
  options: Array<{ name: string; emoji: string; isCorrect: boolean }>
}> {
  const shuffled = shuffle(FIND_OBJECT_POOL).slice(0, 3)
  const target = shuffled[0]

  const options = shuffle(
    shuffled.map((item) => ({
      name: item.name,
      emoji: item.emoji,
      isCorrect: item.name === target.name,
    }))
  )

  return { target: { name: target.name, emoji: target.emoji }, options }
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
