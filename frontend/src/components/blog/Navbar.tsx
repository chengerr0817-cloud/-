import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, LogOut, Menu, PenLine, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: '首页', end: true },
  { to: '/tags', label: '标签' },
  { to: '/about', label: '关于' },
]

export function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [keyword, setKeyword] = useState('')

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyword.trim()) return
    navigate(`/search?q=${encodeURIComponent(keyword.trim())}`)
    setSearchOpen(false)
    setMobileOpen(false)
  }

  return (
    <header
      className="sticky top-0 z-50 border-b border-border/70 backdrop-blur-md"
      style={{ backgroundColor: 'color-mix(in oklch, var(--background) 88%, transparent)' }}
    >
      <nav className="container flex items-center justify-between" style={{ height: '4.25rem' }}>
        {/* Logo */}
        <Link to="/" className="flex items-center group" style={{ gap: 'var(--spacing-xs)' }}>
          <span
            className="flex items-center justify-center rounded-lg bg-primary text-primary-foreground"
            style={{ width: '2.1rem', height: '2.1rem' }}
          >
            <BookOpen size={18} strokeWidth={2.2} />
          </span>
          <span className="font-serif font-semibold tracking-tight" style={{ fontSize: '1.35rem' }}>
            墨迹
          </span>
          <span className="hidden sm:inline text-xs text-muted-foreground self-end mb-1 ml-1">
            技术成长笔记
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center" style={{ gap: 'var(--spacing-lg)' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative text-sm font-medium transition-colors py-1',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-primary"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center" style={{ gap: 'var(--spacing-sm)' }}>
          {/* Inline search (desktop) */}
          <form onSubmit={submitSearch} className="hidden lg:block relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索文章…"
              className="rounded-lg border border-border bg-card/70 text-sm outline-none focus:border-primary transition-colors"
              style={{ paddingLeft: '2.1rem', paddingRight: 'var(--spacing-sm)', paddingTop: '0.5rem', paddingBottom: '0.5rem', width: '13rem' }}
            />
          </form>

          <button
            className="lg:hidden inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            style={{ width: '2.25rem', height: '2.25rem' }}
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="搜索"
          >
            <Search size={18} />
          </button>

          {user ? (
            <>
              <Button
                size="sm"
                className="hidden sm:inline-flex"
                style={{ gap: 'var(--spacing-xs)' }}
                onClick={() => navigate('/write')}
              >
                <PenLine size={15} />
                写文章
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full outline-none ring-ring focus-visible:ring-2" aria-label="用户菜单">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email} />
                      <AvatarFallback className="bg-primary/12 text-primary font-semibold">
                        {(user.name || user.email || 'U').slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="truncate">{user.name || '博主'}</span>
                    <span className="text-xs font-normal text-muted-foreground truncate">
                      {user.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/me/posts')}>
                    <BookOpen size={15} className="mr-2" /> 我的文章
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/write')}>
                    <PenLine size={15} className="mr-2" /> 写新文章
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await signOut()
                      navigate('/')
                    }}
                  >
                    <LogOut size={15} className="mr-2" /> 退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => navigate('/login')}>
              登录
            </Button>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            style={{ width: '2.25rem', height: '2.25rem' }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="菜单"
          >
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </nav>

      {/* Mobile search */}
      {searchOpen && (
        <div className="lg:hidden border-t border-border/70" style={{ padding: 'var(--spacing-sm) 0' }}>
          <form onSubmit={submitSearch} className="container relative">
            <Search
              size={15}
              className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              autoFocus
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索文章…"
              className="w-full rounded-lg border border-border bg-card text-sm outline-none focus:border-primary"
              style={{ paddingLeft: '2.2rem', paddingRight: 'var(--spacing-sm)', paddingTop: '0.6rem', paddingBottom: '0.6rem' }}
            />
          </form>
        </div>
      )}

      {/* Mobile nav */}
      {mobileOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="md:hidden border-t border-border/70 overflow-hidden"
        >
          <div className="container flex flex-col" style={{ padding: 'var(--spacing-sm) 1rem', gap: '0.25rem' }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
                style={{ padding: 'var(--spacing-sm)' }}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </motion.div>
      )}
    </header>
  )
}
