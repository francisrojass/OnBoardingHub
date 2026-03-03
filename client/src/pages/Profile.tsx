import React, { useContext, useState, useEffect } from 'react'
import { AuthContext } from '../context/AuthContext'
import api from '../services/api'
import { Link } from 'react-router-dom'

export default function Profile(){
  const auth = useContext(AuthContext)
  const [profile, setProfile] = useState<any | null>(null)
  const [name, setName] = useState('')
  const [boxes, setBoxes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) return
    const load = async () => {
      try {
        const res = await api.get('/users/profile')
        setProfile(res.data)
        setName(res.data.name || '')
        const b = await api.get('/boxes')
        setBoxes(b.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [auth])

  if (!auth) return null
  if (loading) return <div>Loading...</div>

  const save = async () => {
    try {
      const res = await api.put('/users/profile', { name })
      setProfile(res.data)
      // update auth user if context exposes updateUser
      if ((auth as any).updateUser) (auth as any).updateUser(res.data)
      alert('Nombre guardado')
    } catch (err:any) { alert(err.response?.data?.message || err.message || 'Error') }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Perfil</h2>
      <div className="card p-6 space-y-3">
        <div>
          <label className="text-sm">Email</label>
          <div className="mt-1 text-gray-700">{profile?.email}</div>
        </div>
        <div>
          <label className="text-sm">Empresa</label>
          <div className="mt-1 text-gray-700">{profile?.company?.name}</div>
        </div>
        <div>
          <label className="text-sm">Nombre</label>
          <input value={name} onChange={e=>setName(e.target.value)} className="w-full mt-1 p-2 border rounded" />
        </div>
        <div>
          <label className="text-sm">Boxes disponibles</label>
          <div className="mt-2 space-y-2">
            {boxes.map(b => (
              <div key={b.id} className="p-3 card flex justify-between items-center">
                <div>
                  <div className="font-medium">{b.title}</div>
                  <div className="text-sm text-gray-600">{b.description}</div>
                </div>
                <Link to={`/boxes/${b.id}`} className="text-sm text-blue-600">Ver</Link>
              </div>
            ))}
            {boxes.length === 0 && <div className="text-sm text-gray-500">No hay boxes disponibles</div>}
          </div>
        </div>
        <div className="flex justify-between">
          <button onClick={() => auth.logout()} className="px-3 py-1 bg-red-500 text-white rounded">Cerrar sesión</button>
          <button onClick={save} className="px-3 py-1 bg-green-600 text-white rounded">Guardar</button>
        </div>
      </div>
    </div>
  )
}
