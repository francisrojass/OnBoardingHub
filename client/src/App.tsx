import React, { useContext } from 'react'
import { useLocation } from 'react-router-dom'
import { Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BoxDetail from './pages/BoxDetail'
import Profile from './pages/Profile'
import Welcome from './pages/Welcome'
import { AuthContext } from './context/AuthContext'

export default function App(){
  const auth = useContext(AuthContext)
  const location = useLocation()

  return (
    <div>
      <header className="p-4 border-b bg-white/60 backdrop-blur sticky top-0 z-10">
        <nav className="container flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold">OnBoardingHub</Link>
          <div className="space-x-3">
            {auth && auth.user ? (
              <>
                <Link to="/dashboard" className="text-sm text-gray-600">Dashboard</Link>
                <Link to="/profile" className="text-sm text-gray-600">Perfil</Link>
                <button onClick={auth.logout} className="text-sm text-red-500">Cerrar sesión</button>
              </>
            ) : (
              // hide nav links on welcome page to avoid duplication with welcome card
              location.pathname === '/' ? null : (
                <>
                  <Link to="/login" className="text-sm text-gray-600">Login</Link>
                  <Link to="/register" className="text-sm text-gray-600">Register</Link>
                </>
              )
            )}
          </div>
        </nav>
      </header>
      <main className="container py-8">
        <Routes>
          <Route path="/" element={<Welcome />} />
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
