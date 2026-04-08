import { Router } from 'express'
import { caregiverLogin, patientPinLogin, listPatientsForLogin, updateCaregiverProfile } from '../controllers/auth.controller'
import { authenticate, authorizeCaregiver } from '../middleware/authenticate'

const router = Router()

// POST /api/auth/caregiver/login
router.post('/caregiver/login', caregiverLogin)

// POST /api/auth/patient/pin
router.post('/patient/pin', patientPinLogin)

// GET /api/auth/patients?caregiverEmail=xxx
router.get('/patients', listPatientsForLogin)

// PUT /api/auth/caregiver/profile
router.put('/caregiver/profile', authenticate, authorizeCaregiver, updateCaregiverProfile)

export default router
