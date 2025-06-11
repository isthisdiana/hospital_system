-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 07, 2025 at 04:39 AM
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
  `last_updated` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
-- Table structure for table `medical_abstracts`
--

CREATE TABLE `medical_abstracts` (
  `abstract_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `visit_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `abstract_date` date NOT NULL,
  `diagnosis` text DEFAULT NULL,
  `treatments_summary` text DEFAULT NULL,
  `payment_status` enum('Pending','Paid') NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `medical_abstract_details`
-- (See below for the actual view)
--
CREATE TABLE `medical_abstract_details` (
`abstract_id` int(11)
,`patient_id` int(11)
,`patient_name` varchar(100)
,`philhealth_id` varchar(30)
,`doctor_name` varchar(100)
,`doctor_specialty` varchar(100)
,`created_at` varchar(20)
,`diagnosis` text
,`treatments_summary` text
,`payment_status` enum('Pending','Paid')
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
(1, 'Juan Dela Cruz', '1980-05-10', 'male', '09171234567', NULL, NULL, NULL, 'PH123456789', '2025-06-06 22:26:57'),
(2, 'Maria Santos', '1992-11-23', 'female', '09281234567', NULL, NULL, NULL, '0', '2025-06-06 22:26:57');

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
-- Table structure for table `receipts`
--

CREATE TABLE `receipts` (
  `receipt_id` int(11) NOT NULL,
  `billing_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `billing_staff_id` int(11) NOT NULL,
  `receipt_number` varchar(50) NOT NULL,
  `issue_date` datetime DEFAULT current_timestamp(),
  `payment_method` enum('Cash','Card','Online') NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `final_amount` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `receipt_details`
-- (See below for the actual view)
--
CREATE TABLE `receipt_details` (
`receipt_id` int(11)
,`billing_id` int(11)
,`patient_id` int(11)
,`patient_name` varchar(100)
,`philhealth_id` varchar(30)
,`billing_staff_name` varchar(100)
,`receipt_number` varchar(50)
,`issue_date` varchar(20)
,`payment_method` enum('Cash','Card','Online')
,`total_amount` decimal(10,2)
,`discount_amount` decimal(10,2)
,`final_amount` decimal(10,2)
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
(3, 4, 'Billing Diana', NULL, '0920 504 8049');

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
(3, 'Consultation', 'Doctor Consultation', 400.00),
(4, 'MRI Scan', 'Brain MRI', 3500.00),
(5, 'Vaccination', 'Flu Vaccine', 800.00);

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
(4, 'billingdiana', '$2b$10$XARpYx7kXdokcKsQGeQC7ulqTgi8yq5VGbNoIVX5NLMSLFg2Ijc1a', 'billing_staff', '2025-06-06 23:42:38');

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
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure for view `billing_slips`
--
DROP TABLE IF EXISTS `billing_slips`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `billing_slips`  AS SELECT `b`.`billing_id` AS `billing_id`, `v`.`visit_id` AS `visit_id`, `p`.`patient_id` AS `patient_id`, `p`.`full_name` AS `patient_name`, `p`.`philhealth_id` AS `philhealth_id`, `d`.`staff_id` AS `doctor_id`, `d`.`full_name` AS `doctor_name`, `b`.`total_amount` AS `total_amount`, `b`.`discount_amount` AS `discount_amount`, `b`.`final_amount` AS `final_amount`, `format_timestamp`(`b`.`billing_date`) AS `billing_date`, `format_timestamp`(`b`.`last_updated`) AS `last_updated`, `b`.`is_paid` AS `is_paid` FROM (((`billings` `b` join `visits` `v` on(`b`.`visit_id` = `v`.`visit_id`)) join `patients` `p` on(`v`.`patient_id` = `p`.`patient_id`)) join `staff_profiles` `d` on(`v`.`doctor_id` = `d`.`staff_id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `medical_abstract_details`
--
DROP TABLE IF EXISTS `medical_abstract_details`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `medical_abstract_details`  AS SELECT `ma`.`abstract_id` AS `abstract_id`, `p`.`patient_id` AS `patient_id`, `p`.`full_name` AS `patient_name`, `p`.`philhealth_id` AS `philhealth_id`, `d`.`full_name` AS `doctor_name`, `d`.`specialty` AS `doctor_specialty`, `format_timestamp`(`ma`.`created_at`) AS `created_at`, `ma`.`diagnosis` AS `diagnosis`, `ma`.`treatments_summary` AS `treatments_summary`, `ma`.`payment_status` AS `payment_status` FROM ((`medical_abstracts` `ma` join `patients` `p` on(`ma`.`patient_id` = `p`.`patient_id`)) join `staff_profiles` `d` on(`ma`.`doctor_id` = `d`.`staff_id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `patient_visit_history`
--
DROP TABLE IF EXISTS `patient_visit_history`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `patient_visit_history`  AS SELECT `v`.`visit_id` AS `visit_id`, `p`.`patient_id` AS `patient_id`, `p`.`full_name` AS `patient_name`, `d`.`full_name` AS `doctor_name`, `format_timestamp`(`v`.`visit_date`) AS `visit_date`, `v`.`visit_purpose` AS `visit_purpose`, `v`.`diagnosis` AS `diagnosis`, `v`.`visit_status` AS `visit_status`, `format_timestamp`(`b`.`billing_date`) AS `billing_date`, `b`.`total_amount` AS `total_amount`, `b`.`discount_amount` AS `discount_amount`, `b`.`final_amount` AS `final_amount`, `b`.`is_paid` AS `is_paid` FROM (((`visits` `v` join `patients` `p` on(`v`.`patient_id` = `p`.`patient_id`)) join `staff_profiles` `d` on(`v`.`doctor_id` = `d`.`staff_id`)) left join `billings` `b` on(`v`.`visit_id` = `b`.`visit_id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `receipt_details`
--
DROP TABLE IF EXISTS `receipt_details`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `receipt_details`  AS SELECT `r`.`receipt_id` AS `receipt_id`, `r`.`billing_id` AS `billing_id`, `p`.`patient_id` AS `patient_id`, `p`.`full_name` AS `patient_name`, `p`.`philhealth_id` AS `philhealth_id`, `s`.`full_name` AS `billing_staff_name`, `r`.`receipt_number` AS `receipt_number`, `format_timestamp`(`r`.`issue_date`) AS `issue_date`, `r`.`payment_method` AS `payment_method`, `r`.`total_amount` AS `total_amount`, `r`.`discount_amount` AS `discount_amount`, `r`.`final_amount` AS `final_amount` FROM ((`receipts` `r` join `patients` `p` on(`r`.`patient_id` = `p`.`patient_id`)) join `staff_profiles` `s` on(`r`.`billing_staff_id` = `s`.`staff_id`)) ;

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
-- Indexes for table `medical_abstracts`
--
ALTER TABLE `medical_abstracts`
  ADD PRIMARY KEY (`abstract_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `visit_id` (`visit_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`patient_id`);

--
-- Indexes for table `receipts`
--
ALTER TABLE `receipts`
  ADD PRIMARY KEY (`receipt_id`),
  ADD UNIQUE KEY `receipt_number` (`receipt_number`),
  ADD KEY `billing_id` (`billing_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `billing_staff_id` (`billing_staff_id`);

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
  MODIFY `billing_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `medical_abstracts`
--
ALTER TABLE `medical_abstracts`
  MODIFY `abstract_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `patient_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `receipts`
--
ALTER TABLE `receipts`
  MODIFY `receipt_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `staff_profiles`
--
ALTER TABLE `staff_profiles`
  MODIFY `staff_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `treatments`
--
ALTER TABLE `treatments`
  MODIFY `treatment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `visits`
--
ALTER TABLE `visits`
  MODIFY `visit_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `visit_treatments`
--
ALTER TABLE `visit_treatments`
  MODIFY `visit_treatment_id` int(11) NOT NULL AUTO_INCREMENT;

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
-- Constraints for table `medical_abstracts`
--
ALTER TABLE `medical_abstracts`
  ADD CONSTRAINT `medical_abstracts_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `medical_abstracts_ibfk_2` FOREIGN KEY (`visit_id`) REFERENCES `visits` (`visit_id`),
  ADD CONSTRAINT `medical_abstracts_ibfk_3` FOREIGN KEY (`doctor_id`) REFERENCES `staff_profiles` (`staff_id`);

--
-- Constraints for table `receipts`
--
ALTER TABLE `receipts`
  ADD CONSTRAINT `receipts_ibfk_1` FOREIGN KEY (`billing_id`) REFERENCES `billings` (`billing_id`),
  ADD CONSTRAINT `receipts_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `receipts_ibfk_3` FOREIGN KEY (`billing_staff_id`) REFERENCES `staff_profiles` (`staff_id`);

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
