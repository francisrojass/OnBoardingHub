import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

interface Worker {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  tasks: { id: string; status: string }[]
}

interface Box {
  id: string
  title: string
  difficulty: string
}

interface Task {
  id: string
  title: string
  description: string | null
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  category: string
  box: { id: string; title: string; difficulty: string } | null
}

const PRIORITY_LABEL = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta' }
const DIFF_LABEL: Record<string, string> = { BEGINNER: 'Básico', INTERMEDIATE: 'Intermedio', ADVANCED: 'Avanzado' }
const STATUS_COLOR = { PENDING: '#94a3b8', IN_PROGRESS: '#f59e0b', COMPLETED: '#10b981' }
const STATUS_LABEL = { PENDING: 'Pendiente', IN_PROGRESS: 'En progreso', COMPLETED: 'Completada' }

const EMPTY_FORM = { userId: '', title: '', description: '', priority: 'MEDIUM', category: 'Onboarding', boxId: '' }

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function Avatar({ name, size = 38 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 700, fontSize: size * 0.32,
      flexShrink: 0, textTransform: 'uppercase' as const,
    }}>
      {getInitials(name)}
    </div>
  )
}

/* ─── Tab: Trabajadores ─────────────────────────────────────────── */
function WorkersTab({ onAssign }: { onAssign: (w: Worker) => void }) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: workers = [], isLoading } = useQuery<Worker[]>({
    queryKey: ['admin-workers'],
    queryFn: () => api.get('/admin/workers').then(r => r.data),
    refetchInterval: 10000,
  })

  const { data: workerTasks = [] } = useQuery<Task[]>({
    queryKey: ['admin-worker-tasks', expanded],
    queryFn: () => api.get(`/admin/workers/${expanded}/tasks`).then(r => r.data),
    enabled: !!expanded,
  })

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => api.delete(`/admin/tasks/${taskId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-workers'] })
      qc.invalidateQueries({ queryKey: ['admin-worker-tasks', expanded] })
    },
  })

  const employees = workers.filter(w => w.role === 'EMPLOYEE')
  const totalTasks = employees.reduce((s, w) => s + w.tasks.length, 0)
  const completedTasks = employees.reduce((s, w) => s + w.tasks.filter(t => t.status === 'COMPLETED').length, 0)
  const globalPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  if (isLoading) return <div className="tasks-loading"><div className="tasks-spinner" /></div>

  return (
    <div>
      {/* Global stats */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="admin-stat-num">{employees.length}</div>
          <div className="admin-stat-label">Trabajadores</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">{totalTasks}</div>
          <div className="admin-stat-label">Tareas asignadas</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num" style={{ color: '#10b981' }}>{completedTasks}</div>
          <div className="admin-stat-label">Completadas</div>
        </div>
        <div className="admin-stat-card" style={{ flex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="admin-stat-label">Progreso global del equipo</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>{globalPct}%</span>
          </div>
          <div className="tasks-progress-bar-wrap" style={{ maxWidth: '100%' }}>
            <div className="tasks-progress-bar" style={{ width: `${globalPct}%` }} />
          </div>
        </div>
      </div>

      {/* Workers list */}
      {employees.length === 0 ? (
        <div className="empty-state" style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow-md)' }}>
          <h3>Sin trabajadores aún</h3>
          <p>Los empleados que se registren en tu empresa aparecerán aquí.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {employees.map(w => {
            const done = w.tasks.filter(t => t.status === 'COMPLETED').length
            const inProg = w.tasks.filter(t => t.status === 'IN_PROGRESS').length
            const total = w.tasks.length
            const pct = total > 0 ? Math.round((done / total) * 100) : 0
            const isOpen = expanded === w.id
            const tasks = isOpen ? workerTasks : []

            return (
              <div key={w.id} className="worker-expand-card">
                {/* Worker header row */}
                <div className="worker-expand-header" onClick={() => setExpanded(isOpen ? null : w.id)}>
                  <Avatar name={w.name} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span className="admin-worker-name">{w.name}</span>
                      {total === 0 && <span className="worker-tag worker-tag-gray">Sin tareas</span>}
                      {pct === 100 && total > 0 && <span className="worker-tag worker-tag-green">Completado</span>}
                    </div>
                    <div className="admin-worker-email">{w.email}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                      <div className="admin-worker-bar-wrap" style={{ flex: 1 }}>
                        <div className="admin-worker-bar" style={{ width: `${pct}%` }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-light)', fontWeight: 600, flexShrink: 0 }}>
                        {done}/{total} tareas
                      </span>
                      <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, flexShrink: 0 }}>
                        {inProg > 0 ? `${inProg} en progreso` : ''}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      className="btn-primary"
                      style={{ fontSize: 12, padding: '6px 14px' }}
                      onClick={e => { e.stopPropagation(); onAssign(w) }}
                    >
                      + Asignar
                    </button>
                    <svg
                      width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
                      viewBox="0 0 24 24"
                      style={{ color: 'var(--text-light)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
                    >
                      <path d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>

                {/* Expanded tasks */}
                {isOpen && (
                  <div className="worker-expand-tasks">
                    {tasks.length === 0 ? (
                      <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-light)', fontSize: 13 }}>
                        Sin tareas asignadas
                      </div>
                    ) : (
                      tasks.map(task => (
                        <div key={task.id} className="worker-task-row">
                          <div className="admin-task-status-dot" style={{ background: STATUS_COLOR[task.status] }} />
                          <div className="task-body">
                            <div className="task-title" style={{ fontSize: 13 }}>{task.title}</div>
                            {task.description && <div className="task-desc">{task.description}</div>}
                            {task.box && (
                              <div className="admin-task-sandbox-tag">
                                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>
                                </svg>
                                {task.box.title}
                                <span className={`diff-badge ${task.box.difficulty}`} style={{ fontSize: 9, padding: '1px 5px' }}>
                                  {DIFF_LABEL[task.box.difficulty]}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="task-meta">
                            <span className={`task-priority priority-${task.priority.toLowerCase()}`}>
                              {PRIORITY_LABEL[task.priority]}
                            </span>
                            <span className={`task-status-badge status-${task.status.toLowerCase().replace('_', '-')}`}>
                              {STATUS_LABEL[task.status]}
                            </span>
                            <button
                              className="admin-delete-btn"
                              onClick={() => deleteMutation.mutate(task.id)}
                              disabled={deleteMutation.isLoading}
                            >
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Tab: Asignar Tarea ────────────────────────────────────────── */
function AssignTab({ preselectedWorker, onSuccess }: { preselectedWorker: Worker | null; onSuccess: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ ...EMPTY_FORM, userId: preselectedWorker?.id || '' })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  React.useEffect(() => {
    if (preselectedWorker) setForm(f => ({ ...f, userId: preselectedWorker.id }))
  }, [preselectedWorker?.id])

  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ['admin-workers'],
    queryFn: () => api.get('/admin/workers').then(r => r.data),
  })

  const { data: boxes = [] } = useQuery<Box[]>({
    queryKey: ['boxes'],
    queryFn: () => api.get('/boxes').then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/tasks', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-workers'] })
      qc.invalidateQueries({ queryKey: ['admin-worker-tasks'] })
      setSubmitted(true)
      setError('')
      setTimeout(() => { setSubmitted(false); setForm(f => ({ ...EMPTY_FORM, userId: f.userId })) }, 2000)
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Error al crear la tarea'),
  })

  const employees = workers.filter(w => w.role === 'EMPLOYEE')
  const selectedWorker = employees.find(w => w.id === form.userId) || null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.userId) { setError('Selecciona un trabajador'); return }
    if (!form.title.trim()) { setError('El título es obligatorio'); return }
    setError('')
    mutation.mutate({
      userId: form.userId,
      title: form.title,
      description: form.description || undefined,
      priority: form.priority,
      category: form.category,
      boxId: form.boxId || undefined,
    })
  }

  const selectedBox = boxes.find(b => b.id === form.boxId) || null

  return (
    <div className="assign-tab-layout">
      {/* Form */}
      <div className="assign-form-card">
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 20 }}>
          Nueva tarea
        </div>

        <form onSubmit={handleSubmit}>
          {/* Worker selector */}
          <div className="form-group">
            <label className="form-label">Asignar a *</label>
            {employees.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-light)', padding: '10px 0' }}>
                No hay trabajadores en tu empresa aún.
              </div>
            ) : (
              <div className="assign-worker-grid">
                {employees.map(w => {
                  const done = w.tasks.filter(t => t.status === 'COMPLETED').length
                  const total = w.tasks.length
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0
                  return (
                    <div
                      key={w.id}
                      className={`assign-worker-chip${form.userId === w.id ? ' selected' : ''}`}
                      onClick={() => setForm(f => ({ ...f, userId: w.id }))}
                    >
                      <Avatar name={w.name} size={32} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {w.name.split(' ')[0]}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{done}/{total} tareas</div>
                      </div>
                      {form.userId === w.id && (
                        <svg width="14" height="14" fill="none" stroke="var(--primary)" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink: 0, marginLeft: 'auto' }}>
                          <path d="M5 13l4 4L19 7"/>
                        </svg>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input
              className="form-input"
              placeholder="Ej: Configurar entorno de desarrollo"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-input"
              style={{ resize: 'vertical', minHeight: 80 }}
              placeholder="Instrucciones o contexto para el trabajador..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Priority */}
          <div className="form-group">
            <label className="form-label">Prioridad</label>
            <div className="priority-btn-group">
              {(['LOW', 'MEDIUM', 'HIGH'] as const).map(p => (
                <button
                  key={p} type="button"
                  className={`priority-btn priority-btn-${p.toLowerCase()}${form.priority === p ? ' active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, priority: p }))}
                >
                  {PRIORITY_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Categoría</label>
            <div className="category-chip-group">
              {['Onboarding', 'Técnico', 'Formación', 'Compliance', 'Social', 'General'].map(cat => (
                <button
                  key={cat} type="button"
                  className={`category-chip${form.category === cat ? ' active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, category: cat }))}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Sandbox */}
          <div className="form-group">
            <label className="form-label">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 5, verticalAlign: 'middle' }}>
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>
              </svg>
              Acceso a Sandbox (opcional)
            </label>
            {boxes.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-light)' }}>No hay boxes disponibles en tu empresa.</p>
            ) : (
              <div className="sandbox-selector-grid">
                <div
                  className={`sandbox-option${form.boxId === '' ? ' selected' : ''}`}
                  onClick={() => setForm(f => ({ ...f, boxId: '' }))}
                >
                  <div style={{ fontSize: 20, marginBottom: 4 }}>🚫</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)' }}>Sin sandbox</div>
                </div>
                {boxes.map(b => (
                  <div
                    key={b.id}
                    className={`sandbox-option${form.boxId === b.id ? ' selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, boxId: b.id }))}
                  >
                    <div style={{ fontSize: 18, marginBottom: 4 }}>📦</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dark)', textAlign: 'center', lineHeight: 1.3 }}>{b.title}</div>
                    <span className={`diff-badge ${b.difficulty}`} style={{ fontSize: 9, marginTop: 4 }}>
                      {DIFF_LABEL[b.difficulty]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            disabled={mutation.isLoading || submitted}
          >
            {submitted ? (
              <>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
                Tarea asignada
              </>
            ) : mutation.isLoading ? 'Asignando...' : 'Asignar tarea'}
          </button>
        </form>
      </div>

      {/* Preview */}
      <div className="assign-preview-card">
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-mid)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
          Vista previa
        </div>

        {!form.userId && !form.title ? (
          <div style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: 13, padding: '40px 0' }}>
            Completa el formulario para ver la vista previa
          </div>
        ) : (
          <div>
            {selectedWorker && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 12px', background: 'var(--bg)', borderRadius: 8 }}>
                <Avatar name={selectedWorker.name} size={32} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedWorker.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{selectedWorker.email}</div>
                </div>
              </div>
            )}
            <div className="admin-task-row" style={{ cursor: 'default' }}>
              <div className="admin-task-status-dot" style={{ background: '#94a3b8' }} />
              <div className="task-body">
                <div className="task-title">{form.title || 'Título de la tarea...'}</div>
                {form.description && <div className="task-desc">{form.description}</div>}
                {selectedBox && (
                  <div className="admin-task-sandbox-tag">
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>
                    </svg>
                    {selectedBox.title}
                  </div>
                )}
              </div>
              <div className="task-meta">
                <span className={`task-priority priority-${form.priority.toLowerCase()}`}>
                  {PRIORITY_LABEL[form.priority as 'LOW' | 'MEDIUM' | 'HIGH']}
                </span>
                <span className="task-status-badge status-pending">Pendiente</span>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--bg)', borderRadius: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-light)' }}>Categoría: </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mid)' }}>{form.category}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function AdminTasks() {
  const [tab, setTab] = useState<'workers' | 'assign'>('workers')
  const [preselectedWorker, setPreselectedWorker] = useState<Worker | null>(null)

  const handleAssignFromWorker = (w: Worker) => {
    setPreselectedWorker(w)
    setTab('assign')
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Gestión de Tareas</h1>
          <p>Monitoriza y asigna tareas de onboarding a tu equipo</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab${tab === 'workers' ? ' active' : ''}`}
          onClick={() => setTab('workers')}
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
          Trabajadores
        </button>
        <button
          className={`admin-tab${tab === 'assign' ? ' active' : ''}`}
          onClick={() => { setTab('assign'); setPreselectedWorker(null) }}
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 5v14m7-7H5"/>
          </svg>
          Asignar tarea
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        {tab === 'workers'
          ? <WorkersTab onAssign={handleAssignFromWorker} />
          : <AssignTab preselectedWorker={preselectedWorker} onSuccess={() => setTab('workers')} />
        }
      </div>
    </div>
  )
}
