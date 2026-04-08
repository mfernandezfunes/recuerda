import multer from 'multer'
import path from 'path'
import { ensureUploadDir } from '../config/storage'
import { createError } from './errorHandler'

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = ensureUploadDir('tmp')
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}${path.extname(file.originalname)}`)
  },
})

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']

export const uploadMedia = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if ([...ALLOWED_IMAGE_TYPES, ...ALLOWED_AUDIO_TYPES].includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(createError('Tipo de archivo no permitido', 400) as unknown as null, false)
    }
  },
})
