import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { createError } from '../middleware/errorHandler'

async function verifyPatientAccess(caregiverId: string, patientId: string) {
  return prisma.patient.findFirst({ where: { id: patientId, caregiverId } })
}

export async function listAgendaItems(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patient = await verifyPatientAccess(req.user.id, req.params.id)
    if (!patient) return next(createError('Paciente no encontrado', 404))

    const { date } = req.query
    let dateFilter: object = {}

    if (date && typeof date === 'string') {
      const targetDate = new Date(date)
      const nextDate = new Date(targetDate)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayOfWeek = targetDate.getDay() // 0=Sunday, 6=Saturday

      // Items for exact date OR recurring items where the day of week is in recurringDays
      dateFilter = {
        OR: [
          {
            date: {
              gte: targetDate,
              lt: nextDate,
            },
            recurring: false,
          },
          {
            recurring: true,
            recurringDays: { has: dayOfWeek },
          },
        ],
      }
    }

    const items = await prisma.agendaItem.findMany({
      where: { patientId: req.params.id, ...dateFilter },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    })

    res.json({ items })
  } catch (err) {
    next(err)
  }
}

export async function createAgendaItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patient = await verifyPatientAccess(req.user.id, req.params.id)
    if (!patient) return next(createError('Paciente no encontrado', 404))

    const { title, date, time, description, visitorName, visitorPhoto, recurring, recurringDays } = req.body

    if (!title || !date) {
      return next(createError('title y date son requeridos', 400))
    }

    const item = await prisma.agendaItem.create({
      data: {
        patientId: req.params.id,
        title,
        date: new Date(date),
        time: time ?? null,
        description: description ?? null,
        visitorName: visitorName ?? null,
        visitorPhoto: visitorPhoto ?? null,
        recurring: recurring ?? false,
        recurringDays: recurringDays ?? [],
      },
    })

    res.status(201).json({ item })
  } catch (err) {
    next(err)
  }
}

export async function updateAgendaItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patient = await verifyPatientAccess(req.user.id, req.params.id)
    if (!patient) return next(createError('Paciente no encontrado', 404))

    const existing = await prisma.agendaItem.findFirst({
      where: { id: req.params.itemId, patientId: req.params.id },
    })
    if (!existing) return next(createError('Item de agenda no encontrado', 404))

    const { title, date, time, description, visitorName, visitorPhoto, recurring, recurringDays } = req.body

    const item = await prisma.agendaItem.update({
      where: { id: req.params.itemId },
      data: {
        ...(title !== undefined && { title }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(time !== undefined && { time }),
        ...(description !== undefined && { description }),
        ...(visitorName !== undefined && { visitorName }),
        ...(visitorPhoto !== undefined && { visitorPhoto }),
        ...(recurring !== undefined && { recurring }),
        ...(recurringDays !== undefined && { recurringDays }),
      },
    })

    res.json({ item })
  } catch (err) {
    next(err)
  }
}

export async function deleteAgendaItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patient = await verifyPatientAccess(req.user.id, req.params.id)
    if (!patient) return next(createError('Paciente no encontrado', 404))

    const existing = await prisma.agendaItem.findFirst({
      where: { id: req.params.itemId, patientId: req.params.id },
    })
    if (!existing) return next(createError('Item de agenda no encontrado', 404))

    await prisma.agendaItem.delete({ where: { id: req.params.itemId } })

    res.json({ message: 'Item eliminado' })
  } catch (err) {
    next(err)
  }
}
