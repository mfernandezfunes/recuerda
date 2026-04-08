import { motion } from 'framer-motion'

interface StarRewardProps {
  stars: 1 | 2 | 3
  patientName?: string
}

const MESSAGES: Record<1 | 2 | 3, string> = {
  1: '¡Lo hiciste!',
  2: '¡Muy bien!',
  3: '¡Excelente!',
}

function StarIcon({ filled, index }: { filled: boolean; index: number }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -30 }}
      animate={filled ? { scale: 1, rotate: 0 } : { scale: 0.85, rotate: 0 }}
      transition={{
        delay: filled ? index * 0.2 : 0,
        type: 'spring',
        stiffness: 260,
        damping: 16,
      }}
    >
      <svg
        width="72"
        height="72"
        viewBox="0 0 24 24"
        fill={filled ? '#FFD700' : '#D1C4B8'}
        stroke={filled ? '#F5A623' : '#B0A090'}
        strokeWidth="1"
      >
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    </motion.div>
  )
}

export function StarReward({ stars, patientName }: StarRewardProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-4 items-center justify-center">
        {([1, 2, 3] as const).map((i) => (
          <StarIcon key={i} filled={i <= stars} index={i - 1} />
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="text-3xl font-black text-[#5C4033] text-center"
      >
        {patientName ? `¡Muy bien, ${patientName}!` : MESSAGES[stars]}
      </motion.p>
    </div>
  )
}
