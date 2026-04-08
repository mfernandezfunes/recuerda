import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import type { UserRole } from '../../types'

interface Props {
  children: React.ReactNode
  role: UserRole
}

export function ProtectedRoute({ children, role }: Props) {
  const { isAuthenticated, role: userRole } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (userRole !== role) {
    return <Navigate to={userRole === 'caregiver' ? '/caregiver' : '/patient'} replace />
  }

  return <>{children}</>
}
