import React, { useContext, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { AuthContext } from '../context/AuthContext'

const DIFF_LABEL: Record<string, string> = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
}

const DIFF_COLOR: Record<string, string> = {
  BEGINNER: '#22c55e',
  INTERMEDIATE: '#f59e0b',
  ADVANCED: '#ef4444',
}

const ILLUSTRATIONS = ['box-illustration-0', 'box-illustration-1', 'box-illustration-2', 'box-illustration-3', 'box-illustration-4']

function BoxIcon({ index }: { index: number }) {
  const icons = [
    <svg key="git" width="56" height="56" viewBox="0 0 64 64" fill="none">
      <circle cx="14" cy="14" r="7" fill="white" fillOpacity="0.75"/>
      <circle cx="14" cy="50" r="7" fill="white" fillOpacity="0.75"/>
      <circle cx="50" cy="28" r="7" fill="white" fillOpacity="0.75"/>
      <path d="M14 21v10m0 0c0 10 20 10 36-3M14 21c0-8 18-9 36 7" stroke="white" strokeWidth="3" strokeOpacity="0.7" strokeLinecap="round"/>
    </svg>,
    <svg key="jira" width="56" height="56" viewBox="0 0 64 64" fill="none">
      <rect x="6" y="6" width="22" height="22" rx="5" fill="white" fillOpacity="0.7"/>
      <rect x="36" y="6" width="22" height="22" rx="5" fill="white" fillOpacity="0.5"/>
      <rect x="6" y="36" width="22" height="22" rx="5" fill="white" fillOpacity="0.5"/>
      <rect x="36" y="36" width="22" height="22" rx="5" fill="white" fillOpacity="0.7"/>
    </svg>,
    <svg key="code" width="56" height="56" viewBox="0 0 64 64" fill="none">
      <rect x="4" y="10" width="56" height="44" rx="6" fill="white" fillOpacity="0.2"/>
      <rect x="4" y="10" width="56" height="13" rx="6" fill="white" fillOpacity="0.4"/>
      <circle cx="13" cy="17" r="2.5" fill="white" fillOpacity="0.8"/>
      <circle cx="21" cy="17" r="2.5" fill="white" fillOpacity="0.5"/>
      <path d="M14 34l-6 5 6 5m36-10l-6 5 6 5m-20-12l-4 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    <svg key="db" width="56" height="56" viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="16" rx="22" ry="9" fill="white" fillOpacity="0.6"/>
      <path d="M10 16v14c0 4.8 9.8 9 22 9s22-4.2 22-9V16" stroke="white" strokeWidth="2.5"/>
      <path d="M10 30v14c0 4.8 9.8 9 22 9s22-4.2 22-9V30" stroke="white" strokeWidth="2.5"/>
    </svg>,
    <svg key="api" width="56" height="56" viewBox="0 0 64 64" fill="none">
      <path d="M50 42a13 13 0 000-26 13 13 0 00-25.4 3.4A11 11 0 1014 42h36z" fill="white" fillOpacity="0.55"/>
    </svg>,
  ]
  return icons[index % icons.length]
}

export default function LearningHub() {
  const auth = useContext(AuthContext)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [diffFilter, setDiffFilter] = useState('all')

  const { data: boxes, isLoading } = useQuery(
    ['boxes'],
    async () => { const r = await api.get('/boxes'); return r.data },
    { enabled: !!auth?.token }
  )

  const { data: progressData } = useQuery(
    ['progress'],
    async () => { const r = await api.get('/progress/me'); return r.data },
    { enabled: !!auth?.token }
  )

  const { data: sandboxes } = useQuery(
    ['sandboxes'],
    async () => { const r = await api.get('/sandboxes'); return r.data },
    { enabled: !!auth?.token }
  )

  const completeBox = useMutation(
    (boxId: string) => api.post(`/progress/box/${boxId}/complete`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['progress'])
        queryClient.invalidateQueries(['notifications'])
      }
    }
  )

  const launch = useMutation(
    (boxId: string) => api.post('/sandboxes/launch', { boxId }),
    { onSuccess: () => queryClient.invalidateQueries(['sandboxes']) }
  )

  const completedBoxIds = new Set<string>(
    (progressData?.boxProgresses || [])
      .filter((p: any) => p.completedAt)
      .map((p: any) => p.boxId)
  )

  let displayed: any[] = boxes || []
  if (diffFilter !== 'all') {
    displayed = displayed.filter((b: any) => b.difficulty === diffFilter.toUpperCase())
  }
  if (search.trim()) {
    const q = search.toLowerCase()
    displayed = displayed.filter((b: any) =>
      b.title.toLowerCase().includes(q) || b.description.toLowerCase().includes(q)
    )
  }

  const totalBoxes = boxes?.length || 0
  const completedCount = completedBoxIds.size

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Learning Hub</h1>
          <p>Explora y completa los módulos de formación disponibles</p>
        </div>
        <div className="xp-section">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)' }}>{completedCount}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>de {totalBoxes} completados</div>
          </div>
          <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>{progressData?.xp ?? 0}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>XP total</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {totalBoxes > 0 && (
        <div style={{ background: 'white', borderRadius: 12, padding: '14px 20px', marginBottom: 20, boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 6 }}>
              <span>Progreso general</span>
              <span>{Math.round((completedCount / totalBoxes) * 100)}%</span>
            </div>
            <div className="xp-level-bar-wrap">
              <div className="xp-level-bar" style={{ width: `${Math.round((completedCount / totalBoxes) * 100)}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-row" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            className="form-input"
            style={{ paddingLeft: 36, margin: 0 }}
            placeholder="Buscar módulo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={diffFilter} onChange={e => setDiffFilter(e.target.value)}>
          <option value="all">Todos los niveles ({totalBoxes})</option>
          <option value="beginner">Principiante</option>
          <option value="intermediate">Intermedio</option>
          <option value="advanced">Avanzado</option>
        </select>
      </div>

      {isLoading ? (
        <div className="empty-state"><p>Cargando módulos...</p></div>
      ) : displayed.length === 0 ? (
        <div className="empty-state" style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <h3>No se encontraron módulos</h3>
          <p>Prueba con otros filtros o términos de búsqueda.</p>
        </div>
      ) : (
        <div className="box-grid">
          {displayed.map((box: any, i: number) => {
            const isCompleted = completedBoxIds.has(box.id)
            const isRunning = sandboxes?.some((s: any) => s.boxId === box.id && s.status === 'RUNNING')
            const illClass = ILLUSTRATIONS[i % ILLUSTRATIONS.length]

            return (
              <div key={box.id} className="box-card" style={{ opacity: isCompleted ? 0.85 : 1 }}>
                <Link to={`/boxes/${box.id}`} style={{ textDecoration: 'none', display: 'block', position: 'relative' }}>
                  <div className={`box-illustration ${illClass}`}>
                    <BoxIcon index={i} />
                  </div>
                  {isCompleted && (
                    <div style={{
                      position: 'absolute', top: 10, right: 10,
                      background: '#22c55e', borderRadius: '50%',
                      width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(34,197,94,0.4)',
                    }}>
                      <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                  )}
                </Link>
                <div className="box-card-body">
                  <div className="box-card-title-row">
                    <h3 className="box-card-title">{box.title}</h3>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                      background: DIFF_COLOR[box.difficulty] + '20',
                      color: DIFF_COLOR[box.difficulty],
                    }}>
                      {DIFF_LABEL[box.difficulty] || box.difficulty}
                    </span>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-light)', margin: '6px 0 10px', lineHeight: 1.5 }}>
                    {box.description?.slice(0, 80)}{box.description?.length > 80 ? '...' : ''}
                  </p>

                  <div className="box-card-bottom">
                    <div className="box-xp">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                      {box.xpReward ?? 100} XP
                    </div>
                    {isCompleted ? (
                      <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>✓ Completado</span>
                    ) : (
                      <button
                        className="box-action-btn"
                        style={{ background: 'var(--primary)', color: 'white', border: 'none', fontSize: 11 }}
                        onClick={() => completeBox.mutate(box.id)}
                        disabled={completeBox.isLoading}
                      >
                        Marcar completo
                      </button>
                    )}
                    {isRunning ? (
                      <button className="box-action-btn running">
                        <svg width="8" height="8" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
                        Live
                      </button>
                    ) : (
                      <button
                        className="box-action-btn launch"
                        onClick={() => launch.mutate(box.id)}
                        disabled={launch.isLoading}
                      >
                        ▶ Launch
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
