<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { Sexo, TipoCampoFicha } from '@hc/shared'
import type { SchemaFicha, CampoFicha } from '@hc/shared'
import apiClient from '@/api/client'
import CalendarioAnual from '@/components/CalendarioAnual.vue'
import type { EventoFecha } from '@/components/CalendarioAnual.vue'
import DatePicker from '@/components/DatePicker.vue'
import Modal from '@/components/Modal.vue'

const props = defineProps<{ id: string }>()

interface Paciente {
  id: string
  apellido: string
  nombre: string
  dni: string
  fechaNacimiento?: string
  sexo?: string
  contacto?: string
  mail?: string
  direccion?: string
  localidad?: string
  obraSocial?: string
  peso?: string
  talla?: string
}

interface FichaPaciente {
  id: number
  plantillaId: number
  fecha?: string | null
  data: Record<string, unknown>
}

interface Plantilla {
  id: number
  nombre: string
  schema: SchemaFicha
}

interface Visita {
  id: string
  pacienteId: string
  medicoId?: string
  fecha: string
  motivo: string
  evolucion: string
  conducta?: string
  createdAt?: string
}

const paciente = ref<Paciente | null>(null)
const fichas = ref<FichaPaciente[]>([])
const plantillas = ref<Plantilla[]>([])
const visitas = ref<Visita[]>([])
const loading = ref(false)
const error = ref('')

// Pestañas de navegación.
type Tab = 'resumen' | 'historico' | 'fichas' | 'visitas'
const tab = ref<Tab>('resumen')
const TABS: { id: Tab; label: string }[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'historico', label: 'Histórico' },
  { id: 'fichas', label: 'Fichas' },
  { id: 'visitas', label: 'Visitas' },
]

// Edad en años a partir de la fecha de nacimiento (yyyy-mm-dd).
const edad = computed<number | null>(() => {
  const m = String(paciente.value?.fechaNacimiento ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const hoy = new Date()
  let e = hoy.getFullYear() - Number(m[1])
  const dm = hoy.getMonth() + 1 - Number(m[2])
  if (dm < 0 || (dm === 0 && hoy.getDate() < Number(m[3]))) e--
  return e >= 0 ? e : null
})

// Avatar: iniciales + color estable por paciente (consistente con la lista).
const iniciales = computed<string>(() => {
  const p = paciente.value
  return p ? `${p.apellido?.[0] ?? ''}${p.nombre?.[0] ?? ''}`.toUpperCase() || '?' : '?'
})

const avatarHue = computed<number>(() => {
  const p = paciente.value
  if (!p) return 200
  const s = `${p.apellido}${p.nombre}`
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
  return h
})

// IMC a partir de peso (kg) y talla (cm o m).
const imc = computed<string | null>(() => {
  const peso = parseFloat(String(paciente.value?.peso ?? '').replace(',', '.'))
  let talla = parseFloat(String(paciente.value?.talla ?? '').replace(',', '.'))
  if (!peso || !talla) return null
  if (talla > 3) talla = talla / 100 // viene en cm
  const v = peso / (talla * talla)
  return Number.isFinite(v) ? v.toFixed(1) : null
})

// Fecha de la visita más reciente (para el stat "Última visita").
const ultimaVisita = computed<string | null>(() => {
  const fechas = visitas.value.map((v) => String(v.fecha).slice(0, 10)).filter(Boolean).sort()
  return fechas.length ? fechas[fechas.length - 1] : null
})

const saving = ref(false)
const nuevaVisita = ref({ fecha: '', motivo: '', evolucion: '', conducta: '' })
const formVisitaAbierto = ref(false)

function hoyIso(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function abrirNuevaVisita() {
  tab.value = 'visitas'
  // La visita arranca con la fecha de hoy por defecto.
  nuevaVisita.value = { fecha: hoyIso(), motivo: '', evolucion: '', conducta: '' }
  formVisitaAbierto.value = true
}

function cancelarVisita() {
  nuevaVisita.value = { fecha: '', motivo: '', evolucion: '', conducta: '' }
  formVisitaAbierto.value = false
}

const editing = ref(false)
const savingPaciente = ref(false)
const editForm = ref<Partial<Paciente>>({})

const SEXO_LABEL: Record<string, string> = { M: 'Masculino', F: 'Femenino', X: 'Otro' }

// Datos filiatorios estructurados para el grid del Resumen.
const datosFiliatorios = computed<{ label: string; value: string }[]>(() => {
  const p = paciente.value
  if (!p) return []
  return [
    { label: 'DNI', value: p.dni || '' },
    { label: 'Fecha nac.', value: formatFecha(p.fechaNacimiento) },
    { label: 'Sexo', value: p.sexo ? SEXO_LABEL[p.sexo] : '' },
    { label: 'Contacto', value: p.contacto || '' },
    { label: 'Mail', value: p.mail || '' },
    { label: 'Dirección', value: p.direccion || '' },
    { label: 'Localidad', value: p.localidad || '' },
    { label: 'Obra social', value: p.obraSocial || '' },
    { label: 'Peso', value: p.peso ? `${p.peso} kg` : '' },
    { label: 'Talla', value: p.talla || '' },
  ]
})

const datosCompletos = computed(() => datosFiliatorios.value.filter((d) => d.value))
const datosFaltantes = computed(() =>
  datosFiliatorios.value.filter((d) => !d.value).map((d) => d.label),
)

// Campos que el backend acepta en el PATCH (el resto los maneja el servidor).
const CAMPOS_EDITABLES = [
  'apellido',
  'nombre',
  'dni',
  'fechaNacimiento',
  'sexo',
  'contacto',
  'mail',
  'direccion',
  'localidad',
  'obraSocial',
  'peso',
  'talla',
] as const

// --- Fichas (configurables por plantilla) ---
const fichaMode = ref<'none' | 'create' | 'edit'>('none')
const fichaForm = ref<Record<string, any>>({})
const fichaPlantillaId = ref<number | null>(null)
const fichaFecha = ref<string>('')
const fichaEnEdicionId = ref<number | null>(null)
const savingFicha = ref(false)

const plantillaMap = computed<Record<number, Plantilla>>(() => {
  const m: Record<number, Plantilla> = {}
  for (const p of plantillas.value) m[p.id] = p
  return m
})

const activePlantilla = computed<Plantilla | undefined>(() =>
  fichaPlantillaId.value != null ? plantillaMap.value[fichaPlantillaId.value] : undefined,
)

const activeEsTabla = computed(() => activePlantilla.value?.schema?.vista === 'tabla')

const activeCampos = computed<CampoFicha[]>(() => activePlantilla.value?.schema?.campos ?? [])

// Plantillas con vista "tabla" (ej. Laboratorio) que tienen al menos una ficha cargada.
const plantillasTabla = computed<Plantilla[]>(() =>
  plantillas.value.filter(
    (p) => p.schema?.vista === 'tabla' && fichas.value.some((f) => f.plantillaId === p.id),
  ),
)

// Fichas que se muestran como tarjeta (excluye vista tabla y checklist, que tienen UI propia).
const fichasNormales = computed<FichaPaciente[]>(() =>
  fichas.value.filter((f) => {
    const v = plantillaMap.value[f.plantillaId]?.schema?.vista
    return v !== 'tabla' && v !== 'checklist'
  }),
)

// Plantillas tipo checklist (controles booleanos por año), con UI dedicada.
const plantillasChecklist = computed<Plantilla[]>(() =>
  plantillas.value.filter((p) => p.schema?.vista === 'checklist'),
)

// Plantillas disponibles en "Nueva ficha" (las checklist se manejan en su propia tarjeta).
const plantillasParaFicha = computed<Plantilla[]>(() =>
  plantillas.value.filter((p) => p.schema?.vista !== 'checklist'),
)

// Fichas de una checklist, una por año, más reciente primero.
function fichasDeChecklist(plantillaId: number): FichaPaciente[] {
  return fichas.value
    .filter((f) => f.plantillaId === plantillaId)
    .sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''))
}

function anioDe(f: FichaPaciente): string {
  return f.fecha ? f.fecha.slice(0, 4) : '—'
}

const nuevoAnio = ref<Record<number, string>>({})

async function toggleControl(f: FichaPaciente, code: string, value: boolean) {
  error.value = ''
  try {
    await apiClient.patch(`/fichas/${f.id}/data`, { [code]: value })
    f.data = { ...f.data, [code]: value }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al guardar el control'
  }
}

async function agregarAnioChecklist(plantillaId: number) {
  const y = (nuevoAnio.value[plantillaId] || '').trim()
  if (!/^\d{4}$/.test(y)) {
    error.value = 'Ingresá un año válido (4 dígitos)'
    return
  }
  error.value = ''
  try {
    await apiClient.post('/fichas', {
      pacienteId: Number(props.id),
      plantillaId,
      fecha: `${y}-01-01`,
      data: {},
    })
    const { data } = await apiClient.get<FichaPaciente[]>(`/pacientes/${props.id}/fichas`)
    fichas.value = data
    nuevoAnio.value[plantillaId] = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al agregar el año'
  }
}

// Fichas de una plantilla, ordenadas por fecha (para las columnas del pivot).
function fichasDePlantilla(plantillaId: number): FichaPaciente[] {
  return fichas.value
    .filter((f) => f.plantillaId === plantillaId)
    .sort((a, b) => (a.fecha ?? '').localeCompare(b.fecha ?? ''))
}

// Todos los eventos con fecha (visitas + laboratorios + campos fecha de fichas).
const eventos = computed<EventoFecha[]>(() => {
  const out: EventoFecha[] = []
  for (const v of visitas.value) {
    if (v.fecha) {
      out.push({
        fecha: String(v.fecha).slice(0, 10),
        tipo: 'visita',
        label: v.motivo || 'Visita',
        origen: 'visita',
        refId: Number(v.id),
      })
    }
  }
  for (const f of fichas.value) {
    const p = plantillaMap.value[f.plantillaId]
    if (!p) continue
    if (p.schema?.vista === 'tabla' && f.fecha) {
      out.push({
        fecha: String(f.fecha).slice(0, 10),
        tipo: 'laboratorio',
        label: p.nombre,
        origen: 'ficha',
        refId: f.id,
      })
    }
    for (const campo of p.schema?.campos ?? []) {
      if (campo.tipo === TipoCampoFicha.Fecha) {
        const val = f.data?.[campo.code]
        if (val) {
          out.push({
            fecha: String(val).slice(0, 10),
            tipo: 'estudio',
            label: campo.label,
            origen: 'ficha',
            refId: f.id,
          })
        }
      }
    }
  }
  return out
})

function onSeleccionarEvento(e: EventoFecha) {
  if (e.origen === 'ficha') {
    const f = fichas.value.find((x) => x.id === e.refId)
    if (f) startEditFicha(f)
  }
}

/** Agrupa los campos por `seccion`, preservando el orden de aparicion. */
function agruparPorSeccion(campos: CampoFicha[]): { seccion: string | null; campos: CampoFicha[] }[] {
  const grupos: { seccion: string | null; campos: CampoFicha[] }[] = []
  const idx = new Map<string | null, number>()
  for (const campo of campos) {
    const sec = campo.seccion ?? null
    if (!idx.has(sec)) {
      idx.set(sec, grupos.length)
      grupos.push({ seccion: sec, campos: [] })
    }
    grupos[idx.get(sec)!].campos.push(campo)
  }
  return grupos
}

const activeGrupos = computed(() => agruparPorSeccion(activeCampos.value))

function gruposDe(plantillaId: number) {
  const p = plantillaMap.value[plantillaId]
  return p ? agruparPorSeccion(p.schema?.campos ?? []) : []
}

function valorPorDefecto(campo: CampoFicha): unknown {
  return campo.tipo === TipoCampoFicha.Booleano ? false : ''
}

// Al elegir plantilla en modo "crear", inicializa el form con los campos del schema.
watch(fichaPlantillaId, (id) => {
  if (fichaMode.value !== 'create') return
  const p = id != null ? plantillaMap.value[id] : undefined
  const form: Record<string, any> = {}
  for (const campo of p?.schema?.campos ?? []) form[campo.code] = valorPorDefecto(campo)
  fichaForm.value = form
})

function startNuevaFicha() {
  fichaMode.value = 'create'
  fichaEnEdicionId.value = null
  fichaPlantillaId.value = null
  fichaFecha.value = ''
  fichaForm.value = {}
  tab.value = 'fichas'
}

function startEditFicha(f: FichaPaciente) {
  fichaMode.value = 'edit'
  fichaEnEdicionId.value = f.id
  fichaPlantillaId.value = f.plantillaId
  fichaFecha.value = f.fecha ?? ''
  tab.value = 'fichas'
  const p = plantillaMap.value[f.plantillaId]
  const form: Record<string, any> = {}
  for (const campo of p?.schema?.campos ?? []) {
    const v = f.data?.[campo.code]
    form[campo.code] =
      campo.tipo === TipoCampoFicha.Booleano ? Boolean(v) : (v ?? '')
  }
  fichaForm.value = form
}

function cancelFicha() {
  fichaMode.value = 'none'
}

/** Arma el objeto `data` desde el form, tipando numeros/booleanos y omitiendo vacios. */
function buildFichaData(): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const campo of activeCampos.value) {
    const v = fichaForm.value[campo.code]
    if (campo.tipo === TipoCampoFicha.Booleano) {
      out[campo.code] = Boolean(v)
      continue
    }
    if (v === '' || v == null) continue
    if (campo.tipo === TipoCampoFicha.Numero) {
      const n = Number(v)
      if (!Number.isNaN(n)) out[campo.code] = n
      continue
    }
    out[campo.code] = v
  }
  return out
}

async function guardarFicha() {
  savingFicha.value = true
  error.value = ''
  try {
    const data = buildFichaData()
    if (fichaMode.value === 'create') {
      await apiClient.post('/fichas', {
        pacienteId: Number(props.id),
        plantillaId: fichaPlantillaId.value,
        fecha: fichaFecha.value || undefined,
        data,
      })
    } else {
      await apiClient.patch(`/fichas/${fichaEnEdicionId.value}/data`, data)
    }
    const { data: fdata } = await apiClient.get<FichaPaciente[]>(`/pacientes/${props.id}/fichas`)
    fichas.value = fdata
    fichaMode.value = 'none'
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al guardar la ficha'
  } finally {
    savingFicha.value = false
  }
}

function startEdit() {
  if (!paciente.value) return
  editForm.value = { ...paciente.value }
  editing.value = true
  tab.value = 'resumen'
}

function cancelEdit() {
  editing.value = false
}

async function guardarPaciente() {
  savingPaciente.value = true
  error.value = ''
  try {
    // Solo campos editables; los vacios se omiten ('' no pasa @IsEnum para sexo).
    const src = editForm.value as Record<string, unknown>
    const payload = Object.fromEntries(
      CAMPOS_EDITABLES.map((k) => [k, src[k]]).filter(
        ([, v]) => v !== '' && v != null,
      ),
    )
    const { data } = await apiClient.patch<Paciente>(`/pacientes/${props.id}`, payload)
    paciente.value = data
    editing.value = false
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al guardar los cambios'
  } finally {
    savingPaciente.value = false
  }
}

function fichaEntries(data: Record<string, unknown>) {
  return Object.entries(data ?? {})
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** Convierte una fecha ISO (yyyy-mm-dd o yyyy-mm-ddT...) a dd/mm/aaaa para mostrar. */
function formatFecha(value: unknown): string {
  if (!value) return ''
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(value)
}

/** Muestra el valor de un campo, formateando las fechas como dd/mm/aaaa. */
function formatCampo(campo: CampoFicha, value: unknown): string {
  if (campo.tipo === TipoCampoFicha.Fecha) return value ? formatFecha(value) : '—'
  return formatValue(value)
}

async function fetchAll() {
  loading.value = true
  error.value = ''
  try {
    const [pRes, fRes, vRes, plRes] = await Promise.all([
      apiClient.get<Paciente>(`/pacientes/${props.id}`),
      apiClient.get<FichaPaciente[]>(`/pacientes/${props.id}/fichas`),
      apiClient.get<Visita[]>(`/pacientes/${props.id}/visitas`),
      apiClient.get<Plantilla[]>('/plantillas'),
    ])
    paciente.value = pRes.data
    fichas.value = fRes.data
    visitas.value = vRes.data
    plantillas.value = plRes.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar el paciente'
  } finally {
    loading.value = false
  }
}

async function agregarVisita() {
  saving.value = true
  error.value = ''
  try {
    await apiClient.post('/visitas', {
      pacienteId: Number(props.id),
      fecha: nuevaVisita.value.fecha,
      motivo: nuevaVisita.value.motivo,
      evolucion: nuevaVisita.value.evolucion,
      conducta: nuevaVisita.value.conducta,
    })
    nuevaVisita.value = { fecha: '', motivo: '', evolucion: '', conducta: '' }
    formVisitaAbierto.value = false
    const { data } = await apiClient.get<Visita[]>(`/pacientes/${props.id}/visitas`)
    visitas.value = data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al agregar la visita'
  } finally {
    saving.value = false
  }
}

onMounted(fetchAll)
</script>

<template>
  <section class="detalle">
    <p v-if="error" class="detalle__error">{{ error }}</p>
    <p v-if="loading">Cargando...</p>

    <template v-if="paciente">
      <header class="detalle__topbar">
        <nav class="detalle__breadcrumb" aria-label="Migas de pan">
          <RouterLink to="/pacientes">Pacientes</RouterLink>
          <span class="detalle__breadcrumb-sep" aria-hidden="true">›</span>
          <span class="detalle__breadcrumb-current" aria-current="page">
            {{ paciente.apellido }}, {{ paciente.nombre }}
          </span>
        </nav>

        <div class="detalle__topbar-row">
          <span
            class="detalle__avatar"
            aria-hidden="true"
            :style="{
              background: `hsl(${avatarHue} 55% 92%)`,
              color: `hsl(${avatarHue} 45% 32%)`,
            }"
          >
            {{ iniciales }}
          </span>

          <div class="detalle__id">
            <h1>{{ paciente.apellido }}, {{ paciente.nombre }}</h1>
            <p class="detalle__id-meta">
              <span class="detalle__meta-item">DNI {{ paciente.dni }}</span>
              <span v-if="edad !== null" class="detalle__meta-item">{{ edad }} años</span>
              <span v-if="paciente.sexo" class="detalle__meta-item">{{ SEXO_LABEL[paciente.sexo] }}</span>
              <span class="detalle__chip">{{ paciente.obraSocial || 'Sin obra social' }}</span>
              <span v-if="paciente.contacto" class="detalle__meta-item">{{ paciente.contacto }}</span>
            </p>
          </div>

          <div class="detalle__acciones">
            <button type="button" class="btn btn--secondary" @click="startEdit">Editar</button>
            <button type="button" class="btn btn--primary" @click="abrirNuevaVisita">+ Visita</button>
          </div>
        </div>

        <nav class="detalle__tabs" role="tablist">
          <button
            v-for="t in TABS"
            :key="t.id"
            type="button"
            role="tab"
            :aria-selected="tab === t.id"
            :class="['detalle__tab', { 'detalle__tab--activo': tab === t.id }]"
            @click="tab = t.id"
          >
            {{ t.label }}
          </button>
        </nav>
      </header>

      <!-- ===== RESUMEN: stats + datos filiatorios ===== -->
      <div v-show="tab === 'resumen'">
        <div class="detalle__stats">
          <div class="detalle__stat">
            <span class="detalle__stat-value">{{ visitas.length }}</span>
            <span class="detalle__stat-label">Visitas</span>
          </div>
          <div class="detalle__stat">
            <span class="detalle__stat-value">{{ fichas.length }}</span>
            <span class="detalle__stat-label">Fichas</span>
          </div>
          <div class="detalle__stat">
            <span class="detalle__stat-value">
              {{ ultimaVisita ? formatFecha(ultimaVisita) : '—' }}
            </span>
            <span class="detalle__stat-label">Última visita</span>
          </div>
          <div class="detalle__stat">
            <span class="detalle__stat-value">{{ imc ?? '—' }}</span>
            <span class="detalle__stat-label">IMC</span>
          </div>
        </div>

        <section class="detalle__card">
          <div class="detalle__card-header">
            <h2>Datos filiatorios</h2>
          </div>

          <template v-if="!editing">
            <dl class="detalle__datos">
              <div v-for="d in datosCompletos" :key="d.label" class="detalle__dato">
                <dt>{{ d.label }}</dt>
                <dd>{{ d.value }}</dd>
              </div>
            </dl>

            <p v-if="datosFaltantes.length" class="detalle__faltantes">
              <span>
                Datos sin completar:
                <span class="detalle__faltantes-list">{{ datosFaltantes.join(' · ') }}</span>
              </span>
              <button type="button" class="btn btn--ghost btn--sm" @click="startEdit">
                Completar
              </button>
            </p>
          </template>

          <form v-else class="detalle__form detalle__form--grid" @submit.prevent="guardarPaciente">
          <input v-model="editForm.apellido" placeholder="Apellido" required />
          <input v-model="editForm.nombre" placeholder="Nombre" required />
          <input v-model="editForm.dni" placeholder="DNI" />
          <input v-model="editForm.fechaNacimiento" type="date" placeholder="Fecha nac." />
          <select v-model="editForm.sexo">
            <option value="">Sexo…</option>
            <option :value="Sexo.Masculino">Masculino</option>
            <option :value="Sexo.Femenino">Femenino</option>
            <option :value="Sexo.Otro">Otro</option>
          </select>
          <input v-model="editForm.contacto" placeholder="Contacto" />
          <input v-model="editForm.mail" type="email" placeholder="Mail" />
          <input v-model="editForm.direccion" placeholder="Dirección" />
          <input v-model="editForm.localidad" placeholder="Localidad" />
          <input v-model="editForm.obraSocial" placeholder="Obra social" />
          <input v-model="editForm.peso" placeholder="Peso" />
          <input v-model="editForm.talla" placeholder="Talla" />
          <div class="detalle__form-actions">
            <button type="submit" class="btn btn--primary" :disabled="savingPaciente">
              {{ savingPaciente ? 'Guardando...' : 'Guardar cambios' }}
            </button>
            <button type="button" class="btn btn--secondary" :disabled="savingPaciente" @click="cancelEdit">Cancelar</button>
          </div>
        </form>
        </section>
      </div>

      <!-- ===== HISTÓRICO: línea de tiempo ===== -->
      <section v-show="tab === 'historico'" class="detalle__card">
        <CalendarioAnual :eventos="eventos" @seleccionar="onSeleccionarEvento" />
      </section>

      <!-- ===== FICHAS: estado clínico estructurado ===== -->
      <div v-show="tab === 'fichas'">
      <div
        v-for="p in plantillasChecklist"
        :key="'chk-' + p.id"
        class="detalle__card"
      >
        <div class="detalle__card-header">
          <h2>{{ p.nombre }}</h2>
          <form class="detalle__chk-add" @submit.prevent="agregarAnioChecklist(p.id)">
            <input v-model="nuevoAnio[p.id]" type="number" placeholder="Año" min="1900" max="2100" />
            <button type="submit" class="btn btn--secondary">+ Año</button>
          </form>
        </div>

        <p v-if="!fichasDeChecklist(p.id).length" class="detalle__hint">
          Sin años cargados. Agregá uno arriba.
        </p>

        <div class="detalle__chk-grid">
          <div v-for="f in fichasDeChecklist(p.id)" :key="f.id" class="detalle__chk-anio">
            <h4>{{ anioDe(f) }}</h4>
            <ul class="detalle__chk-list">
              <li v-for="campo in p.schema.campos" :key="campo.code">
                <label>
                  <input
                    type="checkbox"
                    :checked="!!f.data[campo.code]"
                    @change="toggleControl(f, campo.code, ($event.target as HTMLInputElement).checked)"
                  />
                  {{ campo.label }}
                </label>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="detalle__card">
        <div class="detalle__card-header">
          <h2>Fichas</h2>
          <button
            v-if="fichaMode === 'none' && plantillas.length"
            type="button"
            class="btn btn--primary"
            @click="startNuevaFicha"
          >
            Nueva ficha
          </button>
        </div>

        <p v-if="!plantillas.length" class="detalle__hint">
          No hay plantillas de ficha disponibles. Creá una con <code>POST /plantillas</code>.
        </p>

        <!-- Form crear / editar ficha -->
        <form v-if="fichaMode !== 'none'" class="detalle__form" @submit.prevent="guardarFicha">
          <h3>{{ fichaMode === 'create' ? 'Nueva ficha' : 'Editar ficha' }}</h3>

          <label v-if="fichaMode === 'create'" class="detalle__campo">
            <span class="detalle__campo-label">Plantilla</span>
            <select v-model.number="fichaPlantillaId" required>
              <option :value="null" disabled>Elegí una plantilla…</option>
              <option v-for="p in plantillasParaFicha" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
          </label>

          <label v-if="activeEsTabla" class="detalle__campo">
            <span class="detalle__campo-label">Fecha<em> *</em></span>
            <input v-if="fichaMode === 'create'" type="date" v-model="fichaFecha" required />
            <span v-else>{{ fichaFecha ? formatFecha(fichaFecha) : '—' }}</span>
          </label>

          <div v-for="grupo in activeGrupos" :key="grupo.seccion ?? '_'" class="detalle__seccion">
            <h4 v-if="grupo.seccion" class="detalle__seccion-titulo">{{ grupo.seccion }}</h4>

            <div v-for="campo in grupo.campos" :key="campo.code" class="detalle__campo">
              <span class="detalle__campo-label">
                {{ campo.label }}<em v-if="campo.requerido"> *</em>
              </span>

              <textarea
                v-if="campo.tipo === TipoCampoFicha.TextoLargo"
                v-model="fichaForm[campo.code]"
                rows="3"
                :required="campo.requerido"
              ></textarea>

              <label v-else-if="campo.tipo === TipoCampoFicha.Booleano" class="detalle__check">
                <input type="checkbox" v-model="fichaForm[campo.code]" /> Sí
              </label>

              <select
                v-else-if="campo.tipo === TipoCampoFicha.Seleccion"
                v-model="fichaForm[campo.code]"
                :required="campo.requerido"
              >
                <option value="">—</option>
                <option v-for="op in campo.opciones ?? []" :key="op" :value="op">{{ op }}</option>
              </select>

              <input
                v-else-if="campo.tipo === TipoCampoFicha.Numero"
                type="number"
                v-model.number="fichaForm[campo.code]"
                :required="campo.requerido"
              />

              <input
                v-else-if="campo.tipo === TipoCampoFicha.Fecha"
                type="date"
                v-model="fichaForm[campo.code]"
                :required="campo.requerido"
              />

              <input
                v-else
                type="text"
                v-model="fichaForm[campo.code]"
                :required="campo.requerido"
              />
            </div>
          </div>

          <div class="detalle__form-actions">
            <button type="submit" :disabled="savingFicha || fichaPlantillaId == null">
              {{ savingFicha ? 'Guardando...' : 'Guardar ficha' }}
            </button>
            <button type="button" :disabled="savingFicha" @click="cancelFicha">Cancelar</button>
          </div>
        </form>

        <!-- Listado de fichas -->
        <template v-if="fichaMode === 'none'">
          <p v-if="!fichas.length">Sin fichas.</p>

          <!-- Plantillas tabulares (ej. Laboratorio): vista pivot (analitos × fechas) -->
          <div v-for="p in plantillasTabla" :key="'tabla-' + p.id" class="detalle__lab">
            <div class="detalle__card-header">
              <h3>{{ p.nombre }}</h3>
            </div>
            <div class="detalle__tabla-wrap">
              <table class="detalle__tabla">
                <thead>
                  <tr>
                    <th></th>
                    <th v-for="f in fichasDePlantilla(p.id)" :key="f.id">
                      {{ f.fecha ? formatFecha(f.fecha) : '—' }}
                      <button type="button" class="detalle__link" @click="startEditFicha(f)">✎</button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="campo in p.schema.campos" :key="campo.code">
                    <th scope="row">{{ campo.label }}</th>
                    <td v-for="f in fichasDePlantilla(p.id)" :key="f.id">
                      {{ formatCampo(campo, f.data[campo.code]) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Fichas normales: tarjetas -->
          <article v-for="f in fichasNormales" :key="f.id" class="detalle__ficha">
            <div class="detalle__card-header">
              <h3>{{ plantillaMap[f.plantillaId]?.nombre ?? ('Plantilla ' + f.plantillaId) }}</h3>
              <button type="button" @click="startEditFicha(f)">Editar</button>
            </div>
            <template v-if="plantillaMap[f.plantillaId]">
              <div v-for="grupo in gruposDe(f.plantillaId)" :key="grupo.seccion ?? '_'" class="detalle__seccion">
                <h4 v-if="grupo.seccion" class="detalle__seccion-titulo">{{ grupo.seccion }}</h4>
                <dl class="detalle__dl">
                  <template v-for="campo in grupo.campos" :key="campo.code">
                    <dt>{{ campo.label }}</dt><dd>{{ formatCampo(campo, f.data[campo.code]) }}</dd>
                  </template>
                </dl>
              </div>
            </template>
            <dl v-else class="detalle__dl">
              <template v-for="[k, v] in fichaEntries(f.data)" :key="k">
                <dt>{{ k }}</dt><dd>{{ formatValue(v) }}</dd>
              </template>
            </dl>
          </article>
        </template>
        </div>
      </div>

      <!-- ===== VISITAS: diario de eventos ===== -->
      <section v-show="tab === 'visitas'" class="detalle__card">
        <div class="detalle__card-header">
          <h2>Visitas</h2>
        </div>

        <!-- Listado de visitas -->
        <ol v-if="visitas.length" class="detalle__timeline">
          <li v-for="v in visitas" :key="v.id" class="detalle__evento">
            <div class="detalle__evento-fecha">{{ formatFecha(v.fecha) }}</div>
            <div class="detalle__evento-cuerpo">
              <strong class="detalle__evento-motivo">{{ v.motivo }}</strong>
              <p v-if="v.evolucion"><em>Enfermedad actual:</em> {{ v.evolucion }}</p>
              <p v-if="v.conducta"><em>Conducta:</em> {{ v.conducta }}</p>
            </div>
          </li>
        </ol>

        <!-- Empty state: la acción vive en el "+ Visita" del topbar (siempre visible) -->
        <div v-else class="detalle__empty">
          <p class="detalle__empty-text">
            Todavía no hay visitas registradas. Usá <strong>+ Visita</strong> para agregar la primera.
          </p>
        </div>
      </section>

      <!-- Dialog: nueva visita -->
      <Modal v-model="formVisitaAbierto" title="Nueva visita">
        <form class="detalle__form" @submit.prevent="agregarVisita">
          <label class="field">
            <span>Fecha *</span>
            <DatePicker v-model="nuevaVisita.fecha" />
          </label>
          <label class="field">
            <span>Motivo *</span>
            <input v-model="nuevaVisita.motivo" placeholder="Motivo de consulta" required />
          </label>
          <label class="field">
            <span>Enfermedad actual</span>
            <textarea v-model="nuevaVisita.evolucion" rows="3" placeholder="Evolución, síntomas…" />
          </label>
          <label class="field">
            <span>Conducta</span>
            <textarea v-model="nuevaVisita.conducta" rows="2" placeholder="Indicaciones, tratamiento…" />
          </label>
          <div class="dialog-actions">
            <button type="button" class="btn btn--secondary" :disabled="saving" @click="cancelarVisita">
              Cancelar
            </button>
            <button type="submit" class="btn btn--primary" :disabled="saving">
              {{ saving ? 'Guardando...' : 'Guardar visita' }}
            </button>
          </div>
        </form>
      </Modal>
    </template>
  </section>
</template>

<style scoped lang="scss">
.detalle {
  &__topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--c-surface);
    border-bottom: 1px solid var(--c-border);
    margin: -1.5rem -1.5rem 0;
    padding: 0.6rem 1.5rem;
  }

  &__breadcrumb {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin-bottom: var(--sp-2);
    font-size: var(--fs-sm);

    a {
      color: var(--c-text-muted);
      font-weight: 600;

      &:hover {
        color: var(--c-primary-text);
      }
    }
  }

  &__breadcrumb-sep {
    color: var(--c-text-faint);
  }

  &__breadcrumb-current {
    color: var(--c-text);
    font-weight: 600;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__topbar-row {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
  }

  &__avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 3rem;
    width: 3rem;
    height: 3rem;
    border-radius: var(--radius-pill);
    font-size: 1.05rem;
    font-weight: 700;
  }

  &__id {
    flex: 1;
    min-width: 0;

    h1 {
      font-size: var(--fs-lg);
      margin: 0;
      line-height: 1.2;
    }
  }

  &__id-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
    margin: var(--sp-1) 0 0;
    font-size: var(--fs-sm);
    color: var(--c-text-muted);
  }

  &__meta-item {
    position: relative;

    &:not(:first-child)::before {
      content: '·';
      margin-right: var(--sp-2);
      color: var(--c-text-faint);
    }
  }

  &__chip {
    display: inline-block;
    padding: 0.1rem 0.55rem;
    background: var(--c-primary-weak);
    color: var(--c-primary-text);
    border: 1px solid var(--c-primary-weak-border);
    border-radius: var(--radius-pill);
    font-size: var(--fs-sm);
    font-weight: 600;
  }

  &__acciones {
    display: flex;
    gap: var(--sp-2);
    white-space: nowrap;
  }

  &__tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 0.6rem;
  }

  &__tab {
    background: transparent;
    color: var(--c-text-muted);
    border: none;
    border-bottom: 2px solid transparent;
    border-radius: 0;
    padding: 0.4rem 0.75rem;
    font-size: 0.9rem;
    cursor: pointer;

    &:hover {
      color: var(--c-primary-text);
    }

    &--activo {
      color: var(--c-primary-text);
      font-weight: 600;
      border-bottom-color: var(--c-primary);
    }
  }

  &__card {
    margin: var(--sp-4) 0;
    padding: var(--sp-5);
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--sp-3);
    margin-top: var(--sp-4);
  }

  &__stat {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    padding: var(--sp-4);
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  &__stat-value {
    font-size: var(--fs-lg);
    font-weight: 700;
    color: var(--c-text);
    line-height: 1.1;
  }

  &__stat-label {
    font-size: var(--fs-sm);
    color: var(--c-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  // Grid de datos filiatorios (label arriba, valor abajo).
  &__datos {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--sp-4);
    margin: 0;
  }

  &__dato {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding-bottom: var(--sp-2);
    border-bottom: 1px solid var(--c-border);

    dt {
      font-size: var(--fs-sm);
      font-weight: 600;
      color: var(--c-text-muted);
    }

    dd {
      margin: 0;
      color: var(--c-text);
    }
  }

  &__faltantes {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-3);
    margin: var(--sp-4) 0 0;
    padding-top: var(--sp-4);
    border-top: 1px dashed var(--c-border);
    font-size: var(--fs-sm);
    color: var(--c-text-muted);
  }

  &__faltantes-list {
    color: var(--c-text-faint);
  }

  &__dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.25rem 1rem;

    dt {
      font-weight: 600;
    }

    dd {
      margin: 0;
    }
  }

  &__ficha {
    margin-top: 1rem;

    & + & {
      padding-top: 1rem;
      border-top: 1px dashed var(--c-border);
    }
  }

  &__visitas {
    list-style: none;
    padding: 0;

    li {
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--c-border);

      p {
        margin: 0.25rem 0 0;
        color: var(--c-text-muted);
      }
    }
  }

  &__card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;

    h2,
    h3 {
      margin: 0;
    }
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;

    &--grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
    }

    &--nueva {
      margin-top: 0;
      margin-bottom: var(--sp-5);
      padding-bottom: var(--sp-5);
      border-bottom: 1px solid var(--c-border);
    }
  }

  &__seccion {
    & + & {
      margin-top: 1rem;
    }
  }

  &__seccion-titulo {
    margin: 0.75rem 0 0.5rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid var(--c-border);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--c-text-muted);
  }

  &__campo {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    &-label {
      font-size: 0.85rem;
      font-weight: 600;

      em {
        color: var(--c-danger);
        font-style: normal;
      }
    }
  }

  &__check {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 400;
  }

  &__form-actions {
    grid-column: 1 / -1;
    display: flex;
    gap: 0.5rem;
  }

  &__hint {
    color: var(--c-text-faint);
    font-size: 0.9rem;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-3);
    padding: var(--sp-6) var(--sp-4);
    text-align: center;
  }

  &__empty-text {
    margin: 0;
    color: var(--c-text-muted);
  }

  &__lab {
    margin-top: 1rem;
  }

  &__tabla-wrap {
    overflow-x: auto;
  }

  &__tabla {
    border-collapse: collapse;
    font-size: 0.85rem;

    th,
    td {
      border: 1px solid var(--c-border);
      padding: 0.35rem 0.6rem;
      text-align: left;
      white-space: nowrap;
    }

    thead th {
      background: var(--c-surface-2);
      position: sticky;
      top: 0;
    }

    tbody th {
      font-weight: 600;
      background: var(--c-surface-2);
    }
  }

  &__link {
    background: none;
    border: none;
    padding: 0.2rem 0.35rem;
    color: var(--c-primary-text);
    cursor: pointer;
    font-size: 0.95rem;
  }

  &__chk-add {
    display: flex;
    gap: 0.4rem;

    input {
      width: 5rem;
    }
  }

  &__chk-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
    margin-top: 0.5rem;
  }

  &__chk-anio {
    border: 1px solid var(--c-border);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;

    h4 {
      margin: 0 0 0.5rem;
    }
  }

  &__chk-list {
    list-style: none;
    margin: 0;
    padding: 0;

    li {
      padding: 0.15rem 0;
    }

    label {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.9rem;
    }
  }

  &__timeline {
    list-style: none;
    margin: 0 0 1rem;
    padding: 0;
  }

  &__evento {
    display: flex;
    gap: 0.75rem;
    padding: 0.6rem 0;
    border-bottom: 1px solid var(--c-border);

    p {
      margin: 0.2rem 0 0;
      color: var(--c-text-muted);
    }
  }

  &__evento-fecha {
    flex: 0 0 5rem;
    font-weight: 600;
    color: var(--c-primary-text);
    font-size: 0.9rem;
  }

  &__evento-cuerpo {
    flex: 1;
    min-width: 0;
  }

  &__evento-motivo {
    display: block;
  }

  &__error {
    color: var(--c-danger);
  }
}
</style>
