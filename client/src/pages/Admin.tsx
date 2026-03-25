import React, { useContext, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AuthContext } from '../context/AuthContext'
import api from '../services/api'
import Card from '../components/Card'
import ConfirmModal from '../components/ConfirmModal'

export default function Admin() {
  const auth = useContext(AuthContext)
  const queryClient = useQueryClient()
  
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'box' | 'company' | null;
    id: string | null;
    title: string;
    message: string;
  }>({ isOpen: false, type: null, id: null, title: '', message: '' });

  if (!auth?.user || auth.user.role !== 'SUPER_ADMIN') {
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

  // Assign and Remove specific Box access to a company
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

  // Global Deletions
  const deleteBoxMutation = useMutation({
    mutationFn: (boxId: string) => api.delete(`/boxes/${boxId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boxes-all'] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      closeModal()
    }
  })

  const deleteCompanyMutation = useMutation({
    mutationFn: (companyId: string) => api.delete(`/companies/${companyId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      closeModal()
    }
  })

  const closeModal = () => setModalState({ ...modalState, isOpen: false });

  const confirmDeleteBox = (id: string, name: string) => {
    setModalState({
      isOpen: true,
      type: 'box',
      id,
      title: '¿Eliminar Sandbox del Catálogo?',
      message: `Esta acción de eliminar "${name}" no se puede deshacer. Se eliminará de todas las empresas que la tengan asignada y se borrarán todos los entornos generados a partir de esta caja.`,
    });
  }

  const confirmDeleteCompany = (id: string, name: string) => {
    setModalState({
      isOpen: true,
      type: 'company',
      id,
      title: '¿Eliminar Empresa Permanente?',
      message: `Esta acción de eliminar la empresa "${name}" no se puede deshacer. Se borrarán todos los usuarios de la empresa, sus entornos activos y su historial.`,
    });
  }

  const handleConfirm = () => {
    if (modalState.type === 'box' && modalState.id) {
      deleteBoxMutation.mutate(modalState.id);
    } else if (modalState.type === 'company' && modalState.id) {
      deleteCompanyMutation.mutate(modalState.id);
    }
  }

  const isMutatingGlobalInfo = deleteBoxMutation.isPending || deleteCompanyMutation.isPending;

  if (loadingCompanies || loadingBoxes) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500 animate-pulse text-lg">Cargando panel IT...</div>
      </div>
    )
  }

  return (
    <>
      <ConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        onConfirm={handleConfirm}
        onCancel={closeModal}
        isLoading={isMutatingGlobalInfo}
      />

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
                  <Card key={b.id} className="p-5 flex flex-col hover:border-blue-200 transition-colors shadow-sm bg-white/50 backdrop-blur relative group">
                    <button 
                      onClick={() => confirmDeleteBox(b.id, b.title)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                      title="Eliminar Caja"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="text-xs uppercase tracking-wider font-semibold text-blue-600 mb-1">{b.difficulty}</span>
                    <h3 className="font-bold text-gray-800 text-lg w-10/12">{b.title}</h3>
                    <p className="text-sm text-gray-500 my-2">{b.description}</p>
                    <div className="text-xs text-gray-400 font-mono mt-auto pt-3 border-t">
                      Image: <span className="font-bold">{b.dockerImage}</span> | Port: {b.innerPort}
                    </div>
                  </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Acceso a Empresa & Peligro</h2>
            <div className="space-y-6">
              {companies?.map((c: any) => {
                const assignedBoxIds = new Set(c.companyBoxes.map((cb: any) => cb.boxId))
                return (
                  <Card key={c.id} className="p-5 shadow-sm bg-white relative">
                    <button 
                      onClick={() => confirmDeleteCompany(c.id, c.name)}
                      className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 p-1.5 rounded-md"
                      title="Eliminar Empresa"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <h3 className="font-bold text-lg mb-4 pb-3 border-b border-gray-100 flex items-center justify-between w-10/12">
                      <span className="text-gray-800">🏢 {c.name}</span>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
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
    </>
  )
}
