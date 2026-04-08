import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/auth.store'
import { resolveMediaUrl } from '../../api/client'
import type { Patient } from '../../types'

const PIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓']

export function PatientPinLogin() {
  const { patientId } = useParams<{ patientId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const loginAsPatient = useAuthStore((s) => s.loginAsPatient)

  const patient = location.state?.patient as Patient | undefined
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleKey(key: string) {
    if (loading) return
    setError(false)

    if (key === '⌫') {
      setPin((p) => p.slice(0, -1))
      return
    }

    if (key === '✓') {
      if (pin.length < 4) return
      await doLogin()
      return
    }

    if (pin.length < 4) {
      const newPin = pin + key
      setPin(newPin)
      if (newPin.length === 4) {
        setTimeout(() => doLogin(newPin), 150)
      }
    }
  }

  async function doLogin(pinToUse = pin) {
    if (!patientId) return
    setLoading(true)
    try {
      const { data } = await authApi.patientPinLogin(patientId, pinToUse)
      loginAsPatient(data.token, data.patient)
      navigate('/patient')
    } catch {
      setError(true)
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-[#FFF8F0] to-[#FFE4CC] px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xs"
      >
        {/* Avatar y nombre */}
        <div className="text-center mb-8">
          {patient?.photoUrl ? (
            <img src={resolveMediaUrl(patient.photoUrl)} alt={patient.name} className="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-4 border-white shadow-lg" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#FFCBA4] flex items-center justify-center text-5xl mx-auto mb-3">👤</div>
          )}
          <h1 className="text-3xl font-black text-[#5C4033]">
            Hola, {patient?.name || 'amigo/a'}
          </h1>
          <p className="text-[#8D7061] font-semibold mt-1">Ingresá tu PIN</p>
        </div>

        {/* Indicadores de PIN */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: pin.length === i + 1 ? [1, 1.3, 1] : 1 }}
              className={`w-5 h-5 rounded-full border-3 transition-colors ${
                i < pin.length ? 'bg-[#8FBC8F] border-[#8FBC8F]' : 'bg-transparent border-[#FFCBA4]'
              }`}
            />
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-red-400 font-bold mb-4 text-lg"
            >
              PIN incorrecto, intentá de nuevo
            </motion.p>
          )}
        </AnimatePresence>

        {/* Teclado numérico */}
        <div className="grid grid-cols-3 gap-3">
          {PIN_KEYS.map((key) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleKey(key)}
              disabled={loading}
              className={`
                h-20 rounded-2xl text-2xl font-black transition-all shadow-sm
                ${key === '✓'
                  ? 'bg-[#8FBC8F] text-white'
                  : key === '⌫'
                  ? 'bg-[#FFE4CC] text-[#5C4033]'
                  : 'bg-white text-[#5C4033] hover:bg-[#FFF3A3]'
                }
                disabled:opacity-60
              `}
            >
              {key}
            </motion.button>
          ))}
        </div>

        <button onClick={() => navigate('/patient-select')} className="w-full mt-6 text-[#8D7061] font-bold text-sm py-3">
          ← Volver
        </button>
      </motion.div>
    </div>
  )
}
