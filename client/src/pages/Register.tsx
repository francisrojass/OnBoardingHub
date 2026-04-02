import React, { useState, useContext } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import api from '../services/api'

export default function Register() {
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (auth && auth.token) return <Navigate to="/dashboard" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/auth/register', { email, password, name, companyName })
      if (auth) {
        await auth.login(email, password)
        navigate('/dashboard')
      } else {
        navigate('/login')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <img src="/assets/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span className="auth-logo-text">OnBoardingHub</span>
        </div>

        <h1 className="auth-title">Crear cuenta</h1>
        <p className="auth-subtitle">Únete a tu plataforma de onboarding</p>

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Nombre completo</label>
            <input
              id="reg-name"
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Martin Smith"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-company">Empresa</label>
            <input
              id="reg-company"
              type="text"
              className="form-input"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Nombre de tu empresa"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Contraseña</label>
            <input
              id="reg-password"
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="auth-footer">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login">Iniciar sesión</Link>
        </div>
      </div>
    </div>
  )
}
