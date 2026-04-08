import { create } from 'zustand'

interface SessionState {
  sessionId: string | null
  totalStars: number
  setSession: (id: string) => void
  addStars: (stars: number) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>()((set) => ({
  sessionId: null,
  totalStars: 0,
  setSession: (id) => set({ sessionId: id, totalStars: 0 }),
  addStars: (stars) => set((s) => ({ totalStars: s.totalStars + stars })),
  clearSession: () => set({ sessionId: null, totalStars: 0 }),
}))
