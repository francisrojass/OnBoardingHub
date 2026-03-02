import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function Login(){
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!auth) return null

  const submit = async (e:React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await auth.login(email, password)
      navigate('/')
    } catch (err:any) {
      setError(err.message || 'Error')
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Iniciar sesión</h1>
      <form onSubmit={submit} className="space-y-3 card p-6">
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
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Entrar</button>
        </div>
      </form>
    </div>
  )
}
