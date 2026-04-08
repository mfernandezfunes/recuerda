export type UserRole = 'caregiver' | 'patient'

export interface Caregiver {
  id: string
  name: string
  email: string
}

export interface Patient {
  id: string
  name: string
  photoUrl?: string
}

export interface FamilyMember {
  id: string
  patientId: string
  name: string
  relation: string
  photoUrl: string
}

export type ActivityType =
  | 'MEMORY_CARDS' | 'WHAT_DAY_IS_IT' | 'WHO_IS_THIS'
  | 'COMPLETE_SONG' | 'ORDER_STORY' | 'FIND_OBJECT'
  | 'SIMPLE_PUZZLE' | 'COLORING' | 'WORD_SEARCH'
  | 'MEMORY_GALLERY' | 'DAY_AGENDA' | 'BREATHING'
  | 'SERIES_PATTERNS' | 'MOOD_CHECKIN'
  | 'WHAT_IS_MISSING' | 'PROVERBS' | 'ODD_ONE_OUT' | 'SIMPLE_MATH' | 'SUDOKU'

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

export type MoodType = 'VERY_HAPPY' | 'HAPPY' | 'NEUTRAL' | 'SAD' | 'ANXIOUS' | 'TIRED'

export interface ActivitySetting {
  activityType: ActivityType
  difficulty: Difficulty
  enabled: boolean
}

export interface ActivityMeta {
  type: ActivityType
  label: string
  icon: string
  color: string
  description: string
  trains: string
}

export const ACTIVITY_META: Record<ActivityType, ActivityMeta> = {
  MEMORY_CARDS:   { type: 'MEMORY_CARDS',   label: 'Memoria',              icon: '🃏', color: '#87CEEB', description: 'Emparejá las cartas iguales',          trains: 'Entrena la memoria a corto plazo y la concentración' },
  WHAT_DAY_IS_IT: { type: 'WHAT_DAY_IS_IT', label: '¿Qué día es hoy?',     icon: '📅', color: '#FFF3A3', description: '¿Sabes qué día es hoy?',               trains: 'Refuerza la orientación temporal (fecha, mes, estación, año)' },
  WHO_IS_THIS:    { type: 'WHO_IS_THIS',     label: '¿Quién es?',           icon: '👨‍👩‍👧', color: '#FFCBA4', description: 'Reconocé a tus familiares',         trains: 'Trabaja la memoria episódica y el reconocimiento de personas cercanas' },
  COMPLETE_SONG:  { type: 'COMPLETE_SONG',   label: 'Completa la canción',  icon: '🎵', color: '#D8B4FE', description: '¿Te acordás de esta canción?',         trains: 'Estimula la memoria implícita y emocional a través de la música' },
  ORDER_STORY:    { type: 'ORDER_STORY',     label: 'Ordena el cuento',     icon: '📖', color: '#C8E6C8', description: 'Poné las imágenes en orden',           trains: 'Ejercita la memoria secuencial y el razonamiento narrativo' },
  FIND_OBJECT:    { type: 'FIND_OBJECT',     label: 'Encuentra el objeto',  icon: '🔍', color: '#87CEEB', description: 'Memorizá y encontrá el objeto',        trains: 'Desarrolla la memoria visual a corto plazo y la atención sostenida' },
  SIMPLE_PUZZLE:  { type: 'SIMPLE_PUZZLE',   label: 'Rompecabezas',         icon: '🧩', color: '#FFCBA4', description: 'Armá el rompecabezas',                 trains: 'Estimula la coordinación visoespacial y la resolución de problemas' },
  COLORING:       { type: 'COLORING',        label: 'Colorear',             icon: '🎨', color: '#FFF3A3', description: 'Pintá el dibujo',                      trains: 'Favorece la motricidad fina, la atención y la expresión creativa' },
  WORD_SEARCH:    { type: 'WORD_SEARCH',     label: 'Sopa de letras',       icon: '🔤', color: '#C8E8F8', description: 'Encontrá las palabras escondidas',     trains: 'Trabaja la atención selectiva, el vocabulario y el reconocimiento visual' },
  MEMORY_GALLERY: { type: 'MEMORY_GALLERY',  label: 'Mis recuerdos',        icon: '📷', color: '#FFE4CC', description: 'Mirá tus fotos y recuerdos',           trains: 'Estimula la reminiscencia y el bienestar emocional a través de recuerdos personales' },
  DAY_AGENDA:     { type: 'DAY_AGENDA',      label: 'Mi agenda',            icon: '🗓️', color: '#C8E6C8', description: '¿Qué tenés hoy?',                    trains: 'Refuerza la orientación temporal y la planificación del día' },
  BREATHING:      { type: 'BREATHING',       label: 'Respiración',          icon: '🌸', color: '#D8B4FE', description: 'Un momento de calma',                  trains: 'Reduce la ansiedad y mejora la regulación emocional mediante respiración guiada' },
  SERIES_PATTERNS:{ type: 'SERIES_PATTERNS', label: 'Patrones',             icon: '🔢', color: '#FFF3A3', description: '¿Qué sigue en la serie?',              trains: 'Ejercita el razonamiento lógico, la atención y el pensamiento abstracto' },
  MOOD_CHECKIN:   { type: 'MOOD_CHECKIN',    label: '¿Cómo te sentís?',     icon: '😊', color: '#FFCBA4', description: 'Contanos cómo estás',                  trains: 'Promueve la conciencia emocional y permite al cuidador monitorear el estado de ánimo' },
  WHAT_IS_MISSING:{ type: 'WHAT_IS_MISSING', label: '¿Qué falta?',          icon: '🔍', color: '#87CEEB', description: '¿Qué objeto falta en la imagen?',      trains: 'Fortalece la memoria visual y la atención al detalle' },
  PROVERBS:       { type: 'PROVERBS',        label: 'Refranes',             icon: '💬', color: '#D8B4FE', description: 'Completá el refrán',                   trains: 'Activa la memoria semántica y el lenguaje a través de expresiones culturales familiares' },
  ODD_ONE_OUT:    { type: 'ODD_ONE_OUT',     label: '¿Cuál no va?',         icon: '🤔', color: '#FFCBA4', description: '¿Cuál no pertenece al grupo?',         trains: 'Desarrolla el pensamiento categorial, la lógica y la atención' },
  SIMPLE_MATH:    { type: 'SIMPLE_MATH',     label: 'Calculá',              icon: '🔢', color: '#C8E6C8', description: 'Operaciones matemáticas simples',      trains: 'Mantiene activo el razonamiento numérico y la concentración' },
  SUDOKU:         { type: 'SUDOKU',          label: 'Sudoku',               icon: '🔢', color: '#FFF3A3', description: 'Completá la grilla sin repetir números', trains: 'Ejercita la lógica, la atención sostenida y la memoria de trabajo' },
}
