import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from '@/firebase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(auth.currentUser)
  const instanceId = ref<string>(localStorage.getItem('instanceId') ?? '')
  const companyId = ref<string>(localStorage.getItem('companyId') ?? '')

  // Mantener sincronizado el user con Firebase.
  onAuthStateChanged(auth, (u) => {
    user.value = u
  })

  async function login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    user.value = cred.user
    return cred.user
  }

  async function logout() {
    await signOut(auth)
    user.value = null
  }

  function setInstance(newInstanceId: string, newCompanyId = '') {
    instanceId.value = newInstanceId
    localStorage.setItem('instanceId', newInstanceId)

    if (newCompanyId) {
      companyId.value = newCompanyId
      localStorage.setItem('companyId', newCompanyId)
    }
  }

  return { user, instanceId, companyId, login, logout, setInstance }
})
