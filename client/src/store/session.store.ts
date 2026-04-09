import { create } from 'zustand'

interface SessionState {
  sessionId: string | null
  totalStars: number
  lifetimeStars: number
  lifetimeActivities: number
  streak: number
  greetingPlayed: boolean
  setSession: (id: string) => void
  addStars: (stars: number) => void
  setLifetimeStats: (stats: { totalStars: number; activitiesCompleted: number; streak: number }) => void
  markGreetingPlayed: () => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>()((set) => ({
  sessionId: null,
  totalStars: 0,
  lifetimeStars: 0,
  lifetimeActivities: 0,
  streak: 0,
  greetingPlayed: false,
  setSession: (id) => set({ sessionId: id, totalStars: 0, greetingPlayed: false }),
  addStars: (stars) => set((s) => ({
    totalStars: s.totalStars + stars,
    lifetimeStars: s.lifetimeStars + stars,
  })),
  setLifetimeStats: (stats) => set({
    lifetimeStars: stats.totalStars,
    lifetimeActivities: stats.activitiesCompleted,
    streak: stats.streak,
  }),
  markGreetingPlayed: () => set({ greetingPlayed: true }),
  clearSession: () => set({ sessionId: null, totalStars: 0, greetingPlayed: false }),
}))
