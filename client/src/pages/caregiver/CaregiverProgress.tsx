import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { patientsApi } from '../../api/patients.api'
import { resolveMediaUrl } from '../../api/client'
import type { Patient } from '../../types'

interface PatientSummary {
  patient: Patient
  streak: number
  totalSessions: number
  avgScore: number
  loading: boolean
}

const MOOD_EMOJI: Record<string, string> = {
  VERY_HAPPY: '😄',
  HAPPY: '🙂',
  NEUTRAL: '😐',
  TIRED: '😴',
  ANXIOUS: '😰',
  SAD: '😢',
}

export function CaregiverProgress() {
  const navigate = useNavigate()
  const [summaries, setSummaries] = useState<PatientSummary[]>([])
  const [weeklyData, setWeeklyData] = useState<{ labels: string[]; datasets: { activity: string; scores: (number | null)[] }[] } | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [loadingAll, setLoadingAll] = useState(true)
  const [loadingWeekly, setLoadingWeekly] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await patientsApi.list()
        const patients: Patient[] = Array.isArray(res.data) ? res.data : []

        const initial: PatientSummary[] = patients.map((p) => ({
          patient: p,
          streak: 0,
          totalSessions: 0,
          avgScore: 0,
          loading: true,
        }))
        setSummaries(initial)

        await Promise.all(
          patients.map(async (p, idx) => {
            try {
              const prog = await patientsApi.getProgress(p.id)
              const d = prog.data as { streak?: number; totalSessions?: number; avgScore?: number }
              setSummaries((prev) =>
                prev.map((s, i) =>
                  i === idx
                    ? {
                        ...s,
                        streak: d.streak ?? 0,
                        totalSessions: d.totalSessions ?? 0,
                        avgScore: Math.round((d.avgScore ?? 0) * 10) / 10,
                        loading: false,
                      }
                    : s
                )
              )
            } catch {
              setSummaries((prev) =>
                prev.map((s, i) => (i === idx ? { ...s, loading: false } : s))
              )
            }
          })
        )

        if (patients.length > 0) setSelectedPatient(patients[0])
      } catch {
        // ignore
      } finally {
        setLoadingAll(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedPatient) return
    setLoadingWeekly(true)
    patientsApi
      .getWeeklyProgress(selectedPatient.id)
      .then((res) => {
        const d = res.data as typeof weeklyData
        setWeeklyData(d)
      })
      .catch(() => setWeeklyData(null))
      .finally(() => setLoadingWeekly(false))
  }, [selectedPatient])

  // Build chart data from weekly
  const chartData = weeklyData
    ? weeklyData.labels.map((label, i) => {
        const row: Record<string, string | number> = { day: label }
        weeklyData.datasets.forEach((ds) => {
          row[ds.activity] = ds.scores[i] ?? 0
        })
        return row
      })
    : []

  const COLORS = ['#87CEEB', '#8FBC8F', '#FFCBA4', '#FFF3A3', '#D8B4FE', '#FFADB5']

  return (
    <div className="space-y-6 pb-8">
      <h2 className="text-xl font-black text-[#5C4033]">📊 Progreso de pacientes</h2>

      {loadingAll ? (
        <div className="text-center py-12 text-[#8D7061] font-semibold text-sm">
          Cargando datos…
        </div>
      ) : summaries.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
          <p className="text-3xl mb-2">📊</p>
          <p className="font-bold text-[#5C4033]">Sin pacientes registrados</p>
          <button
            onClick={() => navigate('/caregiver/patients')}
            className="mt-4 bg-[#8FBC8F] text-white font-bold rounded-xl px-5 py-2 text-sm"
          >
            Ir a Pacientes
          </button>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="space-y-3">
            {summaries.map(({ patient, streak, totalSessions, avgScore, loading }) => (
              <button
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className={`w-full text-left bg-white rounded-2xl px-4 py-4 shadow-sm border-2 transition-all ${
                  selectedPatient?.id === patient.id
                    ? 'border-[#8FBC8F]'
                    : 'border-gray-100 hover:border-[#FFCBA4]'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {patient.photoUrl ? (
                    <img src={resolveMediaUrl(patient.photoUrl)} alt={patient.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#FFCBA4] flex items-center justify-center text-lg">👤</div>
                  )}
                  <p className="font-black text-[#5C4033]">{patient.name}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/caregiver/patients/${patient.id}/progress`) }}
                    className="ml-auto text-xs font-bold text-[#8FBC8F] hover:underline"
                  >
                    Detalle →
                  </button>
                </div>

                {loading ? (
                  <p className="text-xs text-[#8D7061] font-semibold">Cargando…</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#87CEEB20] rounded-xl py-2">
                      <p className="text-xl font-black text-[#87CEEB]">{streak}</p>
                      <p className="text-xs font-bold text-[#5C4033]">🔥 Racha</p>
                    </div>
                    <div className="bg-[#8FBC8F20] rounded-xl py-2">
                      <p className="text-xl font-black text-[#8FBC8F]">{totalSessions}</p>
                      <p className="text-xs font-bold text-[#5C4033]">Sesiones</p>
                    </div>
                    <div className="bg-[#FFF3A320] rounded-xl py-2">
                      <p className="text-xl font-black text-[#C8A800]">{avgScore > 0 ? avgScore.toFixed(1) : '—'}</p>
                      <p className="text-xs font-bold text-[#5C4033]">Score</p>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Weekly chart for selected patient */}
          {selectedPatient && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-[#5C4033] text-sm">
                  Actividad semanal — {selectedPatient.name}
                </h3>
              </div>

              {loadingWeekly ? (
                <p className="text-xs text-center text-[#8D7061] font-semibold py-6">Cargando…</p>
              ) : !chartData.length || !weeklyData?.datasets.length ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">📈</p>
                  <p className="text-sm font-bold text-[#5C4033]">Sin actividad esta semana</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 'bold', fill: '#8D7061' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#8D7061' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #FFCBA4', fontSize: 11 }}
                    />
                    {weeklyData.datasets.slice(0, 5).map((ds, i) => (
                      <Bar key={ds.activity} dataKey={ds.activity} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </>
      )}

      {/* Mood legend */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-black text-[#5C4033] text-sm mb-3">Estados de ánimo</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(MOOD_EMOJI).map(([key, emoji]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="text-xl">{emoji}</span>
              <span className="text-xs font-bold text-[#8D7061]">{key.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
