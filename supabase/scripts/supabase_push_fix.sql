-- Script para corregir el error de restricción única en push_subscriptions
-- Este script permite que el comando upsert (ON CONFLICT) funcione correctamente

-- 1. Eliminar duplicados si los hay (opcional pero recomendado)
DELETE FROM push_subscriptions a USING push_subscriptions b
WHERE a.id < b.id AND a.user_id = b.user_id;

-- 2. Añadir restricción única al campo user_id
-- Esto asegura que cada técnico tenga solo una suscripción activa (la última usada)
ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_key UNIQUE (user_id);

-- 3. (Opcional) Si prefieres permitir múltiples dispositivos por usuario, usa este índice en su lugar:
-- DROP CONSTRAINT push_subscriptions_user_id_key;
-- CREATE UNIQUE INDEX idx_push_subscriptions_user_endpoint ON push_subscriptions (user_id, (subscription->>'endpoint'));
