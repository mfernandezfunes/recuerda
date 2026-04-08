import { useState, useEffect, useRef } from 'react'
import { patientsApi } from '../api/patients.api'

interface MedAlarm {
  name: string
  dosage: string
  color: string
}

interface Medication {
  id: string
  name: string
  dosage: string
  times: string[]
  days: number[]
  color: string
  active: boolean
}

export function useMedicationAlarm(patientId: string | undefined) {
  const [alarmActive, setAlarmActive] = useState(false)
  const [currentMed, setCurrentMed] = useState<MedAlarm | null>(null)
  const dismissedRef = useRef<Set<string>>(new Set())

  function playAlarmTone() {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 523 // Do5
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5)
      osc.start()
      osc.stop(ctx.currentTime + 1.5)
    } catch {
      // Web Audio API might not be available
    }
  }

  function checkMedications() {
    if (!patientId) return
    patientsApi.getMedications(patientId)
      .then((res) => {
        const medications: Medication[] = res.data
        const now = new Date()
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()
        const currentDay = now.getDay() // 0=Sunday, 6=Saturday

        for (const med of medications) {
          if (!med.active) continue
          // days array: check if today matches (0-6)
          if (med.days.length > 0 && !med.days.includes(currentDay)) continue

          for (const timeStr of med.times) {
            // timeStr format: "HH:MM"
            const [hStr, mStr] = timeStr.split(':')
            const medHour = parseInt(hStr, 10)
            const medMinute = parseInt(mStr, 10)

            const diffMinutes = (currentHour * 60 + currentMinute) - (medHour * 60 + medMinute)
            if (Math.abs(diffMinutes) <= 2) {
              const key = `${med.id}-${timeStr}-${now.toDateString()}`
              if (!dismissedRef.current.has(key)) {
                dismissedRef.current.add(key)
                setCurrentMed({ name: med.name, dosage: med.dosage, color: med.color })
                setAlarmActive(true)
                playAlarmTone()
                return
              }
            }
          }
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (!patientId) return

    checkMedications()
    const interval = setInterval(checkMedications, 60_000)
    return () => clearInterval(interval)
  }, [patientId])

  function dismissAlarm() {
    setAlarmActive(false)
  }

  return { alarmActive, currentMed, dismissAlarm }
}
