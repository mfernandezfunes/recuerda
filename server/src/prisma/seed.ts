import 'dotenv/config'
import { PrismaClient, ActivityType, Difficulty } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Cuidador de prueba
  const caregiver = await prisma.caregiver.upsert({
    where: { email: 'cuidador@recuerda.app' },
    update: {},
    create: {
      email: 'cuidador@recuerda.app',
      passwordHash: await bcrypt.hash('recuerda123', 10),
      name: 'Ana García',
      phone: '+54 11 1234-5678',
    },
  })
  console.log(`✅ Cuidador: ${caregiver.email}`)

  // Paciente de prueba
  const patient = await prisma.patient.upsert({
    where: { id: 'patient-maria-001' },
    update: {},
    create: {
      id: 'patient-maria-001',
      name: 'María',
      pin: await bcrypt.hash('1234', 10),
      birthDate: new Date('1945-03-15'),
      caregiverId: caregiver.id,
    },
  })
  console.log(`✅ Paciente: ${patient.name}`)

  // Familiares de prueba
  const familyData = [
    { name: 'Ana', relation: 'hija', photoUrl: 'https://i.pravatar.cc/150?img=47' },
    { name: 'Carlos', relation: 'hijo', photoUrl: 'https://i.pravatar.cc/150?img=52' },
    { name: 'Sofía', relation: 'nieta', photoUrl: 'https://i.pravatar.cc/150?img=25' },
    { name: 'Luis', relation: 'esposo', photoUrl: 'https://i.pravatar.cc/150?img=68' },
  ]

  for (const fm of familyData) {
    await prisma.familyMember.upsert({
      where: { id: `fm-${fm.name.toLowerCase()}-001` },
      update: {},
      create: {
        id: `fm-${fm.name.toLowerCase()}-001`,
        patientId: patient.id,
        ...fm,
      },
    })
  }
  console.log(`✅ ${familyData.length} familiares creados`)

  // Configuración por defecto de todas las actividades
  const activityTypes = Object.values(ActivityType)
  for (const activityType of activityTypes) {
    await prisma.activitySetting.upsert({
      where: { patientId_activityType: { patientId: patient.id, activityType } },
      update: {},
      create: {
        patientId: patient.id,
        activityType,
        difficulty: Difficulty.EASY,
        enabled: true,
      },
    })
  }
  console.log(`✅ ${activityTypes.length} configuraciones de actividades creadas`)

  // Medicación de ejemplo
  await prisma.medication.upsert({
    where: { id: 'med-001' },
    update: {},
    create: {
      id: 'med-001',
      patientId: patient.id,
      name: 'Donepezilo',
      dosage: '5mg',
      times: ['08:00', '20:00'],
      days: [],
      color: '#87CEEB',
      active: true,
    },
  })
  console.log('✅ Medicación de ejemplo creada')

  // Logros disponibles
  const achievements = [
    { key: 'FIRST_ACTIVITY', title: '¡Primera actividad!', description: 'Completaste tu primera actividad', iconUrl: '⭐', category: 'activity' },
    { key: 'STREAK_3', title: '3 días seguidos', description: 'Usaste la app 3 días seguidos', iconUrl: '🔥', category: 'streak' },
    { key: 'STREAK_7', title: '¡Una semana!', description: 'Usaste la app 7 días seguidos', iconUrl: '🏆', category: 'streak' },
    { key: 'ALL_STARS', title: '¡Todas las estrellas!', description: 'Obtuviste 3 estrellas en una actividad', iconUrl: '✨', category: 'activity' },
    { key: 'MEMORY_MASTER', title: 'Memoria de elefante', description: 'Completaste Memoria Visual 5 veces', iconUrl: '🐘', category: 'activity' },
    { key: 'SOCIAL', title: 'Cara conocida', description: 'Reconociste a todos tus familiares', iconUrl: '❤️', category: 'social' },
  ]

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { key: ach.key },
      update: {},
      create: ach,
    })
  }
  console.log(`✅ ${achievements.length} logros creados`)

  console.log('\n🎉 Seed completado!')
  console.log('─────────────────────────────────')
  console.log('Cuidador:  cuidador@recuerda.app / recuerda123')
  console.log('Paciente:  María / PIN: 1234')
  console.log('─────────────────────────────────')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
