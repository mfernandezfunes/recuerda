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
  { emoji: '🌻', label: 'Girasol' },
  { emoji: '🦋', label: 'Mariposa' },
  { emoji: '🍰', label: 'Torta' },
  { emoji: '🎁', label: 'Regalo' },
  { emoji: '🐘', label: 'Elefante' },
  { emoji: '🍦', label: 'Helado' },
  { emoji: '🌹', label: 'Rosa' },
  { emoji: '🦜', label: 'Loro' },
  { emoji: '🍋', label: 'Limón' },
  { emoji: '🚲', label: 'Bicicleta' },
  { emoji: '🎈', label: 'Globo' },
  { emoji: '🐥', label: 'Pollito' },
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
  { emoji: '🍎', name: 'Manzana',   article: 'la' },
  { emoji: '🐱', name: 'Gato',      article: 'el' },
  { emoji: '🌷', name: 'Flor',      article: 'la' },
  { emoji: '🍓', name: 'Frutilla',  article: 'la' },
  { emoji: '🚗', name: 'Auto',      article: 'el' },
  { emoji: '🏠', name: 'Casa',      article: 'la' },
  { emoji: '☀️', name: 'Sol',       article: 'el' },
  { emoji: '🍦', name: 'Helado',    article: 'el' },
  { emoji: '🎈', name: 'Globo',     article: 'el' },
  { emoji: '🐶', name: 'Perro',     article: 'el' },
  { emoji: '🌻', name: 'Girasol',   article: 'el' },
  { emoji: '🍕', name: 'Pizza',     article: 'la' },
  { emoji: '🎂', name: 'Torta',     article: 'la' },
  { emoji: '🚲', name: 'Bicicleta', article: 'la' },
  { emoji: '🌙', name: 'Luna',      article: 'la' },
  { emoji: '🍇', name: 'Uvas',      article: 'las' },
  { emoji: '🌹', name: 'Rosa',      article: 'la' },
  { emoji: '🎸', name: 'Guitarra',  article: 'la' },
  { emoji: '🐠', name: 'Pez',       article: 'el' },
  { emoji: '🍉', name: 'Sandía',    article: 'la' },
  { emoji: '🐓', name: 'Gallina',   article: 'la' },
  { emoji: '⭐', name: 'Estrella',  article: 'la' },
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
  const COLORS = ['🔴', '🟡', '🔵', '🟢', '🟠', '🟣', '🟤', '⚫', '⚪', '🟨']
  const ANIMALS = ['🐶', '🐱', '🐦', '🐠', '🐘', '🐸', '🦋', '🐇', '🐯', '🐮', '🐷', '🐼']
  const SHAPES = ['⚪', '🔺', '⬛', '⬜', '🔶', '🔷', '🔸', '🔹', '🟥', '🟦', '🟧', '🟨', '🟩', '🟪']
  const FRUITS = ['🍎', '🍊', '🍋', '🍌', '🍇', '🍉', '🍓', '🍑', '🍒', '🥝']

  if (difficulty === 'EASY') {
    const patterns = [
      // +1 sequence
      () => {
        const start = Math.floor(Math.random() * 5) + 1
        const seq = [start, start + 1, start + 2, '?']
        const correct = start + 3
        return { sequence: seq, correct, options: shuffle([correct, correct + 1, correct - 1, correct + 2]), type: 'numbers' as const }
      },
      // +2 sequence
      () => {
        const start = Math.floor(Math.random() * 5) + 1
        const seq = [start, start + 2, start + 4, '?']
        const correct = start + 6
        return { sequence: seq, correct, options: shuffle([correct, correct + 2, correct - 2, correct + 1]), type: 'numbers' as const }
      },
      // -1 descending
      () => {
        const start = Math.floor(Math.random() * 5) + 10
        const seq = [start, start - 1, start - 2, '?']
        const correct = start - 3
        return { sequence: seq, correct, options: shuffle([correct, correct + 1, correct - 1, start]), type: 'numbers' as const }
      },
      // AB color pattern
      () => {
        const pattern = shuffle(COLORS).slice(0, 2)
        const seq = [pattern[0], pattern[1], pattern[0], '?']
        const correct = pattern[1]
        const distractors = shuffle(COLORS.filter((c) => c !== correct)).slice(0, 3)
        return { sequence: seq, correct, options: shuffle([correct, ...distractors]), type: 'colors' as const }
      },
      // AAB pattern with fruits
      () => {
        const pattern = shuffle(FRUITS).slice(0, 2)
        const seq = [pattern[0], pattern[0], pattern[1], pattern[0], '?']
        const correct = pattern[0]
        const distractors = shuffle(FRUITS.filter((f) => f !== correct)).slice(0, 3)
        return { sequence: seq, correct, options: shuffle([correct, ...distractors]), type: 'colors' as const }
      },
      // +3 sequence
      () => {
        const start = Math.floor(Math.random() * 4) + 1
        const seq = [start, start + 3, start + 6, '?']
        const correct = start + 9
        return { sequence: seq, correct, options: shuffle([correct, correct + 3, correct - 3, correct + 1]), type: 'numbers' as const }
      },
    ]
    return randomFrom(patterns)()
  }

  if (difficulty === 'MEDIUM') {
    const patterns = [
      // ABABAB colors
      () => {
        const pattern = shuffle(COLORS).slice(0, 2)
        const seq = [pattern[0], pattern[1], pattern[0], '?']
        const correct = pattern[1]
        const distractors = shuffle(COLORS.filter((c) => c !== correct)).slice(0, 3)
        return { sequence: seq, correct, options: shuffle([correct, ...distractors]), type: 'colors' as const }
      },
      // ABCABC animals
      () => {
        const pattern = shuffle(ANIMALS).slice(0, 3)
        const seq = [pattern[0], pattern[1], pattern[2], pattern[0], '?']
        const correct = pattern[1]
        const distractors = shuffle(ANIMALS.filter((a) => a !== correct)).slice(0, 3)
        return { sequence: seq, correct, options: shuffle([correct, ...distractors]), type: 'colors' as const }
      },
      // +4 sequence
      () => {
        const start = Math.floor(Math.random() * 5) + 1
        const seq = [start, start + 4, start + 8, '?']
        const correct = start + 12
        return { sequence: seq, correct, options: shuffle([correct, correct + 4, correct - 4, correct + 1]), type: 'numbers' as const }
      },
      // -2 descending
      () => {
        const start = Math.floor(Math.random() * 5) + 15
        const seq = [start, start - 2, start - 4, '?']
        const correct = start - 6
        return { sequence: seq, correct, options: shuffle([correct, correct + 2, correct - 2, start]), type: 'numbers' as const }
      },
      // AABBCC shapes
      () => {
        const pattern = shuffle(SHAPES).slice(0, 3)
        const seq = [pattern[0], pattern[0], pattern[1], pattern[1], pattern[2], '?']
        const correct = pattern[2]
        const distractors = shuffle(SHAPES.filter((s) => s !== correct)).slice(0, 3)
        return { sequence: seq, correct, options: shuffle([correct, ...distractors]), type: 'shapes' as const }
      },
      // ABBA pattern
      () => {
        const pattern = shuffle(FRUITS).slice(0, 2)
        const seq = [pattern[0], pattern[1], pattern[1], pattern[0], pattern[0], '?']
        const correct = pattern[1]
        const distractors = shuffle(FRUITS.filter((f) => f !== correct)).slice(0, 3)
        return { sequence: seq, correct, options: shuffle([correct, ...distractors]), type: 'colors' as const }
      },
      // +5 sequence
      () => {
        const start = Math.floor(Math.random() * 4) + 1
        const seq = [start, start + 5, start + 10, '?']
        const correct = start + 15
        return { sequence: seq, correct, options: shuffle([correct, correct + 5, correct - 5, correct + 1]), type: 'numbers' as const }
      },
      // Pares sequence (2, 4, 6, 8)
      () => {
        const start = Math.floor(Math.random() * 3) * 2 + 2
        const seq = [start, start + 2, start + 4, '?']
        const correct = start + 6
        return { sequence: seq, correct, options: shuffle([correct, correct + 2, correct - 2, correct + 1]), type: 'numbers' as const }
      },
    ]
    return randomFrom(patterns)()
  }

  // HARD difficulty
  const patterns = [
    // ×2 multiply sequence
    () => {
      const start = Math.floor(Math.random() * 3) + 2
      const seq = [start, start * 2, start * 4, '?']
      const correct = start * 8
      return { sequence: seq, correct, options: shuffle([correct, correct + 2, correct / 2, start * 6]), type: 'numbers' as const }
    },
    // +10 sequence
    () => {
      const start = Math.floor(Math.random() * 5) + 5
      const seq = [start, start + 10, start + 20, '?']
      const correct = start + 30
      return { sequence: seq, correct, options: shuffle([correct, correct + 10, correct - 10, correct + 5]), type: 'numbers' as const }
    },
    // -5 descending
    () => {
      const start = Math.floor(Math.random() * 10) + 30
      const seq = [start, start - 5, start - 10, '?']
      const correct = start - 15
      return { sequence: seq, correct, options: shuffle([correct, correct + 5, correct - 5, start]), type: 'numbers' as const }
    },
    // Fibonacci-like (simplified)
    () => {
      const a = Math.floor(Math.random() * 3) + 1
      const b = Math.floor(Math.random() * 3) + 2
      const seq = [a, b, a + b, '?']
      const correct = b + (a + b)
      return { sequence: seq, correct, options: shuffle([correct, correct + 1, correct - 1, a + b + 1]), type: 'numbers' as const }
    },
    // Squares (1, 4, 9, 16)
    () => {
      const start = Math.floor(Math.random() * 2) + 2
      const seq = [start * start, (start + 1) * (start + 1), (start + 2) * (start + 2), '?']
      const correct = (start + 3) * (start + 3)
      return { sequence: seq, correct, options: shuffle([correct, correct + 1, correct - 1, start * start * 2]), type: 'numbers' as const }
    },
    // ABCDABCD pattern
    () => {
      const pattern = shuffle(ANIMALS).slice(0, 4)
      const seq = [pattern[0], pattern[1], pattern[2], pattern[3], pattern[0], '?']
      const correct = pattern[1]
      const distractors = shuffle(ANIMALS.filter((a) => a !== correct)).slice(0, 3)
      return { sequence: seq, correct, options: shuffle([correct, ...distractors]), type: 'colors' as const }
    },
    // AABBAABB pattern
    () => {
      const pattern = shuffle(SHAPES).slice(0, 2)
      const seq = [pattern[0], pattern[0], pattern[1], pattern[1], pattern[0], '?']
      const correct = pattern[0]
      const distractors = shuffle(SHAPES.filter((s) => s !== correct)).slice(0, 3)
      return { sequence: seq, correct, options: shuffle([correct, ...distractors]), type: 'shapes' as const }
    },
    // +7 sequence
    () => {
      const start = Math.floor(Math.random() * 5) + 3
      const seq = [start, start + 7, start + 14, '?']
      const correct = start + 21
      return { sequence: seq, correct, options: shuffle([correct, correct + 7, correct - 7, correct + 1]), type: 'numbers' as const }
    },
    // Impares sequence (1, 3, 5, 7)
    () => {
      const start = Math.floor(Math.random() * 4) * 2 + 1
      const seq = [start, start + 2, start + 4, '?']
      const correct = start + 6
      return { sequence: seq, correct, options: shuffle([correct, correct + 2, correct - 2, correct + 1]), type: 'numbers' as const }
    },
  ]
  return randomFrom(patterns)()
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
      { emoji: '🚶', description: 'Caminando al parque' },
      { emoji: '🌳', description: 'Descansando bajo el árbol' },
      { emoji: '🍦', description: 'Tomando helado' },
    ],
  },
  {
    title: 'Preparando el desayuno',
    images: [
      { emoji: '⏰', description: 'Despertarse' },
      { emoji: '🚿', description: 'Ducharse' },
      { emoji: '🍳', description: 'Cocinar los huevos' },
      { emoji: '☕', description: 'Tomar el café' },
    ],
  },
  {
    title: 'Visita al jardín',
    images: [
      { emoji: '🌱', description: 'Plantar la semilla' },
      { emoji: '💧', description: 'Regar la planta' },
      { emoji: '🌿', description: 'Ver cómo crece' },
      { emoji: '🌺', description: 'Disfrutar la flor' },
    ],
  },
  {
    title: 'Preparar mate',
    images: [
      { emoji: '🌡️', description: 'Calentar el agua' },
      { emoji: '🧉', description: 'Llenar el mate' },
      { emoji: '💧', description: 'Cebar el primer mate' },
      { emoji: '😊', description: 'Tomar y disfrutar' },
    ],
  },
  {
    title: 'Hacer una torta',
    images: [
      { emoji: '🛒', description: 'Comprar los ingredientes' },
      { emoji: '🥚', description: 'Mezclar todo' },
      { emoji: '🔥', description: 'Hornear la torta' },
      { emoji: '🎂', description: 'Decorar y comer' },
    ],
  },
  {
    title: 'Lavar la ropa',
    images: [
      { emoji: '👕', description: 'Juntar la ropa sucia' },
      { emoji: '🫧', description: 'Lavar con jabón' },
      { emoji: '☀️', description: 'Tender al sol' },
      { emoji: '📦', description: 'Doblar y guardar' },
    ],
  },
  {
    title: 'Visita de un familiar',
    images: [
      { emoji: '📞', description: 'Hablar por teléfono' },
      { emoji: '🏠', description: 'Preparar la casa' },
      { emoji: '🤗', description: 'Recibir la visita' },
      { emoji: '👋', description: 'Despedirse con cariño' },
    ],
  },
  {
    title: 'Ir de compras',
    images: [
      { emoji: '📝', description: 'Escribir la lista' },
      { emoji: '🚶', description: 'Ir al mercado' },
      { emoji: '🛒', description: 'Llenar el carrito' },
      { emoji: '🏡', description: 'Volver a casa' },
    ],
  },
  {
    title: 'Una tarde de lluvia',
    images: [
      { emoji: '☁️', description: 'El cielo se nubla' },
      { emoji: '⚡', description: 'Caen relámpagos' },
      { emoji: '🌧️', description: 'Llueve fuerte' },
      { emoji: '🌈', description: 'Sale el arcoíris' },
    ],
  },
  {
    title: 'Una tarde de pesca',
    images: [
      { emoji: '🎣', description: 'Preparar la caña' },
      { emoji: '🚣', description: 'Llegar al río' },
      { emoji: '🐟', description: 'Atrapar el pez' },
      { emoji: '🔥', description: 'Asar el pescado' },
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
  { emoji: '🌹', label: 'Rosa' },
  { emoji: '🌻', label: 'Girasol' },
  { emoji: '🌷', label: 'Tulipán' },
  { emoji: '🍕', label: 'Pizza' },
  { emoji: '🍰', label: 'Torta' },
  { emoji: '🍦', label: 'Helado' },
  { emoji: '🎈', label: 'Globo' },
  { emoji: '⭐', label: 'Estrella' },
  { emoji: '🌙', label: 'Luna' },
  { emoji: '☀️', label: 'Sol' },
  { emoji: '🚗', label: 'Auto' },
  { emoji: '🚲', label: 'Bicicleta' },
  { emoji: '🐘', label: 'Elefante' },
  { emoji: '🦋', label: 'Mariposa' },
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
  { first: 'No todo lo que brilla...', correct: 'es oro' },
  { first: 'Cuando el río suena...', correct: 'piedras trae' },
  { first: 'A Dios rogando...', correct: 'y con el mazo dando' },
  { first: 'El hábito no hace...', correct: 'al monje' },
  { first: 'Agua que no has de beber...', correct: 'déjala correr' },
  { first: 'No dejes para mañana...', correct: 'lo que puedas hacer hoy' },
  { first: 'Más sabe el diablo por viejo...', correct: 'que por diablo' },
  { first: 'De tal palo...', correct: 'tal astilla' },
  { first: 'Pueblo chico...', correct: 'infierno grande' },
  { first: 'Barriga llena...', correct: 'corazón contento' },
  { first: 'El que mucho abarca...', correct: 'poco aprieta' },
  { first: 'A quien madruga...', correct: 'Dios lo ayuda' },
  { first: 'Donde hay humo...', correct: 'hay fuego' },
  { first: 'No hay peor sordo...', correct: 'que el que no quiere oír' },
  { first: 'Más vale malo conocido...', correct: 'que bueno por conocer' },
  { first: 'Cada oveja con...', correct: 'su pareja' },
  { first: 'Obras son amores...', correct: 'y no buenas razones' },
  { first: 'El que tiene boca...', correct: 'se equivoca' },
  { first: 'A grandes males...', correct: 'grandes remedios' },
  { first: 'Cría cuervos...', correct: 'y te sacarán los ojos' },
  { first: 'No hay mal que dure...', correct: 'cien años' },
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
    category: 'Muebles',
    members: [{ emoji: '🛋️', label: 'Sillón' }, { emoji: '🛏️', label: 'Cama' }, { emoji: '🪑', label: 'Silla' }],
    odd: { emoji: '🦁', label: 'León' },
  },
  {
    category: 'Flores',
    members: [{ emoji: '🌹', label: 'Rosa' }, { emoji: '🌷', label: 'Tulipán' }, { emoji: '🌸', label: 'Flor de cerezo' }],
    odd: { emoji: '🍺', label: 'Cerveza' },
  },
  {
    category: 'Aves',
    members: [{ emoji: '🦆', label: 'Pato' }, { emoji: '🦜', label: 'Loro' }, { emoji: '🐧', label: 'Pingüino' }],
    odd: { emoji: '🐟', label: 'Pez' },
  },
  {
    category: 'Ropa',
    members: [{ emoji: '👕', label: 'Camiseta' }, { emoji: '👗', label: 'Vestido' }, { emoji: '🧥', label: 'Abrigo' }],
    odd: { emoji: '🍰', label: 'Torta' },
  },
  {
    category: 'Herramientas',
    members: [{ emoji: '🔨', label: 'Martillo' }, { emoji: '🪛', label: 'Destornillador' }, { emoji: '🔧', label: 'Llave' }],
    odd: { emoji: '🌹', label: 'Rosa' },
  },
  {
    category: 'Deportes',
    members: [{ emoji: '⚽', label: 'Fútbol' }, { emoji: '🏀', label: 'Básquet' }, { emoji: '🎾', label: 'Tenis' }],
    odd: { emoji: '📱', label: 'Celular' },
  },
  {
    category: 'Animales del mar',
    members: [{ emoji: '🐟', label: 'Pez' }, { emoji: '🐙', label: 'Pulpo' }, { emoji: '🦈', label: 'Tiburón' }],
    odd: { emoji: '🐦', label: 'Pájaro' },
  },
  {
    category: 'Cosas de cocina',
    members: [{ emoji: '🥄', label: 'Cuchara' }, { emoji: '🍴', label: 'Tenedor' }, { emoji: '🔪', label: 'Cuchillo' }],
    odd: { emoji: '📚', label: 'Libro' },
  },
  {
    category: 'Postres',
    members: [{ emoji: '🍰', label: 'Torta' }, { emoji: '🍮', label: 'Flan' }, { emoji: '🍦', label: 'Helado' }],
    odd: { emoji: '🔑', label: 'Llave' },
  },
  {
    category: 'Cosas de baño',
    members: [{ emoji: '🧼', label: 'Jabón' }, { emoji: '🪥', label: 'Cepillo' }, { emoji: '🧴', label: 'Champú' }],
    odd: { emoji: '🎸', label: 'Guitarra' },
  },
  {
    category: 'Animales de granja',
    members: [{ emoji: '🐄', label: 'Vaca' }, { emoji: '🐖', label: 'Cerdo' }, { emoji: '🐑', label: 'Oveja' }],
    odd: { emoji: '🚂', label: 'Tren' },
  },
  {
    category: 'Cosas del cielo',
    members: [{ emoji: '☀️', label: 'Sol' }, { emoji: '🌙', label: 'Luna' }, { emoji: '⭐', label: 'Estrella' }],
    odd: { emoji: '🐠', label: 'Pez' },
  },
  {
    category: 'Frutas cítricas',
    members: [{ emoji: '🍋', label: 'Limón' }, { emoji: '🍊', label: 'Naranja' }, { emoji: '🍈', label: 'Pomelo' }],
    odd: { emoji: '🐶', label: 'Perro' },
  },
  {
    category: 'Juguetes',
    members: [{ emoji: '🧸', label: 'Osito' }, { emoji: '🎮', label: 'Juego' }, { emoji: '🪀', label: 'Yoyo' }],
    odd: { emoji: '🥕', label: 'Zanahoria' },
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
    { emoji: '🌈', label: 'Arcoíris' },
    { emoji: '🌻', label: 'Girasol' },
    { emoji: '🦋', label: 'Mariposa' },
    { emoji: '⭐', label: 'Estrella' },
    { emoji: '🐸', label: 'Rana' },
    { emoji: '🍓', label: 'Frutilla' },
    { emoji: '🌙', label: 'Luna' },
    { emoji: '🐥', label: 'Pollito' },
    { emoji: '🌺', label: 'Hibisco' },
    { emoji: '🐱', label: 'Gato' },
    { emoji: '🍎', label: 'Manzana' },
    { emoji: '🐠', label: 'Pez' },
    { emoji: '🌸', label: 'Flor' },
    { emoji: '☀️', label: 'Sol' },
    { emoji: '🦊', label: 'Zorro' },
    { emoji: '🍊', label: 'Naranja' },
    { emoji: '🐝', label: 'Abeja' },
    { emoji: '🌵', label: 'Cactus' },
    { emoji: '🎈', label: 'Globo' },
    { emoji: '🐢', label: 'Tortuga' },
  ]
  const MEDIUM_PUZZLES = [
    { emoji: '🏡', label: 'Casa' },
    { emoji: '🌸', label: 'Flor' },
    { emoji: '🍎', label: 'Manzana' },
    { emoji: '🐶', label: 'Perro' },
    { emoji: '🎨', label: 'Paleta' },
    { emoji: '🚂', label: 'Tren' },
    { emoji: '🐬', label: 'Delfín' },
    { emoji: '🌺', label: 'Hibisco' },
    { emoji: '🦁', label: 'León' },
    { emoji: '🍕', label: 'Pizza' },
    { emoji: '🚗', label: 'Auto' },
    { emoji: '🎸', label: 'Guitarra' },
    { emoji: '🦜', label: 'Loro' },
    { emoji: '🍰', label: 'Torta' },
    { emoji: '🌲', label: 'Pino' },
    { emoji: '🐘', label: 'Elefante' },
    { emoji: '🎭', label: 'Teatro' },
    { emoji: '🚀', label: 'Cohete' },
    { emoji: '🦉', label: 'Búho' },
    { emoji: '🍉', label: 'Sandía' },
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
  size: 4 | 6 | 9
  boxRows: number
  boxCols: number
}

// ── 4×4  (EASY) ──
const SUDOKU_EASY: SudokuPuzzle[] = [
  {
    size: 4, boxRows: 2, boxCols: 2,
    solution: [[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]],
    puzzle:   [[1,null,3,null],[null,4,null,2],[2,null,4,null],[null,3,null,1]],
  },
  {
    size: 4, boxRows: 2, boxCols: 2,
    solution: [[2,1,4,3],[4,3,2,1],[1,2,3,4],[3,4,1,2]],
    puzzle:   [[null,1,null,3],[4,null,2,null],[null,2,null,4],[3,null,1,null]],
  },
  {
    size: 4, boxRows: 2, boxCols: 2,
    solution: [[3,4,1,2],[1,2,3,4],[4,3,2,1],[2,1,4,3]],
    puzzle:   [[3,null,null,2],[null,2,3,null],[4,null,null,1],[null,1,4,null]],
  },
  {
    size: 4, boxRows: 2, boxCols: 2,
    solution: [[4,3,2,1],[2,1,4,3],[3,4,1,2],[1,2,3,4]],
    puzzle:   [[null,3,null,1],[2,null,4,null],[null,4,null,2],[1,null,3,null]],
  },
  {
    size: 4, boxRows: 2, boxCols: 2,
    solution: [[1,3,2,4],[4,2,3,1],[2,4,1,3],[3,1,4,2]],
    puzzle:   [[null,3,2,null],[4,null,null,1],[null,4,1,null],[3,null,null,2]],
  },
  {
    size: 4, boxRows: 2, boxCols: 2,
    solution: [[1,4,2,3],[3,2,4,1],[4,3,1,2],[2,1,3,4]],
    puzzle:   [[1,null,null,3],[null,2,4,null],[null,3,1,null],[2,null,null,4]],
  },
  {
    size: 4, boxRows: 2, boxCols: 2,
    solution: [[2,4,1,3],[1,3,2,4],[4,2,3,1],[3,1,4,2]],
    puzzle:   [[null,4,null,3],[1,null,2,null],[null,2,null,1],[3,null,4,null]],
  },
  {
    size: 4, boxRows: 2, boxCols: 2,
    solution: [[3,1,4,2],[2,4,1,3],[1,3,2,4],[4,2,3,1]],
    puzzle:   [[3,null,null,2],[null,4,1,null],[null,3,2,null],[4,null,null,1]],
  },
  {
    size: 4, boxRows: 2, boxCols: 2,
    solution: [[4,2,3,1],[1,3,4,2],[3,1,2,4],[2,4,1,3]],
    puzzle:   [[4,null,3,null],[null,3,null,2],[3,null,2,null],[null,4,null,3]],
  },
  {
    size: 4, boxRows: 2, boxCols: 2,
    solution: [[2,3,1,4],[4,1,2,3],[1,4,3,2],[3,2,4,1]],
    puzzle:   [[null,3,1,null],[4,null,null,3],[null,4,3,null],[3,null,null,1]],
  },
  {
    size: 4, boxRows: 2, boxCols: 2,
    solution: [[3,4,2,1],[2,1,3,4],[4,2,1,3],[1,3,4,2]],
    puzzle:   [[3,null,null,1],[null,1,3,null],[null,2,1,null],[1,null,null,2]],
  },
  {
    size: 4, boxRows: 2, boxCols: 2,
    solution: [[1,2,4,3],[3,4,1,2],[2,3,4,1],[4,1,2,3]],
    puzzle:   [[1,null,4,null],[null,4,null,2],[2,null,4,null],[null,1,null,3]],
  },
]

// ── 6×6  (MEDIUM) ──
const SUDOKU_MEDIUM: SudokuPuzzle[] = [
  {
    size: 6, boxRows: 2, boxCols: 3,
    solution: [
      [1,2,3,4,5,6],
      [4,5,6,1,2,3],
      [2,3,1,5,6,4],
      [5,6,4,2,3,1],
      [3,1,2,6,4,5],
      [6,4,5,3,1,2],
    ],
    puzzle: [
      [1,null,3,null,null,6],
      [null,5,null,1,null,null],
      [2,null,null,5,6,null],
      [null,6,4,null,null,1],
      [null,null,2,null,4,null],
      [6,null,null,3,null,2],
    ],
  },
  {
    size: 6, boxRows: 2, boxCols: 3,
    solution: [
      [2,3,4,5,6,1],
      [5,6,1,2,3,4],
      [3,4,2,6,1,5],
      [6,1,5,3,4,2],
      [4,2,3,1,5,6],
      [1,5,6,4,2,3],
    ],
    puzzle: [
      [2,null,null,5,null,1],
      [null,6,1,null,3,null],
      [null,4,null,null,1,5],
      [6,null,5,null,null,2],
      [null,2,null,1,null,null],
      [1,null,6,null,2,null],
    ],
  },
  {
    size: 6, boxRows: 2, boxCols: 3,
    solution: [
      [3,4,5,6,1,2],
      [6,1,2,3,4,5],
      [4,5,6,1,2,3],
      [1,2,3,4,5,6],
      [5,6,1,2,3,4],
      [2,3,4,5,6,1],
    ],
    puzzle: [
      [null,4,null,6,null,2],
      [6,null,2,null,4,null],
      [null,5,null,1,null,3],
      [1,null,3,null,5,null],
      [null,6,null,2,null,4],
      [2,null,4,null,6,null],
    ],
  },
  {
    size: 6, boxRows: 2, boxCols: 3,
    solution: [
      [2,5,1,4,3,6],
      [4,3,6,2,5,1],
      [5,1,2,3,6,4],
      [3,6,4,5,1,2],
      [1,2,5,6,4,3],
      [6,4,3,1,2,5],
    ],
    puzzle: [
      [2,null,null,4,null,6],
      [null,3,6,null,5,null],
      [5,null,null,null,6,4],
      [null,6,4,null,null,2],
      [null,2,null,6,null,null],
      [6,null,3,null,2,null],
    ],
  },
  {
    size: 6, boxRows: 2, boxCols: 3,
    solution: [
      [1,3,5,2,4,6],
      [2,4,6,1,3,5],
      [3,5,1,4,6,2],
      [4,6,2,3,5,1],
      [5,1,3,6,2,4],
      [6,2,4,5,1,3],
    ],
    puzzle: [
      [1,null,5,null,null,6],
      [null,4,null,1,null,null],
      [3,null,null,4,6,null],
      [null,6,2,null,null,1],
      [null,null,3,null,2,null],
      [6,null,null,5,null,3],
    ],
  },
  {
    size: 6, boxRows: 2, boxCols: 3,
    solution: [
      [4,2,6,3,1,5],
      [3,1,5,4,2,6],
      [2,6,4,1,5,3],
      [1,5,3,2,6,4],
      [6,4,2,5,3,1],
      [5,3,1,6,4,2],
    ],
    puzzle: [
      [null,2,6,null,1,null],
      [3,null,null,4,null,6],
      [null,6,null,null,5,3],
      [1,null,3,null,null,4],
      [null,4,null,5,null,null],
      [5,null,1,null,4,null],
    ],
  },
  {
    size: 6, boxRows: 2, boxCols: 3,
    solution: [
      [5,1,3,6,2,4],
      [6,2,4,5,1,3],
      [1,3,5,2,4,6],
      [2,4,6,1,3,5],
      [3,5,1,4,6,2],
      [4,6,2,3,5,1],
    ],
    puzzle: [
      [5,null,null,6,null,4],
      [null,2,4,null,1,null],
      [null,3,null,2,null,6],
      [2,null,6,null,3,null],
      [null,5,null,4,null,null],
      [4,null,2,null,null,1],
    ],
  },
  {
    size: 6, boxRows: 2, boxCols: 3,
    solution: [
      [3,6,2,4,5,1],
      [4,5,1,3,6,2],
      [6,2,3,5,1,4],
      [5,1,4,6,2,3],
      [2,3,6,1,4,5],
      [1,4,5,2,3,6],
    ],
    puzzle: [
      [null,6,null,4,null,1],
      [4,null,1,null,6,null],
      [null,2,null,5,null,4],
      [5,null,4,null,2,null],
      [null,3,null,1,null,5],
      [1,null,5,null,3,null],
    ],
  },
]

// ── 9×9  (HARD) ──
// Solution from the classic Wikipedia example
const SUDOKU_HARD: SudokuPuzzle[] = [
  {
    size: 9, boxRows: 3, boxCols: 3,
    solution: [
      [5,3,4,6,7,8,9,1,2],
      [6,7,2,1,9,5,3,4,8],
      [1,9,8,3,4,2,5,6,7],
      [8,5,9,7,6,1,4,2,3],
      [4,2,6,8,5,3,7,9,1],
      [7,1,3,9,2,4,8,5,6],
      [9,6,1,5,3,7,2,8,4],
      [2,8,7,4,1,9,6,3,5],
      [3,4,5,2,8,6,1,7,9],
    ],
    puzzle: [
      [5,3,null,null,7,null,null,null,null],
      [6,null,null,1,9,5,null,null,null],
      [null,9,8,null,null,null,null,6,null],
      [8,null,null,null,6,null,null,null,3],
      [4,null,null,8,null,3,null,null,1],
      [7,null,null,null,2,null,null,null,6],
      [null,6,null,null,null,null,2,8,null],
      [null,null,null,4,1,9,null,null,5],
      [null,null,null,null,8,null,null,7,9],
    ],
  },
  {
    size: 9, boxRows: 3, boxCols: 3,
    solution: [
      [8,6,7,9,1,2,3,4,5],
      [9,1,5,4,3,8,6,7,2],
      [4,3,2,6,7,5,8,9,1],
      [2,8,3,1,9,4,7,5,6],
      [7,5,9,2,8,6,1,3,4],
      [1,4,6,3,5,7,2,8,9],
      [3,9,4,8,6,1,5,2,7],
      [5,2,1,7,4,3,9,6,8],
      [6,7,8,5,2,9,4,1,3],
    ],
    puzzle: [
      [8,null,null,null,1,null,3,null,5],
      [null,1,5,4,null,null,null,7,null],
      [4,null,null,null,7,5,null,null,1],
      [null,8,null,1,null,null,null,5,null],
      [7,null,9,null,null,null,1,null,4],
      [null,4,null,null,null,7,null,8,null],
      [3,null,null,8,6,null,null,null,7],
      [null,2,null,null,null,3,9,6,null],
      [6,null,8,null,2,null,null,null,3],
    ],
  },
  {
    size: 9, boxRows: 3, boxCols: 3,
    solution: [
      [1,2,3,4,5,6,7,8,9],
      [4,5,6,7,8,9,1,2,3],
      [7,8,9,1,2,3,4,5,6],
      [2,3,4,5,6,7,8,9,1],
      [5,6,7,8,9,1,2,3,4],
      [8,9,1,2,3,4,5,6,7],
      [3,4,5,6,7,8,9,1,2],
      [6,7,8,9,1,2,3,4,5],
      [9,1,2,3,4,5,6,7,8],
    ],
    puzzle: [
      [1,null,null,null,5,null,null,null,9],
      [null,5,6,null,null,null,1,2,null],
      [null,null,9,1,null,3,null,null,null],
      [2,null,null,null,6,null,null,null,1],
      [null,6,7,null,null,null,2,3,null],
      [null,null,1,2,null,4,null,null,null],
      [3,null,null,null,7,null,null,null,2],
      [null,7,8,null,null,null,3,4,null],
      [null,null,2,3,null,5,null,null,null],
    ],
  },
  {
    size: 9, boxRows: 3, boxCols: 3,
    solution: [
      [2,5,8,1,6,9,4,7,3],
      [1,6,9,2,7,3,5,8,4],
      [7,3,4,5,8,8,9,1,6],
      [5,8,1,6,9,2,7,3,4],
      [6,9,2,7,3,4,8,5,1],
      [3,4,7,8,5,1,6,9,2],
      [8,1,5,9,2,6,3,4,7],
      [9,2,6,3,4,7,1,6,5],
      [4,7,3,8,1,5,2,6,9],
    ],
    puzzle: [
      [null,5,null,1,null,9,null,7,null],
      [1,null,null,null,7,null,null,null,4],
      [null,null,4,5,null,8,9,null,null],
      [5,null,null,null,9,null,null,null,4],
      [null,9,2,null,null,null,8,5,null],
      [null,null,7,8,null,1,6,null,null],
      [8,null,null,null,2,null,null,null,7],
      [null,2,null,3,null,7,null,6,null],
      [null,null,3,null,1,null,2,null,null],
    ],
  },
  {
    size: 9, boxRows: 3, boxCols: 3,
    solution: [
      [3,6,9,2,4,7,1,5,8],
      [2,4,7,1,5,8,3,6,9],
      [1,5,8,3,6,9,2,4,7],
      [6,9,2,4,7,1,5,8,3],
      [4,7,1,5,8,3,6,9,2],
      [5,8,3,6,9,2,4,7,1],
      [9,2,4,7,1,5,8,3,6],
      [7,1,5,8,3,6,9,2,4],
      [8,3,6,9,2,4,7,1,5],
    ],
    puzzle: [
      [null,6,null,null,4,null,null,5,null],
      [2,null,null,1,null,null,3,null,null],
      [null,null,8,null,null,9,null,null,7],
      [null,9,null,null,7,null,null,8,null],
      [4,null,null,5,null,null,6,null,null],
      [null,null,3,null,null,2,null,null,1],
      [null,2,null,null,1,null,null,3,null],
      [7,null,null,8,null,null,9,null,null],
      [null,null,6,null,null,4,null,null,5],
    ],
  },
]

export function generateSudokuContent(difficulty: Difficulty): SudokuPuzzle {
  const pool =
    difficulty === Difficulty.EASY   ? SUDOKU_EASY   :
    difficulty === Difficulty.MEDIUM ? SUDOKU_MEDIUM  :
                                       SUDOKU_HARD
  return pool[Math.floor(Math.random() * pool.length)]
}

// ─── COLOR_MATCH ──────────────────────────────────────────────────────────────

const COLORS_EASY = [
  { name: 'Rojo',     hex: '#E53E3E' },
  { name: 'Azul',     hex: '#3B82F6' },
  { name: 'Verde',    hex: '#22C55E' },
  { name: 'Amarillo', hex: '#EAB308' },
  { name: 'Naranja',  hex: '#F97316' },
  { name: 'Rosa',     hex: '#EC4899' },
  { name: 'Morado',   hex: '#A855F7' },
  { name: 'Celeste',  hex: '#38BDF8' },
  { name: 'Marrón',   hex: '#A16207' },
  { name: 'Negro',    hex: '#1F2937' },
  { name: 'Blanco',   hex: '#F5F5F5' },
  { name: 'Gris',     hex: '#71717A' },
]

const COLORS_MEDIUM = [
  ...COLORS_EASY,
  { name: 'Violeta',    hex: '#8B5CF6' },
  { name: 'Turquesa',   hex: '#14B8A6' },
  { name: 'Dorado',     hex: '#D97706' },
  { name: 'Fucsia',     hex: '#D946EF' },
  { name: 'Verde Lima', hex: '#84CC16' },
  { name: 'Azul Marino',hex: '#1E3A8A' },
]

const COLORS_HARD = [
  ...COLORS_MEDIUM,
  { name: 'Beige',      hex: '#D4C5B9' },
  { name: 'Coral',      hex: '#FF7F50' },
  { name: 'Lavanda',    hex: '#E6E6FA' },
  { name: 'Oliva',      hex: '#808000' },
  { name: 'Salmón',     hex: '#FA8072' },
  { name: 'Índigo',     hex: '#4B0082' },
]

export function generateColorMatchContent(difficulty: Difficulty): {
  targetColor: { name: string; hex: string }
  options: string[]
  correct: string
} {
  const pool =
    difficulty === Difficulty.EASY   ? COLORS_EASY   :
    difficulty === Difficulty.MEDIUM ? COLORS_MEDIUM  :
                                       COLORS_HARD

  const target = randomFrom(pool)
  const distractors = shuffle(pool.filter((c) => c.name !== target.name))
    .slice(0, difficulty === Difficulty.EASY ? 2 : 3)

  return {
    targetColor: { name: target.name, hex: target.hex },
    options: shuffle([target.name, ...distractors.map((c) => c.name)]),
    correct: target.name,
  }
}

// ─── WHAT_IS_THIS_OBJECT ─────────────────────────────────────────────────────

const OBJECTS_EASY = [
  { emoji: '🍎', label: 'Manzana',    options: ['Naranja', 'Pera', 'Uva'] },
  { emoji: '🐱', label: 'Gato',       options: ['Perro', 'Pato', 'Vaca'] },
  { emoji: '🚗', label: 'Auto',       options: ['Tren', 'Barco', 'Avión'] },
  { emoji: '☀️', label: 'Sol',        options: ['Luna', 'Nube', 'Estrella'] },
  { emoji: '🌸', label: 'Flor',       options: ['Árbol', 'Hoja', 'Pasto'] },
  { emoji: '🍞', label: 'Pan',        options: ['Queso', 'Leche', 'Huevo'] },
  { emoji: '✏️', label: 'Lápiz',      options: ['Tijera', 'Goma', 'Regla'] },
  { emoji: '🪑', label: 'Silla',      options: ['Mesa', 'Cama', 'Puerta'] },
  { emoji: '🐶', label: 'Perro',      options: ['Gato', 'Conejo', 'Pájaro'] },
  { emoji: '⚽', label: 'Pelota',     options: ['Globo', 'Rueda', 'Botón'] },
  { emoji: '🍌', label: 'Banana',     options: ['Manzana', 'Naranja', 'Frutilla'] },
  { emoji: '🐄', label: 'Vaca',       options: ['Caballo', 'Oveja', 'Cerdo'] },
  { emoji: '🏠', label: 'Casa',       options: ['Edificio', 'Iglesia', 'Castillo'] },
  { emoji: '🌙', label: 'Luna',       options: ['Sol', 'Estrella', 'Nube'] },
  { emoji: '🍕', label: 'Pizza',      options: ['Empanada', 'Torta', 'Tarta'] },
  { emoji: '🐟', label: 'Pez',        options: ['Gato', 'Perro', 'Pájaro'] },
  { emoji: '🚂', label: 'Tren',       options: ['Auto', 'Barco', 'Avión'] },
  { emoji: '🌳', label: 'Árbol',      options: ['Flor', 'Pasto', 'Hoja'] },
  { emoji: '🍇', label: 'Uvas',       options: ['Manzana', 'Durazno', 'Sandía'] },
  { emoji: '🎂', label: 'Torta',      options: ['Galleta', 'Pan', 'Alfajor'] },
  { emoji: '🦋', label: 'Mariposa',   options: ['Abeja', 'Mosca', 'Gusano'] },
  { emoji: '🍦', label: 'Helado',     options: ['Torta', 'Flan', 'Dulce'] },
  { emoji: '🐓', label: 'Gallina',    options: ['Pato', 'Ganso', 'Pavo'] },
  { emoji: '🌊', label: 'Mar',        options: ['Río', 'Lago', 'Laguna'] },
  { emoji: '🎈', label: 'Globo',      options: ['Pelota', 'Burbuja', 'Pompa'] },
]

const OBJECTS_MEDIUM = [
  ...OBJECTS_EASY,
  { emoji: '🎸', label: 'Guitarra',   options: ['Piano', 'Violín', 'Flauta'] },
  { emoji: '📚', label: 'Libro',      options: ['Revista', 'Diario', 'Cuaderno'] },
  { emoji: '🕯️', label: 'Vela',       options: ['Lámpara', 'Linterna', 'Fuego'] },
  { emoji: '🧲', label: 'Imán',       options: ['Clavo', 'Tuerca', 'Tornillo'] },
  { emoji: '🌂', label: 'Paraguas',   options: ['Abrigo', 'Sombrero', 'Bufanda'] },
  { emoji: '🎩', label: 'Sombrero',   options: ['Gorra', 'Boina', 'Casco'] },
  { emoji: '🔑', label: 'Llave',      options: ['Candado', 'Cerradura', 'Cadena'] },
  { emoji: '🧦', label: 'Medias',     options: ['Zapatos', 'Guantes', 'Cinturón'] },
  { emoji: '🎻', label: 'Violín',     options: ['Guitarra', 'Cello', 'Mandolina'] },
  { emoji: '🌵', label: 'Cactus',     options: ['Palmera', 'Pino', 'Rosal'] },
  { emoji: '🍵', label: 'Taza de té', options: ['Taza de café', 'Mate', 'Vaso'] },
  { emoji: '🪞', label: 'Espejo',     options: ['Cuadro', 'Ventana', 'Puerta'] },
  { emoji: '🧸', label: 'Osito',      options: ['Muñeca', 'Pelota', 'Juguete'] },
  { emoji: '🌻', label: 'Girasol',    options: ['Rosa', 'Margarita', 'Tulipán'] },
  { emoji: '🍳', label: 'Sartén',     options: ['Olla', 'Cacerola', 'Cazuela'] },
]

const OBJECTS_HARD = [
  ...OBJECTS_MEDIUM,
  { emoji: '⚗️', label: 'Probeta',    options: ['Jeringa', 'Termómetro', 'Lupa'] },
  { emoji: '🎭', label: 'Máscara',    options: ['Antifaz', 'Casco', 'Careta'] },
  { emoji: '🧭', label: 'Brújula',    options: ['Reloj', 'Calculadora', 'Termómetro'] },
  { emoji: '🪗', label: 'Acordeón',   options: ['Bandoneón', 'Armónica', 'Concertina'] },
  { emoji: '🫙', label: 'Frasco',     options: ['Botella', 'Taza', 'Jarra'] },
  { emoji: '🔭', label: 'Telescopio', options: ['Microscopio', 'Binoculares', 'Lupa'] },
  { emoji: '🧪', label: 'Tubo de ensayo', options: ['Pipeta', 'Matraz', 'Frasco'] },
  { emoji: '🪬', label: 'Amuleto',    options: ['Colgante', 'Talismán', 'Medalla'] },
  { emoji: '🗿', label: 'Estatua',    options: ['Escultura', 'Figura', 'Busto'] },
  { emoji: '🧿', label: 'Ojo turco',  options: ['Amuleto', 'Botón', 'Medallón'] },
  { emoji: '🎺', label: 'Trompeta',   options: ['Trombón', 'Saxofón', 'Clarinete'] },
  { emoji: '🧮', label: 'Ábaco',      options: ['Calculadora', 'Regla', 'Compás'] },
  { emoji: '⚖️', label: 'Balanza',    options: ['Báscula', 'Termómetro', 'Reloj'] },
  { emoji: '🔬', label: 'Microscopio', options: ['Telescopio', 'Lupa', 'Prismáticos'] },
  { emoji: '🪕', label: 'Banjo',      options: ['Guitarra', 'Mandolina', 'Ukelele'] },
  { emoji: '🛎️', label: 'Campanilla', options: ['Campana', 'Timbre', 'Bocina'] },
  { emoji: '🧰', label: 'Caja de herramientas', options: ['Maletín', 'Cofre', 'Baúl'] },
  { emoji: '⚓', label: 'Ancla',      options: ['Timón', 'Remo', 'Salvavidas'] },
]

export function generateWhatIsThisObjectContent(difficulty: Difficulty): {
  emoji: string
  correct: string
  options: string[]
} {
  const pool =
    difficulty === Difficulty.EASY   ? OBJECTS_EASY   :
    difficulty === Difficulty.MEDIUM ? OBJECTS_MEDIUM  :
                                       OBJECTS_HARD

  const item = randomFrom(pool)
  const distractors = shuffle(item.options).slice(0, difficulty === Difficulty.EASY ? 2 : 3)

  return {
    emoji: item.emoji,
    correct: item.label,
    options: shuffle([item.label, ...distractors]),
  }
}

// ─── WORD_BUILDER ─────────────────────────────────────────────────────────────

interface WordPair {
  mother: string
  hidden: string
  hint: string
}

const WORD_BUILDER_EASY: WordPair[] = [
  { mother: 'COCINA',   hidden: 'CON', hint: 'Significa "junto a"' },
  { mother: 'VERANO',   hidden: 'VER', hint: 'Mirar con los ojos' },
  { mother: 'FLORES',   hidden: 'SOL', hint: 'Estrella que da luz' },
  { mother: 'PALOMA',   hidden: 'MAL', hint: 'Lo opuesto a bien' },
  { mother: 'MADERA',   hidden: 'MAR', hint: 'Océano, agua salada' },
  { mother: 'SILLA',    hidden: 'SAL', hint: 'Condimento blanco' },
  { mother: 'BARCOS',   hidden: 'BAR', hint: 'Lugar para tomar' },
  { mother: 'PUERTA',   hidden: 'PAR', hint: 'Dos cosas iguales' },
  { mother: 'HELADO',   hidden: 'OLA', hint: 'Movimiento del agua' },
  { mother: 'ZAPATO',   hidden: 'PAZ', hint: 'Lo opuesto a guerra' },
  { mother: 'CAMINO',   hidden: 'OCA', hint: 'Ave de granja' },
  { mother: 'REGALO',   hidden: 'ROL', hint: 'Papel en teatro' },
  { mother: 'CABALLO',  hidden: 'CAL', hint: 'Material blanco' },
  { mother: 'PELOTA',   hidden: 'OLE', hint: 'Grito de alegría' },
  { mother: 'BODEGA',   hidden: 'BOA', hint: 'Serpiente grande' },
  { mother: 'MESA',     hidden: 'SEM', hint: 'Semilla, grano' },
  { mother: 'PARED',    hidden: 'RED', hint: 'Malla para pescar' },
  { mother: 'BOTELLA',  hidden: 'BOT', hint: 'Calzado alto' },
  { mother: 'CORONA',   hidden: 'RON', hint: 'Bebida alcohólica' },
  { mother: 'PASTEL',   hidden: 'TEL', hint: 'Tela, tejido' },
  { mother: 'JAMÓN',    hidden: 'MÁS', hint: 'Indica cantidad' },
  { mother: 'RELOJ',    hidden: 'ORO', hint: 'Metal precioso' },
  { mother: 'CUADRO',   hidden: 'CRU', hint: 'Símbolo cristiano' },
  { mother: 'DISCO',    hidden: 'SOL', hint: 'Estrella del día' },
  { mother: 'PORTAL',   hidden: 'POL', hint: 'Parte norte o sur' },
  { mother: 'CANCIÓN',  hidden: 'CON', hint: 'Significa "junto a"' },
  { mother: 'PLUMA',    hidden: 'MAL', hint: 'Lo opuesto a bien' },
  { mother: 'TEATRO',   hidden: 'TÉ', hint: 'Infusión caliente' },
  { mother: 'CIUDAD',   hidden: 'DAR', hint: 'Entregar, regalar' },
  { mother: 'LÁMPARA',  hidden: 'MAR', hint: 'Océano, agua salada' },
]

const WORD_BUILDER_MEDIUM: WordPair[] = [
  { mother: 'PESCADO',   hidden: 'PASE', hint: 'Permiso para entrar' },
  { mother: 'FAMILIA',   hidden: 'ALMA', hint: 'Espíritu, esencia' },
  { mother: 'VENTANA',   hidden: 'NAVE', hint: 'Barco grande' },
  { mother: 'CAMINOS',   hidden: 'MANO', hint: 'Parte del brazo' },
  { mother: 'PELOTA',    hidden: 'LOTE', hint: 'Terreno o grupo' },
  { mother: 'MARIPOSA',  hidden: 'PISO', hint: 'Suelo de la casa' },
  { mother: 'CANASTA',   hidden: 'CANA', hint: 'Pelo blanco' },
  { mother: 'CARAMELO',  hidden: 'AMOR', hint: 'Sentimiento profundo' },
  { mother: 'MADERA',    hidden: 'RAMA', hint: 'Parte del árbol' },
  { mother: 'HELADOS',   hidden: 'HOLA', hint: 'Saludo amistoso' },
  { mother: 'ROSALES',   hidden: 'ROSA', hint: 'Flor con espinas' },
  { mother: 'CUCHARA',   hidden: 'CARA', hint: 'Rostro de persona' },
  { mother: 'CABALLO',   hidden: 'BOCA', hint: 'Parte de la cabeza' },
  { mother: 'COLORES',   hidden: 'OLOR', hint: 'Lo que percibe la nariz' },
  { mother: 'JARDINES',  hidden: 'RISA', hint: 'Sonido de alegría' },
  { mother: 'GUITARRA',  hidden: 'RAÍZ', hint: 'Parte de la planta' },
  { mother: 'PATINES',   hidden: 'PINO', hint: 'Árbol de Navidad' },
  { mother: 'MANTECA',   hidden: 'MATE', hint: 'Bebida argentina' },
  { mother: 'CASCADA',   hidden: 'SACA', hint: 'Quitar, extraer' },
  { mother: 'CORDERO',   hidden: 'CORO', hint: 'Grupo que canta' },
  { mother: 'TARJETA',   hidden: 'ARTE', hint: 'Pintura, escultura' },
  { mother: 'SEMILLA',   hidden: 'MISA', hint: 'Ceremonia religiosa' },
  { mother: 'PALACIO',   hidden: 'PALO', hint: 'Trozo de madera' },
  { mother: 'GUITARRA',  hidden: 'RUTA', hint: 'Camino a seguir' },
  { mother: 'MENSAJE',   hidden: 'MANO', hint: 'Parte del brazo' },
  { mother: 'BOTONES',   hidden: 'BOTE', hint: 'Embarcación pequeña' },
  { mother: 'CAMELLO',   hidden: 'CAMA', hint: 'Mueble para dormir' },
  { mother: 'ESCOBA',    hidden: 'COSA', hint: 'Objeto, elemento' },
  { mother: 'MEDALLA',   hidden: 'MALA', hint: 'Lo opuesto a buena' },
  { mother: 'PAJARITO',  hidden: 'PATO', hint: 'Ave acuática' },
]

const WORD_BUILDER_HARD: WordPair[] = [
  { mother: 'MARIPOSA',   hidden: 'PRIMA',  hint: 'Hija de tío o tía' },
  { mother: 'CHOCOLATE',  hidden: 'TECHO',  hint: 'Parte superior de casa' },
  { mother: 'CARAMELO',   hidden: 'MORAL',  hint: 'Ética, valores' },
  { mother: 'PRIMAVERA',  hidden: 'VIRAR',  hint: 'Cambiar de dirección' },
  { mother: 'ESCALERA',   hidden: 'CLARA',  hint: 'Transparente, luminosa' },
  { mother: 'TORTILLA',   hidden: 'LITRO',  hint: 'Medida de líquido' },
  { mother: 'PANTALON',   hidden: 'TALON',  hint: 'Parte trasera del pie' },
  { mother: 'COCINERO',   hidden: 'RECIO',  hint: 'Fuerte, robusto' },
  { mother: 'VENTANAL',   hidden: 'LENTA',  hint: 'Que va despacio' },
  { mother: 'MARISCOS',   hidden: 'MARCO',  hint: 'Borde de cuadro' },
  { mother: 'CALENDARIO', hidden: 'NADIE',  hint: 'Ninguna persona' },
  { mother: 'HERMANOS',   hidden: 'HONRA',  hint: 'Honor, dignidad' },
  { mother: 'CAMINANDO',  hidden: 'AMANDO', hint: 'Sintiendo amor' },
  { mother: 'MARIPOSAS',  hidden: 'PISAR',  hint: 'Poner el pie encima' },
  { mother: 'PLATAFORMA', hidden: 'FALTA',  hint: 'Ausencia, carencia' },
  { mother: 'DECORACION', hidden: 'RONDA',  hint: 'Círculo, vuelta' },
  { mother: 'SALTARINES', hidden: 'TENIS',  hint: 'Deporte con raqueta' },
  { mother: 'CARPINTERO', hidden: 'PATIO',  hint: 'Espacio al aire libre' },
  { mother: 'BIBLIOTECA', hidden: 'TABLA',  hint: 'Madera plana' },
  { mother: 'COSTURERA',  hidden: 'COSTA',  hint: 'Orilla del mar' },
  { mother: 'MALETERO',   hidden: 'METRO',  hint: 'Medida de longitud' },
  { mother: 'CAMPAMENTO', hidden: 'TOMEN',  hint: 'Verbo tomar' },
  { mother: 'FOTOGRAFIA', hidden: 'FRITO',  hint: 'Cocinado en aceite' },
  { mother: 'AEROPUERTO', hidden: 'TORRE',  hint: 'Construcción alta' },
  { mother: 'DINOSAURIO', hidden: 'RONDA',  hint: 'Círculo, vuelta' },
  { mother: 'ESTRELLITA', hidden: 'TALLER', hint: 'Lugar de trabajo' },
  { mother: 'TEMPORADA',  hidden: 'TOMAR',  hint: 'Agarrar, beber' },
  { mother: 'ELEFANTES',  hidden: 'TENSA',  hint: 'Con tensión' },
  { mother: 'CASTILLOS',  hidden: 'SOCIAL', hint: 'De la sociedad' },
  { mother: 'NARANJAS',   hidden: 'RASAR',  hint: 'Nivelar, alisar' },
]

// Letters that look plausible as distractors but are not in the mother word
const DISTRACTOR_LETTERS = 'BDFGJKÑQUVWXYZ'.split('')

export function generateWordBuilderContent(difficulty: Difficulty): {
  mother: string
  hidden: string
  hint: string
  tiles: string[]
  showFirstLetter: boolean
} {
  const pool =
    difficulty === Difficulty.EASY   ? WORD_BUILDER_EASY   :
    difficulty === Difficulty.MEDIUM ? WORD_BUILDER_MEDIUM  :
                                       WORD_BUILDER_HARD

  const pair = randomFrom(pool)
  const motherLetters = pair.mother.split('')

  let tiles: string[]

  if (difficulty === Difficulty.EASY) {
    // Tiles in the same order as the mother word, no extras
    tiles = [...motherLetters]
  } else if (difficulty === Difficulty.MEDIUM) {
    // Tiles shuffled
    tiles = shuffle([...motherLetters])
  } else {
    // Tiles shuffled + 2 distractor letters not present in the mother word
    const usedLetters = new Set(motherLetters)
    const available = DISTRACTOR_LETTERS.filter((l) => !usedLetters.has(l))
    const extras = shuffle(available).slice(0, 2)
    tiles = shuffle([...motherLetters, ...extras])
  }

  return {
    mother: pair.mother,
    hidden: pair.hidden,
    hint: pair.hint,
    tiles,
    showFirstLetter: difficulty === Difficulty.EASY,
  }
}

// ─── MATH_GRID ────────────────────────────────────────────────────────────────

interface MathGridCell {
  value: number | null  // null = empty to fill
  fixed: boolean        // true = pre-filled
}

interface MathGridPuzzle {
  size: number
  grid: MathGridCell[][]
  solution: number[][]
  rowOps: string[]      // Operations between cells in each row
  colOps: string[]      // Operations between cells in each column
  rowResults: number[]  // Expected result for each row
  colResults: number[]  // Expected result for each column
}

// EASY: 3×3, solo suma y resta, números 1-10, 3-4 celdas vacías
const MATH_GRID_EASY: MathGridPuzzle[] = [
  {
    size: 3,
    grid: [
      [{ value: 2, fixed: true }, { value: null, fixed: false }, { value: 6, fixed: true }],
      [{ value: null, fixed: false }, { value: 2, fixed: true }, { value: 2, fixed: true }],
      [{ value: 5, fixed: true }, { value: 1, fixed: true }, { value: null, fixed: false }],
    ],
    solution: [[2, 3, 6], [4, 2, 2], [5, 1, 3]],
    rowOps: ['+', '+', '+'],
    colOps: ['+', '+', '+'],
    rowResults: [11, 8, 9],
    colResults: [11, 6, 11],
  },
  {
    size: 3,
    grid: [
      [{ value: 8, fixed: true }, { value: null, fixed: false }, { value: 3, fixed: true }],
      [{ value: null, fixed: false }, { value: 3, fixed: true }, { value: 1, fixed: true }],
      [{ value: 4, fixed: true }, { value: 2, fixed: true }, { value: null, fixed: false }],
    ],
    solution: [[8, 2, 3], [5, 3, 1], [4, 2, 2]],
    rowOps: ['-', '-', '-'],
    colOps: ['-', '-', '-'],
    rowResults: [3, 1, 0],
    colResults: [-1, -3, 0],
  },
  {
    size: 3,
    grid: [
      [{ value: 5, fixed: true }, { value: 2, fixed: true }, { value: null, fixed: false }],
      [{ value: null, fixed: false }, { value: 4, fixed: true }, { value: 3, fixed: true }],
      [{ value: 3, fixed: true }, { value: null, fixed: false }, { value: 2, fixed: true }],
    ],
    solution: [[5, 2, 3], [6, 4, 3], [3, 1, 2]],
    rowOps: ['+', '+', '+'],
    colOps: ['+', '+', '+'],
    rowResults: [10, 13, 6],
    colResults: [14, 7, 8],
  },
  {
    size: 3,
    grid: [
      [{ value: 7, fixed: true }, { value: null, fixed: false }, { value: 2, fixed: true }],
      [{ value: 3, fixed: true }, { value: null, fixed: false }, { value: 4, fixed: true }],
      [{ value: null, fixed: false }, { value: 5, fixed: true }, { value: 3, fixed: true }],
    ],
    solution: [[7, 4, 2], [3, 6, 4], [8, 5, 3]],
    rowOps: ['-', '+', '-'],
    colOps: ['+', '+', '+'],
    rowResults: [1, 13, 0],
    colResults: [18, 15, 9],
  },
  {
    size: 3,
    grid: [
      [{ value: null, fixed: false }, { value: 3, fixed: true }, { value: 5, fixed: true }],
      [{ value: 6, fixed: true }, { value: null, fixed: false }, { value: 1, fixed: true }],
      [{ value: 4, fixed: true }, { value: 2, fixed: true }, { value: null, fixed: false }],
    ],
    solution: [[2, 3, 5], [6, 4, 1], [4, 2, 3]],
    rowOps: ['+', '+', '+'],
    colOps: ['+', '+', '+'],
    rowResults: [10, 11, 9],
    colResults: [12, 9, 9],
  },
  {
    size: 3,
    grid: [
      [{ value: 9, fixed: true }, { value: 3, fixed: true }, { value: null, fixed: false }],
      [{ value: null, fixed: false }, { value: 5, fixed: true }, { value: 2, fixed: true }],
      [{ value: 6, fixed: true }, { value: null, fixed: false }, { value: 4, fixed: true }],
    ],
    solution: [[9, 3, 1], [7, 5, 2], [6, 4, 4]],
    rowOps: ['-', '-', '-'],
    colOps: ['-', '-', '-'],
    rowResults: [5, 0, -2],
    colResults: [-4, -6, -5],
  },
  {
    size: 3,
    grid: [
      [{ value: 1, fixed: true }, { value: null, fixed: false }, { value: 4, fixed: true }],
      [{ value: null, fixed: false }, { value: 3, fixed: true }, { value: 5, fixed: true }],
      [{ value: 2, fixed: true }, { value: 6, fixed: true }, { value: null, fixed: false }],
    ],
    solution: [[1, 2, 4], [7, 3, 5], [2, 6, 1]],
    rowOps: ['+', '+', '+'],
    colOps: ['+', '+', '+'],
    rowResults: [7, 15, 9],
    colResults: [10, 11, 10],
  },
]

// MEDIUM: 4×4, suma/resta/multiplicación, números 1-12, 5-6 celdas vacías
const MATH_GRID_MEDIUM: MathGridPuzzle[] = [
  {
    size: 4,
    grid: [
      [{ value: 2, fixed: true }, { value: null, fixed: false }, { value: 4, fixed: true }, { value: 2, fixed: true }],
      [{ value: null, fixed: false }, { value: 2, fixed: true }, { value: 3, fixed: true }, { value: 1, fixed: true }],
      [{ value: 3, fixed: true }, { value: null, fixed: false }, { value: null, fixed: false }, { value: 3, fixed: true }],
      [{ value: 6, fixed: true }, { value: 2, fixed: true }, { value: null, fixed: false }, { value: null, fixed: false }],
    ],
    solution: [[2, 3, 4, 2], [4, 2, 3, 1], [3, 2, 6, 3], [6, 2, 2, 4]],
    rowOps: ['×', '+', '×', '+'],
    colOps: ['+', '×', '+', '×'],
    rowResults: [18, 11, 27, 14],
    colResults: [15, 24, 15, 24],
  },
  {
    size: 4,
    grid: [
      [{ value: 8, fixed: true }, { value: 2, fixed: true }, { value: null, fixed: false }, { value: 1, fixed: true }],
      [{ value: null, fixed: false }, { value: 3, fixed: true }, { value: 2, fixed: true }, { value: null, fixed: false }],
      [{ value: 5, fixed: true }, { value: null, fixed: false }, { value: 3, fixed: true }, { value: 2, fixed: true }],
      [{ value: null, fixed: false }, { value: 4, fixed: true }, { value: null, fixed: false }, { value: 3, fixed: true }],
    ],
    solution: [[8, 2, 4, 1], [6, 3, 2, 4], [5, 1, 3, 2], [7, 4, 5, 3]],
    rowOps: ['-', '+', '-', '+'],
    colOps: ['+', '×', '-', '×'],
    rowResults: [1, 11, -1, 16],
    colResults: [26, 24, -6, 24],
  },
  {
    size: 4,
    grid: [
      [{ value: null, fixed: false }, { value: 2, fixed: true }, { value: 3, fixed: true }, { value: 1, fixed: true }],
      [{ value: 4, fixed: true }, { value: null, fixed: false }, { value: 2, fixed: true }, { value: null, fixed: false }],
      [{ value: null, fixed: false }, { value: 3, fixed: true }, { value: null, fixed: false }, { value: 2, fixed: true }],
      [{ value: 2, fixed: true }, { value: 1, fixed: true }, { value: 4, fixed: true }, { value: null, fixed: false }],
    ],
    solution: [[3, 2, 3, 1], [4, 3, 2, 5], [6, 3, 4, 2], [2, 1, 4, 3]],
    rowOps: ['×', '+', '×', '+'],
    colOps: ['+', '+', '+', '×'],
    rowResults: [9, 14, 15, 10],
    colResults: [15, 9, 13, 30],
  },
  {
    size: 4,
    grid: [
      [{ value: 6, fixed: true }, { value: null, fixed: false }, { value: 2, fixed: true }, { value: 3, fixed: true }],
      [{ value: null, fixed: false }, { value: 4, fixed: true }, { value: null, fixed: false }, { value: 1, fixed: true }],
      [{ value: 3, fixed: true }, { value: 2, fixed: true }, { value: null, fixed: false }, { value: null, fixed: false }],
      [{ value: 5, fixed: true }, { value: null, fixed: false }, { value: 3, fixed: true }, { value: 2, fixed: true }],
    ],
    solution: [[6, 3, 2, 3], [5, 4, 2, 1], [3, 2, 4, 6], [5, 1, 3, 2]],
    rowOps: ['-', '-', '×', '-'],
    colOps: ['+', '×', '+', '×'],
    rowResults: [-2, -2, 12, -1],
    colResults: [19, 24, 11, 18],
  },
  {
    size: 4,
    grid: [
      [{ value: 3, fixed: true }, { value: 3, fixed: true }, { value: null, fixed: false }, { value: null, fixed: false }],
      [{ value: null, fixed: false }, { value: 2, fixed: true }, { value: 4, fixed: true }, { value: 1, fixed: true }],
      [{ value: 4, fixed: true }, { value: null, fixed: false }, { value: 3, fixed: true }, { value: null, fixed: false }],
      [{ value: null, fixed: false }, { value: 4, fixed: true }, { value: null, fixed: false }, { value: 3, fixed: true }],
    ],
    solution: [[3, 3, 2, 4], [6, 2, 4, 1], [4, 5, 3, 2], [7, 4, 5, 3]],
    rowOps: ['×', '+', '×', '+'],
    colOps: ['+', '×', '+', '×'],
    rowResults: [12, 13, 20, 16],
    colResults: [20, 120, 14, 24],
  },
]

// HARD: 4×4, todas las operaciones, números 1-15, 6-8 celdas vacías
const MATH_GRID_HARD: MathGridPuzzle[] = [
  {
    size: 4,
    grid: [
      [{ value: 8, fixed: true }, { value: null, fixed: false }, { value: null, fixed: false }, { value: 4, fixed: true }],
      [{ value: null, fixed: false }, { value: 3, fixed: true }, { value: null, fixed: false }, { value: 2, fixed: true }],
      [{ value: null, fixed: false }, { value: 6, fixed: true }, { value: 3, fixed: true }, { value: null, fixed: false }],
      [{ value: 2, fixed: true }, { value: null, fixed: false }, { value: null, fixed: false }, { value: 3, fixed: true }],
    ],
    solution: [[8, 2, 16, 4], [4, 3, 6, 2], [3, 6, 3, 18], [2, 1, 3, 3]],
    rowOps: ['×', '+', '×', '-'],
    colOps: ['÷', '÷', '×', '×'],
    rowResults: [16, 11, 18, -2],
    colResults: [4, 2, 48, 24],
  },
  {
    size: 4,
    grid: [
      [{ value: null, fixed: false }, { value: 3, fixed: true }, { value: 9, fixed: true }, { value: null, fixed: false }],
      [{ value: 8, fixed: true }, { value: null, fixed: false }, { value: null, fixed: false }, { value: 2, fixed: true }],
      [{ value: null, fixed: false }, { value: 6, fixed: true }, { value: null, fixed: false }, { value: 3, fixed: true }],
      [{ value: 4, fixed: true }, { value: null, fixed: false }, { value: 5, fixed: true }, { value: null, fixed: false }],
    ],
    solution: [[12, 3, 9, 3], [8, 4, 2, 2], [6, 6, 3, 3], [4, 2, 5, 10]],
    rowOps: ['÷', '÷', '÷', '+'],
    colOps: ['×', '×', '-', '×'],
    rowResults: [4, 4, 2, 21],
    colResults: [96, 72, 14, 60],
  },
  {
    size: 4,
    grid: [
      [{ value: null, fixed: false }, { value: 4, fixed: true }, { value: null, fixed: false }, { value: 2, fixed: true }],
      [{ value: 6, fixed: true }, { value: null, fixed: false }, { value: 3, fixed: true }, { value: null, fixed: false }],
      [{ value: null, fixed: false }, { value: 2, fixed: true }, { value: null, fixed: false }, { value: 4, fixed: true }],
      [{ value: 3, fixed: true }, { value: null, fixed: false }, { value: 2, fixed: true }, { value: null, fixed: false }],
    ],
    solution: [[8, 4, 12, 2], [6, 3, 3, 6], [4, 2, 8, 4], [3, 1, 2, 5]],
    rowOps: ['÷', '÷', '÷', '-'],
    colOps: ['×', '×', '×', '÷'],
    rowResults: [2, 2, 2, 0],
    colResults: [48, 24, 96, 2],
  },
  {
    size: 4,
    grid: [
      [{ value: 10, fixed: true }, { value: null, fixed: false }, { value: null, fixed: false }, { value: 3, fixed: true }],
      [{ value: null, fixed: false }, { value: 4, fixed: true }, { value: 6, fixed: true }, { value: null, fixed: false }],
      [{ value: 12, fixed: true }, { value: null, fixed: false }, { value: null, fixed: false }, { value: 2, fixed: true }],
      [{ value: null, fixed: false }, { value: 3, fixed: true }, { value: 4, fixed: true }, { value: null, fixed: false }],
    ],
    solution: [[10, 2, 6, 3], [8, 4, 6, 2], [12, 6, 3, 2], [6, 3, 4, 5]],
    rowOps: ['÷', '×', '÷', '+'],
    colOps: ['+', '÷', '×', '×'],
    rowResults: [5, 24, 6, 16],
    colResults: [36, 2, 18, 30],
  },
]

export function generateMathGridContent(difficulty: Difficulty): MathGridPuzzle {
  const pool =
    difficulty === Difficulty.EASY   ? MATH_GRID_EASY   :
    difficulty === Difficulty.MEDIUM ? MATH_GRID_MEDIUM  :
                                       MATH_GRID_HARD
  return pool[Math.floor(Math.random() * pool.length)]
}
