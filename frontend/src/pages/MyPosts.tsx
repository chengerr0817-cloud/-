import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, Loader2, Pencil, PenLine, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMyPosts, deletePost } from '@/hooks/usePosts'
import { getErrorMessage } from '@/lib/api-client'
import { useAuth } from '@/lib/AuthContext'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FadeIn, Stagger, HoverLift } from '@/components/MotionPrimitives'
import { formatDate } from '@/lib/blog-utils'
import type { Post } from '@/hooks/usePosts'

export default function MyPosts() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: posts, isLoading, refetch } = useMyPosts(!!user)
  const [deleting, setDeleting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Post | null>(null)

  const list = posts || []
  const drafts = list.filter((p) => p.status === 'draft')
  const published = list.filter((p) => p.status === 'published')

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deletePost(pendingDelete.id)
      toast.success('文章已删除')
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(false)
      setPendingDelete(null)
    }
  }

  return (
    <div className="container" style={{ padding: 'var(--spacing-3xl) 1rem', maxWidth: '64rem' }}>
      <FadeIn>
        <div className="flex flex-wrap items-center justify-between" style={{ gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-2xl)' }}>
          <div>
            <h1 className="font-serif font-bold" style={{ fontSize: 'var(--font-size-headline)' }}>
              我的文章
            </h1>
            <p className="text-muted-foreground text-sm" style={{ marginTop: '0.3rem' }}>
              共 {list.length} 篇 · {published.length} 篇已发布 · {drafts.length} 篇草稿
            </p>
          </div>
          <Button style={{ gap: 'var(--spacing-xs)' }} onClick={() => navigate('/write')}>
            <Plus size={16} /> 写新文章
          </Button>
        </div>
      </FadeIn>

      {isLoading ? (
        <div className="flex flex-col" style={{ gap: 'var(--spacing-sm)' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border text-center"
          style={{ padding: 'var(--spacing-3xl)', gap: 'var(--spacing-md)' }}
        >
          <FileText size={36} className="text-muted-foreground" />
          <p className="text-muted-foreground">你还没有任何文章</p>
          <Button onClick={() => navigate('/write')} style={{ gap: 'var(--spacing-xs)' }}>
            <PenLine size={16} /> 写下第一篇
          </Button>
        </div>
      ) : (
        <Stagger className="flex flex-col" style={{ gap: 'var(--spacing-sm)' }}>
          {list.map((p) => (
            <HoverLift key={p.id}>
              <div
                className="flex flex-wrap items-center justify-between rounded-xl border border-border bg-card shadow-sm"
                style={{ gap: 'var(--spacing-md)', padding: 'var(--spacing-lg)' }}
              >
                <div className="flex items-start" style={{ gap: 'var(--spacing-md)', minWidth: 0 }}>
                  <span
                    className="flex items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0"
                    style={{ width: '2.6rem', height: '2.6rem' }}
                  >
                    <FileText size={18} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="flex items-center flex-wrap" style={{ gap: 'var(--spacing-xs)' }}>
                      <Link
                        to={`/posts/${encodeURIComponent(p.slug)}`}
                        className="font-medium hover:text-primary transition-colors line-clamp-1"
                      >
                        {p.title}
                      </Link>
                      <span
                        className={
                          'rounded-full text-xs font-medium ' +
                          (p.status === 'published'
                            ? 'bg-success/15 text-success'
                            : 'bg-warning/20 text-warning-foreground')
                        }
                        style={{ padding: '0.12rem 0.55rem' }}
                      >
                        {p.status === 'published' ? '已发布' : '草稿'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground" style={{ marginTop: '0.3rem' }}>
                      更新于 {formatDate(p.updated_at)} · {p.views} 次阅读 · {p.read_minutes} 分钟
                    </div>
                  </div>
                </div>

                <div className="flex items-center shrink-0" style={{ gap: 'var(--spacing-xs)' }}>
                  <Button variant="outline" size="sm" style={{ gap: '0.3rem' }} onClick={() => navigate(`/edit/${p.id}`)}>
                    <Pencil size={14} /> 编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setPendingDelete(p)}
                    aria-label="删除"
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            </HoverLift>
          ))}
        </Stagger>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除文章？</AlertDialogTitle>
            <AlertDialogDescription>
              即将删除《{pendingDelete?.title}》，该操作不可撤销，相关标签关联也会一并移除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 size={15} className="animate-spin" /> : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
