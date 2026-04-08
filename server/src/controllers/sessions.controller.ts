import { Request, Response, NextFunction } from 'express'
import { ActivityType, Difficulty } from '@prisma/client'
import { prisma } from '../config/database'
import { createError } from '../middleware/errorHandler'

export async function createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const { patientId } = req.body
    if (!patientId) return next(createError('patientId es requerido', 400))

    // Verify the patient belongs to this user (caregiver) or is the patient themselves
    const patient = await prisma.patient.findUnique({ where: { id: patientId } })
    if (!patient) return next(createError('Paciente no encontrado', 404))

    if (req.user.role === 'caregiver' && patient.caregiverId !== req.user.id) {
      return next(createError('Acceso denegado', 403))
    }

    if (req.user.role === 'patient' && patient.id !== req.user.id) {
      return next(createError('Acceso denegado', 403))
    }

    const session = await prisma.session.create({
      data: { patientId },
    })

    res.status(201).json({ sessionId: session.id, session })
  } catch (err) {
    next(err)
  }
}

export async function logActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
    })
    if (!session) return next(createError('Sesión no encontrada', 404))

    if (session.endedAt) return next(createError('La sesión ya fue cerrada', 400))

    const { activityType, difficulty, starsEarned, score, durationSecs, metadata } = req.body

    if (!activityType || !difficulty) {
      return next(createError('activityType y difficulty son requeridos', 400))
    }

    if (!Object.values(ActivityType).includes(activityType as ActivityType)) {
      return next(createError('activityType inválido', 400))
    }

    if (!Object.values(Difficulty).includes(difficulty as Difficulty)) {
      return next(createError('difficulty inválido', 400))
    }

    const log = await prisma.activityLog.create({
      data: {
        sessionId: session.id,
        activityType: activityType as ActivityType,
        difficulty: difficulty as Difficulty,
        starsEarned: starsEarned ?? 0,
        score: score ?? null,
        durationSecs: durationSecs ?? null,
        completedAt: new Date(),
        metadata: metadata ?? undefined,
      },
    })

    res.status(201).json({ log })
  } catch (err) {
    next(err)
  }
}

export async function endSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { activityLogs: true },
    })
    if (!session) return next(createError('Sesión no encontrada', 404))

    if (session.endedAt) return next(createError('La sesión ya fue cerrada', 400))

    const endedAt = new Date()
    const durationSecs = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000)
    const totalStars = session.activityLogs.reduce((sum, log) => sum + log.starsEarned, 0)

    const updated = await prisma.session.update({
      where: { id: req.params.id },
      data: { endedAt, durationSecs, totalStars },
      include: { activityLogs: true },
    })

    res.json({ session: updated })
  } catch (err) {
    next(err)
  }
}

export async function getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { activityLogs: true },
    })
    if (!session) return next(createError('Sesión no encontrada', 404))

    res.json({ session })
  } catch (err) {
    next(err)
  }
}
