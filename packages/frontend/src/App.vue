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
    <nav v-if="isAuthenticated" class="app__nav">
      <RouterLink to="/pacientes">Pacientes</RouterLink>
      <button class="app__logout" @click="onLogout">Logout</button>
    </nav>

    <main class="app__main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped lang="scss">
.app {
  &__nav {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid #ddd;

    a {
      font-weight: 600;
    }
  }

  &__logout {
    margin-left: auto;
  }

  &__main {
    max-width: 960px;
    margin: 0 auto;
    padding: 1.5rem;
  }
}
</style>
