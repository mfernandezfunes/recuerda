import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/auth.store'
import { useTTS } from '../../hooks/useTTS'
import apiClient from '../../api/client'

interface AgendaItem {
  id: string
  title: string
  time?: string
  description?: string
  visitorName?: string
  visitorPhoto?: string
}

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function todayLabel(): string {
  const d = new Date()
  return `${DAYS_ES[d.getDay()]} ${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`
}

function getIcon(item: AgendaItem): string {
  const t = item.title.toLowerCase()
  if (item.visitorName) return '👥'
  if (t.includes('médic') || t.includes('doctor') || t.includes('turno')) return '🏥'
  if (t.includes('medicament') || t.includes('pastilla')) return '💊'
  if (t.includes('caminar') || t.includes('ejercicio') || t.includes('fisio')) return '🚶'
  if (t.includes('comida') || t.includes('almuerzo') || t.includes('cena') || t.includes('desayuno')) return '🍽️'
  if (t.includes('familia') || t.includes('hijo') || t.includes('nieto')) return '❤️'
  return '🗓️'
}

export function PatientAgenda() {
  const patient = useAuthStore((s) => s.patient)
  const { speak } = useTTS()
  const [items, setItems] = useState<AgendaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const today = new Date().toISOString().split('T')[0]
        const res = await apiClient.get('/patient/agenda', { params: { date: today } })
        const data = res.data as { items?: AgendaItem[] }
        setItems(Array.isArray(data.items) ? data.items : [])
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!loading) {
      if (items.length === 0) {
        speak('Hoy no tenés eventos en tu agenda. ¡Aprovechá para hacer una actividad!')
      } else {
        speak(`Hoy tenés ${items.length} evento${items.length > 1 ? 's' : ''} en tu agenda.`)
      }
    }
  }, [loading])

  return (
    <div className="px-5 py-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-black text-[#5C4033]">Mi agenda 🗓️</h2>
        <p className="text-lg text-[#8D7061] font-semibold mt-1 capitalize">{todayLabel()}</p>
      </motion.div>

      {/* Saludo personalizado */}
      {patient?.name && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-[#FFF3A340] border-2 border-[#FFF3A3] rounded-3xl px-5 py-4"
        >
          <p className="text-lg font-bold text-[#5C4033]">
            Hola, <span className="font-black">{patient.name}</span>. Aquí están tus actividades de hoy 👇
          </p>
        </motion.div>
      )}

      {/* Items */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-[#8D7061] font-semibold text-lg">Cargando agenda…</p>
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center py-12 space-y-3"
        >
          <p className="text-6xl">☀️</p>
          <p className="text-2xl font-black text-[#5C4033]">¡Día libre!</p>
          <p className="text-lg text-[#8D7061] font-semibold">
            No tenés eventos para hoy. Podés hacer una actividad.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-3xl shadow-sm border-2 border-[#FFCBA4] p-5"
            >
              <div className="flex items-start gap-4">
                {/* Visitor photo or icon */}
                {item.visitorPhoto ? (
                  <img
                    src={item.visitorPhoto}
                    alt={item.visitorName ?? 'visitante'}
                    className="w-16 h-16 rounded-full object-cover shrink-0 border-2 border-[#FFCBA4]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#FFCBA440] flex items-center justify-center text-3xl shrink-0">
                    {getIcon(item)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-xl font-black text-[#5C4033] leading-tight">{item.title}</p>
                  {item.time && (
                    <p className="text-lg font-bold text-[#87CEEB] mt-1">⏰ {item.time} hs</p>
                  )}
                  {item.visitorName && (
                    <p className="text-base font-bold text-[#8D7061] mt-1">
                      👤 Viene a visitarte <span className="text-[#5C4033] font-black">{item.visitorName}</span>
                    </p>
                  )}
                  {item.description && (
                    <p className="text-base text-[#8D7061] font-semibold mt-1">{item.description}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
