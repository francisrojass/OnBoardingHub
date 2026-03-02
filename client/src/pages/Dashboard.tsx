import React, { useContext } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../services/api'
import { Link, Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

async function fetchBoxes(){
  const res = await api.get('/boxes')
  return res.data
}

export default function Dashboard(){
  const auth = useContext(AuthContext)

  if (!auth || !auth.token) {
    return <Navigate to="/" replace />
  }

  const { data, isLoading, isError } = useQuery(['boxes'], fetchBoxes, { enabled: !!auth.token })
  const launch = useMutation((boxId:string)=> api.post('/sandboxes/launch', { boxId }))

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error cargando boxes. Asegúrate de estar autenticado.</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Tus boxes</h2>
        <Link to="/profile" className="text-sm text-gray-500">Perfil</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data && data.map((b:any) => (
          <div key={b.id} className="p-4 card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{b.title}</h3>
                <p className="text-sm text-gray-600">{b.description}</p>
              </div>
              <div className="space-y-2 text-right">
                <Link to={`/boxes/${b.id}`} className="text-sm text-blue-600">Ver</Link>
                <button onClick={()=> launch.mutate(b.id)} className="px-3 py-1 bg-sky-600 text-white rounded">LAUNCH</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
