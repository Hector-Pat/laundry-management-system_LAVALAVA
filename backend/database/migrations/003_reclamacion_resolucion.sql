-- Agrega un flujo de resolucion a las reclamaciones: hoy quedaban abiertas
-- para siempre, sin forma de marcarlas atendidas.
-- Ejecutar sobre una base de datos ya creada con schema.sql (las instalaciones
-- nuevas ya incluyen estas columnas en schema.sql).

USE lavalavabd;

ALTER TABLE reclamaciones
  ADD COLUMN status ENUM('ABIERTA', 'RESUELTA') NOT NULL DEFAULT 'ABIERTA',
  ADD COLUMN resolution_notes TEXT NULL,
  ADD COLUMN resolved_by INT NULL,
  ADD COLUMN resolved_at DATETIME NULL,
  ADD FOREIGN KEY (resolved_by) REFERENCES users(id),
  ADD INDEX idx_reclamaciones_status (status);
