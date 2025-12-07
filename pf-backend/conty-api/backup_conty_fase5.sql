-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: conty
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ar_transactions`
--

DROP TABLE IF EXISTS `ar_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ar_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `org_id` int DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `customer_id` int NOT NULL,
  `trx_date` datetime NOT NULL,
  `type` enum('INVOICE','CREDIT_NOTE','PAYMENT','ADJUSTMENT') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `currency` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ARS',
  `fx_rate` decimal(12,6) NOT NULL DEFAULT '1.000000',
  `description` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ref_doc_id` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source_type` enum('INVOICE','CREDIT_NOTE','PAYMENT','ADJUSTMENT') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source_id` int DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_artrx_customer_date` (`customer_id`,`trx_date`,`is_deleted`),
  KEY `idx_artrx_source` (`source_type`,`source_id`,`is_deleted`),
  KEY `idx_artrx_org_branch` (`org_id`,`branch_id`,`is_deleted`),
  KEY `fk_artrx_branch` (`branch_id`),
  CONSTRAINT `ar_transactions_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_artrx_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_artrx_org` FOREIGN KEY (`org_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ar_transactions`
--

LOCK TABLES `ar_transactions` WRITE;
/*!40000 ALTER TABLE `ar_transactions` DISABLE KEYS */;
INSERT INTO `ar_transactions` VALUES (1,3,2,1,'2025-10-24 10:20:29','INVOICE',6050.00,'ARS',1.000000,'Venta FB-0001-00000001','FB-0001-00000001','INVOICE',5,NULL,'2025-10-24 10:20:29',0,NULL),(2,3,2,1,'2025-10-24 11:06:36','INVOICE',6050.00,'ARS',1.000000,'Venta FB-0001-00000002','FB-0001-00000002','INVOICE',8,NULL,'2025-10-24 11:06:36',0,NULL),(3,4,3,1,'2025-10-24 12:54:24','INVOICE',14520.00,'ARS',1.000000,'Venta FB-0001-00000001','FB-0001-00000001','INVOICE',10,NULL,'2025-10-24 12:54:24',0,NULL),(5,4,3,4,'2025-10-24 19:19:59','INVOICE',65340.00,'ARS',1.000000,'Venta FA-0001-00000001 (de PRES)','FA-0001-00000001','INVOICE',13,NULL,'2025-10-24 19:19:59',0,NULL),(6,4,3,4,'2025-11-11 22:09:13','INVOICE',11495.00,'ARS',1.000000,'Venta FB-0001-00000002','FB-0001-00000002','INVOICE',19,NULL,'2025-11-11 22:09:13',0,NULL),(7,4,3,4,'2025-11-11 22:09:42','INVOICE',11495.00,'ARS',1.000000,'Venta FB-0001-00000003','FB-0001-00000003','INVOICE',20,NULL,'2025-11-11 22:09:42',0,NULL),(8,4,3,4,'2025-11-13 22:28:46','INVOICE',11495.00,'ARS',1.000000,'Venta FB-0001-00000004','FB-0001-00000004','INVOICE',21,NULL,'2025-11-13 22:28:46',0,NULL),(9,4,3,4,'2025-11-13 22:34:50','INVOICE',5445.00,'ARS',1.000000,'Venta FB-0001-00000005','FB-0001-00000005','INVOICE',22,NULL,'2025-11-13 22:34:50',0,NULL),(10,4,3,4,'2025-11-13 22:55:07','INVOICE',22385.00,'ARS',1.000000,'Venta FB-0001-00000006','FB-0001-00000006','INVOICE',23,NULL,'2025-11-13 22:55:07',0,NULL),(11,4,3,4,'2025-11-13 22:58:40','INVOICE',33880.00,'ARS',1.000000,'Venta FB-0001-00000007','FB-0001-00000007','INVOICE',24,NULL,'2025-11-13 22:58:40',0,NULL),(12,4,3,4,'2025-11-13 23:17:13','INVOICE',16335.00,'ARS',1.000000,'Venta FB-0001-00000008','FB-0001-00000008','INVOICE',25,NULL,'2025-11-13 23:17:13',0,NULL),(13,4,3,4,'2025-11-14 19:08:37','INVOICE',22990.00,'ARS',1.000000,'Venta FB-0001-00000009','FB-0001-00000009','INVOICE',26,NULL,'2025-11-14 19:08:37',0,NULL),(14,4,3,4,'2025-11-15 23:34:01','INVOICE',10890.00,'ARS',1.000000,'Venta FB-0001-00000010','FB-0001-00000010','INVOICE',27,NULL,'2025-11-15 23:34:01',0,NULL),(15,4,3,4,'2025-11-15 23:36:30','INVOICE',10890.00,'ARS',1.000000,'Venta FB-0001-00000011','FB-0001-00000011','INVOICE',28,NULL,'2025-11-15 23:36:30',0,NULL),(16,4,3,4,'2025-11-15 23:49:12','INVOICE',10890.00,'ARS',1.000000,'Venta FB-0001-00000012','FB-0001-00000012','INVOICE',29,NULL,'2025-11-15 23:49:12',0,NULL),(17,4,3,4,'2025-11-16 00:06:20','INVOICE',10890.00,'ARS',1.000000,'Venta FB-0001-00000013','FB-0001-00000013','INVOICE',30,NULL,'2025-11-16 00:06:20',0,NULL),(18,4,3,9,'2025-11-22 00:46:47','INVOICE',5445.00,'ARS',1.000000,'Venta FB-0001-00000014','FB-0001-00000014','INVOICE',31,NULL,'2025-11-22 00:46:47',0,NULL),(19,4,3,4,'2025-11-22 00:47:30','INVOICE',32670.00,'ARS',1.000000,'Venta FB-0001-00000015','FB-0001-00000015','INVOICE',32,NULL,'2025-11-22 00:47:30',0,NULL),(20,4,3,7,'2025-11-24 13:24:05','INVOICE',5445.00,'ARS',1.000000,'Venta FA-0001-00000002 (de PRES)','FA-0001-00000002','INVOICE',33,NULL,'2025-11-24 13:24:05',0,NULL),(21,4,3,9,'2025-11-24 13:31:14','INVOICE',16940.00,'ARS',1.000000,'Venta FB-0001-00000016 (de PRES)','FB-0001-00000016','INVOICE',34,NULL,'2025-11-24 13:31:14',0,NULL),(22,4,3,9,'2025-11-24 13:40:35','INVOICE',11495.00,'ARS',1.000000,'Venta FB-0001-00000017 (de PRES)','FB-0001-00000017','INVOICE',35,NULL,'2025-11-24 13:40:35',0,NULL),(23,4,3,9,'2025-11-24 13:41:09','INVOICE',11495.00,'ARS',1.000000,'Venta FB-0001-00000018 (de PRES)','FB-0001-00000018','INVOICE',36,NULL,'2025-11-24 13:41:09',0,NULL),(24,4,3,4,'2025-11-24 13:51:26','INVOICE',11495.00,'ARS',1.000000,'Venta FB-0001-00000019 (de PRES)','FB-0001-00000019','INVOICE',37,NULL,'2025-11-24 13:51:26',0,NULL),(25,6,6,13,'2025-11-25 12:39:36','INVOICE',2904000.00,'ARS',1.000000,'Venta {TIPO}-0001-00000001 (de PRES)','{TIPO}-0001-00000001','INVOICE',38,NULL,'2025-11-25 12:39:36',0,NULL),(26,6,6,14,'2025-11-25 12:41:59','INVOICE',1452000.00,'ARS',1.000000,'Venta {TIPO}-0001-00000001','{TIPO}-0001-00000001','INVOICE',39,NULL,'2025-11-25 12:41:59',0,NULL),(27,6,6,13,'2025-11-27 22:33:07','INVOICE',1452000.00,'ARS',1.000000,'Venta {TIPO}-0001-00000002 (de PRES)','{TIPO}-0001-00000002','INVOICE',40,NULL,'2025-11-27 22:33:07',0,NULL),(28,6,6,14,'2025-11-28 17:37:16','INVOICE',1452000.00,'ARS',1.000000,'Venta {TIPO}-0001-00000002','{TIPO}-0001-00000002','INVOICE',41,NULL,'2025-11-28 17:37:16',0,NULL),(29,6,6,14,'2025-11-28 17:47:41','INVOICE',1452000.00,'ARS',1.000000,'Venta {TIPO}-0001-00000003','{TIPO}-0001-00000003','INVOICE',42,NULL,'2025-11-28 17:47:41',0,NULL),(30,6,6,13,'2025-11-28 18:31:01','INVOICE',1452000.00,'ARS',1.000000,'Venta {TIPO}-0001-00000003','{TIPO}-0001-00000003','INVOICE',43,NULL,'2025-11-28 18:31:01',0,NULL),(31,6,6,14,'2025-12-06 14:04:27','INVOICE',1452000.00,'ARS',1.000000,'Venta {TIPO}-0001-00000004','{TIPO}-0001-00000004','INVOICE',44,NULL,'2025-12-06 14:04:27',0,NULL),(32,6,6,14,'2025-12-06 14:13:43','INVOICE',1452000.00,'ARS',1.000000,'Venta {TIPO}-0001-00000005','{TIPO}-0001-00000005','INVOICE',45,NULL,'2025-12-06 14:13:43',0,NULL);
/*!40000 ALTER TABLE `ar_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `org_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `action_type` enum('CREATE','UPDATE','DELETE','LOGIN_SUCCESS','LOGIN_FAIL','RESET_PASSWORD','SET_PASSWORD','IMPORT','EXPORT','CONVERT_QUOTE','CANCEL_SALE','APPROVE_INVENTORY','RECEIVE_TRANSFER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `details_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_org_user` (`org_id`,`user_id`),
  KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  KEY `fk_audit_user` (`user_id`),
  CONSTRAINT `fk_audit_org` FOREIGN KEY (`org_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=102 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES (1,5,10,'CREATE','PRODUCT',31,'{\"sku\": \"111111\", \"cost\": 0, \"name\": \"test2\", \"price\": 1}','2025-11-24 15:21:34'),(2,5,10,'CREATE','PRODUCT_VARIANT',35,'{\"sku\": \"111111\", \"name\": null, \"productId\": 31}','2025-11-24 15:21:34'),(3,4,9,'CREATE','INVENTORY_SESSION',3,'{\"branchId\": 3, \"itemsPrefilled\": 5}','2025-11-24 20:06:23'),(4,NULL,1,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"admin\"}','2025-11-24 20:13:37'),(5,NULL,1,'CREATE','USER',15,'{\"roleId\": 2, \"context\": \"RegisterUser\", \"username\": \"owner_test\"}','2025-11-24 20:14:46'),(6,NULL,15,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"owner_test\"}','2025-11-24 20:15:45'),(7,6,15,'CREATE','ORGANIZATION',6,'{\"taxId\": \"20-11223344-5\", \"legalName\": \"Mi Negocio de Prueba SA\"}','2025-11-24 20:29:26'),(8,6,15,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"owner_test\"}','2025-11-24 20:31:38'),(9,6,15,'CREATE','BRANCH',5,'{\"name\": \"Local Centro\", \"channel\": \"LOCAL\"}','2025-11-24 20:44:46'),(10,6,15,'CREATE','BRANCH',6,'{\"name\": \"Depósito General\", \"channel\": \"LOCAL\"}','2025-11-24 20:45:03'),(11,6,15,'CREATE','PAYMENT_METHOD',6,'{\"kind\": \"CASH\", \"name\": \"Efectivo\"}','2025-11-24 20:46:35'),(12,6,15,'CREATE','PAYMENT_METHOD',7,'{\"kind\": \"CREDIT\", \"name\": \"Tarjeta Crédito\"}','2025-11-24 20:47:12'),(13,6,15,'UPDATE','NUMBERING_RULE',NULL,'{\"format\": \"{TIPO}-{PV}-{NUM}\", \"docType\": \"INVOICE_B\"}','2025-11-24 20:49:42'),(14,NULL,NULL,'UPDATE','USER_BRANCHES',16,'{\"assignedBranchIds\": [5, 6]}','2025-11-24 20:53:22'),(15,6,16,'SET_PASSWORD','USER',16,'{\"context\": \"Invitation activation\", \"username\": \"ana_vend\"}','2025-11-24 20:55:24'),(16,6,15,'CREATE','CATEGORY',24,'{\"name\": \"Tecnología\"}','2025-11-24 21:01:26'),(17,6,15,'CREATE','SUBCATEGORY',22,'{\"name\": \"Celulares\", \"parentCategoryId\": 24}','2025-11-24 21:01:38'),(18,6,15,'CREATE','PRODUCT',32,'{\"sku\": \"S24-ULTRA\", \"cost\": 800000, \"name\": \"Samsung Galaxy S24\", \"price\": 1200000}','2025-11-24 21:08:20'),(19,6,15,'CREATE','PRODUCT_VARIANT',36,'{\"sku\": \"S24-ULTRA\", \"name\": null, \"productId\": 32}','2025-11-24 21:08:20'),(20,NULL,NULL,'LOGIN_FAIL',NULL,NULL,'{\"reason\": \"User not found\", \"usernameAttempt\": \"ana.vend\"}','2025-11-24 22:34:05'),(21,6,16,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"ana_vend\"}','2025-11-24 22:34:10'),(22,6,15,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"owner_test\"}','2025-11-24 22:39:38'),(23,6,15,'CREATE','PRICE_LIST',7,'{\"name\": \"General\", \"isDefault\": false}','2025-11-24 22:40:01'),(24,6,15,'UPDATE','PRICE_LIST',7,'{\"updatedFields\": [\"is_default\"]}','2025-11-24 22:40:10'),(25,6,16,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"ana_vend\"}','2025-11-24 22:40:25'),(26,6,16,'CREATE','CUSTOMER',13,'{\"name\": \"Empresa Cliente SA\", \"email\": \"compras@cliente.com\", \"taxId\": \"30-11223344-5\"}','2025-11-24 22:41:54'),(27,6,15,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"owner_test\"}','2025-11-24 22:45:59'),(28,6,15,'UPDATE','NUMBERING_RULE',NULL,'{\"format\": \"{TIPO}-{PV}-{NUM}\", \"docType\": \"QUOTE\"}','2025-11-24 22:46:10'),(29,6,16,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"ana_vend\"}','2025-11-24 22:46:28'),(30,6,16,'CREATE','QUOTE',11,'{\"total\": 1200000, \"docNumber\": \"{TIPO}-0001-00000001\", \"customerId\": 13}','2025-11-24 22:47:14'),(31,6,16,'UPDATE','QUOTE',11,'{\"updatedFields\": [\"customerId\", \"branchId\", \"sellerId\", \"items\", \"validUntil\", \"note\"]}','2025-11-24 22:48:00'),(32,6,15,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"owner_test\"}','2025-11-24 22:54:36'),(33,6,16,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"ana_vend\"}','2025-11-24 22:57:09'),(34,4,9,'LOGIN_FAIL',NULL,NULL,'{\"reason\": \"Invalid credentials\", \"usernameAttempt\": \"ana.gomez\"}','2025-11-25 12:28:22'),(35,6,16,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"ana_vend\"}','2025-11-25 12:28:28'),(36,6,16,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"ana_vend\"}','2025-11-25 12:33:16'),(37,6,16,'CREATE','QUOTE',12,'{\"total\": 1200000, \"docNumber\": \"{TIPO}-0001-00000002\", \"customerId\": 13}','2025-11-25 12:34:53'),(38,6,15,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"owner_test\"}','2025-11-25 12:38:32'),(39,6,15,'UPDATE','NUMBERING_RULE',NULL,'{\"format\": \"{TIPO}-{PV}-{NUM}\", \"docType\": \"INVOICE_A\"}','2025-11-25 12:38:43'),(40,6,15,'UPDATE','NUMBERING_RULE',NULL,'{\"format\": \"{REM}-{PV}-{NUM}\", \"docType\": \"REMITO\"}','2025-11-25 12:38:58'),(41,6,15,'UPDATE','NUMBERING_RULE',NULL,'{\"format\": \"{TK}-{PV}-{NUM}\", \"docType\": \"TICKET\"}','2025-11-25 12:39:12'),(42,6,16,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"ana_vend\"}','2025-11-25 12:39:24'),(43,6,16,'CONVERT_QUOTE','QUOTE',11,'{\"total\": 2904000, \"newSaleId\": 38, \"newSaleDocNumber\": \"{TIPO}-0001-00000001\"}','2025-11-25 12:39:36'),(44,6,16,'CREATE','CUSTOMER',14,'{\"name\": \"Consumidor Final\", \"context\": \"Auto-created during sale/quote\"}','2025-11-25 12:41:59'),(45,6,16,'CREATE','SALE',39,'{\"total\": 1452000, \"docNumber\": \"{TIPO}-0001-00000001\", \"customerId\": 14, \"itemsCount\": 1}','2025-11-25 12:41:59'),(46,6,15,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"owner_test\"}','2025-11-25 12:43:30'),(47,6,16,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"ana_vend\"}','2025-11-27 22:31:52'),(48,6,16,'CREATE','QUOTE',13,'{\"total\": 1200000, \"docNumber\": \"{TIPO}-0001-00000003\", \"customerId\": 13}','2025-11-27 22:32:48'),(49,6,16,'CONVERT_QUOTE','QUOTE',13,'{\"total\": 1452000, \"newSaleId\": 40, \"newSaleDocNumber\": \"{TIPO}-0001-00000002\"}','2025-11-27 22:33:07'),(50,6,16,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"ana_vend\"}','2025-11-27 22:51:59'),(51,6,16,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"ana_vend\"}','2025-11-27 22:52:41'),(52,4,9,'LOGIN_FAIL',NULL,NULL,'{\"reason\": \"Invalid credentials\", \"usernameAttempt\": \"ana.gomez\"}','2025-11-27 22:57:38'),(53,4,9,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"ana.gomez\"}','2025-11-27 22:57:42'),(54,6,15,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"owner_test\"}','2025-11-27 22:59:38'),(55,6,15,'UPDATE','ORGANIZATION',6,'{\"updatedFields\": [\"legal_name\", \"tax_id\", \"tax_condition\", \"address\", \"sender_email\"]}','2025-11-27 23:00:04'),(56,6,15,'UPDATE','ORGANIZATION',6,'{\"updatedFields\": [\"legal_name\", \"tax_id\", \"tax_condition\", \"address\", \"sender_email\"]}','2025-11-27 23:00:24'),(57,6,15,'UPDATE','ORGANIZATION',6,'{\"updatedFields\": [\"legal_name\", \"tax_id\", \"tax_condition\", \"address\", \"sender_email\"]}','2025-11-27 23:00:27'),(58,6,15,'UPDATE','ORGANIZATION',6,'{\"updatedFields\": [\"primary_color\", \"secondary_color\", \"logo_url\"]}','2025-11-28 00:04:40'),(59,6,15,'UPDATE','ORGANIZATION',6,'{\"updatedFields\": [\"primary_color\", \"secondary_color\", \"logo_url\"]}','2025-11-28 00:06:41'),(60,6,15,'UPDATE','ORGANIZATION',6,'{\"updatedFields\": [\"primary_color\", \"secondary_color\", \"logo_url\"]}','2025-11-28 00:06:59'),(61,6,16,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"ana_vend\"}','2025-11-28 00:07:27'),(62,6,15,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"owner_test\"}','2025-11-28 00:07:36'),(63,6,15,'UPDATE','ORGANIZATION',6,'{\"updatedFields\": [\"primary_color\", \"secondary_color\", \"logo_url\"]}','2025-11-28 00:20:29'),(64,6,15,'UPDATE','ORGANIZATION',6,'{\"updatedFields\": [\"primary_color\", \"secondary_color\", \"logo_url\"]}','2025-11-28 00:31:04'),(65,6,15,'UPDATE','ORGANIZATION',6,'{\"updatedFields\": [\"primary_color\", \"secondary_color\", \"logo_url\"]}','2025-11-28 00:31:49'),(66,6,15,'UPDATE','ORGANIZATION',6,'{\"updatedFields\": [\"primary_color\", \"secondary_color\", \"logo_url\"]}','2025-11-28 10:10:09'),(67,NULL,1,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"admin\"}','2025-11-28 15:31:23'),(68,6,15,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"owner_test\"}','2025-11-28 15:31:36'),(69,6,15,'UPDATE','ORGANIZATION',6,'{\"updatedFields\": [\"primary_color\", \"secondary_color\", \"logo_url\"]}','2025-11-28 15:36:50'),(70,6,16,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"ana_vend\"}','2025-11-28 17:36:58'),(71,6,16,'CREATE','SALE',41,'{\"total\": 1452000, \"docNumber\": \"{TIPO}-0001-00000002\", \"customerId\": 14, \"itemsCount\": 1}','2025-11-28 17:37:16'),(72,6,15,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"owner_test\"}','2025-11-28 17:41:11'),(73,6,16,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"ana_vend\"}','2025-11-28 17:43:43'),(74,6,16,'CREATE','SALE',42,'{\"total\": 1452000, \"docNumber\": \"{TIPO}-0001-00000003\", \"customerId\": 14, \"itemsCount\": 1}','2025-11-28 17:47:41'),(75,6,15,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"owner_test\"}','2025-11-28 17:48:42'),(76,NULL,1,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"admin\"}','2025-11-28 17:51:03'),(77,NULL,1,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"admin\"}','2025-11-28 18:25:31'),(78,NULL,1,'CREATE','USER',17,'{\"roleId\": 2, \"context\": \"RegisterUser\", \"username\": \"elfacu\"}','2025-11-28 18:26:12'),(79,NULL,17,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"elfacu\"}','2025-11-28 18:26:25'),(80,6,15,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"owner_test\"}','2025-11-28 18:27:38'),(81,6,15,'UPDATE','ORGANIZATION',6,'{\"updatedFields\": [\"primary_color\", \"secondary_color\", \"logo_url\"]}','2025-11-28 18:28:33'),(82,6,16,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"ana_vend\"}','2025-11-28 18:29:29'),(83,6,16,'CREATE','SALE',43,'{\"total\": 1452000, \"docNumber\": \"{TIPO}-0001-00000003\", \"customerId\": 13, \"itemsCount\": 1}','2025-11-28 18:31:01'),(84,6,16,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"ana_vend\"}','2025-12-06 13:57:28'),(85,6,15,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"owner_test\"}','2025-12-06 13:58:08'),(86,6,16,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"ana_vend\"}','2025-12-06 13:58:58'),(87,6,16,'CREATE','SALE',44,'{\"total\": 1452000, \"docNumber\": \"{TIPO}-0001-00000004\", \"customerId\": 14, \"itemsCount\": 1}','2025-12-06 14:04:27'),(88,6,16,'CREATE','SALE',45,'{\"total\": 1452000, \"docNumber\": \"{TIPO}-0001-00000005\", \"customerId\": 14, \"itemsCount\": 1}','2025-12-06 14:13:43'),(89,6,16,'DELETE','PRODUCT',32,NULL,'2025-12-06 14:24:34'),(90,6,16,'CREATE','PRODUCT',33,'{\"sku\": \"123\", \"cost\": 149999, \"name\": \"nokia\", \"price\": 200000}','2025-12-06 14:55:24'),(91,6,16,'CREATE','PRODUCT_VARIANT',37,'{\"sku\": \"123\", \"name\": null, \"productId\": 33}','2025-12-06 14:55:24'),(92,6,16,'CREATE','PRODUCT',34,'{\"sku\": \"motoedge50\", \"cost\": 800000, \"name\": \"Motolora Edge 50\", \"price\": 1000000}','2025-12-06 15:06:56'),(93,6,16,'CREATE','PRODUCT_VARIANT',38,'{\"sku\": \"motoedge50\", \"name\": null, \"productId\": 34}','2025-12-06 15:06:56'),(94,6,16,'UPDATE','CUSTOMER',13,'{\"updatedFields\": [\"status\"]}','2025-12-06 15:40:44'),(95,6,16,'UPDATE','CUSTOMER',13,'{\"updatedFields\": [\"status\"]}','2025-12-06 15:40:46'),(96,6,16,'UPDATE','CUSTOMER',13,'{\"updatedFields\": [\"status\"]}','2025-12-06 15:40:47'),(97,6,16,'UPDATE','CUSTOMER',13,'{\"updatedFields\": [\"status\"]}','2025-12-06 15:40:51'),(98,NULL,1,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"admin\"}','2025-12-07 00:49:17'),(99,NULL,1,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"admin\"}','2025-12-07 00:59:52'),(100,6,16,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"ana_vend\"}','2025-12-07 01:47:18'),(101,4,9,'LOGIN_SUCCESS',NULL,NULL,'{\"username\": \"ana.gomez\"}','2025-12-07 01:47:28');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branch_variant_stock`
--

DROP TABLE IF EXISTS `branch_variant_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branch_variant_stock` (
  `branch_id` int NOT NULL,
  `variant_id` int NOT NULL,
  `qty` int NOT NULL DEFAULT '0',
  `min_qty` int NOT NULL DEFAULT '0',
  `max_qty` int DEFAULT NULL,
  PRIMARY KEY (`branch_id`,`variant_id`),
  KEY `idx_bvs_variant` (`variant_id`),
  CONSTRAINT `fk_bvs_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_bvs_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branch_variant_stock`
--

LOCK TABLES `branch_variant_stock` WRITE;
/*!40000 ALTER TABLE `branch_variant_stock` DISABLE KEYS */;
INSERT INTO `branch_variant_stock` VALUES (2,1,48,0,NULL),(3,27,3,0,NULL),(3,28,20,0,NULL),(3,29,12,0,NULL),(3,30,7,0,NULL),(3,31,15,0,NULL),(6,36,11,0,NULL),(6,38,50,0,NULL);
/*!40000 ALTER TABLE `branch_variant_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `org_id` int NOT NULL,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pos_code` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `channel` enum('LOCAL','ONLINE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'LOCAL',
  `printer_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `printer_code` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`),
  KEY `idx_branches_org` (`org_id`,`is_deleted`),
  KEY `idx_branches_pos_code` (`pos_code`),
  CONSTRAINT `fk_branches_org` FOREIGN KEY (`org_id`) REFERENCES `organizations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES (1,1,'Sucursal Principal',NULL,NULL,NULL,'2025-10-02 16:33:00',0,NULL,'LOCAL',NULL,NULL,'ACTIVE'),(2,3,'Sucursal Centro','Calle Falsa 123, CABA','11-4444-5555',NULL,'2025-10-23 20:15:54',0,NULL,'LOCAL',NULL,NULL,'ACTIVE'),(3,4,'Sucursal Unica','Avenida Falsa 456',NULL,NULL,'2025-10-24 12:11:14',0,NULL,'LOCAL',NULL,NULL,'ACTIVE'),(4,5,'Sucursal 1','Calle Falsa 1234',NULL,NULL,'2025-11-23 10:00:49',0,NULL,'LOCAL','',NULL,'ACTIVE'),(5,6,'Local Centro','Calle 123',NULL,NULL,'2025-11-24 20:44:46',0,NULL,'LOCAL',NULL,NULL,'ACTIVE'),(6,6,'Depósito General','Acceso Oeste',NULL,NULL,'2025-11-24 20:45:03',0,NULL,'LOCAL',NULL,NULL,'ACTIVE');
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `org_id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cat_org_active` (`org_id`,`name`,`is_deleted`),
  KEY `idx_cat_org` (`org_id`,`is_deleted`),
  CONSTRAINT `fk_cat_org` FOREIGN KEY (`org_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,3,'Remeras',0,NULL),(19,4,'Ropa',0,NULL),(20,4,'Calzado',0,NULL),(21,4,'Accesorios',0,NULL),(22,4,'Test',0,NULL),(23,5,'Test',0,NULL),(24,6,'Tecnología',0,NULL);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_tags`
--

DROP TABLE IF EXISTS `customer_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_tags` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `tag_id` int NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ct_active` (`customer_id`,`tag_id`,`is_deleted`),
  KEY `idx_ct_customer` (`customer_id`,`is_deleted`),
  KEY `idx_ct_tag` (`tag_id`,`is_deleted`),
  CONSTRAINT `fk_ct_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ct_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_tags`
--

LOCK TABLES `customer_tags` WRITE;
/*!40000 ALTER TABLE `customer_tags` DISABLE KEYS */;
INSERT INTO `customer_tags` VALUES (1,1,1,0,NULL),(2,2,5,0,NULL),(3,2,6,0,NULL),(4,3,5,0,NULL),(5,3,6,0,NULL),(7,8,8,0,NULL),(8,11,8,0,NULL);
/*!40000 ALTER TABLE `customer_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `org_id` int DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_condition` enum('RI','MT','CF','EX') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CF',
  `price_list_id` int NOT NULL,
  `status` enum('ACTIVE','BLOCKED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `credit_limit` decimal(14,2) DEFAULT NULL,
  `payment_terms_days` int DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `last_purchase_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_customers_pricelist` (`price_list_id`),
  KEY `idx_customers_name` (`name`,`is_deleted`),
  KEY `idx_customers_taxid` (`tax_id`,`is_deleted`),
  KEY `idx_customers_status` (`status`,`is_deleted`),
  KEY `idx_customers_last_purchase` (`last_purchase_at`),
  KEY `idx_customers_org_branch` (`org_id`,`branch_id`,`is_deleted`),
  KEY `fk_customers_branch` (`branch_id`),
  CONSTRAINT `fk_customers_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_customers_org` FOREIGN KEY (`org_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_customers_pricelist` FOREIGN KEY (`price_list_id`) REFERENCES `price_lists` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,1,1,'test','11111111','test@example.com','2222222222','Calle Falsa 123','RI',1,'ACTIVE',NULL,NULL,'usuario de test',NULL,'2025-10-02 16:33:00',1,NULL,NULL,0,NULL),(2,4,NULL,'Cliente de la Org 4 SA','20-98765432-1','cliente.sa@org4.com','+54 9 11 1234-5678',NULL,'RI',1,'ACTIVE',NULL,NULL,NULL,NULL,'2025-10-24 12:59:46',8,'2025-10-24 18:29:24',8,1,'2025-10-24 18:29:24'),(3,4,NULL,'Cliente de la Org 4 SA','20-98765432-1','cliente.sa@org4.com','+54 9 11 1234-5668',NULL,'RI',1,'ACTIVE',NULL,NULL,NULL,NULL,'2025-10-24 12:59:56',8,'2025-10-24 18:30:54',8,1,'2025-10-24 18:30:54'),(4,4,NULL,'Consumidor Final',NULL,NULL,NULL,NULL,'CF',1,'ACTIVE',NULL,NULL,NULL,NULL,'2025-10-24 19:12:34',NULL,NULL,NULL,0,NULL),(7,4,NULL,'Cliente Mayorista A','20-11111111-1','compras@clientea.com','1155443322','Calle Falsa 123, CABA','RI',4,'ACTIVE',NULL,NULL,'VIP|Preferencial',NULL,'2025-10-31 18:24:36',8,NULL,NULL,0,NULL),(8,4,NULL,'Comercio Vecino','27-22222222-2','vecino@comercio.com','1199887766','Av. Corrientes 456','CF',4,'ACTIVE',NULL,NULL,'Paga en tÃ©rmino',NULL,'2025-10-31 18:24:36',8,NULL,NULL,0,NULL),(9,4,NULL,'Cliente Contado','30-33333333-3','contado@example.com',NULL,NULL,'CF',4,'ACTIVE',NULL,NULL,NULL,NULL,'2025-10-31 18:24:36',8,'2025-11-03 12:03:17',9,0,NULL),(10,4,NULL,'Cliente Mayorista A','20-11111111-1','compras@clientea.com','1155443322','Calle Falsa 123, CABA','RI',4,'ACTIVE',NULL,NULL,'VIP|Preferencial',NULL,'2025-10-31 18:48:15',8,NULL,NULL,0,NULL),(11,4,NULL,'Comercio Vecino','27-22222222-2','vecino@comercio.com','1199887766','Av. Corrientes 456','CF',4,'ACTIVE',NULL,NULL,'Paga en tÃ©rmino',NULL,'2025-10-31 18:48:15',8,NULL,NULL,0,NULL),(12,4,NULL,'Cliente Contado','30-33333333-3','contado@example.com',NULL,NULL,'CF',4,'ACTIVE',NULL,NULL,NULL,NULL,'2025-10-31 18:48:15',8,NULL,NULL,0,NULL),(13,6,NULL,'Empresa Cliente SA','30-11223344-5','compras@cliente.com','1123870566','Calle falsa 123','RI',7,'ACTIVE',NULL,NULL,NULL,NULL,'2025-11-24 22:41:54',16,'2025-12-06 15:40:51',16,0,NULL),(14,6,6,'Consumidor Final',NULL,NULL,NULL,NULL,'CF',1,'ACTIVE',NULL,NULL,NULL,NULL,'2025-11-25 12:41:59',16,NULL,NULL,0,NULL);
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doc_numbering_counters`
--

DROP TABLE IF EXISTS `doc_numbering_counters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doc_numbering_counters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `org_id` int NOT NULL,
  `doc_type` enum('INVOICE_A','INVOICE_B','REMITO','QUOTE','TICKET') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pos_code` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `period_key` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '*',
  `last_number` int NOT NULL DEFAULT '0',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_counter` (`org_id`,`doc_type`,`pos_code`,`period_key`),
  CONSTRAINT `fk_counter_org` FOREIGN KEY (`org_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doc_numbering_counters`
--

LOCK TABLES `doc_numbering_counters` WRITE;
/*!40000 ALTER TABLE `doc_numbering_counters` DISABLE KEYS */;
INSERT INTO `doc_numbering_counters` VALUES (1,1,'INVOICE_A','0001','*',0,'2025-10-17 19:49:17'),(2,1,'INVOICE_B','0001','*',0,'2025-10-17 19:49:17'),(3,1,'QUOTE','0001','2025',0,'2025-10-17 19:49:17'),(4,1,'REMITO','0001','*',0,'2025-10-17 19:49:17'),(5,1,'TICKET','0001','2025-10',0,'2025-10-17 19:49:17'),(12,3,'INVOICE_B','0001','*',2,'2025-10-24 11:06:36'),(17,4,'INVOICE_B','0001','*',19,'2025-11-24 13:51:26'),(19,4,'QUOTE','0001','2025',10,'2025-11-24 13:40:59'),(24,4,'INVOICE_A','0001','*',2,'2025-11-24 13:24:05'),(49,5,'TICKET','0001','*',0,'2025-11-23 10:41:57'),(59,6,'INVOICE_B','0001','*',5,'2025-12-06 14:13:43'),(60,6,'QUOTE','0001','*',3,'2025-11-27 22:32:48'),(63,6,'INVOICE_A','0001','*',3,'2025-11-28 18:31:01'),(64,6,'REMITO','0001','*',0,'2025-11-25 12:38:58'),(65,6,'TICKET','0001','*',0,'2025-11-25 12:39:12');
/*!40000 ALTER TABLE `doc_numbering_counters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doc_numbering_rules`
--

DROP TABLE IF EXISTS `doc_numbering_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doc_numbering_rules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `org_id` int NOT NULL,
  `doc_type` enum('INVOICE_A','INVOICE_B','REMITO','QUOTE','TICKET') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `format` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `next_number` int NOT NULL DEFAULT '1',
  `padding` tinyint NOT NULL DEFAULT '8',
  `reset_policy` enum('NEVER','YEARLY','MONTHLY') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NEVER',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule` (`org_id`,`doc_type`,`is_deleted`),
  KEY `idx_rule_org` (`org_id`,`is_deleted`),
  CONSTRAINT `fk_rule_org` FOREIGN KEY (`org_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doc_numbering_rules`
--

LOCK TABLES `doc_numbering_rules` WRITE;
/*!40000 ALTER TABLE `doc_numbering_rules` DISABLE KEYS */;
INSERT INTO `doc_numbering_rules` VALUES (1,1,'INVOICE_A','FA-{PV}-{NUM}',1,8,'NEVER',1,'2025-10-17 19:25:46',NULL,0,NULL),(2,1,'INVOICE_B','FB-{PV}-{NUM}',1,8,'NEVER',1,'2025-10-17 19:25:46',NULL,0,NULL),(3,1,'QUOTE','PRES-{AÃ‘O}-{NUM}',1,6,'YEARLY',1,'2025-10-17 19:25:46',NULL,0,NULL),(4,1,'REMITO','REM-{PV}-{NUM}',1,8,'NEVER',1,'2025-10-17 19:25:46',NULL,0,NULL),(5,1,'TICKET','TCK-{PV}-{NUM}',1,8,'MONTHLY',1,'2025-10-17 19:49:17',NULL,0,NULL),(10,3,'INVOICE_B','FB-{PV}-{NUM}',1,8,'NEVER',1,'2025-10-23 20:28:13',NULL,0,NULL),(11,4,'INVOICE_B','FB-{PV}-{NUM}',1,8,'NEVER',1,'2025-10-24 12:44:19',NULL,0,NULL),(12,4,'INVOICE_A','FA-{PV}-{NUM}',1,8,'NEVER',1,'2025-10-24 18:36:02',NULL,0,NULL),(14,4,'QUOTE','PRE-{YY}-{NUM}',1,6,'YEARLY',1,'2025-10-24 18:59:36',NULL,0,NULL),(15,5,'TICKET','{TK}-{PV}-{NUM}',1,8,'NEVER',1,'2025-11-23 10:41:57',NULL,0,NULL),(16,6,'INVOICE_B','{TIPO}-{PV}-{NUM}',1,8,'NEVER',1,'2025-11-24 20:49:42',NULL,0,NULL),(17,6,'QUOTE','{TIPO}-{PV}-{NUM}',1,8,'NEVER',1,'2025-11-24 22:46:10',NULL,0,NULL),(18,6,'INVOICE_A','{TIPO}-{PV}-{NUM}',1,8,'NEVER',1,'2025-11-25 12:38:43',NULL,0,NULL),(19,6,'REMITO','{REM}-{PV}-{NUM}',1,8,'NEVER',1,'2025-11-25 12:38:58',NULL,0,NULL),(20,6,'TICKET','{TK}-{PV}-{NUM}',1,8,'NEVER',1,'2025-11-25 12:39:12',NULL,0,NULL);
/*!40000 ALTER TABLE `doc_numbering_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_session_items`
--

DROP TABLE IF EXISTS `inventory_session_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_session_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `variant_id` int NOT NULL,
  `expected_qty` int NOT NULL DEFAULT '0',
  `counted_qty` int NOT NULL DEFAULT '0',
  `difference` int NOT NULL DEFAULT '0',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_isi_session` (`session_id`,`is_deleted`),
  KEY `fk_isi_variant` (`variant_id`),
  CONSTRAINT `fk_isi_session` FOREIGN KEY (`session_id`) REFERENCES `inventory_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_isi_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_session_items`
--

LOCK TABLES `inventory_session_items` WRITE;
/*!40000 ALTER TABLE `inventory_session_items` DISABLE KEYS */;
INSERT INTO `inventory_session_items` VALUES (1,1,27,15,0,0,0,NULL),(2,1,28,20,0,0,0,NULL),(3,1,29,12,0,0,0,NULL),(4,1,30,7,0,0,0,NULL),(5,1,31,40,0,0,0,NULL),(6,2,27,15,0,0,0,NULL),(7,2,28,20,0,0,0,NULL),(8,2,29,12,0,0,0,NULL),(9,2,30,7,0,0,0,NULL),(10,2,31,40,0,0,0,NULL),(11,3,27,3,0,0,0,NULL),(12,3,28,20,0,0,0,NULL),(13,3,29,12,0,0,0,NULL),(14,3,30,7,0,0,0,NULL),(15,3,31,15,0,0,0,NULL);
/*!40000 ALTER TABLE `inventory_session_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_sessions`
--

DROP TABLE IF EXISTS `inventory_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `org_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `status` enum('OPEN','APPROVED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN',
  `only_differences` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_inv_org_branch` (`org_id`,`branch_id`,`status`,`is_deleted`),
  KEY `fk_inv_branch` (`branch_id`),
  KEY `fk_inv_user1` (`created_by`),
  KEY `fk_inv_user2` (`approved_by`),
  CONSTRAINT `fk_inv_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_inv_org` FOREIGN KEY (`org_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_inv_user1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_inv_user2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_sessions`
--

LOCK TABLES `inventory_sessions` WRITE;
/*!40000 ALTER TABLE `inventory_sessions` DISABLE KEYS */;
INSERT INTO `inventory_sessions` VALUES (1,4,3,'OPEN',0,9,'2025-11-11 17:10:49',NULL,NULL,0,NULL),(2,4,3,'OPEN',0,9,'2025-11-11 17:11:18',NULL,NULL,0,NULL),(3,4,3,'OPEN',0,9,'2025-11-24 20:06:23',NULL,NULL,0,NULL);
/*!40000 ALTER TABLE `inventory_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organizations`
--

DROP TABLE IF EXISTS `organizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organizations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `legal_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_id` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `tax_condition` enum('RI','MT','CF','EX') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'CF',
  `timezone` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'America/Argentina/Buenos_Aires',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currency` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'ARS',
  `sender_email` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primary_color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `secondary_color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organizations`
--

LOCK TABLES `organizations` WRITE;
/*!40000 ALTER TABLE `organizations` DISABLE KEYS */;
INSERT INTO `organizations` VALUES (1,'Org Demo',NULL,NULL,'2025-10-02 16:33:00',NULL,0,NULL,'CF','America/Argentina/Buenos_Aires',NULL,NULL,'ARS',NULL,NULL,NULL),(2,'Organizacion de Seba','Organizacion de Seba','30123121447','2025-10-23 18:23:07',2,0,NULL,'RI','string','Calle Falsa 123','https://www.logofalso123.com','ARS','user@example.com',NULL,NULL),(3,'Empresa Principal SRL','Empresa Principal SRL','20-11223344-9','2025-10-23 20:14:16',2,0,NULL,'RI','America/Argentina/Buenos_Aires','Av. Siempreviva 742',NULL,'ARS','ventas@empresa-principal.com',NULL,NULL),(4,'La Empresa del Nuevo Owner SA','La Empresa del Nuevo Owner SA','30-55667788-1','2025-10-24 12:10:35',8,0,NULL,'MT','America/Argentina/Buenos_Aires','Otra Calle 789',NULL,'ARS',NULL,NULL,NULL),(5,'Sabores','Sabores','38520276','2025-11-23 00:16:45',10,0,NULL,'MT','America/Argentina/Buenos_Aires','Agrelo 5972',NULL,'ARS','leonjuampi@gmail.com',NULL,NULL),(6,'Mi Negocio de Prueba SA','Mi Negocio de Prueba SA','20-11223344-5','2025-11-24 20:29:26',15,0,NULL,'RI','America/Argentina/Buenos_Aires','Calle Falsa 123',NULL,'ARS','asd','#172140','#c6ed02');
/*!40000 ALTER TABLE `organizations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_methods`
--

DROP TABLE IF EXISTS `payment_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_methods` (
  `id` int NOT NULL AUTO_INCREMENT,
  `org_id` int NOT NULL,
  `name` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` enum('CASH','DEBIT','CREDIT','TRANSFER','MIXED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `max_installments` int NOT NULL DEFAULT '1',
  `surcharge_pct` decimal(7,4) NOT NULL DEFAULT '0.0000',
  `discount_pct` decimal(7,4) NOT NULL DEFAULT '0.0000',
  `ticket_note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_name` (`org_id`,`name`,`is_deleted`),
  KEY `idx_payment_org` (`org_id`,`is_deleted`),
  CONSTRAINT `fk_payment_org` FOREIGN KEY (`org_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_methods`
--

LOCK TABLES `payment_methods` WRITE;
/*!40000 ALTER TABLE `payment_methods` DISABLE KEYS */;
INSERT INTO `payment_methods` VALUES (1,3,'CASH','CASH',1,0.0000,0.0000,NULL,1,'2025-10-23 20:40:00',NULL,0,NULL),(2,4,'CASH','CASH',1,0.0000,0.0000,NULL,1,'2025-10-24 12:53:37',NULL,0,NULL),(3,4,'DEBIT','DEBIT',1,0.0000,0.0000,NULL,1,'2025-10-24 13:12:46',NULL,0,NULL),(4,4,'CREDIT','CREDIT',1,0.0000,0.0000,NULL,1,'2025-10-24 13:12:46',NULL,0,NULL),(5,5,'Efectivo','CASH',1,0.0000,0.0000,NULL,1,'2025-11-23 10:14:47','2025-11-23 10:21:42',0,NULL),(6,6,'Efectivo','CASH',1,0.0000,0.0000,NULL,1,'2025-11-24 20:46:34',NULL,0,NULL),(7,6,'Tarjeta Crédito','CREDIT',3,10.0000,0.0000,NULL,1,'2025-11-24 20:47:12',NULL,0,NULL);
/*!40000 ALTER TABLE `payment_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `price_lists`
--

DROP TABLE IF EXISTS `price_lists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_lists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `org_id` int DEFAULT NULL,
  `name` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pricelist_org_name_active` (`org_id`,`name`,`is_deleted`),
  KEY `idx_pricelist_org` (`org_id`,`is_deleted`),
  CONSTRAINT `fk_pricelist_org` FOREIGN KEY (`org_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `price_lists`
--

LOCK TABLES `price_lists` WRITE;
/*!40000 ALTER TABLE `price_lists` DISABLE KEYS */;
INSERT INTO `price_lists` VALUES (1,1,'General',NULL,1,0,NULL),(2,1,'Mayorista',NULL,0,0,NULL),(3,1,'Minorista',NULL,0,0,NULL),(4,4,'General',NULL,1,0,NULL),(5,5,'General',NULL,1,0,NULL),(6,5,'Test',NULL,0,1,'2025-11-23 10:14:20'),(7,6,'General','Lista de precios General',1,0,NULL);
/*!40000 ALTER TABLE `price_lists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sku` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `barcode` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(14,2) DEFAULT NULL,
  `cost` decimal(14,2) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_variant_sku_active` (`product_id`,`sku`,`is_deleted`),
  KEY `idx_variant_prod` (`product_id`,`is_deleted`),
  CONSTRAINT `fk_var_prod` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variants`
--

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
INSERT INTO `product_variants` VALUES (1,1,NULL,'REM-BL-01',NULL,5000.00,2500.00,0,NULL),(27,23,'Talle L','PROD001-L','BC001L',9500.00,4500.00,0,NULL),(28,24,'Talle 34','PROD002-34','BC00234',14000.00,7000.00,0,NULL),(29,25,'Negro-40','PROD003-NG-40','BC003NG40',18000.00,9000.00,0,NULL),(30,25,'Negro-41','PROD003-NG-41','BC003NG41',18000.00,9000.00,0,NULL),(31,26,'Roja','PROD004-RJ','BC004RJ',4500.00,2000.00,0,NULL),(32,27,'Unico','PROD005-UNICO','BC005U',100.00,50.00,1,'2025-11-11 14:44:53'),(33,28,NULL,'123123',NULL,10000.00,1000.00,0,NULL),(34,29,NULL,'1111',NULL,1000.00,0.00,0,NULL),(35,31,NULL,'111111',NULL,1.00,0.00,0,NULL),(36,32,NULL,'S24-ULTRA',NULL,1200000.00,800000.00,1,'2025-12-06 14:24:34'),(37,33,NULL,'123',NULL,200000.00,149999.00,0,NULL),(38,34,NULL,'motoedge50',NULL,1000000.00,800000.00,0,NULL);
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `org_id` int NOT NULL,
  `category_id` int NOT NULL,
  `subcategory_id` int DEFAULT NULL,
  `sku` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `price` decimal(14,2) NOT NULL,
  `cost` decimal(14,2) NOT NULL,
  `vat_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `status` enum('ACTIVE','INACTIVE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_product_sku_active` (`sku`,`is_deleted`),
  KEY `idx_products_org` (`org_id`,`is_deleted`),
  KEY `fk_prod_cat` (`category_id`),
  KEY `fk_prod_subcat` (`subcategory_id`),
  CONSTRAINT `fk_prod_cat` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_prod_org` FOREIGN KEY (`org_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_prod_subcat` FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,3,1,NULL,'REM-BL-01','Remera Lisa Blanca',NULL,5000.00,2500.00,21.00,'ACTIVE','2025-10-23 20:22:53',2,0,NULL),(23,4,19,17,'PROD001','Camisa Lisa',NULL,9500.00,4500.00,21.00,'ACTIVE','2025-10-31 17:43:07',8,0,NULL),(24,4,19,18,'PROD002','Jean Azul',NULL,14000.00,7000.00,21.00,'ACTIVE','2025-10-31 17:43:07',8,0,NULL),(25,4,20,19,'PROD003','Zapatilla Urbana',NULL,18000.00,9000.00,21.00,'ACTIVE','2025-10-31 17:43:07',8,0,NULL),(26,4,21,20,'PROD004','Gorra Trucker',NULL,4500.00,2000.00,21.00,'ACTIVE','2025-10-31 17:43:08',8,0,NULL),(27,4,22,NULL,'PROD005','Producto Sin Stock','Producto de prueba',100.00,50.00,21.00,'ACTIVE','2025-10-31 17:43:08',8,1,'2025-11-11 14:44:53'),(28,4,22,NULL,'123123','Producto de test','',10000.00,1000.00,21.00,'ACTIVE','2025-11-11 14:38:42',9,0,NULL),(29,5,23,21,'1111','Test','',1000.00,0.00,10.00,'ACTIVE','2025-11-24 13:53:57',10,0,NULL),(31,5,23,NULL,'111111','test2','',1.00,0.00,21.00,'ACTIVE','2025-11-24 15:21:34',10,0,NULL),(32,6,24,22,'S24-ULTRA','Samsung Galaxy S24','',1200000.00,800000.00,21.00,'ACTIVE','2025-11-24 21:08:20',15,1,'2025-12-06 14:24:34'),(33,6,24,22,'123','nokia','',200000.00,149999.00,21.00,'ACTIVE','2025-12-06 14:55:24',16,0,NULL),(34,6,24,22,'motoedge50','Motolora Edge 50','',1000000.00,800000.00,21.00,'ACTIVE','2025-12-06 15:06:56',16,0,NULL);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quote_items`
--

DROP TABLE IF EXISTS `quote_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quote_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quote_id` int NOT NULL,
  `product_id` int NOT NULL,
  `variant_id` int DEFAULT NULL,
  `sku_snapshot` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name_snapshot` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price_unit` decimal(14,2) NOT NULL,
  `qty` int NOT NULL,
  `discount_pct` decimal(7,4) NOT NULL DEFAULT '0.0000',
  `tax_pct` decimal(7,4) NOT NULL DEFAULT '0.0000',
  `line_total` decimal(14,2) NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_quote_items` (`quote_id`,`is_deleted`),
  KEY `fk_quote_items_product` (`product_id`),
  KEY `fk_quote_items_variant` (`variant_id`),
  CONSTRAINT `fk_quote_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_quote_items_quote` FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quote_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quote_items`
--

LOCK TABLES `quote_items` WRITE;
/*!40000 ALTER TABLE `quote_items` DISABLE KEYS */;
INSERT INTO `quote_items` VALUES (2,2,23,27,'PROD001-L','Camisa Lisa',9500.00,1,0.0000,0.0000,9500.00,0,NULL),(3,3,23,27,'PROD001-L','Camisa Lisa',9500.00,1,0.0000,0.0000,9500.00,0,NULL),(4,4,23,27,'PROD001-L','Camisa Lisa',9500.00,1,0.0000,0.0000,9500.00,0,NULL),(5,5,26,31,'PROD004-RJ','Gorra Trucker',4500.00,3,0.0000,0.0000,13500.00,0,NULL),(6,6,23,27,'PROD001-L','Camisa Lisa',9500.00,1,0.0000,0.0000,9500.00,0,NULL),(7,7,26,31,'PROD004-RJ','Gorra Trucker',4500.00,1,0.0000,0.0000,4500.00,1,'2025-11-24 13:30:52'),(8,8,26,31,'PROD004-RJ','Gorra Trucker',4500.00,1,0.0000,0.0000,4500.00,0,NULL),(9,7,26,31,'PROD004-RJ','Gorra Trucker',4500.00,1,0.0000,0.0000,4500.00,0,NULL),(10,7,23,27,'PROD001-L','Camisa Lisa',9500.00,1,0.0000,0.0000,9500.00,0,NULL),(11,9,23,27,'PROD001-L','Camisa Lisa',9500.00,1,0.0000,0.0000,9500.00,0,NULL),(12,10,23,27,'PROD001-L','Camisa Lisa',9500.00,1,0.0000,0.0000,9500.00,0,NULL),(13,11,32,36,'S24-ULTRA','Samsung Galaxy S24',1200000.00,1,0.0000,0.0000,1200000.00,1,'2025-11-24 22:48:00'),(14,11,32,36,'S24-ULTRA','Samsung Galaxy S24',1200000.00,2,0.0000,0.0000,2400000.00,0,NULL),(15,12,32,36,'S24-ULTRA','Samsung Galaxy S24',1200000.00,1,0.0000,0.0000,1200000.00,0,NULL),(16,13,32,36,'S24-ULTRA','Samsung Galaxy S24',1200000.00,1,0.0000,0.0000,1200000.00,0,NULL);
/*!40000 ALTER TABLE `quote_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quotes`
--

DROP TABLE IF EXISTS `quotes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `org_id` int NOT NULL,
  `branch_id` int DEFAULT NULL,
  `seller_id` int DEFAULT NULL,
  `customer_id` int NOT NULL,
  `number` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('DRAFT','SENT','VIEWED','ACCEPTED','EXPIRED','CONVERTED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `valid_until` date DEFAULT NULL,
  `subtotal_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `discount_pct` decimal(7,4) NOT NULL DEFAULT '0.0000',
  `discount_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `shipping_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `converted_sale_id` int DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_quotes_org` (`org_id`,`status`,`is_deleted`),
  KEY `fk_quotes_branch` (`branch_id`),
  KEY `fk_quotes_seller` (`seller_id`),
  KEY `fk_quotes_customer` (`customer_id`),
  CONSTRAINT `fk_quotes_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_quotes_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_quotes_org` FOREIGN KEY (`org_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_quotes_seller` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotes`
--

LOCK TABLES `quotes` WRITE;
/*!40000 ALTER TABLE `quotes` DISABLE KEYS */;
INSERT INTO `quotes` VALUES (1,4,NULL,NULL,4,'PRE-{YY}-000001','CONVERTED','2026-03-31',54000.00,0.0000,0.00,0.00,0.00,54000.00,'Presupuesto de prueba.',NULL,'2025-10-24 19:12:34',13,0,NULL),(2,4,NULL,NULL,4,'PRE-{YY}-000002','DRAFT',NULL,9500.00,0.0000,0.00,0.00,0.00,9500.00,'Presupuesto de mostrador',NULL,'2025-11-11 22:35:50',NULL,0,NULL),(3,4,NULL,NULL,4,'PRE-{YY}-000003','DRAFT',NULL,9500.00,0.0000,0.00,0.00,0.00,9500.00,'Presupuesto de mostrador',NULL,'2025-11-11 22:38:24',NULL,0,NULL),(4,4,NULL,NULL,7,'PRE-{YY}-000004','DRAFT',NULL,9500.00,0.0000,0.00,0.00,0.00,9500.00,'Presupuesto de mostrador',NULL,'2025-11-11 23:04:17',NULL,0,NULL),(5,4,NULL,NULL,4,'PRE-{YY}-000005','DRAFT','2025-12-25',13500.00,0.0000,0.00,0.00,0.00,13500.00,'Presupuesto de mostrador',NULL,'2025-11-11 23:16:56',NULL,0,NULL),(6,4,NULL,NULL,4,'PRE-{YY}-000006','CONVERTED','2025-11-29',9500.00,0.0000,0.00,0.00,0.00,9500.00,'Presupuesto de mostrador',NULL,'2025-11-13 21:41:38',37,0,NULL),(7,4,NULL,NULL,9,'PRE-{YY}-000007','CONVERTED','2025-12-09',14000.00,0.0000,0.00,0.00,0.00,14000.00,'Presupuesto web',9,'2025-11-24 12:12:14',34,0,NULL),(8,4,NULL,NULL,7,'PRE-{YY}-000008','CONVERTED','2025-12-09',4500.00,0.0000,0.00,0.00,0.00,4500.00,'Presupuesto web',9,'2025-11-24 12:13:12',33,0,NULL),(9,4,NULL,NULL,9,'PRE-{YY}-000009','CONVERTED','2025-12-09',9500.00,0.0000,0.00,0.00,0.00,9500.00,'Presupuesto web',9,'2025-11-24 13:40:23',35,0,NULL),(10,4,NULL,NULL,9,'PRE-{YY}-000010','CONVERTED','2025-12-09',9500.00,0.0000,0.00,0.00,0.00,9500.00,'Presupuesto web',9,'2025-11-24 13:40:59',36,0,NULL),(11,6,NULL,NULL,13,'{TIPO}-0001-00000001','CONVERTED','2025-12-10',2400000.00,0.0000,0.00,0.00,0.00,2400000.00,'Presupuesto web',16,'2025-11-24 22:47:14',38,0,NULL),(12,6,NULL,NULL,13,'{TIPO}-0001-00000002','DRAFT','2025-12-10',1200000.00,0.0000,0.00,0.00,0.00,1200000.00,'Presupuesto web',16,'2025-11-25 12:34:53',NULL,0,NULL),(13,6,NULL,NULL,13,'{TIPO}-0001-00000003','CONVERTED','2025-12-13',1200000.00,0.0000,0.00,0.00,0.00,1200000.00,'Presupuesto web',16,'2025-11-27 22:32:48',40,0,NULL);
/*!40000 ALTER TABLE `quotes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL,
  `code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'ADMIN','Administrador de plataforma'),(2,'OWNER','DueÃ±o/propietario'),(3,'SELLER','Vendedor');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_items`
--

DROP TABLE IF EXISTS `sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `product_id` int NOT NULL,
  `variant_id` int DEFAULT NULL,
  `sku_snapshot` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name_snapshot` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price_unit` decimal(14,2) NOT NULL,
  `qty` int NOT NULL,
  `discount_pct` decimal(7,4) NOT NULL DEFAULT '0.0000',
  `tax_pct` decimal(7,4) NOT NULL DEFAULT '0.0000',
  `line_total` decimal(14,2) NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sale_items` (`sale_id`,`is_deleted`),
  KEY `fk_sale_items_product` (`product_id`),
  KEY `fk_sale_items_variant` (`variant_id`),
  CONSTRAINT `fk_sale_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_sale_items_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sale_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_items`
--

LOCK TABLES `sale_items` WRITE;
/*!40000 ALTER TABLE `sale_items` DISABLE KEYS */;
INSERT INTO `sale_items` VALUES (4,5,1,1,'REM-BL-01','Remera Lisa Blanca',5000.00,1,0.0000,21.0000,6050.00,0,NULL),(7,8,1,1,'REM-BL-01','Remera Lisa Blanca',5000.00,1,0.0000,21.0000,6050.00,0,NULL),(15,19,23,27,'PROD001-L','Camisa Lisa',9500.00,1,0.0000,21.0000,11495.00,0,NULL),(16,20,23,27,'PROD001-L','Camisa Lisa',9500.00,1,0.0000,21.0000,11495.00,0,NULL),(17,21,23,27,'PROD001-L','Camisa Lisa',9500.00,1,0.0000,21.0000,11495.00,0,NULL),(18,22,26,31,'PROD004-RJ','Gorra Trucker',4500.00,1,0.0000,21.0000,5445.00,0,NULL),(19,23,23,27,'PROD001-L','Camisa Lisa',9500.00,1,0.0000,21.0000,11495.00,0,NULL),(20,23,26,31,'PROD004-RJ','Gorra Trucker',4500.00,2,0.0000,21.0000,10890.00,0,NULL),(21,24,23,27,'PROD001-L','Camisa Lisa',9500.00,2,0.0000,21.0000,22990.00,0,NULL),(22,24,26,31,'PROD004-RJ','Gorra Trucker',4500.00,2,0.0000,21.0000,10890.00,0,NULL),(23,25,26,31,'PROD004-RJ','Gorra Trucker',4500.00,3,0.0000,21.0000,16335.00,0,NULL),(24,26,23,27,'PROD001-L','Camisa Lisa',9500.00,2,0.0000,21.0000,22990.00,0,NULL),(25,27,26,31,'PROD004-RJ','Gorra Trucker',4500.00,2,0.0000,21.0000,10890.00,0,NULL),(26,28,26,31,'PROD004-RJ','Gorra Trucker',4500.00,2,0.0000,21.0000,10890.00,0,NULL),(27,29,26,31,'PROD004-RJ','Gorra Trucker',4500.00,2,0.0000,21.0000,10890.00,0,NULL),(28,30,26,31,'PROD004-RJ','Gorra Trucker',4500.00,2,0.0000,21.0000,10890.00,0,NULL),(29,31,26,31,'PROD004-RJ','Gorra Trucker',4500.00,1,0.0000,21.0000,5445.00,0,NULL),(30,32,26,31,'PROD004-RJ','Gorra Trucker',4500.00,6,0.0000,21.0000,32670.00,0,NULL),(31,33,26,31,'PROD004-RJ','Gorra Trucker',4500.00,1,0.0000,21.0000,5445.00,0,NULL),(32,34,26,31,'PROD004-RJ','Gorra Trucker',4500.00,1,0.0000,21.0000,5445.00,0,NULL),(33,34,23,27,'PROD001-L','Camisa Lisa',9500.00,1,0.0000,21.0000,11495.00,0,NULL),(34,35,23,27,'PROD001-L','Camisa Lisa',9500.00,1,0.0000,21.0000,11495.00,0,NULL),(35,36,23,27,'PROD001-L','Camisa Lisa',9500.00,1,0.0000,21.0000,11495.00,0,NULL),(36,37,23,27,'PROD001-L','Camisa Lisa',9500.00,1,0.0000,21.0000,11495.00,0,NULL),(37,38,32,36,'S24-ULTRA','Samsung Galaxy S24',1200000.00,2,0.0000,21.0000,2904000.00,0,NULL),(38,39,32,36,'S24-ULTRA','Samsung Galaxy S24',1200000.00,1,0.0000,21.0000,1452000.00,0,NULL),(39,40,32,36,'S24-ULTRA','Samsung Galaxy S24',1200000.00,1,0.0000,21.0000,1452000.00,0,NULL),(40,41,32,36,'S24-ULTRA','Samsung Galaxy S24',1200000.00,1,0.0000,21.0000,1452000.00,0,NULL),(41,42,32,36,'S24-ULTRA','Samsung Galaxy S24',1200000.00,1,0.0000,21.0000,1452000.00,0,NULL),(42,43,32,36,'S24-ULTRA','Samsung Galaxy S24',1200000.00,1,0.0000,21.0000,1452000.00,0,NULL),(43,44,32,36,'S24-ULTRA','Samsung Galaxy S24',1200000.00,1,0.0000,21.0000,1452000.00,0,NULL),(44,45,32,36,'S24-ULTRA','Samsung Galaxy S24',1200000.00,1,0.0000,21.0000,1452000.00,0,NULL);
/*!40000 ALTER TABLE `sale_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_payments`
--

DROP TABLE IF EXISTS `sale_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `method_id` int NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `details_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sale_payments` (`sale_id`,`is_deleted`),
  KEY `fk_sale_payment_method` (`method_id`),
  CONSTRAINT `fk_sale_payment_method` FOREIGN KEY (`method_id`) REFERENCES `payment_methods` (`id`),
  CONSTRAINT `fk_sale_payment_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_payments`
--

LOCK TABLES `sale_payments` WRITE;
/*!40000 ALTER TABLE `sale_payments` DISABLE KEYS */;
INSERT INTO `sale_payments` VALUES (1,5,1,6050.00,NULL,'2025-10-24 10:20:29',0,NULL),(4,8,1,6050.00,NULL,'2025-10-24 11:06:36',0,NULL),(5,10,2,14520.00,NULL,'2025-10-24 12:54:24',0,NULL),(7,13,2,65340.00,'{\"note\": \"Pago total recibido al convertir presupuesto\"}','2025-10-24 19:52:15',0,NULL),(8,19,2,11495.00,'{\"note\": \"CASH\"}','2025-11-11 22:09:13',0,NULL),(9,20,4,10000.00,'{\"note\": \"CREDIT\"}','2025-11-11 22:09:42',0,NULL),(10,20,2,1495.00,'{\"note\": \"CASH\"}','2025-11-11 22:09:42',0,NULL),(11,21,2,11495.00,'{\"note\": \"CASH\"}','2025-11-13 22:28:46',0,NULL),(12,22,2,5445.00,'{\"note\": \"CASH\"}','2025-11-13 22:34:50',0,NULL),(13,23,2,5495.01,'{\"note\": \"CASH\"}','2025-11-13 22:55:07',0,NULL),(14,23,3,6000.00,'{\"note\": \"DEBIT\"}','2025-11-13 22:55:07',0,NULL),(15,24,2,15880.00,'{\"note\": \"CASH\"}','2025-11-13 22:58:40',0,NULL),(16,24,3,18000.00,'{\"note\": \"DEBIT\"}','2025-11-13 22:58:40',0,NULL),(17,25,2,16335.00,'{\"note\": \"CASH\"}','2025-11-13 23:17:13',0,NULL),(18,26,2,22990.00,'{\"note\": \"CASH\"}','2025-11-14 19:08:37',0,NULL),(19,27,2,10890.00,'{\"note\": \"CASH\"}','2025-11-15 23:34:01',0,NULL),(20,28,2,10890.00,'{\"note\": \"CASH\"}','2025-11-15 23:36:30',0,NULL),(21,29,2,10890.00,'{\"note\": \"CASH\"}','2025-11-15 23:49:12',0,NULL),(22,30,2,10890.00,'{\"note\": \"CASH\"}','2025-11-16 00:06:20',0,NULL),(23,31,2,5445.00,'{\"note\": \"CASH\"}','2025-11-22 00:46:47',0,NULL),(24,32,2,32670.00,'{\"note\": \"CASH\"}','2025-11-22 00:47:30',0,NULL),(25,39,6,1452000.00,'{\"note\": \"Efectivo\"}','2025-11-25 12:41:59',0,NULL),(26,41,6,1452000.00,'{\"note\": \"Efectivo\"}','2025-11-28 17:37:16',0,NULL),(27,42,6,1000000.00,'{\"note\": \"Efectivo\"}','2025-11-28 17:47:41',0,NULL),(28,42,7,452000.00,'{\"note\": \"Tarjeta Crédito\"}','2025-11-28 17:47:41',0,NULL),(29,43,6,1000000.00,'{\"note\": \"Efectivo\"}','2025-11-28 18:31:01',0,NULL),(30,43,7,452000.00,'{\"note\": \"Tarjeta Crédito\"}','2025-11-28 18:31:01',0,NULL),(31,44,6,1452000.00,'{\"note\": \"Efectivo\"}','2025-12-06 14:04:27',0,NULL),(32,45,6,1452000.00,'{\"note\": \"Efectivo\"}','2025-12-06 14:13:43',0,NULL);
/*!40000 ALTER TABLE `sale_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `org_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `seller_id` int DEFAULT NULL,
  `customer_id` int DEFAULT NULL,
  `doc_type` enum('INVOICE_A','INVOICE_B','TICKET') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `doc_number` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('DRAFT','CONFIRMED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `trx_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `subtotal_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `discount_pct` decimal(7,4) NOT NULL DEFAULT '0.0000',
  `discount_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `shipping_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cancelled_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sales_org_branch` (`org_id`,`branch_id`,`status`,`trx_date`,`is_deleted`),
  KEY `fk_sales_branch` (`branch_id`),
  KEY `fk_sales_seller` (`seller_id`),
  KEY `fk_sales_customer` (`customer_id`),
  CONSTRAINT `fk_sales_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_sales_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_sales_org` FOREIGN KEY (`org_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_sales_seller` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
INSERT INTO `sales` VALUES (5,3,2,7,1,'INVOICE_B','FB-0001-00000001','CONFIRMED','2025-10-24 10:20:29',5000.00,0.0000,0.00,1050.00,0.00,6050.00,NULL,7,'2025-10-24 10:20:29',NULL,0,NULL),(8,3,2,7,1,'INVOICE_B','FB-0001-00000002','CONFIRMED','2025-10-24 11:06:36',5000.00,0.0000,0.00,1050.00,0.00,6050.00,NULL,7,'2025-10-24 11:06:36',NULL,0,NULL),(10,4,3,9,1,'INVOICE_B','FB-0001-00000001','CONFIRMED','2025-10-24 12:54:24',12000.00,0.0000,0.00,2520.00,0.00,14520.00,NULL,9,'2025-10-24 12:54:24',NULL,0,NULL),(13,4,3,9,4,'INVOICE_A','FA-0001-00000001','CONFIRMED','2025-10-24 19:19:59',54000.00,0.0000,0.00,11340.00,0.00,65340.00,'Convertido de presupuesto Presupuesto de prueba.',9,'2025-10-24 19:19:59',NULL,0,NULL),(19,4,3,9,4,'INVOICE_B','FB-0001-00000002','CONFIRMED','2025-11-11 22:09:13',9500.00,0.0000,0.00,1995.00,0.00,11495.00,'Venta de mostrador',9,'2025-11-11 22:09:13',NULL,0,NULL),(20,4,3,9,4,'INVOICE_B','FB-0001-00000003','CONFIRMED','2025-11-11 22:09:42',9500.00,0.0000,0.00,1995.00,0.00,11495.00,'Venta de mostrador',9,'2025-11-11 22:09:42',NULL,0,NULL),(21,4,3,9,4,'INVOICE_B','FB-0001-00000004','CONFIRMED','2025-11-13 22:28:46',9500.00,0.0000,0.00,1995.00,0.00,11495.00,'Venta de mostrador',9,'2025-11-13 22:28:46',NULL,0,NULL),(22,4,3,9,4,'INVOICE_B','FB-0001-00000005','CONFIRMED','2025-11-13 22:34:50',4500.00,0.0000,0.00,945.00,0.00,5445.00,'Venta de mostrador',9,'2025-11-13 22:34:50',NULL,0,NULL),(23,4,3,9,4,'INVOICE_B','FB-0001-00000006','CONFIRMED','2025-11-13 22:55:07',18500.00,0.0000,0.00,3885.00,0.00,22385.00,'Venta de mostrador',9,'2025-11-13 22:55:07',NULL,0,NULL),(24,4,3,9,4,'INVOICE_B','FB-0001-00000007','CONFIRMED','2025-11-13 22:58:40',28000.00,0.0000,0.00,5880.00,0.00,33880.00,'Venta de mostrador',9,'2025-11-13 22:58:40',NULL,0,NULL),(25,4,3,9,4,'INVOICE_B','FB-0001-00000008','CONFIRMED','2025-11-13 23:17:13',13500.00,0.0000,0.00,2835.00,0.00,16335.00,'Venta de mostrador',9,'2025-11-13 23:17:13',NULL,0,NULL),(26,4,3,9,4,'INVOICE_B','FB-0001-00000009','CONFIRMED','2025-11-14 19:08:37',19000.00,0.0000,0.00,3990.00,0.00,22990.00,'Venta de mostrador',9,'2025-11-14 19:08:37',NULL,0,NULL),(27,4,3,9,4,'INVOICE_B','FB-0001-00000010','CONFIRMED','2025-11-15 23:34:01',9000.00,0.0000,0.00,1890.00,0.00,10890.00,'Venta de mostrador',9,'2025-11-15 23:34:01',NULL,0,NULL),(28,4,3,9,4,'INVOICE_B','FB-0001-00000011','CONFIRMED','2025-11-15 23:36:30',9000.00,0.0000,0.00,1890.00,0.00,10890.00,'Venta de mostrador',9,'2025-11-15 23:36:30',NULL,0,NULL),(29,4,3,9,4,'INVOICE_B','FB-0001-00000012','CONFIRMED','2025-11-15 23:49:12',9000.00,0.0000,0.00,1890.00,0.00,10890.00,'Venta de mostrador',9,'2025-11-15 23:49:12',NULL,0,NULL),(30,4,3,9,4,'INVOICE_B','FB-0001-00000013','CONFIRMED','2025-11-16 00:06:20',9000.00,0.0000,0.00,1890.00,0.00,10890.00,'Venta de mostrador',9,'2025-11-16 00:06:20',NULL,0,NULL),(31,4,3,9,9,'INVOICE_B','FB-0001-00000014','CONFIRMED','2025-11-22 00:46:47',4500.00,0.0000,0.00,945.00,0.00,5445.00,'Venta de mostrador',9,'2025-11-22 00:46:47',NULL,0,NULL),(32,4,3,9,4,'INVOICE_B','FB-0001-00000015','CONFIRMED','2025-11-22 00:47:30',27000.00,0.0000,0.00,5670.00,0.00,32670.00,'Venta de mostrador',9,'2025-11-22 00:47:30',NULL,0,NULL),(33,4,3,9,7,'INVOICE_A','FA-0001-00000002','CONFIRMED','2025-11-24 13:24:05',4500.00,0.0000,0.00,945.00,0.00,5445.00,'Convertido de presupuesto Presupuesto web',9,'2025-11-24 13:24:05',NULL,0,NULL),(34,4,3,9,9,'INVOICE_B','FB-0001-00000016','CONFIRMED','2025-11-24 13:31:14',14000.00,0.0000,0.00,2940.00,0.00,16940.00,'Convertido de presupuesto Presupuesto web',9,'2025-11-24 13:31:14',NULL,0,NULL),(35,4,3,9,9,'INVOICE_B','FB-0001-00000017','CONFIRMED','2025-11-24 13:40:35',9500.00,0.0000,0.00,1995.00,0.00,11495.00,'Convertido de presupuesto Presupuesto web',9,'2025-11-24 13:40:35',NULL,0,NULL),(36,4,3,9,9,'INVOICE_B','FB-0001-00000018','CONFIRMED','2025-11-24 13:41:09',9500.00,0.0000,0.00,1995.00,0.00,11495.00,'Convertido de presupuesto Presupuesto web',9,'2025-11-24 13:41:09',NULL,0,NULL),(37,4,3,9,4,'INVOICE_B','FB-0001-00000019','CONFIRMED','2025-11-24 13:51:26',9500.00,0.0000,0.00,1995.00,0.00,11495.00,'Convertido de presupuesto Presupuesto de mostrador',9,'2025-11-24 13:51:26',NULL,0,NULL),(38,6,6,16,13,'INVOICE_A','{TIPO}-0001-00000001','CONFIRMED','2025-11-25 12:39:36',2400000.00,0.0000,0.00,504000.00,0.00,2904000.00,'Convertido de presupuesto Presupuesto web',16,'2025-11-25 12:39:36',NULL,0,NULL),(39,6,6,16,14,'INVOICE_B','{TIPO}-0001-00000001','CONFIRMED','2025-11-25 12:41:59',1200000.00,0.0000,0.00,252000.00,0.00,1452000.00,'Venta de mostrador',16,'2025-11-25 12:41:59',NULL,0,NULL),(40,6,6,16,13,'INVOICE_A','{TIPO}-0001-00000002','CONFIRMED','2025-11-27 22:33:07',1200000.00,0.0000,0.00,252000.00,0.00,1452000.00,'Convertido de presupuesto Presupuesto web',16,'2025-11-27 22:33:07',NULL,0,NULL),(41,6,6,16,14,'INVOICE_B','{TIPO}-0001-00000002','CONFIRMED','2025-11-28 17:37:16',1200000.00,0.0000,0.00,252000.00,0.00,1452000.00,'Venta de mostrador',16,'2025-11-28 17:37:16',NULL,0,NULL),(42,6,6,16,14,'INVOICE_B','{TIPO}-0001-00000003','CONFIRMED','2025-11-28 17:47:41',1200000.00,0.0000,0.00,252000.00,0.00,1452000.00,'Venta de mostrador',16,'2025-11-28 17:47:41',NULL,0,NULL),(43,6,6,16,13,'INVOICE_A','{TIPO}-0001-00000003','CONFIRMED','2025-11-28 18:31:01',1200000.00,0.0000,0.00,252000.00,0.00,1452000.00,'Venta de mostrador',16,'2025-11-28 18:31:01',NULL,0,NULL),(44,6,6,16,14,'INVOICE_B','{TIPO}-0001-00000004','CONFIRMED','2025-12-06 14:04:27',1200000.00,0.0000,0.00,252000.00,0.00,1452000.00,'Venta de mostrador',16,'2025-12-06 14:04:27',NULL,0,NULL),(45,6,6,16,14,'INVOICE_B','{TIPO}-0001-00000005','CONFIRMED','2025-12-06 14:13:43',1200000.00,0.0000,0.00,252000.00,0.00,1452000.00,'Venta de mostrador',16,'2025-12-06 14:13:43',NULL,0,NULL);
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movement_items`
--

DROP TABLE IF EXISTS `stock_movement_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_movement_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `movement_id` int NOT NULL,
  `variant_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_cost` decimal(14,2) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_smi_mv` (`movement_id`,`is_deleted`),
  KEY `idx_smi_variant_date` (`variant_id`,`is_deleted`),
  CONSTRAINT `fk_smi_mv` FOREIGN KEY (`movement_id`) REFERENCES `stock_movements` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_smi_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movement_items`
--

LOCK TABLES `stock_movement_items` WRITE;
/*!40000 ALTER TABLE `stock_movement_items` DISABLE KEYS */;
INSERT INTO `stock_movement_items` VALUES (1,1,1,-1,NULL,0,NULL),(2,4,1,50,NULL,0,NULL),(3,5,1,-1,NULL,0,NULL),(28,31,27,15,NULL,0,NULL),(29,32,28,20,NULL,0,NULL),(30,33,29,12,NULL,0,NULL),(31,34,30,7,NULL,0,NULL),(32,35,31,40,NULL,0,NULL),(33,36,27,-1,NULL,0,NULL),(34,37,27,-1,NULL,0,NULL),(35,38,27,-1,NULL,0,NULL),(36,39,31,-1,NULL,0,NULL),(37,40,27,-1,NULL,0,NULL),(38,40,31,-2,NULL,0,NULL),(39,41,27,-2,NULL,0,NULL),(40,41,31,-2,NULL,0,NULL),(41,42,31,-3,NULL,0,NULL),(42,43,27,-2,NULL,0,NULL),(43,44,31,-2,NULL,0,NULL),(44,45,31,-2,NULL,0,NULL),(45,46,31,-2,NULL,0,NULL),(46,47,31,-2,NULL,0,NULL),(47,48,31,-1,NULL,0,NULL),(48,49,31,-6,NULL,0,NULL),(49,50,31,-1,NULL,0,NULL),(50,51,31,-1,NULL,0,NULL),(51,51,27,-1,NULL,0,NULL),(52,52,27,-1,NULL,0,NULL),(53,53,27,-1,NULL,0,NULL),(54,54,27,-1,NULL,0,NULL),(55,55,36,20,NULL,0,NULL),(56,56,36,-2,NULL,0,NULL),(57,57,36,-1,NULL,0,NULL),(58,58,36,-1,NULL,0,NULL),(59,59,36,-1,NULL,0,NULL),(60,60,36,-1,NULL,0,NULL),(61,61,36,-1,NULL,0,NULL),(62,62,36,-1,NULL,0,NULL),(63,63,36,-1,NULL,0,NULL),(64,64,38,100,NULL,0,NULL),(65,65,38,-50,NULL,0,NULL);
/*!40000 ALTER TABLE `stock_movement_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movements`
--

DROP TABLE IF EXISTS `stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_movements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `org_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `type` enum('ENTRY','SALE','ADJUSTMENT','TRANSFER_OUT','TRANSFER_IN','INVENTORY') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ref_code` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transfer_ref` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sm_org_branch` (`org_id`,`branch_id`,`type`,`created_at`,`is_deleted`),
  KEY `fk_sm_user` (`created_by`),
  KEY `idx_sm_branch_date` (`branch_id`,`created_at`,`is_deleted`),
  CONSTRAINT `fk_sm_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_sm_org` FOREIGN KEY (`org_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_sm_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
INSERT INTO `stock_movements` VALUES (1,3,2,'SALE','FB-0001-00000001',NULL,NULL,7,'2025-10-24 10:20:29',0,NULL),(4,3,2,'ENTRY','INGRESO-INICIAL-001',NULL,'Carga inicial de stock',7,'2025-10-24 11:06:11',0,NULL),(5,3,2,'SALE','FB-0001-00000002',NULL,NULL,7,'2025-10-24 11:06:36',0,NULL),(6,4,3,'ENTRY','INGRESO-ORG4-001',NULL,'Carga inicial de stock Org 4',8,'2025-10-24 12:28:24',0,NULL),(7,4,3,'SALE','FB-0001-00000001',NULL,NULL,9,'2025-10-24 12:54:24',0,NULL),(10,4,3,'SALE','FA-0001-00000001',NULL,NULL,9,'2025-10-24 19:19:59',0,NULL),(16,4,3,'ENTRY','CSV_IMPORT',NULL,'ImportaciÃ³n CSV fila 4',8,'2025-10-24 20:40:46',0,NULL),(17,4,3,'ENTRY','CSV_IMPORT',NULL,'ImportaciÃ³n CSV fila 7',8,'2025-10-24 20:40:46',0,NULL),(18,4,3,'ENTRY','CSV_IMPORT',NULL,'ImportaciÃ³n CSV fila 10',8,'2025-10-24 20:40:46',0,NULL),(19,4,3,'ENTRY','CSV_IMPORT',NULL,'ImportaciÃ³n CSV fila 11',8,'2025-10-24 20:40:46',0,NULL),(20,4,3,'ENTRY','CSV_IMPORT',NULL,'ImportaciÃ³n CSV fila 13',8,'2025-10-24 20:40:46',0,NULL),(21,4,3,'ENTRY','CSV_IMPORT',NULL,'ImportaciÃ³n CSV fila 4',8,'2025-10-24 20:47:33',0,NULL),(22,4,3,'ENTRY','CSV_IMPORT',NULL,'ImportaciÃ³n CSV fila 7',8,'2025-10-24 20:47:33',0,NULL),(23,4,3,'ENTRY','CSV_IMPORT',NULL,'ImportaciÃ³n CSV fila 10',8,'2025-10-24 20:47:33',0,NULL),(24,4,3,'ENTRY','CSV_IMPORT',NULL,'ImportaciÃ³n CSV fila 11',8,'2025-10-24 20:47:33',0,NULL),(25,4,3,'ENTRY','CSV_IMPORT',NULL,'ImportaciÃ³n CSV fila 13',8,'2025-10-24 20:47:33',0,NULL),(26,4,3,'ENTRY','CSV_IMPORT',NULL,'ImportaciÃ³n CSV fila 4',8,'2025-10-31 17:30:11',0,NULL),(27,4,3,'ENTRY','CSV_IMPORT',NULL,'ImportaciÃ³n CSV fila 7',8,'2025-10-31 17:30:11',0,NULL),(28,4,3,'ENTRY','CSV_IMPORT',NULL,'ImportaciÃ³n CSV fila 10',8,'2025-10-31 17:30:11',0,NULL),(29,4,3,'ENTRY','CSV_IMPORT',NULL,'ImportaciÃ³n CSV fila 11',8,'2025-10-31 17:30:11',0,NULL),(30,4,3,'ENTRY','CSV_IMPORT',NULL,'ImportaciÃ³n CSV fila 13',8,'2025-10-31 17:30:11',0,NULL),(31,4,3,'ENTRY','CSV_IMPORT',NULL,'ImportaciÃ³n CSV fila 4',8,'2025-10-31 17:43:07',0,NULL),(32,4,3,'ENTRY','CSV_IMPORT',NULL,'ImportaciÃ³n CSV fila 7',8,'2025-10-31 17:43:07',0,NULL),(33,4,3,'ENTRY','CSV_IMPORT',NULL,'ImportaciÃ³n CSV fila 10',8,'2025-10-31 17:43:07',0,NULL),(34,4,3,'ENTRY','CSV_IMPORT',NULL,'ImportaciÃ³n CSV fila 11',8,'2025-10-31 17:43:07',0,NULL),(35,4,3,'ENTRY','CSV_IMPORT',NULL,'ImportaciÃ³n CSV fila 13',8,'2025-10-31 17:43:08',0,NULL),(36,4,3,'SALE','FB-0001-00000002',NULL,'Venta de mostrador',9,'2025-11-11 22:09:13',0,NULL),(37,4,3,'SALE','FB-0001-00000003',NULL,'Venta de mostrador',9,'2025-11-11 22:09:42',0,NULL),(38,4,3,'SALE','FB-0001-00000004',NULL,'Venta de mostrador',9,'2025-11-13 22:28:46',0,NULL),(39,4,3,'SALE','FB-0001-00000005',NULL,'Venta de mostrador',9,'2025-11-13 22:34:50',0,NULL),(40,4,3,'SALE','FB-0001-00000006',NULL,'Venta de mostrador',9,'2025-11-13 22:55:07',0,NULL),(41,4,3,'SALE','FB-0001-00000007',NULL,'Venta de mostrador',9,'2025-11-13 22:58:40',0,NULL),(42,4,3,'SALE','FB-0001-00000008',NULL,'Venta de mostrador',9,'2025-11-13 23:17:13',0,NULL),(43,4,3,'SALE','FB-0001-00000009',NULL,'Venta de mostrador',9,'2025-11-14 19:08:37',0,NULL),(44,4,3,'SALE','FB-0001-00000010',NULL,'Venta de mostrador',9,'2025-11-15 23:34:01',0,NULL),(45,4,3,'SALE','FB-0001-00000011',NULL,'Venta de mostrador',9,'2025-11-15 23:36:30',0,NULL),(46,4,3,'SALE','FB-0001-00000012',NULL,'Venta de mostrador',9,'2025-11-15 23:49:12',0,NULL),(47,4,3,'SALE','FB-0001-00000013',NULL,'Venta de mostrador',9,'2025-11-16 00:06:20',0,NULL),(48,4,3,'SALE','FB-0001-00000014',NULL,'Venta de mostrador',9,'2025-11-22 00:46:47',0,NULL),(49,4,3,'SALE','FB-0001-00000015',NULL,'Venta de mostrador',9,'2025-11-22 00:47:30',0,NULL),(50,4,3,'SALE','FA-0001-00000002',NULL,NULL,9,'2025-11-24 13:24:05',0,NULL),(51,4,3,'SALE','FB-0001-00000016',NULL,NULL,9,'2025-11-24 13:31:14',0,NULL),(52,4,3,'SALE','FB-0001-00000017',NULL,NULL,9,'2025-11-24 13:40:35',0,NULL),(53,4,3,'SALE','FB-0001-00000018',NULL,NULL,9,'2025-11-24 13:41:09',0,NULL),(54,4,3,'SALE','FB-0001-00000019',NULL,NULL,9,'2025-11-24 13:51:26',0,NULL),(55,6,6,'ENTRY',NULL,NULL,NULL,15,'2025-11-24 22:20:30',0,NULL),(56,6,6,'SALE','{TIPO}-0001-00000001',NULL,NULL,16,'2025-11-25 12:39:36',0,NULL),(57,6,6,'SALE','{TIPO}-0001-00000001',NULL,'Venta de mostrador',16,'2025-11-25 12:41:59',0,NULL),(58,6,6,'SALE','{TIPO}-0001-00000002',NULL,NULL,16,'2025-11-27 22:33:07',0,NULL),(59,6,6,'SALE','{TIPO}-0001-00000002',NULL,'Venta de mostrador',16,'2025-11-28 17:37:16',0,NULL),(60,6,6,'SALE','{TIPO}-0001-00000003',NULL,'Venta de mostrador',16,'2025-11-28 17:47:41',0,NULL),(61,6,6,'SALE','{TIPO}-0001-00000003',NULL,'Venta de mostrador',16,'2025-11-28 18:31:01',0,NULL),(62,6,6,'SALE','{TIPO}-0001-00000004',NULL,'Venta de mostrador',16,'2025-12-06 14:04:27',0,NULL),(63,6,6,'SALE','{TIPO}-0001-00000005',NULL,'Venta de mostrador',16,'2025-12-06 14:13:43',0,NULL),(64,6,6,'ENTRY',NULL,NULL,NULL,16,'2025-12-06 15:46:40',0,NULL),(65,6,6,'TRANSFER_OUT',NULL,NULL,'pasaje de s',16,'2025-12-06 15:48:28',0,NULL);
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_transfer_items`
--

DROP TABLE IF EXISTS `stock_transfer_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_transfer_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transfer_id` int NOT NULL,
  `variant_id` int NOT NULL,
  `quantity` int NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sti_transfer` (`transfer_id`,`is_deleted`),
  KEY `fk_sti_variant` (`variant_id`),
  CONSTRAINT `fk_sti_transfer` FOREIGN KEY (`transfer_id`) REFERENCES `stock_transfers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sti_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_transfer_items`
--

LOCK TABLES `stock_transfer_items` WRITE;
/*!40000 ALTER TABLE `stock_transfer_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_transfer_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_transfers`
--

DROP TABLE IF EXISTS `stock_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_transfers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `org_id` int NOT NULL,
  `origin_branch_id` int NOT NULL,
  `dest_branch_id` int NOT NULL,
  `status` enum('IN_TRANSIT','RECEIVED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IN_TRANSIT',
  `transfer_code` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `received_by` int DEFAULT NULL,
  `received_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_transfer_code_active` (`transfer_code`,`is_deleted`),
  KEY `idx_st_org_status` (`org_id`,`status`,`is_deleted`),
  KEY `fk_st_origin` (`origin_branch_id`),
  KEY `fk_st_dest` (`dest_branch_id`),
  KEY `fk_st_user1` (`created_by`),
  KEY `fk_st_user2` (`received_by`),
  CONSTRAINT `fk_st_dest` FOREIGN KEY (`dest_branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_st_org` FOREIGN KEY (`org_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_st_origin` FOREIGN KEY (`origin_branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_st_user1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_st_user2` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_transfers`
--

LOCK TABLES `stock_transfers` WRITE;
/*!40000 ALTER TABLE `stock_transfers` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subcategories`
--

DROP TABLE IF EXISTS `subcategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subcategories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_subcat_cat_active` (`category_id`,`name`,`is_deleted`),
  KEY `idx_subcat_cat` (`category_id`,`is_deleted`),
  CONSTRAINT `fk_subcat_cat` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subcategories`
--

LOCK TABLES `subcategories` WRITE;
/*!40000 ALTER TABLE `subcategories` DISABLE KEYS */;
INSERT INTO `subcategories` VALUES (17,19,'Camisas',0,NULL),(18,19,'Pantalones',0,NULL),(19,20,'Zapatillas',0,NULL),(20,21,'Gorras',0,NULL),(21,23,'Test',0,NULL),(22,24,'Celulares',0,NULL);
/*!40000 ALTER TABLE `subcategories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tags` (
  `id` int NOT NULL AUTO_INCREMENT,
  `org_id` int DEFAULT NULL,
  `name` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tag_org_name_active` (`org_id`,`name`,`is_deleted`),
  KEY `idx_tags_org` (`org_id`,`is_deleted`),
  CONSTRAINT `fk_tags_org` FOREIGN KEY (`org_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tags`
--

LOCK TABLES `tags` WRITE;
/*!40000 ALTER TABLE `tags` DISABLE KEYS */;
INSERT INTO `tags` VALUES (1,1,'VIP',0,NULL),(2,1,'Mayorista',0,NULL),(3,1,'Comercio',0,NULL),(4,1,'Online',0,NULL),(5,4,'Mayorista',0,NULL),(6,4,'VIP',0,NULL),(8,4,'Regular',0,NULL);
/*!40000 ALTER TABLE `tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_branches`
--

DROP TABLE IF EXISTS `user_branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_branch_active` (`user_id`,`branch_id`,`is_deleted`),
  KEY `idx_ub_user` (`user_id`,`is_deleted`),
  KEY `idx_ub_branch` (`branch_id`,`is_deleted`),
  CONSTRAINT `fk_ub_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ub_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_branches`
--

LOCK TABLES `user_branches` WRITE;
/*!40000 ALTER TABLE `user_branches` DISABLE KEYS */;
INSERT INTO `user_branches` VALUES (1,7,2,0,NULL),(2,9,3,0,NULL),(3,16,5,0,NULL),(4,16,6,0,NULL);
/*!40000 ALTER TABLE `user_branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` int NOT NULL DEFAULT '2',
  `org_id` int DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `status` enum('ACTIVE','INVITED','SUSPENDED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INVITED',
  `password_set_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_set_expires` datetime DEFAULT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT '0',
  `reset_password_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_password_expires` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email_active` (`email`,`is_deleted`),
  UNIQUE KEY `uq_users_username_active` (`username`,`is_deleted`),
  KEY `idx_users_org_branch` (`org_id`,`branch_id`,`is_deleted`),
  KEY `fk_users_role` (`role_id`),
  KEY `fk_users_branch` (`branch_id`),
  KEY `idx_users_password_set_token` (`password_set_token`),
  KEY `idx_users_reset_password_token` (`reset_password_token`),
  CONSTRAINT `fk_users_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_users_org` FOREIGN KEY (`org_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin','admin@conty.app','admin','$2b$10$FMbvdVpmRX7ndOdfpWwsV.nh/uuF49Xb8DtXjXBJ1ndz31r/yjoTS',1,NULL,NULL,'2025-10-02 16:33:00',NULL,0,NULL,'ACTIVE',NULL,NULL,1,NULL,NULL),(2,'Owner Demo','owner@conty.app','owner','$2b$10$SYB281WXTKXuTM2PG.Esxu22ItCCGQoDWFxOfPchS0EHfoPThFXjy',2,3,1,'2025-10-02 16:33:00',NULL,0,NULL,'ACTIVE',NULL,NULL,0,NULL,NULL),(4,'Owner Demo','owner2@conty.app','owner.demo2','$2b$10$H5MrnpRF10942NrwPjwFCOcF6DyD9QfPEvFF8Mut/nbuB3Vtg8Yhm',2,NULL,NULL,'2025-10-09 17:44:21',1,0,NULL,'ACTIVE',NULL,NULL,1,NULL,NULL),(5,'Owner Invitado','owner.inv3@conty.app','owner.inv3','$2b$10$eYhnZGHlazvbPdkxhg8s..1NMMLFeo4J5x8mHahX7zgsCUATd.EZO',2,NULL,NULL,'2025-10-09 17:45:28',1,0,NULL,'ACTIVE',NULL,NULL,1,NULL,NULL),(6,'Seb Personal','spadea.sebastian@gmail.com','seb.personal','$2b$10$bWvHBhfPx5N9.rXaQvd9Pu4xNHwvIKalr6ilTqrlzouqKBVS/wARW',2,NULL,NULL,'2025-10-09 19:15:48',1,0,NULL,'ACTIVE',NULL,NULL,1,'c552ab66f562be2fd4dce8585453902aaf9f2ff4cb7f8518a055715adb6370d0','2025-10-11 19:29:56'),(7,'Juan Perez','saspadea@fecea.edu.ar','juan.perez','$2b$10$1gIXaKDn6BEB3upemZB9s.0N.WmvOls8WSojMnaRZkP4Ie5jNsmiq',3,3,NULL,'2025-10-23 20:18:24',2,0,NULL,'ACTIVE',NULL,NULL,1,NULL,NULL),(8,'Primer Owner','owner.nuevo@example.com','owner.nuevo','$2b$10$Df/MnONb3XL/HZnCd6e61e2xFWu11VM4OGC8CJXMiZ7JvDTSUJEK2',2,4,NULL,'2025-10-24 12:05:33',1,0,NULL,'ACTIVE',NULL,NULL,1,NULL,NULL),(9,'Ana Gomez','ana.gomez@example.com','ana.gomez','$2b$10$FMbvdVpmRX7ndOdfpWwsV.nh/uuF49Xb8DtXjXBJ1ndz31r/yjoTS',3,4,NULL,'2025-10-24 12:13:41',8,0,NULL,'ACTIVE',NULL,NULL,1,NULL,NULL),(10,'Juan Pablo Leon','leonjuampi@gmail.com','jleon','$2b$10$29WGL3nFvBDdG5Plb/em8eNZ3C/4jB9XLZNldPPVWyVs13X/b1uKy',2,5,NULL,'2025-11-22 23:45:43',1,0,NULL,'ACTIVE',NULL,NULL,0,NULL,NULL),(11,'Johanna Cremaschi','johacremaschi@gmail.com','jcremaschi','',3,5,NULL,'2025-11-23 00:52:19',10,0,NULL,'INVITED','ae8012c3794e34794a921dd6f937359573c1f8a8b67cd1fe45ed4e6e52fcc46e','2025-11-25 00:52:19',0,NULL,NULL),(12,'usuario de Test','jpleon@jobint.com','test','',3,5,NULL,'2025-11-23 00:53:59',10,0,NULL,'INVITED','a6e31edb2f9f526eda3eb516b2c360edae3b6973f8870a5576de4a6ddb6eaa8d','2025-11-25 00:54:00',0,NULL,NULL),(14,'test2','jpleon2@outlook.com','test2','$2b$10$3vODIhig.ePXMM0tsVR5reyCU7ei52FEd4SNaaIz23xVvR2HKhNFm',3,5,NULL,'2025-11-23 01:24:02',10,0,NULL,'ACTIVE',NULL,NULL,1,'39445ea1cc7eaefd57d323ed752debbe509074c5cac89421cc89ca70c64a14e8','2025-11-25 01:26:14'),(15,'Juan Dueño','juan@test.com','owner_test','$2b$10$uLqafdyKv5.VmINDDtKRcu4q93nUaZ3pYMqOftVmjALJ/ipmbC7zG',2,6,NULL,'2025-11-24 20:14:46',1,0,NULL,'ACTIVE',NULL,NULL,0,NULL,NULL),(16,'Ana Vendedora','ana@test.com','ana_vend','$2b$10$bhLz4Wtaiundsu1AyrvCd.O4Q9rnO69.b3HDOzHMLbP9dlQPWDOaW',3,6,NULL,'2025-11-24 20:53:22',15,0,NULL,'ACTIVE',NULL,NULL,1,NULL,NULL),(17,'Facundo Castellano','elfacu@gmail.com','elfacu','$2b$10$b9c5q5O.U20emRCi6z1QvOEx8WTt./dwZYsXNBr/MJKj3fjJ/wYj6',2,NULL,NULL,'2025-11-28 18:26:12',1,0,NULL,'ACTIVE',NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `v_customer_balance`
--

DROP TABLE IF EXISTS `v_customer_balance`;
/*!50001 DROP VIEW IF EXISTS `v_customer_balance`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_customer_balance` AS SELECT 
 1 AS `customer_id`,
 1 AS `balance`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_inventory_value`
--

DROP TABLE IF EXISTS `v_inventory_value`;
/*!50001 DROP VIEW IF EXISTS `v_inventory_value`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_inventory_value` AS SELECT 
 1 AS `org_id`,
 1 AS `branch_id`,
 1 AS `inventory_value`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_stock_bajo`
--

DROP TABLE IF EXISTS `v_stock_bajo`;
/*!50001 DROP VIEW IF EXISTS `v_stock_bajo`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_stock_bajo` AS SELECT 
 1 AS `branch_id`,
 1 AS `variant_id`,
 1 AS `diff`,
 1 AS `qty`,
 1 AS `min_qty`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `v_customer_balance`
--

/*!50001 DROP VIEW IF EXISTS `v_customer_balance`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_customer_balance` AS select `t`.`customer_id` AS `customer_id`,sum((case `t`.`type` when 'INVOICE' then `t`.`amount` when 'CREDIT_NOTE' then -(`t`.`amount`) when 'PAYMENT' then -(`t`.`amount`) when 'ADJUSTMENT' then `t`.`amount` else 0 end)) AS `balance` from (`ar_transactions` `t` join `customers` `c` on(((`c`.`id` = `t`.`customer_id`) and (`c`.`is_deleted` = 0)))) where (`t`.`is_deleted` = 0) group by `t`.`customer_id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_inventory_value`
--

/*!50001 DROP VIEW IF EXISTS `v_inventory_value`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_inventory_value` AS select `p`.`org_id` AS `org_id`,`bvs`.`branch_id` AS `branch_id`,sum((coalesce(`pv`.`price`,`p`.`price`) * `bvs`.`qty`)) AS `inventory_value` from ((`product_variants` `pv` join `products` `p` on((`p`.`id` = `pv`.`product_id`))) join `branch_variant_stock` `bvs` on((`bvs`.`variant_id` = `pv`.`id`))) where ((`pv`.`is_deleted` = 0) and (`p`.`is_deleted` = 0)) group by `p`.`org_id`,`bvs`.`branch_id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_stock_bajo`
--

/*!50001 DROP VIEW IF EXISTS `v_stock_bajo`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_stock_bajo` AS select `bvs`.`branch_id` AS `branch_id`,`pv`.`id` AS `variant_id`,(`bvs`.`qty` - `bvs`.`min_qty`) AS `diff`,`bvs`.`qty` AS `qty`,`bvs`.`min_qty` AS `min_qty` from ((`branch_variant_stock` `bvs` join `product_variants` `pv` on(((`pv`.`id` = `bvs`.`variant_id`) and (`pv`.`is_deleted` = 0)))) join `products` `p` on(((`p`.`id` = `pv`.`product_id`) and (`p`.`is_deleted` = 0)))) where (`bvs`.`qty` < `bvs`.`min_qty`) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-07 16:18:45
