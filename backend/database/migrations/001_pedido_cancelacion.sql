-- Agrega la posibilidad de cancelar un pedido sin modelarlo como un
-- ORDER_STATUS mas (la cancelacion puede pasar desde cualquier estado no
-- terminal, no solo desde el "anterior" en la cadena RECIBIDO->...->ENTREGADO).
-- Ejecutar sobre una base de datos ya creada con schema.sql (las instalaciones
-- nuevas ya incluyen estas columnas en schema.sql).

USE lavalavabd;

ALTER TABLE pedidos
  ADD COLUMN cancelled_at DATETIME NULL,
  ADD COLUMN cancelled_by INT NULL,
  ADD COLUMN cancel_reason VARCHAR(255) NULL,
  ADD FOREIGN KEY (cancelled_by) REFERENCES users(id);
