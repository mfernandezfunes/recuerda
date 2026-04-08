import { Router } from 'express'
import { authenticate, authorizeCaregiver } from '../middleware/authenticate'
import {
  listPatients,
  createPatient,
  getPatient,
  updatePatient,
  deletePatient,
  listFamilyMembers,
  createFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
} from '../controllers/patients.controller'
import {
  listActivitySettings,
  updateActivitySetting,
} from '../controllers/activities.controller'
import {
  listAgendaItems,
  createAgendaItem,
  updateAgendaItem,
  deleteAgendaItem,
} from '../controllers/agenda.controller'
import {
  listMedications,
  createMedication,
  updateMedication,
  deleteMedication,
} from '../controllers/medication.controller'
import {
  getProgress,
  getWeeklyProgress,
  getAlerts,
} from '../controllers/progress.controller'
import { getMoodEntries } from '../controllers/mood.controller'
import { prisma } from '../config/database'

const router = Router()

// GET /api/patients/:id/achievements — accessible by caregiver or patient
router.get('/:id/achievements', authenticate, async (req, res, next) => {
  try {
    const achievements = await prisma.patientAchievement.findMany({
      where: { patientId: req.params.id },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
    })
    res.json(
      achievements.map((pa) => ({
        id: pa.id,
        title: pa.achievement.title,
        iconUrl: pa.achievement.iconUrl,
        description: pa.achievement.description,
        seen: pa.seen,
        unlockedAt: pa.unlockedAt,
      }))
    )
  } catch (e) {
    next(e)
  }
})

// All remaining patient routes require caregiver auth
router.use(authenticate, authorizeCaregiver)

// CRUD patients
router.get('/', listPatients)
router.post('/', createPatient)
router.get('/:id', getPatient)
router.put('/:id', updatePatient)
router.delete('/:id', deletePatient)

// Family members (nested)
router.get('/:id/family-members', listFamilyMembers)
router.post('/:id/family-members', createFamilyMember)
router.put('/:id/family-members/:fmId', updateFamilyMember)
router.delete('/:id/family-members/:fmId', deleteFamilyMember)

// Activity settings (nested)
router.get('/:id/activity-settings', listActivitySettings)
router.put('/:id/activity-settings/:type', updateActivitySetting)

// Agenda (nested)
router.get('/:id/agenda', listAgendaItems)
router.post('/:id/agenda', createAgendaItem)
router.put('/:id/agenda/:itemId', updateAgendaItem)
router.delete('/:id/agenda/:itemId', deleteAgendaItem)

// Medications (nested)
router.get('/:id/medications', listMedications)
router.post('/:id/medications', createMedication)
router.put('/:id/medications/:medId', updateMedication)
router.delete('/:id/medications/:medId', deleteMedication)

// Progress (nested)
router.get('/:id/progress', getProgress)
router.get('/:id/progress/weekly', getWeeklyProgress)
router.get('/:id/alerts', getAlerts)

// Mood (nested, caregiver reads)
router.get('/:id/mood', getMoodEntries)

export default router
