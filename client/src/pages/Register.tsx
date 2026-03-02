import React, { useState, useContext } from 'react'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function Register(){
  const auth = useContext(AuthContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const submit = async (e:React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      // quick health check to provide a clearer error if backend is not reachable
      try {
        // backend exposes health at /api/health (root), while api.baseURL includes /api/v1
        const base = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001/api/v1'
        const healthBase = base.replace(/\/api\/v1\/?$/i, '/api')
        const healthUrl = `${healthBase}/health`.replace(/([^:]\/)\/+/, '$1')
        await api.get(healthUrl)
      } catch (hErr:any) {
        setError(`No se puede contactar con el backend: ${hErr.message || 'Network Error'}`)
        return
      }

      await api.post('/auth/register', { email, password, name, companyName })
      // autologin after register if auth context available
      if (auth) {
        await auth.login(email, password)
        navigate('/dashboard')
      } else {
        navigate('/login')
      }
    } catch (err:any) { setError(err.response?.data?.message || err.message || 'Error') }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Registro</h1>
      <form onSubmit={submit} className="space-y-3 card p-6">
        <div>
          <label className="text-sm">Nombre</label>
          <input value={name} onChange={e=>setName(e.target.value)} className="w-full mt-1 p-2 border rounded" />
        </div>
        <div>
          <label className="text-sm">Empresa</label>
          <input value={companyName} onChange={e=>setCompanyName(e.target.value)} className="w-full mt-1 p-2 border rounded" />
        </div>
        <div>
          <label className="text-sm">Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full mt-1 p-2 border rounded" />
        </div>
        <div>
          <label className="text-sm">Contraseña</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full mt-1 p-2 border rounded" />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div className="flex justify-end">
          <button className="px-4 py-2 bg-green-600 text-white rounded">Crear cuenta</button>
        </div>
      </form>
    </div>
  )
}
