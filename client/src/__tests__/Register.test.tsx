import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockAuthUnauthenticated, mockAuthEmployee } from './helpers'
import Register from '../pages/Register'

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
  },
}))

import api from '../services/api'
const mockApi = api as any

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza el formulario de registro', () => {
    renderWithProviders(<Register />, { auth: mockAuthUnauthenticated })
    expect(screen.getByRole('heading', { name: /Crear cuenta/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Nombre completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Empresa/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument()
  })

  it('muestra el link a login', () => {
    renderWithProviders(<Register />, { auth: mockAuthUnauthenticated })
    expect(screen.getByRole('link', { name: /Iniciar sesión/i })).toBeInTheDocument()
  })

  it('actualiza todos los campos al escribir', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Register />, { auth: mockAuthUnauthenticated })

    await user.type(screen.getByLabelText(/Nombre completo/i), 'Martin Smith')
    await user.type(screen.getByLabelText(/Empresa/i), 'Acme Corp')
    await user.type(screen.getByLabelText(/Email/i), 'martin@acme.com')
    await user.type(screen.getByLabelText(/Contraseña/i), 'password123')

    expect(screen.getByLabelText(/Nombre completo/i)).toHaveValue('Martin Smith')
    expect(screen.getByLabelText(/Empresa/i)).toHaveValue('Acme Corp')
    expect(screen.getByLabelText(/Email/i)).toHaveValue('martin@acme.com')
    expect(screen.getByLabelText(/Contraseña/i)).toHaveValue('password123')
  })

  it('llama a la API de registro y luego a login al enviar', async () => {
    const user = userEvent.setup()
    const mockAuth = {
      ...mockAuthUnauthenticated,
      login: vi.fn().mockResolvedValue(undefined),
    }
    mockApi.post.mockResolvedValue({ data: {} })
    renderWithProviders(<Register />, { auth: mockAuth })

    fireEvent.change(screen.getByLabelText(/Nombre completo/i), { target: { value: 'Martin Smith' } })
    fireEvent.change(screen.getByLabelText(/Empresa/i), { target: { value: 'Acme Corp' } })
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'martin@acme.com' } })
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /Crear cuenta/i }))

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/auth/register', {
        email: 'martin@acme.com',
        password: 'password123',
        name: 'Martin Smith',
        companyName: 'Acme Corp',
      })
    })
    await waitFor(() => {
      expect(mockAuth.login).toHaveBeenCalledWith('martin@acme.com', 'password123')
    })
  })

  it('muestra error cuando la API falla', async () => {
    const user = userEvent.setup()
    mockApi.post.mockRejectedValue({
      response: { data: { message: 'El email ya existe' } },
    })
    renderWithProviders(<Register />, { auth: mockAuthUnauthenticated })

    await user.type(screen.getByLabelText(/Nombre completo/i), 'Martin Smith')
    await user.type(screen.getByLabelText(/Empresa/i), 'Acme Corp')
    await user.type(screen.getByLabelText(/Email/i), 'existing@acme.com')
    await user.type(screen.getByLabelText(/Contraseña/i), 'password123')
    await user.click(screen.getByRole('button', { name: /Crear cuenta/i }))

    await waitFor(() => {
      expect(screen.getByText('El email ya existe')).toBeInTheDocument()
    })
  })

  it('deshabilita el botón durante el submit', async () => {
    const user = userEvent.setup()
    mockApi.post.mockImplementation(() => new Promise(() => {}))
    renderWithProviders(<Register />, { auth: mockAuthUnauthenticated })

    await user.type(screen.getByLabelText(/Nombre completo/i), 'Martin Smith')
    await user.type(screen.getByLabelText(/Empresa/i), 'Acme Corp')
    await user.type(screen.getByLabelText(/Email/i), 'martin@acme.com')
    await user.type(screen.getByLabelText(/Contraseña/i), 'password123')
    await user.click(screen.getByRole('button', { name: /Crear cuenta/i }))

    await waitFor(() => {
      expect(screen.getByText('Creando cuenta...')).toBeInTheDocument()
    })
  })

  it('redirige al dashboard si ya está autenticado', () => {
    renderWithProviders(<Register />, { auth: mockAuthEmployee })
    expect(screen.queryByRole('heading', { name: /Crear cuenta/i })).not.toBeInTheDocument()
  })
})
