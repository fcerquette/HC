import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/firebase'
import { onAuthStateChanged, type User } from 'firebase/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/pacientes' },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
    },
    {
      path: '/pacientes',
      name: 'pacientes',
      component: () => import('@/views/PacientesList.vue'),
    },
    {
      path: '/pacientes/:id',
      name: 'paciente-detail',
      component: () => import('@/views/PacienteDetail.vue'),
      props: true,
    },
  ],
})

/** Resuelve el usuario actual de Firebase (esperando la inicialización). */
function getCurrentUser() {
  return new Promise<User | null>((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser)
      return
    }
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub()
      resolve(user)
    })
  })
}

router.beforeEach(async (to) => {
  const user = await getCurrentUser()
  if (!user && to.name !== 'login') {
    return { name: 'login' }
  }
  if (user && to.name === 'login') {
    return { name: 'pacientes' }
  }
})

export default router
