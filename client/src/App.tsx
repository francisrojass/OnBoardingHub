import React, { useContext, useState } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthContext } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import BoxDetail from './pages/BoxDetail'
import Profile from './pages/Profile'
import Tasks from './pages/Tasks'
import AdminTasks from './pages/AdminTasks'
import LearningHub from './pages/LearningHub'
import Notifications from './pages/Notifications'
import AdminReports from './pages/AdminReports'
import CompanySettings from './pages/CompanySettings'
import Admin from './pages/Admin'
import Login from './pages/Login'
import Register from './pages/Register'
import Welcome from './pages/Welcome'

function AuthLayout() {
  const auth = useContext(AuthContext)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (!auth) return null
  if (auth.isAuthenticating) return <div className="loading-screen">Cargando...</div>
  if (!auth.token) return <Navigate to="/" replace />

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} />
      <div className="main-wrapper">
        <header className="topbar">
          <button
            className="topbar-menu-btn"
            aria-label="Toggle menu"
            onClick={() => setSidebarOpen(s => !s)}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const auth = useContext(AuthContext)
  if (auth?.isAuthenticating) return <div className="loading-screen">Cargando...</div>

  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<AuthLayout />}>
        {/* Employee routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/boxes/:id" element={<BoxDetail />} />
        <Route path="/learning-hub" element={<LearningHub />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        {/* Company Admin routes */}
        <Route path="/admin/tasks" element={<AdminTasks />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/company" element={<CompanySettings />} />
        {/* Super Admin (IT OnBoardingHub) routes */}
        <Route path="/admin" element={<Admin />} />
      </Route>
    </Routes>
  )
}
