import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, KeyRound, Loader2, LogIn, User as UserIcon, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/AuthContext'
import { getErrorMessage } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FadeIn } from '@/components/MotionPrimitives'

export default function Login() {
  const navigate = useNavigate()
  const { login, register, hasUsers } = useAuth()

  // 站点还没有任何账号时，默认切到注册模式。
  const [mode, setMode] = useState<'login' | 'register'>(hasUsers ? 'login' : 'register')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isRegister = mode === 'register'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = username.trim()
    if (name.length < 2) {
      toast.error('用户名至少 2 个字符')
      return
    }
    if (password.length < 6) {
      toast.error('密码至少 6 位')
      return
    }
    if (isRegister && password !== confirm) {
      toast.error('两次输入的密码不一致')
      return
    }

    setSubmitting(true)
    try {
      if (isRegister) {
        await register(name, password, displayName.trim() || undefined)
        toast.success('账号创建成功，欢迎加入墨迹！')
      } else {
        await login(name, password)
        toast.success('登录成功，欢迎回来！')
      }
      navigate('/me/posts')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="container flex items-center justify-center"
      style={{ padding: 'var(--spacing-3xl) 1rem', minHeight: '78vh' }}
    >
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
              {isRegister ? '创建墨迹账号' : '欢迎回到墨迹'}
            </h1>
            <p className="text-sm text-muted-foreground" style={{ marginTop: '0.3rem' }}>
              {isRegister ? '注册后即可发布与管理你的文章' : '登录后即可继续写作'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: 'var(--spacing-md)' }}>
            <div className="flex flex-col" style={{ gap: 'var(--spacing-xs)' }}>
              <Label htmlFor="username">用户名</Label>
              <div className="relative">
                <UserIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  autoComplete="username"
                  placeholder="例如 admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ paddingLeft: '2.3rem' }}
                />
              </div>
            </div>

            {isRegister && (
              <div className="flex flex-col" style={{ gap: 'var(--spacing-xs)' }}>
                <Label htmlFor="display">
                  昵称 <span className="text-muted-foreground font-normal">（选填）</span>
                </Label>
                <Input
                  id="display"
                  placeholder="显示在文章作者处，留空则用用户名"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col" style={{ gap: 'var(--spacing-xs)' }}>
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  placeholder="至少 6 位"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.3rem' }}
                />
              </div>
            </div>

            {isRegister && (
              <div className="flex flex-col" style={{ gap: 'var(--spacing-xs)' }}>
                <Label htmlFor="confirm">确认密码</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="再输入一次密码"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            )}

            <Button type="submit" disabled={submitting} style={{ gap: 'var(--spacing-xs)' }}>
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isRegister ? (
                <UserPlus size={16} />
              ) : (
                <LogIn size={16} />
              )}
              {submitting ? '处理中…' : isRegister ? '注册并登录' : '登录'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground" style={{ marginTop: 'var(--spacing-lg)' }}>
            {isRegister ? '已经有账号了？' : '还没有账号？'}
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              style={{ marginLeft: '0.3rem' }}
              onClick={() => {
                setMode(isRegister ? 'login' : 'register')
                setPassword('')
                setConfirm('')
              }}
            >
              {isRegister ? '去登录' : '立即注册'}
            </button>
          </p>

          <p
            className="text-center text-xs text-muted-foreground"
            style={{ marginTop: 'var(--spacing-md)', lineHeight: 1.7 }}
          >
            账号数据保存在本机数据库中，仅你本人可访问
          </p>
        </div>
      </FadeIn>
    </div>
  )
}
