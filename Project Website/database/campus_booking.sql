-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: campus_booking
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `resource` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `time` varchar(50) NOT NULL,
  `duration` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (1,2,'event space a','2025-11-20','8:30 AM',90,'2025-11-17 22:06:22','2025-11-20 08:30:00','2025-11-20 10:00:00');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resources`
--

DROP TABLE IF EXISTS `resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resources` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` text,
  `location` varchar(255) DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `suspended` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resources`
--

LOCK TABLES `resources` WRITE;
/*!40000 ALTER TABLE `resources` DISABLE KEYS */;
INSERT INTO `resources` VALUES (8,'Study Room A','Study Room','Quiet room for individual study','Library 2nd floor',4,NULL,0),(9,'Study Room B','Study Room','Small group study room','Library 3rd floor',6,NULL,0),(10,'Study Room C','Study Room','Private study area','Library 1st floor',2,NULL,0),(11,'Computer Lab 1','Computer Lab','Lab with specialized software','Engineering Building - Room 201',30,NULL,0),(12,'Computer Lab 2','Computer Lab','Mac and Linux lab','Engineering Building - Room 305',25,NULL,0),(13,'Computer Lab 3','Computer Lab','Windows high-performance lab','Engineering Building - Room 112',28,NULL,0),(14,'Gymnasium','Sports Facility','Full-size gymnasium','Sports Complex 1',100,NULL,0),(15,'Fitness Center','Sports Facility','Gym + Cardio equipment','Sports Complex 2',40,NULL,0),(16,'Indoor Court','Sports Facility','Indoor basketball/volleyball court','Sports Complex 3',20,NULL,0),(17,'Event Space A','Event Space','Large multi-purpose event space','Hall A',120,NULL,0),(18,'Event Space B','Event Space','Medium-sized presentation room','Hall B',80,NULL,0),(19,'Library Study Pods','Library Resource','Small private pods for studying','Library Lower Level',1,NULL,0),(20,'Media Room','Library Resource','Room with media equipment','Library Mezzanine',5,NULL,0),(21,'Quiet Reading Room','Library Resource','Silent reading-only room','Library West Wing',30,NULL,0),(22,'New Library Resource WOW','Library Resource',NULL,NULL,NULL,NULL,0),(23,'Another New One!','Library Resource',NULL,NULL,NULL,NULL,1);
/*!40000 ALTER TABLE `resources` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'student',
  `phone_number` varchar(20) DEFAULT NULL,
  `home_address` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Dr.Jeff','jeff@abc.com','asdf','faculty',NULL,NULL,NULL,NULL),(2,'User Three','u3@abc.com','$2b$10$GVsTEy79AsneqsmQ5LD3K.cCQJbuOGRbrv9Q.FARCyqZ8g6JIVmQK','student',NULL,NULL,NULL,NULL),(3,'Test Name','test@abc.com','asdf','student',NULL,NULL,NULL,NULL),(7,'Admin','booking_admin@abc.com','$2b$10$7PVUsZYJLSysBdBt54csz.yvyCXO1lgiNL8fDWb7gS0jGRau/..7W','admin',NULL,NULL,'5147897897','1234 Concordia');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-23 14:20:23
