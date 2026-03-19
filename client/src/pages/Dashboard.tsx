import React, { useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { Link, Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

interface Box {
  id: string
  title: string
  description: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
}

const DIFFICULTY_LABEL: Record<string, string> = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
}

const DIFFICULTY_COLOR: Record<string, string> = {
  BEGINNER: '#22c55e',
  INTERMEDIATE: '#f59e0b',
  ADVANCED: '#ef4444',
}

async function fetchBoxes() {
  const res = await api.get('/boxes')
  return res.data
}

export default function Dashboard() {
  const auth = useContext(AuthContext)

  if (!auth || !auth.token) {
    return <Navigate to="/" replace />
  }

  const { data, isLoading, isError } = useQuery<Box[]>(['boxes'], fetchBoxes, {
    enabled: !!auth.token,
  })

  if (isLoading) {
    return (
      <div style={styles.centerPane}>
        <div style={styles.spinner} />
        <p style={{ color: '#94a3b8', marginTop: 14 }}>Cargando módulos...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div style={styles.centerPane}>
        <p style={{ color: '#ef4444' }}>Error cargando módulos. Asegúrate de estar autenticado.</p>
      </div>
    )
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Tus módulos de onboarding</h2>
        {auth.user && (
          <p style={styles.subtitle}>
            Bienvenido, <strong>{auth.user.name}</strong>. Selecciona un módulo para comenzar.
          </p>
        )}
      </div>

      {/* Empty state */}
      {(!data || data.length === 0) ? (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>📦</div>
          <h3 style={styles.emptyTitle}>Sin módulos disponibles</h3>
          <p style={styles.emptyText}>
            Tu empresa aún no tiene módulos asignados. Contacta con tu administrador para empezar.
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {data.map((box) => (
            <div key={box.id} style={styles.card}>
              <div style={styles.cardTop}>
                <span
                  style={{
                    ...styles.badge,
                    backgroundColor: DIFFICULTY_COLOR[box.difficulty] + '22',
                    color: DIFFICULTY_COLOR[box.difficulty],
                  }}
                >
                  {DIFFICULTY_LABEL[box.difficulty] ?? box.difficulty}
                </span>
                <h3 style={styles.cardTitle}>{box.title}</h3>
                <p style={styles.cardDesc}>{box.description}</p>
              </div>
              <Link to={`/boxes/${box.id}`} style={styles.btnStart}>
                Ver módulo →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  pageHeader: {
    marginBottom: 28,
  },
  pageTitle: {
    margin: '0 0 4px',
    fontSize: 22,
    fontWeight: 700,
    color: '#0f172a',
  },
  subtitle: {
    margin: 0,
    color: '#64748b',
    fontSize: 14,
  },
  centerPane: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  emptyCard: {
    background: 'white',
    borderRadius: 12,
    border: '1px dashed #cbd5e1',
    padding: '56px 32px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    margin: '0 0 8px',
    fontSize: 18,
    fontWeight: 600,
    color: '#1e293b',
  },
  emptyText: {
    margin: 0,
    color: '#64748b',
    fontSize: 14,
    maxWidth: 400,
    marginInline: 'auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 20,
  },
  card: {
    background: 'white',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    padding: '20px 22px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 16,
    transition: 'box-shadow 0.15s',
  },
  cardTop: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  badge: {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '3px 8px',
    borderRadius: 99,
    alignSelf: 'flex-start',
  },
  cardTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 600,
    color: '#0f172a',
  },
  cardDesc: {
    margin: 0,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 1.55,
  },
  btnStart: {
    display: 'block',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: 'white',
    borderRadius: 8,
    padding: '9px 16px',
    fontWeight: 600,
    fontSize: 13,
    textDecoration: 'none',
    boxShadow: '0 2px 6px rgba(99,102,241,0.3)',
  },
}
