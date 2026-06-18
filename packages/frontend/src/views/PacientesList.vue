<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Sexo } from '@hc/shared'
import apiClient from '@/api/client'
import Modal from '@/components/Modal.vue'

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

type NuevoPaciente = Omit<Paciente, 'id'>

const router = useRouter()

const pacientes = ref<Paciente[]>([])
const loading = ref(false)
const error = ref('')

const busqueda = ref('')

const pacientesFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return pacientes.value
  return pacientes.value.filter((p) =>
    [p.apellido, p.nombre, p.dni].some((campo) => campo?.toLowerCase().includes(q)),
  )
})

const SEXO_LABEL: Record<string, string> = { M: 'Masculino', F: 'Femenino', X: 'Otro' }

function edadDe(fechaNacimiento?: string): number | null {
  const m = String(fechaNacimiento ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const hoy = new Date()
  let e = hoy.getFullYear() - Number(m[1])
  const dm = hoy.getMonth() + 1 - Number(m[2])
  if (dm < 0 || (dm === 0 && hoy.getDate() < Number(m[3]))) e--
  return e >= 0 ? e : null
}

function iniciales(p: Paciente): string {
  return `${p.apellido?.[0] ?? ''}${p.nombre?.[0] ?? ''}`.toUpperCase() || '?'
}

// Color de avatar estable por paciente (hash simple del nombre completo).
function avatarHue(p: Paciente): number {
  const s = `${p.apellido}${p.nombre}`
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
  return h
}

const showForm = ref(false)
const saving = ref(false)
const form = ref<NuevoPaciente>(emptyForm())

function emptyForm(): NuevoPaciente {
  return {
    apellido: '',
    nombre: '',
    dni: '',
    fechaNacimiento: '',
    sexo: '',
    contacto: '',
    mail: '',
    direccion: '',
    localidad: '',
    obraSocial: '',
    peso: '',
    talla: '',
  }
}

async function fetchPacientes() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await apiClient.get<Paciente[]>('/pacientes')
    pacientes.value = data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar pacientes'
  } finally {
    loading.value = false
  }
}

async function crearPaciente() {
  saving.value = true
  error.value = ''
  try {
    // Los opcionales vacios se omiten: '' no pasa @IsEnum/@IsString opcional en el backend.
    const payload = Object.fromEntries(
      Object.entries(form.value).filter(([, v]) => v !== '' && v != null),
    )
    await apiClient.post('/pacientes', payload)
    form.value = emptyForm()
    showForm.value = false
    await fetchPacientes()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al crear paciente'
  } finally {
    saving.value = false
  }
}

function abrirPaciente(id: string) {
  router.push(`/pacientes/${id}`)
}

onMounted(fetchPacientes)
</script>

<template>
  <section class="pacientes">
    <header class="pacientes__header">
      <div>
        <h1 class="pacientes__title">Pacientes</h1>
        <p class="pacientes__subtitle">Gestión de historias clínicas</p>
      </div>
      <button class="btn btn--primary" @click="showForm = true">
        + Nuevo paciente
      </button>
    </header>

    <Modal v-model="showForm" title="Nuevo paciente">
      <form class="pacientes__form" @submit.prevent="crearPaciente">
        <div class="pacientes__form-grid">
        <label class="field">
          <span>Apellido *</span>
          <input v-model="form.apellido" required />
        </label>
        <label class="field">
          <span>Nombre *</span>
          <input v-model="form.nombre" required />
        </label>
        <label class="field">
          <span>DNI *</span>
          <input v-model="form.dni" inputmode="numeric" required />
        </label>
        <label class="field">
          <span>Fecha de nacimiento</span>
          <input v-model="form.fechaNacimiento" type="date" />
        </label>
        <label class="field">
          <span>Sexo</span>
          <select v-model="form.sexo">
            <option value="">Sin especificar</option>
            <option :value="Sexo.Masculino">Masculino</option>
            <option :value="Sexo.Femenino">Femenino</option>
            <option :value="Sexo.Otro">Otro</option>
          </select>
        </label>
        <label class="field">
          <span>Obra social</span>
          <input v-model="form.obraSocial" />
        </label>
        <label class="field">
          <span>Contacto</span>
          <input v-model="form.contacto" />
        </label>
        <label class="field">
          <span>Mail</span>
          <input v-model="form.mail" type="email" />
        </label>
        <label class="field">
          <span>Dirección</span>
          <input v-model="form.direccion" />
        </label>
        <label class="field">
          <span>Localidad</span>
          <input v-model="form.localidad" />
        </label>
        <label class="field">
          <span>Peso</span>
          <input v-model="form.peso" />
        </label>
        <label class="field">
          <span>Talla</span>
          <input v-model="form.talla" />
        </label>
      </div>
      <div class="dialog-actions">
        <button type="button" class="btn btn--secondary" @click="showForm = false">
          Cancelar
        </button>
        <button type="submit" class="btn btn--primary" :disabled="saving">
          {{ saving ? 'Guardando...' : 'Guardar paciente' }}
        </button>
      </div>
      </form>
    </Modal>

    <div class="pacientes__searchbar">
      <span class="pacientes__search-icon" aria-hidden="true">🔍</span>
      <input
        v-model="busqueda"
        class="pacientes__search"
        type="search"
        aria-label="Buscar pacientes por apellido, nombre o DNI"
        placeholder="Buscar por apellido, nombre o DNI…"
      />
      <span v-if="!loading" class="pacientes__count">
        {{ pacientesFiltrados.length }} de {{ pacientes.length }}
      </span>
    </div>

    <p v-if="error" class="pacientes__error" role="alert">{{ error }}</p>
    <p v-if="loading" class="pacientes__loading">Cargando pacientes…</p>

    <div v-else class="pacientes__table-card card">
      <table class="pacientes__table">
        <caption class="sr-only">Listado de pacientes</caption>
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Edad</th>
            <th scope="col">Sexo</th>
            <th scope="col">Obra social</th>
            <th scope="col"><span class="sr-only">Abrir ficha</span></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in pacientesFiltrados"
            :key="p.id"
            class="pacientes__row"
            @click="abrirPaciente(p.id)"
          >
            <td>
              <div class="pacientes__patient">
                <span
                  class="pacientes__avatar"
                  aria-hidden="true"
                  :style="{
                    background: `hsl(${avatarHue(p)} 55% 92%)`,
                    color: `hsl(${avatarHue(p)} 45% 32%)`,
                  }"
                >
                  {{ iniciales(p) }}
                </span>
                <span class="pacientes__patient-text">
                  <RouterLink :to="`/pacientes/${p.id}`" class="pacientes__name" @click.stop>
                    {{ p.apellido }}, {{ p.nombre }}
                  </RouterLink>
                  <span class="pacientes__dni">DNI {{ p.dni || '—' }}</span>
                </span>
              </div>
            </td>
            <td>
              <template v-if="edadDe(p.fechaNacimiento) !== null">
                {{ edadDe(p.fechaNacimiento) }} a.
              </template>
              <span v-else class="pacientes__muted">—</span>
            </td>
            <td>
              <span v-if="p.sexo" class="pacientes__sexo">{{ SEXO_LABEL[p.sexo] ?? p.sexo }}</span>
              <span v-else class="pacientes__muted">—</span>
            </td>
            <td>
              <span v-if="p.obraSocial" class="pacientes__chip">{{ p.obraSocial }}</span>
              <span v-else class="pacientes__muted">—</span>
            </td>
            <td class="pacientes__chevron-cell">
              <span class="pacientes__chevron" aria-hidden="true">›</span>
            </td>
          </tr>
          <tr v-if="!pacientesFiltrados.length">
            <td colspan="5" class="pacientes__empty">
              {{ pacientes.length ? 'Sin resultados para la búsqueda.' : 'Todavía no hay pacientes cargados.' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped lang="scss">
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.pacientes {
  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--sp-4);
    margin-bottom: var(--sp-5);
  }

  &__title {
    margin: 0;
    font-size: var(--fs-xl);
  }

  &__subtitle {
    margin: var(--sp-1) 0 0;
    color: var(--c-text-muted);
    font-size: var(--fs-sm);
  }

  &__form {
    margin-bottom: var(--sp-5);
  }

  &__form-title {
    margin: 0 0 var(--sp-4);
    font-size: var(--fs-lg);
  }

  &__form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--sp-4);
  }

  &__form-actions {
    display: flex;
    gap: var(--sp-2);
    margin-top: var(--sp-5);
  }

  &__searchbar {
    position: relative;
    display: flex;
    align-items: center;
    margin-bottom: var(--sp-4);
  }

  &__search-icon {
    position: absolute;
    left: var(--sp-3);
    pointer-events: none;
    opacity: 0.6;
  }

  &__search {
    flex: 1;
    padding-left: 2.5rem;
  }

  &__count {
    margin-left: var(--sp-3);
    font-size: var(--fs-sm);
    color: var(--c-text-muted);
    white-space: nowrap;
  }

  &__error {
    margin: 0 0 var(--sp-4);
    padding: var(--sp-3) var(--sp-4);
    color: var(--c-danger);
    background: var(--c-danger-weak);
    border-radius: var(--radius-sm);
  }

  &__loading {
    color: var(--c-text-muted);
  }

  &__table-card {
    padding: 0;
    overflow: hidden;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;

    th,
    td {
      text-align: left;
      padding: var(--sp-3) var(--sp-4);
      vertical-align: middle;
    }

    thead th {
      padding-top: var(--sp-3);
      padding-bottom: var(--sp-3);
      background: var(--c-surface-2);
      border-bottom: 1px solid var(--c-border);
      font-size: var(--fs-sm);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--c-text-muted);
    }

    tbody td {
      height: 4rem;
      border-bottom: 1px solid var(--c-border);
    }

    tbody tr:last-child td {
      border-bottom: none;
    }
  }

  &__row {
    position: relative;
    cursor: pointer;
    transition: background-color 0.12s;

    // Barra de acento a la izquierda (oculta hasta hover/foco).
    td:first-child {
      box-shadow: inset 3px 0 0 transparent;
      transition: box-shadow 0.12s;
    }

    &:hover {
      background: var(--c-primary-weak);

      td:first-child {
        box-shadow: inset 3px 0 0 var(--c-primary);
      }

      .pacientes__chevron {
        color: var(--c-primary);
        transform: translateX(3px);
      }

      .pacientes__avatar {
        transform: scale(1.05);
      }
    }

    // Foco accesible cuando se navega con teclado al link del nombre.
    &:focus-within {
      background: var(--c-primary-weak);

      td:first-child {
        box-shadow: inset 3px 0 0 var(--c-primary);
      }
    }
  }

  &__patient {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
  }

  &__avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 2.5rem;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--radius-pill);
    font-size: var(--fs-sm);
    font-weight: 700;
    letter-spacing: 0.02em;
    transition: transform 0.12s;
  }

  &__patient-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__name {
    font-weight: 600;
    color: var(--c-text);

    &:hover {
      text-decoration: none;
      color: var(--c-primary-text);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
      border-radius: var(--radius-sm);
    }
  }

  &__dni {
    font-size: var(--fs-sm);
    color: var(--c-text-faint);
  }

  &__sexo {
    color: var(--c-text-muted);
  }

  &__muted {
    color: var(--c-text-faint);
  }

  &__chip {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    background: var(--c-primary-weak);
    color: var(--c-primary-text);
    border: 1px solid var(--c-primary-weak-border);
    border-radius: var(--radius-pill);
    font-size: var(--fs-sm);
    font-weight: 500;
  }

  &__chevron-cell {
    width: 2.5rem;
    text-align: right;
  }

  &__chevron {
    display: inline-block;
    color: var(--c-text-faint);
    font-size: 1.5rem;
    line-height: 1;
    transition: transform 0.12s, color 0.12s;
  }

  &__empty {
    padding: var(--sp-6) var(--sp-4);
    text-align: center;
    color: var(--c-text-muted);
  }
}
</style>
