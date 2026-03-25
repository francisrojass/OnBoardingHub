import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '../context/AuthContext'
import { mockAuthEmployee, createTestQueryClient } from './helpers'
import BoxDetail from '../pages/BoxDetail'

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
  },
}))

import api from '../services/api'
const mockApi = api as any

const mockBox = {
  id: 'box-1',
  title: 'Git Basics',
  description: 'Learn version control with git and GitHub',
  objectives: 'Understand branching, merging and pull requests',
  difficulty: 'BEGINNER',
  xpReward: 150,
  dockerImage: 'gitpod/workspace-full',
}

function renderBoxDetail(boxId = 'box-1', auth = mockAuthEmployee) {
  const queryClient = createTestQueryClient()
  return {
    ...require('@testing-library/react').render(
      <MemoryRouter initialEntries={[`/boxes/${boxId}`]}>
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={auth as any}>
            <Routes>
              <Route path="/boxes/:id" element={<BoxDetail />} />
            </Routes>
          </AuthContext.Provider>
        </QueryClientProvider>
      </MemoryRouter>
    ),
    queryClient,
  }
}

describe('BoxDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.get.mockResolvedValue({ data: mockBox })
    mockApi.post.mockResolvedValue({ data: { id: 'sandbox-1', status: 'RUNNING' } })
  })

  it('muestra el estado de carga inicialmente', () => {
    mockApi.get.mockImplementation(() => new Promise(() => {}))
    renderBoxDetail()
    expect(screen.getByText(/Cargando box/i)).toBeInTheDocument()
  })

  it('muestra el título del box', async () => {
    renderBoxDetail()
    await waitFor(() => {
      expect(screen.getByText('Git Basics')).toBeInTheDocument()
    })
  })

  it('muestra la descripción del box', async () => {
    renderBoxDetail()
    await waitFor(() => {
      expect(screen.getByText('Learn version control with git and GitHub')).toBeInTheDocument()
    })
  })

  it('muestra los objetivos del box', async () => {
    renderBoxDetail()
    await waitFor(() => {
      expect(screen.getByText('Understand branching, merging and pull requests')).toBeInTheDocument()
    })
  })

  it('muestra el XP real del box (no hardcodeado)', async () => {
    renderBoxDetail()
    await waitFor(() => {
      expect(screen.getByText('150 XP')).toBeInTheDocument()
    })
  })

  it('muestra el badge de dificultad', async () => {
    renderBoxDetail()
    await waitFor(() => {
      expect(screen.getAllByText('BEGINNER').length).toBeGreaterThan(0)
    })
  })

  it('muestra la imagen Docker del box', async () => {
    renderBoxDetail()
    await waitFor(() => {
      expect(screen.getByText('gitpod/workspace-full')).toBeInTheDocument()
    })
  })

  it('muestra el botón "Launch Sandbox"', async () => {
    renderBoxDetail()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Launch Sandbox/i })).toBeInTheDocument()
    })
  })

  it('muestra el enlace "Volver al inventario"', async () => {
    renderBoxDetail()
    await waitFor(() => {
      const backLinks = screen.getAllByText('Volver al inventario')
      expect(backLinks.length).toBeGreaterThan(0)
    })
  })

  it('llama a la API al hacer clic en "Launch Sandbox"', async () => {
    const user = userEvent.setup()
    renderBoxDetail()
    await waitFor(() => expect(screen.getByRole('button', { name: /Launch Sandbox/i })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Launch Sandbox/i }))

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/sandboxes/launch', { boxId: 'box-1' })
    })
  })

  it('muestra mensaje de éxito después de lanzar el sandbox', async () => {
    const user = userEvent.setup()
    renderBoxDetail()
    await waitFor(() => expect(screen.getByRole('button', { name: /Launch Sandbox/i })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Launch Sandbox/i }))

    await waitFor(() => {
      expect(screen.getByText(/Sandbox lanzado correctamente/i)).toBeInTheDocument()
    })
  })

  it('muestra mensaje de error si falla el lanzamiento', async () => {
    const user = userEvent.setup()
    mockApi.post.mockRejectedValue(new Error('Docker error'))
    renderBoxDetail()
    await waitFor(() => expect(screen.getByRole('button', { name: /Launch Sandbox/i })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Launch Sandbox/i }))

    await waitFor(() => {
      expect(screen.getByText(/Error al lanzar el sandbox/i)).toBeInTheDocument()
    })
  })

  it('muestra estado "Box no encontrado" cuando la API no devuelve datos', async () => {
    mockApi.get.mockResolvedValue({ data: null })
    renderBoxDetail()
    await waitFor(() => {
      expect(screen.getByText('Box no encontrado')).toBeInTheDocument()
    })
  })

  it('muestra "Lanzando..." mientras se lanza el sandbox', async () => {
    const user = userEvent.setup()
    mockApi.post.mockImplementation(() => new Promise(() => {}))
    renderBoxDetail()
    await waitFor(() => expect(screen.getByRole('button', { name: /Launch Sandbox/i })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Launch Sandbox/i }))

    await waitFor(() => {
      expect(screen.getByText('Lanzando...')).toBeInTheDocument()
    })
  })
})
