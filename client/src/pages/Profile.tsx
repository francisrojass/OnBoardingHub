import React, { useContext, useState, useEffect } from 'react'
import { AuthContext } from '../context/AuthContext'
import api from '../services/api'

function getInitials(name?: string | null) {
  if (!name) return 'U'
  return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function Profile() {
  const auth = useContext(AuthContext)
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (!auth) return
    api.get('/users/profile')
      .then(res => { setProfile(res.data); setName(res.data.name || '') })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [auth])

  if (!auth) return null
  if (loading) return <div className="empty-state"><p>Cargando perfil...</p></div>

  const save = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const res = await api.put('/users/profile', { name })
      setProfile(res.data)
      if (auth.updateUser) auth.updateUser(res.data)
      setMsg({ text: 'Perfil guardado correctamente', ok: true })
    } catch (err: any) {
      setMsg({ text: err.response?.data?.message || err.message || 'Error', ok: false })
    } finally {
      setSaving(false)
    }
  }

  const role = profile?.role
    ? profile.role.charAt(0) + profile.role.slice(1).toLowerCase()
    : 'Employee'

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Mi Perfil</h1>
          <p>Gestiona tu información y preferencias de cuenta</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* ── Left: Avatar / info ── */}
        <div className="profile-card" style={{ textAlign: 'center' }}>
          <div className="profile-avatar-large">{getInitials(profile?.name)}</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
            {profile?.name || 'Usuario'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>
            {profile?.email}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--primary-light)', color: 'var(--primary)',
            borderRadius: 999, padding: '4px 14px', fontSize: 12, fontWeight: 600,
          }}>
            {profile?.role === 'ADMIN' ? '👑 Admin' : '👤 Employee'}
          </div>

          {profile?.company && (
            <div style={{
              marginTop: 20, padding: '12px 16px',
              background: 'var(--bg)', borderRadius: 10, textAlign: 'left',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Empresa
              </div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{profile.company.name}</div>
            </div>
          )}

          {/* XP mini-bar */}
          {(() => {
            const XP_PER_LEVEL = 500
            const totalXp: number = profile?.xp ?? 0
            const currentLevel: number = profile?.level ?? 1
            const levelXp = totalXp % XP_PER_LEVEL
            const xpPct = Math.round((levelXp / XP_PER_LEVEL) * 100)
            return (
              <div style={{ marginTop: 20, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 6 }}>
                  <span>XP Progress</span>
                  <span>Level {currentLevel}</span>
                </div>
                <div className="xp-level-bar-wrap">
                  <div className="xp-level-bar" style={{ width: `${xpPct}%` }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4 }}>
                  {levelXp.toLocaleString()} / {XP_PER_LEVEL} XP · Total: {totalXp.toLocaleString()} XP
                </div>
              </div>
            )
          })()}
        </div>

        {/* ── Right: Edit form ── */}
        <div className="profile-card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 22 }}>Editar perfil</h2>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              value={profile?.email || ''}
              disabled
              style={{ background: 'var(--bg)', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Rol</label>
            <input
              className="form-input"
              value={role}
              disabled
              style={{ background: 'var(--bg)', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tu nombre completo"
            />
          </div>

          {msg && (
            <div style={{
              background: msg.ok ? '#dcfce7' : '#fee2e2',
              color: msg.ok ? '#16a34a' : '#dc2626',
              borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14,
            }}>
              {msg.text}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 8 }}>
            <button
              className="btn-secondary"
              onClick={() => auth.logout()}
              style={{ color: '#ef4444', borderColor: '#fecaca' }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Cerrar sesión
            </button>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
