<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Sexo } from '@hc/shared'
import apiClient from '@/api/client'

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

onMounted(fetchPacientes)
</script>

<template>
  <section class="pacientes">
    <header class="pacientes__header">
      <h1>Pacientes</h1>
      <button
        class="btn"
        :class="showForm ? 'btn--secondary' : 'btn--primary'"
        @click="showForm = !showForm"
      >
        {{ showForm ? 'Cancelar' : '+ Nuevo paciente' }}
      </button>
    </header>

    <form v-if="showForm" class="pacientes__form" @submit.prevent="crearPaciente">
      <input v-model="form.apellido" placeholder="Apellido" required />
      <input v-model="form.nombre" placeholder="Nombre" required />
      <input v-model="form.dni" placeholder="DNI" required />
      <input v-model="form.fechaNacimiento" type="date" placeholder="Fecha nac." />
      <select v-model="form.sexo">
        <option value="">Sexo…</option>
        <option :value="Sexo.Masculino">Masculino</option>
        <option :value="Sexo.Femenino">Femenino</option>
        <option :value="Sexo.Otro">Otro</option>
      </select>
      <input v-model="form.contacto" placeholder="Contacto" />
      <input v-model="form.mail" type="email" placeholder="Mail" />
      <input v-model="form.direccion" placeholder="Dirección" />
      <input v-model="form.localidad" placeholder="Localidad" />
      <input v-model="form.obraSocial" placeholder="Obra social" />
      <input v-model="form.peso" placeholder="Peso" />
      <input v-model="form.talla" placeholder="Talla" />
      <button type="submit" class="btn btn--primary" :disabled="saving">
        {{ saving ? 'Guardando...' : 'Guardar' }}
      </button>
    </form>

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

    <p v-if="error" class="pacientes__error">{{ error }}</p>
    <p v-if="loading">Cargando...</p>

    <table v-else class="pacientes__table">
      <thead>
        <tr>
          <th>Apellido</th>
          <th>Nombre</th>
          <th>DNI</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in pacientesFiltrados" :key="p.id">
          <td>{{ p.apellido }}</td>
          <td>{{ p.nombre }}</td>
          <td>{{ p.dni }}</td>
          <td>
            <RouterLink :to="`/pacientes/${p.id}`">Ver</RouterLink>
          </td>
        </tr>
        <tr v-if="!pacientesFiltrados.length">
          <td colspan="4">
            {{ pacientes.length ? 'Sin resultados.' : 'Sin pacientes.' }}
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped lang="scss">
.pacientes {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__form {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    margin: 1rem 0;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;

    button {
      grid-column: 1 / -1;
    }
  }

  &__table {
    width: 100%;
    border-collapse: collapse;

    th,
    td {
      text-align: left;
      padding: 0.5rem;
      border-bottom: 1px solid #eee;
    }
  }

  &__searchbar {
    position: relative;
    display: flex;
    align-items: center;
    margin: 1rem 0;
  }

  &__search-icon {
    position: absolute;
    left: 0.75rem;
    pointer-events: none;
    opacity: 0.6;
  }

  &__search {
    flex: 1;
    padding: 0.6rem 0.75rem 0.6rem 2.25rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-sizing: border-box;

    &:focus-visible {
      outline: 2px solid #2d7ff9;
      outline-offset: 1px;
      border-color: #2d7ff9;
    }
  }

  &__count {
    margin-left: 0.75rem;
    font-size: 0.85rem;
    color: #666;
    white-space: nowrap;
  }

  &__error {
    color: #c0392b;
  }
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  font: inherit;

  &:focus-visible {
    outline: 2px solid #2d7ff9;
    outline-offset: 1px;
  }

  &--primary {
    background: #2d7ff9;
    color: #fff;

    &:hover {
      background: #1a6ae0;
    }

    &:disabled {
      opacity: 0.6;
      cursor: default;
    }
  }

  &--secondary {
    background: #fff;
    color: #444;
    border-color: #ccc;

    &:hover {
      background: #f5f5f5;
    }
  }
}
</style>
