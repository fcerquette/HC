<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isAuthenticated = computed(() => !!authStore.user)

async function onLogout() {
  await authStore.logout()
  await router.push('/login')
}
</script>

<template>
  <div class="app">
    <header v-if="isAuthenticated" class="app__nav">
      <div class="app__nav-inner">
        <RouterLink to="/pacientes" class="app__brand">
          <span class="app__brand-mark" aria-hidden="true">✚</span>
          <span class="app__brand-text">Historia Clínica</span>
        </RouterLink>

        <button class="btn btn--secondary app__logout" @click="onLogout">
          Cerrar sesión
        </button>
      </div>
    </header>

    <main class="app__main" :class="{ 'app__main--bare': !isAuthenticated }">
      <RouterView />
    </main>
  </div>
</template>

<style scoped lang="scss">
.app {
  min-height: 100vh;

  &__nav {
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--c-surface);
    border-bottom: 1px solid var(--c-border);
    box-shadow: var(--shadow-sm);
  }

  &__nav-inner {
    display: flex;
    align-items: center;
    gap: var(--sp-5);
    max-width: 1040px;
    margin: 0 auto;
    padding: var(--sp-3) var(--sp-5);
  }

  &__brand {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    color: var(--c-text);
    font-weight: 700;

    &:hover {
      text-decoration: none;
    }
  }

  &__brand-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    background: var(--c-primary);
    color: #fff;
    border-radius: var(--radius-sm);
    font-size: 0.95rem;
  }

  &__brand-text {
    font-size: 1.05rem;
  }

  &__links {
    display: flex;
    gap: var(--sp-1);
  }

  &__link {
    padding: var(--sp-2) var(--sp-3);
    border-radius: var(--radius-sm);
    color: var(--c-text-muted);
    font-weight: 600;

    &:hover {
      text-decoration: none;
      background: var(--c-primary-weak);
      color: var(--c-primary-text);
    }

    &.router-link-active {
      background: var(--c-primary-weak);
      color: var(--c-primary-text);
    }
  }

  &__logout {
    margin-left: auto;
  }

  &__main {
    max-width: 1040px;
    margin: 0 auto;
    padding: var(--sp-5);

    // Login (sin sesión): pantalla completa, sin caja ni padding.
    &--bare {
      max-width: none;
      margin: 0;
      padding: 0;
    }
  }
}
</style>
