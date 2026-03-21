import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AuthContext } from '../context/AuthContext'
import api from '../services/api'
import Card from '../components/Card'

export default function Admin() {
  const auth = useContext(AuthContext)
  const queryClient = useQueryClient()
  
  if (!auth?.user || auth.user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  const { data: companies, isLoading: loadingCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.get('/companies').then((res) => res.data),
  })

  const { data: boxes, isLoading: loadingBoxes } = useQuery({
    queryKey: ['boxes-all'],
    queryFn: () => api.get('/boxes/all').then((res) => res.data),
  })

  const assignBoxMutation = useMutation({
    mutationFn: ({ companyId, boxId }: { companyId: string, boxId: string }) => 
      api.post(`/companies/${companyId}/boxes`, { boxId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    }
  })

  const removeBoxMutation = useMutation({
    mutationFn: ({ companyId, boxId }: { companyId: string, boxId: string }) => 
      api.delete(`/companies/${companyId}/boxes/${boxId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    }
  })

  if (loadingCompanies || loadingBoxes) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500 animate-pulse text-lg">Cargando panel IT...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in fade-in-up delay-75">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-title text-3xl font-bold mb-1">Panel IT 🎛️</h1>
          <p className="text-gray-600">Gestión global de sandboxes y acceso integral para empresas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
           <h2 className="text-xl font-semibold mb-4 text-gray-800">Catálogo Global de Cajas</h2>
           <div className="space-y-4">
             {boxes?.map((b: any) => (
                <Card key={b.id} className="p-5 flex flex-col hover:border-blue-200 transition-colors shadow-sm bg-white/50 backdrop-blur">
                  <span className="text-xs uppercase tracking-wider font-semibold text-blue-600 mb-1">{b.difficulty}</span>
                  <h3 className="font-bold text-gray-800 text-lg">{b.title}</h3>
                  <p className="text-sm text-gray-500 my-2">{b.description}</p>
                  <div className="text-xs text-gray-400 font-mono mt-auto pt-3 border-t">
                    Image: <span className="font-bold">{b.dockerImage}</span> | Port: {b.innerPort}
                  </div>
                </Card>
             ))}
           </div>
        </div>

        <div>
           <h2 className="text-xl font-semibold mb-4 text-gray-800">Asignaciones por Empresa</h2>
           <div className="space-y-6">
             {companies?.map((c: any) => {
               const assignedBoxIds = new Set(c.companyBoxes.map((cb: any) => cb.boxId))
               return (
                 <Card key={c.id} className="p-5 shadow-sm bg-white">
                   <h3 className="font-bold text-lg mb-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                     <span className="text-gray-800">🏢 {c.name}</span>
                     <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full px-3">
                       {c.companyBoxes.length} activas
                     </span>
                   </h3>
                   <div className="space-y-3">
                     {boxes?.map((b: any) => {
                       const isAssigned = assignedBoxIds.has(b.id)
                       const isMutating = 
                         (assignBoxMutation.isPending && assignBoxMutation.variables?.boxId === b.id && assignBoxMutation.variables?.companyId === c.id) ||
                         (removeBoxMutation.isPending && removeBoxMutation.variables?.boxId === b.id && removeBoxMutation.variables?.companyId === c.id);

                       return (
                         <div key={b.id} className={`flex items-center justify-between text-sm py-2 px-3 rounded ${isAssigned ? 'bg-gray-50/50' : ''}`}>
                           <span className={isAssigned ? 'font-medium text-gray-800' : 'text-gray-400'}>{b.title}</span>
                           <button
                             disabled={isMutating}
                             onClick={() => isAssigned 
                               ? removeBoxMutation.mutate({ companyId: c.id, boxId: b.id })
                               : assignBoxMutation.mutate({ companyId: c.id, boxId: b.id })
                             }
                             className={`px-3 py-1.5 rounded-md shadow-sm text-xs font-medium transition-colors border focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                               isAssigned 
                               ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 focus:ring-red-500' 
                               : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 focus:ring-green-500'
                             } ${isMutating ? 'opacity-50 cursor-not-allowed' : ''}`}
                           >
                             {isAssigned ? 'Quitar Acceso' : 'Conceder Acceso'}
                           </button>
                         </div>
                       )
                     })}
                   </div>
                 </Card>
               )
             })}
           </div>
        </div>
      </div>
    </div>
  )
}
