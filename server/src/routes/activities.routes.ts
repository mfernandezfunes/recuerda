import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { getActivityContent } from '../controllers/activities.controller'

const router = Router()

router.use(authenticate)

// GET /api/activities/:type/content?patientId=xxx&difficulty=EASY
router.get('/:type/content', getActivityContent)

export default router
