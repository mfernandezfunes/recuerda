import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { uploadMedia as uploadMediaMiddleware } from '../middleware/upload'
import {
  uploadMedia,
  listMedia,
  deleteMedia,
} from '../controllers/media.controller'

const router = Router()

router.use(authenticate)

router.post('/upload', uploadMediaMiddleware.single('file'), uploadMedia)
router.get('/', listMedia)
router.delete('/:id', deleteMedia)

export default router
