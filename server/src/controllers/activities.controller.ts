import { Request, Response, NextFunction } from 'express'
import { ActivityType, Difficulty } from '@prisma/client'
import { prisma } from '../config/database'
import { createError } from '../middleware/errorHandler'
import {
  generateWhoIsThisContent,
  generateWhatDayIsItContent,
  generateMemoryCardsContent,
  generateFindObjectContent,
  generateSeriesPatternsContent,
  generateWordSearchContent,
  generateOrderStoryContent,
  generateCompleteSongContent,
} from '../services/activityContent.service'

export async function listActivitySettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, caregiverId: req.user.id },
    })
    if (!patient) return next(createError('Paciente no encontrado', 404))

    const settings = await prisma.activitySetting.findMany({
      where: { patientId: req.params.id },
    })

    res.json({ settings })
  } catch (err) {
    next(err)
  }
}

export async function updateActivitySetting(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, caregiverId: req.user.id },
    })
    if (!patient) return next(createError('Paciente no encontrado', 404))

    const { type } = req.params
    if (!Object.values(ActivityType).includes(type as ActivityType)) {
      return next(createError('Tipo de actividad inválido', 400))
    }

    const { difficulty, enabled, extraConfig } = req.body

    if (difficulty && !Object.values(Difficulty).includes(difficulty as Difficulty)) {
      return next(createError('difficulty inválido', 400))
    }

    const setting = await prisma.activitySetting.upsert({
      where: {
        patientId_activityType: {
          patientId: req.params.id,
          activityType: type as ActivityType,
        },
      },
      update: {
        ...(difficulty !== undefined && { difficulty: difficulty as Difficulty }),
        ...(enabled !== undefined && { enabled }),
        ...(extraConfig !== undefined && { extraConfig }),
      },
      create: {
        patientId: req.params.id,
        activityType: type as ActivityType,
        difficulty: (difficulty as Difficulty) ?? Difficulty.EASY,
        enabled: enabled ?? true,
        extraConfig: extraConfig ?? undefined,
      },
    })

    res.json({ setting })
  } catch (err) {
    next(err)
  }
}

export async function getActivityContent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const { type } = req.params
    const { patientId, difficulty } = req.query

    if (!patientId || typeof patientId !== 'string') {
      return next(createError('patientId es requerido', 400))
    }

    const diff = (difficulty as Difficulty) ?? Difficulty.EASY
    if (!Object.values(Difficulty).includes(diff)) {
      return next(createError('difficulty inválido', 400))
    }

    if (!Object.values(ActivityType).includes(type as ActivityType)) {
      return next(createError('Tipo de actividad inválido', 400))
    }

    let content: unknown = null

    switch (type as ActivityType) {
      case ActivityType.WHO_IS_THIS:
        content = await generateWhoIsThisContent(patientId, diff)
        break
      case ActivityType.WHAT_DAY_IS_IT:
        content = await generateWhatDayIsItContent(diff)
        break
      case ActivityType.MEMORY_CARDS:
        content = await generateMemoryCardsContent(patientId, diff)
        break
      case ActivityType.FIND_OBJECT:
        content = await generateFindObjectContent(diff)
        break
      case ActivityType.SERIES_PATTERNS:
        content = await generateSeriesPatternsContent(diff)
        break
      case ActivityType.WORD_SEARCH:
        content = await generateWordSearchContent(diff)
        break
      case ActivityType.ORDER_STORY:
        content = await generateOrderStoryContent(diff)
        break
      case ActivityType.COMPLETE_SONG:
        content = await generateCompleteSongContent(patientId)
        break
      default:
        content = { message: 'Actividad sin generador de contenido dinámico' }
    }

    if (content === null) {
      return next(createError('No hay contenido disponible para esta actividad', 404))
    }

    res.json({ content })
  } catch (err) {
    next(err)
  }
}
