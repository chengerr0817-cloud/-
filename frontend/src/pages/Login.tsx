import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Loader2, Mail, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth, type EmailVerificationInfo } from '@/lib/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FadeIn } from '@/components/MotionPrimitives'

/** Simple Google "G" mark (Brand icons are not in lucide). */
function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 13.9-5.4l-6.4-5.4C29.3 34.7 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.4 5.4C41.6 35.5 44 30.1 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { signInWithGoogle, sendEmailCode, signInWithEmail } = useAuth()

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [verificationInfo, setVerificationInfo] = useState<EmailVerificationInfo | null>(null)
  const [stage, setStage] = useState<'email' | 'code'>('email')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('请输入有效的邮箱地址')
      return
    }
    setSending(true)
    try {
      const info = await sendEmailCode(email)
      setVerificationInfo(info)
      setStage('code')
      toast.success('验证码已发送，请查收邮箱')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '验证码发送失败')
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.trim().length < 4) {
      toast.error('请输入完整的验证码')
      return
    }
    if (!verificationInfo) {
      toast.error('验证会话已失效，请重新发送验证码')
      setStage('email')
      return
    }
    setVerifying(true)
    try {
      await signInWithEmail(email, code.trim(), verificationInfo)
      toast.success('登录成功，欢迎回来！')
      navigate('/')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '验证失败，请检查验证码')
    } finally {
      setVerifying(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Google 登录失败')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center" style={{ padding: 'var(--spacing-3xl) 1rem', minHeight: '78vh' }}>
      <FadeIn>
        <div
          className="w-full rounded-2xl border border-border bg-card shadow-lg"
          style={{ padding: 'var(--spacing-2xl)', maxWidth: '26rem' }}
        >
          {/* Header */}
          <div className="flex flex-col items-center text-center" style={{ marginBottom: 'var(--spacing-xl)' }}>
            <span
              className="flex items-center justify-center rounded-xl bg-primary text-primary-foreground"
              style={{ width: '3rem', height: '3rem', marginBottom: 'var(--spacing-md)' }}
            >
              <BookOpen size={24} strokeWidth={2.2} />
            </span>
            <h1 className="font-serif font-bold" style={{ fontSize: '1.6rem' }}>
              欢迎回到墨迹
            </h1>
            <p className="text-sm text-muted-foreground" style={{ marginTop: '0.3rem' }}>
              登录后即可发布与管理你的文章
            </p>
          </div>

          {/* Email OTP form */}
          {stage === 'email' ? (
            <form onSubmit={handleSendCode} className="flex flex-col" style={{ gap: 'var(--spacing-md)' }}>
              <div className="flex flex-col" style={{ gap: 'var(--spacing-xs)' }}>
                <Label htmlFor="email">邮箱地址</Label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '2.3rem' }}
                  />
                </div>
              </div>
              <Button type="submit" disabled={sending} style={{ gap: 'var(--spacing-xs)' }}>
                {sending ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                {sending ? '发送中…' : '发送验证码'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="flex flex-col" style={{ gap: 'var(--spacing-md)' }}>
              <div className="flex flex-col" style={{ gap: 'var(--spacing-xs)' }}>
                <Label htmlFor="code">验证码</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="请输入 6 位验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  className="text-center tracking-[0.5em] font-medium"
                />
                <p className="text-xs text-muted-foreground">
                  验证码已发送至 <span className="text-foreground">{email}</span>
                </p>
              </div>
              <Button type="submit" disabled={verifying} style={{ gap: 'var(--spacing-xs)' }}>
                {verifying && <Loader2 size={16} className="animate-spin" />}
                {verifying ? '验证中…' : '登录 / 注册'}
              </Button>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                onClick={() => {
                  setStage('email')
                  setCode('')
                }}
              >
                更换邮箱
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center" style={{ gap: 'var(--spacing-sm)', margin: 'var(--spacing-lg) 0' }}>
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">或</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Google */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={googleLoading}
            onClick={handleGoogle}
            style={{ gap: 'var(--spacing-xs)' }}
          >
            {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
            使用 Google 账号登录
          </Button>

          <p className="text-center text-xs text-muted-foreground" style={{ marginTop: 'var(--spacing-lg)', lineHeight: 1.7 }}>
            首次使用邮箱验证码登录将自动创建账号
            <br />
            登录即表示同意本站的服务条款与隐私政策
          </p>
        </div>
      </FadeIn>
    </div>
  )
}
