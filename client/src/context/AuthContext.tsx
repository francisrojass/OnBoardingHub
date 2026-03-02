import React, { createContext, useState, useEffect } from 'react'
import api from '../services/api'

interface AuthContextValue {
  token: string | null
  user: any | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{children:React.ReactNode}> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    if (token) {
      api.get('/auth/me').then(res => setUser(res.data)).catch(() => { setToken(null); localStorage.removeItem('token') })
    }
  }, [token])

  const login = async (email:string, password:string) => {
    try {
      const res = await api.post('/auth/login', { email, password })
      const t = res.data.token || res.data.accessToken || null
      if (!t) throw new Error('No token in response')
      localStorage.setItem('token', t)
      setToken(t)
      const me = await api.get('/auth/me')
      setUser(me.data)
    } catch (err:any) {
      // axios: if no response but request exists => network / CORS / server down
      if (err && err.request && !err.response) {
        const hint = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001/api/v1'
        throw new Error(`No se pudo conectar al servidor en ${hint} (Network Error). Comprueba que el backend está arrancado y que VITE_API_URL está configurado.`)
      }
      const msg = err.response?.data?.message || err.message || 'Error de red'
      throw new Error(msg)
    }
  }

  const logout = () => {
    setToken(null); setUser(null); localStorage.removeItem('token')
  }

  return <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>
}
