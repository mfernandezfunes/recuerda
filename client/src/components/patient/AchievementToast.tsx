import { useEffect } from 'react'
import { motion } from 'framer-motion'

interface Props {
  achievement: { title: string; iconUrl: string; description: string }
  onClose: () => void
}

function playFanfare() {
  try {
    const ctx = new AudioContext()
    const notes = [523, 659, 784] // Do5, Mi5, Sol5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      const start = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0.25, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35)
      osc.start(start)
      osc.stop(start + 0.35)
    })
  } catch {
    // Web Audio API might not be available
  }
}

export function AchievementToast({ achievement, onClose }: Props) {
  useEffect(() => {
    playFanfare()
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      initial={{ y: -120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -120, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[90vw] max-w-sm"
    >
      <div
        className="flex items-center gap-4 px-5 py-4 rounded-2xl shadow-xl"
        style={{
          backgroundColor: '#FFF3A3',
          border: '2px solid #F5C518',
        }}
      >
        <span className="text-5xl">{achievement.iconUrl}</span>
        <div className="flex-1 min-w-0">
          <p className="font-black text-[#5C4033] text-lg leading-tight">
            {achievement.title}
          </p>
          <p className="text-sm text-[#8D7061] font-semibold mt-0.5 leading-snug">
            {achievement.description}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-[#8D7061] text-2xl font-bold flex-shrink-0 p-1"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
    </motion.div>
  )
}
