<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const instanceId = ref(authStore.instanceId)
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    // El tenant (instance-id) se guarda antes de cualquier request.
    authStore.setInstance(instanceId.value.trim())
    await authStore.login(email.value.trim(), password.value)
    await router.push('/pacientes')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <form class="login__form" @submit.prevent="onSubmit">
      <h1>Historia Clínica</h1>

      <label>
        Instancia (tenant)
        <input v-model="instanceId" type="text" placeholder="instance-id" required />
      </label>

      <label>
        Email
        <input v-model="email" type="email" autocomplete="username" required />
      </label>

      <label>
        Contraseña
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>

      <p v-if="error" class="login__error">{{ error }}</p>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Ingresando...' : 'Ingresar' }}
      </button>
    </form>
  </div>
</template>

<style scoped lang="scss">
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;

  &__form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 320px;
    padding: 2rem;
    border: 1px solid #ddd;
    border-radius: 8px;

    h1 {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
      text-align: center;
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.85rem;
    }
  }

  &__error {
    color: #c0392b;
    font-size: 0.85rem;
    margin: 0;
  }
}
</style>
