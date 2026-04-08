import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/auth.store'

export function CaregiverLogin() {
  const navigate = useNavigate()
  const loginAsCaregiver = useAuthStore((s) => s.loginAsCaregiver)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.caregiverLogin(email, password)
      loginAsCaregiver(data.token, data.caregiver)
      navigate('/caregiver')
    } catch {
      setError('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-[#FFF8F0] to-[#FFE4CC] px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🧠</div>
          <h1 className="text-3xl font-black text-[#5C4033]">Recuerda</h1>
          <p className="text-[#8D7061] mt-1 font-semibold">Panel del cuidador</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-lg p-8 space-y-5">
          <div>
            <label className="block text-sm font-bold text-[#5C4033] mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full border-2 border-[#FFCBA4] rounded-2xl px-4 py-3 text-lg font-semibold text-[#5C4033] outline-none focus:border-[#8FBC8F] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#5C4033] mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border-2 border-[#FFCBA4] rounded-2xl px-4 py-3 text-lg font-semibold text-[#5C4033] outline-none focus:border-[#8FBC8F] transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-semibold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8FBC8F] hover:bg-[#7aaa7a] text-white font-black text-lg py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Ingresar'}
          </button>
        </form>

        <button
          onClick={() => navigate('/patient-select')}
          className="w-full mt-4 text-[#8D7061] font-bold text-sm py-3"
        >
          Soy un paciente →
        </button>
      </motion.div>
    </div>
  )
}
