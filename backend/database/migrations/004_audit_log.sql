-- Bitacora de acciones sensibles: quien forzo un estado de pedido fuera de
-- la transicion normal, cancelo un pedido, anulo un pago, resolvio una
-- reclamacion, o cambio el rol/estado de otro usuario.
-- Ejecutar sobre una base de datos ya creada con schema.sql (las instalaciones
-- nuevas ya incluyen esta tabla en schema.sql).

USE lavalavabd;

CREATE TABLE IF NOT EXISTS audit_log (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NULL,
  action        VARCHAR(100) NOT NULL,
  entity_type   VARCHAR(50) NOT NULL,
  entity_id     INT NOT NULL,
  details       JSON NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_audit_log_created_at (created_at),
  INDEX idx_audit_log_entity (entity_type, entity_id)
);
