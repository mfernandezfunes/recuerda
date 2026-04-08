import { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  statusCode?: number
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Error interno del servidor'

  if (process.env.NODE_ENV === 'development') {
    console.error(err)
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

export function createError(message: string, statusCode: number): AppError {
  const err = new Error(message) as AppError
  err.statusCode = statusCode
  return err
}
