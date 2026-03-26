-- Complete database setup with guaranteed seeding
-- Disable foreign key checks during setup
SET FOREIGN_KEY_CHECKS=0;

-- ============ CREATE OFFICE TABLE FIRST ============
DROP TABLE IF EXISTS `budget`;
DROP TABLE IF EXISTS `disbursement`;
DROP TABLE IF EXISTS `office`;
DROP TABLE IF EXISTS `expense`;
DROP TABLE IF EXISTS `log`;

CREATE TABLE `office` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL UNIQUE,
    `dateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============ SEED OFFICES IMMEDIATELY ============
INSERT INTO `office` (`name`, `dateCreated`) VALUES 
    ('Administrative Office', CURRENT_TIMESTAMP(3)),
    ('Finance Department', CURRENT_TIMESTAMP(3)),
    ('Human Resources', CURRENT_TIMESTAMP(3));

-- ============ CREATE BUDGET TABLE ============
CREATE TABLE `budget` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `officeId` INT NOT NULL,
    `officeName` VARCHAR(191) NOT NULL,
    `ps` DOUBLE NOT NULL,
    `mooe` DOUBLE NOT NULL,
    `co` DOUBLE NOT NULL,
    `total` DOUBLE NOT NULL,
    `dateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `Budget_officeId_fkey`(`officeId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `Budget_officeId_fkey` FOREIGN KEY (`officeId`) REFERENCES `office` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============ CREATE DISBURSEMENT TABLE ============
CREATE TABLE `disbursement` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `dvNo` VARCHAR(191) NOT NULL,
    `payee` VARCHAR(191) NOT NULL,
    `officeId` INT NOT NULL,
    `officeName` VARCHAR(191) NOT NULL,
    `expenseType` VARCHAR(191) NOT NULL,
    `expenseCategory` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `dateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `Disbursement_officeId_fkey`(`officeId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `Disbursement_officeId_fkey` FOREIGN KEY (`officeId`) REFERENCES `office` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============ CREATE EXPENSE TABLE ============
CREATE TABLE `expense` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `dateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============ SEED EXPENSES ============
INSERT INTO `expense` (`type`, `category`, `dateCreated`, `updatedAt`) VALUES
    ('Operational', 'Software', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('Personnel', 'Salary', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('Infrastructure', 'Maintenance', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- ============ CREATE LOG TABLE ============
CREATE TABLE `log` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `message` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `performedBy` VARCHAR(191),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `log_type_createdAt_idx`(`type`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;
