import { Router } from 'express'
import authRoutes from './auth.routes'
import patientsRouter from './patients.routes'
import sessionsRouter from './sessions.routes'
import activitiesRouter from './activities.routes'
import mediaRouter from './media.routes'
import moodRouter from './mood.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/patients', patientsRouter)
router.use('/sessions', sessionsRouter)
router.use('/activities', activitiesRouter)
router.use('/media', mediaRouter)
router.use('/mood', moodRouter)

export default router
