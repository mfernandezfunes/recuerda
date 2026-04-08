import { Router } from 'express'
import { caregiverLogin, patientPinLogin, listPatientsForLogin } from '../controllers/auth.controller'

const router = Router()

// POST /api/auth/caregiver/login
router.post('/caregiver/login', caregiverLogin)

// POST /api/auth/patient/pin
router.post('/patient/pin', patientPinLogin)

// GET /api/auth/patients?caregiverEmail=xxx
// Para la pantalla de selección de paciente en el login
router.get('/patients', listPatientsForLogin)

export default router
