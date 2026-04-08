import { useState } from 'react'
import apiClient from '../api/client'

interface Achievement {
  id: string
  title: string
  iconUrl: string
  description: string
  seen: boolean
}

export function useAchievements(patientId: string | undefined) {
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null)

  async function checkNewAchievements() {
    if (!patientId) return
    try {
      const res = await apiClient.get<Achievement[]>(`/patients/${patientId}/achievements`)
      const unseen = res.data.filter((a) => !a.seen)
      if (unseen.length > 0) setNewAchievement(unseen[0])
    } catch {
      // ignore errors
    }
  }

  return {
    newAchievement,
    clearAchievement: () => setNewAchievement(null),
    checkNewAchievements,
  }
}
