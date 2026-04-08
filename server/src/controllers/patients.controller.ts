import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { ActivityType, Difficulty } from '@prisma/client'
import { prisma } from '../config/database'
import { createError } from '../middleware/errorHandler'

// ─── Patients ─────────────────────────────────────────────────────────────────

export async function listPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patients = await prisma.patient.findMany({
      where: { caregiverId: req.user.id },
      select: { id: true, name: true, photoUrl: true, birthDate: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })

    res.json(patients)
  } catch (err) {
    next(err)
  }
}

const ALL_ACTIVITY_TYPES = Object.values(ActivityType)

export async function createPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const { name, pin, birthDate } = req.body

    if (!name || !pin || !birthDate) {
      return next(createError('name, pin y birthDate son requeridos', 400))
    }

    const pinHash = await bcrypt.hash(String(pin), 10)

    const patient = await prisma.patient.create({
      data: {
        name,
        pin: pinHash,
        birthDate: new Date(birthDate),
        caregiverId: req.user.id,
        activitySettings: {
          create: ALL_ACTIVITY_TYPES.map((type) => ({
            activityType: type,
            difficulty: Difficulty.EASY,
            enabled: true,
          })),
        },
      },
    })

    res.status(201).json(patient)
  } catch (err) {
    next(err)
  }
}

export async function getPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, caregiverId: req.user.id },
      include: {
        familyMembers: true,
        activitySettings: true,
      },
    })

    if (!patient) return next(createError('Paciente no encontrado', 404))

    res.json(patient)
  } catch (err) {
    next(err)
  }
}

export async function updatePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const existing = await prisma.patient.findFirst({
      where: { id: req.params.id, caregiverId: req.user.id },
    })

    if (!existing) return next(createError('Paciente no encontrado', 404))

    const { name, photoUrl } = req.body
    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(photoUrl !== undefined && { photoUrl }),
      },
    })

    res.json(patient)
  } catch (err) {
    next(err)
  }
}

export async function deletePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const existing = await prisma.patient.findFirst({
      where: { id: req.params.id, caregiverId: req.user.id },
    })

    if (!existing) return next(createError('Paciente no encontrado', 404))

    await prisma.patient.delete({ where: { id: req.params.id } })

    res.json({ message: 'Paciente eliminado' })
  } catch (err) {
    next(err)
  }
}

// ─── Family Members ───────────────────────────────────────────────────────────

export async function listFamilyMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, caregiverId: req.user.id },
    })
    if (!patient) return next(createError('Paciente no encontrado', 404))

    const familyMembers = await prisma.familyMember.findMany({
      where: { patientId: req.params.id },
    })

    res.json(familyMembers)
  } catch (err) {
    next(err)
  }
}

export async function createFamilyMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, caregiverId: req.user.id },
    })
    if (!patient) return next(createError('Paciente no encontrado', 404))

    const { name, relation, photoUrl } = req.body

    if (!name || !relation) {
      return next(createError('name y relation son requeridos', 400))
    }

    const member = await prisma.familyMember.create({
      data: {
        patientId: req.params.id,
        name,
        relation,
        photoUrl: photoUrl || '',
      },
    })

    res.status(201).json(member)
  } catch (err) {
    next(err)
  }
}

export async function updateFamilyMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, caregiverId: req.user.id },
    })
    if (!patient) return next(createError('Paciente no encontrado', 404))

    const existing = await prisma.familyMember.findFirst({
      where: { id: req.params.fmId, patientId: req.params.id },
    })
    if (!existing) return next(createError('Familiar no encontrado', 404))

    const { name, relation, photoUrl } = req.body
    const member = await prisma.familyMember.update({
      where: { id: req.params.fmId },
      data: {
        ...(name !== undefined && { name }),
        ...(relation !== undefined && { relation }),
        ...(photoUrl !== undefined && { photoUrl }),
      },
    })

    res.json(member)
  } catch (err) {
    next(err)
  }
}

export async function deleteFamilyMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, caregiverId: req.user.id },
    })
    if (!patient) return next(createError('Paciente no encontrado', 404))

    const existing = await prisma.familyMember.findFirst({
      where: { id: req.params.fmId, patientId: req.params.id },
    })
    if (!existing) return next(createError('Familiar no encontrado', 404))

    await prisma.familyMember.delete({ where: { id: req.params.fmId } })

    res.json({ message: 'Familiar eliminado' })
  } catch (err) {
    next(err)
  }
}
