import React from 'react'
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders, mockAuthUnauthenticated, mockAuthEmployee } from './helpers'
import Welcome from '../pages/Welcome'

describe('Welcome', () => {
  it('renderiza el título y subtítulo', () => {
    renderWithProviders(<Welcome />, { auth: mockAuthUnauthenticated })
    expect(screen.getByText(/Transforma el onboarding/i)).toBeInTheDocument()
    expect(screen.getByText(/Lanza entornos sandbox/i)).toBeInTheDocument()
  })

  it('muestra los botones de Iniciar sesión y Crear cuenta', () => {
    renderWithProviders(<Welcome />, { auth: mockAuthUnauthenticated })
    expect(screen.getByRole('link', { name: /Iniciar sesión/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Crear cuenta/i })).toBeInTheDocument()
  })

  it('muestra las feature pills', () => {
    renderWithProviders(<Welcome />, { auth: mockAuthUnauthenticated })
    expect(screen.getByText(/Sandboxes en segundos/i)).toBeInTheDocument()
    expect(screen.getByText(/Aprendizaje gamificado/i)).toBeInTheDocument()
    expect(screen.getByText(/Entornos aislados/i)).toBeInTheDocument()
    expect(screen.getByText(/Seguimiento de progreso/i)).toBeInTheDocument()
  })

  it('redirige al dashboard si ya está autenticado', () => {
    renderWithProviders(<Welcome />, { auth: mockAuthEmployee, initialRoute: '/' })
    // El componente renderiza <Navigate to="/dashboard" /> cuando hay token
    // No mostrará el título de Welcome
    expect(screen.queryByText(/Transforma el onboarding/i)).not.toBeInTheDocument()
  })
})
