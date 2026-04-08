import { Request, Response, NextFunction } from 'express'
import path from 'path'
import fs from 'fs'
import { ActivityType, MediaType } from '@prisma/client'
import { prisma } from '../config/database'
import { createError } from '../middleware/errorHandler'
import { ensureUploadDir, getPublicUrl, UPLOADS_DIR } from '../config/storage'

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function detectMediaType(mimetype: string): MediaType {
  if (ALLOWED_IMAGE_MIMES.includes(mimetype)) return MediaType.IMAGE
  return MediaType.AUDIO
}

export async function uploadMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))
    if (!req.file) return next(createError('Archivo requerido', 400))

    const { patientId, label, usedInActivity } = req.body
    if (!patientId) return next(createError('patientId es requerido', 400))

    // Verify access
    const patient = await prisma.patient.findUnique({ where: { id: patientId } })
    if (!patient) return next(createError('Paciente no encontrado', 404))

    if (req.user.role === 'caregiver' && patient.caregiverId !== req.user.id) {
      return next(createError('Acceso denegado', 403))
    }

    const mediaType = detectMediaType(req.file.mimetype)
    const subFolder = mediaType === MediaType.IMAGE ? 'images' : 'audio'

    // Move from tmp to patient folder
    const destDir = ensureUploadDir(`${patientId}/${subFolder}`)
    const destPath = path.join(destDir, req.file.filename)
    fs.renameSync(req.file.path, destPath)

    const relativePath = `${patientId}/${subFolder}/${req.file.filename}`
    const url = getPublicUrl(relativePath)

    const mediaFile = await prisma.mediaFile.create({
      data: {
        patientId,
        type: mediaType,
        url,
        label: label || null,
        usedInActivity:
          usedInActivity && Object.values(ActivityType).includes(usedInActivity as ActivityType)
            ? (usedInActivity as ActivityType)
            : null,
      },
    })

    res.status(201).json({
      id: mediaFile.id,
      url: mediaFile.url,
      type: mediaFile.type,
      label: mediaFile.label,
    })
  } catch (err) {
    next(err)
  }
}

export async function listMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const { patientId } = req.query
    if (!patientId || typeof patientId !== 'string') {
      return next(createError('patientId es requerido', 400))
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } })
    if (!patient) return next(createError('Paciente no encontrado', 404))

    if (req.user.role === 'caregiver' && patient.caregiverId !== req.user.id) {
      return next(createError('Acceso denegado', 403))
    }

    const mediaFiles = await prisma.mediaFile.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    })

    res.json(mediaFiles)
  } catch (err) {
    next(err)
  }
}

export async function deleteMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado', 401))

    const mediaFile = await prisma.mediaFile.findUnique({ where: { id: req.params.id } })
    if (!mediaFile) return next(createError('Archivo no encontrado', 404))

    const patient = await prisma.patient.findUnique({ where: { id: mediaFile.patientId } })
    if (!patient) return next(createError('Paciente no encontrado', 404))

    if (req.user.role === 'caregiver' && patient.caregiverId !== req.user.id) {
      return next(createError('Acceso denegado', 403))
    }

    // Delete physical file
    try {
      // Extract relative path from URL
      const baseUrl = mediaFile.url
      const uploadsIdx = baseUrl.indexOf('/uploads/')
      if (uploadsIdx !== -1) {
        const relativePath = baseUrl.substring(uploadsIdx + '/uploads/'.length)
        const filePath = path.join(UPLOADS_DIR, relativePath)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      }
    } catch {
      // Non-fatal: file might already be gone
    }

    await prisma.mediaFile.delete({ where: { id: req.params.id } })

    res.json({ message: 'Archivo eliminado' })
  } catch (err) {
    next(err)
  }
}
