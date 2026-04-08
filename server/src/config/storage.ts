import path from 'path'
import fs from 'fs'

export const UPLOADS_DIR = path.join(process.cwd(), 'uploads')

export function ensureUploadDir(subPath: string): string {
  const dir = path.join(UPLOADS_DIR, subPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

export function getPublicUrl(relativePath: string): string {
  const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`
  return `${baseUrl}/uploads/${relativePath}`
}
