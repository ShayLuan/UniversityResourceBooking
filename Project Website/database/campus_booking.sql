-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: campus_booking
-- ------------------------------------------------------
-- Server version	8.0.44

--
-- Table structure for main table 'campus_bookings'
--

DROP DATABASE IF EXISTS `campus_bookings`;
CREATE DATABASE `campus_bookings`;
USE campus_booking;



DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `resources`;


-- 
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'student',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
-- 

INSERT INTO `users` VALUES 
(1,'Test Name','test@abc.com','asdf','student'),
(3,'User Two','test2@abc.com','asdf','student'),
(7,'User Three','u3@abc.com','$2b$10$GVsTEy79AsneqsmQ5LD3K.cCQJbuOGRbrv9Q.FARCyqZ8g6JIVmQK','student');



-- 
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `resource` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `time` varchar(50) NOT NULL,
  `duration` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `bookings`
-- 

INSERT INTO `bookings` VALUES (4,7,'event-spaces','2025-11-20','8:30 AM',90,'2025-11-17 17:06:22');



-- 
-- Table structure for table 'resources' 
--

CREATE TABLE `resources` (
`id` INT AUTO_INCREMENT PRIMARY KEY,
`name` VARCHAR(100) NOT NULL,
`category` VARCHAR(100) NOT NULL,
`description` TEXT,
`location` VARCHAR(255),
`capacity` INT,
`image_url` VARCHAR(255)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `resources`
--

INSERT INTO resources (name, category, description, location, capacity, image_url) VALUES
-- study Rooms
('Study Room A', 'Study Room', 'Quiet room for individual study', 'Library 2nd floor', 4, NULL),
('Study Room B', 'Study Room', 'Small group study room', 'Library 3rd floor', 6, NULL),
('Study Room C', 'Study Room', 'Private study area', 'Library 1st floor', 2, NULL),

-- computer Labs
('Computer Lab 1', 'Computer Lab', 'Lab with specialized software', 'Engineering Building - Room 201', 30, NULL),
('Computer Lab 2', 'Computer Lab', 'Mac and Linux lab', 'Engineering Building - Room 305', 25, NULL),
('Computer Lab 3', 'Computer Lab', 'Windows high-performance lab', 'Engineering Building - Room 112', 28, NULL),

-- sports Facilities
('Gymnasium', 'Sports Facility', 'Full-size gymnasium', 'Sports Complex 1', 100, NULL),
('Fitness Center', 'Sports Facility', 'Gym + Cardio equipment', 'Sports Complex 2', 40, NULL),
('Indoor Court', 'Sports Facility', 'Indoor basketball/volleyball court', 'Sports Complex 3', 20, NULL),

-- Event Spaces
('Event Space A', 'Event Space', 'Large multi-purpose event space', 'Hall A', 120, NULL),
('Event Space B', 'Event Space', 'Medium-sized presentation room', 'Hall B', 80, NULL),

-- Library Resources
('Library Study Pods', 'Library Resource', 'Small private pods for studying', 'Library Lower Level', 1, NULL),
('Media Room', 'Library Resource', 'Room with media equipment', 'Library Mezzanine', 5, NULL),
('Quiet Reading Room', 'Library Resource', 'Silent reading-only room', 'Library West Wing', 30, NULL);
