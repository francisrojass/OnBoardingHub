import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, mockAuthEmployee, mockAuthAdmin } from './helpers'
import Sidebar from '../components/Sidebar'

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
  },
}))

import api from '../services/api'
const mockApi = api as any

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.get.mockResolvedValue({ data: { notifications: [], unreadCount: 0 } })
  })

  it('muestra el logo "OH" de OnBoardingHub', () => {
    renderWithProviders(<Sidebar />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    expect(screen.getByText('OH')).toBeInTheDocument()
  })

  it('muestra las iniciales del usuario en el avatar', () => {
    renderWithProviders(<Sidebar />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    expect(screen.getByText('JD')).toBeInTheDocument() // John Doe
  })

  it('muestra el nombre del usuario', () => {
    renderWithProviders(<Sidebar />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('muestra el rol del usuario', () => {
    renderWithProviders(<Sidebar />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    expect(screen.getByText('Employee')).toBeInTheDocument()
  })

  // ─── Employee nav ───

  it('muestra los items de navegación de empleado', () => {
    renderWithProviders(<Sidebar />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Learning Hub/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Mis Tareas/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Mi Perfil/i })).toBeInTheDocument()
  })

  it('no muestra opciones de admin para empleados', () => {
    renderWithProviders(<Sidebar />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    expect(screen.queryByRole('link', { name: /Gestión de Tareas/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Reportes/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Empresa/i })).not.toBeInTheDocument()
  })

  // ─── Admin nav ───

  it('muestra las opciones de admin para administradores', () => {
    renderWithProviders(<Sidebar />, { auth: mockAuthAdmin, initialRoute: '/dashboard' })
    expect(screen.getByRole('link', { name: /Gestión de Tareas/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Reportes/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Empresa/i })).toBeInTheDocument()
  })

  it('muestra el badge de Admin para administradores', () => {
    renderWithProviders(<Sidebar />, { auth: mockAuthAdmin, initialRoute: '/dashboard' })
    // The role badge specifically (different from the user-role text)
    expect(document.querySelector('.sidebar-role-badge')).toBeInTheDocument()
    expect(document.querySelector('.sidebar-role-badge')?.textContent).toContain('Admin')
  })

  it('no muestra el badge de Admin para empleados', () => {
    renderWithProviders(<Sidebar />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    expect(document.querySelector('.sidebar-role-badge')).not.toBeInTheDocument()
  })

  // ─── Notifications ───

  it('muestra el enlace a Notifications', () => {
    renderWithProviders(<Sidebar />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    expect(screen.getByRole('link', { name: /Notifications/i })).toBeInTheDocument()
  })

  it('no muestra el badge de notificaciones cuando unreadCount es 0', async () => {
    renderWithProviders(<Sidebar />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    await waitFor(() => {
      expect(document.querySelector('.notif-count')).not.toBeInTheDocument()
    })
  })

  it('muestra el badge de notificaciones cuando hay sin leer', async () => {
    mockApi.get.mockResolvedValue({ data: { notifications: [], unreadCount: 5 } })
    renderWithProviders(<Sidebar />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    await waitFor(() => {
      expect(document.querySelector('.notif-count')).toBeInTheDocument()
      expect(document.querySelector('.notif-count')?.textContent).toBe('5')
    })
  })

  it('muestra "99+" cuando hay más de 99 notificaciones sin leer', async () => {
    mockApi.get.mockResolvedValue({ data: { notifications: [], unreadCount: 150 } })
    renderWithProviders(<Sidebar />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    await waitFor(() => {
      expect(document.querySelector('.notif-count')?.textContent).toBe('99+')
    })
  })

  // ─── Active state ───

  it('marca como activo el item de la ruta actual', () => {
    renderWithProviders(<Sidebar />, { auth: mockAuthEmployee, initialRoute: '/tasks' })
    const tasksLink = screen.getByRole('link', { name: /Mis Tareas/i })
    expect(tasksLink).toHaveClass('active')
  })

  it('no marca como activo items de otras rutas', () => {
    renderWithProviders(<Sidebar />, { auth: mockAuthEmployee, initialRoute: '/tasks' })
    const profileLink = screen.getByRole('link', { name: /Mi Perfil/i })
    expect(profileLink).not.toHaveClass('active')
  })

  // ─── Links ───

  it('el link de Mi Perfil apunta a /profile', () => {
    renderWithProviders(<Sidebar />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    const profileLink = screen.getByRole('link', { name: /Mi Perfil/i })
    expect(profileLink).toHaveAttribute('href', '/profile')
  })

  it('el link de Learning Hub apunta a /learning-hub', () => {
    renderWithProviders(<Sidebar />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    const hubLink = screen.getByRole('link', { name: /Learning Hub/i })
    expect(hubLink).toHaveAttribute('href', '/learning-hub')
  })
})
