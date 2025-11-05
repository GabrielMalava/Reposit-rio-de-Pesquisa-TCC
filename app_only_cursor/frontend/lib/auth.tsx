'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from './api'
import toast from 'react-hot-toast'

interface User {
  id: number
  email: string
  name?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      if (token && userStr) {
        try {
          setUser(JSON.parse(userStr))
          setIsAuthenticated(true)
        } catch (e) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { access_token, user: userData } = response.data

      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      setIsAuthenticated(true)
      toast.success('Login realizado com sucesso!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao fazer login')
      throw error
    }
  }

  const register = async (email: string, password: string, name?: string) => {
    try {
      await api.post('/auth/register', { email, password, name })
      toast.success('Registro realizado com sucesso! Faça login para continuar.')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao registrar')
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
    toast.success('Logout realizado com sucesso!')
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


