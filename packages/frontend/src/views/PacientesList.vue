<script setup lang="ts">
import { onMounted, ref } from 'vue'
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
}

type NuevoPaciente = Omit<Paciente, 'id'>

const pacientes = ref<Paciente[]>([])
const loading = ref(false)
const error = ref('')

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
      <button @click="showForm = !showForm">
        {{ showForm ? 'Cancelar' : 'Nuevo paciente' }}
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
      <button type="submit" :disabled="saving">
        {{ saving ? 'Guardando...' : 'Guardar' }}
      </button>
    </form>

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
        <tr v-for="p in pacientes" :key="p.id">
          <td>{{ p.apellido }}</td>
          <td>{{ p.nombre }}</td>
          <td>{{ p.dni }}</td>
          <td>
            <RouterLink :to="`/pacientes/${p.id}`">Ver</RouterLink>
          </td>
        </tr>
        <tr v-if="!pacientes.length">
          <td colspan="4">Sin pacientes.</td>
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

  &__error {
    color: #c0392b;
  }
}
</style>
