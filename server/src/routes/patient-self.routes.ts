import { Router } from 'express'
import { authenticate, authorizePatient } from '../middleware/authenticate'
import { prisma } from '../config/database'
import { ActivityType, Difficulty } from '@prisma/client'

const ALL_TYPES = Object.values(ActivityType)

const router = Router()

router.use(authenticate, authorizePatient)

// GET /api/patient/agenda?date=YYYY-MM-DD
router.get('/agenda', async (req, res, next) => {
  try {
    const patientId = req.user!.id
    const { date } = req.query

    let dateFilter: object = {}
    if (date && typeof date === 'string') {
      const targetDate = new Date(date)
      const nextDate = new Date(targetDate)
      nextDate.setDate(nextDate.getDate() + 1)
      const dayOfWeek = targetDate.getDay()

      dateFilter = {
        OR: [
          { date: { gte: targetDate, lt: nextDate }, recurring: false },
          { recurring: true, recurringDays: { has: dayOfWeek } },
        ],
      }
    }

    const items = await prisma.agendaItem.findMany({
      where: { patientId, ...dateFilter },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    })

    res.json({ items })
  } catch (err) {
    next(err)
  }
})

// GET /api/patient/activity-settings
router.get('/activity-settings', async (req, res, next) => {
  try {
    const patientId = req.user!.id
    const existing = await prisma.activitySetting.findMany({
      where: { patientId },
      select: { activityType: true, difficulty: true, enabled: true, order: true },
      orderBy: { order: 'asc' },
    })

    // Fill in any activity types added after the patient was created
    const existingTypes = new Set(existing.map((s) => s.activityType))
    const maxOrder = existing.reduce((m, s) => Math.max(m, s.order), existing.length - 1)
    const missing = ALL_TYPES
      .filter((t) => !existingTypes.has(t))
      .map((t, i) => ({ activityType: t, difficulty: Difficulty.EASY, enabled: true, order: maxOrder + i + 1 }))

    // Persist missing settings so the cuidador can configure them
    if (missing.length > 0) {
      await prisma.activitySetting.createMany({
        data: missing.map((m) => ({ patientId, ...m })),
        skipDuplicates: true,
      })
    }

    res.json([...existing, ...missing])
  } catch (err) {
    next(err)
  }
})

// GET /api/patient/medications
router.get('/medications', async (req, res, next) => {
  try {
    const patientId = req.user!.id
    const medications = await prisma.medication.findMany({
      where: { patientId },
      orderBy: { name: 'asc' },
    })
    res.json({ medications })
  } catch (err) {
    next(err)
  }
})

export default router
