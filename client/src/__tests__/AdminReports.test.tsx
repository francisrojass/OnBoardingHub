import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockAuthAdmin } from './helpers'
import AdminReports from '../pages/AdminReports'

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
  },
}))

import api from '../services/api'
const mockApi = api as any

const mockTeamData = {
  totalWorkers: 3,
  completedTasks: 8,
  totalTasks: 12,
  taskCompletionRate: 67,
  totalBoxesCompleted: 5,
  avgXp: 340,
  workers: [
    {
      id: 'w-1',
      name: 'Ana García',
      email: 'ana@acme.com',
      level: 2,
      xp: 650,
      completedTasks: 4,
      totalTasks: 6,
      taskProgress: 67,
      completedBoxes: 2,
    },
    {
      id: 'w-2',
      name: 'Carlos López',
      email: 'carlos@acme.com',
      level: 1,
      xp: 150,
      completedTasks: 1,
      totalTasks: 3,
      taskProgress: 33,
      completedBoxes: 1,
    },
  ],
}

const mockBoxStats = [
  {
    id: 'box-1',
    title: 'Git Basics',
    difficulty: 'BEGINNER',
    xpReward: 100,
    totalCompletions: 3,
    totalAttempts: 5,
  },
  {
    id: 'box-2',
    title: 'Docker Advanced',
    difficulty: 'ADVANCED',
    xpReward: 300,
    totalCompletions: 1,
    totalAttempts: 4,
  },
]

describe('AdminReports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/reports/team') return Promise.resolve({ data: mockTeamData })
      if (url === '/reports/boxes') return Promise.resolve({ data: mockBoxStats })
      return Promise.resolve({ data: {} })
    })
  })

  it('renderiza el encabezado "Reportes"', async () => {
    renderWithProviders(<AdminReports />, { auth: mockAuthAdmin })
    await waitFor(() => {
      expect(screen.getByText('Reportes')).toBeInTheDocument()
    })
  })

  it('muestra las tarjetas de estadísticas cuando carga teamData', async () => {
    renderWithProviders(<AdminReports />, { auth: mockAuthAdmin })
    await waitFor(() => {
      expect(screen.getByText('Empleados')).toBeInTheDocument()
      expect(screen.getByText('Tareas completadas')).toBeInTheDocument()
      expect(screen.getByText('Tasa de completado')).toBeInTheDocument()
      expect(screen.getByText('Boxes completados')).toBeInTheDocument()
      expect(screen.getByText('XP promedio')).toBeInTheDocument()
    })
  })

  it('muestra los valores correctos en las tarjetas de estadísticas', async () => {
    renderWithProviders(<AdminReports />, { auth: mockAuthAdmin })
    await waitFor(() => {
      expect(screen.getByText('8/12')).toBeInTheDocument() // completedTasks/totalTasks
      expect(screen.getAllByText(/67%/).length).toBeGreaterThan(0) // taskCompletionRate
      expect(screen.getByText('340')).toBeInTheDocument() // avgXp
    })
  })

  it('muestra las tabs Equipo y Boxes', async () => {
    renderWithProviders(<AdminReports />, { auth: mockAuthAdmin })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Equipo/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Boxes/i })).toBeInTheDocument()
    })
  })

  it('muestra la tab Equipo activa por defecto', async () => {
    renderWithProviders(<AdminReports />, { auth: mockAuthAdmin })
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument()
      expect(screen.getByText('Carlos López')).toBeInTheDocument()
    })
  })

  // ─── Tab clicks ───

  it('cambia a la tab "Boxes" al hacer clic', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminReports />, { auth: mockAuthAdmin })
    await waitFor(() => expect(screen.getByRole('button', { name: /Boxes/i })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Boxes/i }))

    await waitFor(() => {
      expect(screen.getByText('Git Basics')).toBeInTheDocument()
      expect(screen.getByText('Docker Advanced')).toBeInTheDocument()
    })
  })

  it('muestra datos de boxes en la tab Boxes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminReports />, { auth: mockAuthAdmin })
    await waitFor(() => expect(screen.getByRole('button', { name: /Boxes/i })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Boxes/i }))

    await waitFor(() => {
      expect(screen.getByText('Git Basics')).toBeInTheDocument()
      expect(screen.getByText(/3 completados/i)).toBeInTheDocument()
      expect(screen.getByText(/5 intentos/i)).toBeInTheDocument()
    })
  })

  it('vuelve a la tab Equipo al hacer clic en ella después de ir a Boxes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminReports />, { auth: mockAuthAdmin })
    await waitFor(() => expect(screen.getByRole('button', { name: /Boxes/i })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Boxes/i }))
    await waitFor(() => expect(screen.getByText('Git Basics')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Equipo/i }))

    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument()
      expect(screen.queryByText('Git Basics')).not.toBeInTheDocument()
    })
  })

  it('muestra el progreso de los trabajadores en la tab Equipo', async () => {
    renderWithProviders(<AdminReports />, { auth: mockAuthAdmin })
    await waitFor(() => {
      expect(screen.getByText('Tareas: 4/6')).toBeInTheDocument()
      expect(screen.getByText('Tareas: 1/3')).toBeInTheDocument()
    })
  })

  it('muestra XP de los trabajadores', async () => {
    renderWithProviders(<AdminReports />, { auth: mockAuthAdmin })
    await waitFor(() => {
      expect(screen.getByText('650')).toBeInTheDocument()
      expect(screen.getByText('150')).toBeInTheDocument()
    })
  })

  it('muestra mensaje vacío en Equipo si no hay workers', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/reports/team') return Promise.resolve({ data: { ...mockTeamData, workers: [] } })
      if (url === '/reports/boxes') return Promise.resolve({ data: mockBoxStats })
      return Promise.resolve({ data: {} })
    })
    renderWithProviders(<AdminReports />, { auth: mockAuthAdmin })
    await waitFor(() => {
      expect(screen.getByText('Sin empleados')).toBeInTheDocument()
    })
  })

  it('muestra mensaje vacío en Boxes si no hay boxes', async () => {
    const user = userEvent.setup()
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/reports/team') return Promise.resolve({ data: mockTeamData })
      if (url === '/reports/boxes') return Promise.resolve({ data: [] })
      return Promise.resolve({ data: {} })
    })
    renderWithProviders(<AdminReports />, { auth: mockAuthAdmin })
    await waitFor(() => expect(screen.getByRole('button', { name: /Boxes/i })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Boxes/i }))

    await waitFor(() => {
      expect(screen.getByText('Sin boxes')).toBeInTheDocument()
    })
  })
})
