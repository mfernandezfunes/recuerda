-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'AUDIO');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('MEMORY_CARDS', 'WHAT_DAY_IS_IT', 'WHO_IS_THIS', 'COMPLETE_SONG', 'ORDER_STORY', 'FIND_OBJECT', 'SIMPLE_PUZZLE', 'COLORING', 'WORD_SEARCH', 'MEMORY_GALLERY', 'DAY_AGENDA', 'BREATHING', 'SERIES_PATTERNS', 'MOOD_CHECKIN');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "MoodType" AS ENUM ('VERY_HAPPY', 'HAPPY', 'NEUTRAL', 'SAD', 'ANXIOUS', 'TIRED');

-- CreateTable
CREATE TABLE "caregivers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caregivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "photoUrl" TEXT,
    "caregiverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_members" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_files" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "usedInActivity" "ActivityType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSecs" INTEGER,
    "totalStars" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationSecs" INTEGER,
    "starsEarned" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_settings" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'EASY',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "extraConfig" JSONB,

    CONSTRAINT "activity_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda_items" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "time" TEXT,
    "iconUrl" TEXT,
    "visitorName" TEXT,
    "visitorPhoto" TEXT,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringDays" INTEGER[],

    CONSTRAINT "agenda_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "times" TEXT[],
    "days" INTEGER[],
    "color" TEXT NOT NULL DEFAULT '#FF9999',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mood_entries" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "sessionId" TEXT,
    "mood" "MoodType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mood_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_achievements" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seen" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "patient_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "caregivers_email_key" ON "caregivers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "activity_settings_patientId_activityType_key" ON "activity_settings"("patientId", "activityType");

-- CreateIndex
CREATE UNIQUE INDEX "mood_entries_sessionId_key" ON "mood_entries"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_key_key" ON "achievements"("key");

-- CreateIndex
CREATE UNIQUE INDEX "patient_achievements_patientId_achievementId_key" ON "patient_achievements"("patientId", "achievementId");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "caregivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_settings" ADD CONSTRAINT "activity_settings_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_achievements" ADD CONSTRAINT "patient_achievements_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_achievements" ADD CONSTRAINT "patient_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
