import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockAuthUnauthenticated, mockAuthEmployee } from './helpers'
import Login from '../pages/Login'

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza el formulario de login', () => {
    renderWithProviders(<Login />, { auth: mockAuthUnauthenticated })
    expect(screen.getByText('Bienvenido de nuevo')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Iniciar sesión/i })).toBeInTheDocument()
  })

  it('muestra el link a registro', () => {
    renderWithProviders(<Login />, { auth: mockAuthUnauthenticated })
    expect(screen.getByRole('link', { name: /Crear cuenta/i })).toBeInTheDocument()
  })

  it('actualiza el campo de email al escribir', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Login />, { auth: mockAuthUnauthenticated })
    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'test@example.com')
    expect(emailInput).toHaveValue('test@example.com')
  })

  it('actualiza el campo de contraseña al escribir', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Login />, { auth: mockAuthUnauthenticated })
    const passwordInput = screen.getByLabelText(/contraseña/i)
    await user.type(passwordInput, 'secret123')
    expect(passwordInput).toHaveValue('secret123')
  })

  it('llama a auth.login al enviar el formulario con credenciales', async () => {
    const user = userEvent.setup()
    const mockAuth = {
      ...mockAuthUnauthenticated,
      login: vi.fn().mockResolvedValue(undefined),
    }
    renderWithProviders(<Login />, { auth: mockAuth })

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }))

    await waitFor(() => {
      expect(mockAuth.login).toHaveBeenCalledWith('test@example.com', 'secret123')
    })
  })

  it('muestra error cuando auth.login falla', async () => {
    const user = userEvent.setup()
    const mockAuth = {
      ...mockAuthUnauthenticated,
      login: vi.fn().mockRejectedValue(new Error('Credenciales incorrectas')),
    }
    renderWithProviders(<Login />, { auth: mockAuth })

    await user.type(screen.getByLabelText(/email/i), 'bad@example.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }))

    await waitFor(() => {
      expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument()
    })
  })

  it('muestra "Entrando..." mientras está cargando', async () => {
    const user = userEvent.setup()
    const mockAuth = {
      ...mockAuthUnauthenticated,
      login: vi.fn().mockImplementation(() => new Promise(() => {})), // never resolves
    }
    renderWithProviders(<Login />, { auth: mockAuth })

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }))

    await waitFor(() => {
      expect(screen.getByText('Entrando...')).toBeInTheDocument()
    })
  })

  it('redirige al dashboard si ya está autenticado', () => {
    renderWithProviders(<Login />, { auth: mockAuthEmployee })
    expect(screen.queryByText('Bienvenido de nuevo')).not.toBeInTheDocument()
  })
})
