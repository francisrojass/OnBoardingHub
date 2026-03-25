import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockAuthEmployee } from './helpers'
import Dashboard from '../pages/Dashboard'

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
  },
}))

import api from '../services/api'
const mockApi = api as any

const mockBoxes = [
  { id: 'box-1', title: 'Git Basics', description: 'Learn git', difficulty: 'BEGINNER', xpReward: 100, dockerImage: 'alpine' },
  { id: 'box-2', title: 'Docker Advanced', description: 'Docker deep dive', difficulty: 'ADVANCED', xpReward: 300, dockerImage: 'ubuntu' },
  { id: 'box-3', title: 'API Design', description: 'REST APIs', difficulty: 'INTERMEDIATE', xpReward: 200, dockerImage: 'node' },
]

const mockSandboxes = [
  { id: 's-1', boxId: 'box-1', status: 'RUNNING' }
]

const mockProgress = { xp: 350, level: 1, boxProgresses: [] }

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/boxes') return Promise.resolve({ data: mockBoxes })
      if (url === '/sandboxes') return Promise.resolve({ data: mockSandboxes })
      if (url === '/progress/me') return Promise.resolve({ data: mockProgress })
      return Promise.resolve({ data: [] })
    })
  })

  it('muestra el estado de carga inicialmente', () => {
    mockApi.get.mockImplementation(() => new Promise(() => {}))
    renderWithProviders(<Dashboard />, { auth: mockAuthEmployee })
    expect(screen.getByText(/Cargando inventario/i)).toBeInTheDocument()
  })

  it('renderiza los boxes después de cargar', async () => {
    renderWithProviders(<Dashboard />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('Git Basics')).toBeInTheDocument()
      expect(screen.getByText('Docker Advanced')).toBeInTheDocument()
      expect(screen.getByText('API Design')).toBeInTheDocument()
    })
  })

  it('muestra la sección de XP y nivel', async () => {
    renderWithProviders(<Dashboard />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText(/Level:/i)).toBeInTheDocument()
    })
  })

  it('muestra el encabezado "My Inventory"', async () => {
    renderWithProviders(<Dashboard />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('My Inventory')).toBeInTheDocument()
    })
  })

  it('filtra boxes por dificultad BEGINNER', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Dashboard />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByText('Git Basics')).toBeInTheDocument())

    const filterSelect = screen.getAllByRole('combobox')[0]
    await user.selectOptions(filterSelect, 'beginner')

    await waitFor(() => {
      expect(screen.getByText('Git Basics')).toBeInTheDocument()
      expect(screen.queryByText('Docker Advanced')).not.toBeInTheDocument()
      expect(screen.queryByText('API Design')).not.toBeInTheDocument()
    })
  })

  it('filtra boxes por dificultad ADVANCED', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Dashboard />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByText('Docker Advanced')).toBeInTheDocument())

    const filterSelect = screen.getAllByRole('combobox')[0]
    await user.selectOptions(filterSelect, 'advanced')

    await waitFor(() => {
      expect(screen.getByText('Docker Advanced')).toBeInTheDocument()
      expect(screen.queryByText('Git Basics')).not.toBeInTheDocument()
    })
  })

  it('vuelve a mostrar todos los boxes al seleccionar "all"', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Dashboard />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByText('Git Basics')).toBeInTheDocument())

    const filterSelect = screen.getAllByRole('combobox')[0]
    await user.selectOptions(filterSelect, 'beginner')
    await user.selectOptions(filterSelect, 'all')

    await waitFor(() => {
      expect(screen.getByText('Git Basics')).toBeInTheDocument()
      expect(screen.getByText('Docker Advanced')).toBeInTheDocument()
      expect(screen.getByText('API Design')).toBeInTheDocument()
    })
  })

  it('ordena los boxes por nombre', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Dashboard />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByText('Git Basics')).toBeInTheDocument())

    const sortSelect = screen.getAllByRole('combobox')[1]
    await user.selectOptions(sortSelect, 'name')

    // Todos los boxes deben seguir siendo visibles
    expect(screen.getByText('API Design')).toBeInTheDocument()
    expect(screen.getByText('Docker Advanced')).toBeInTheDocument()
    expect(screen.getByText('Git Basics')).toBeInTheDocument()
  })

  it('muestra estado "Live" cuando el sandbox está RUNNING', async () => {
    renderWithProviders(<Dashboard />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument()
    })
  })

  it('muestra botón "Launch" para boxes sin sandbox activo', async () => {
    renderWithProviders(<Dashboard />, { auth: mockAuthEmployee })
    await waitFor(() => {
      const launchButtons = screen.getAllByText('▶ Launch')
      expect(launchButtons.length).toBeGreaterThan(0)
    })
  })

  it('llama a la API para lanzar sandbox al hacer clic en Launch', async () => {
    const user = userEvent.setup()
    mockApi.post.mockResolvedValue({ data: { id: 'new-sandbox' } })
    renderWithProviders(<Dashboard />, { auth: mockAuthEmployee })

    await waitFor(() => expect(screen.getAllByText('▶ Launch').length).toBeGreaterThan(0))
    await user.click(screen.getAllByText('▶ Launch')[0])

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/sandboxes/launch', expect.objectContaining({ boxId: expect.any(String) }))
    })
  })

  it('muestra estado de error si la API falla', async () => {
    mockApi.get.mockRejectedValue(new Error('Network error'))
    renderWithProviders(<Dashboard />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText(/Error al cargar/i)).toBeInTheDocument()
    })
  })

  it('muestra mensaje vacío cuando no hay boxes', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/boxes') return Promise.resolve({ data: [] })
      return Promise.resolve({ data: [] })
    })
    renderWithProviders(<Dashboard />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText(/No hay boxes disponibles/i)).toBeInTheDocument()
    })
  })

  it('muestra el nombre del usuario en el bottom bar', async () => {
    renderWithProviders(<Dashboard />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })
})
