-- Seed inicial de HC. Corre una vez contra la base (local o de Render).
--   psql "<connection-string>" -f packages/api/scripts/seed.sql
--
-- IMPORTANTE: reemplazá <FIREBASE_UID> por el uid real del medico en Firebase Auth.
-- (lo ves en Authentication del proyecto Firebase, o en el emulador en :4000)

-- 1. Instancia (tenant). El "instance-id" que se usa en el login.
INSERT INTO instances (id, nombre, activo)
VALUES (1, 'Clinica Demo', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Medico. instance_id debe coincidir con el del login; firebase_uid con la cuenta real.
INSERT INTO usuarios (instance_id, firebase_uid, email, nombre, apellido, activo)
VALUES (1, '<FIREBASE_UID>', 'medico@ejemplo.com', 'Nombre', 'Apellido', true)
ON CONFLICT (instance_id, firebase_uid) DO NOTHING;

-- 3. Plantilla de ficha de ejemplo (opcional).
INSERT INTO plantillas_ficha (instance_id, nombre, schema, activa)
VALUES (
  1,
  'Antecedentes',
  '{"secciones":["Antecedentes"],"campos":[
    {"code":"tabaquismo","label":"Tabaquismo","tipo":"boolean","seccion":"Antecedentes"},
    {"code":"alergias","label":"Alergias","tipo":"textarea","seccion":"Antecedentes"},
    {"code":"grupo_sanguineo","label":"Grupo sanguineo","tipo":"select","opciones":["A+","A-","0+","0-","AB+","AB-"]},
    {"code":"peso_kg","label":"Peso (kg)","tipo":"number"},
    {"code":"ultima_consulta","label":"Ultima consulta","tipo":"date"}
  ]}'::jsonb,
  true
)
ON CONFLICT DO NOTHING;
