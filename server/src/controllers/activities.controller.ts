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
  generateWhatIsMissingContent,
  generateProverbsContent,
  generateOddOneOutContent,
  generateSimpleMathContent,
  generateSimplePuzzleContent,
  generateSudokuContent,
  generateColorMatchContent,
  generateWhatIsThisObjectContent,
} from '../services/activityContent.service'

export async function listActivitySettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, caregiverId: req.user.id },
    })
    if (!patient) return next(createError('Paciente no encontrado', 404))

    const existing = await prisma.activitySetting.findMany({
      where: { patientId: req.params.id },
      orderBy: { order: 'asc' },
    })

    // Auto-create settings for any new activity types added after patient creation
    const existingTypes = new Set(existing.map((s) => s.activityType))
    const maxOrder = existing.reduce((m, s) => Math.max(m, s.order), existing.length - 1)
    const missing = Object.values(ActivityType)
      .filter((t) => !existingTypes.has(t))
      .map((t, i) => ({ activityType: t, difficulty: Difficulty.EASY, enabled: true, order: maxOrder + i + 1 }))

    if (missing.length > 0) {
      await prisma.activitySetting.createMany({
        data: missing.map((m) => ({ patientId: req.params.id, ...m })),
        skipDuplicates: true,
      })
    }

    res.json([...existing, ...missing])
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

    res.json(setting)
  } catch (err) {
    next(err)
  }
}

export async function reorderActivitySettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, caregiverId: req.user.id },
    })
    if (!patient) return next(createError('Paciente no encontrado', 404))

    const order: { activityType: string; order: number }[] = req.body.order
    if (!Array.isArray(order)) return next(createError('order debe ser un array', 400))

    await Promise.all(
      order.map((item) =>
        prisma.activitySetting.updateMany({
          where: { patientId: req.params.id, activityType: item.activityType as ActivityType },
          data: { order: item.order },
        })
      )
    )

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function getActivityContent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const { type } = req.params
    const { patientId: qPatientId, difficulty } = req.query

    // If not provided as query param, fall back to the authenticated user's own ID
    const patientId = (typeof qPatientId === 'string' && qPatientId) ? qPatientId : req.user!.id

    if (!Object.values(ActivityType).includes(type as ActivityType)) {
      return next(createError('Tipo de actividad inválido', 400))
    }

    // Look up patient's configured difficulty if not explicitly passed
    let diff: Difficulty
    if (typeof difficulty === 'string' && Object.values(Difficulty).includes(difficulty as Difficulty)) {
      diff = difficulty as Difficulty
    } else {
      const setting = await prisma.activitySetting.findUnique({
        where: { patientId_activityType: { patientId, activityType: type as ActivityType } },
      })
      diff = setting?.difficulty ?? Difficulty.EASY
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
      case ActivityType.WHAT_IS_MISSING:
        content = await generateWhatIsMissingContent(diff)
        break
      case ActivityType.PROVERBS:
        content = await generateProverbsContent(diff)
        break
      case ActivityType.ODD_ONE_OUT:
        content = await generateOddOneOutContent(diff)
        break
      case ActivityType.SIMPLE_MATH:
        content = await generateSimpleMathContent(diff)
        break
      case ActivityType.SIMPLE_PUZZLE:
        content = generateSimplePuzzleContent(diff)
        break
      case ActivityType.SUDOKU:
        content = generateSudokuContent(diff)
        break
      case ActivityType.COLOR_MATCH:
        content = generateColorMatchContent(diff)
        break
      case ActivityType.WHAT_IS_THIS_OBJECT:
        content = generateWhatIsThisObjectContent(diff)
        break
      default:
        content = { message: 'Actividad sin generador de contenido dinámico' }
    }

    if (content === null) {
      return next(createError('No hay contenido disponible para esta actividad', 404))
    }

    res.json({ ...content as Record<string, unknown>, difficulty: diff })
  } catch (err) {
    next(err)
  }
}
