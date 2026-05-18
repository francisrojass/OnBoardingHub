import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

interface Task {
  id: string
  title: string
  description: string | null
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  category: string
  createdAt: string
  box: { id: string; title: string; difficulty: string } | null
}

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
}

const STATUS_CYCLE: Record<Task['status'], Task['status'] | null> = {
  PENDING: 'IN_PROGRESS',
  IN_PROGRESS: 'PENDING',
  COMPLETED: null, // Employee cannot change completed tasks
}

export default function Tasks() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'ALL' | Task['status']>('ALL')

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks').then((r) => r.data),
  })

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task['status'] }) =>
      api.patch(`/tasks/${id}`, { status }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  // Show all tasks: those with a sandbox-linked box and those without a box (admin-assigned)
  const visibleTasks = tasks

  const completed = visibleTasks.filter((t) => t.status === 'COMPLETED').length
  const inProgress = visibleTasks.filter((t) => t.status === 'IN_PROGRESS').length
  const total = visibleTasks.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  const filtered = filter === 'ALL' ? visibleTasks : visibleTasks.filter((t) => t.status === filter)

  const categories = Array.from(new Set(filtered.map((t) => t.category)))

  if (isLoading) {
    return (
      <div className="tasks-loading">
        <div className="tasks-spinner" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Mis Tareas</h1>
          <p>Checklist de onboarding para tu incorporación</p>
        </div>
      </div>

      {/* Progress banner */}
      <div className="tasks-progress-banner">
        <div className="tasks-progress-left">
          <div className="tasks-progress-title">Progreso de onboarding</div>
          <div className="tasks-progress-sub">{completed} de {total} tareas completadas</div>
          <div className="tasks-progress-bar-wrap">
            <div className="tasks-progress-bar" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="tasks-stats">
          <div className="tasks-stat">
            <div className="tasks-stat-num tasks-stat-done">{completed}</div>
            <div className="tasks-stat-label">Completadas</div>
          </div>
          <div className="tasks-stat-divider" />
          <div className="tasks-stat">
            <div className="tasks-stat-num tasks-stat-progress">{inProgress}</div>
            <div className="tasks-stat-label">En progreso</div>
          </div>
          <div className="tasks-stat-divider" />
          <div className="tasks-stat">
            <div className="tasks-stat-num tasks-stat-pending">{total - completed - inProgress}</div>
            <div className="tasks-stat-label">Pendientes</div>
          </div>
        </div>
        <div className="tasks-pct">{pct}%</div>
      </div>

      {/* Filters */}
      <div className="filter-row" style={{ marginTop: 20 }}>
        {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map((s) => (
          <button
            key={s}
            className={`tasks-filter-btn${filter === s ? ' active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'ALL' ? 'Todas' : s === 'PENDING' ? 'Pendientes' : s === 'IN_PROGRESS' ? 'En progreso' : 'Completadas'}
          </button>
        ))}
      </div>

      {/* Task groups */}
      {categories.length === 0 ? (
        <div className="empty-state">
          <h3>No hay tareas</h3>
          <p>{'No tienes tareas asignadas. Tu administrador te asignará tareas pronto.'}</p>
        </div>
      ) : (
        categories.map((cat) => (
          <div key={cat} className="tasks-group">
            <div className="tasks-group-header">
              <span className="tasks-group-title">{cat}</span>
              <span className="tasks-group-count">
                {filtered.filter((t) => t.category === cat && t.status === 'COMPLETED').length}/
                {filtered.filter((t) => t.category === cat).length}
              </span>
            </div>
            <div className="tasks-list">
              {filtered
                .filter((t) => t.category === cat)
                .map((task) => (
                  <div
                    key={task.id}
                    className={`task-item${task.status === 'COMPLETED' ? ' completed' : ''}`}
                    onClick={() => {
                      const next = STATUS_CYCLE[task.status]
                      if (next) mutation.mutate({ id: task.id, status: next })
                    }}
                    style={{ cursor: task.status === 'COMPLETED' ? 'default' : 'pointer' }}
                  >
                    <div className={`task-checkbox${task.status === 'COMPLETED' ? ' checked' : task.status === 'IN_PROGRESS' ? ' in-progress' : ''}`}>
                      {task.status === 'COMPLETED' && (
                        <svg width="11" height="11" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {task.status === 'IN_PROGRESS' && (
                        <div className="task-progress-dot" />
                      )}
                    </div>
                    <div className="task-body">
                      <div className="task-title">{task.title}</div>
                      {task.description && (
                        <div className="task-desc">{task.description}</div>
                      )}
                      {task.box && (
                        <div className="task-sandbox-tag">
                          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>
                          </svg>
                          Sandbox: {task.box.title}
                        </div>
                      )}
                    </div>
                    <div className="task-meta">
                      <span className={`task-priority priority-${task.priority.toLowerCase()}`}>
                        {PRIORITY_LABEL[task.priority]}
                      </span>
                      <span className={`task-status-badge status-${task.status.toLowerCase().replace('_', '-')}`}>
                        {task.status === 'PENDING' ? 'Pendiente' : task.status === 'IN_PROGRESS' ? 'En progreso' : 'Completada'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
