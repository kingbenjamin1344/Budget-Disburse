-- Drop officeName columns to match Prisma schema
-- These columns are no longer needed since we use office.name through relations

ALTER TABLE `budget` DROP COLUMN IF EXISTS `officeName`;
ALTER TABLE `disbursement` DROP COLUMN IF EXISTS `officeName`;
