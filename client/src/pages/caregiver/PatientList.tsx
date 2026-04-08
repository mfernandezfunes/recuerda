import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { patientsApi } from '../../api/patients.api'
import { mediaApi } from '../../api/media.api'
import { resolveMediaUrl } from '../../api/client'
import type { Patient } from '../../types'

interface CreateForm {
  name: string
  pin: string
  birthDate: string
}

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

export function PatientList() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<(Patient & { birthDate?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateForm>({ name: '', pin: '', birthDate: '' })
  const [photo, setPhoto] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadPatients() {
    try {
      const res = await patientsApi.list()
      setPatients(Array.isArray(res.data) ? res.data : [])
    } catch {
      setPatients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatients()
  }, [])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return
    try {
      await patientsApi.delete(id)
      await loadPatients()
    } catch {
      // ignore
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.pin.length !== 4 || !/^\d{4}$/.test(form.pin)) {
      setError('El PIN debe ser exactamente 4 dígitos numéricos')
      return
    }
    if (!form.name.trim() || !form.birthDate) {
      setError('Completá todos los campos')
      return
    }
    setSaving(true)
    try {
      const res = await patientsApi.create(form)
      const newId = res.data.id
      if (photo) {
        const fd = new FormData()
        fd.append('file', photo)
        fd.append('patientId', newId)
        const uploadRes = await mediaApi.upload(fd)
        const photoUrl = (uploadRes.data as { url?: string }).url
        if (photoUrl) await patientsApi.update(newId, { photoUrl })
      }
      setForm({ name: '', pin: '', birthDate: '' })
      setPhoto(null)
      setShowForm(false)
      await loadPatients()
    } catch {
      setError('No se pudo crear el paciente. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#5C4033]">Pacientes</h2>
          <p className="text-sm text-[#8D7061] font-semibold">
            {patients.length} paciente{patients.length !== 1 ? 's' : ''} registrado{patients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setError('')
          }}
          className="bg-[#8FBC8F] text-white font-bold rounded-xl px-4 py-2 text-sm flex items-center gap-1"
        >
          <span className="text-lg leading-none">+</span> Nuevo
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl p-5 shadow-sm border border-[#FFCBA4] space-y-4"
        >
          <h3 className="font-black text-[#5C4033] text-lg">Nuevo paciente</h3>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-600 font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-[#5C4033] mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej: María González"
                className="w-full border-2 border-[#FFCBA4] rounded-xl px-3 py-2 text-sm focus:border-[#8FBC8F] outline-none font-semibold text-[#5C4033]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#5C4033] mb-1">
                PIN (4 dígitos)
              </label>
              <input
                type="text"
                value={form.pin}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                  setForm((f) => ({ ...f, pin: v }))
                }}
                placeholder="1234"
                maxLength={4}
                className="w-full border-2 border-[#FFCBA4] rounded-xl px-3 py-2 text-sm focus:border-[#8FBC8F] outline-none font-semibold text-[#5C4033] tracking-widest"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#5C4033] mb-1">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
                className="w-full border-2 border-[#FFCBA4] rounded-xl px-3 py-2 text-sm focus:border-[#8FBC8F] outline-none font-semibold text-[#5C4033]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#5C4033] mb-1">
                Foto (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                className="text-sm text-[#8D7061]"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setError('')
                setForm({ name: '', pin: '', birthDate: '' })
                setPhoto(null)
              }}
              className="flex-1 border-2 border-gray-200 text-[#8D7061] font-bold rounded-xl px-4 py-2 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#8FBC8F] text-white font-bold rounded-xl px-4 py-2 text-sm disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Crear paciente'}
            </button>
          </div>
        </form>
      )}

      {/* Patients list */}
      {loading ? (
        <div className="text-center py-12 text-[#8D7061] font-semibold text-sm">
          Cargando pacientes…
        </div>
      ) : patients.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
          <p className="text-5xl mb-3">👥</p>
          <p className="font-black text-[#5C4033] text-lg">Sin pacientes todavía</p>
          <p className="text-sm text-[#8D7061] mt-1">Presioná "Nuevo" para agregar el primer paciente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
            >
              {patient.photoUrl ? (
                <img
                  src={resolveMediaUrl(patient.photoUrl)}
                  alt={patient.name}
                  className="w-14 h-14 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#FFCBA4] flex items-center justify-center text-2xl shrink-0">
                  👤
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-black text-[#5C4033] text-base">{patient.name}</p>
                {patient.birthDate && (
                  <p className="text-xs text-[#8D7061] font-semibold mt-0.5">
                    {calcAge(patient.birthDate)} años
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => navigate(`/caregiver/patients/${patient.id}`)}
                  className="bg-[#8FBC8F] text-white font-bold rounded-xl px-4 py-2 text-sm"
                >
                  Gestionar
                </button>
                <button
                  onClick={() => handleDelete(patient.id, patient.name)}
                  className="bg-red-100 text-red-600 font-bold rounded-xl px-3 py-2 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
