import React, { useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { AuthContext } from '../context/AuthContext'

export default function CompanySettings() {
  const auth = useContext(AuthContext)

  const { data: teamData, isLoading } = useQuery(
    ['reports-team'],
    async () => { const r = await api.get('/reports/team'); return r.data },
    { enabled: !!auth?.token }
  )

  const company = auth?.user?.company

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Configuración de Empresa</h1>
          <p>Gestiona los datos y miembros de tu organización</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Company info card */}
        <div className="profile-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'linear-gradient(135deg, var(--primary), #818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: 'white', fontWeight: 800,
            }}>
              {company?.name?.[0]?.toUpperCase() || '🏢'}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{company?.name || 'Mi Empresa'}</div>
              <div style={{ fontSize: 13, color: 'var(--text-light)' }}>ID: {company?.id?.slice(0, 12)}...</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Total empleados', value: teamData?.totalWorkers ?? '—', icon: '👥' },
              { label: 'Tareas completadas', value: teamData ? `${teamData.completedTasks}/${teamData.totalTasks}` : '—', icon: '✅' },
              { label: 'Tasa de completado', value: teamData ? `${teamData.taskCompletionRate}%` : '—', icon: '📊' },
              { label: 'Boxes completados', value: teamData?.totalBoxesCompleted ?? '—', icon: '📦' },
              { label: 'XP promedio del equipo', value: teamData?.avgXp ?? '—', icon: '⚡' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', background: 'var(--bg)', borderRadius: 10,
              }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-mid)' }}>{item.label}</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-dark)' }}>
                  {isLoading ? '...' : item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Members list */}
        <div className="profile-card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Miembros del equipo</h2>
          {isLoading ? (
            <p style={{ color: 'var(--text-light)', fontSize: 13 }}>Cargando...</p>
          ) : !teamData?.workers?.length ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-light)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
              <p style={{ fontSize: 13 }}>Sin empleados registrados</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {teamData.workers.map((w: any) => (
                <div key={w.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', background: 'var(--bg)', borderRadius: 10,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--primary-light), #e0e7ff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 12, color: 'var(--primary)',
                  }}>
                    {w.name?.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-dark)' }}>{w.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.email}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>Lv.{w.level}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-light)' }}>{w.xp} XP</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
