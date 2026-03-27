-- Reset budget and disbursement tables to fix FK constraint violations
-- Drop in reverse dependency order (children first, then parents)

DROP TABLE IF EXISTS `disbursement`;
DROP TABLE IF EXISTS `budget`;

-- Recreate BUDGET TABLE with explicit FK constraint
CREATE TABLE `budget` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `officeId` INT NOT NULL,
    `ps` DOUBLE NOT NULL,
    `mooe` DOUBLE NOT NULL,
    `co` DOUBLE NOT NULL,
    `total` DOUBLE NOT NULL,
    `dateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `budget_officeId_idx` (`officeId`),
    CONSTRAINT `budget_officeId_fkey` FOREIGN KEY (`officeId`) REFERENCES `office` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recreate DISBURSEMENT TABLE with explicit FK constraint
CREATE TABLE `disbursement` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `dvNo` VARCHAR(191) NOT NULL,
    `payee` VARCHAR(191) NOT NULL,
    `officeId` INT NOT NULL,
    `expenseType` VARCHAR(191) NOT NULL,
    `expenseCategory` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `dateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `disbursement_officeId_idx` (`officeId`),
    CONSTRAINT `disbursement_officeId_fkey` FOREIGN KEY (`officeId`) REFERENCES `office` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
