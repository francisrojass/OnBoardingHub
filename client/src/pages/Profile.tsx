import React, { useContext, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import api from '../services/api'

export default function Profile(){
  const auth = useContext(AuthContext)
  const [name, setName] = useState(auth?.user?.name || '')

  if (!auth) return null

  const save = async () => {
    try {
      await api.put(`/users/${auth.user.id}`, { name })
      alert('Guardado')
    } catch (err:any) { alert(err.message || 'Error') }
  }

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-semibold mb-4">Perfil</h2>
      <div className="card p-6 space-y-3">
        <div>
          <label className="text-sm">Email</label>
          <div className="mt-1 text-gray-700">{auth.user?.email}</div>
        </div>
        <div>
          <label className="text-sm">Nombre</label>
          <input value={name} onChange={e=>setName(e.target.value)} className="w-full mt-1 p-2 border rounded" />
        </div>
        <div className="flex justify-between">
          <button onClick={auth.logout} className="px-3 py-1 bg-red-500 text-white rounded">Cerrar sesión</button>
          <button onClick={save} className="px-3 py-1 bg-green-600 text-white rounded">Guardar</button>
        </div>
      </div>
    </div>
  )
}
