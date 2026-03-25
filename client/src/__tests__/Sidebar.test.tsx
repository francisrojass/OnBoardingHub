import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, mockAuthEmployee, mockAuthAdmin, mockAuthSuperAdmin } from './helpers'
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

  // ─── Logo ───

  it('muestra el logo SVG de OnBoardingHub', () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    const logo = document.querySelector('img[alt="logo"]')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', '/assets/logo.svg')
  })

  it('muestra el texto "OnBoarding Hub" junto al logo', () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    expect(screen.getByText(/OnBoarding/i)).toBeInTheDocument()
  })

  // ─── Toggle ───

  it('se muestra correctamente cuando isOpen es true', () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    const aside = document.querySelector('aside.sidebar')
    expect(aside).not.toHaveStyle({ width: '0px' })
  })

  it('colapsa la sidebar cuando isOpen es false', () => {
    renderWithProviders(<Sidebar isOpen={false} />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    const aside = document.querySelector('aside.sidebar')
    expect(aside).toHaveStyle({ width: '0px' })
  })

  // ─── User info ───

  it('muestra las iniciales del usuario en el avatar', () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('muestra el nombre del usuario', () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('muestra el rol del usuario', () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    expect(screen.getByText('Employee')).toBeInTheDocument()
  })

  // ─── Employee nav ───

  it('muestra los items de navegación de empleado', () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Learning Hub/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Mis Tareas/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Mi Perfil/i })).toBeInTheDocument()
  })

  it('no muestra opciones de admin para empleados', () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    expect(screen.queryByRole('link', { name: /Gestión de Tareas/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Reportes/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Empresa/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Panel IT/i })).not.toBeInTheDocument()
  })

  // ─── Company Admin nav ───

  it('muestra las opciones de admin de empresa para administradores', () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthAdmin, initialRoute: '/dashboard' })
    expect(screen.getByRole('link', { name: /Gestión de Tareas/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Reportes/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Empresa/i })).toBeInTheDocument()
  })

  it('no muestra Panel IT para admin de empresa', () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthAdmin, initialRoute: '/dashboard' })
    expect(screen.queryByRole('link', { name: /Panel IT/i })).not.toBeInTheDocument()
  })

  it('muestra el badge "Admin" para administradores de empresa', () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthAdmin, initialRoute: '/dashboard' })
    const badge = document.querySelector('.sidebar-role-badge')
    expect(badge).toBeInTheDocument()
    expect(badge?.textContent).toContain('Admin')
  })

  it('no muestra el badge de Admin para empleados', () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    expect(document.querySelector('.sidebar-role-badge')).not.toBeInTheDocument()
  })

  // ─── Super Admin nav ───

  it('muestra el link "Panel IT" para Super Admin', () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthSuperAdmin, initialRoute: '/dashboard' })
    const panelLink = screen.getByRole('link', { name: /Panel IT/i })
    expect(panelLink).toBeInTheDocument()
    expect(panelLink).toHaveAttribute('href', '/admin')
  })

  it('no muestra opciones de admin de empresa para Super Admin', () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthSuperAdmin, initialRoute: '/dashboard' })
    expect(screen.queryByRole('link', { name: /Gestión de Tareas/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Reportes/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Empresa/i })).not.toBeInTheDocument()
  })

  it('muestra el badge "Super Admin" para super administradores', () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthSuperAdmin, initialRoute: '/dashboard' })
    const badge = document.querySelector('.sidebar-role-badge')
    expect(badge).toBeInTheDocument()
    expect(badge?.textContent).toContain('Super Admin')
  })

  // ─── Notifications ───

  it('muestra el enlace a Notifications', () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    expect(screen.getByRole('link', { name: /Notifications/i })).toBeInTheDocument()
  })

  it('no muestra el badge de notificaciones cuando unreadCount es 0', async () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    await waitFor(() => {
      expect(document.querySelector('.notif-count')).not.toBeInTheDocument()
    })
  })

  it('muestra el badge de notificaciones cuando hay sin leer', async () => {
    mockApi.get.mockResolvedValue({ data: { notifications: [], unreadCount: 5 } })
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    await waitFor(() => {
      expect(document.querySelector('.notif-count')).toBeInTheDocument()
      expect(document.querySelector('.notif-count')?.textContent).toBe('5')
    })
  })

  it('muestra "99+" cuando hay más de 99 notificaciones sin leer', async () => {
    mockApi.get.mockResolvedValue({ data: { notifications: [], unreadCount: 150 } })
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    await waitFor(() => {
      expect(document.querySelector('.notif-count')?.textContent).toBe('99+')
    })
  })

  // ─── Active state ───

  it('marca como activo el item de la ruta actual', () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthEmployee, initialRoute: '/tasks' })
    const tasksLink = screen.getByRole('link', { name: /Mis Tareas/i })
    expect(tasksLink).toHaveClass('active')
  })

  it('no marca como activo items de otras rutas', () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthEmployee, initialRoute: '/tasks' })
    const profileLink = screen.getByRole('link', { name: /Mi Perfil/i })
    expect(profileLink).not.toHaveClass('active')
  })

  // ─── Links ───

  it('el link de Mi Perfil apunta a /profile', () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    const profileLink = screen.getByRole('link', { name: /Mi Perfil/i })
    expect(profileLink).toHaveAttribute('href', '/profile')
  })

  it('el link de Learning Hub apunta a /learning-hub', () => {
    renderWithProviders(<Sidebar isOpen={true} />, { auth: mockAuthEmployee, initialRoute: '/dashboard' })
    const hubLink = screen.getByRole('link', { name: /Learning Hub/i })
    expect(hubLink).toHaveAttribute('href', '/learning-hub')
  })
})
