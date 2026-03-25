import React, { useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { AuthContext } from '../context/AuthContext'

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  SUCCESS:      { icon: '✓', color: '#22c55e' },
  XP_GAINED:    { icon: '⚡', color: '#f59e0b' },
  BOX_COMPLETED:{ icon: '📦', color: '#6366f1' },
  TASK_ASSIGNED:{ icon: '📋', color: '#3b82f6' },
  WARNING:      { icon: '⚠', color: '#f97316' },
  INFO:         { icon: 'ℹ', color: '#94a3b8' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `Hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `Hace ${days}d`
}

export default function Notifications() {
  const auth = useContext(AuthContext)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery(
    ['notifications'],
    async () => { const r = await api.get('/notifications'); return r.data },
    { enabled: !!auth?.token }
  )

  const markRead = useMutation(
    (id: string) => api.patch(`/notifications/${id}/read`),
    { onSuccess: () => queryClient.invalidateQueries(['notifications']) }
  )

  const markAllRead = useMutation(
    () => api.patch('/notifications/read-all'),
    { onSuccess: () => queryClient.invalidateQueries(['notifications']) }
  )

  const deleteNotif = useMutation(
    (id: string) => api.delete(`/notifications/${id}`),
    { onSuccess: () => queryClient.invalidateQueries(['notifications']) }
  )

  const notifications: any[] = data?.notifications || []
  const unreadCount: number = data?.unreadCount || 0

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Notificaciones</h1>
          <p>{unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}</p>
        </div>
        {unreadCount > 0 && (
          <button
            className="btn-secondary"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isLoading}
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="empty-state"><p>Cargando notificaciones...</p></div>
      ) : notifications.length === 0 ? (
        <div className="empty-state" style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow-md)', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
          <h3>Sin notificaciones</h3>
          <p>Aquí aparecerán tus logros, tareas completadas y actualizaciones.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map((n: any) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO
            return (
              <div
                key={n.id}
                style={{
                  background: n.read ? 'white' : 'var(--primary-light)',
                  borderRadius: 12,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  boxShadow: 'var(--shadow-sm)',
                  border: n.read ? '1px solid var(--border)' : `1px solid ${cfg.color}40`,
                  cursor: !n.read ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                }}
                onClick={() => !n.read && markRead.mutate(n.id)}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: cfg.color + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  {cfg.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-dark)', marginBottom: 2 }}>
                    {n.title}
                    {!n.read && (
                      <span style={{
                        marginLeft: 8, fontSize: 10, fontWeight: 700,
                        background: cfg.color, color: 'white',
                        borderRadius: 999, padding: '1px 7px',
                      }}>NUEVO</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-light)' }}>{n.message}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-light)' }}>{timeAgo(n.createdAt)}</span>
                  <button
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 4, borderRadius: 6, color: 'var(--text-light)',
                      opacity: 0.6,
                    }}
                    onClick={e => { e.stopPropagation(); deleteNotif.mutate(n.id) }}
                    title="Eliminar"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
