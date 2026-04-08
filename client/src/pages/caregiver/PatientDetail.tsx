import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { patientsApi } from '../../api/patients.api'
import { mediaApi } from '../../api/media.api'
import { ACTIVITY_META } from '../../types'
import type { ActivityType } from '../../types'

interface PatientDetail {
  id: string
  name: string
  photoUrl?: string
  birthDate: string
  familyMembers: FamilyMember[]
  activitySettings: ActivitySetting[]
}

interface FamilyMember {
  id: string
  patientId: string
  name: string
  relation: string
  photoUrl?: string
}

interface ActivitySetting {
  activityType: ActivityType
  difficulty: string
  enabled: boolean
}

interface AgendaItem {
  id: string
  title: string
  time?: string
  description?: string
  visitorName?: string
}

interface Medication {
  id: string
  name: string
  dosage: string
  times: string[]
  color: string
}

type Tab = 'familiares' | 'actividades' | 'agenda' | 'medicacion'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'familiares', label: 'Familiares', icon: '👨‍👩‍👧' },
  { id: 'actividades', label: 'Actividades', icon: '🧠' },
  { id: 'agenda', label: 'Agenda', icon: '🗓️' },
  { id: 'medicacion', label: 'Medicación', icon: '💊' },
]

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Fácil',
  MEDIUM: 'Medio',
  HARD: 'Difícil',
}

const MED_COLORS = ['#87CEEB', '#8FBC8F', '#FFCBA4', '#FFF3A3', '#D8B4FE', '#FFADB5']

export function PatientDetail() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()

  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('familiares')

  // Family members
  const [showFamilyForm, setShowFamilyForm] = useState(false)
  const [familyForm, setFamilyForm] = useState({ name: '', relation: '' })
  const [familyPhoto, setFamilyPhoto] = useState<File | null>(null)
  const [savingFamily, setSavingFamily] = useState(false)

  // Activity settings
  const [activitySettings, setActivitySettings] = useState<ActivitySetting[]>([])
  const [savingActivity, setSavingActivity] = useState<string | null>(null)

  // Agenda
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([])
  const [showAgendaForm, setShowAgendaForm] = useState(false)
  const [agendaForm, setAgendaForm] = useState({
    title: '',
    time: '',
    description: '',
    visitorName: '',
  })
  const [savingAgenda, setSavingAgenda] = useState(false)

  // Medications
  const [medications, setMedications] = useState<Medication[]>([])
  const [showMedForm, setShowMedForm] = useState(false)
  const [medForm, setMedForm] = useState({
    name: '',
    dosage: '',
    times: '',
    color: MED_COLORS[0],
  })
  const [savingMed, setSavingMed] = useState(false)

  async function loadPatient() {
    if (!patientId) return
    try {
      const res = await patientsApi.get(patientId)
      setPatient(res.data)
      setActivitySettings(res.data.activitySettings || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function loadAgenda() {
    if (!patientId) return
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await patientsApi.getAgenda(patientId, today)
      setAgendaItems(Array.isArray(res.data) ? res.data : [])
    } catch {
      setAgendaItems([])
    }
  }

  async function loadMedications() {
    if (!patientId) return
    try {
      const res = await patientsApi.getMedications(patientId)
      setMedications(Array.isArray(res.data) ? res.data : [])
    } catch {
      setMedications([])
    }
  }

  useEffect(() => {
    loadPatient()
  }, [patientId])

  useEffect(() => {
    if (activeTab === 'agenda') loadAgenda()
    if (activeTab === 'medicacion') loadMedications()
  }, [activeTab])

  async function handleAddFamilyMember(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId || !familyForm.name.trim() || !familyForm.relation.trim()) return
    setSavingFamily(true)
    try {
      let photoUrl: string | undefined
      if (familyPhoto) {
        const fd = new FormData()
        fd.append('file', familyPhoto)
        fd.append('patientId', patientId)
        const uploadRes = await mediaApi.upload(fd)
        photoUrl = (uploadRes.data as { url?: string }).url
      }
      await patientsApi.createFamilyMember(patientId, {
        ...familyForm,
        ...(photoUrl ? { photoUrl } : {}),
      })
      setFamilyForm({ name: '', relation: '' })
      setFamilyPhoto(null)
      setShowFamilyForm(false)
      await loadPatient()
    } catch {
      // ignore
    } finally {
      setSavingFamily(false)
    }
  }

  async function handleDeleteFamilyMember(fmId: string) {
    if (!patientId) return
    if (!confirm('¿Eliminar este familiar?')) return
    try {
      await patientsApi.deleteFamilyMember(patientId, fmId)
      await loadPatient()
    } catch {
      // ignore
    }
  }

  async function handleToggleActivity(type: ActivityType, enabled: boolean) {
    if (!patientId) return
    setSavingActivity(type)
    try {
      await patientsApi.updateActivitySetting(patientId, type, { enabled })
      setActivitySettings((prev) =>
        prev.map((a) => (a.activityType === type ? { ...a, enabled } : a))
      )
    } catch {
      // ignore
    } finally {
      setSavingActivity(null)
    }
  }

  async function handleChangeDifficulty(type: ActivityType, difficulty: string) {
    if (!patientId) return
    setSavingActivity(type)
    try {
      await patientsApi.updateActivitySetting(patientId, type, { difficulty })
      setActivitySettings((prev) =>
        prev.map((a) => (a.activityType === type ? { ...a, difficulty } : a))
      )
    } catch {
      // ignore
    } finally {
      setSavingActivity(null)
    }
  }

  async function handleAddAgendaItem(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId || !agendaForm.title.trim()) return
    setSavingAgenda(true)
    try {
      await patientsApi.createAgendaItem(patientId, {
        ...agendaForm,
        date: new Date().toISOString().split('T')[0],
      })
      setAgendaForm({ title: '', time: '', description: '', visitorName: '' })
      setShowAgendaForm(false)
      await loadAgenda()
    } catch {
      // ignore
    } finally {
      setSavingAgenda(false)
    }
  }

  async function handleDeleteAgendaItem(itemId: string) {
    if (!patientId) return
    if (!confirm('¿Eliminar este evento?')) return
    try {
      await patientsApi.deleteAgendaItem(patientId, itemId)
      await loadAgenda()
    } catch {
      // ignore
    }
  }

  async function handleAddMedication(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId || !medForm.name.trim() || !medForm.dosage.trim()) return
    setSavingMed(true)
    try {
      await patientsApi.createMedication(patientId, {
        ...medForm,
        times: medForm.times
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      })
      setMedForm({ name: '', dosage: '', times: '', color: MED_COLORS[0] })
      setShowMedForm(false)
      await loadMedications()
    } catch {
      // ignore
    } finally {
      setSavingMed(false)
    }
  }

  async function handleDeleteMedication(medId: string) {
    if (!patientId) return
    if (!confirm('¿Eliminar este medicamento?')) return
    try {
      await patientsApi.deleteMedication(patientId, medId)
      await loadMedications()
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[#8D7061] font-semibold text-sm">Cargando paciente…</p>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-2">😕</p>
        <p className="font-black text-[#5C4033] text-lg">Paciente no encontrado</p>
        <button
          onClick={() => navigate('/caregiver/patients')}
          className="mt-4 bg-[#8FBC8F] text-white font-bold rounded-xl px-5 py-2 text-sm"
        >
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/caregiver/patients')}
          className="text-[#8D7061] font-bold text-sm hover:text-[#5C4033]"
        >
          ← Volver
        </button>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
        {patient.photoUrl ? (
          <img
            src={patient.photoUrl}
            alt={patient.name}
            className="w-16 h-16 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#FFCBA4] flex items-center justify-center text-2xl shrink-0">
            👤
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-[#5C4033]">{patient.name}</h2>
          {patient.birthDate && (
            <p className="text-sm text-[#8D7061] font-semibold">
              Nacido/a el {new Date(patient.birthDate).toLocaleDateString('es-AR')}
            </p>
          )}
        </div>
        <button
          onClick={() => navigate(`/caregiver/patients/${patientId}/progress`)}
          className="text-xs font-bold text-[#8FBC8F] bg-green-50 border border-green-200 rounded-xl px-3 py-2"
        >
          📊 Progreso
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[#8FBC8F] text-white shadow-sm'
                : 'bg-white text-[#8D7061] border border-gray-200'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Familiares */}
      {activeTab === 'familiares' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-[#5C4033]">Familiares</h3>
            <button
              onClick={() => setShowFamilyForm(!showFamilyForm)}
              className="bg-[#8FBC8F] text-white font-bold rounded-xl px-3 py-2 text-sm"
            >
              + Agregar
            </button>
          </div>

          {showFamilyForm && (
            <form
              onSubmit={handleAddFamilyMember}
              className="bg-white rounded-2xl p-4 shadow-sm border border-[#FFCBA4] space-y-3"
            >
              <h4 className="font-black text-[#5C4033]">Nuevo familiar</h4>
              <input
                type="text"
                value={familyForm.name}
                onChange={(e) => setFamilyForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nombre"
                className="w-full border-2 border-[#FFCBA4] rounded-xl px-3 py-2 text-sm focus:border-[#8FBC8F] outline-none font-semibold text-[#5C4033]"
              />
              <input
                type="text"
                value={familyForm.relation}
                onChange={(e) => setFamilyForm((f) => ({ ...f, relation: e.target.value }))}
                placeholder="Relación (Ej: Hijo/a, Nieto/a)"
                className="w-full border-2 border-[#FFCBA4] rounded-xl px-3 py-2 text-sm focus:border-[#8FBC8F] outline-none font-semibold text-[#5C4033]"
              />
              <div>
                <label className="block text-xs font-bold text-[#5C4033] mb-1">
                  Foto (opcional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFamilyPhoto(e.target.files?.[0] ?? null)}
                  className="text-sm text-[#8D7061]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowFamilyForm(false)}
                  className="flex-1 border-2 border-gray-200 text-[#8D7061] font-bold rounded-xl py-2 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingFamily}
                  className="flex-1 bg-[#8FBC8F] text-white font-bold rounded-xl py-2 text-sm disabled:opacity-60"
                >
                  {savingFamily ? 'Guardando…' : 'Agregar'}
                </button>
              </div>
            </form>
          )}

          {patient.familyMembers.length === 0 && !showFamilyForm ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
              <p className="text-3xl mb-2">👨‍👩‍👧</p>
              <p className="font-bold text-[#5C4033]">Sin familiares registrados</p>
              <p className="text-xs text-[#8D7061] mt-1">
                Agregá familiares para la actividad "¿Quién es?"
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {patient.familyMembers.map((fm) => (
                <div
                  key={fm.id}
                  className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-3"
                >
                  {fm.photoUrl ? (
                    <img
                      src={fm.photoUrl}
                      alt={fm.name}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#87CEEB] flex items-center justify-center text-xl shrink-0">
                      👤
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[#5C4033]">{fm.name}</p>
                    <p className="text-xs text-[#8D7061] font-semibold">{fm.relation}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteFamilyMember(fm.id)}
                    className="bg-red-100 text-red-600 font-bold rounded-xl px-3 py-1.5 text-xs"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Actividades */}
      {activeTab === 'actividades' && (
        <div className="space-y-4">
          <h3 className="font-black text-[#5C4033]">Configuración de actividades</h3>
          <div className="space-y-2">
            {(Object.keys(ACTIVITY_META) as ActivityType[]).map((type) => {
              const meta = ACTIVITY_META[type]
              const setting = activitySettings.find((s) => s.activityType === type)
              const enabled = setting?.enabled ?? true
              const difficulty = setting?.difficulty ?? 'EASY'
              const isSaving = savingActivity === type

              return (
                <div
                  key={type}
                  className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl shrink-0">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[#5C4033] text-sm">{meta.label}</p>
                      <p className="text-xs text-[#8D7061]">{meta.description}</p>
                    </div>
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggleActivity(type, !enabled)}
                      disabled={isSaving}
                      className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                        enabled ? 'bg-[#8FBC8F]' : 'bg-gray-200'
                      } disabled:opacity-60`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                          enabled ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                  {enabled && (
                    <div className="mt-2 flex gap-2">
                      {(['EASY', 'MEDIUM', 'HARD'] as const).map((d) => (
                        <button
                          key={d}
                          onClick={() => handleChangeDifficulty(type, d)}
                          disabled={isSaving}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            difficulty === d
                              ? 'bg-[#8FBC8F] text-white'
                              : 'bg-gray-100 text-[#8D7061]'
                          } disabled:opacity-60`}
                        >
                          {DIFFICULTY_LABELS[d]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab: Agenda */}
      {activeTab === 'agenda' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-[#5C4033]">Agenda de hoy</h3>
              <p className="text-xs text-[#8D7061] font-semibold">
                {new Date().toLocaleDateString('es-AR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <button
              onClick={() => setShowAgendaForm(!showAgendaForm)}
              className="bg-[#8FBC8F] text-white font-bold rounded-xl px-3 py-2 text-sm"
            >
              + Agregar
            </button>
          </div>

          {showAgendaForm && (
            <form
              onSubmit={handleAddAgendaItem}
              className="bg-white rounded-2xl p-4 shadow-sm border border-[#FFCBA4] space-y-3"
            >
              <h4 className="font-black text-[#5C4033]">Nuevo evento</h4>
              <input
                type="text"
                value={agendaForm.title}
                onChange={(e) => setAgendaForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Título del evento"
                className="w-full border-2 border-[#FFCBA4] rounded-xl px-3 py-2 text-sm focus:border-[#8FBC8F] outline-none font-semibold text-[#5C4033]"
              />
              <input
                type="time"
                value={agendaForm.time}
                onChange={(e) => setAgendaForm((f) => ({ ...f, time: e.target.value }))}
                className="w-full border-2 border-[#FFCBA4] rounded-xl px-3 py-2 text-sm focus:border-[#8FBC8F] outline-none font-semibold text-[#5C4033]"
              />
              <textarea
                value={agendaForm.description}
                onChange={(e) => setAgendaForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Descripción (opcional)"
                rows={2}
                className="w-full border-2 border-[#FFCBA4] rounded-xl px-3 py-2 text-sm focus:border-[#8FBC8F] outline-none font-semibold text-[#5C4033] resize-none"
              />
              <input
                type="text"
                value={agendaForm.visitorName}
                onChange={(e) => setAgendaForm((f) => ({ ...f, visitorName: e.target.value }))}
                placeholder="Nombre del visitante (opcional)"
                className="w-full border-2 border-[#FFCBA4] rounded-xl px-3 py-2 text-sm focus:border-[#8FBC8F] outline-none font-semibold text-[#5C4033]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAgendaForm(false)}
                  className="flex-1 border-2 border-gray-200 text-[#8D7061] font-bold rounded-xl py-2 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingAgenda}
                  className="flex-1 bg-[#8FBC8F] text-white font-bold rounded-xl py-2 text-sm disabled:opacity-60"
                >
                  {savingAgenda ? 'Guardando…' : 'Agregar'}
                </button>
              </div>
            </form>
          )}

          {agendaItems.length === 0 && !showAgendaForm ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
              <p className="text-3xl mb-2">🗓️</p>
              <p className="font-bold text-[#5C4033]">Sin eventos para hoy</p>
            </div>
          ) : (
            <div className="space-y-2">
              {agendaItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex items-start gap-3"
                >
                  <div className="text-xl mt-0.5">🗓️</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[#5C4033] text-sm">{item.title}</p>
                    {item.time && (
                      <p className="text-xs text-[#87CEEB] font-bold">{item.time}hs</p>
                    )}
                    {item.description && (
                      <p className="text-xs text-[#8D7061] mt-0.5">{item.description}</p>
                    )}
                    {item.visitorName && (
                      <p className="text-xs text-[#8D7061] font-semibold mt-0.5">
                        Visitante: {item.visitorName}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteAgendaItem(item.id)}
                    className="bg-red-100 text-red-600 font-bold rounded-xl px-2 py-1 text-xs shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Medicación */}
      {activeTab === 'medicacion' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-[#5C4033]">Medicación</h3>
            <button
              onClick={() => setShowMedForm(!showMedForm)}
              className="bg-[#8FBC8F] text-white font-bold rounded-xl px-3 py-2 text-sm"
            >
              + Agregar
            </button>
          </div>

          {showMedForm && (
            <form
              onSubmit={handleAddMedication}
              className="bg-white rounded-2xl p-4 shadow-sm border border-[#FFCBA4] space-y-3"
            >
              <h4 className="font-black text-[#5C4033]">Nuevo medicamento</h4>
              <input
                type="text"
                value={medForm.name}
                onChange={(e) => setMedForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nombre del medicamento"
                className="w-full border-2 border-[#FFCBA4] rounded-xl px-3 py-2 text-sm focus:border-[#8FBC8F] outline-none font-semibold text-[#5C4033]"
              />
              <input
                type="text"
                value={medForm.dosage}
                onChange={(e) => setMedForm((f) => ({ ...f, dosage: e.target.value }))}
                placeholder="Dosis (Ej: 10mg, 1 comprimido)"
                className="w-full border-2 border-[#FFCBA4] rounded-xl px-3 py-2 text-sm focus:border-[#8FBC8F] outline-none font-semibold text-[#5C4033]"
              />
              <input
                type="text"
                value={medForm.times}
                onChange={(e) => setMedForm((f) => ({ ...f, times: e.target.value }))}
                placeholder="Horarios separados por comas (Ej: 8:00, 14:00, 20:00)"
                className="w-full border-2 border-[#FFCBA4] rounded-xl px-3 py-2 text-sm focus:border-[#8FBC8F] outline-none font-semibold text-[#5C4033]"
              />
              <div>
                <label className="block text-xs font-bold text-[#5C4033] mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {MED_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setMedForm((f) => ({ ...f, color }))}
                      className={`w-8 h-8 rounded-full border-4 transition-all ${
                        medForm.color === color ? 'border-[#5C4033] scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowMedForm(false)}
                  className="flex-1 border-2 border-gray-200 text-[#8D7061] font-bold rounded-xl py-2 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingMed}
                  className="flex-1 bg-[#8FBC8F] text-white font-bold rounded-xl py-2 text-sm disabled:opacity-60"
                >
                  {savingMed ? 'Guardando…' : 'Agregar'}
                </button>
              </div>
            </form>
          )}

          {medications.length === 0 && !showMedForm ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
              <p className="text-3xl mb-2">💊</p>
              <p className="font-bold text-[#5C4033]">Sin medicamentos registrados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {medications.map((med) => (
                <div
                  key={med.id}
                  className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex items-start gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 mt-0.5"
                    style={{ backgroundColor: med.color + '40', border: `2px solid ${med.color}` }}
                  >
                    💊
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[#5C4033] text-sm">{med.name}</p>
                    <p className="text-xs text-[#8D7061] font-semibold">{med.dosage}</p>
                    {med.times?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {med.times.map((t, i) => (
                          <span
                            key={i}
                            className="bg-gray-100 text-[#5C4033] text-xs font-bold px-2 py-0.5 rounded-lg"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteMedication(med.id)}
                    className="bg-red-100 text-red-600 font-bold rounded-xl px-2 py-1 text-xs shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
