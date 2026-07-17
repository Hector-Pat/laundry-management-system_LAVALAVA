-- Esquema de base de datos para Lava-Lava (Laundry Management System)
-- Ejecutar este script en MySQL para crear la base de datos y las tablas necesarias.

CREATE DATABASE IF NOT EXISTS lavalavabd
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE lavalavabd;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(150) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone_number  VARCHAR(10),
  birth_date    DATE,
  role          ENUM('ADMIN', 'RECEPCIONISTA', 'OPERADOR', 'CLIENT') NOT NULL DEFAULT 'CLIENT',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Cuenta ADMIN inicial (el registro público bloquea la creación de admins).
-- Contraseña: Admin123 (hash generado con bcrypt, 10 salt rounds).
-- Cámbiala apenas puedas iniciar sesión.
INSERT INTO users (full_name, email, password_hash, role)
VALUES (
  'Administrador',
  'admin@lavalava.com',
  '$2b$10$rl.wtPIajzl1xVdGMkpuLO5JssgPoaJzteRMcZzptDeBtiTAzijpy',
  'ADMIN'
);
