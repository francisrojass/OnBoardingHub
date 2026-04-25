import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

const ILLUSTRATIONS = [
  'box-illustration-0',
  'box-illustration-1',
  'box-illustration-2',
  'box-illustration-3',
  'box-illustration-4',
]

// Lightweight markdown to HTML renderer (no external dependency)
function renderMarkdown(md: string): string {
  let html = md
    // Escape HTML entities to prevent XSS
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks (```...```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre class="guide-code-block"><code>${code.trim()}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="guide-inline-code">$1</code>')

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="guide-h3">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="guide-h2">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="guide-h1">$1</h1>')

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="guide-hr" />')

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="guide-blockquote">$1</blockquote>')

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li class="guide-li">$1</li>')
  html = html.replace(/(<li.*<\/li>\n?)+/g, (match) => `<ul class="guide-ul">${match}</ul>`)

  // Paragraphs (lines that aren't already tags)
  html = html.replace(/^(?!<[a-z/])((?!^\s*$).+)$/gm, (match) => {
    if (match.trim() === '') return match
    return `<p class="guide-p">${match}</p>`
  })

  // Clean up empty lines
  html = html.replace(/\n{3,}/g, '\n\n')

  return html
}

export default function BoxDetail() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [guideOpen, setGuideOpen] = useState(true)

  const { data, isLoading } = useQuery(
    ['box', id],
    async () => { const res = await api.get(`/boxes/${id}`); return res.data },
    { enabled: !!id }
  )

  const { data: sandboxes } = useQuery(
    ['sandboxes'],
    async () => { const res = await api.get('/sandboxes'); return res.data },
    { enabled: !!id }
  )
  
  const { data: allTasks = [] } = useQuery(
    ['tasks'],
    async () => { const res = await api.get('/tasks'); return res.data },
    { enabled: !!id }
  )

  const activeSandbox = Array.isArray(sandboxes) ? sandboxes.find((s: any) => s.boxId === id && s.status === 'RUNNING') : null

  // Delay showing the iframe to allow Docker Desktop to activate port forwarding on Windows
  const [iframeReady, setIframeReady] = useState(false)
  useEffect(() => {
    if (activeSandbox?.id) {
      setIframeReady(false)
      const t = setTimeout(() => setIframeReady(true), 2000)
      return () => clearTimeout(t)
    } else {
      setIframeReady(false)
    }
  }, [activeSandbox?.id])

  const boxTasks = Array.isArray(allTasks) ? allTasks.filter((t: any) => t.box?.id === id) : []
  const completedTasksCount = boxTasks.filter((t: any) => t.status === 'COMPLETED').length
  const totalTasksCount = boxTasks.length
  const progressPct = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0

  const launch = useMutation(
    () => api.post('/sandboxes/launch', { boxId: id }),
    { onSuccess: () => queryClient.invalidateQueries(['sandboxes']) }
  )

  const stop = useMutation(
    (sandboxId: string) => api.delete(`/sandboxes/${sandboxId}`),
    { onSuccess: () => queryClient.invalidateQueries(['sandboxes']) }
  )

  if (isLoading) return <div className="empty-state"><p>Cargando box...</p></div>
  if (!data) return (
    <div className="empty-state">
      <h3>Box no encontrado</h3>
      <p><Link to="/dashboard" style={{ color: 'var(--primary)' }}>Volver al inventario</Link></p>
    </div>
  )

  const illClass = data.title
    ? ILLUSTRATIONS[data.title.charCodeAt(0) % ILLUSTRATIONS.length]
    : 'box-illustration-default'
  const diffLabel: string = data.difficulty || 'BEGINNER'
  const xp = data?.xpReward ?? 450

  return (
    <>
      {/* Back link */}
      <div style={{ marginBottom: 20 }}>
        <Link
          to="/dashboard"
          style={{ fontSize: 13, color: 'var(--text-light)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5m7-7l-7 7 7 7"/>
          </svg>
          Volver al inventario
        </Link>
      </div>

      {/* Hero illustration */}
      <div className={`box-detail-header ${illClass}`}>
        <svg width="110" height="110" viewBox="0 0 64 64" fill="none">
          <rect x="4" y="10" width="56" height="44" rx="6" fill="white" fillOpacity="0.2"/>
          <rect x="4" y="10" width="56" height="13" rx="6" fill="white" fillOpacity="0.38"/>
          <circle cx="13" cy="17" r="2.5" fill="white" fillOpacity="0.8"/>
          <circle cx="21" cy="17" r="2.5" fill="white" fillOpacity="0.5"/>
          <path d="M14 34l-6 5 6 5m36-10l-6 5 6 5m-20-12l-4 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Main info */}
          <div className="profile-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>{data.title}</h1>
              <span className={`diff-badge ${diffLabel}`}>{diffLabel}</span>
            </div>

            {data.description && (
              <p style={{ color: 'var(--text-mid)', fontSize: 14, lineHeight: 1.75, marginBottom: 24 }}>
                {data.description}
              </p>
            )}

            {data.objectives && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--text-dark)' }}>
                  Objetivos
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.75 }}>
                  {data.objectives}
                </p>
              </div>
            )}

            {/* Progress Section */}
            {totalTasksCount > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--text-dark)' }}>
                  Tu Progreso en este Box
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 13, color: 'var(--text-mid)' }}>
                  <div className={`box-progress-check ${progressPct === 100 ? 'completed' : ''}`} style={{ background: progressPct === 100 ? '#10b981' : 'var(--border)' }}>
                    <svg width="8" height="8" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <span>{completedTasksCount} / {totalTasksCount} Tareas completadas</span>
                  <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--text-dark)' }}>{progressPct}%</span>
                </div>
                <div className="box-progress-bar-wrap" style={{ height: 6 }}>
                  <div className="box-progress-bar" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Terminal + Guide Section */}
          {activeSandbox && (
            <>
              {/* Guide + Terminal side by side when guide exists */}
              {data.guide ? (
                <div style={{ display: 'grid', gridTemplateColumns: guideOpen ? '1fr 1.3fr' : '0fr 1fr', gap: 0, height: '620px', borderRadius: 12, overflow: 'hidden', border: '1px solid #1e293b', transition: 'grid-template-columns 0.3s ease' }}>
                  {/* Guide Panel */}
                  <div style={{ 
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#f8fafc',
                    borderRight: guideOpen ? '1px solid #e2e8f0' : 'none',
                    width: guideOpen ? 'auto' : 0,
                    minWidth: guideOpen ? 0 : 0,
                  }}>
                    <div style={{ padding: '12px 16px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <svg width="16" height="16" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Guía de Tareas</span>
                    </div>
                    <div 
                      className="guide-content"
                      style={{ flex: 1, overflow: 'auto', padding: '20px 18px', fontSize: 13, lineHeight: 1.75, color: '#334155' }}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(data.guide) }}
                    />
                  </div>

                  {/* Terminal Panel */}
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1e293b', color: 'white', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          onClick={() => setGuideOpen(g => !g)}
                          title={guideOpen ? 'Ocultar guía' : 'Mostrar guía'}
                          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, padding: '3px 6px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            {guideOpen
                              ? <path d="M11 19l-7-7 7-7"/>
                              : <path d="M13 5l7 7-7 7"/>
                            }
                          </svg>
                        </button>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.02em' }}>Terminal Interactiva</span>
                      </div>
                      <button 
                        onClick={() => stop.mutate(activeSandbox.id)}
                        disabled={stop.isLoading}
                        className="btn-secondary" 
                        style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                      >
                        {stop.isLoading ? 'Deteniendo...' : 'Cerrar Terminal'}
                      </button>
                    </div>
                    {iframeReady ? (
                      <iframe
                        src={`http://${window.location.hostname}:${activeSandbox.port}`}
                        style={{ flex: 1, border: 'none', background: '#000' }}
                        title="Terminal"
                      />
                    ) : (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#94a3b8', fontSize: 13, gap: 10 }}>
                        <div style={{ width: 16, height: 16, border: '2px solid #334155', borderTop: '2px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Iniciando sandbox…
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Terminal only (no guide) */
                <div className="profile-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '600px', border: '1px solid #1e293b' }}>
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1e293b', color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.02em' }}>Terminal Interactiva</span>
                    </div>
                    <button 
                      onClick={() => stop.mutate(activeSandbox.id)}
                      disabled={stop.isLoading}
                      className="btn-secondary" 
                      style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                    >
                      {stop.isLoading ? 'Deteniendo...' : 'Cerrar Terminal'}
                    </button>
                  </div>
                  {iframeReady ? (
                    <iframe
                      src={`http://${window.location.hostname}:${activeSandbox.port}`}
                      style={{ flex: 1, border: 'none', background: '#000' }}
                      title="Terminal"
                    />
                  ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#94a3b8', fontSize: 13, gap: 10 }}>
                      <div style={{ width: 16, height: 16, border: '2px solid #334155', borderTop: '2px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Iniciando sandbox…
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="profile-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🏆</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>
              {xp} XP
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 24 }}>
              Al completar este box
            </div>

            {launch.isSuccess && !activeSandbox && (
              <div style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 500, marginBottom: 14 }}>
                ✓ Sandbox lanzado correctamente
              </div>
            )}
            {launch.isError && (
              <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 500, marginBottom: 14 }}>
                Error al lanzar el sandbox
              </div>
            )}
            
            {activeSandbox ? (
              <button
                className="box-action-btn running"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14, cursor: 'default' }}
                disabled
              >
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
                Sandbox en ejecución
              </button>
            ) : (
              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }}
                onClick={() => launch.mutate()}
                disabled={launch.isLoading}
              >
                {launch.isLoading ? 'Lanzando...' : '▶  Launch Sandbox'}
              </button>
            )}

            <Link
              to="/dashboard"
              className="btn-secondary"
              style={{ marginTop: 10, width: '100%', justifyContent: 'center', padding: '10px', display: 'flex' }}
            >
              Volver al inventario
            </Link>
          </div>

          <div className="profile-card" style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 11, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
              Detalles Técnicos
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-light)' }}>Dificultad</span>
                <span className={`diff-badge ${diffLabel}`} style={{ fontSize: 10 }}>{diffLabel}</span>
              </div>
              {data.dockerImage && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ color: 'var(--text-light)', fontSize: 11 }}>Imagen Docker</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 11, background: 'var(--bg)', padding: '4px 8px', borderRadius: 4, wordBreak: 'break-all' }}>
                    {data.dockerImage}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
