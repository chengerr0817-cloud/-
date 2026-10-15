import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import apiClient, { getStoredToken, setStoredToken } from './api-client'

export interface UserProfile {
  id: number
  username: string
  display_name: string | null
}

export type MaybeUser = UserProfile | null

type AuthContextType = {
  user: MaybeUser
  loading: boolean
  /** 是否已存在任何用户（false 时前端应引导注册首个账号） */
  hasUsers: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, displayName?: string) => Promise<void>
  signOut: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  hasUsers: true,
  login: async () => {},
  register: async () => {},
  signOut: () => {},
  refresh: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MaybeUser>(null)
  const [loading, setLoading] = useState(true)
  const [hasUsers, setHasUsers] = useState(true)

  /** 用本地 token 拉取当前用户。 */
  const refresh = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setUser(null)
      return
    }
    try {
      const { data } = await apiClient.get('/auth/me')
      setUser(data?.user ?? null)
    } catch {
      setStoredToken(null)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await apiClient.get('/auth/status')
        setHasUsers(!!data?.hasUsers)
      } catch {
        /* 后端未就绪时忽略 */
      }
      await refresh()
      setLoading(false)
    })()
  }, [refresh])

  const login = async (username: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', { username, password })
    setStoredToken(data.token)
    setUser(data.user)
  }

  const register = async (username: string, password: string, displayName?: string) => {
    const { data } = await apiClient.post('/auth/register', {
      username,
      password,
      display_name: displayName,
    })
    setStoredToken(data.token)
    setUser(data.user)
    setHasUsers(true)
  }

  const signOut = () => {
    setStoredToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, hasUsers, login, register, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
