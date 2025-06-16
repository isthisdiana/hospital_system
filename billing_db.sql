-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 15, 2025 at 12:44 PM
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
  `philhealth_id` varchar(30) DEFAULT NULL,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `final_amount` decimal(10,2) NOT NULL,
  `payment_method` enum('Cash','Card','Online') DEFAULT NULL,
  `receipt_number` varchar(50) DEFAULT NULL,
  `billing_staff_id` int(11) DEFAULT NULL,
  `is_paid` tinyint(1) DEFAULT 0,
  `last_updated` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `payment_date` datetime DEFAULT NULL,
  `patient_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `billings`
--

INSERT INTO `billings` (`billing_id`, `visit_id`, `billing_date`, `total_amount`, `philhealth_id`, `discount_amount`, `final_amount`, `payment_method`, `receipt_number`, `billing_staff_id`, `is_paid`, `last_updated`, `payment_date`, `patient_id`) VALUES
(1, 1, '2025-06-12 19:40:48', 0.00, 'PH234567891', 0.00, 0.00, 'Cash', 'RCP-20250612-1', 3, 1, '2025-06-13 12:57:31', NULL, 3),
(2, 1, '2025-06-12 19:49:48', 5000.00, 'PH234567891', 2500.00, 2500.00, 'Card', 'RCP-20250612-2', 3, 1, '2025-06-13 12:57:31', NULL, 3),
(3, 5, '2025-06-12 20:12:27', 400.00, 'PH234567891', 400.00, 0.00, 'Online', 'RCP-20250612-3', 9, 1, '2025-06-13 12:57:31', NULL, 3),
(4, 6, '2025-06-12 21:10:36', 5000.00, '0', 0.00, 5000.00, 'Cash', 'RCP-20250612-4', 3, 1, '2025-06-13 12:57:31', NULL, 2),
(5, 7, '2025-06-12 21:31:00', 5000.00, 'PH234567891', 2500.00, 2500.00, 'Cash', 'RCP-20250612-5', 3, 1, '2025-06-13 12:57:31', NULL, 3),
(6, 8, '2025-06-12 21:38:13', 5000.00, 'PH123456789', 2500.00, 2500.00, 'Cash', 'RCP-20250612-6', 3, 1, '2025-06-13 12:57:31', NULL, 1),
(7, 10, '2025-06-12 21:42:21', 5000.00, 'PH234567891', 2500.00, 2500.00, 'Cash', 'RCP-20250612-7', 3, 1, '2025-06-13 12:57:31', NULL, 3),
(8, 11, '2025-06-12 21:50:25', 500.00, '0', 0.00, 500.00, 'Card', 'RCP-20250612-8', 3, 1, '2025-06-13 12:57:31', NULL, 5),
(9, 13, '2025-06-12 21:50:52', 5000.00, 'PH345678910', 2500.00, 2500.00, 'Card', 'RCP-20250612-9', 3, 1, '2025-06-13 12:57:31', NULL, 4),
(10, 12, '2025-06-12 21:51:18', 5000.00, 'PH345678910', 2500.00, 2500.00, 'Cash', 'RCP-20250612-10', 3, 1, '2025-06-13 12:57:31', NULL, 4),
(11, 9, '2025-06-12 23:58:34', 500.00, '0', 0.00, 500.00, 'Online', 'RCP-20250612-11', 3, 1, '2025-06-13 12:57:31', NULL, 5),
(12, 14, '2025-06-12 23:58:52', 3500.00, 'PH234567891', 3500.00, 0.00, 'Card', 'RCP-20250613-12', 3, 1, '2025-06-13 12:57:31', NULL, 3),
(13, 19, '2025-06-13 12:34:03', 3500.00, '0', 0.00, 3500.00, 'Cash', 'RCP-20250613-13', 9, 1, '2025-06-13 12:57:31', NULL, 5),
(14, 17, '2025-06-13 12:34:42', 5000.00, 'PH345678910', 2500.00, 2500.00, 'Online', '', 3, 1, '2025-06-13 14:57:04', '2025-06-13 12:58:43', 4),
(15, 18, '2025-06-13 12:41:14', 5000.00, '0', 0.00, 5000.00, 'Cash', '', 9, 1, '2025-06-13 14:57:16', '2025-06-13 12:51:48', 5),
(16, 16, '2025-06-13 13:19:01', 5000.00, 'PH345678910', 2500.00, 2500.00, 'Cash', '', 3, 1, '2025-06-13 13:46:38', '2025-06-13 13:46:38', 4),
(17, 15, '2025-06-13 13:52:26', 5000.00, 'PH234567891', 2500.00, 2500.00, 'Cash', '', 3, 1, '2025-06-13 14:57:48', '2025-06-13 13:52:56', 3),
(18, 20, '2025-06-14 23:06:49', 5000.00, 'PH4567891012', 2500.00, 2500.00, NULL, 'RCP-20250614-0000', NULL, 0, '2025-06-14 23:06:49', NULL, NULL);

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
CREATE TRIGGER `update_receipt_number` BEFORE UPDATE ON `billings` FOR EACH ROW BEGIN
    IF NEW.receipt_number IS NULL THEN
        SET NEW.receipt_number = CONCAT('RCP-', DATE_FORMAT(NEW.billing_date, '%Y%m%d'), '-', LPAD(NEW.billing_id, 4, '0'));
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Stand-in structure for view `billing_slips`
-- (See below for the actual view)
--
CREATE TABLE `billing_slips` (
`billing_id` int(11)
,`visit_id` int(11)
,`patient_id` int(11)
,`patient_name` varchar(100)
,`philhealth_id` varchar(30)
,`doctor_id` int(11)
,`doctor_name` varchar(100)
,`total_amount` decimal(10,2)
,`discount_amount` decimal(10,2)
,`final_amount` decimal(10,2)
,`billing_date` varchar(20)
,`last_updated` varchar(20)
,`is_paid` tinyint(1)
);

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `patient_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `dob` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `contact_info` varchar(100) DEFAULT NULL,
  `guardian_name` varchar(100) DEFAULT NULL,
  `guardian_contact` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `philhealth_id` varchar(30) DEFAULT '0',
  `date_registered` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`patient_id`, `full_name`, `dob`, `gender`, `contact_info`, `guardian_name`, `guardian_contact`, `address`, `philhealth_id`, `date_registered`) VALUES
(1, 'Juan Dela Cruz', '1980-05-10', 'male', '09171234567', 'Mae Mae', '0920 504 8049', '325 Maria Payo St. Tondo, Manila', 'PH123456789', '2025-03-06 22:26:57'),
(2, 'Maria Santos', '1992-11-22', 'female', '09281234567', 'Camille Fenomeno', '0920 504 8049', '325 Maria Payo St. Tondo, Manila', '0', '2025-04-06 22:26:57'),
(3, 'Diana Kamilan', '2004-07-31', 'female', '0920 504 8049', 'Alexandra Jelaica', '0999 168 2244', '325 Maria Payo St. Tondo, Manila', 'PH234567891', '2025-06-07 17:07:12'),
(4, 'John Paul Palma', '2004-08-22', 'male', '0920 504 8049', 'Jhoi Jhoi', '0999 168 2244', 'Marikina', 'PH345678910', '2025-06-10 18:26:38'),
(5, 'Thyron Kamilan', '2010-06-08', 'male', '09290 504 8049', 'Merly', '0999 168 2244', '325 Maria Payo St', '0', '2025-06-12 21:07:37'),
(6, 'Princes Eliana', '2004-03-03', 'female', NULL, 'Bryan Kelly', '0999 168 2243', 'Makati', 'PH4567891012', '2025-06-14 23:04:24');

-- --------------------------------------------------------

--
-- Stand-in structure for view `patient_visit_history`
-- (See below for the actual view)
--
CREATE TABLE `patient_visit_history` (
`visit_id` int(11)
,`patient_id` int(11)
,`patient_name` varchar(100)
,`doctor_name` varchar(100)
,`visit_date` varchar(20)
,`visit_purpose` text
,`diagnosis` text
,`visit_status` enum('Registered','In Progress','Completed')
,`billing_date` varchar(20)
,`total_amount` decimal(10,2)
,`discount_amount` decimal(10,2)
,`final_amount` decimal(10,2)
,`is_paid` tinyint(1)
);

-- --------------------------------------------------------

--
-- Table structure for table `staff_profiles`
--

CREATE TABLE `staff_profiles` (
  `staff_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `specialty` varchar(100) DEFAULT NULL,
  `contact_info` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff_profiles`
--

INSERT INTO `staff_profiles` (`staff_id`, `user_id`, `full_name`, `specialty`, `contact_info`) VALUES
(1, 2, 'Dr. Diana Kamilan', 'Cardiologist', '0920 504 8049'),
(2, 3, 'Nurse Diana', NULL, '0920 504 8049'),
(3, 4, 'Billing Diana', NULL, '0920 504 8049'),
(4, 5, 'Nurse Kamilan', NULL, '0920 504 8049'),
(5, 6, 'Nurse Fenomeno', NULL, '0920 504 8049'),
(6, 7, 'Billing Camille', NULL, '0920 504 8049'),
(7, 8, 'Dr. Alex Jelaica', 'Psychiatrist', '0920 504 8049'),
(8, 9, 'John Paul Palma', NULL, '0920 504 8049'),
(9, 10, 'Billing Princes', NULL, '0920 504 8049'),
(10, 11, 'Nurse Princes', NULL, '0920 504 8049'),
(11, 12, 'Dr. Princes', 'Surgeon', '0920 504 8049');

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
(7, 'General Surgery', 'Surgery', 5000.00);

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
(13, 'adminmiggy', '$2b$10$vnYZaVT/U75rtNGrX7pI0ukBtzk2QGyC.KiZOJTAbZjGLziXV9xx2', 'admin', '2025-06-10 18:06:16');

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
  `visit_status` enum('Registered','In Progress','Completed') DEFAULT 'Registered'
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
(20, 6, 7, 2, '2025-06-14 23:05:08', 'Masakit Puson', 'Needs Surgery', 'Registered');

-- --------------------------------------------------------

--
-- Stand-in structure for view `visit_slips`
-- (See below for the actual view)
--
CREATE TABLE `visit_slips` (
`visit_id` int(11)
,`patient_id` int(11)
,`patient_name` varchar(100)
,`philhealth_id` varchar(30)
,`visit_purpose` text
,`visit_date` varchar(20)
,`visit_status` enum('Registered','In Progress','Completed')
,`registered_by_id` int(11)
,`registered_by_name` varchar(100)
);

-- --------------------------------------------------------

--
-- Table structure for table `visit_treatments`
--

CREATE TABLE `visit_treatments` (
  `visit_treatment_id` int(11) NOT NULL,
  `visit_id` int(11) NOT NULL,
  `treatment_id` int(11) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `treatment_status` enum('Pending','Completed') DEFAULT 'Pending',
  `subtotal` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `visit_treatments`
--

INSERT INTO `visit_treatments` (`visit_treatment_id`, `visit_id`, `treatment_id`, `quantity`, `treatment_status`, `subtotal`) VALUES
(1, 4, 1, 1, 'Pending', 0),
(2, 4, 1, 1, 'Pending', 0),
(3, 3, 1, 1, 'Pending', 0),
(4, 2, 4, 1, 'Pending', 0),
(5, 1, 7, 1, 'Pending', 0),
(6, 5, 3, 1, 'Pending', 0),
(7, 6, 7, 1, 'Pending', 0),
(8, 7, 7, 1, 'Pending', 0),
(9, 8, 7, 1, 'Pending', 0),
(10, 10, 7, 1, 'Pending', 0),
(11, 11, 1, 1, 'Pending', 0),
(12, 13, 7, 1, 'Pending', 0),
(13, 12, 7, 1, 'Pending', 0),
(14, 9, 1, 1, 'Pending', 0),
(15, 14, 4, 1, 'Pending', 0),
(16, 19, 4, 1, 'Pending', 0),
(17, 17, 7, 1, 'Pending', 0),
(18, 18, 7, 1, 'Pending', 0),
(19, 16, 7, 1, 'Pending', 0),
(20, 15, 7, 1, 'Pending', 0),
(21, 20, 7, 1, 'Pending', 0);

-- --------------------------------------------------------

--
-- Structure for view `billing_slips`
--
DROP TABLE IF EXISTS `billing_slips`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `billing_slips`  AS SELECT `b`.`billing_id` AS `billing_id`, `v`.`visit_id` AS `visit_id`, `p`.`patient_id` AS `patient_id`, `p`.`full_name` AS `patient_name`, `p`.`philhealth_id` AS `philhealth_id`, `d`.`staff_id` AS `doctor_id`, `d`.`full_name` AS `doctor_name`, `b`.`total_amount` AS `total_amount`, `b`.`discount_amount` AS `discount_amount`, `b`.`final_amount` AS `final_amount`, `format_timestamp`(`b`.`billing_date`) AS `billing_date`, `format_timestamp`(`b`.`last_updated`) AS `last_updated`, `b`.`is_paid` AS `is_paid` FROM (((`billings` `b` join `visits` `v` on(`b`.`visit_id` = `v`.`visit_id`)) join `patients` `p` on(`v`.`patient_id` = `p`.`patient_id`)) join `staff_profiles` `d` on(`v`.`doctor_id` = `d`.`staff_id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `patient_visit_history`
--
DROP TABLE IF EXISTS `patient_visit_history`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `patient_visit_history`  AS SELECT `v`.`visit_id` AS `visit_id`, `p`.`patient_id` AS `patient_id`, `p`.`full_name` AS `patient_name`, `d`.`full_name` AS `doctor_name`, `format_timestamp`(`v`.`visit_date`) AS `visit_date`, `v`.`visit_purpose` AS `visit_purpose`, `v`.`diagnosis` AS `diagnosis`, `v`.`visit_status` AS `visit_status`, `format_timestamp`(`b`.`billing_date`) AS `billing_date`, `b`.`total_amount` AS `total_amount`, `b`.`discount_amount` AS `discount_amount`, `b`.`final_amount` AS `final_amount`, `b`.`is_paid` AS `is_paid` FROM (((`visits` `v` join `patients` `p` on(`v`.`patient_id` = `p`.`patient_id`)) join `staff_profiles` `d` on(`v`.`doctor_id` = `d`.`staff_id`)) left join `billings` `b` on(`v`.`visit_id` = `b`.`visit_id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `visit_slips`
--
DROP TABLE IF EXISTS `visit_slips`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `visit_slips`  AS SELECT `v`.`visit_id` AS `visit_id`, `p`.`patient_id` AS `patient_id`, `p`.`full_name` AS `patient_name`, `p`.`philhealth_id` AS `philhealth_id`, `v`.`visit_purpose` AS `visit_purpose`, `format_timestamp`(`v`.`visit_date`) AS `visit_date`, `v`.`visit_status` AS `visit_status`, `s`.`staff_id` AS `registered_by_id`, `s`.`full_name` AS `registered_by_name` FROM ((`visits` `v` join `patients` `p` on(`v`.`patient_id` = `p`.`patient_id`)) join `staff_profiles` `s` on(`v`.`registered_by` = `s`.`staff_id`)) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `billings`
--
ALTER TABLE `billings`
  ADD PRIMARY KEY (`billing_id`),
  ADD KEY `visit_id` (`visit_id`),
  ADD KEY `billing_staff_id` (`billing_staff_id`);

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
  MODIFY `billing_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `patient_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `staff_profiles`
--
ALTER TABLE `staff_profiles`
  MODIFY `staff_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `treatments`
--
ALTER TABLE `treatments`
  MODIFY `treatment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `visits`
--
ALTER TABLE `visits`
  MODIFY `visit_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `visit_treatments`
--
ALTER TABLE `visit_treatments`
  MODIFY `visit_treatment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `billings`
--
ALTER TABLE `billings`
  ADD CONSTRAINT `billings_ibfk_1` FOREIGN KEY (`visit_id`) REFERENCES `visits` (`visit_id`),
  ADD CONSTRAINT `billings_ibfk_2` FOREIGN KEY (`billing_staff_id`) REFERENCES `staff_profiles` (`staff_id`);

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
