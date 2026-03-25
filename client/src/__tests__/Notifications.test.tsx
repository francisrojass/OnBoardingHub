import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockAuthEmployee } from './helpers'
import Notifications from '../pages/Notifications'

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
  },
}))

import api from '../services/api'
const mockApi = api as any

const mockNotifications = [
  {
    id: 'n-1',
    type: 'SUCCESS',
    title: 'Bienvenido al equipo',
    message: 'Tu cuenta ha sido creada exitosamente',
    read: false,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(), // 5 min ago
  },
  {
    id: 'n-2',
    type: 'XP_GAINED',
    title: '¡XP Ganado!',
    message: 'Ganaste 100 XP por completar una tarea',
    read: false,
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(), // 1 hr ago
  },
  {
    id: 'n-3',
    type: 'BOX_COMPLETED',
    title: 'Box completado',
    message: 'Completaste Git Basics',
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(), // 1 day ago
  },
  {
    id: 'n-4',
    type: 'TASK_ASSIGNED',
    title: 'Nueva tarea asignada',
    message: 'Se te ha asignado la tarea: Configurar entorno',
    read: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(), // 2 days ago
  },
]

describe('Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.get.mockResolvedValue({
      data: { notifications: mockNotifications, unreadCount: 3 },
    })
    mockApi.patch.mockResolvedValue({ data: {} })
    mockApi.delete.mockResolvedValue({ data: {} })
  })

  it('renderiza el encabezado "Notificaciones"', async () => {
    renderWithProviders(<Notifications />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('Notificaciones')).toBeInTheDocument()
    })
  })

  it('muestra el contador de notificaciones sin leer', async () => {
    renderWithProviders(<Notifications />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('3 sin leer')).toBeInTheDocument()
    })
  })

  it('muestra todas las notificaciones', async () => {
    renderWithProviders(<Notifications />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('Bienvenido al equipo')).toBeInTheDocument()
      expect(screen.getByText('¡XP Ganado!')).toBeInTheDocument()
      expect(screen.getByText('Box completado')).toBeInTheDocument()
      expect(screen.getByText('Nueva tarea asignada')).toBeInTheDocument()
    })
  })

  it('muestra la etiqueta NUEVO en notificaciones sin leer', async () => {
    renderWithProviders(<Notifications />, { auth: mockAuthEmployee })
    await waitFor(() => {
      const nuevoBadges = screen.getAllByText('NUEVO')
      expect(nuevoBadges.length).toBe(3) // 3 unread
    })
  })

  it('muestra el botón "Marcar todas como leídas" cuando hay sin leer', async () => {
    renderWithProviders(<Notifications />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Marcar todas como leídas/i })).toBeInTheDocument()
    })
  })

  it('NO muestra el botón de marcar todas si todo está leído', async () => {
    mockApi.get.mockResolvedValue({
      data: { notifications: [{ ...mockNotifications[2] }], unreadCount: 0 },
    })
    renderWithProviders(<Notifications />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Marcar todas como leídas/i })).not.toBeInTheDocument()
    })
  })

  it('muestra "Todo al día" cuando no hay sin leer', async () => {
    mockApi.get.mockResolvedValue({
      data: { notifications: [{ ...mockNotifications[2] }], unreadCount: 0 },
    })
    renderWithProviders(<Notifications />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('Todo al día')).toBeInTheDocument()
    })
  })

  it('llama a la API al hacer clic en una notificación sin leer', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Notifications />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByText('Bienvenido al equipo')).toBeInTheDocument())

    await user.click(screen.getByText('Bienvenido al equipo'))

    await waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith('/notifications/n-1/read')
    })
  })

  it('no llama a la API al hacer clic en una notificación ya leída', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Notifications />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByText('Box completado')).toBeInTheDocument())

    await user.click(screen.getByText('Box completado'))
    expect(mockApi.patch).not.toHaveBeenCalled()
  })

  it('llama a la API para marcar todas como leídas', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Notifications />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByRole('button', { name: /Marcar todas como leídas/i })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Marcar todas como leídas/i }))

    await waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith('/notifications/read-all')
    })
  })

  it('llama a la API para eliminar una notificación', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Notifications />, { auth: mockAuthEmployee })
    await waitFor(() => expect(screen.getByText('Bienvenido al equipo')).toBeInTheDocument())

    // Hace clic en el botón de eliminar (X) de la primera notificación
    const deleteButtons = document.querySelectorAll('button[title="Eliminar"]')
    expect(deleteButtons.length).toBeGreaterThan(0)
    await user.click(deleteButtons[0] as HTMLElement)

    await waitFor(() => {
      expect(mockApi.delete).toHaveBeenCalledWith(expect.stringContaining('/notifications/'))
    })
  })

  it('muestra el estado de carga inicial', () => {
    mockApi.get.mockImplementation(() => new Promise(() => {}))
    renderWithProviders(<Notifications />, { auth: mockAuthEmployee })
    expect(screen.getByText(/Cargando notificaciones/i)).toBeInTheDocument()
  })

  it('muestra estado vacío cuando no hay notificaciones', async () => {
    mockApi.get.mockResolvedValue({ data: { notifications: [], unreadCount: 0 } })
    renderWithProviders(<Notifications />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText('Sin notificaciones')).toBeInTheDocument()
    })
  })

  it('muestra el tiempo de las notificaciones', async () => {
    renderWithProviders(<Notifications />, { auth: mockAuthEmployee })
    await waitFor(() => {
      expect(screen.getByText(/Hace 5m/i)).toBeInTheDocument()
    })
  })
})
