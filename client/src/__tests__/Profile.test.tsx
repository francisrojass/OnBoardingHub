import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockAuthEmployee, mockAuthAdmin } from './helpers'
import Profile from '../pages/Profile'

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
  },
}))

import api from '../services/api'
const mockApi = api as any

const mockProfile = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@test.com',
  role: 'EMPLOYEE',
  xp: 350,
  level: 1,
  company: { id: 'company-1', name: 'Acme Corp' },
}

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.get.mockResolvedValue({ data: mockProfile })
    mockApi.put.mockResolvedValue({ data: { ...mockProfile, name: 'John Updated' } })
  })

  it('muestra el estado de carga inicialmente', () => {
    mockApi.get.mockImplementation(() => new Promise(() => {}))
    renderWithProviders(<Profile />, { auth: mockAuthEmployee })
    expect(screen.getByText(/Cargando perfil/i)).toBeInTheDocument()
  })

  it('renderiza el encabezado "Mi Perfil"', async () => {
    renderWithProviders(<Profile />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('Mi Perfil')).toBeInTheDocument()
    })
  })

  it('muestra el nombre del usuario', async () => {
    renderWithProviders(<Profile />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0)
    })
  })

  it('muestra el email del usuario (deshabilitado)', async () => {
    renderWithProviders(<Profile />, { auth: mockAuthEmployee })
    await waitFor(() => {
      const emailInput = screen.getAllByDisplayValue('john@test.com')[0]
      expect(emailInput).toBeDisabled()
    })
  })

  it('muestra el rol del usuario (deshabilitado)', async () => {
    renderWithProviders(<Profile />, { auth: mockAuthEmployee })
    await waitFor(() => {
      const roleInput = screen.getByDisplayValue('Employee')
      expect(roleInput).toBeDisabled()
    })
  })

  it('muestra la empresa del usuario', async () => {
    renderWithProviders(<Profile />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })
  })

  it('muestra el nivel correcto en la barra de XP', async () => {
    renderWithProviders(<Profile />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('Level 1')).toBeInTheDocument()
    })
  })

  it('muestra el XP total correcto', async () => {
    renderWithProviders(<Profile />, { auth: mockAuthEmployee })
    await waitFor(() => {
      // 350 XP total, level 1 → levelXp = 350 % 500 = 350
      expect(screen.getByText(/350 \/ 500 XP/)).toBeInTheDocument()
    })
  })

  it('muestra el badge de Employee', async () => {
    renderWithProviders(<Profile />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText(/👤 Employee/i)).toBeInTheDocument()
    })
  })

  it('muestra el badge de Admin para admins', async () => {
    mockApi.get.mockResolvedValue({ data: { ...mockProfile, role: 'ADMIN' } })
    renderWithProviders(<Profile />, { auth: mockAuthAdmin })
    await waitFor(() => {
      expect(screen.getByText(/👑 Admin/i)).toBeInTheDocument()
    })
  })

  it('permite editar el nombre', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Profile />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument())

    const nameInput = screen.getByDisplayValue('John Doe')
    await user.clear(nameInput)
    await user.type(nameInput, 'John Updated')

    expect(nameInput).toHaveValue('John Updated')
  })

  it('llama a la API al hacer clic en "Guardar cambios"', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Profile />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByRole('button', { name: /Guardar cambios/i })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }))

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith('/users/profile', { name: 'John Doe' })
    })
  })

  it('muestra mensaje de éxito después de guardar', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Profile />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByRole('button', { name: /Guardar cambios/i })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }))

    await waitFor(() => {
      expect(screen.getByText('Perfil guardado correctamente')).toBeInTheDocument()
    })
  })

  it('muestra mensaje de error si la API falla', async () => {
    const user = userEvent.setup()
    mockApi.put.mockRejectedValue({ response: { data: { message: 'Error del servidor' } } })
    renderWithProviders(<Profile />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByRole('button', { name: /Guardar cambios/i })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }))

    await waitFor(() => {
      expect(screen.getByText('Error del servidor')).toBeInTheDocument()
    })
  })

  it('llama a auth.logout al hacer clic en "Cerrar sesión"', async () => {
    const user = userEvent.setup()
    const mockAuth = { ...mockAuthEmployee, logout: vi.fn() }
    renderWithProviders(<Profile />, { auth: mockAuth })
    await waitFor(() => expect(screen.getByRole('button', { name: /Cerrar sesión/i })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Cerrar sesión/i }))

    expect(mockAuth.logout).toHaveBeenCalled()
  })

  it('deshabilita el botón mientras guarda', async () => {
    const user = userEvent.setup()
    mockApi.put.mockImplementation(() => new Promise(() => {}))
    renderWithProviders(<Profile />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByRole('button', { name: /Guardar cambios/i })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }))

    await waitFor(() => {
      expect(screen.getByText('Guardando...')).toBeInTheDocument()
    })
  })
})
