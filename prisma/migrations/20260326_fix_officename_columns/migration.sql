-- Fix: Make officeName nullable first, then drop later
-- This handles the NULL constraint violation

ALTER TABLE `budget` MODIFY `officeName` VARCHAR(191) NULL;
ALTER TABLE `disbursement` MODIFY `officeName` VARCHAR(191) NULL;
