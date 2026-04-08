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
  // Store as a root-relative path so the frontend can prepend the correct API base URL.
  // e.g. "/uploads/patientId/images/file.jpg"
  return `/uploads/${relativePath}`
}
