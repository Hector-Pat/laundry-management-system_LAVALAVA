-- Vinculacion de clientes con Telegram (RF-04, reemplaza la notificacion
-- por WhatsApp/Twilio): el bot guarda aqui el chat_id cuando el cliente le
-- comparte su numero de telefono y coincide con un registro de clientes.
-- Ejecutar sobre una base de datos ya creada con schema.sql (las instalaciones
-- nuevas ya incluyen esta columna en schema.sql).

USE lavalavabd;

ALTER TABLE clientes
  ADD COLUMN telegram_chat_id VARCHAR(32) NULL AFTER email;
