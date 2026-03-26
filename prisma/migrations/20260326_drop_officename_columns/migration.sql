-- NOTE: This migration failed in production and will be rolled back
-- Use migration 20260326_fix_officename_columns instead
ALTER TABLE `budget` DROP COLUMN IF EXISTS `officeName`;
ALTER TABLE `disbursement` DROP COLUMN IF EXISTS `officeName`;
