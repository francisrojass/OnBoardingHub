import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockAuthEmployee } from './helpers'
import LearningHub from '../pages/LearningHub'

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
  {
    id: 'box-1',
    title: 'Git Basics',
    description: 'Learn version control with git',
    difficulty: 'BEGINNER',
    xpReward: 100,
  },
  {
    id: 'box-2',
    title: 'Docker Advanced',
    description: 'Advanced container orchestration',
    difficulty: 'ADVANCED',
    xpReward: 300,
  },
  {
    id: 'box-3',
    title: 'API Design Patterns',
    description: 'REST and GraphQL APIs',
    difficulty: 'INTERMEDIATE',
    xpReward: 200,
  },
]

const mockProgress = {
  xp: 350,
  level: 1,
  boxProgresses: [
    { boxId: 'box-1', completedAt: '2024-01-15T00:00:00Z' },
  ],
}

const mockSandboxes = [
  { id: 's-1', boxId: 'box-2', status: 'RUNNING' },
]

describe('LearningHub', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/boxes') return Promise.resolve({ data: mockBoxes })
      if (url === '/progress/me') return Promise.resolve({ data: mockProgress })
      if (url === '/sandboxes') return Promise.resolve({ data: mockSandboxes })
      return Promise.resolve({ data: [] })
    })
    mockApi.post.mockResolvedValue({ data: {} })
  })

  it('renderiza el encabezado "Learning Hub"', async () => {
    renderWithProviders(<LearningHub />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('Learning Hub')).toBeInTheDocument()
    })
  })

  it('muestra todos los boxes disponibles', async () => {
    renderWithProviders(<LearningHub />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('Git Basics')).toBeInTheDocument()
      expect(screen.getByText('Docker Advanced')).toBeInTheDocument()
      expect(screen.getByText('API Design Patterns')).toBeInTheDocument()
    })
  })

  it('muestra el contador de boxes completados', async () => {
    renderWithProviders(<LearningHub />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('de 3 completados')).toBeInTheDocument()
    })
  })

  it('muestra la barra de progreso general', async () => {
    renderWithProviders(<LearningHub />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('Progreso general')).toBeInTheDocument()
    })
  })

  it('muestra checkmark verde en boxes completados', async () => {
    renderWithProviders(<LearningHub />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('✓ Completado')).toBeInTheDocument()
    })
  })

  it('muestra botón "Marcar completo" en boxes no completados', async () => {
    renderWithProviders(<LearningHub />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getAllByText('Marcar completo').length).toBeGreaterThan(0)
    })
  })

  it('filtra boxes por búsqueda de texto', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LearningHub />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByText('Git Basics')).toBeInTheDocument())

    const searchInput = screen.getByPlaceholderText('Buscar módulo...')
    await user.type(searchInput, 'Git')

    expect(screen.getByText('Git Basics')).toBeInTheDocument()
    expect(screen.queryByText('Docker Advanced')).not.toBeInTheDocument()
    expect(screen.queryByText('API Design Patterns')).not.toBeInTheDocument()
  })

  it('filtra boxes por dificultad', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LearningHub />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByText('Git Basics')).toBeInTheDocument())

    const filterSelect = screen.getByRole('combobox')
    await user.selectOptions(filterSelect, 'beginner')

    expect(screen.getByText('Git Basics')).toBeInTheDocument()
    expect(screen.queryByText('Docker Advanced')).not.toBeInTheDocument()
    expect(screen.queryByText('API Design Patterns')).not.toBeInTheDocument()
  })

  it('filtra boxes por dificultad ADVANCED', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LearningHub />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByText('Docker Advanced')).toBeInTheDocument())

    const filterSelect = screen.getByRole('combobox')
    await user.selectOptions(filterSelect, 'advanced')

    expect(screen.getByText('Docker Advanced')).toBeInTheDocument()
    expect(screen.queryByText('Git Basics')).not.toBeInTheDocument()
  })

  it('vuelve a mostrar todos al limpiar la búsqueda', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LearningHub />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByText('Git Basics')).toBeInTheDocument())

    const searchInput = screen.getByPlaceholderText('Buscar módulo...')
    await user.type(searchInput, 'Git')
    await user.clear(searchInput)

    expect(screen.getByText('Git Basics')).toBeInTheDocument()
    expect(screen.getByText('Docker Advanced')).toBeInTheDocument()
  })

  it('llama a la API al hacer clic en "Marcar completo"', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LearningHub />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getAllByText('Marcar completo').length).toBeGreaterThan(0))

    await user.click(screen.getAllByText('Marcar completo')[0])

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(expect.stringContaining('/progress/box/'))
    })
  })

  it('muestra "Live" para el sandbox en ejecución', async () => {
    renderWithProviders(<LearningHub />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument()
    })
  })

  it('muestra botones Launch para boxes sin sandbox activo', async () => {
    renderWithProviders(<LearningHub />, { auth: mockAuthEmployee })
    await waitFor(() => {
      const launchBtns = screen.getAllByText('▶ Launch')
      expect(launchBtns.length).toBeGreaterThan(0)
    })
  })

  it('llama a la API al hacer clic en Launch', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LearningHub />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getAllByText('▶ Launch').length).toBeGreaterThan(0))

    await user.click(screen.getAllByText('▶ Launch')[0])

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/sandboxes/launch', expect.any(Object))
    })
  })

  it('muestra estado vacío cuando no hay boxes que coincidan con la búsqueda', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LearningHub />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByText('Git Basics')).toBeInTheDocument())

    const searchInput = screen.getByPlaceholderText('Buscar módulo...')
    await user.type(searchInput, 'xyzabc')

    await waitFor(() => {
      expect(screen.getByText('No se encontraron módulos')).toBeInTheDocument()
    })
  })
})
