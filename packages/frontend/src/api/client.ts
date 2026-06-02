import axios from 'axios'
import { auth } from '@/firebase'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(async (config) => {
  // (a) idToken del usuario Firebase actual -> Authorization: Bearer <token>
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  // (b) instance-id del tenant (store de auth persiste en localStorage)
  const instanceId = localStorage.getItem('instanceId')
  if (instanceId) {
    config.headers.set('instance-id', instanceId)
  }

  return config
})

export default apiClient
