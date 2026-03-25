import React, { useContext, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { AuthContext } from '../context/AuthContext'

const LEVEL_COLORS = ['#94a3b8', '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']

function levelColor(level: number) {
  return LEVEL_COLORS[Math.min(level - 1, LEVEL_COLORS.length - 1)]
}

export default function AdminReports() {
  const auth = useContext(AuthContext)
  const [tab, setTab] = useState<'team' | 'boxes'>('team')

  const { data: teamData, isLoading: teamLoading } = useQuery(
    ['reports-team'],
    async () => { const r = await api.get('/reports/team'); return r.data },
    { enabled: !!auth?.token }
  )

  const { data: boxStats, isLoading: boxLoading } = useQuery(
    ['reports-boxes'],
    async () => { const r = await api.get('/reports/boxes'); return r.data },
    { enabled: !!auth?.token }
  )

  const DIFF_LABEL: Record<string, string> = { BEGINNER: 'Principiante', INTERMEDIATE: 'Intermedio', ADVANCED: 'Avanzado' }
  const DIFF_COLOR: Record<string, string> = { BEGINNER: '#22c55e', INTERMEDIATE: '#f59e0b', ADVANCED: '#ef4444' }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Reportes</h1>
          <p>Progreso y métricas del equipo</p>
        </div>
      </div>

      {/* Stat cards */}
      {teamData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Empleados', value: teamData.totalWorkers, icon: '👥', color: '#6366f1' },
            { label: 'Tareas completadas', value: `${teamData.completedTasks}/${teamData.totalTasks}`, icon: '✅', color: '#22c55e' },
            { label: 'Tasa de completado', value: `${teamData.taskCompletionRate}%`, icon: '📊', color: '#3b82f6' },
            { label: 'Boxes completados', value: teamData.totalBoxesCompleted, icon: '📦', color: '#f59e0b' },
            { label: 'XP promedio', value: teamData.avgXp, icon: '⚡', color: '#ec4899' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'white', borderRadius: 14, padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['team', 'boxes'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: tab === t ? 'var(--primary)' : 'white',
              color: tab === t ? 'white' : 'var(--text-mid)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {t === 'team' ? '👥 Equipo' : '📦 Boxes'}
          </button>
        ))}
      </div>

      {/* Team tab */}
      {tab === 'team' && (
        teamLoading ? (
          <div className="empty-state"><p>Cargando datos del equipo...</p></div>
        ) : !teamData?.workers?.length ? (
          <div className="empty-state" style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <h3>Sin empleados</h3>
            <p>Todavía no hay empleados registrados en tu empresa.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {teamData.workers.map((w: any) => (
              <div key={w.id} style={{
                background: 'white', borderRadius: 14, padding: '16px 20px',
                boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${levelColor(w.level)}40, ${levelColor(w.level)}20)`,
                    border: `2px solid ${levelColor(w.level)}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 14, color: levelColor(w.level),
                  }}>
                    {w.name?.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{w.name}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999,
                        background: levelColor(w.level) + '20', color: levelColor(w.level),
                      }}>Lv.{w.level}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{w.email}</div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-light)', marginBottom: 4 }}>
                        <span>Tareas: {w.completedTasks}/{w.totalTasks}</span>
                        <span>{w.taskProgress}%</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${w.taskProgress}%`, background: levelColor(w.level), borderRadius: 99, transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b' }}>{w.xp}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-light)' }}>XP</div>
                    <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4 }}>
                      {w.completedBoxes} boxes
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Boxes tab */}
      {tab === 'boxes' && (
        boxLoading ? (
          <div className="empty-state"><p>Cargando estadísticas...</p></div>
        ) : !boxStats?.length ? (
          <div className="empty-state" style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <h3>Sin boxes</h3>
            <p>Todavía no hay boxes asignados a tu empresa.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(boxStats as any[]).map((box: any) => (
              <div key={box.id} style={{
                background: 'white', borderRadius: 14, padding: '16px 20px',
                boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: DIFF_COLOR[box.difficulty] + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>📦</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{box.title}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999,
                      background: DIFF_COLOR[box.difficulty] + '20', color: DIFF_COLOR[box.difficulty],
                    }}>{DIFF_LABEL[box.difficulty]}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>
                    {box.totalCompletions} completados · {box.totalAttempts} intentos
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b' }}>{box.xpReward}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)' }}>XP</div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </>
  )
}
