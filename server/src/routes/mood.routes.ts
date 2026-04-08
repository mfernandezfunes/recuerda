import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { createMoodEntry } from '../controllers/mood.controller'

const router = Router()

router.use(authenticate)

// POST /api/mood  — can be called by patient or caregiver
router.post('/', createMoodEntry)

export default router
