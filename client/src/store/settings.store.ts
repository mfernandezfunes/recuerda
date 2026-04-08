import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  darkMode: boolean
  ttsEnabled: boolean
  toggleDarkMode: () => void
  toggleTts: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: false,
      ttsEnabled: true,
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      toggleTts: () => set((s) => ({ ttsEnabled: !s.ttsEnabled })),
    }),
    { name: 'recuerda-settings' }
  )
)
