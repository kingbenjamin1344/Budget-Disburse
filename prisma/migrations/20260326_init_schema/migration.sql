-- Create all tables from scratch with clean schema

-- ============ OFFICE TABLE (no dependencies) ============
CREATE TABLE IF NOT EXISTS `office` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL UNIQUE,
    `dateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `Office_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ EXPENSE TABLE (no dependencies) ============
CREATE TABLE IF NOT EXISTS `expense` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `dateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ BUDGET TABLE (depends on office) ============
CREATE TABLE IF NOT EXISTS `budget` (
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

-- ============ DISBURSEMENT TABLE (depends on office) ============
CREATE TABLE IF NOT EXISTS `disbursement` (
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

-- ============ LOG TABLE (no dependencies) ============
CREATE TABLE IF NOT EXISTS `log` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `message` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `performedBy` VARCHAR(191),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `log_type_createdAt_idx` (`type`, `createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ USERADMIN TABLE (no dependencies) ============
CREATE TABLE IF NOT EXISTS `useradmin` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL UNIQUE,
    `password` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `useradmin_username_key` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ SEED INITIAL DATA ============
INSERT IGNORE INTO `office` (`name`, `dateCreated`) VALUES 
    ('Administrative Office', CURRENT_TIMESTAMP(3)),
    ('Finance Department', CURRENT_TIMESTAMP(3)),
    ('Human Resources', CURRENT_TIMESTAMP(3)),
    ('Operations', CURRENT_TIMESTAMP(3)),
    ('IT Department', CURRENT_TIMESTAMP(3));

INSERT IGNORE INTO `expense` (`type`, `category`, `dateCreated`, `updatedAt`) VALUES
    ('Personnel', 'PS', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('Maintenance', 'MOOE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('Equipment', 'CO', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('Supplies', 'MOOE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('Travel', 'MOOE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
