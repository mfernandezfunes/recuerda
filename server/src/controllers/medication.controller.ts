import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { createError } from '../middleware/errorHandler'

async function verifyPatientAccess(caregiverId: string, patientId: string) {
  return prisma.patient.findFirst({ where: { id: patientId, caregiverId } })
}

export async function listMedications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patient = await verifyPatientAccess(req.user.id, req.params.id)
    if (!patient) return next(createError('Paciente no encontrado', 404))

    const medications = await prisma.medication.findMany({
      where: { patientId: req.params.id },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ medications })
  } catch (err) {
    next(err)
  }
}

export async function createMedication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patient = await verifyPatientAccess(req.user.id, req.params.id)
    if (!patient) return next(createError('Paciente no encontrado', 404))

    const { name, dosage, times, days, color } = req.body

    if (!name || !dosage || !times) {
      return next(createError('name, dosage y times son requeridos', 400))
    }

    if (!Array.isArray(times)) {
      return next(createError('times debe ser un array', 400))
    }

    const medication = await prisma.medication.create({
      data: {
        patientId: req.params.id,
        name,
        dosage,
        times,
        days: days ?? [],
        color: color ?? '#FF9999',
      },
    })

    res.status(201).json({ medication })
  } catch (err) {
    next(err)
  }
}

export async function updateMedication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patient = await verifyPatientAccess(req.user.id, req.params.id)
    if (!patient) return next(createError('Paciente no encontrado', 404))

    const existing = await prisma.medication.findFirst({
      where: { id: req.params.medId, patientId: req.params.id },
    })
    if (!existing) return next(createError('Medicamento no encontrado', 404))

    const { name, dosage, times, days, color, active } = req.body

    const medication = await prisma.medication.update({
      where: { id: req.params.medId },
      data: {
        ...(name !== undefined && { name }),
        ...(dosage !== undefined && { dosage }),
        ...(times !== undefined && { times }),
        ...(days !== undefined && { days }),
        ...(color !== undefined && { color }),
        ...(active !== undefined && { active }),
      },
    })

    res.json({ medication })
  } catch (err) {
    next(err)
  }
}

export async function deleteMedication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const patient = await verifyPatientAccess(req.user.id, req.params.id)
    if (!patient) return next(createError('Paciente no encontrado', 404))

    const existing = await prisma.medication.findFirst({
      where: { id: req.params.medId, patientId: req.params.id },
    })
    if (!existing) return next(createError('Medicamento no encontrado', 404))

    await prisma.medication.delete({ where: { id: req.params.medId } })

    res.json({ message: 'Medicamento eliminado' })
  } catch (err) {
    next(err)
  }
}
