-- --------------------------------------------------------
-- Host:                         localhost
-- Server version:               8.0.43 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.12.0.7122
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for budget_disburse
CREATE DATABASE IF NOT EXISTS `budget_disburse` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `budget_disburse`;

-- Dumping structure for table budget_disburse.budget
CREATE TABLE IF NOT EXISTS `budget` (
  `id` int NOT NULL AUTO_INCREMENT,
  `officeId` int NOT NULL,
  `officeName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ps` double NOT NULL,
  `mooe` double NOT NULL,
  `co` double NOT NULL,
  `total` double NOT NULL,
  `dateCreated` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Budget_officeId_fkey` (`officeId`),
  CONSTRAINT `Budget_officeId_fkey` FOREIGN KEY (`officeId`) REFERENCES `office` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table budget_disburse.budget: ~1 rows (approximately)
INSERT INTO `budget` (`id`, `officeId`, `officeName`, `ps`, `mooe`, `co`, `total`, `dateCreated`, `updatedAt`) VALUES
	(22, 3, 'Municipal Accounting Office', 100000, 100000, 100000, 300000, '2025-11-06 20:34:49.668', '2025-11-06 20:34:49.668');

-- Dumping structure for table budget_disburse.disbursement
CREATE TABLE IF NOT EXISTS `disbursement` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dvNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payee` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `officeId` int NOT NULL,
  `officeName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expenseType` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expenseCategory` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` double NOT NULL,
  `dateCreated` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Disbursement_officeId_fkey` (`officeId`),
  CONSTRAINT `Disbursement_officeId_fkey` FOREIGN KEY (`officeId`) REFERENCES `office` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table budget_disburse.disbursement: ~1 rows (approximately)
INSERT INTO `disbursement` (`id`, `dvNo`, `payee`, `officeId`, `officeName`, `expenseType`, `expenseCategory`, `amount`, `dateCreated`, `updatedAt`) VALUES
	(17, 'DV-001', 'Billie Crush', 3, 'Municipal Accounting Office', 'Electricity', 'MOOE', 100000, '2025-11-06 22:25:42.791', '2025-11-06 22:27:33.841');

-- Dumping structure for table budget_disburse.expense
CREATE TABLE IF NOT EXISTS `expense` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dateCreated` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table budget_disburse.expense: ~11 rows (approximately)
INSERT INTO `expense` (`id`, `type`, `category`, `dateCreated`, `updatedAt`) VALUES
	(1, 'Supplies and Materials', 'MOOE', '2025-10-28 22:22:09.000', '2025-10-28 22:22:09.000'),
	(2, 'Repair and Maintenance', 'MOOE', '2025-10-28 22:22:09.000', '2025-10-28 22:22:09.000'),
	(3, 'Capital Outlay', 'CO', '2025-10-28 22:22:09.000', '2025-10-28 22:22:09.000'),
	(4, 'Personnel Services', 'PS', '2025-10-28 22:22:09.000', '2025-10-28 22:22:09.000'),
	(5, 'Electricity', 'MOOE', '2025-10-28 22:22:09.000', '2025-10-28 22:22:09.000'),
	(6, 'Water', 'MOOE', '2025-10-28 22:22:09.000', '2025-10-28 22:22:09.000'),
	(7, 'Training Expense', 'MOOE', '2025-10-28 22:22:09.000', '2025-10-28 22:22:09.000'),
	(8, 'Medical Supplies & Drugs', 'MOOE', '2025-10-28 22:22:09.000', '2025-10-29 14:30:22.520'),
	(12, 'Cash Assistance', 'CO', '2025-10-29 14:35:51.020', '2025-10-29 14:35:51.020'),
	(17, 'Payout', 'PS', '2025-11-06 19:43:14.546', '2025-11-06 19:43:14.546'),
	(18, 'Bill', 'PS', '2025-11-06 19:43:26.958', '2025-11-06 19:43:26.958');

-- Dumping structure for table budget_disburse.office
CREATE TABLE IF NOT EXISTS `office` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dateCreated` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Office_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table budget_disburse.office: ~12 rows (approximately)
INSERT INTO `office` (`id`, `name`, `dateCreated`) VALUES
	(1, 'Office of the Mayor', '2025-10-28 22:22:09.000'),
	(2, 'Office of the Vice Mayor', '2025-10-28 22:22:09.000'),
	(3, 'Municipal Accounting Office', '2025-10-28 22:22:09.000'),
	(4, 'Municipal Budget Office', '2025-10-28 22:22:09.000'),
	(5, 'Municipal Treasurer\'s Office', '2025-10-28 22:22:09.000'),
	(6, 'Municipal Planning Office', '2025-10-28 22:22:09.000'),
	(7, 'Human Resource Office', '2025-10-28 22:22:09.000'),
	(8, 'Engineering Office', '2025-10-28 22:22:09.000'),
	(9, 'Health Office', '2025-10-28 22:22:09.000'),
	(10, 'Social Welfare Office', '2025-10-28 22:22:09.000'),
	(17, 'Office of the Nigga', '2025-11-06 17:56:24.169'),
	(18, 'NDRMMC Office', '2025-11-06 19:47:21.462');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
