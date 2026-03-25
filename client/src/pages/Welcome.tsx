import React, { useContext } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function Welcome() {
  const auth = useContext(AuthContext)
  if (auth && auth.token) return <Navigate to="/dashboard" replace />

  return (
    <div className="welcome-page">
      <div className="welcome-logo">OH</div>

      <h1 className="welcome-title">
        Transforma el onboarding<br />de tu equipo
      </h1>

      <p className="welcome-subtitle">
        Lanza entornos sandbox personalizados, aprende haciendo y domina
        las herramientas de tu empresa desde el primer día.
      </p>

      <div className="welcome-actions">
        <Link
          to="/login"
          className="btn-primary"
          style={{ padding: '13px 32px', fontSize: 15, borderRadius: 10 }}
        >
          Iniciar sesión
        </Link>
        <Link
          to="/register"
          className="btn-secondary"
          style={{ padding: '13px 32px', fontSize: 15, borderRadius: 10 }}
        >
          Crear cuenta
        </Link>
      </div>

      {/* Feature pills */}
      <div style={{ display: 'flex', gap: 12, marginTop: 52, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { icon: '🚀', label: 'Sandboxes en segundos' },
          { icon: '🎯', label: 'Aprendizaje gamificado' },
          { icon: '🔒', label: 'Entornos aislados' },
          { icon: '📊', label: 'Seguimiento de progreso' },
        ].map(f => (
          <div
            key={f.label}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'white', borderRadius: 999,
              padding: '8px 18px', fontSize: 13, fontWeight: 500,
              color: 'var(--text-mid)',
              boxShadow: '0 2px 8px rgba(15,23,42,0.07)',
            }}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
