-- Permite anular un pago registrado por error, sin borrar el registro
-- (queda como historial con quien lo anulo, cuando y por que).
-- Ejecutar sobre una base de datos ya creada con schema.sql (las instalaciones
-- nuevas ya incluyen estas columnas en schema.sql).

USE lavalavabd;

ALTER TABLE pagos
  ADD COLUMN is_voided BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN voided_at DATETIME NULL,
  ADD COLUMN voided_by INT NULL,
  ADD COLUMN void_reason VARCHAR(255) NULL,
  ADD FOREIGN KEY (voided_by) REFERENCES users(id);
