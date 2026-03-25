import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockAuthAdmin } from './helpers'
import AdminTasks from '../pages/AdminTasks'

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
  },
}))

import api from '../services/api'
const mockApi = api as any

const mockWorkers = [
  {
    id: 'worker-1',
    name: 'Ana García',
    email: 'ana@acme.com',
    role: 'EMPLOYEE',
    createdAt: '2024-01-01T00:00:00Z',
    tasks: [
      { id: 't-1', status: 'COMPLETED' },
      { id: 't-2', status: 'PENDING' },
    ],
  },
  {
    id: 'worker-2',
    name: 'Carlos López',
    email: 'carlos@acme.com',
    role: 'EMPLOYEE',
    createdAt: '2024-01-01T00:00:00Z',
    tasks: [
      { id: 't-3', status: 'IN_PROGRESS' },
    ],
  },
]

const mockBoxes = [
  { id: 'box-1', title: 'Git Basics', difficulty: 'BEGINNER' },
  { id: 'box-2', title: 'Docker', difficulty: 'ADVANCED' },
]

const mockWorkerTasks = [
  {
    id: 't-1',
    title: 'Configurar Git',
    description: 'Instalar git',
    status: 'COMPLETED' as const,
    priority: 'HIGH' as const,
    category: 'Técnico',
    box: { id: 'box-1', title: 'Git Basics', difficulty: 'BEGINNER' },
  },
]

describe('AdminTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/admin/workers') return Promise.resolve({ data: mockWorkers })
      if (url === '/boxes') return Promise.resolve({ data: mockBoxes })
      if (url.includes('/admin/workers/') && url.includes('/tasks'))
        return Promise.resolve({ data: mockWorkerTasks })
      return Promise.resolve({ data: [] })
    })
    mockApi.post.mockResolvedValue({ data: { id: 'new-task' } })
    mockApi.delete.mockResolvedValue({ data: {} })
  })

  it('renderiza el encabezado "Gestión de Tareas"', async () => {
    renderWithProviders(<AdminTasks />, { auth: mockAuthAdmin })
    await waitFor(() => {
      expect(screen.getByText('Gestión de Tareas')).toBeInTheDocument()
    })
  })

  it('muestra las tabs de Trabajadores y Asignar tarea', async () => {
    renderWithProviders(<AdminTasks />, { auth: mockAuthAdmin })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Trabajadores/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Asignar tarea/i })).toBeInTheDocument()
    })
  })

  it('muestra la tab de Trabajadores activa por defecto', async () => {
    renderWithProviders(<AdminTasks />, { auth: mockAuthAdmin })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Trabajadores/i })).toHaveClass('active')
    })
  })

  // ─── Tab clicks ───

  it('cambia a la tab "Asignar tarea" al hacer clic', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminTasks />, { auth: mockAuthAdmin })
    // The tab button is the first one with class admin-tab
    await waitFor(() => expect(document.querySelectorAll('.admin-tab').length).toBe(2))

    const assignTab = Array.from(document.querySelectorAll('.admin-tab')).find(
      el => el.textContent?.includes('Asignar tarea')
    ) as HTMLElement
    await user.click(assignTab)

    await waitFor(() => {
      expect(assignTab).toHaveClass('active')
      expect(screen.getByText('Nueva tarea')).toBeInTheDocument()
    })
  })

  it('vuelve a la tab "Trabajadores" al hacer clic en ella', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminTasks />, { auth: mockAuthAdmin })
    await waitFor(() => expect(document.querySelectorAll('.admin-tab').length).toBe(2))

    const [workersTab, assignTab] = Array.from(document.querySelectorAll('.admin-tab')) as HTMLElement[]
    await user.click(assignTab)
    await user.click(workersTab)

    await waitFor(() => {
      expect(workersTab).toHaveClass('active')
    })
  })

  // ─── Workers tab ───

  it('muestra la lista de trabajadores en la tab Workers', async () => {
    renderWithProviders(<AdminTasks />, { auth: mockAuthAdmin })
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument()
      expect(screen.getByText('Carlos López')).toBeInTheDocument()
    })
  })

  it('muestra las estadísticas globales del equipo', async () => {
    renderWithProviders(<AdminTasks />, { auth: mockAuthAdmin })
    await waitFor(() => {
      expect(screen.getAllByText('Trabajadores').length).toBeGreaterThan(0)
      expect(screen.getByText('Tareas asignadas')).toBeInTheDocument()
      expect(screen.getAllByText('Completadas').length).toBeGreaterThan(0)
    })
  })

  it('expande el card de un trabajador al hacer clic', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminTasks />, { auth: mockAuthAdmin })
    await waitFor(() => expect(screen.getByText('Ana García')).toBeInTheDocument())

    await user.click(screen.getByText('Ana García'))

    await waitFor(() => {
      expect(screen.getByText('Configurar Git')).toBeInTheDocument()
    })
  })

  it('colapsa el card del trabajador al hacer clic de nuevo', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminTasks />, { auth: mockAuthAdmin })
    await waitFor(() => expect(screen.getByText('Ana García')).toBeInTheDocument())

    await user.click(screen.getByText('Ana García'))
    await waitFor(() => expect(screen.getByText('Configurar Git')).toBeInTheDocument())

    await user.click(screen.getByText('Ana García'))
    await waitFor(() => {
      expect(screen.queryByText('Configurar Git')).not.toBeInTheDocument()
    })
  })

  it('navega a "Asignar tarea" al clicar el botón "+ Asignar" del trabajador', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminTasks />, { auth: mockAuthAdmin })
    await waitFor(() => expect(screen.getAllByRole('button', { name: /\+ Asignar/i }).length).toBeGreaterThan(0))

    await user.click(screen.getAllByRole('button', { name: /\+ Asignar/i })[0])

    await waitFor(() => {
      expect(screen.getByText('Nueva tarea')).toBeInTheDocument()
    })
  })

  // ─── Assign task form ───

  it('muestra el formulario de asignación al cambiar de tab', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminTasks />, { auth: mockAuthAdmin })
    await waitFor(() => expect(document.querySelectorAll('.admin-tab').length).toBe(2))

    const assignTab = Array.from(document.querySelectorAll('.admin-tab')).find(
      el => el.textContent?.includes('Asignar tarea')
    ) as HTMLElement
    await user.click(assignTab)

    await waitFor(() => {
      expect(screen.getByText('Nueva tarea')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Ej: Configurar entorno/i)).toBeInTheDocument()
    })
  })

  it('puede escribir un título en el formulario de asignación', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminTasks />, { auth: mockAuthAdmin })
    await waitFor(() => expect(document.querySelectorAll('.admin-tab').length).toBe(2))

    const assignTab = Array.from(document.querySelectorAll('.admin-tab')).find(
      el => el.textContent?.includes('Asignar tarea')
    ) as HTMLElement
    await user.click(assignTab)
    await waitFor(() => expect(screen.getByPlaceholderText(/Ej: Configurar entorno/i)).toBeInTheDocument())

    const titleInput = screen.getByPlaceholderText(/Ej: Configurar entorno/i)
    await user.type(titleInput, 'Tarea de prueba')
    expect(titleInput).toHaveValue('Tarea de prueba')
  })

  it('puede cambiar la prioridad en el formulario', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminTasks />, { auth: mockAuthAdmin })
    await waitFor(() => expect(document.querySelectorAll('.admin-tab').length).toBe(2))

    const assignTab = Array.from(document.querySelectorAll('.admin-tab')).find(
      el => el.textContent?.includes('Asignar tarea')
    ) as HTMLElement
    await user.click(assignTab)
    await waitFor(() => expect(screen.getByRole('button', { name: /Alta/i })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Alta/i }))
    expect(screen.getByRole('button', { name: /Alta/i })).toHaveClass('active')
  })

  it('puede cambiar la categoría en el formulario', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminTasks />, { auth: mockAuthAdmin })
    await waitFor(() => expect(document.querySelectorAll('.admin-tab').length).toBe(2))

    const assignTab = Array.from(document.querySelectorAll('.admin-tab')).find(
      el => el.textContent?.includes('Asignar tarea')
    ) as HTMLElement
    await user.click(assignTab)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Técnico' })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Técnico' }))
    expect(screen.getByRole('button', { name: 'Técnico' })).toHaveClass('active')
  })

  it('muestra error si se intenta asignar sin seleccionar trabajador', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminTasks />, { auth: mockAuthAdmin })
    await waitFor(() => expect(document.querySelectorAll('.admin-tab').length).toBe(2))

    const assignTab = Array.from(document.querySelectorAll('.admin-tab')).find(
      el => el.textContent?.includes('Asignar tarea')
    ) as HTMLElement
    await user.click(assignTab)
    await waitFor(() => expect(screen.getByText('Nueva tarea')).toBeInTheDocument())

    // The form submit button (type=submit, not the tab button)
    const submitBtn = document.querySelector('button[type="submit"]') as HTMLElement
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Selecciona un trabajador')).toBeInTheDocument()
    })
  })

  it('muestra error si se intenta asignar sin título', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminTasks />, { auth: mockAuthAdmin })
    await waitFor(() => expect(document.querySelectorAll('.admin-tab').length).toBe(2))

    const assignTab = Array.from(document.querySelectorAll('.admin-tab')).find(
      el => el.textContent?.includes('Asignar tarea')
    ) as HTMLElement
    await user.click(assignTab)
    await waitFor(() => expect(screen.getByText('Nueva tarea')).toBeInTheDocument())

    // Select a worker chip
    await waitFor(() => {
      const chips = document.querySelectorAll('.assign-worker-chip')
      expect(chips.length).toBeGreaterThan(0)
    })
    await user.click(document.querySelectorAll('.assign-worker-chip')[0] as HTMLElement)

    const submitBtn = document.querySelector('button[type="submit"]') as HTMLElement
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('El título es obligatorio')).toBeInTheDocument()
    })
  })
})
