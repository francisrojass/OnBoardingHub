import React, { useContext, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { AuthContext } from '../context/AuthContext'

type SandboxStatus = 'PENDING' | 'RUNNING' | 'STOPPED' | 'ERROR'

interface Sandbox {
  id: string
  status: SandboxStatus
  port: number | null
  boxId: string
}

interface Box {
  id: string
  title: string
  description: string
  objectives: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  dockerImage: string
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

export default function BoxDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const auth = useContext(AuthContext)
  const queryClient = useQueryClient()

  // Track active sandbox for this box
  const [activeSandbox, setActiveSandbox] = useState<Sandbox | null>(null)
  const [launchError, setLaunchError] = useState<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Fetch box details ──────────────────────────────────────────────────────
  const { data: box, isLoading: boxLoading } = useQuery<Box>(
    ['box', id],
    async () => {
      const res = await api.get(`/boxes/${id}`)
      return res.data
    },
    { enabled: !!id }
  )

  // ── Fetch user's sandboxes to detect existing one for this box ────────────
  const { data: userSandboxes } = useQuery<Sandbox[]>(
    ['sandboxes'],
    async () => {
      const res = await api.get('/sandboxes')
      return res.data
    },
    {
      enabled: !!auth?.token,
      onSuccess: (sandboxes) => {
        const existing = sandboxes.find(
          (s) => s.boxId === id && s.status === 'RUNNING'
        )
        if (existing && !activeSandbox) {
          setActiveSandbox(existing)
        }
      },
    }
  )

  // ── Poll sandbox status until RUNNING ─────────────────────────────────────
  const startPolling = (sandboxId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/sandboxes/${sandboxId}`)
        const sb: Sandbox = res.data
        setActiveSandbox(sb)
        if (sb.status === 'RUNNING' || sb.status === 'ERROR' || sb.status === 'STOPPED') {
          clearInterval(pollingRef.current!)
          pollingRef.current = null
        }
      } catch {
        clearInterval(pollingRef.current!)
        pollingRef.current = null
      }
    }, 2000)
  }

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  // ── Launch mutation ────────────────────────────────────────────────────────
  const launchMutation = useMutation(
    () => api.post('/sandboxes/launch', { boxId: id }),
    {
      onSuccess: (res) => {
        const sb: Sandbox = res.data
        setActiveSandbox(sb)
        setLaunchError(null)
        if (sb.status !== 'RUNNING') {
          startPolling(sb.id)
        }
      },
      onError: (err: any) => {
        setLaunchError(err?.response?.data?.message || 'Error al lanzar el sandbox')
      },
    }
  )

  // ── Stop mutation ──────────────────────────────────────────────────────────
  const stopMutation = useMutation(
    (sandboxId: string) => api.delete(`/sandboxes/${sandboxId}`),
    {
      onSuccess: () => {
        setActiveSandbox(null)
        queryClient.invalidateQueries(['sandboxes'])
      },
    }
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!auth?.token) {
    navigate('/')
    return null
  }

  if (boxLoading) {
    return (
      <div style={styles.loadingWrapper}>
        <div style={styles.spinner} />
        <p style={{ color: '#94a3b8', marginTop: 16 }}>Cargando módulo...</p>
      </div>
    )
  }

  if (!box) {
    return (
      <div style={styles.loadingWrapper}>
        <p style={{ color: '#ef4444' }}>Módulo no encontrado.</p>
      </div>
    )
  }

  const isRunning = activeSandbox?.status === 'RUNNING'
  const isPending = launchMutation.isLoading || activeSandbox?.status === 'PENDING'
  const isStopping = stopMutation.isLoading
  const sandboxUrl = isRunning && activeSandbox?.port
    ? `http://localhost:${activeSandbox.port}`
    : null

  return (
    <div style={styles.page}>
      {/* ── Header card ────────────────────────────────────────────────────── */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <span style={{ ...styles.badge, backgroundColor: DIFFICULTY_COLOR[box.difficulty] + '22', color: DIFFICULTY_COLOR[box.difficulty] }}>
              {DIFFICULTY_LABEL[box.difficulty] ?? box.difficulty}
            </span>
            <h1 style={styles.title}>{box.title}</h1>
          </div>
          <div style={styles.actions}>
            {!isRunning && !isPending && (
              <button
                style={styles.btnLaunch}
                onClick={() => launchMutation.mutate()}
                disabled={isPending}
              >
                🚀 Lanzar Sandbox
              </button>
            )}
            {isPending && (
              <button style={{ ...styles.btnLaunch, opacity: 0.6, cursor: 'not-allowed' }} disabled>
                <span style={styles.spinnerSmall} /> Aprovisionando...
              </button>
            )}
            {isRunning && (
              <button
                style={styles.btnStop}
                onClick={() => stopMutation.mutate(activeSandbox!.id)}
                disabled={isStopping}
              >
                {isStopping ? 'Deteniendo...' : '⏹ Detener'}
              </button>
            )}
          </div>
        </div>

        <p style={styles.description}>{box.description}</p>

        {box.objectives && (
          <div style={styles.objectives}>
            <h3 style={styles.objectivesTitle}>📋 Objetivos de la sesión</h3>
            <pre style={styles.objectivesPre}>{box.objectives}</pre>
          </div>
        )}

        {launchError && (
          <div style={styles.errorBanner}>
            ⚠️ {launchError}
          </div>
        )}

        {activeSandbox?.status === 'ERROR' && (
          <div style={styles.errorBanner}>
            ⚠️ El sandbox ha fallado. Comprueba que Docker está activo y vuelve a intentarlo.
          </div>
        )}
      </div>

      {/* ── Sandbox iframe ─────────────────────────────────────────────────── */}
      {isRunning && sandboxUrl && (
        <div style={styles.sandboxWrapper}>
          <div style={styles.sandboxBar}>
            <span style={styles.sandboxDot} />
            <span style={styles.sandboxDot2} />
            <span style={styles.sandboxDot3} />
            <span style={styles.sandboxUrl}>{sandboxUrl}</span>
          </div>
          <iframe
            src={sandboxUrl}
            title="Sandbox Terminal"
            style={styles.iframe}
            allow="clipboard-read; clipboard-write"
          />
        </div>
      )}

      {/* ── Pending state visual ───────────────────────────────────────────── */}
      {isPending && !isRunning && (
        <div style={styles.pendingBox}>
          <div style={styles.spinner} />
          <p style={{ color: '#94a3b8', marginTop: 16, fontSize: 14 }}>
            Aprovisionando contenedor Docker... esto puede tardar hasta 30 segundos la primera vez.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Inline styles (no Tailwind dependency) ─────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 960,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  card: {
    background: 'white',
    borderRadius: 12,
    padding: '28px 32px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  badge: {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '3px 10px',
    borderRadius: 99,
    marginBottom: 8,
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: '#0f172a',
  },
  description: {
    color: '#475569',
    lineHeight: 1.7,
    margin: '0 0 16px',
  },
  objectives: {
    background: '#f8fafc',
    borderLeft: '3px solid #6366f1',
    borderRadius: '0 8px 8px 0',
    padding: '12px 16px',
}  ,
  objectivesTitle: {
    margin: '0 0 8px',
    fontSize: 13,
    fontWeight: 600,
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  objectivesPre: {
    margin: 0,
    fontFamily: 'inherit',
    fontSize: 14,
    color: '#334155',
    whiteSpace: 'pre-wrap',
  },
  actions: {
    display: 'flex',
    gap: 10,
    flexShrink: 0,
  },
  btnLaunch: {
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
  },
  btnStop: {
    background: '#fef2f2',
    color: '#ef4444',
    border: '1.5px solid #fca5a5',
    borderRadius: 8,
    padding: '10px 20px',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
  errorBanner: {
    marginTop: 16,
    background: '#fef2f2',
    color: '#b91c1c',
    border: '1px solid #fca5a5',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
  },
  sandboxWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    border: '1px solid #e2e8f0',
  },
  sandboxBar: {
    background: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 16px',
  },
  sandboxDot: { width: 12, height: 12, borderRadius: '50%', background: '#ef4444' },
  sandboxDot2: { width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' },
  sandboxDot3: { width: 12, height: 12, borderRadius: '50%', background: '#22c55e' },
  sandboxUrl: {
    marginLeft: 8,
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  iframe: {
    width: '100%',
    height: 520,
    border: 'none',
    display: 'block',
    background: '#0d1117',
  },
  pendingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 48,
  },
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  spinnerSmall: {
    display: 'inline-block',
    width: 14,
    height: 14,
    border: '2px solid rgba(255,255,255,0.4)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}
