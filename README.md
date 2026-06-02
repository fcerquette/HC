# HC — Historia Clínica (multitenant)

Sistema de historia clínica de pacientes, multitenant (SaaS). Stack tomado de eternumpro
pero proyecto independiente.

## Stack

- **Monorepo:** turbo + npm workspaces, Node 24
- **Backend:** NestJS 11 + TypeORM 0.3 + PostgreSQL (Cloud SQL)
- **Frontend:** Vue 3 + Vite + TypeScript + Pinia + Vue Router + SCSS
- **Auth:** Firebase Auth (JWT Bearer), `firebase-admin` en el backend
- **Multitenancy:** por `instance_id` + `company_id`, esquema compartido, contexto por request vía `AsyncLocalStorage`

## Estructura

```
packages/
  shared/      tipos y enums compartidos
  api/         backend NestJS
  frontend/    SPA Vue 3
```

## Puesta en marcha

```bash
npm install
# configurar packages/api/.env (ver .env.development de cada paquete)
npm run dev          # levanta api + frontend
```

## Modelo de datos

Instance → Company → (Usuario médico, Paciente, Visita, FichaPaciente).
Fichas configurables por plantilla (JSONB, no EAV, no form-builder).
Voz (grabación → transcripción) es **fase 2**, ya contemplada en el modelo.

## Legal (Argentina)

Datos de salud sensibles (Ley 25.326, Ley 26.529). Requiere cifrado, control de acceso,
log de auditoría (`LogAuditoria`) y consentimiento para grabación de voz.
