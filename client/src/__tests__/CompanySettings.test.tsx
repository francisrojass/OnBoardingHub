import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, mockAuthAdmin } from './helpers'
import CompanySettings from '../pages/CompanySettings'

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
  },
}))

import api from '../services/api'
const mockApi = api as any

const mockTeamData = {
  totalWorkers: 2,
  completedTasks: 5,
  totalTasks: 10,
  taskCompletionRate: 50,
  totalBoxesCompleted: 3,
  avgXp: 250,
  workers: [
    {
      id: 'w-1',
      name: 'Ana García',
      email: 'ana@acme.com',
      level: 2,
      xp: 650,
    },
    {
      id: 'w-2',
      name: 'Carlos López',
      email: 'carlos@acme.com',
      level: 1,
      xp: 150,
    },
  ],
}

describe('CompanySettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.get.mockResolvedValue({ data: mockTeamData })
  })

  it('renderiza el encabezado "Configuración de Empresa"', async () => {
    renderWithProviders(<CompanySettings />, { auth: mockAuthAdmin })
    await waitFor(() => {
      expect(screen.getByText('Configuración de Empresa')).toBeInTheDocument()
    })
  })

  it('muestra el nombre de la empresa del usuario admin', async () => {
    renderWithProviders(<CompanySettings />, { auth: mockAuthAdmin })
    await waitFor(() => {
      // El admin user no tiene empresa en el mock, usará el fallback 'Mi Empresa'
      expect(screen.getByText(/Mi Empresa|Acme Corp/i)).toBeInTheDocument()
    })
  })

  it('muestra las estadísticas de la empresa', async () => {
    renderWithProviders(<CompanySettings />, { auth: mockAuthAdmin })
    await waitFor(() => {
      expect(screen.getByText('Total empleados')).toBeInTheDocument()
      expect(screen.getByText('Tareas completadas')).toBeInTheDocument()
      expect(screen.getByText('Tasa de completado')).toBeInTheDocument()
      expect(screen.getByText('Boxes completados')).toBeInTheDocument()
      expect(screen.getByText('XP promedio del equipo')).toBeInTheDocument()
    })
  })

  it('muestra los valores correctos de las estadísticas', async () => {
    renderWithProviders(<CompanySettings />, { auth: mockAuthAdmin })
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument() // totalWorkers
      expect(screen.getByText('5/10')).toBeInTheDocument() // completedTasks/totalTasks
      expect(screen.getByText('50%')).toBeInTheDocument() // taskCompletionRate
      expect(screen.getByText('3')).toBeInTheDocument() // totalBoxesCompleted
    })
  })

  it('muestra la lista de miembros del equipo', async () => {
    renderWithProviders(<CompanySettings />, { auth: mockAuthAdmin })
    await waitFor(() => {
      expect(screen.getByText('Miembros del equipo')).toBeInTheDocument()
      expect(screen.getByText('Ana García')).toBeInTheDocument()
      expect(screen.getByText('Carlos López')).toBeInTheDocument()
    })
  })

  it('muestra emails y niveles de los miembros', async () => {
    renderWithProviders(<CompanySettings />, { auth: mockAuthAdmin })
    await waitFor(() => {
      expect(screen.getByText('ana@acme.com')).toBeInTheDocument()
      expect(screen.getByText('carlos@acme.com')).toBeInTheDocument()
      expect(screen.getByText('Lv.2')).toBeInTheDocument()
      expect(screen.getByText('Lv.1')).toBeInTheDocument()
    })
  })

  it('muestra el estado de carga mientras se obtienen datos', async () => {
    mockApi.get.mockImplementation(() => new Promise(() => {}))
    renderWithProviders(<CompanySettings />, { auth: mockAuthAdmin })
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('muestra mensaje vacío si no hay trabajadores', async () => {
    mockApi.get.mockResolvedValue({ data: { ...mockTeamData, workers: [] } })
    renderWithProviders(<CompanySettings />, { auth: mockAuthAdmin })
    await waitFor(() => {
      expect(screen.getByText('Sin empleados registrados')).toBeInTheDocument()
    })
  })
})
