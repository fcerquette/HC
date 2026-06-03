<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { Sexo, TipoCampoFicha } from '@hc/shared'
import type { SchemaFicha, CampoFicha } from '@hc/shared'
import apiClient from '@/api/client'

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
}

interface FichaPaciente {
  id: number
  plantillaId: number
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
  createdAt?: string
}

const paciente = ref<Paciente | null>(null)
const fichas = ref<FichaPaciente[]>([])
const plantillas = ref<Plantilla[]>([])
const visitas = ref<Visita[]>([])
const loading = ref(false)
const error = ref('')

const saving = ref(false)
const nuevaVisita = ref({ fecha: '', motivo: '', evolucion: '' })

const editing = ref(false)
const savingPaciente = ref(false)
const editForm = ref<Partial<Paciente>>({})

const SEXO_LABEL: Record<string, string> = { M: 'Masculino', F: 'Femenino', X: 'Otro' }

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
] as const

// --- Fichas (configurables por plantilla) ---
const fichaMode = ref<'none' | 'create' | 'edit'>('none')
const fichaForm = ref<Record<string, any>>({})
const fichaPlantillaId = ref<number | null>(null)
const fichaEnEdicionId = ref<number | null>(null)
const savingFicha = ref(false)

const plantillaMap = computed<Record<number, Plantilla>>(() => {
  const m: Record<number, Plantilla> = {}
  for (const p of plantillas.value) m[p.id] = p
  return m
})

const activeCampos = computed<CampoFicha[]>(() => {
  const p = fichaPlantillaId.value != null ? plantillaMap.value[fichaPlantillaId.value] : undefined
  return p?.schema?.campos ?? []
})

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
  fichaForm.value = {}
}

function startEditFicha(f: FichaPaciente) {
  fichaMode.value = 'edit'
  fichaEnEdicionId.value = f.id
  fichaPlantillaId.value = f.plantillaId
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
    })
    nuevaVisita.value = { fecha: '', motivo: '', evolucion: '' }
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
    <RouterLink to="/pacientes">&larr; Volver</RouterLink>

    <p v-if="error" class="detalle__error">{{ error }}</p>
    <p v-if="loading">Cargando...</p>

    <template v-if="paciente">
      <h1>{{ paciente.apellido }}, {{ paciente.nombre }}</h1>

      <div class="detalle__card">
        <div class="detalle__card-header">
          <h2>Datos filiatorios</h2>
          <button v-if="!editing" type="button" @click="startEdit">Editar</button>
        </div>

        <dl v-if="!editing" class="detalle__dl">
          <dt>DNI</dt><dd>{{ paciente.dni }}</dd>
          <dt>Fecha nac.</dt><dd>{{ paciente.fechaNacimiento }}</dd>
          <dt>Sexo</dt><dd>{{ paciente.sexo ? SEXO_LABEL[paciente.sexo] : '' }}</dd>
          <dt>Contacto</dt><dd>{{ paciente.contacto }}</dd>
          <dt>Mail</dt><dd>{{ paciente.mail }}</dd>
          <dt>Dirección</dt><dd>{{ paciente.direccion }}</dd>
          <dt>Localidad</dt><dd>{{ paciente.localidad }}</dd>
          <dt>Obra social</dt><dd>{{ paciente.obraSocial }}</dd>
        </dl>

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
          <div class="detalle__form-actions">
            <button type="submit" :disabled="savingPaciente">
              {{ savingPaciente ? 'Guardando...' : 'Guardar cambios' }}
            </button>
            <button type="button" :disabled="savingPaciente" @click="cancelEdit">Cancelar</button>
          </div>
        </form>
      </div>

      <div class="detalle__card">
        <div class="detalle__card-header">
          <h2>Fichas</h2>
          <button
            v-if="fichaMode === 'none' && plantillas.length"
            type="button"
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
              <option v-for="p in plantillas" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
          </label>

          <div v-for="campo in activeCampos" :key="campo.code" class="detalle__campo">
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
          <article v-for="f in fichas" :key="f.id" class="detalle__ficha">
            <div class="detalle__card-header">
              <h3>{{ plantillaMap[f.plantillaId]?.nombre ?? ('Plantilla ' + f.plantillaId) }}</h3>
              <button type="button" @click="startEditFicha(f)">Editar</button>
            </div>
            <dl class="detalle__dl">
              <template v-if="plantillaMap[f.plantillaId]">
                <template v-for="campo in plantillaMap[f.plantillaId]!.schema.campos" :key="campo.code">
                  <dt>{{ campo.label }}</dt><dd>{{ formatValue(f.data[campo.code]) }}</dd>
                </template>
              </template>
              <template v-else>
                <template v-for="[k, v] in fichaEntries(f.data)" :key="k">
                  <dt>{{ k }}</dt><dd>{{ formatValue(v) }}</dd>
                </template>
              </template>
            </dl>
          </article>
        </template>
      </div>

      <div class="detalle__card">
        <h2>Visitas</h2>
        <ul class="detalle__visitas">
          <li v-for="v in visitas" :key="v.id">
            <strong>{{ v.fecha }}</strong> — {{ v.motivo }}
            <p>{{ v.evolucion }}</p>
          </li>
          <li v-if="!visitas.length">Sin visitas.</li>
        </ul>

        <form class="detalle__form" @submit.prevent="agregarVisita">
          <h3>Nueva visita</h3>
          <input v-model="nuevaVisita.fecha" type="date" required />
          <input v-model="nuevaVisita.motivo" placeholder="Motivo" required />
          <textarea v-model="nuevaVisita.evolucion" placeholder="Evolución" rows="3" />
          <button type="submit" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Agregar visita' }}
          </button>
        </form>
      </div>
    </template>
  </section>
</template>

<style scoped lang="scss">
.detalle {
  &__card {
    margin: 1rem 0;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
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
      border-top: 1px dashed #eee;
    }
  }

  &__visitas {
    list-style: none;
    padding: 0;

    li {
      padding: 0.5rem 0;
      border-bottom: 1px solid #eee;

      p {
        margin: 0.25rem 0 0;
        color: #555;
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
  }

  &__campo {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    &-label {
      font-size: 0.85rem;
      font-weight: 600;

      em {
        color: #c0392b;
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
    color: #777;
    font-size: 0.9rem;
  }

  &__error {
    color: #c0392b;
  }
}
</style>
