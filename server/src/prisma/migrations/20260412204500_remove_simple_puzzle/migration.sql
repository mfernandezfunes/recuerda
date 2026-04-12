-- Remove SIMPLE_PUZZLE from ActivityType enum
-- First, delete any existing activity settings with SIMPLE_PUZZLE
DELETE FROM activity_settings WHERE "activityType" = 'SIMPLE_PUZZLE';

-- Delete any activity logs with SIMPLE_PUZZLE
DELETE FROM activity_logs WHERE "activityType" = 'SIMPLE_PUZZLE';

-- Remove the value from the enum
ALTER TYPE "ActivityType" RENAME TO "ActivityType_old";
CREATE TYPE "ActivityType" AS ENUM ('MEMORY_CARDS', 'WHAT_DAY_IS_IT', 'WHO_IS_THIS', 'COMPLETE_SONG', 'ORDER_STORY', 'FIND_OBJECT', 'COLORING', 'WORD_SEARCH', 'MEMORY_GALLERY', 'DAY_AGENDA', 'BREATHING', 'SERIES_PATTERNS', 'MOOD_CHECKIN', 'WHAT_IS_MISSING', 'PROVERBS', 'ODD_ONE_OUT', 'SIMPLE_MATH', 'SUDOKU', 'COLOR_MATCH', 'WHAT_IS_THIS_OBJECT', 'WORD_BUILDER', 'MATH_GRID');
ALTER TABLE "activity_settings" ALTER COLUMN "activityType" TYPE "ActivityType" USING ("activityType"::text::"ActivityType");
ALTER TABLE "activity_logs" ALTER COLUMN "activityType" TYPE "ActivityType" USING ("activityType"::text::"ActivityType");
ALTER TABLE "media_files" ALTER COLUMN "usedInActivity" TYPE "ActivityType" USING ("usedInActivity"::text::"ActivityType");
DROP TYPE "ActivityType_old";
