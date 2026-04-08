import apiClient from './client'
import type { Patient, ActivityType } from '../types'

export interface PatientDetail {
  id: string
  name: string
  photoUrl?: string
  birthDate: string
  familyMembers: FamilyMember[]
  activitySettings: ActivitySetting[]
}

export interface FamilyMember {
  id: string
  patientId: string
  name: string
  relation: string
  photoUrl?: string
}

export interface ActivitySetting {
  activityType: ActivityType
  difficulty: string
  enabled: boolean
}

export const patientsApi = {
  list: () => apiClient.get<Patient[]>('/patients'),
  get: (id: string) => apiClient.get<PatientDetail>('/patients/' + id),
  create: (data: { name: string; pin: string; birthDate: string }) =>
    apiClient.post<Patient>('/patients', data),
  update: (id: string, data: Partial<{ name: string; photoUrl: string; birthDate: string; pin: string }>) =>
    apiClient.put<Patient>('/patients/' + id, data),
  delete: (id: string) => apiClient.delete('/patients/' + id),

  listFamilyMembers: (patientId: string) =>
    apiClient.get('/patients/' + patientId + '/family-members'),
  createFamilyMember: (patientId: string, data: { name: string; relation: string }) =>
    apiClient.post('/patients/' + patientId + '/family-members', data),
  updateFamilyMember: (patientId: string, fmId: string, data: { name?: string; relation?: string; photoUrl?: string }) =>
    apiClient.put('/patients/' + patientId + '/family-members/' + fmId, data),
  deleteFamilyMember: (patientId: string, fmId: string) =>
    apiClient.delete('/patients/' + patientId + '/family-members/' + fmId),

  getActivitySettings: (patientId: string) =>
    apiClient.get('/patients/' + patientId + '/activity-settings'),
  updateActivitySetting: (
    patientId: string,
    type: string,
    data: { difficulty?: string; enabled?: boolean }
  ) => apiClient.put('/patients/' + patientId + '/activity-settings/' + type, data),
  reorderActivitySettings: (patientId: string, order: { activityType: string; order: number }[]) =>
    apiClient.put('/patients/' + patientId + '/activity-settings-reorder', { order }),

  getProgress: (patientId: string) =>
    apiClient.get('/patients/' + patientId + '/progress'),
  getWeeklyProgress: (patientId: string) =>
    apiClient.get('/patients/' + patientId + '/progress/weekly'),
  getAlerts: (patientId: string) =>
    apiClient.get('/patients/' + patientId + '/alerts'),

  getAgenda: (patientId: string, date: string) =>
    apiClient.get('/patients/' + patientId + '/agenda', { params: { date } }),
  createAgendaItem: (patientId: string, data: unknown) =>
    apiClient.post('/patients/' + patientId + '/agenda', data),
  deleteAgendaItem: (patientId: string, itemId: string) =>
    apiClient.delete('/patients/' + patientId + '/agenda/' + itemId),

  getMedications: (patientId: string) =>
    apiClient.get('/patients/' + patientId + '/medications'),
  createMedication: (patientId: string, data: unknown) =>
    apiClient.post('/patients/' + patientId + '/medications', data),
  updateMedication: (patientId: string, medId: string, data: unknown) =>
    apiClient.put('/patients/' + patientId + '/medications/' + medId, data),
  deleteMedication: (patientId: string, medId: string) =>
    apiClient.delete('/patients/' + patientId + '/medications/' + medId),
}
