-- Plantillas de ficha tomadas del relevamiento (Modelo de historia clinica.docx).
-- Idempotente y NO destructivo: inserta solo las que falten (por nombre), no borra nada.
--   psql "<URL>" -f packages/api/scripts/plantillas.sql
SET client_encoding TO 'UTF8';

INSERT INTO plantillas_ficha (instance_id, nombre, schema, activa)
SELECT 1, 'Antecedentes personales',
'{"secciones":["General","Ginecológicos","Urológicos","Endoscopía","Familiares"],"campos":[
  {"code":"patologias_conocidas","label":"Patologías conocidas","tipo":"textarea","seccion":"General"},
  {"code":"medicacion_habitual","label":"Medicación habitual","tipo":"textarea","seccion":"General"},
  {"code":"cirugias","label":"Cirugías","tipo":"textarea","seccion":"General"},
  {"code":"internaciones_previas","label":"Internaciones previas","tipo":"textarea","seccion":"General"},
  {"code":"pap","label":"PAP","tipo":"text","seccion":"Ginecológicos"},
  {"code":"eco_mamaria","label":"Ecografía mamaria","tipo":"text","seccion":"Ginecológicos"},
  {"code":"eco_ginecologica","label":"Ecografía ginecológica","tipo":"text","seccion":"Ginecológicos"},
  {"code":"ca_ginecologico","label":"CA","tipo":"text","seccion":"Ginecológicos"},
  {"code":"familiares_ginecologicos","label":"Familiares (ginecológico)","tipo":"text","seccion":"Ginecológicos"},
  {"code":"ant_obstetricos","label":"Antecedentes obstétricos","tipo":"textarea","seccion":"Ginecológicos"},
  {"code":"intercurrencias","label":"Intercurrencias","tipo":"textarea","seccion":"Ginecológicos"},
  {"code":"control_urologico","label":"Control urológico","tipo":"text","seccion":"Urológicos"},
  {"code":"ca_urologico","label":"CA","tipo":"text","seccion":"Urológicos"},
  {"code":"familiares_urologicos","label":"Familiares (urológico)","tipo":"text","seccion":"Urológicos"},
  {"code":"veda","label":"VEDA","tipo":"text","seccion":"Endoscopía"},
  {"code":"veda_fecha","label":"VEDA - Fecha","tipo":"date","seccion":"Endoscopía"},
  {"code":"colonoscopia","label":"Colonoscopia","tipo":"text","seccion":"Endoscopía"},
  {"code":"colonoscopia_fecha","label":"Colonoscopia - Fecha","tipo":"date","seccion":"Endoscopía"},
  {"code":"fam_madre","label":"Madre","tipo":"text","seccion":"Familiares"},
  {"code":"fam_padre","label":"Padre","tipo":"text","seccion":"Familiares"},
  {"code":"fam_hermanos","label":"Hermanos","tipo":"text","seccion":"Familiares"}
]}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM plantillas_ficha WHERE instance_id = 1 AND nombre = 'Antecedentes personales');

INSERT INTO plantillas_ficha (instance_id, nombre, schema, activa)
SELECT 1, 'Hábitos',
'{"campos":[
  {"code":"tabaquismo","label":"Tabaquismo","tipo":"select","opciones":["No","Sí","Ex-fumador"]},
  {"code":"paquetes_anio","label":"Paquetes / año","tipo":"number"},
  {"code":"enolismo","label":"Enolismo","tipo":"select","opciones":["No","Ocasional","Habitual"]},
  {"code":"litros_dia","label":"Litros / día","tipo":"text"},
  {"code":"alergias","label":"Alergias","tipo":"textarea"},
  {"code":"actividad_fisica","label":"Actividad física","tipo":"text"},
  {"code":"vacunas","label":"Vacunas","tipo":"textarea"}
]}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM plantillas_ficha WHERE instance_id = 1 AND nombre = 'Hábitos');

INSERT INTO plantillas_ficha (instance_id, nombre, schema, activa)
SELECT 1, 'Exámenes complementarios',
'{"campos":[
  {"code":"rx","label":"RX","tipo":"text"},
  {"code":"rx_fecha","label":"RX - Fecha","tipo":"date"},
  {"code":"rmn","label":"RMN","tipo":"text"},
  {"code":"rmn_fecha","label":"RMN - Fecha","tipo":"date"},
  {"code":"ecografia","label":"Ecografía","tipo":"text"},
  {"code":"dmo","label":"DMO","tipo":"text"},
  {"code":"dmo_fecha","label":"DMO - Fecha","tipo":"date"}
]}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM plantillas_ficha WHERE instance_id = 1 AND nombre = 'Exámenes complementarios');

-- Laboratorio: vista tabla (pivot analitos x fechas). Cada ficha = una extraccion (con fecha).
INSERT INTO plantillas_ficha (instance_id, nombre, schema, activa)
SELECT 1, 'Laboratorio',
'{"vista":"tabla","campos":[
  {"code":"hemograma","label":"Hemograma","tipo":"text"},
  {"code":"plaquetas","label":"Plaquetas","tipo":"text"},
  {"code":"glucemia","label":"Glucemia","tipo":"text"},
  {"code":"uremia","label":"Uremia","tipo":"text"},
  {"code":"creatininemia","label":"Creatininemia","tipo":"text"},
  {"code":"ionograma","label":"Ionograma sérico","tipo":"text"},
  {"code":"calcemia","label":"Calcemia","tipo":"text"},
  {"code":"fosfatemia","label":"Fosfatemia","tipo":"text"},
  {"code":"magnesemia","label":"Magnesemia","tipo":"text"},
  {"code":"colesterol_total","label":"Colesterol total","tipo":"text"},
  {"code":"colesterol_hdl_ldl","label":"Colesterol HDL / LDL","tipo":"text"},
  {"code":"trigliceridos","label":"Triglicéridos","tipo":"text"},
  {"code":"tgo","label":"TGO","tipo":"text"},
  {"code":"tgp","label":"TGP","tipo":"text"},
  {"code":"fal","label":"FAL","tipo":"text"},
  {"code":"bilirrubina_total","label":"Bilirrubina total (dir/indir)","tipo":"text"},
  {"code":"ggt","label":"Gammaglutamiltranspeptidasa (GGT)","tipo":"text"},
  {"code":"amilasemia","label":"Amilasemia","tipo":"text"},
  {"code":"tsh","label":"TSH","tipo":"text"},
  {"code":"t4_libre","label":"T4 libre","tipo":"text"},
  {"code":"uricemia","label":"Uricemia","tipo":"text"},
  {"code":"vit_d3","label":"Vitamina D3","tipo":"text"},
  {"code":"ves_pcr","label":"VES / PCR","tipo":"text"},
  {"code":"pxe","label":"PXE","tipo":"text"},
  {"code":"latex","label":"Látex","tipo":"text"},
  {"code":"fan","label":"FAN","tipo":"text"}
]}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM plantillas_ficha WHERE instance_id = 1 AND nombre = 'Laboratorio');

SELECT id, nombre, schema->>'vista' AS vista, jsonb_array_length(schema->'campos') AS campos
FROM plantillas_ficha WHERE instance_id = 1 ORDER BY id;
