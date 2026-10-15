import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth } from './cloudbase'

export type UserProfile = {
  uid: string
  email: string
  name: string
  avatar_url: string
  provider: string
} | null

/** The callback returned by signInWithOtp — verify with verifyOtp({ token }). */
export interface EmailVerificationInfo {
  verifyOtp: (params: { token: string }) => Promise<{ data?: unknown; error?: { message?: string } }>
}

type AuthContextType = {
  user: UserProfile
  loading: boolean
  signInWithGoogle: () => Promise<void>
  sendEmailCode: (email: string) => Promise<EmailVerificationInfo>
  signInWithEmail: (email: string, code: string, verificationInfo: EmailVerificationInfo) => Promise<void>
  signOut: () => Promise<void>
  applySession: (accessToken: string, refreshToken: string, oauthUser: UserProfile) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  sendEmailCode: async () => ({ verifyOtp: async () => ({}) }),
  signInWithEmail: async () => {},
  signOut: async () => {},
  applySession: async () => {},
})

const OAUTH_RELAY_BASE = import.meta.env.VITE_OAUTH_RELAY_URL

/** Fetch current user profile via v2 SDK auth.getUser(). Returns null if not logged in or anonymous. */
async function fetchUserProfile(): Promise<UserProfile> {
  try {
    const { data, error } = await auth.getUser()
    if (error || !data?.user) return null
    const user = data.user
    // Filter out anonymous sessions — SDK auto-creates them with accessKey
    const provider = user.app_metadata?.provider || 'unknown'
    if (provider === 'anonymous' || user.is_anonymous === true) return null
    if (!user.email) return null
    return {
      uid: user.id || '',
      email: user.email || '',
      name: user.user_metadata?.nickName || user.user_metadata?.name || '',
      avatar_url: user.user_metadata?.avatarUrl || '',
      provider,
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        setUser(await fetchUserProfile())
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const applySession = async (
    accessToken: string,
    refreshToken: string,
    oauthUser: UserProfile
  ) => {
    await auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    const profile = await fetchUserProfile()
    setUser(profile ?? oauthUser)
  }

  /** Google OAuth via the Genie OAuth Relay (redirect in normal mode, popup in iframe). */
  const signInWithGoogle = async () => {
    const isInIframe = window.self !== window.top
    const callbackUrl = isInIframe
      ? `${window.location.origin}/auth/callback?mode=popup`
      : `${window.location.origin}/auth/callback`

    const oauthUrl = `${OAUTH_RELAY_BASE}/authorize?provider=google&callback_url=${encodeURIComponent(callbackUrl)}`

    if (!isInIframe) {
      window.location.href = oauthUrl
      return
    }

    const popup = window.open(oauthUrl, 'oauth_popup', 'width=520,height=620,left=200,top=100')
    await new Promise<void>((resolve, reject) => {
      const handler = async (event: MessageEvent) => {
        if (event.data?.type !== 'oauth_callback') return
        window.removeEventListener('message', handler)
        clearInterval(checkClosed)
        try {
          const { access_token, refresh_token, user: oauthUser } = event.data
          await applySession(access_token, refresh_token, oauthUser)
          resolve()
        } catch (e) {
          reject(e)
        }
      }
      window.addEventListener('message', handler)
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          window.removeEventListener('message', handler)
          resolve()
        }
      }, 500)
    })
  }

  /**
   * Send an email verification code.
   * v2 signInWithOtp auto-registers new users, so it serves both register & login.
   */
  const sendEmailCode = async (email: string): Promise<EmailVerificationInfo> => {
    const { data, error } = await auth.signInWithOtp({ email })
    if (error) throw new Error(error.message || '验证码发送失败')
    return data as EmailVerificationInfo
  }

  /** Verify the emailed code and establish a session (login or auto-register). */
  const signInWithEmail = async (
    _email: string,
    code: string,
    verificationInfo: EmailVerificationInfo
  ) => {
    const { error } = await verificationInfo.verifyOtp({ token: code })
    if (error) throw new Error(error.message || '验证码校验失败')
    setUser(await fetchUserProfile())
  }

  const signOut = async () => {
    setUser(null)
    await auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, sendEmailCode, signInWithEmail, signOut, applySession }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
