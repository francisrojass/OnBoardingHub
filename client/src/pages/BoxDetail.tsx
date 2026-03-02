import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../services/api'

export default function BoxDetail(){
  const { id } = useParams()
  const { data, isLoading } = useQuery(['box', id], async ()=> {
    const res = await api.get(`/boxes/${id}`)
    return res.data
  }, { enabled: !!id })

  const launch = useMutation(()=> api.post('/sandboxes/launch', { boxId: id }))

  if (isLoading) return <div>Loading...</div>
  if (!data) return <div>No box</div>

  return (
    <div className="max-w-2xl">
      <div className="card p-6">
        <h2 className="text-xl font-semibold">{data.title}</h2>
        <p className="text-gray-600 mt-2">{data.description}</p>
        <div className="mt-4">
          <button onClick={()=>launch.mutate()} className="px-4 py-2 bg-blue-600 text-white rounded">LAUNCH</button>
        </div>
      </div>
    </div>
  )
}
