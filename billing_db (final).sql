-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 17, 2025 at 12:33 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `billing_db`
--

DELIMITER $$
--
-- Functions
--
CREATE DEFINER=`root`@`localhost` FUNCTION `format_timestamp` (`dt` DATETIME) RETURNS VARCHAR(20) CHARSET utf8mb4 COLLATE utf8mb4_general_ci DETERMINISTIC BEGIN
    RETURN DATE_FORMAT(dt, '%Y-%m-%d %h:%i %p');
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `billings`
--

CREATE TABLE `billings` (
  `billing_id` int(11) NOT NULL,
  `visit_id` int(11) NOT NULL,
  `billing_date` datetime DEFAULT current_timestamp(),
  `total_amount` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `final_amount` decimal(10,2) NOT NULL,
  `payment_method` enum('Cash','Card','Online') DEFAULT NULL,
  `receipt_number` varchar(50) DEFAULT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `is_paid` tinyint(1) DEFAULT 0,
  `last_updated` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `payment_date` datetime DEFAULT NULL,
  `patient_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `billings`
--

INSERT INTO `billings` (`billing_id`, `visit_id`, `billing_date`, `total_amount`, `discount_amount`, `final_amount`, `payment_method`, `receipt_number`, `staff_id`, `is_paid`, `last_updated`, `payment_date`, `patient_id`) VALUES
(1, 1, '2025-06-12 19:40:48', 0.00, 0.00, 0.00, 'Cash', 'RCP-20250612-1', 3, 1, '2025-06-13 12:57:31', NULL, 3),
(2, 1, '2025-06-12 19:49:48', 5000.00, 2500.00, 2500.00, 'Card', 'RCP-20250612-2', 3, 1, '2025-06-13 12:57:31', NULL, 3),
(3, 5, '2025-06-12 20:12:27', 400.00, 400.00, 0.00, 'Online', 'RCP-20250612-3', 9, 1, '2025-06-13 12:57:31', NULL, 3),
(4, 6, '2025-06-12 21:10:36', 5000.00, 0.00, 5000.00, 'Cash', 'RCP-20250612-4', 3, 1, '2025-06-13 12:57:31', NULL, 2),
(5, 7, '2025-06-12 21:31:00', 5000.00, 2500.00, 2500.00, 'Cash', 'RCP-20250612-5', 3, 1, '2025-06-13 12:57:31', NULL, 3),
(6, 8, '2025-06-12 21:38:13', 5000.00, 2500.00, 2500.00, 'Cash', 'RCP-20250612-6', 3, 1, '2025-06-13 12:57:31', NULL, 1),
(7, 10, '2025-06-12 21:42:21', 5000.00, 2500.00, 2500.00, 'Cash', 'RCP-20250612-7', 3, 1, '2025-06-13 12:57:31', NULL, 3),
(8, 11, '2025-06-12 21:50:25', 500.00, 0.00, 500.00, 'Card', 'RCP-20250612-8', 3, 1, '2025-06-13 12:57:31', NULL, 5),
(9, 13, '2025-06-12 21:50:52', 5000.00, 2500.00, 2500.00, 'Card', 'RCP-20250612-9', 3, 1, '2025-06-13 12:57:31', NULL, 4),
(10, 12, '2025-06-12 21:51:18', 5000.00, 2500.00, 2500.00, 'Cash', 'RCP-20250612-10', 3, 1, '2025-06-13 12:57:31', NULL, 4),
(11, 9, '2025-06-12 23:58:34', 500.00, 0.00, 500.00, 'Online', 'RCP-20250612-11', 3, 1, '2025-06-13 12:57:31', NULL, 5),
(12, 14, '2025-06-12 23:58:52', 3500.00, 3500.00, 0.00, 'Card', 'RCP-20250613-12', 3, 1, '2025-06-13 12:57:31', NULL, 3),
(13, 19, '2025-06-13 12:34:03', 3500.00, 0.00, 3500.00, 'Cash', 'RCP-20250613-13', 9, 1, '2025-06-13 12:57:31', NULL, 5),
(14, 17, '2025-06-13 12:34:42', 5000.00, 2500.00, 2500.00, 'Online', 'RCP-20250613-14', 3, 1, '2025-06-16 09:38:15', '2025-06-13 12:58:43', 4),
(15, 18, '2025-06-13 12:41:14', 5000.00, 0.00, 5000.00, 'Cash', 'RCP-20250613-15', 9, 1, '2025-06-16 09:38:31', '2025-06-13 12:51:48', 5),
(16, 16, '2025-06-13 13:19:01', 5000.00, 2500.00, 2500.00, 'Cash', 'RCP-20250613-16', 3, 1, '2025-06-16 09:38:48', '2025-06-13 13:46:38', 4),
(17, 15, '2025-06-13 13:52:26', 5000.00, 2500.00, 2500.00, 'Cash', 'RCP-20250614-0000', 3, 1, '2025-06-16 09:40:12', '2025-06-15 22:46:38', 3),
(18, 20, '2025-06-14 23:06:49', 5000.00, 2500.00, 2500.00, NULL, 'RCP-20250614-0000', NULL, 0, '2025-06-14 23:06:49', NULL, NULL),
(19, 21, '2025-06-16 19:13:47', 300.00, 300.00, 0.00, NULL, 'RCP-20250616-0000', NULL, 0, '2025-06-16 19:13:47', NULL, NULL),
(20, 22, '2025-06-16 19:33:53', 9300.00, 4650.00, 4650.00, NULL, 'RCP-20250616-0000', NULL, 0, '2025-06-16 19:33:53', NULL, NULL),
(21, 23, '2025-06-16 20:53:18', 9700.00, 4850.00, 4850.00, NULL, 'RCP-20250616-0000', NULL, 0, '2025-06-16 20:53:18', NULL, NULL),
(22, 24, '2025-06-16 21:24:30', 5000.00, 2500.00, 2500.00, NULL, 'RCP-20250616-0000', NULL, 0, '2025-06-16 21:24:30', NULL, NULL),
(23, 25, '2025-06-16 21:48:29', 9400.00, 4700.00, 4700.00, NULL, 'RCP-20250616-0000', NULL, 0, '2025-06-16 21:48:29', NULL, NULL),
(24, 26, '2025-06-16 22:13:34', 9000.00, 4500.00, 4500.00, NULL, 'RCP-20250616-0000', NULL, 0, '2025-06-16 22:13:34', NULL, NULL),
(25, 27, '2025-06-16 22:27:54', 24300.00, 12150.00, 12150.00, 'Online', 'RCP-20250616-0000', 14, 1, '2025-06-17 03:28:59', '2025-06-17 03:28:59', 9),
(26, 31, '2025-06-17 01:38:55', 10500.00, 5250.00, 5250.00, 'Card', 'RCP-20250617-0000', 14, 1, '2025-06-17 03:26:02', '2025-06-17 03:26:02', 9),
(27, 28, '2025-06-17 03:33:46', 24000.00, 12000.00, 12000.00, 'Card', 'RCP-20250617-0000', 14, 1, '2025-06-17 03:50:06', '2025-06-17 03:38:04', 10),
(28, 33, '2025-06-17 03:35:53', 7600.00, 3800.00, 3800.00, 'Cash', 'RCP-20250617-0000', 14, 1, '2025-06-17 03:39:45', '2025-06-17 03:39:45', 10),
(29, 30, '2025-06-17 03:53:34', 5600.00, 2800.00, 2800.00, 'Cash', 'RCP-20250617-0000', 14, 1, '2025-06-17 03:55:14', '2025-06-17 03:55:14', 10),
(30, 29, '2025-06-17 04:01:48', 13800.00, 6900.00, 6900.00, NULL, 'RCP-20250617-0000', NULL, 0, '2025-06-17 04:01:48', NULL, 10),
(31, 35, '2025-06-17 04:21:53', 14200.00, 7100.00, 7100.00, NULL, 'RCP-20250617-0000', NULL, 0, '2025-06-17 04:21:53', NULL, 4),
(32, 36, '2025-06-17 05:12:08', 11600.00, 5800.00, 5800.00, NULL, 'RCP-20250617-0000', NULL, 0, '2025-06-17 05:22:14', NULL, 8),
(33, 37, '2025-06-17 06:22:11', 19300.00, 9650.00, 9650.00, 'Cash', 'RCP-20250617-0000', 14, 1, '2025-06-17 06:23:44', '2025-06-17 06:23:44', 11);

--
-- Triggers `billings`
--
DELIMITER $$
CREATE TRIGGER `generate_receipt_number` BEFORE INSERT ON `billings` FOR EACH ROW BEGIN
    SET NEW.receipt_number = CONCAT('RCP-', DATE_FORMAT(NEW.billing_date, '%Y%m%d'), '-', LPAD(NEW.billing_id, 4, '0'));
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `recalculate_billing_amounts` BEFORE UPDATE ON `billings` FOR EACH ROW BEGIN
    DECLARE patient_philhealth_id VARCHAR(30);
    
    -- Only recalculate if total_amount has changed
    IF NEW.total_amount IS NOT NULL AND NEW.total_amount <> OLD.total_amount THEN
        -- Fetch patient's philhealth_id from the patients table
        SELECT philhealth_id INTO patient_philhealth_id
        FROM patients
        WHERE patient_id = NEW.patient_id;
        
        -- Apply 50% discount if the patient is a Philhealth member
        IF patient_philhealth_id IS NOT NULL AND patient_philhealth_id <> '0' AND patient_philhealth_id <> '' THEN
            SET NEW.discount_amount = NEW.total_amount * 0.50;
        ELSE
            SET NEW.discount_amount = 0.00;
        END IF;
        
        -- Recalculate final_amount
        SET NEW.final_amount = NEW.total_amount - NEW.discount_amount;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_receipt_number` BEFORE UPDATE ON `billings` FOR EACH ROW BEGIN
    IF NEW.receipt_number IS NULL THEN
        SET NEW.receipt_number = CONCAT('RCP-', DATE_FORMAT(NEW.billing_date, '%Y%m%d'), '-', LPAD(NEW.billing_id, 4, '0'));
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `patient_id` int(11) NOT NULL,
  `pfirst_name` varchar(255) NOT NULL,
  `plast_name` varchar(255) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `pcontact_info` varchar(100) DEFAULT NULL,
  `guardian_name` varchar(100) DEFAULT NULL,
  `guardian_contact` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `philhealth_id` varchar(30) DEFAULT '0',
  `date_registered` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`patient_id`, `pfirst_name`, `plast_name`, `dob`, `gender`, `pcontact_info`, `guardian_name`, `guardian_contact`, `address`, `philhealth_id`, `date_registered`) VALUES
(1, 'Juan', 'Cruz', '1980-05-10', 'male', '09171234567', 'Mae Mae', '0920 504 8049', '325 Maria Payo St. Tondo, Manila', 'PH123456789', '2025-03-06 22:26:57'),
(2, 'Maria', 'Santos', '1992-11-22', 'female', '09281234567', 'Camille Fenomeno', '0920 504 8049', '325 Maria Payo St. Tondo, Manila', '0', '2025-04-06 22:26:57'),
(3, 'Diana', 'Kamilan', '2004-07-31', 'female', '0920 504 8049', 'Alexandra Jelaica', '0999 168 2244', '325 Maria Payo St. Tondo, Manila', 'PH234567891', '2025-06-07 17:07:12'),
(4, 'John', 'Palma', '2004-08-22', 'male', '0920 504 8049', 'Jhoi Jhoi', '0999 168 2244', 'Marikina', 'PH345678910', '2025-06-10 18:26:38'),
(5, 'Thyron', 'Kamilan', '2010-06-08', 'male', '09290 504 8049', 'Merly', '0999 168 2244', '325 Maria Payo St', '0', '2025-06-12 21:07:37'),
(6, 'Princes', 'Eliana', '2004-03-03', 'female', NULL, 'Bryan Kelly', '0999 168 2243', 'Makati', 'PH4567891012', '2025-06-14 23:04:24'),
(7, 'NIcole', 'Arcena', '2004-09-09', 'female', '0920 504 8049', 'Princes Eliana', '0999 168 2243', 'Quezon, CIty', 'PH4567891013', '2025-06-16 10:47:22'),
(8, 'Camille', 'Kamilan', '2006-03-28', 'female', '0920 504 8049', 'Merly Fenomeno', '0999 168 2243', '325 Maria Payo St. Tondo, Manila', 'PH4567891013', '2025-06-16 20:56:41'),
(9, 'Miggy', 'Basina', '2004-10-09', 'male', NULL, 'Princes Eliana Mother', '0999 168 2243', 'Quezon City', 'PH4567891014', '2025-06-16 22:11:17'),
(10, 'Maurecio', 'Moral', '2004-11-11', 'male', '0920 504 8049', 'Nanay Moral', '0999 168 2243', 'Quezon City', 'PH4567891015', '2025-06-17 00:08:09'),
(11, 'Jelaica', 'Mae', '2004-09-09', 'female', '0920 504 8049', 'Jhoi Jhoi', '0999 168 2244', 'Mandaluyong', 'PH4567891015', '2025-06-17 06:19:24');

-- --------------------------------------------------------

--
-- Stand-in structure for view `patient_visit_history`
-- (See below for the actual view)
--
CREATE TABLE `patient_visit_history` (
`visit_id` int(11)
,`patient_id` int(11)
,`visit_date` datetime
,`is_paid` tinyint(1)
);

-- --------------------------------------------------------

--
-- Table structure for table `staff_profiles`
--

CREATE TABLE `staff_profiles` (
  `staff_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `sfirst_name` varchar(255) NOT NULL,
  `slast_name` varchar(255) DEFAULT NULL,
  `specialty` varchar(100) DEFAULT NULL,
  `scontact_info` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff_profiles`
--

INSERT INTO `staff_profiles` (`staff_id`, `user_id`, `sfirst_name`, `slast_name`, `specialty`, `scontact_info`) VALUES
(1, 2, 'Diana', 'Kamilan', 'Cardiologist', '0920 504 8049'),
(2, 3, 'Nurse', 'Diana', NULL, '0920 504 8049'),
(3, 4, 'Billing', 'Diana', NULL, '0920 504 8049'),
(4, 5, 'Sarah', 'Kamilan', NULL, '0920 504 8049'),
(5, 6, 'Nurse', 'Fenomeno', NULL, '0920 504 8049'),
(6, 7, 'Billing', 'Camille', NULL, '0920 504 8049'),
(7, 8, 'Alex', 'Jelaica', 'Psychiatrist', '0920 504 8049'),
(8, 9, 'Paul', 'Palma', NULL, '0920 504 8049'),
(9, 10, 'Billing', 'Princes', NULL, '0920 504 8049'),
(10, 11, 'Nurse', 'Princes', NULL, '0920 504 8049'),
(11, 12, 'Princes', 'Eliana', 'Surgeon', '0920 504 8049'),
(12, 14, 'Nicole', 'Arcena', 'Cardiologist', '0920 504 8049'),
(13, 15, 'Miguel', 'Basina', 'Cardiologist', '0920 504 8049'),
(14, 16, 'Mau', 'Moral', NULL, '0920 504 8049'),
(15, 17, 'Paul', 'Palma', 'Cardiologist', '0920 504 8049'),
(16, 18, 'Jeff', 'Amboboyog', NULL, '0920 504 8049');

-- --------------------------------------------------------

--
-- Table structure for table `treatments`
--

CREATE TABLE `treatments` (
  `treatment_id` int(11) NOT NULL,
  `treatment_name` varchar(255) NOT NULL,
  `treatment_description` text DEFAULT NULL,
  `cost` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `treatments`
--

INSERT INTO `treatments` (`treatment_id`, `treatment_name`, `treatment_description`, `cost`) VALUES
(1, 'X-Ray', 'Chest X-Ray', 500.00),
(2, 'Blood Test', 'Complete Blood Count', 300.00),
(3, 'Consultation', 'Doctor Consultation Only', 400.00),
(4, 'MRI Scan', 'Brain MRI', 3500.00),
(5, 'Vaccination', 'Flu Vaccine', 800.00),
(6, 'Hepa test kit', 'Hepa testing', 500.00),
(7, 'General Surgery', 'Surgery', 5000.00),
(8, 'Brain Surgery', 'Surgery for the brain', 10000.00);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','doctor','nurse','billing_staff') NOT NULL,
  `date_created` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password`, `role`, `date_created`) VALUES
(1, 'admindiana', '$2b$10$WDYs.OhhIcNOB3Bcfr81PukO/lKhah.OO1wMDtOv2SeSrVlQ2WtWG', 'admin', '2025-06-06 23:39:48'),
(2, 'drdiana', '$2b$10$fjH6nWf/GUCGX/PdqbaiheC6MRXTIhXhodkRhT08NYa2T5CZaWkbK', 'doctor', '2025-06-06 23:40:45'),
(3, 'nursediana', '$2b$10$QeaI2tY2A.Ffmv6CpwOdD.T2XXBFfOCyplP0/Yqj7.SbOY56wHhii', 'nurse', '2025-06-06 23:41:28'),
(4, 'billingdiana', '$2b$10$XARpYx7kXdokcKsQGeQC7ulqTgi8yq5VGbNoIVX5NLMSLFg2Ijc1a', 'billing_staff', '2025-06-06 23:42:38'),
(5, 'nursekamilan', '$2b$10$HglYpW/PLOWH9Gc1.UE9D.RaVTnCzFswLX3J3oi0pm8Pk8rPlR9zi', 'nurse', '2025-06-07 11:26:26'),
(6, 'nursefenomeno', '$2b$10$qx2LmV6xQHaGNbv1m95Eke5NL6KQ614/Q3lhKqiKJqqXTB5j3vIgC', 'nurse', '2025-06-07 11:34:05'),
(7, 'billingcamille', '$2b$10$v/pOsMyNwJOiPk10CKyMceIn8M9lomqdZM7r.2MT3OpWWXIPe5S7O', 'billing_staff', '2025-06-08 00:04:45'),
(8, 'dralex', '$2b$10$KKSiWuxvyqsqK342QF2YSuqt6YQ4/nEEeuHAfHPWdFVWUgWMPYlP2', 'doctor', '2025-06-10 17:50:54'),
(9, 'billingpalma', '$2b$10$iOprxJmTNKUwAhsniF7rE.904DOApzU98qy7KJMQ5Fzt3bDLOVIMi', 'billing_staff', '2025-06-10 18:00:28'),
(10, 'billingprinces', '$2b$10$AgAZG.V2AxL8rTHt/R0aCulD2R5RbIU7eEufish.DaO1b4Oos77gK', 'billing_staff', '2025-06-10 18:04:48'),
(11, 'nurseprinces', '$2b$10$I2WOK1oLy6S1k1RzzeKxNO9EDD/fACvqRPO5T0.5MdP9NKqi4Ov9u', 'nurse', '2025-06-10 18:05:28'),
(12, 'drprinces', '$2b$10$SvgeSh9uAbs63HkiyiONWuDvqSYoLsI4n7AbvGnyxDi0XAItcg9hO', 'doctor', '2025-06-10 18:05:51'),
(13, 'adminmiggy', '$2b$10$vnYZaVT/U75rtNGrX7pI0ukBtzk2QGyC.KiZOJTAbZjGLziXV9xx2', 'admin', '2025-06-10 18:06:16'),
(14, 'drnicole', '$2b$10$es0n2C0gL7mx8h0Qlp8RROvSWH0eHNk6Xr/c8ARZEQT97uohdqT/y', 'doctor', '2025-06-15 22:19:07'),
(15, 'drmiggy', '$2b$10$oq/GHt91sknWUdPcNHeteuoljiBDnHADkbXjlu6n2xiqdlVcNVP3u', 'doctor', '2025-06-17 00:03:05'),
(16, 'billingmau', '$2b$10$./86DmZGLLmHCmx0iA5/0e8QGykytN2aviy.Sx8YGhhwfEQYXHlqq', 'billing_staff', '2025-06-17 00:03:54'),
(17, 'drpalma', '$2b$10$2iDbsDjsrkflRTu0WV3/HuCAgwfKFmYxpaDgpyRAdYnAslA6t1Swm', 'doctor', '2025-06-17 06:17:35'),
(18, 'billingjeff', '$2b$10$Wt.jiHTC3W8Ty2l1P3/2B.mP7Mo.OQoiyzBjHQkjw2n7nuH5lSGc2', 'billing_staff', '2025-06-17 06:28:31');

-- --------------------------------------------------------

--
-- Table structure for table `visits`
--

CREATE TABLE `visits` (
  `visit_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `registered_by` int(11) NOT NULL,
  `visit_date` datetime DEFAULT current_timestamp(),
  `visit_purpose` text DEFAULT NULL,
  `diagnosis` text DEFAULT NULL,
  `visit_status` enum('Registered','Pending Treatment','In Progress','Completed') DEFAULT 'Registered'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `visits`
--

INSERT INTO `visits` (`visit_id`, `patient_id`, `doctor_id`, `registered_by`, `visit_date`, `visit_purpose`, `diagnosis`, `visit_status`) VALUES
(1, 3, 1, 2, '2025-06-08 00:42:15', '\r\nFlu', 'Needs Surgery', 'Registered'),
(2, 2, 1, 2, '2025-06-08 00:42:53', 'Heart attack', 'Brain cancer', 'Registered'),
(3, 1, 1, 2, '2025-06-08 00:43:25', 'Give birth', 'Lung cancer', 'Registered'),
(4, 4, 1, 2, '2025-06-10 19:07:18', 'Brain damage', 'Lung cancer', 'Registered'),
(5, 3, 7, 2, '2025-06-10 19:09:01', 'Head trauma', 'Consult only', 'Registered'),
(6, 2, 7, 2, '2025-06-12 19:39:01', 'SIck', 'Surgery', 'Registered'),
(7, 3, 7, 2, '2025-06-12 19:39:17', 'Sick', 'Surgery general', 'Registered'),
(8, 1, 1, 2, '2025-06-12 19:39:31', 'Sick', 'Surgery general', 'Registered'),
(9, 5, 11, 2, '2025-06-12 21:08:12', 'Trangkaso', 'Lung cancer', 'Registered'),
(10, 3, 7, 5, '2025-06-12 21:41:52', 'Sakit', 'Surgery general', 'Registered'),
(11, 5, 7, 2, '2025-06-12 21:48:58', 'May sakit', 'Lung cancer', 'Registered'),
(12, 4, 7, 2, '2025-06-12 21:49:24', 'Sick', 'Surgery general', 'Registered'),
(13, 4, 7, 2, '2025-06-12 21:49:31', 'Sakit', 'Needs Surgery', 'Registered'),
(14, 3, 11, 5, '2025-06-12 23:55:41', 'Head Trauma', 'Brain cancer', 'Registered'),
(15, 3, 11, 5, '2025-06-12 23:55:53', 'Flu', 'Needs Surgery', 'Registered'),
(16, 4, 11, 5, '2025-06-12 23:56:10', 'Head Trauma', 'Needs Surgery', 'Registered'),
(17, 4, 11, 5, '2025-06-12 23:56:22', 'Accident', 'Needs Surgery', 'Registered'),
(18, 5, 11, 5, '2025-06-12 23:56:44', 'Head Trauma', 'Needs Surgery', 'Registered'),
(19, 5, 11, 5, '2025-06-12 23:56:54', 'Injured', 'Brain cancer', 'Registered'),
(20, 6, 7, 2, '2025-06-14 23:05:08', 'Masakit Puson', 'Needs Surgery', 'Registered'),
(21, 7, 12, 2, '2025-06-16 11:27:04', 'Unconscious', 'Needs Surgery', 'Registered'),
(22, 7, 11, 5, '2025-06-16 19:17:38', 'Nabaril', 'Needs general surgery ', 'Registered'),
(23, 6, 12, 10, '2025-06-16 19:49:39', 'Unconscios sha ', 'Needs complete opertaion', 'Registered'),
(24, 8, 7, 5, '2025-06-16 20:57:22', 'Headshot', 'Immediate surgery', 'Registered'),
(25, 8, 11, 5, '2025-06-16 20:57:57', 'Trangkaso', 'Emergency sha', 'Registered'),
(26, 9, 11, 5, '2025-06-16 22:11:40', 'Asthma', 'Needs immediate treatment', 'Registered'),
(27, 9, 12, 5, '2025-06-16 22:12:18', 'Hypertension', 'immediate medical procedure', 'Registered'),
(28, 10, 13, 10, '2025-06-17 00:18:27', 'Heart Attack', 'brain surgery na', 'Pending Treatment'),
(29, 10, 13, 10, '2025-06-17 00:25:53', 'Headache', 'Head trauma', 'Pending Treatment'),
(30, 10, 13, 10, '2025-06-17 00:49:07', 'Unconscious', 'medical treatment', 'Pending Treatment'),
(31, 9, 11, 10, '2025-06-17 00:54:46', 'Heart attack', 'Patient needs medical treatment', 'Pending Treatment'),
(32, 7, 13, 10, '2025-06-17 00:56:24', 'Asthma', NULL, 'Pending Treatment'),
(33, 10, 13, 10, '2025-06-17 01:11:58', 'Diabetes', 'For treatment', 'Pending Treatment'),
(34, 6, 12, 10, '2025-06-17 01:19:08', 'Nabaril', NULL, 'Pending Treatment'),
(35, 4, 7, 2, '2025-06-17 04:20:26', 'Asthma', 'Emergency', 'Pending Treatment'),
(36, 8, 1, 5, '2025-06-17 05:10:05', 'Sick', 'for consultation', 'Completed'),
(37, 11, 15, 10, '2025-06-17 06:19:55', 'Sakit ulo', 'Sakit sa otak', 'Completed');

-- --------------------------------------------------------

--
-- Table structure for table `visit_treatments`
--

CREATE TABLE `visit_treatments` (
  `visit_treatment_id` int(11) NOT NULL,
  `visit_id` int(11) NOT NULL,
  `treatment_id` int(11) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `subtotal` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `visit_treatments`
--

INSERT INTO `visit_treatments` (`visit_treatment_id`, `visit_id`, `treatment_id`, `quantity`, `subtotal`) VALUES
(1, 4, 1, 1, 0.00),
(2, 4, 1, 1, 0.00),
(3, 3, 1, 1, 0.00),
(4, 2, 4, 1, 0.00),
(5, 1, 7, 1, 0.00),
(6, 5, 3, 1, 0.00),
(7, 6, 7, 1, 0.00),
(8, 7, 7, 1, 0.00),
(9, 8, 7, 1, 0.00),
(10, 10, 7, 1, 0.00),
(11, 11, 1, 1, 0.00),
(12, 13, 7, 1, 0.00),
(13, 12, 7, 1, 0.00),
(14, 9, 1, 1, 0.00),
(15, 14, 4, 1, 0.00),
(16, 19, 4, 1, 0.00),
(17, 17, 7, 1, 0.00),
(18, 18, 7, 1, 0.00),
(19, 16, 7, 1, 0.00),
(20, 15, 7, 1, 0.00),
(21, 20, 7, 1, 0.00),
(22, 21, 2, 1, 300.00),
(23, 22, 2, 2, 600.00),
(24, 22, 7, 3, 15000.00),
(25, 22, 4, 1, 3500.00),
(26, 22, 1, 1, 500.00),
(27, 23, 1, 1, 500.00),
(28, 23, 2, 1, 300.00),
(29, 23, 4, 1, 3500.00),
(30, 23, 7, 2, 10000.00),
(31, 23, 3, 1, 400.00),
(32, 24, 7, 3, 15000.00),
(33, 25, 1, 2, 1000.00),
(34, 25, 4, 2, 7000.00),
(35, 25, 3, 1, 400.00),
(36, 25, 7, 3, 15000.00),
(37, 26, 1, 1, 500.00),
(38, 26, 4, 1, 3500.00),
(39, 26, 7, 3, 15000.00),
(40, 27, 7, 3, 15000.00),
(41, 27, 1, 2, 1000.00),
(42, 27, 3, 1, 400.00),
(43, 27, 4, 2, 7000.00),
(44, 27, 2, 3, 900.00),
(45, 31, 7, 2, 10000.00),
(46, 31, 1, 1, 500.00),
(47, 28, 1, 1, 500.00),
(48, 28, 7, 2, 10000.00),
(49, 33, 4, 2, 7000.00),
(50, 33, 2, 2, 600.00),
(51, 28, 8, 1, 10000.00),
(52, 28, 4, 1, 3500.00),
(53, 30, 2, 2, 600.00),
(54, 30, 7, 1, 5000.00),
(55, 29, 8, 1, 10000.00),
(56, 29, 2, 1, 300.00),
(57, 29, 4, 1, 3500.00),
(58, 35, 8, 1, 10000.00),
(59, 35, 3, 1, 400.00),
(60, 35, 2, 1, 300.00),
(61, 35, 4, 1, 3500.00),
(62, 36, 1, 1, 500.00),
(63, 36, 8, 1, 10000.00),
(64, 36, 2, 1, 300.00),
(65, 36, 3, 2, 800.00),
(66, 37, 8, 1, 10000.00),
(67, 37, 4, 1, 3500.00),
(68, 37, 1, 1, 500.00),
(69, 37, 2, 1, 300.00),
(70, 37, 7, 1, 5000.00);

--
-- Triggers `visit_treatments`
--
DELIMITER $$
CREATE TRIGGER `calculate_visit_treatment_subtotal` BEFORE INSERT ON `visit_treatments` FOR EACH ROW BEGIN
    DECLARE treatment_cost DECIMAL(10,2);
    SELECT cost INTO treatment_cost FROM treatments WHERE treatment_id = NEW.treatment_id;
    SET NEW.subtotal = treatment_cost * NEW.quantity;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_billing_total` AFTER INSERT ON `visit_treatments` FOR EACH ROW BEGIN
    DECLARE visit_total DECIMAL(10,2);
    SELECT COALESCE(SUM(vt.subtotal), 0) INTO visit_total
    FROM visit_treatments vt
    WHERE vt.visit_id = NEW.visit_id;
    
    UPDATE billings
    SET total_amount = visit_total
    WHERE visit_id = NEW.visit_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_billing_total_on_update` AFTER UPDATE ON `visit_treatments` FOR EACH ROW BEGIN
    DECLARE visit_total DECIMAL(10,2);
    SELECT COALESCE(SUM(vt.subtotal), 0) INTO visit_total
    FROM visit_treatments vt
    WHERE vt.visit_id = NEW.visit_id;
    
    UPDATE billings
    SET total_amount = visit_total
    WHERE visit_id = NEW.visit_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_visit_treatment_subtotal` BEFORE UPDATE ON `visit_treatments` FOR EACH ROW BEGIN
    DECLARE treatment_cost DECIMAL(10,2);
    SELECT cost INTO treatment_cost FROM treatments WHERE treatment_id = NEW.treatment_id;
    SET NEW.subtotal = treatment_cost * NEW.quantity;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure for view `patient_visit_history`
--
DROP TABLE IF EXISTS `patient_visit_history`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `patient_visit_history`  AS SELECT `v`.`visit_id` AS `visit_id`, `v`.`patient_id` AS `patient_id`, `v`.`visit_date` AS `visit_date`, `b`.`is_paid` AS `is_paid` FROM (`visits` `v` left join `billings` `b` on(`v`.`visit_id` = `b`.`visit_id`)) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `billings`
--
ALTER TABLE `billings`
  ADD PRIMARY KEY (`billing_id`),
  ADD KEY `visit_id` (`visit_id`),
  ADD KEY `billing_staff_id` (`staff_id`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`patient_id`);

--
-- Indexes for table `staff_profiles`
--
ALTER TABLE `staff_profiles`
  ADD PRIMARY KEY (`staff_id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `treatments`
--
ALTER TABLE `treatments`
  ADD PRIMARY KEY (`treatment_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `idx_username` (`username`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_date_created` (`date_created`);

--
-- Indexes for table `visits`
--
ALTER TABLE `visits`
  ADD PRIMARY KEY (`visit_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `doctor_id` (`doctor_id`),
  ADD KEY `registered_by` (`registered_by`),
  ADD KEY `idx_visit_date` (`visit_date`);

--
-- Indexes for table `visit_treatments`
--
ALTER TABLE `visit_treatments`
  ADD PRIMARY KEY (`visit_treatment_id`),
  ADD KEY `visit_id` (`visit_id`),
  ADD KEY `treatment_id` (`treatment_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `billings`
--
ALTER TABLE `billings`
  MODIFY `billing_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `patient_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `staff_profiles`
--
ALTER TABLE `staff_profiles`
  MODIFY `staff_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `treatments`
--
ALTER TABLE `treatments`
  MODIFY `treatment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `visits`
--
ALTER TABLE `visits`
  MODIFY `visit_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `visit_treatments`
--
ALTER TABLE `visit_treatments`
  MODIFY `visit_treatment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `billings`
--
ALTER TABLE `billings`
  ADD CONSTRAINT `billings_ibfk_1` FOREIGN KEY (`visit_id`) REFERENCES `visits` (`visit_id`),
  ADD CONSTRAINT `billings_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `staff_profiles` (`staff_id`),
  ADD CONSTRAINT `fk_billings_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff_profiles` (`staff_id`);

--
-- Constraints for table `staff_profiles`
--
ALTER TABLE `staff_profiles`
  ADD CONSTRAINT `staff_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `visits`
--
ALTER TABLE `visits`
  ADD CONSTRAINT `visits_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `visits_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `staff_profiles` (`staff_id`),
  ADD CONSTRAINT `visits_ibfk_3` FOREIGN KEY (`registered_by`) REFERENCES `staff_profiles` (`staff_id`);

--
-- Constraints for table `visit_treatments`
--
ALTER TABLE `visit_treatments`
  ADD CONSTRAINT `visit_treatments_ibfk_1` FOREIGN KEY (`visit_id`) REFERENCES `visits` (`visit_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `visit_treatments_ibfk_2` FOREIGN KEY (`treatment_id`) REFERENCES `treatments` (`treatment_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
