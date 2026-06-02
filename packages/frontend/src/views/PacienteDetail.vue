<script setup lang="ts">
import { onMounted, ref } from 'vue'
import apiClient from '@/api/client'

const props = defineProps<{ id: string }>()

interface Paciente {
  id: string
  apellido: string
  nombre: string
  dni: string
  fechaNac?: string
  sexo?: string
  contacto?: string
  mail?: string
  direccion?: string
  localidad?: string
  obraSocial?: string
}

interface FichaPaciente {
  id: string
  plantillaId: string
  data: Record<string, unknown>
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
const visitas = ref<Visita[]>([])
const loading = ref(false)
const error = ref('')

const saving = ref(false)
const nuevaVisita = ref({ fecha: '', motivo: '', evolucion: '' })

function fichaEntries(data: Record<string, unknown>) {
  return Object.entries(data ?? {})
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

async function fetchAll() {
  loading.value = true
  error.value = ''
  try {
    const [pRes, fRes, vRes] = await Promise.all([
      apiClient.get<Paciente>(`/pacientes/${props.id}`),
      apiClient.get<FichaPaciente[]>(`/pacientes/${props.id}/fichas`),
      apiClient.get<Visita[]>(`/pacientes/${props.id}/visitas`),
    ])
    paciente.value = pRes.data
    fichas.value = fRes.data
    visitas.value = vRes.data
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
      pacienteId: props.id,
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
        <h2>Datos filiatorios</h2>
        <dl class="detalle__dl">
          <dt>DNI</dt><dd>{{ paciente.dni }}</dd>
          <dt>Fecha nac.</dt><dd>{{ paciente.fechaNac }}</dd>
          <dt>Sexo</dt><dd>{{ paciente.sexo }}</dd>
          <dt>Contacto</dt><dd>{{ paciente.contacto }}</dd>
          <dt>Mail</dt><dd>{{ paciente.mail }}</dd>
          <dt>Dirección</dt><dd>{{ paciente.direccion }}</dd>
          <dt>Localidad</dt><dd>{{ paciente.localidad }}</dd>
          <dt>Obra social</dt><dd>{{ paciente.obraSocial }}</dd>
        </dl>
      </div>

      <div class="detalle__card">
        <h2>Fichas</h2>
        <p v-if="!fichas.length">Sin fichas.</p>
        <article v-for="f in fichas" :key="f.id" class="detalle__ficha">
          <h3>Plantilla: {{ f.plantillaId }}</h3>
          <dl class="detalle__dl">
            <template v-for="[k, v] in fichaEntries(f.data)" :key="k">
              <dt>{{ k }}</dt><dd>{{ formatValue(v) }}</dd>
            </template>
          </dl>
        </article>
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

  &__ficha + &__ficha {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px dashed #eee;
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

  &__form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  &__error {
    color: #c0392b;
  }
}
</style>
