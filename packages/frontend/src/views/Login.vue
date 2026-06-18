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
    <!-- Panel de marca -->
    <aside class="login__aside">
      <div class="login__aside-inner">
        <div class="login__brand">
          <span class="login__brand-mark" aria-hidden="true">✚</span>
          <span class="login__brand-name">Historia Clínica</span>
        </div>

        <div class="login__pitch">
          <h2 class="login__pitch-title">Historias clínicas, ordenadas y seguras.</h2>
          <p class="login__pitch-text">
            Gestión de pacientes multi-sede, con control de acceso y trazabilidad de cada cambio.
          </p>
        </div>

        <ul class="login__features">
          <li><span class="login__check" aria-hidden="true">✓</span> Multi-instancia (multitenant)</li>
          <li><span class="login__check" aria-hidden="true">✓</span> Datos de salud protegidos (Ley 25.326)</li>
          <li><span class="login__check" aria-hidden="true">✓</span> Auditoría y trazabilidad completa</li>
        </ul>
      </div>
    </aside>

    <!-- Formulario -->
    <main class="login__main">
      <form class="login__form" @submit.prevent="onSubmit">
        <div class="login__form-brand">
          <span class="login__brand-mark" aria-hidden="true">✚</span>
          <span class="login__brand-name">Historia Clínica</span>
        </div>

        <header class="login__header">
          <h1 class="login__title">Iniciar sesión</h1>
          <p class="login__subtitle">Ingresá con tu cuenta médica</p>
        </header>

        <label class="field">
          <span>Instancia (tenant)</span>
          <input v-model="instanceId" type="text" placeholder="Ej: 1" required />
          <small class="login__hint">El código de tu clínica o consultorio.</small>
        </label>

        <label class="field">
          <span>Email</span>
          <input v-model="email" type="email" autocomplete="username" required />
        </label>

        <label class="field">
          <span>Contraseña</span>
          <input v-model="password" type="password" autocomplete="current-password" required />
        </label>

        <p v-if="error" class="login__error" role="alert">{{ error }}</p>

        <button type="submit" class="btn btn--primary login__submit" :disabled="loading">
          {{ loading ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>
    </main>
  </div>
</template>

<style scoped lang="scss">
.login {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 0.85fr 1fr;

  @media (max-width: 880px) {
    grid-template-columns: 1fr;
  }

  /* ---------- Panel de marca (izquierda) ---------- */
  &__aside {
    position: relative;
    display: flex;
    align-items: center;
    padding: var(--sp-8);
    overflow: hidden;
    color: #fff;
    background:
      linear-gradient(135deg, var(--c-primary) 0%, var(--c-primary-active) 100%);

    // Patrón sutil de cruces clínicas.
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='44'%20height='44'%3E%3Cpath%20d='M22%2014v16%20M14%2022h16'%20stroke='%23ffffff'%20stroke-opacity='0.10'%20stroke-width='2'%20stroke-linecap='round'/%3E%3C/svg%3E");
      pointer-events: none;
    }

    // Resplandor decorativo.
    &::after {
      content: '';
      position: absolute;
      top: -20%;
      right: -10%;
      width: 60%;
      height: 60%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.18), transparent 70%);
      pointer-events: none;
    }

    @media (max-width: 880px) {
      display: none;
    }
  }

  &__aside-inner {
    position: relative;
    z-index: 1;
    max-width: 26rem;
    margin: 0 auto;
  }

  &__pitch {
    margin-top: var(--sp-6);
  }

  &__pitch-title {
    margin: 0;
    font-size: 1.6rem;
    line-height: 1.25;
  }

  &__pitch-text {
    margin: var(--sp-3) 0 0;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.5;
  }

  &__features {
    list-style: none;
    margin: var(--sp-6) 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);

    li {
      display: flex;
      align-items: center;
      gap: var(--sp-2);
      color: rgba(255, 255, 255, 0.92);
      font-size: var(--fs-sm);
    }
  }

  &__check {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    flex: 0 0 auto;
    background: rgba(255, 255, 255, 0.18);
    border-radius: var(--radius-pill);
    font-size: 0.7rem;
  }

  /* ---------- Formulario (derecha) ---------- */
  &__main {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--sp-6) var(--sp-5);
    background: var(--c-bg);
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    width: 380px;
    max-width: 100%;
    padding: var(--sp-6);
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
  }

  // Marca compacta arriba del form: solo en mobile (cuando el panel se oculta).
  &__form-brand {
    display: none;
    align-items: center;
    gap: var(--sp-2);
    justify-content: center;
    font-weight: 700;

    @media (max-width: 880px) {
      display: flex;
    }
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    font-weight: 700;
    font-size: 1.15rem;
  }

  &__brand-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    background: rgba(255, 255, 255, 0.16);
    border-radius: var(--radius-md);
    font-size: 1.2rem;
  }

  // En el form (fondo claro) la marca usa el teal sólido.
  &__form-brand &__brand-mark {
    width: 2rem;
    height: 2rem;
    background: var(--c-primary);
    color: #fff;
    font-size: 1rem;
  }

  &__header {
    text-align: left;
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

  &__hint {
    color: var(--c-text-faint);
    font-size: 0.78rem;
  }

  &__error {
    margin: 0;
    padding: var(--sp-2) var(--sp-3);
    color: var(--c-danger);
    background: var(--c-danger-weak);
    border-radius: var(--radius-sm);
    font-size: var(--fs-sm);
  }

  &__submit {
    margin-top: var(--sp-1);
  }
}
</style>
