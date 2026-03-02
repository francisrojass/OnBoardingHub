import axios from 'axios'

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001/api/v1'
})

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` }
  return cfg
})

export default api
