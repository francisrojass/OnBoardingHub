import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '../context/AuthContext'
import { vi } from 'vitest'

export const mockUser = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@test.com',
  role: 'EMPLOYEE' as const,
  xp: 350,
  level: 1,
  company: { id: 'company-1', name: 'Acme Corp' },
}

export const mockAdminUser = {
  ...mockUser,
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@test.com',
  role: 'ADMIN' as const,
}

export const mockSuperAdminUser = {
  ...mockUser,
  id: 'superadmin-1',
  name: 'Super Admin',
  email: 'superadmin@test.com',
  role: 'SUPER_ADMIN' as const,
}

export const mockAuthEmployee = {
  token: 'test-token',
  user: mockUser,
  login: vi.fn(),
  logout: vi.fn(),
  isAuthenticating: false,
  updateUser: vi.fn(),
}

export const mockAuthAdmin = {
  ...mockAuthEmployee,
  user: mockAdminUser,
}

export const mockAuthSuperAdmin = {
  ...mockAuthEmployee,
  user: mockSuperAdminUser,
}

export const mockAuthUnauthenticated = {
  token: null,
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  isAuthenticating: false,
  updateUser: vi.fn(),
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, cacheTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  })
}

interface RenderOptions2 extends Omit<RenderOptions, 'wrapper'> {
  auth?: typeof mockAuthEmployee | typeof mockAuthAdmin | typeof mockAuthSuperAdmin | typeof mockAuthUnauthenticated
  initialRoute?: string
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    auth = mockAuthEmployee,
    initialRoute = '/',
    ...renderOptions
  }: RenderOptions2 = {}
) {
  const queryClient = createTestQueryClient()

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialRoute]}>
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={auth as any}>
            {children}
          </AuthContext.Provider>
        </QueryClientProvider>
      </MemoryRouter>
    )
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient }
}
