import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/database'
import { jwtConfig } from '../config/jwt.config'
import { createError } from '../middleware/errorHandler'

export async function caregiverLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return next(createError('Email y contraseña requeridos', 400))
    }

    const caregiver = await prisma.caregiver.findUnique({ where: { email } })
    if (!caregiver) {
      return next(createError('Credenciales inválidas', 401))
    }

    const valid = await bcrypt.compare(password, caregiver.passwordHash)
    if (!valid) {
      return next(createError('Credenciales inválidas', 401))
    }

    const token = jwt.sign(
      { id: caregiver.id, role: 'caregiver' },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn } as jwt.SignOptions
    )

    res.json({
      token,
      caregiver: {
        id: caregiver.id,
        name: caregiver.name,
        email: caregiver.email,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function patientPinLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { patientId, pin } = req.body

    if (!patientId || !pin) {
      return next(createError('ID de paciente y PIN requeridos', 400))
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        caregiver: { select: { id: true, name: true } },
      },
    })

    if (!patient) {
      return next(createError('Paciente no encontrado', 404))
    }

    const valid = await bcrypt.compare(pin, patient.pin)
    if (!valid) {
      return next(createError('PIN incorrecto', 401))
    }

    const token = jwt.sign(
      { id: patient.id, role: 'patient', caregiverId: patient.caregiverId },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn } as jwt.SignOptions
    )

    res.json({
      token,
      patient: {
        id: patient.id,
        name: patient.name,
        photoUrl: patient.photoUrl,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function updateCaregiverProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const { name, currentPassword, newPassword } = req.body

    const caregiver = await prisma.caregiver.findUnique({ where: { id: req.user.id } })
    if (!caregiver) return next(createError('Cuidador no encontrado', 404))

    const updateData: { name?: string; passwordHash?: string } = {}

    if (name?.trim()) updateData.name = name.trim()

    if (currentPassword && newPassword) {
      const valid = await bcrypt.compare(currentPassword, caregiver.passwordHash)
      if (!valid) return next(createError('Contraseña actual incorrecta', 400))
      updateData.passwordHash = await bcrypt.hash(newPassword, 10)
    }

    const updated = await prisma.caregiver.update({
      where: { id: req.user.id },
      data: updateData,
    })

    res.json({ caregiver: { id: updated.id, name: updated.name, email: updated.email } })
  } catch (err) {
    next(err)
  }
}

export async function listPatientsForLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { caregiverEmail } = req.query

    if (!caregiverEmail || typeof caregiverEmail !== 'string') {
      return next(createError('Email del cuidador requerido', 400))
    }

    const caregiver = await prisma.caregiver.findUnique({
      where: { email: caregiverEmail },
      include: {
        patients: {
          select: { id: true, name: true, photoUrl: true },
        },
      },
    })

    if (!caregiver) {
      return next(createError('Cuidador no encontrado', 404))
    }

    res.json({ patients: caregiver.patients })
  } catch (err) {
    next(err)
  }
}
