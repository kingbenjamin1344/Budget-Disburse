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
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Budget_officeId_fkey` (`officeId`),
  CONSTRAINT `Budget_officeId_fkey` FOREIGN KEY (`officeId`) REFERENCES `office` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table budget_disburse.budget: ~13 rows (approximately)
INSERT INTO `budget` (`id`, `officeId`, `officeName`, `ps`, `mooe`, `co`, `total`, `dateCreated`, `updatedAt`) VALUES
	(51, 55, 'Office of the Mayor', 300000, 400000, 140500, 840500, '2025-11-17 19:50:46.856', '2025-11-17 19:50:46.856'),
	(52, 56, 'Office of the Vice Mayor', 100000, 100000, 100000, 300000, '2025-11-17 21:01:39.786', '2025-11-17 21:01:39.786'),
	(53, 57, 'Budget Office', 50000, 67000, 12000, 129000, '2025-11-18 18:31:41.895', '2025-11-18 18:31:41.895'),
	(54, 58, 'Office of the Secretary', 1600000, 2300000, 100000, 4000000, '2025-11-18 21:28:07.718', '2025-11-18 21:28:07.718'),
	(55, 59, 'Agriculture Office', 10000, 10000, 10000, 30000, '2025-11-21 21:10:29.002', '2025-11-21 21:10:29.002'),
	(56, 60, 'Fisheries Office', 1444444, 123435, 2334534, 3902413, '2025-11-21 22:48:28.755', '2025-11-21 22:48:28.755'),
	(57, 65, 'Ground Office', 10000545, 23432, 423423, 10447400, '2025-11-24 20:27:18.110', '2025-11-24 20:27:18.110'),
	(58, 64, 'Benjamin Office', 178782, 1232132, 23453, 1434367, '2025-11-24 20:28:27.390', '2025-11-24 20:28:27.390'),
	(59, 62, 'Dark Office', 123213, 213123, 123213131, 123549467, '2025-11-24 20:28:40.384', '2025-11-24 20:28:40.384'),
	(60, 63, 'Puppet Office', 123213, 12313, 31212132, 31347658, '2025-11-24 20:29:22.661', '2025-11-24 20:29:22.661'),
	(61, 61, 'Meme Office', 21312223, 21312, 2131321, 23464856, '2025-11-24 20:31:22.840', '2025-11-24 20:31:22.840'),
	(62, 66, 'Cushion', 0, 0, 1232432, 1232432, '2025-11-25 14:15:46.433', '2025-11-25 14:15:46.433'),
	(63, 67, 'Tourist Office', 100000, 10000, 10000, 120000, '2025-11-25 14:18:45.807', '2025-11-25 14:18:45.807'),
	(64, 68, 'Budget Office Minor', 12999, 44555, 55566, 113120, '2025-11-25 17:46:31.827', '2025-11-25 17:46:31.827'),
	(65, 69, 'Emulator Gcash', 12312432, 4324234, 2342342, 18979008, '2025-11-25 17:57:03.853', '2025-11-25 17:57:03.853');

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
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Disbursement_officeId_fkey` (`officeId`),
  CONSTRAINT `Disbursement_officeId_fkey` FOREIGN KEY (`officeId`) REFERENCES `office` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table budget_disburse.disbursement: ~18 rows (approximately)
INSERT INTO `disbursement` (`id`, `dvNo`, `payee`, `officeId`, `officeName`, `expenseType`, `expenseCategory`, `amount`, `dateCreated`, `updatedAt`) VALUES
	(44, 'DV-001', 'Harlem Shake', 55, 'Office of the Mayor', 'Salary', 'PS', 10000, '2025-11-17 19:51:25.956', '2025-11-17 19:51:25.956'),
	(45, 'DV-002', 'Clint Oliver', 55, 'Office of the Mayor', 'Gas', 'MOOE', 14000, '2025-11-17 19:52:39.774', '2025-11-17 19:52:39.774'),
	(46, 'DV-003', 'Liam Duke', 55, 'Office of the Mayor', 'Investment', 'CO', 19070, '2025-11-17 19:53:04.140', '2025-11-17 19:53:04.140'),
	(47, 'DV-004', 'James Arthur', 55, 'Office of the Mayor', 'Gas', 'MOOE', 100000, '2025-11-17 20:58:28.092', '2025-11-17 20:58:28.092'),
	(48, 'DV-005', 'Jane Mane', 56, 'Office of the Vice Mayor', 'Gas', 'MOOE', 18002, '2025-11-17 21:25:18.272', '2025-11-17 21:25:18.272'),
	(49, 'DV-006', 'Henry ', 56, 'Office of the Vice Mayor', 'Gas', 'MOOE', 10000, '2025-11-17 21:25:52.884', '2025-11-17 21:25:52.884'),
	(50, 'DV-007', 'Lea Slang', 56, 'Office of the Vice Mayor', 'Gas', 'MOOE', 70000, '2025-11-17 21:26:21.471', '2025-11-17 21:26:21.471'),
	(51, 'DV-008', 'Gerald', 56, 'Office of the Vice Mayor', 'Gas', 'MOOE', 1997, '2025-11-17 21:27:56.028', '2025-11-17 21:27:56.028'),
	(53, 'DV-009', 'Ferdinand Magellan', 56, 'Office of the Vice Mayor', 'Salary', 'PS', 5000, '2025-11-17 21:30:34.393', '2025-11-17 21:30:34.393'),
	(54, 'DV-010', 'Paulo', 56, 'Office of the Vice Mayor', 'Salary', 'PS', 1500, '2025-11-17 21:32:58.841', '2025-11-17 21:32:58.841'),
	(55, 'DV-011', 'Derick', 56, 'Office of the Vice Mayor', 'Salary', 'PS', 3500, '2025-11-17 21:33:33.366', '2025-11-17 21:33:33.366'),
	(56, 'DV-012', 'Claire', 55, 'Office of the Mayor', 'Investment', 'CO', 21430, '2025-11-17 21:35:47.746', '2025-11-17 21:35:47.746'),
	(57, 'DV-013', 'Shawn', 58, 'Office of the Secretary', 'Gas', 'MOOE', 1300000, '2025-11-18 21:29:21.201', '2025-11-18 21:29:21.201'),
	(58, 'DV-014', 'Blake', 58, 'Office of the Secretary', 'Rent', 'PS', 1000000, '2025-11-18 21:31:47.138', '2025-11-18 21:31:47.138'),
	(59, 'DV-015', 'Leomord', 58, 'Office of the Secretary', 'Capital', 'CO', 69000, '2025-11-21 21:09:22.152', '2025-11-21 21:09:22.152'),
	(60, 'DV-016', 'Cammy', 60, 'Fisheries Office', 'Salary', 'PS', 1400000, '2025-11-21 22:50:03.043', '2025-11-21 22:50:03.043'),
	(62, 'DV-017', 'Joyce', 64, 'Benjamin Office', 'Compost', 'CO', 10222, '2025-11-24 22:14:51.617', '2025-11-24 22:14:51.617'),
	(63, 'DV-018', 'Primal Spring', 65, 'Ground Office', 'Compost', 'CO', 400500, '2025-11-25 00:00:00.000', '2025-11-24 22:32:17.030'),
	(64, 'DV-019', 'Polanf', 65, 'Ground Office', 'Liability', 'PS', 10000, '2025-11-25 17:45:30.055', '2025-11-25 17:45:30.055');

-- Dumping structure for table budget_disburse.expense
CREATE TABLE IF NOT EXISTS `expense` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dateCreated` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table budget_disburse.expense: ~14 rows (approximately)
INSERT INTO `expense` (`id`, `type`, `category`, `dateCreated`, `updatedAt`) VALUES
	(21, 'Salary', 'PS', '2025-11-17 19:49:52.141', '2025-11-17 19:49:52.141'),
	(22, 'Gas', 'MOOE', '2025-11-17 19:51:59.840', '2025-11-17 19:51:59.840'),
	(23, 'Investment', 'CO', '2025-11-17 19:52:12.254', '2025-11-17 19:52:12.254'),
	(24, 'Rent', 'PS', '2025-11-18 21:30:51.597', '2025-11-18 21:30:51.597'),
	(25, 'Tech', 'MOOE', '2025-11-21 18:56:15.437', '2025-11-21 18:56:15.437'),
	(26, 'Capital', 'CO', '2025-11-21 18:56:31.849', '2025-11-21 18:56:31.849'),
	(27, 'Travel Expense', 'MOOE', '2025-11-24 20:23:35.585', '2025-11-24 20:23:35.585'),
	(28, 'Light Expense', 'MOOE', '2025-11-24 20:23:45.226', '2025-11-24 20:23:45.226'),
	(29, 'Living Expesnse', 'PS', '2025-11-24 20:24:00.528', '2025-11-24 20:24:00.528'),
	(30, 'Drip', 'PS', '2025-11-24 20:25:14.537', '2025-11-24 20:25:14.537'),
	(31, 'Computers', 'MOOE', '2025-11-24 20:25:25.600', '2025-11-24 20:25:25.600'),
	(32, 'Compost', 'CO', '2025-11-24 20:25:36.878', '2025-11-24 20:25:36.878'),
	(33, 'Debt', 'CO', '2025-11-24 21:44:52.379', '2025-11-24 21:44:58.717'),
	(34, 'Timestamps', 'CO', '2025-11-25 14:18:25.971', '2025-11-25 14:19:17.499'),
	(35, 'Liability', 'PS', '2025-11-25 17:41:41.364', '2025-11-25 17:41:41.364'),
	(36, 'As', 'MOOE', '2025-11-25 17:56:54.206', '2025-11-25 17:56:54.206');

-- Dumping structure for table budget_disburse.log
CREATE TABLE IF NOT EXISTS `log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `performedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `log_type_createdAt_idx` (`type`,`createdAt`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table budget_disburse.log: ~0 rows (approximately)
INSERT INTO `log` (`id`, `message`, `type`, `action`, `performedBy`, `createdAt`) VALUES
	(2, 'Created office Sad ', 'Office', 'create', 'admin', '2025-11-25 17:14:53.506'),
	(3, 'Deleted office (id: 70)', 'Office', 'delete', 'admin', '2025-11-25 17:19:25.179'),
	(4, 'Updated office Emulator Gcash (id: 69)', 'Office', 'update', 'admin', '2025-11-25 17:41:17.236'),
	(5, 'Created expense Liability / PS (id: 35)', 'Expense', 'create', 'admin', '2025-11-25 17:41:41.369'),
	(6, 'Created disbursement DV# DV-019 (id: 64)', 'Disbursement', 'create', 'admin', '2025-11-25 17:45:30.061'),
	(7, 'Created budget for Budget Office Minor (id: 64)', 'Budget', 'create', 'admin', '2025-11-25 17:46:31.831'),
	(8, 'Created expense As / MOOE (id: 36)', 'Expense', 'create', 'admin', '2025-11-25 17:56:54.212'),
	(9, 'Created budget for Emulator Gcash (id: 65)', 'Budget', 'create', 'admin', '2025-11-25 17:57:03.858');

-- Dumping structure for table budget_disburse.office
CREATE TABLE IF NOT EXISTS `office` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dateCreated` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Office_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table budget_disburse.office: ~13 rows (approximately)
INSERT INTO `office` (`id`, `name`, `dateCreated`) VALUES
	(55, 'Office of the Mayor', '2025-11-17 19:50:19.724'),
	(56, 'Office of the Vice Mayor', '2025-11-17 21:01:15.343'),
	(57, 'Budget Office', '2025-11-18 18:30:42.925'),
	(58, 'Office of the Secretary', '2025-11-18 21:27:17.384'),
	(59, 'Agriculture Office', '2025-11-21 18:57:12.304'),
	(60, 'Fisheries Office', '2025-11-21 21:17:13.321'),
	(61, 'Meme Office', '2025-11-24 20:22:02.414'),
	(62, 'Dark Office', '2025-11-24 20:22:10.903'),
	(63, 'Puppet Office', '2025-11-24 20:22:22.932'),
	(64, 'Benjamin Office', '2025-11-24 20:22:30.279'),
	(65, 'Ground Office', '2025-11-24 20:22:43.800'),
	(66, 'Cushion', '2025-11-24 21:40:11.900'),
	(67, 'Tourist Office', '2025-11-25 14:17:57.578'),
	(68, 'Budget Office Minor', '2025-11-25 16:58:29.382'),
	(69, 'Emulator Gcash', '2025-11-25 17:05:49.951');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
