import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { createError } from '../middleware/errorHandler'

async function verifyPatientAccess(caregiverId: string, patientId: string) {
  return prisma.patient.findFirst({ where: { id: patientId, caregiverId } })
}

export async function getProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patient = await verifyPatientAccess(req.user.id, req.params.id)
    if (!patient) return next(createError('Paciente no encontrado', 404))

    const patientId = req.params.id

    // Total sessions
    const totalSessions = await prisma.session.count({
      where: { patientId, endedAt: { not: null } },
    })

    // Average score across all activity logs
    const scoreAgg = await prisma.activityLog.aggregate({
      where: { session: { patientId } },
      _avg: { score: true },
    })

    // Streak: consecutive days with at least one completed session
    const sessions = await prisma.session.findMany({
      where: { patientId, endedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
      select: { startedAt: true },
    })

    let streak = 0
    if (sessions.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let checkDate = new Date(today)

      const sessionDays = new Set(
        sessions.map((s) => {
          const d = new Date(s.startedAt)
          d.setHours(0, 0, 0, 0)
          return d.getTime()
        })
      )

      // Check consecutive days backwards from today
      while (sessionDays.has(checkDate.getTime())) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      }

      // If no session today, check from yesterday
      if (streak === 0) {
        checkDate = new Date(today)
        checkDate.setDate(checkDate.getDate() - 1)
        while (sessionDays.has(checkDate.getTime())) {
          streak++
          checkDate.setDate(checkDate.getDate() - 1)
        }
      }
    }

    // Mood history last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const moodHistory = await prisma.moodEntry.findMany({
      where: { patientId, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: 'asc' },
      select: { mood: true, createdAt: true },
    })

    res.json({
      streak,
      totalSessions,
      avgScore: scoreAgg._avg.score ?? 0,
      moodHistory,
    })
  } catch (err) {
    next(err)
  }
}

export async function getWeeklyProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patient = await verifyPatientAccess(req.user.id, req.params.id)
    if (!patient) return next(createError('Paciente no encontrado', 404))

    const patientId = req.params.id

    // Last 7 days
    const days: string[] = []
    const labels: string[] = []
    const now = new Date()
    const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      days.push(d.toISOString())
      labels.push(DAYS_ES[d.getDay()])
    }

    // Get all activity logs for the past week
    const startDate = new Date(days[0])
    const logs = await prisma.activityLog.findMany({
      where: {
        session: { patientId },
        startedAt: { gte: startDate },
      },
      select: { activityType: true, score: true, starsEarned: true, startedAt: true },
    })

    // Group by activity type
    const activityMap: Record<string, (number | null)[]> = {}

    for (const log of logs) {
      const dayIdx = days.findIndex((dayStr) => {
        const day = new Date(dayStr)
        const nextDay = new Date(day)
        nextDay.setDate(nextDay.getDate() + 1)
        return log.startedAt >= day && log.startedAt < nextDay
      })

      if (dayIdx === -1) continue

      const type = log.activityType
      if (!activityMap[type]) {
        activityMap[type] = Array(7).fill(null)
      }
      activityMap[type][dayIdx] = log.score ?? log.starsEarned
    }

    const datasets = Object.entries(activityMap).map(([activity, scores]) => ({
      activity,
      scores,
    }))

    res.json({ labels, datasets })
  } catch (err) {
    next(err)
  }
}

export async function getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patient = await verifyPatientAccess(req.user.id, req.params.id)
    if (!patient) return next(createError('Paciente no encontrado', 404))

    const patientId = req.params.id
    const alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> = []

    // Check inactivity: no sessions in last 3 days
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const recentSession = await prisma.session.findFirst({
      where: { patientId, startedAt: { gte: threeDaysAgo } },
    })

    if (!recentSession) {
      alerts.push({
        type: 'INACTIVITY',
        message: 'No ha habido sesiones en los últimos 3 días.',
        severity: 'medium',
      })
    }

    // Check low mood: 2+ sad/anxious entries in last 3 days
    const lowMoods = await prisma.moodEntry.findMany({
      where: {
        patientId,
        mood: { in: ['SAD', 'ANXIOUS'] },
        createdAt: { gte: threeDaysAgo },
      },
    })

    if (lowMoods.length >= 2) {
      alerts.push({
        type: 'LOW_MOOD',
        message: 'Se detectaron varios estados de ánimo bajos recientemente.',
        severity: 'high',
      })
    }

    res.json({ alerts })
  } catch (err) {
    next(err)
  }
}
