import React, { useContext } from 'react'
import { useLocation } from 'react-router-dom'
import { Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BoxDetail from './pages/BoxDetail'
import Profile from './pages/Profile'
import Welcome from './pages/Welcome'
import Admin from './pages/Admin'
import { AuthContext } from './context/AuthContext'

export default function App(){
  const auth = useContext(AuthContext)
  const location = useLocation()

  return (
    <div>
      <header className="py-2 px-4 border-b bg-white/60 backdrop-blur sticky top-0 z-10">
        <nav className="container flex items-center justify-between">
          <div className="nav-brand">
            <img src="/assets/logo.svg" alt="logo" className="logo" />
            <Link to="/" className="title">OnBoardingHub</Link>
          </div>
          <div className="space-x-3 flex items-center nav-actions">
            {auth && auth.isAuthenticating ? (
              <div className="text-sm text-gray-500">Comprobando sesión...</div>
            ) : auth && auth.user ? (
              <>
                {auth.user.role === 'ADMIN' && (
                  <Link to="/admin" className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">Panel IT</Link>
                )}
                <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Dashboard</Link>
                <Link to="/profile" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Perfil</Link>
                <button onClick={auth.logout} className="text-sm text-red-500 hover:text-red-600 transition-colors logout">Cerrar sesión</button>
              </>
            ) : (
              // hide nav links on welcome page to avoid duplication with welcome card
              location.pathname === '/' ? null : (
                // on /login show register only, on /register show login only, otherwise show both
                location.pathname === '/login' ? (
                  <Link to="/register" className="text-sm text-gray-600">Registro</Link>
                ) : location.pathname === '/register' ? (
                  <Link to="/login" className="text-sm text-gray-600">Login</Link>
                ) : (
                  <>
                    <Link to="/login" className="text-sm text-gray-600">Login</Link>
                    <Link to="/register" className="text-sm text-gray-600">Registro</Link>
                  </>
                )
              )
            )}
          </div>
        </nav>
      </header>
      <main className="container py-8">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/boxes/:id" element={<BoxDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  )
}
