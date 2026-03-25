import React from 'react'
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

export default function BoxDetail() {
  const { id } = useParams()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery(
    ['box', id],
    async () => { const res = await api.get(`/boxes/${id}`); return res.data },
    { enabled: !!id }
  )

  const launch = useMutation(
    () => api.post('/sandboxes/launch', { boxId: id }),
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

          {/* Tasks placeholder */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--text-dark)' }}>
              Progreso
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 13, color: 'var(--text-mid)' }}>
              <div className="box-progress-check">
                <svg width="8" height="8" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <span>4 / 6 Tasks completadas</span>
              <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--text-dark)' }}>60%</span>
            </div>
            <div className="box-progress-bar-wrap" style={{ height: 6 }}>
              <div className="box-progress-bar" style={{ width: '60%' }} />
            </div>
          </div>
        </div>

        {/* Launch card */}
        <div className="profile-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🏆</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>
            {xp} XP
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 24 }}>
            Al completar este box
          </div>

          {launch.isSuccess && (
            <div style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 500, marginBottom: 14 }}>
              ✓ Sandbox lanzado correctamente
            </div>
          )}
          {launch.isError && (
            <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 500, marginBottom: 14 }}>
              Error al lanzar el sandbox
            </div>
          )}

          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }}
            onClick={() => launch.mutate()}
            disabled={launch.isLoading}
          >
            {launch.isLoading ? 'Lanzando...' : '▶  Launch Sandbox'}
          </button>

          <Link
            to="/dashboard"
            className="btn-secondary"
            style={{ marginTop: 10, width: '100%', justifyContent: 'center', padding: '10px', display: 'flex' }}
          >
            Volver al inventario
          </Link>

          {/* Metadata */}
          <div style={{ marginTop: 24, textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Detalles
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-light)' }}>Dificultad</span>
                <span className={`diff-badge ${diffLabel}`} style={{ fontSize: 10 }}>{diffLabel}</span>
              </div>
              {data.dockerImage && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-light)' }}>Imagen</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 11 }}>
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
