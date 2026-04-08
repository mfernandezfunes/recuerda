import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authApi } from '../../api/auth.api'
import { Patient } from '../../types'

export function PatientSelect() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.getPatientsForLogin(email)
      setPatients(data.patients)
      if (data.patients.length === 0) setError('No se encontraron pacientes')
    } catch {
      setError('No se encontró ese cuidador')
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
          <div className="text-6xl mb-3">👋</div>
          <h1 className="text-3xl font-black text-[#5C4033]">¡Hola!</h1>
          <p className="text-[#8D7061] font-semibold mt-1">¿Quién sos?</p>
        </div>

        {patients.length === 0 ? (
          <form onSubmit={handleSearch} className="bg-white rounded-3xl shadow-lg p-8 space-y-5">
            <p className="text-[#5C4033] font-semibold text-center text-sm">
              Ingresá el email de tu cuidador
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email del cuidador"
              required
              className="w-full border-2 border-[#FFCBA4] rounded-2xl px-4 py-3 text-lg font-semibold text-[#5C4033] outline-none focus:border-[#8FBC8F]"
            />
            {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#87CEEB] text-[#5C4033] font-black text-xl py-4 rounded-2xl active:scale-95 transition-all disabled:opacity-60"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {patients.map((p) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => navigate(`/patient-pin/${p.id}`, { state: { patient: p } })}
                className="w-full bg-white rounded-3xl shadow-lg p-6 flex items-center gap-4 active:scale-95 transition-all"
              >
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt={p.name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#FFCBA4] flex items-center justify-center text-3xl">
                    👤
                  </div>
                )}
                <span className="text-2xl font-black text-[#5C4033]">{p.name}</span>
              </motion.button>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 text-[#8D7061] font-bold text-sm py-3"
        >
          ← Soy cuidador
        </button>
      </motion.div>
    </div>
  )
}
