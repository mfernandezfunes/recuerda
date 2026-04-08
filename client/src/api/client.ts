import axios from 'axios'
import { useAuthStore } from '../store/auth.store'

// VITE_API_URL is the full API base, e.g. "https://backend.railway.app/api"
const VITE_API_URL = import.meta.env.VITE_API_URL as string | undefined

const apiClient = axios.create({
  baseURL: VITE_API_URL ?? '/api',
  timeout: 10000,
})

// Derive the server origin (without /api) to prepend to upload paths
const API_ORIGIN = VITE_API_URL
  ? VITE_API_URL.replace(/\/api\/?$/, '')
  : ''

/**
 * Resolve a media URL returned by the server.
 * The server now stores root-relative paths like "/uploads/...".
 * We prepend the API server origin so it works in production.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return API_ORIGIN + url
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(err)
  }
)

export default apiClient
