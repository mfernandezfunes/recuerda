import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { jwtConfig } from '../config/jwt.config'
import { createError } from './errorHandler'

export interface JwtPayload {
  id: string
  role: 'caregiver' | 'patient'
  caregiverId?: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return next(createError('Token requerido', 401))
  }

  const token = authHeader.substring(7)
  try {
    const payload = jwt.verify(token, jwtConfig.secret) as JwtPayload
    req.user = payload
    next()
  } catch {
    next(createError('Token inválido o expirado', 401))
  }
}

export function authorizeCaregiver(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'caregiver') {
    return next(createError('Acceso solo para cuidadores', 403))
  }
  next()
}

export function authorizePatient(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'patient') {
    return next(createError('Acceso solo para pacientes', 403))
  }
  next()
}
