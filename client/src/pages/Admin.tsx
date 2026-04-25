import React, { useContext, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AuthContext } from '../context/AuthContext'
import api from '../services/api'
import Card from '../components/Card'
import ConfirmModal from '../components/ConfirmModal'

type PanelView = 'main' | 'new-box' | 'new-template';

interface NewBoxForm {
  title: string;
  description: string;
  objectives: string;
  guide: string;
  dockerImage: string;
  innerPort: number;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

interface NewTemplateForm {
  name: string;
  dockerfile: string;
}

const EMPTY_BOX_FORM: NewBoxForm = {
  title: '', description: '', objectives: '', guide: '',
  dockerImage: '', innerPort: 7681, difficulty: 'BEGINNER',
};

const EMPTY_TEMPLATE_FORM: NewTemplateForm = {
  name: '',
  dockerfile: `FROM ubuntu:22.04\n\nENV DEBIAN_FRONTEND=noninteractive\n\nRUN apt-get update && apt-get install -y \\\\\n    curl \\\\\n    git \\\\\n    ttyd \\\\\n    && rm -rf /var/lib/apt/lists/*\n\nEXPOSE 7681\n\nWORKDIR /root/workspace\n\nENTRYPOINT ["ttyd", "-p", "7681", "-W", "bash"]`,
};

export default function Admin() {
  const auth = useContext(AuthContext)
  const queryClient = useQueryClient()
  
  const [view, setView] = useState<PanelView>('main')
  const [boxForm, setBoxForm] = useState<NewBoxForm>(EMPTY_BOX_FORM)
  const [templateForm, setTemplateForm] = useState<NewTemplateForm>(EMPTY_TEMPLATE_FORM)
  const [formError, setFormError] = useState<string | null>(null)

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

  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ['sandbox-templates'],
    queryFn: () => api.get('/sandbox-templates').then((res) => res.data),
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

  const createBoxMutation = useMutation({
    mutationFn: (data: NewBoxForm) => api.post('/boxes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boxes-all'] })
      setBoxForm(EMPTY_BOX_FORM)
      setFormError(null)
      setView('main')
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || err.message || 'Error al crear la box')
    }
  })

  const createTemplateMutation = useMutation({
    mutationFn: (data: NewTemplateForm) => api.post('/sandbox-templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sandbox-templates'] })
      setTemplateForm(EMPTY_TEMPLATE_FORM)
      setFormError(null)
      setView('new-box')
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || err.message || 'Error al crear el template')
    }
  })

  const syncMutation = useMutation({
    mutationFn: () => api.post('/sandbox-templates/sync'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boxes-all'] })
      queryClient.invalidateQueries({ queryKey: ['sandbox-templates'] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
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

  if (!companies && !boxes) {
    return (
      <div className="flex h-64 items-center justify-center flex-col gap-2">
        <div className="text-red-500 text-lg font-semibold">Error al cargar el panel IT</div>
        <p className="text-gray-500 text-sm">No se pudieron obtener los datos. Verifica que el backend está activo.</p>
      </div>
    )
  }

  // ── New Template View ──
  if (view === 'new-template') {
    return (
      <div className="space-y-6 animate-fade-in fade-in-up delay-75 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView('new-box'); setFormError(null) }} className="text-gray-400 hover:text-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Nueva Imagen de Sandbox</h1>
        </div>

        <Card className="p-6 bg-white shadow-sm">
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{formError}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del template</label>
              <input
                type="text"
                value={templateForm.name}
                onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="ej: react-frontend, java-spring..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Se usará como nombre de la carpeta en docker/sandboxes/</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dockerfile</label>
              <textarea
                value={templateForm.dockerfile}
                onChange={e => setTemplateForm({ ...templateForm, dockerfile: e.target.value })}
                rows={16}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setView('new-box'); setFormError(null) }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!templateForm.name.trim() || !templateForm.dockerfile.trim()) {
                    setFormError('Nombre y Dockerfile son obligatorios')
                    return
                  }
                  createTemplateMutation.mutate(templateForm)
                }}
                disabled={createTemplateMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createTemplateMutation.isPending ? 'Creando...' : 'Crear Imagen'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // ── New Box View ──
  if (view === 'new-box') {
    return (
      <div className="space-y-6 animate-fade-in fade-in-up delay-75 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView('main'); setFormError(null); setBoxForm(EMPTY_BOX_FORM) }} className="text-gray-400 hover:text-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Nueva Box al Catálogo</h1>
        </div>

        <Card className="p-6 bg-white shadow-sm">
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{formError}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                value={boxForm.title}
                onChange={e => setBoxForm({ ...boxForm, title: e.target.value })}
                placeholder="ej: Git Basics, Docker Deep Dive..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={boxForm.description}
                onChange={e => setBoxForm({ ...boxForm, description: e.target.value })}
                rows={3}
                placeholder="Describe la caja para que los usuarios sepan qué aprenderán..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objetivos</label>
              <textarea
                value={boxForm.objectives}
                onChange={e => setBoxForm({ ...boxForm, objectives: e.target.value })}
                rows={3}
                placeholder="Lista los objetivos de aprendizaje de la caja..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Guía Markdown <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={boxForm.guide}
                onChange={e => setBoxForm({ ...boxForm, guide: e.target.value })}
                rows={6}
                placeholder="# Guía de tareas&#10;&#10;Escribe la guía en formato Markdown. Se mostrará junto a la terminal..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Se muestra como panel lateral junto a la terminal interactiva</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Imagen Docker (Sandbox Template)</label>
              {loadingTemplates ? (
                <p className="text-sm text-gray-400 animate-pulse">Cargando templates...</p>
              ) : templates && templates.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2">
                    {templates.map((t: any) => (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => {
                          const m = t.metadata
                          setBoxForm({
                            ...boxForm,
                            dockerImage: t.dockerImage,
                            ...(m ? {
                              title: m.title || '',
                              description: m.description || '',
                              objectives: m.objectives || '',
                              guide: m.guide || '',
                              difficulty: m.difficulty || 'BEGINNER',
                              innerPort: m.innerPort || 7681,
                            } : {})
                          })
                        }}
                        className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                          boxForm.dockerImage === t.dockerImage
                            ? 'border-blue-500 bg-blue-50 text-blue-800'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="font-medium">{t.metadata?.title || t.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{t.dockerImage}</div>
                        {t.metadata?.description && (
                          <div className="text-xs text-gray-400 mt-1 line-clamp-2">{t.metadata.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setView('new-template')}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Subir nueva imagen
                  </button>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  <p>No se encontraron templates en docker/sandboxes/.</p>
                  <button
                    type="button"
                    onClick={() => setView('new-template')}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Crear primera imagen
                  </button>
                </div>
              )}
              <input
                type="text"
                value={boxForm.dockerImage}
                onChange={e => setBoxForm({ ...boxForm, dockerImage: e.target.value })}
                placeholder="O escribe manualmente: onboardinghub/mi-sandbox"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dificultad</label>
                <select
                  value={boxForm.difficulty}
                  onChange={e => setBoxForm({ ...boxForm, difficulty: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Puerto Interno</label>
                <input
                  type="number"
                  value={boxForm.innerPort}
                  onChange={e => setBoxForm({ ...boxForm, innerPort: parseInt(e.target.value) || 7681 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setView('main'); setFormError(null); setBoxForm(EMPTY_BOX_FORM) }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!boxForm.title.trim() || !boxForm.description.trim() || !boxForm.objectives.trim() || !boxForm.dockerImage.trim()) {
                    setFormError('Todos los campos son obligatorios')
                    return
                  }
                  setFormError(null)
                  createBoxMutation.mutate(boxForm)
                }}
                disabled={createBoxMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createBoxMutation.isPending ? 'Creando...' : 'Añadir al Catálogo'}
              </button>
            </div>
          </div>
        </Card>
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
          <div className="flex gap-2">
            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['boxes-all'] })
                queryClient.invalidateQueries({ queryKey: ['companies'] })
                queryClient.invalidateQueries({ queryKey: ['sandbox-templates'] })
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              title="Recargar datos"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <button
              onClick={() => { setView('new-box'); setFormError(null); setBoxForm(EMPTY_BOX_FORM) }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Box
            </button>
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

        {/* Sandbox Templates Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Imágenes de Sandbox Disponibles</h2>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm text-gray-500">Templates detectados automáticamente desde <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">docker/sandboxes/</code></p>
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-1"
              title="Sincronizar templates con la base de datos"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              {syncMutation.isPending ? 'Sincronizando...' : 'Sync DB'}
            </button>
          </div>
          {loadingTemplates ? (
            <div className="text-gray-400 animate-pulse text-sm">Cargando templates...</div>
          ) : templates && templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((t: any) => (
                <Card key={t.name} className="p-4 bg-white shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" /></svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">{t.metadata?.title || t.name}</h4>
                      <span className="text-xs text-gray-500 font-mono">{t.dockerImage}</span>
                    </div>
                  </div>
                  {t.metadata?.description && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{t.metadata.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    {t.hasDockerfile ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Dockerfile
                      </span>
                    ) : (
                      <span className="text-yellow-600 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
                        Sin Dockerfile
                      </span>
                    )}
                    {t.metadata ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        metadata.json
                      </span>
                    ) : (
                      <span className="text-yellow-600 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
                        Sin metadata
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-5 bg-white shadow-sm text-center text-gray-500 text-sm">
              No se encontraron templates. Usa el botón "New Box" para crear uno.
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
