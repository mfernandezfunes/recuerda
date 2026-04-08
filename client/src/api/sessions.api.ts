import apiClient from './client'

export const sessionsApi = {
  startSession: (patientId: string) =>
    apiClient.post<{ sessionId: string }>('/sessions', { patientId }),

  logActivity: (
    sessionId: string,
    data: {
      activityType: string
      difficulty: string
      starsEarned: number
      score?: number
      durationSecs: number
    }
  ) => apiClient.post(`/sessions/${sessionId}/activity-log`, data),

  endSession: (sessionId: string) =>
    apiClient.put(`/sessions/${sessionId}/end`),
}
