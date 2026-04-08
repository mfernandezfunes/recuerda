-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'WHAT_IS_MISSING';
ALTER TYPE "ActivityType" ADD VALUE 'PROVERBS';
ALTER TYPE "ActivityType" ADD VALUE 'ODD_ONE_OUT';
ALTER TYPE "ActivityType" ADD VALUE 'SIMPLE_MATH';
