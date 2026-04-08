import apiClient from './client'
import type { Caregiver, Patient } from '../types'

export interface CaregiverLoginResponse {
  token: string
  caregiver: Caregiver
}

export interface PatientLoginResponse {
  token: string
  patient: Patient
}

export const authApi = {
  caregiverLogin: (email: string, password: string) =>
    apiClient.post<CaregiverLoginResponse>('/auth/caregiver/login', { email, password }),

  patientPinLogin: (patientId: string, pin: string) =>
    apiClient.post<PatientLoginResponse>('/auth/patient/pin', { patientId, pin }),

  getPatientsForLogin: (caregiverEmail: string) =>
    apiClient.get<{ patients: Patient[] }>('/auth/patients', { params: { caregiverEmail } }),
}
