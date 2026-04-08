import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import {
  createSession,
  logActivity,
  endSession,
  getSession,
} from '../controllers/sessions.controller'

const router = Router()

router.use(authenticate)

router.post('/', createSession)
router.post('/:id/activity-log', logActivity)
router.put('/:id/end', endSession)
router.get('/:id', getSession)

export default router
