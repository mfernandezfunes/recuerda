import { motion } from 'framer-motion'

interface LoadingScreenProps {
  message?: string
}

export function LoadingScreen({ message = 'Cargando...' }: LoadingScreenProps) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-6"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        style={{ fontSize: '5rem', lineHeight: 1 }}
      >
        🧠
      </motion.div>
      <p
        style={{
          fontSize: '2rem',
          fontWeight: 900,
          color: '#5C4033',
          fontFamily: 'Nunito, sans-serif',
        }}
      >
        {message}
      </p>
    </div>
  )
}
