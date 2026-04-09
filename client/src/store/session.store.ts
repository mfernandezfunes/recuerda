import { create } from 'zustand'

interface SessionState {
  sessionId: string | null
  totalStars: number
  lifetimeStars: number
  lifetimeActivities: number
  streak: number
  setSession: (id: string) => void
  addStars: (stars: number) => void
  setLifetimeStats: (stats: { totalStars: number; activitiesCompleted: number; streak: number }) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>()((set) => ({
  sessionId: null,
  totalStars: 0,
  lifetimeStars: 0,
  lifetimeActivities: 0,
  streak: 0,
  setSession: (id) => set({ sessionId: id, totalStars: 0 }),
  addStars: (stars) => set((s) => ({
    totalStars: s.totalStars + stars,
    lifetimeStars: s.lifetimeStars + stars,
  })),
  setLifetimeStats: (stats) => set({
    lifetimeStars: stats.totalStars,
    lifetimeActivities: stats.activitiesCompleted,
    streak: stats.streak,
  }),
  clearSession: () => set({ sessionId: null, totalStars: 0 }),
}))
