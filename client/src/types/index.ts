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
  | 'WHAT_IS_MISSING' | 'PROVERBS' | 'ODD_ONE_OUT' | 'SIMPLE_MATH'

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
}

export const ACTIVITY_META: Record<ActivityType, ActivityMeta> = {
  MEMORY_CARDS:   { type: 'MEMORY_CARDS',   label: 'Memoria',         icon: '🃏', color: '#87CEEB', description: 'Emparejá las cartas iguales' },
  WHAT_DAY_IS_IT: { type: 'WHAT_DAY_IS_IT', label: '¿Qué día es hoy?',icon: '📅', color: '#FFF3A3', description: '¿Sabes qué día es hoy?' },
  WHO_IS_THIS:    { type: 'WHO_IS_THIS',     label: '¿Quién es?',      icon: '👨‍👩‍👧', color: '#FFCBA4', description: 'Reconocé a tus familiares' },
  COMPLETE_SONG:  { type: 'COMPLETE_SONG',   label: 'Completa la canción', icon: '🎵', color: '#D8B4FE', description: '¿Te acordás de esta canción?' },
  ORDER_STORY:    { type: 'ORDER_STORY',     label: 'Ordena el cuento',icon: '📖', color: '#C8E6C8', description: 'Poné las imágenes en orden' },
  FIND_OBJECT:    { type: 'FIND_OBJECT',     label: 'Encuentra el objeto', icon: '🔍', color: '#87CEEB', description: 'Encontrá el objeto escondido' },
  SIMPLE_PUZZLE:  { type: 'SIMPLE_PUZZLE',   label: 'Rompecabezas',    icon: '🧩', color: '#FFCBA4', description: 'Armá el rompecabezas' },
  COLORING:       { type: 'COLORING',        label: 'Colorear',        icon: '🎨', color: '#FFF3A3', description: 'Pintá el dibujo' },
  WORD_SEARCH:    { type: 'WORD_SEARCH',     label: 'Sopa de letras',  icon: '🔤', color: '#C8E8F8', description: 'Encontrá las palabras escondidas' },
  MEMORY_GALLERY: { type: 'MEMORY_GALLERY',  label: 'Mis recuerdos',   icon: '📷', color: '#FFE4CC', description: 'Mirá tus fotos y recuerdos' },
  DAY_AGENDA:     { type: 'DAY_AGENDA',      label: 'Mi agenda',       icon: '🗓️', color: '#C8E6C8', description: '¿Qué tenés hoy?' },
  BREATHING:      { type: 'BREATHING',       label: 'Respiración',     icon: '🌸', color: '#D8B4FE', description: 'Un momento de calma' },
  SERIES_PATTERNS:{ type: 'SERIES_PATTERNS', label: 'Patrones',        icon: '🔢', color: '#FFF3A3', description: '¿Qué sigue en la serie?' },
  MOOD_CHECKIN:   { type: 'MOOD_CHECKIN',    label: '¿Cómo te sentís?',icon: '😊', color: '#FFCBA4', description: 'Contanos cómo estás' },
  WHAT_IS_MISSING:{ type: 'WHAT_IS_MISSING', label: '¿Qué falta?',    icon: '🔍', color: '#87CEEB', description: '¿Qué objeto falta?' },
  PROVERBS:       { type: 'PROVERBS',        label: 'Refranes',        icon: '💬', color: '#D8B4FE', description: 'Completá el refrán' },
  ODD_ONE_OUT:    { type: 'ODD_ONE_OUT',     label: '¿Cuál no va?',   icon: '🤔', color: '#FFCBA4', description: '¿Cuál no pertenece al grupo?' },
  SIMPLE_MATH:    { type: 'SIMPLE_MATH',     label: 'Calculá',         icon: '🔢', color: '#C8E6C8', description: 'Operaciones simples' },
}
