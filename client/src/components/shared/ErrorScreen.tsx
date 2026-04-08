import { BigButton } from '../ui/BigButton'
import { useNavigate } from 'react-router-dom'

interface ErrorScreenProps {
  message?: string
}

export function ErrorScreen({ message = 'Algo salió mal. Intentá de nuevo.' }: ErrorScreenProps) {
  const navigate = useNavigate()

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-8 p-8"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      <span style={{ fontSize: '4rem' }}>😕</span>
      <p
        style={{
          fontSize: '1.75rem',
          fontWeight: 900,
          color: '#5C4033',
          fontFamily: 'Nunito, sans-serif',
          textAlign: 'center',
          maxWidth: '400px',
        }}
      >
        {message}
      </p>
      <div style={{ width: '240px' }}>
        <BigButton label="Volver al inicio" emoji="🏠" onClick={() => navigate('/patient')} size="lg" />
      </div>
    </div>
  )
}
