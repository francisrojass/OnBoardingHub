import React, { useContext, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

const ILLUSTRATIONS = [
  'box-illustration-0',
  'box-illustration-1',
  'box-illustration-2',
  'box-illustration-3',
  'box-illustration-4',
]

// Deterministic "progress" derived from box id until backend tracks it
function pseudoProgress(id: string, offset: number) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff
  return ((h + offset) % 41) + 40 // 40–80 %
}

function BoxSvgIcon({ index }: { index: number }) {
  const icons = [
    // branching / git
    <svg key="git" width="72" height="72" viewBox="0 0 64 64" fill="none">
      <circle cx="14" cy="14" r="7" fill="white" fillOpacity="0.75"/>
      <circle cx="14" cy="50" r="7" fill="white" fillOpacity="0.75"/>
      <circle cx="50" cy="28" r="7" fill="white" fillOpacity="0.75"/>
      <path d="M14 21v10m0 0c0 10 20 10 36-3M14 21c0-8 18-9 36 7" stroke="white" strokeWidth="3" strokeOpacity="0.7" strokeLinecap="round"/>
    </svg>,
    // workflow / jira
    <svg key="jira" width="72" height="72" viewBox="0 0 64 64" fill="none">
      <rect x="6" y="6" width="22" height="22" rx="5" fill="white" fillOpacity="0.7"/>
      <rect x="36" y="6" width="22" height="22" rx="5" fill="white" fillOpacity="0.5"/>
      <rect x="6" y="36" width="22" height="22" rx="5" fill="white" fillOpacity="0.5"/>
      <rect x="36" y="36" width="22" height="22" rx="5" fill="white" fillOpacity="0.7"/>
      <path d="M28 17h8M17 28v8M47 28v8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>,
    // code / uml
    <svg key="code" width="72" height="72" viewBox="0 0 64 64" fill="none">
      <rect x="4" y="10" width="56" height="44" rx="6" fill="white" fillOpacity="0.2"/>
      <rect x="4" y="10" width="56" height="13" rx="6" fill="white" fillOpacity="0.4"/>
      <circle cx="13" cy="17" r="2.5" fill="white" fillOpacity="0.8"/>
      <circle cx="21" cy="17" r="2.5" fill="white" fillOpacity="0.5"/>
      <circle cx="29" cy="17" r="2.5" fill="white" fillOpacity="0.5"/>
      <path d="M14 34l-6 5 6 5m36-10l-6 5 6 5m-20-12l-4 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    // database
    <svg key="db" width="72" height="72" viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="16" rx="22" ry="9" fill="white" fillOpacity="0.6"/>
      <path d="M10 16v14c0 4.8 9.8 9 22 9s22-4.2 22-9V16" stroke="white" strokeWidth="2.5"/>
      <path d="M10 30v14c0 4.8 9.8 9 22 9s22-4.2 22-9V30" stroke="white" strokeWidth="2.5"/>
    </svg>,
    // cloud / api
    <svg key="api" width="72" height="72" viewBox="0 0 64 64" fill="none">
      <path d="M50 42a13 13 0 000-26 13 13 0 00-25.4 3.4A11 11 0 1014 42h36z" fill="white" fillOpacity="0.55"/>
      <path d="M32 42v14m-9-6l9 6 9-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
  ]
  return icons[index % icons.length]
}

function getInitials(name?: string | null) {
  if (!name) return 'U'
  return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function Dashboard() {
  const auth = useContext(AuthContext)
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('name')

  const { data: boxes, isLoading, isError } = useQuery(
    ['boxes'],
    async () => { const res = await api.get('/boxes'); return res.data },
    { enabled: !!auth?.token }
  )

  const { data: sandboxes } = useQuery(
    ['sandboxes'],
    async () => { const res = await api.get('/sandboxes'); return res.data },
    { enabled: !!auth?.token }
  )

  const { data: progressData } = useQuery(
    ['progress'],
    async () => { const res = await api.get('/progress/me'); return res.data },
    { enabled: !!auth?.token }
  )

  const launch = useMutation(
    (boxId: string) => api.post('/sandboxes/launch', { boxId }),
    { onSuccess: () => queryClient.invalidateQueries(['sandboxes']) }
  )

  if (isLoading) {
    return (
      <div className="empty-state">
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 12px', opacity: 0.4 }}>
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>
        </svg>
        <p>Cargando inventario...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="empty-state">
        <h3>Error al cargar</h3>
        <p>Verifica que el backend está activo.</p>
      </div>
    )
  }

  const user = auth?.user
  const totalBoxes = boxes?.length || 0
  const xpEarned: number = progressData?.xp ?? user?.xp ?? 0
  const currentLevel: number = progressData?.level ?? user?.level ?? 1
  const XP_PER_LEVEL = 500
  const currentLevelXp = xpEarned % XP_PER_LEVEL
  const xpPct = Math.round((currentLevelXp / XP_PER_LEVEL) * 100)

  // filter + sort
  let displayed: any[] = boxes || []
  if (filter !== 'all') {
    displayed = displayed.filter((b: any) => b.difficulty?.toLowerCase() === filter)
  }
  if (sort === 'name') {
    displayed = [...displayed].sort((a, b) => a.title.localeCompare(b.title))
  }

  return (
    <>
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Inventory</h1>
          <p>Your collection of onboarding boxes</p>
        </div>

        {/* XP Section */}
        <div className="xp-section">
          <div className="xp-level-info">
            <div className="xp-label-row">
              <span className="xp-level-label">Level: {currentLevel}</span>
              <span className="xp-percent">{xpPct}%</span>
            </div>
            <div className="xp-level-bar-wrap">
              <div className="xp-level-bar" style={{ width: `${xpPct}%` }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 5 }}>
              {currentLevelXp} / {XP_PER_LEVEL} XP · Total: {xpEarned.toLocaleString()} XP
            </div>
          </div>
          <div className="badge-group">
            <div className="badge-item">
              <span className="badge-icon">🥇</span>
              <span className="badge-count">×10</span>
            </div>
            <div className="badge-item">
              <span className="badge-icon">🥈</span>
              <span className="badge-count">×36</span>
            </div>
            <div className="badge-item">
              <span className="badge-icon">🏆</span>
              <span className="badge-count">×14</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="filter-row">
        <select
          className="filter-select"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">Active Boxes ({totalBoxes})</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <select
          className="filter-select"
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          <option value="name">Sort: Name</option>
          <option value="progress">Sort: Progress</option>
        </select>
      </div>

      {/* ── Box Grid ── */}
      {displayed.length === 0 ? (
        <div className="empty-state" style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <h3>No hay boxes disponibles</h3>
          <p>
            {filter !== 'all'
              ? 'No hay boxes con ese filtro. Prueba otra categoría.'
              : 'Todavía no tienes boxes asignados a tu empresa.'}
          </p>
        </div>
      ) : (
        <div className="box-grid">
          {displayed.map((box: any, i: number) => {
            const illClass = ILLUSTRATIONS[i % ILLUSTRATIONS.length]
            const pct = pseudoProgress(box.id, i * 7)
            const tasksDone = Math.max(1, Math.floor(pct / 15))
            const tasksTotal = tasksDone + Math.floor(Math.random() * 3) + 1
            const xp = (box.xpReward ?? 100) + i * 50
            const isRunning = sandboxes?.some(
              (s: any) => s.boxId === box.id && s.status === 'RUNNING'
            )

            return (
              <div key={box.id} className="box-card">
                <Link to={`/boxes/${box.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div className={`box-illustration ${illClass}`}>
                    <BoxSvgIcon index={i} />
                  </div>
                </Link>
                <div className="box-card-body">
                  <div className="box-card-title-row">
                    <h3 className="box-card-title">{box.title}</h3>
                    <button className="box-card-menu" aria-label="Opciones">···</button>
                  </div>

                  <div className="box-progress-row">
                    <div className="box-progress-check">
                      <svg width="8" height="8" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                    <span>{tasksDone}/{tasksTotal} Tasks</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--text-dark)' }}>
                      {pct}%
                    </span>
                  </div>

                  <div className="box-progress-bar-wrap">
                    <div className="box-progress-bar" style={{ width: `${pct}%` }} />
                  </div>

                  <div className="box-card-bottom">
                    <div className="box-xp">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      {xp} XP
                    </div>
                    <button className="box-action-btn" title="Guardar">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                      </svg>
                    </button>
                    {isRunning ? (
                      <button className="box-action-btn running">
                        <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/>
                        </svg>
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

      {/* ── Bottom Bar ── */}
      <div className="page-bottom-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
            {getInitials(user?.name)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name || 'Usuario'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
              {user?.role
                ? user.role.charAt(0) + user.role.slice(1).toLowerCase()
                : 'Employee'}
            </div>
          </div>
        </div>
        {auth?.user?.role === 'SUPER_ADMIN' && (
          <button className="btn-primary">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 5v14m7-7H5"/>
            </svg>
            New Box
          </button>
        )}
      </div>
    </>
  )
}
