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

-- Clientes de mostrador: directorio propio, separado de users/login.
-- La mayoria de los clientes de una lavanderia no necesita ni quiere una cuenta
-- con contraseña; el personal los da de alta con solo nombre y telefono al
-- registrar un pedido (RNF-04). Quien sí quiera un portal de autoservicio se
-- registra por separado en users con rol CLIENT.
CREATE TABLE IF NOT EXISTS clientes (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(150) NOT NULL,
  phone_number  VARCHAR(10) NOT NULL,
  email         VARCHAR(150),
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_clientes_full_name (full_name),
  INDEX idx_clientes_phone_number (phone_number)
);

-- Catalogo de servicios de lavanderia (precio vigente al momento de crear un pedido).
CREATE TABLE IF NOT EXISTS servicios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL UNIQUE,
  price         DECIMAL(10,2) NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO servicios (name, price) VALUES
  ('Lavado por kilo', 25.00),
  ('Lavado y secado por kilo', 35.00),
  ('Planchado por prenda', 15.00),
  ('Tintoreria - traje', 120.00),
  ('Tintoreria - vestido', 150.00),
  ('Edredon o cobija', 90.00);

-- Contador auxiliar para generar folios unicos LAV-YYYYMMDD-XXX (uno por dia).
CREATE TABLE IF NOT EXISTS pedido_folio_counters (
  folio_date    DATE PRIMARY KEY,
  last_seq      INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pedidos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  folio         VARCHAR(20) NOT NULL UNIQUE,
  cliente_id    INT NOT NULL,
  status        ENUM('RECIBIDO', 'LAVADO', 'SECADO', 'PLANCHADO', 'LISTO', 'ENTREGADO')
                  NOT NULL DEFAULT 'RECIBIDO',
  total         DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_by    INT NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  delivered_at  TIMESTAMP NULL,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_pedidos_status (status),
  INDEX idx_pedidos_created_at (created_at)
);

-- Detalle de servicios por pedido. servicio_name y unit_price quedan
-- "congelados" al momento de la venta para no alterar pedidos pasados si el
-- catalogo de servicios cambia de nombre o precio despues.
CREATE TABLE IF NOT EXISTS detalle_pedido (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id     INT NOT NULL,
  servicio_id   INT NOT NULL,
  servicio_name VARCHAR(100) NOT NULL,
  quantity      INT NOT NULL,
  unit_price    DECIMAL(10,2) NOT NULL,
  subtotal      DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (servicio_id) REFERENCES servicios(id)
);

-- Pagos de un pedido (RF-06). Puede haber varios registros por pedido: un
-- adelanto al recibirlo y despues el saldo al entregarlo, o un solo pago de
-- contado. El "type" se calcula en el backend a partir del saldo pendiente
-- en el momento del pago, no lo decide quien lo registra.
CREATE TABLE IF NOT EXISTS pagos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id     INT NOT NULL,
  amount        DECIMAL(10,2) NOT NULL,
  method        ENUM('EFECTIVO', 'TARJETA', 'TRANSFERENCIA') NOT NULL DEFAULT 'EFECTIVO',
  type          ENUM('CONTADO', 'ADELANTO', 'SALDO') NOT NULL,
  registered_by INT NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (registered_by) REFERENCES users(id),
  INDEX idx_pagos_pedido_id (pedido_id),
  INDEX idx_pagos_created_at (created_at)
);
