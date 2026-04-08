import { Router } from 'express'
import { authenticate, authorizePatient } from '../middleware/authenticate'
import { prisma } from '../config/database'

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
    const settings = await prisma.activitySetting.findMany({
      where: { patientId },
      select: { activityType: true, difficulty: true, enabled: true, order: true },
      orderBy: { order: 'asc' },
    })
    res.json(settings)
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
