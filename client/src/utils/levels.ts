export interface Level {
  number: number
  name: string
  emoji: string
  minStars: number
  maxStars: number | null
  color: string
}

export const LEVELS: Level[] = [
  { number: 1, name: 'Aprendiz',    emoji: '🌱', minStars: 0,   maxStars: 29,  color: '#C8E6C8' },
  { number: 2, name: 'Explorador',  emoji: '🌟', minStars: 30,  maxStars: 79,  color: '#FFF3A3' },
  { number: 3, name: 'Aventurero',  emoji: '🚀', minStars: 80,  maxStars: 149, color: '#FFCBA4' },
  { number: 4, name: 'Campeón',     emoji: '🏆', minStars: 150, maxStars: 249, color: '#87CEEB' },
  { number: 5, name: 'Maestro',     emoji: '👑', minStars: 250, maxStars: null, color: '#D8B4FE' },
]

export function getLevel(totalStars: number): Level & { progress: number } {
  const level = LEVELS.findLast((l) => totalStars >= l.minStars) ?? LEVELS[0]
  const next = LEVELS.find((l) => l.number === level.number + 1)
  const progress = next
    ? Math.min(100, Math.round(((totalStars - level.minStars) / (next.minStars - level.minStars)) * 100))
    : 100
  return { ...level, progress }
}
