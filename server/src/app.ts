import express from 'express'
import cors from 'cors'
import path from 'path'
import routes from './routes'
import { errorHandler } from './middleware/errorHandler'

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Servir archivos subidos
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// API routes
app.use('/api', routes)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Recuerda API' })
})

app.use(errorHandler)

export default app
