import { useState } from 'react'
import { useAuthStore } from '../../store/auth.store'
import apiClient from '../../api/client'

export function CaregiverSettings() {
  const caregiver = useAuthStore((s) => s.caregiver)
  const [name, setName] = useState(caregiver?.name ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await apiClient.put('/auth/caregiver/profile', {
        name: name.trim(),
        ...(currentPassword && newPassword
          ? { currentPassword, newPassword }
          : {}),
      })
      setSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setError(axiosErr?.response?.data?.error ?? 'Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <h2 className="text-xl font-black text-[#5C4033]">⚙️ Configuración</h2>

      {/* Profile section */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-[#8FBC8F] flex items-center justify-center text-2xl font-black text-white">
            {(caregiver?.name ?? '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-black text-[#5C4033]">{caregiver?.name}</p>
            <p className="text-sm text-[#8D7061] font-semibold">{caregiver?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-[#5C4033] uppercase tracking-wide mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full border-2 border-[#FFCBA4] rounded-xl px-3 py-2.5 text-sm focus:border-[#8FBC8F] outline-none font-semibold text-[#5C4033]"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#5C4033] uppercase tracking-wide mb-1">
              Email
            </label>
            <input
              type="email"
              value={caregiver?.email ?? ''}
              disabled
              className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-[#8D7061] font-semibold cursor-not-allowed"
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-black text-[#5C4033] uppercase tracking-wide mb-3">
              Cambiar contraseña (opcional)
            </p>
            <div className="space-y-3">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Contraseña actual"
                className="w-full border-2 border-[#FFCBA4] rounded-xl px-3 py-2.5 text-sm focus:border-[#8FBC8F] outline-none font-semibold text-[#5C4033]"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva contraseña"
                className="w-full border-2 border-[#FFCBA4] rounded-xl px-3 py-2.5 text-sm focus:border-[#8FBC8F] outline-none font-semibold text-[#5C4033]"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm font-bold">{error}</p>
          )}

          {saved && (
            <p className="text-[#8FBC8F] text-sm font-bold">✓ Cambios guardados</p>
          )}

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full bg-[#8FBC8F] text-white font-bold rounded-xl py-3 text-sm disabled:opacity-60 transition-all"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* App info */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
        <h3 className="font-black text-[#5C4033]">Sobre la aplicación</h3>
        <div className="space-y-2">
          {[
            { label: 'Versión', value: '1.0.0' },
            { label: 'Autor', value: 'Martín Fernández Funes' },
            { label: 'Actividades disponibles', value: '14' },
            { label: 'Plataforma', value: 'Web PWA' },
          ].map((row) => (
            <div key={row.label} className="flex justify-between items-center py-1 border-b border-gray-50">
              <p className="text-sm font-bold text-[#8D7061]">{row.label}</p>
              <p className="text-sm font-black text-[#5C4033]">{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick help */}
      <div className="bg-[#87CEEB20] border-2 border-[#87CEEB] rounded-2xl p-5">
        <h3 className="font-black text-[#5C4033] mb-2">💡 Consejos rápidos</h3>
        <ul className="space-y-2 text-sm text-[#5C4033] font-semibold">
          <li>• Agregá familiares en el perfil del paciente para la actividad "¿Quién es?"</li>
          <li>• Configurá los medicamentos para que el paciente reciba recordatorios</li>
          <li>• Ajustá la dificultad de cada actividad desde el perfil del paciente</li>
          <li>• El paciente puede instalar la app en su celular desde el navegador</li>
        </ul>
      </div>
    </div>
  )
}
