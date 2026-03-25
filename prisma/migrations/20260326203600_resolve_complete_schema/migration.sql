-- This migration resolves the failed `20260326_complete_schema` migration.
-- That migration was partially applied and interrupted, leaving Prisma in a
-- failed state (P3009). The SQL below completes the intended schema changes:
-- creating the `budget`, `disbursement`, `expense`, and `log` tables, and
-- adding the unique index and foreign key constraints that the original
-- migration was attempting to apply.

-- CreateTable (if not already created by the partial run)
CREATE TABLE IF NOT EXISTS `budget` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `officeId` INTEGER NOT NULL,
    `officeName` VARCHAR(191) NOT NULL,
    `ps` DOUBLE NOT NULL,
    `mooe` DOUBLE NOT NULL,
    `co` DOUBLE NOT NULL,
    `total` DOUBLE NOT NULL,
    `dateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Budget_officeId_fkey`(`officeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
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
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Disbursement_officeId_fkey`(`officeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `expense` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `dateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
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

-- AddUniqueIndex on office (if not already present)
ALTER TABLE `office` ADD UNIQUE INDEX IF NOT EXISTS `Office_name_key` (`name`);

-- AddForeignKey (if not already present)
ALTER TABLE `budget` ADD CONSTRAINT `Budget_officeId_fkey`
    FOREIGN KEY (`officeId`) REFERENCES `office`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey (if not already present)
ALTER TABLE `disbursement` ADD CONSTRAINT `Disbursement_officeId_fkey`
    FOREIGN KEY (`officeId`) REFERENCES `office`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
