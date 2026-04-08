import { Request, Response, NextFunction } from 'express'
import { MoodType } from '@prisma/client'
import { prisma } from '../config/database'
import { createError } from '../middleware/errorHandler'

export async function createMoodEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const { patientId, mood, sessionId } = req.body

    if (!patientId || !mood) {
      return next(createError('patientId y mood son requeridos', 400))
    }

    if (!Object.values(MoodType).includes(mood as MoodType)) {
      return next(createError('mood inválido', 400))
    }

    // If patient role, can only log own mood
    if (req.user.role === 'patient' && req.user.id !== patientId) {
      return next(createError('Acceso denegado', 403))
    }

    const entry = await prisma.moodEntry.create({
      data: {
        patientId,
        mood: mood as MoodType,
        sessionId: sessionId ?? null,
      },
    })

    res.status(201).json({ entry })
  } catch (err) {
    next(err)
  }
}

export async function getMoodEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    // Caregiver access: verify ownership
    if (req.user.role === 'caregiver') {
      const patient = await prisma.patient.findFirst({
        where: { id: req.params.id, caregiverId: req.user.id },
      })
      if (!patient) return next(createError('Paciente no encontrado', 404))
    }

    const { from, to } = req.query
    const dateFilter: Record<string, Date> = {}

    if (from && typeof from === 'string') {
      dateFilter.gte = new Date(from)
    }
    if (to && typeof to === 'string') {
      const toDate = new Date(to)
      toDate.setHours(23, 59, 59, 999)
      dateFilter.lte = toDate
    }

    const entries = await prisma.moodEntry.findMany({
      where: {
        patientId: req.params.id,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ entries })
  } catch (err) {
    next(err)
  }
}
