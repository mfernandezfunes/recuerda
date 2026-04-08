import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTTS } from '../../hooks/useTTS'

interface Props {
  medication: { name: string; dosage: string; color: string }
  onDismiss: () => void
}

export function MedicationAlarmModal({ medication, onDismiss }: Props) {
  const { speak } = useTTS()

  const now = new Date()
  const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  useEffect(() => {
    speak(`Es hora de tomar ${medication.name}, ${medication.dosage}`)
  }, [medication.name, medication.dosage])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center gap-6"
      >
        {/* Pill icon */}
        <div
          className="w-32 h-32 rounded-full flex items-center justify-center text-8xl shadow-lg"
          style={{ backgroundColor: medication.color + '33', border: `4px solid ${medication.color}` }}
        >
          💊
        </div>

        {/* Medication info */}
        <div className="text-center space-y-1">
          <h2 className="text-3xl font-black text-[#5C4033]">{medication.name}</h2>
          <p className="text-xl font-bold text-[#8D7061]">{medication.dosage}</p>
          <p className="text-base text-[#8D7061]">{timeStr} hs</p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="w-full rounded-2xl bg-[#8FBC8F] active:bg-[#6da86d] text-white font-black text-2xl flex items-center justify-center gap-3 transition-all shadow-md"
          style={{ minHeight: '80px' }}
        >
          <span>✓</span>
          <span>Ya tomé mi medicamento</span>
        </button>
      </motion.div>
    </div>
  )
}
