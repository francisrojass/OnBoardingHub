import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockAuthEmployee } from './helpers'
import Tasks from '../pages/Tasks'

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
  },
}))

import api from '../services/api'
const mockApi = api as any

const mockTasks = [
  {
    id: 'task-1',
    title: 'Configurar entorno',
    description: 'Instalar las herramientas',
    status: 'PENDING',
    priority: 'HIGH',
    category: 'Técnico',
    createdAt: '2024-01-01T00:00:00Z',
    box: null,
  },
  {
    id: 'task-2',
    title: 'Leer documentación',
    description: null,
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    category: 'Onboarding',
    createdAt: '2024-01-01T00:00:00Z',
    box: { id: 'box-1', title: 'Git Basics', difficulty: 'BEGINNER' },
  },
  {
    id: 'task-3',
    title: 'Reunión de bienvenida',
    description: 'Conocer al equipo',
    status: 'COMPLETED',
    priority: 'LOW',
    category: 'Social',
    createdAt: '2024-01-01T00:00:00Z',
    box: null,
  },
]

describe('Tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.get.mockResolvedValue({ data: mockTasks })
    mockApi.patch.mockResolvedValue({ data: {} })
  })

  it('muestra el estado de carga inicialmente', () => {
    mockApi.get.mockImplementation(() => new Promise(() => {}))
    renderWithProviders(<Tasks />, { auth: mockAuthEmployee })
    expect(document.querySelector('.tasks-spinner')).toBeInTheDocument()
  })

  it('renderiza el encabezado "Mis Tareas"', async () => {
    renderWithProviders(<Tasks />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('Mis Tareas')).toBeInTheDocument()
    })
  })

  it('muestra las tareas agrupadas por categoría', async () => {
    renderWithProviders(<Tasks />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('Técnico')).toBeInTheDocument()
      expect(screen.getByText('Onboarding')).toBeInTheDocument()
      expect(screen.getByText('Social')).toBeInTheDocument()
    })
  })

  it('muestra los títulos de las tareas', async () => {
    renderWithProviders(<Tasks />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('Configurar entorno')).toBeInTheDocument()
      expect(screen.getByText('Leer documentación')).toBeInTheDocument()
      expect(screen.getByText('Reunión de bienvenida')).toBeInTheDocument()
    })
  })

  it('muestra las estadísticas correctas', async () => {
    renderWithProviders(<Tasks />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('1 de 3 tareas completadas')).toBeInTheDocument()
    })
  })

  it('muestra los botones de filtro', async () => {
    renderWithProviders(<Tasks />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Todas' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Pendientes' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'En progreso' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Completadas' })).toBeInTheDocument()
    })
  })

  it('filtra para mostrar solo tareas pendientes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Tasks />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByText('Configurar entorno')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Pendientes' }))

    expect(screen.getByText('Configurar entorno')).toBeInTheDocument()
    expect(screen.queryByText('Leer documentación')).not.toBeInTheDocument()
    expect(screen.queryByText('Reunión de bienvenida')).not.toBeInTheDocument()
  })

  it('filtra para mostrar solo tareas en progreso', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Tasks />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByText('Leer documentación')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'En progreso' }))

    expect(screen.getByText('Leer documentación')).toBeInTheDocument()
    expect(screen.queryByText('Configurar entorno')).not.toBeInTheDocument()
    expect(screen.queryByText('Reunión de bienvenida')).not.toBeInTheDocument()
  })

  it('filtra para mostrar solo tareas completadas', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Tasks />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByText('Reunión de bienvenida')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Completadas' }))

    expect(screen.getByText('Reunión de bienvenida')).toBeInTheDocument()
    expect(screen.queryByText('Configurar entorno')).not.toBeInTheDocument()
    expect(screen.queryByText('Leer documentación')).not.toBeInTheDocument()
  })

  it('vuelve a mostrar todas las tareas al clicar "Todas"', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Tasks />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByText('Configurar entorno')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Pendientes' }))
    await user.click(screen.getByRole('button', { name: 'Todas' }))

    expect(screen.getByText('Configurar entorno')).toBeInTheDocument()
    expect(screen.getByText('Leer documentación')).toBeInTheDocument()
    expect(screen.getByText('Reunión de bienvenida')).toBeInTheDocument()
  })

  it('llama a la API al hacer clic en una tarea para cambiar su estado', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Tasks />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByText('Configurar entorno')).toBeInTheDocument())

    await user.click(screen.getByText('Configurar entorno'))

    await waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith('/tasks/task-1', { status: 'IN_PROGRESS' })
    })
  })

  it('cicla el estado PENDING → IN_PROGRESS al hacer clic', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Tasks />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByText('Configurar entorno')).toBeInTheDocument())

    await user.click(screen.getByText('Configurar entorno'))
    expect(mockApi.patch).toHaveBeenCalledWith('/tasks/task-1', { status: 'IN_PROGRESS' })
  })

  it('cicla el estado IN_PROGRESS → COMPLETED al hacer clic', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Tasks />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByText('Leer documentación')).toBeInTheDocument())

    await user.click(screen.getByText('Leer documentación'))
    expect(mockApi.patch).toHaveBeenCalledWith('/tasks/task-2', { status: 'COMPLETED' })
  })

  it('cicla el estado COMPLETED → PENDING al hacer clic', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Tasks />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByText('Reunión de bienvenida')).toBeInTheDocument())

    await user.click(screen.getByText('Reunión de bienvenida'))
    expect(mockApi.patch).toHaveBeenCalledWith('/tasks/task-3', { status: 'PENDING' })
  })

  it('muestra el tag de sandbox si la tarea tiene box asociado', async () => {
    renderWithProviders(<Tasks />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText(/Sandbox: Git Basics/i)).toBeInTheDocument()
    })
  })

  it('muestra estado vacío cuando no hay tareas', async () => {
    mockApi.get.mockResolvedValue({ data: [] })
    renderWithProviders(<Tasks />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('No hay tareas')).toBeInTheDocument()
    })
  })

  it('muestra prioridades de las tareas', async () => {
    renderWithProviders(<Tasks />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('Alta')).toBeInTheDocument()
      expect(screen.getByText('Media')).toBeInTheDocument()
      expect(screen.getByText('Baja')).toBeInTheDocument()
    })
  })
})
