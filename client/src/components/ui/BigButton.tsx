import { motion } from 'framer-motion'

interface BigButtonProps {
  label: string
  emoji?: string
  color?: string
  onClick: () => void
  disabled?: boolean
  selected?: boolean
  size?: 'md' | 'lg'
}

export function BigButton({
  label,
  emoji,
  color = '#FFCBA4',
  onClick,
  disabled = false,
  selected = false,
  size = 'md',
}: BigButtonProps) {
  const minHeight = size === 'lg' ? '100px' : '80px'
  const fontSize = size === 'lg' ? '1.6rem' : '1.4rem'

  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.93 }}
      whileHover={disabled ? {} : { scale: 1.04 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        backgroundColor: color,
        minHeight,
        fontSize,
        borderRadius: '20px',
        border: selected ? '4px solid #5C4033' : '3px solid transparent',
        boxShadow: selected
          ? '0 6px 20px rgba(92,64,51,0.25)'
          : '0 4px 12px rgba(0,0,0,0.12)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        padding: '12px 24px',
        fontFamily: 'Nunito, sans-serif',
        fontWeight: 900,
        color: '#5C4033',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        width: '100%',
        userSelect: 'none',
      }}
    >
      {emoji && <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{emoji}</span>}
      <span>{label}</span>
    </motion.button>
  )
}
