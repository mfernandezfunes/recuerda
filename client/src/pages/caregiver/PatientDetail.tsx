import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { patientsApi } from '../../api/patients.api'
import { mediaApi } from '../../api/media.api'
import { resolveMediaUrl } from '../../api/client'
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

function SortableActivityRow({
  type, meta, enabled, difficulty, isSaving, onToggle, onDifficulty,
}: {
  type: ActivityType
  meta: typeof ACTIVITY_META[ActivityType]
  enabled: boolean
  difficulty: string
  isSaving: boolean
  onToggle: () => void
  onDifficulty: (d: 'EASY' | 'MEDIUM' | 'HARD') => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: type })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100"
    >
      <div className="flex items-center gap-3">
        {/* Drag handle */}
        <span
          {...attributes}
          {...listeners}
          className="text-gray-300 cursor-grab active:cursor-grabbing shrink-0 text-lg select-none"
          style={{ touchAction: 'none' }}
        >
          ☰
        </span>
        <span className="text-2xl shrink-0">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-black text-[#5C4033] text-sm">{meta.label} — {meta.description}</p>
          <p className="text-xs text-[#8FBC8F] font-semibold mt-0.5">🧠 {meta.trains}</p>
        </div>
        <button
          onClick={onToggle}
          disabled={isSaving}
          className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${enabled ? 'bg-[#8FBC8F]' : 'bg-gray-200'} disabled:opacity-60`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${enabled ? 'left-7' : 'left-1'}`} />
        </button>
      </div>
      {enabled && (
        <div className="mt-2 flex gap-2 pl-10">
          {(['EASY', 'MEDIUM', 'HARD'] as const).map((d) => (
            <button
              key={d}
              onClick={() => onDifficulty(d)}
              disabled={isSaving}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                difficulty === d ? 'bg-[#8FBC8F] text-white' : 'bg-gray-100 text-[#8D7061]'
              } disabled:opacity-60`}
            >
              {{ EASY: 'Fácil', MEDIUM: 'Medio', HARD: 'Difícil' }[d]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function PatientDetail() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()

  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('familiares')

  // Patient photo
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Edit patient
  const [editingPatient, setEditingPatient] = useState(false)
  const [patientEditForm, setPatientEditForm] = useState({ name: '', birthDate: '', pin: '' })
  const [savingPatient, setSavingPatient] = useState(false)

  // Family members
  const [showFamilyForm, setShowFamilyForm] = useState(false)
  const [familyForm, setFamilyForm] = useState({ name: '', relation: '' })
  const [familyPhoto, setFamilyPhoto] = useState<File | null>(null)
  const [savingFamily, setSavingFamily] = useState(false)
  const [editingFmId, setEditingFmId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', relation: '' })
  const [editPhoto, setEditPhoto] = useState<File | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  // Activity settings
  const [activitySettings, setActivitySettings] = useState<ActivitySetting[]>([])
  const [activityOrder, setActivityOrder] = useState<ActivityType[]>([])
  const [savingActivity, setSavingActivity] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

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
      const settings: ActivitySetting[] = res.data.activitySettings || []
      const sorted = [...settings].sort((a, b) => ((a as any).order ?? 0) - ((b as any).order ?? 0))
      setActivitySettings(sorted)
      setActivityOrder(sorted.map((s) => s.activityType))
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

  function startEditPatient() {
    setPatientEditForm({
      name: patient?.name ?? '',
      birthDate: patient?.birthDate ? patient.birthDate.split('T')[0] : '',
      pin: '',
    })
    setEditingPatient(true)
  }

  async function handleSavePatient(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId) return
    setSavingPatient(true)
    try {
      const payload: Record<string, string> = {}
      if (patientEditForm.name.trim()) payload.name = patientEditForm.name.trim()
      if (patientEditForm.birthDate) payload.birthDate = patientEditForm.birthDate
      if (patientEditForm.pin) payload.pin = patientEditForm.pin
      await patientsApi.update(patientId, payload)
      setEditingPatient(false)
      await loadPatient()
    } catch {
      // ignore
    } finally {
      setSavingPatient(false)
    }
  }

  async function handlePatientPhoto(file: File) {
    if (!patientId) return
    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('patientId', patientId)
      const uploadRes = await mediaApi.upload(fd)
      const photoUrl = (uploadRes.data as { url?: string }).url
      if (photoUrl) {
        await patientsApi.update(patientId, { photoUrl })
        await loadPatient()
      }
    } catch {
      // ignore
    } finally {
      setUploadingPhoto(false)
    }
  }

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

  function startEditFamilyMember(fm: { id: string; name: string; relation: string }) {
    setEditingFmId(fm.id)
    setEditForm({ name: fm.name, relation: fm.relation })
    setEditPhoto(null)
  }

  async function handleUpdateFamilyMember(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId || !editingFmId) return
    setSavingEdit(true)
    try {
      let photoUrl: string | undefined
      if (editPhoto) {
        const fd = new FormData()
        fd.append('file', editPhoto)
        fd.append('patientId', patientId)
        const uploadRes = await mediaApi.upload(fd)
        photoUrl = (uploadRes.data as { url?: string }).url
      }
      await patientsApi.updateFamilyMember(patientId, editingFmId, {
        ...editForm,
        ...(photoUrl ? { photoUrl } : {}),
      })
      setEditingFmId(null)
      setEditPhoto(null)
      await loadPatient()
    } catch {
      // ignore
    } finally {
      setSavingEdit(false)
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

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || !patientId) return

    const oldIndex = activityOrder.indexOf(active.id as ActivityType)
    const newIndex = activityOrder.indexOf(over.id as ActivityType)
    const newOrder = arrayMove(activityOrder, oldIndex, newIndex)

    setActivityOrder(newOrder)
    setActivitySettings((prev) =>
      newOrder.map((type) => prev.find((s) => s.activityType === type)!)
    )

    await patientsApi.reorderActivitySettings(
      patientId,
      newOrder.map((type, i) => ({ activityType: type, order: i }))
    ).catch(() => {})
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

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        {!editingPatient ? (
          <div className="flex items-center gap-4">
            {/* Avatar clickeable para cambiar foto */}
            <label className="relative shrink-0 cursor-pointer group">
              {patient.photoUrl ? (
                <img src={resolveMediaUrl(patient.photoUrl)} alt={patient.name} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#FFCBA4] flex items-center justify-center text-2xl">👤</div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-bold">{uploadingPhoto ? '…' : '📷'}</span>
              </div>
              <input type="file" accept="image/*" className="hidden" disabled={uploadingPhoto}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePatientPhoto(f); e.target.value = '' }}
              />
            </label>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-[#5C4033]">{patient.name}</h2>
              {patient.birthDate && (
                <p className="text-sm text-[#8D7061] font-semibold">
                  Nacido/a el {new Date(patient.birthDate).toLocaleDateString('es-AR')}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={startEditPatient}
                className="text-xs font-bold text-[#8D4E00] bg-[#FFF3A3] border border-[#F5A623] rounded-xl px-3 py-2"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => navigate(`/caregiver/patients/${patientId}/progress`)}
                className="text-xs font-bold text-[#8FBC8F] bg-green-50 border border-green-200 rounded-xl px-3 py-2"
              >
                📊 Progreso
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSavePatient} className="space-y-3">
            <p className="font-black text-[#5C4033]">Editar paciente</p>
            <div>
              <label className="block text-xs font-bold text-[#5C4033] mb-1">Nombre</label>
              <input
                type="text"
                value={patientEditForm.name}
                onChange={(e) => setPatientEditForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border-2 border-[#FFCBA4] rounded-xl px-3 py-2 text-sm focus:border-[#8FBC8F] outline-none font-semibold text-[#5C4033]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5C4033] mb-1">Fecha de nacimiento</label>
              <input
                type="date"
                value={patientEditForm.birthDate}
                onChange={(e) => setPatientEditForm((f) => ({ ...f, birthDate: e.target.value }))}
                className="w-full border-2 border-[#FFCBA4] rounded-xl px-3 py-2 text-sm focus:border-[#8FBC8F] outline-none font-semibold text-[#5C4033]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5C4033] mb-1">Nuevo PIN (dejar vacío para no cambiar)</label>
              <input
                type="text"
                value={patientEditForm.pin}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setPatientEditForm((f) => ({ ...f, pin: v })) }}
                placeholder="4 dígitos"
                maxLength={4}
                className="w-full border-2 border-[#FFCBA4] rounded-xl px-3 py-2 text-sm focus:border-[#8FBC8F] outline-none font-semibold text-[#5C4033] tracking-widest"
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditingPatient(false)}
                className="flex-1 border-2 border-gray-200 text-[#8D7061] font-bold rounded-xl py-2 text-sm">
                Cancelar
              </button>
              <button type="submit" disabled={savingPatient}
                className="flex-1 bg-[#8FBC8F] text-white font-bold rounded-xl py-2 text-sm disabled:opacity-60">
                {savingPatient ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
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
                <div key={fm.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Card normal */}
                  {editingFmId !== fm.id ? (
                    <div className="px-4 py-3 flex items-center gap-3">
                      {fm.photoUrl ? (
                        <img
                          src={resolveMediaUrl(fm.photoUrl)}
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
                        onClick={() => startEditFamilyMember(fm)}
                        className="bg-[#FFF3A3] text-[#8D4E00] font-bold rounded-xl px-3 py-1.5 text-xs"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteFamilyMember(fm.id)}
                        className="bg-red-100 text-red-600 font-bold rounded-xl px-3 py-1.5 text-xs"
                      >
                        Eliminar
                      </button>
                    </div>
                  ) : (
                    /* Formulario de edición inline */
                    <form onSubmit={handleUpdateFamilyMember} className="px-4 py-3 space-y-3">
                      <p className="font-black text-[#5C4033] text-sm">Editar familiar</p>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Nombre"
                        className="w-full border-2 border-[#FFCBA4] rounded-xl px-3 py-2 text-sm focus:border-[#8FBC8F] outline-none font-semibold text-[#5C4033]"
                      />
                      <input
                        type="text"
                        value={editForm.relation}
                        onChange={(e) => setEditForm((f) => ({ ...f, relation: e.target.value }))}
                        placeholder="Relación"
                        className="w-full border-2 border-[#FFCBA4] rounded-xl px-3 py-2 text-sm focus:border-[#8FBC8F] outline-none font-semibold text-[#5C4033]"
                      />
                      <div>
                        <label className="block text-xs font-bold text-[#5C4033] mb-1">
                          Cambiar foto (opcional)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setEditPhoto(e.target.files?.[0] ?? null)}
                          className="text-sm text-[#8D7061]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setEditingFmId(null); setEditPhoto(null) }}
                          className="flex-1 border-2 border-gray-200 text-[#8D7061] font-bold rounded-xl py-2 text-sm"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={savingEdit}
                          className="flex-1 bg-[#8FBC8F] text-white font-bold rounded-xl py-2 text-sm disabled:opacity-60"
                        >
                          {savingEdit ? 'Guardando…' : 'Guardar'}
                        </button>
                      </div>
                    </form>
                  )}
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
          <p className="text-xs text-[#8D7061] font-semibold flex items-center gap-1">
            ☰ Arrastrá para cambiar el orden
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={activityOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {activityOrder.map((type) => {
                  const meta = ACTIVITY_META[type]
                  const setting = activitySettings.find((s) => s.activityType === type)
                  const enabled = setting?.enabled ?? true
                  const difficulty = setting?.difficulty ?? 'EASY'
                  const isSaving = savingActivity === type
                  return (
                    <SortableActivityRow
                      key={type}
                      type={type}
                      meta={meta}
                      enabled={enabled}
                      difficulty={difficulty}
                      isSaving={isSaving}
                      onToggle={() => handleToggleActivity(type, !enabled)}
                      onDifficulty={(d) => handleChangeDifficulty(type, d)}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
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
