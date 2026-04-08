import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Caregiver, Patient, UserRole } from '../types'

interface AuthState {
  token: string | null
  role: UserRole | null
  caregiver: Caregiver | null
  patient: Patient | null
  isAuthenticated: boolean

  loginAsCaregiver: (token: string, caregiver: Caregiver) => void
  loginAsPatient: (token: string, patient: Patient) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      caregiver: null,
      patient: null,
      isAuthenticated: false,

      loginAsCaregiver: (token, caregiver) =>
        set({ token, role: 'caregiver', caregiver, patient: null, isAuthenticated: true }),

      loginAsPatient: (token, patient) =>
        set({ token, role: 'patient', patient, caregiver: null, isAuthenticated: true }),

      logout: () =>
        set({ token: null, role: null, caregiver: null, patient: null, isAuthenticated: false }),
    }),
    { name: 'recuerda-auth' }
  )
)
