-- Seed inicial de HC. Corre una vez contra la base (local o de Render).
--   psql "<connection-string>" -f packages/api/scripts/seed.sql
--
-- El firebase_uid es el del medico real en Firebase Auth (proyecto hc-prod-7b279).
-- Ajustá email/nombre/apellido a los datos reales del medico si querés.

-- 1. Instancia (tenant). El "instance-id" que se usa en el login.
INSERT INTO instances (id, nombre, activo)
VALUES (1, 'Clinica Demo', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Medico. instance_id debe coincidir con el del login; firebase_uid con la cuenta real.
INSERT INTO usuarios (instance_id, firebase_uid, email, nombre, apellido, activo)
VALUES (1, 'y01Vnh5Ib1bS15u4fgc0aO92rOE2', 'medico@ejemplo.com', 'Nombre', 'Apellido', true)
ON CONFLICT (instance_id, firebase_uid) DO NOTHING;

-- 3. Plantillas de ficha: estan en plantillas.sql (tomadas del relevamiento).
--    Correr aparte:  psql "<URL>" -f packages/api/scripts/plantillas.sql
