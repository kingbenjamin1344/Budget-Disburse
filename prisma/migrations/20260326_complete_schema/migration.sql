-- Migration: 20260326_complete_schema
-- Recreates all tables required by the Prisma schema using IF NOT EXISTS guards
-- so this is safe to run even if some tables already exist.

-- Rename Office -> office if the old uppercase table exists and the lowercase one does not.
-- MySQL on Linux is case-sensitive for table names, so we handle both cases.
-- We drop the old `Office` table only after ensuring `office` exists.

-- Step 1: Create `office` table (matches Prisma schema model)
CREATE TABLE IF NOT EXISTS `office` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `dateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Office_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 2: Create `budget` table
CREATE TABLE IF NOT EXISTS `budget` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `officeId` INTEGER NOT NULL,
    `officeName` VARCHAR(191) NOT NULL,
    `ps` DOUBLE NOT NULL,
    `mooe` DOUBLE NOT NULL,
    `co` DOUBLE NOT NULL,
    `total` DOUBLE NOT NULL,
    `dateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `Budget_officeId_fkey`(`officeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 3: Create `disbursement` table
CREATE TABLE IF NOT EXISTS `disbursement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dvNo` VARCHAR(191) NOT NULL,
    `payee` VARCHAR(191) NOT NULL,
    `officeId` INTEGER NOT NULL,
    `officeName` VARCHAR(191) NOT NULL,
    `expenseType` VARCHAR(191) NOT NULL,
    `expenseCategory` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `dateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `Disbursement_officeId_fkey`(`officeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 4: Create `expense` table
CREATE TABLE IF NOT EXISTS `expense` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `dateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 5: Create `log` table
CREATE TABLE IF NOT EXISTS `log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `message` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `performedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `log_type_createdAt_idx`(`type`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 6: Create `useradmin` table (may already exist from migration 20260312002123)
CREATE TABLE IF NOT EXISTS `useradmin` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `useradmin_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 7: Add foreign key constraints (only if they don't already exist)
-- budget -> office
ALTER TABLE `budget`
    ADD CONSTRAINT `Budget_officeId_fkey`
    FOREIGN KEY (`officeId`) REFERENCES `office`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- disbursement -> office
ALTER TABLE `disbursement`
    ADD CONSTRAINT `Disbursement_officeId_fkey`
    FOREIGN KEY (`officeId`) REFERENCES `office`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
