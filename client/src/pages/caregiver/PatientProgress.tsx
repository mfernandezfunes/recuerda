import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { patientsApi } from '../../api/patients.api'
import type { MoodType } from '../../types'

interface WeeklyDataPoint {
  day: string
  score: number
  sessions?: number
}

interface SessionRecord {
  id: string
  date: string
  activityType: string
  activityLabel: string
  durationMinutes: number
  stars: number
}

interface ProgressSummary {
  streak: number
  totalSessions: number
  favoriteActivity: string
  moodHistory: MoodType[]
}

const MOOD_EMOJI: Record<MoodType, string> = {
  VERY_HAPPY: '😄',
  HAPPY: '😊',
  NEUTRAL: '😐',
  SAD: '😢',
  ANXIOUS: '😰',
  TIRED: '😴',
}

const MOOD_LABEL: Record<MoodType, string> = {
  VERY_HAPPY: 'Muy contento/a',
  HAPPY: 'Contento/a',
  NEUTRAL: 'Regular',
  SAD: 'Triste',
  ANXIOUS: 'Ansioso/a',
  TIRED: 'Cansado/a',
}

type Range = 'week' | 'month'

export function PatientProgress() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()

  const [range, setRange] = useState<Range>('week')
  const [weeklyData, setWeeklyData] = useState<WeeklyDataPoint[]>([])
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [summary, setSummary] = useState<ProgressSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!patientId) return
      setLoading(true)
      try {
        const [weeklyRes, progressRes] = await Promise.all([
          patientsApi.getWeeklyProgress(patientId),
          patientsApi.getProgress(patientId),
        ])

        const weekly = weeklyRes.data as { data?: WeeklyDataPoint[] } | WeeklyDataPoint[]
        setWeeklyData(
          Array.isArray(weekly) ? weekly : Array.isArray((weekly as { data?: WeeklyDataPoint[] }).data) ? (weekly as { data: WeeklyDataPoint[] }).data : []
        )

        const progress = progressRes.data as {
          sessions?: SessionRecord[]
          summary?: ProgressSummary
          streak?: number
          totalSessions?: number
          favoriteActivity?: string
          moodHistory?: MoodType[]
        }
        setSessions(Array.isArray(progress.sessions) ? progress.sessions : [])
        setSummary(
          progress.summary ?? {
            streak: progress.streak ?? 0,
            totalSessions: progress.totalSessions ?? 0,
            favoriteActivity: progress.favoriteActivity ?? '—',
            moodHistory: progress.moodHistory ?? [],
          }
        )
      } catch {
        setWeeklyData([])
        setSessions([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [patientId, range])

  const renderStars = (count: number) =>
    Array.from({ length: 3 }, (_, i) => (
      <span key={i} className={i < count ? 'text-yellow-400' : 'text-gray-200'}>
        ★
      </span>
    ))

  return (
    <div className="space-y-6 pb-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="text-[#8D7061] font-bold text-sm hover:text-[#5C4033]"
      >
        ← Volver
      </button>

      <div>
        <h2 className="text-2xl font-black text-[#5C4033]">Progreso</h2>
        <p className="text-sm text-[#8D7061] font-semibold">Seguimiento de actividades</p>
      </div>

      {/* Range selector */}
      <div className="flex gap-2">
        {([
          { id: 'week' as Range, label: 'Esta semana' },
          { id: 'month' as Range, label: 'Mes pasado' },
        ] as const).map((opt) => (
          <button
            key={opt.id}
            onClick={() => setRange(opt.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              range === opt.id
                ? 'bg-[#8FBC8F] text-white shadow-sm'
                : 'bg-white text-[#8D7061] border border-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#8D7061] font-semibold text-sm">
          Cargando progreso…
        </div>
      ) : (
        <>
          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                <p className="text-3xl font-black text-[#8FBC8F]">{summary.streak}</p>
                <p className="text-xs font-bold text-[#5C4033] mt-1">Días seguidos</p>
                <p className="text-lg mt-0.5">🔥</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                <p className="text-3xl font-black text-[#87CEEB]">{summary.totalSessions}</p>
                <p className="text-xs font-bold text-[#5C4033] mt-1">Sesiones</p>
                <p className="text-lg mt-0.5">📊</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                <p className="text-xs font-black text-[#FFCBA4] truncate leading-tight pt-1">
                  {summary.favoriteActivity || '—'}
                </p>
                <p className="text-xs font-bold text-[#5C4033] mt-1">Favorita</p>
                <p className="text-lg mt-0.5">⭐</p>
              </div>
            </div>
          )}

          {/* Line chart */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-black text-[#5C4033] mb-4 text-sm">Puntuación por día</h3>
            {weeklyData.length === 0 ? (
              <div className="text-center py-8 text-[#8D7061] font-semibold text-sm">
                Sin datos para este período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyData}>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: '#8D7061', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#8D7061', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '2px solid #FFCBA4',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, fontWeight: 700 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#8FBC8F"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#8FBC8F' }}
                    name="Puntuación"
                  />
                  {weeklyData[0]?.sessions !== undefined && (
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      stroke="#87CEEB"
                      strokeWidth={2}
                      dot={false}
                      name="Sesiones"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Mood history */}
          {summary && summary.moodHistory.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-black text-[#5C4033] mb-3 text-sm">
                Últimos estados de ánimo
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {summary.moodHistory.slice(0, 7).map((mood, i) => (
                  <div key={i} className="flex flex-col items-center shrink-0">
                    <span className="text-3xl">{MOOD_EMOJI[mood]}</span>
                    <span className="text-xs text-[#8D7061] font-semibold mt-1 text-center whitespace-nowrap">
                      {MOOD_LABEL[mood]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sessions history */}
          <div className="space-y-3">
            <h3 className="font-black text-[#5C4033] text-sm uppercase tracking-wide">
              Últimas sesiones
            </h3>
            {sessions.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
                <p className="text-3xl mb-2">📋</p>
                <p className="font-bold text-[#5C4033]">Sin sesiones registradas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 10).map((session) => (
                  <div
                    key={session.id}
                    className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[#5C4033] text-sm">
                        {session.activityLabel || session.activityType}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-[#8D7061] font-semibold">
                          {new Date(session.date).toLocaleDateString('es-AR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                        <span className="text-[#8D7061] text-xs">·</span>
                        <p className="text-xs text-[#8D7061] font-semibold">
                          {session.durationMinutes} min
                        </p>
                      </div>
                    </div>
                    <div className="text-lg shrink-0">{renderStars(session.stars)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
