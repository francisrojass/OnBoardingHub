import React, { useContext } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function Welcome(){
  const auth = useContext(AuthContext)
  if (auth && auth.token) return <Navigate to="/dashboard" replace />
  return (
    <div className="max-w-3xl mx-auto text-center mt-20">
      <div className="card p-12">
        <h1 className="text-3xl font-semibold mb-2">Bienvenido a OnBoardingHub</h1>
        <p className="text-gray-600 mb-6">Lanza entornos simulados (sandboxes) para formación y pruebas.</p>
        <div className="flex justify-center gap-4">
          <Link to="/login" className="px-5 py-2 bg-blue-600 text-white rounded">Iniciar sesión</Link>
          <Link to="/register" className="px-5 py-2 bg-white border rounded">Crear cuenta</Link>
        </div>
      </div>
    </div>
  )
}
