import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Eye,
  ImagePlus,
  Loader2,
  PenLine,
  Save,
  Send,
  Tag as TagIcon,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MarkdownRenderer } from '@/components/blog/MarkdownRenderer'
import { PostCard } from '@/components/blog/PostCard'
import {
  useCreatePost,
  useUpdatePost,
  fetchPostTagNames,
} from '@/hooks/usePosts'
import { uploadFile } from '@/lib/storage'
import { db } from '@/lib/cloudbase'
import { estimateReadMinutes, markdownToPlain, slugify } from '@/lib/blog-utils'
import { useAuth } from '@/lib/AuthContext'
import type { Post, PostWithTags } from '@/types/blog'

export default function Write() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { user } = useAuth()
  const createPost = useCreatePost()
  const updatePost = useUpdatePost()

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tagNames, setTagNames] = useState<string[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null)

  // Load existing post for editing.
  useEffect(() => {
    if (!isEdit) return
    ;(async () => {
      try {
        const { data, error } = await db.from('posts').select('*').eq('id', Number(id)).maybeSingle()
        if (error || !data) {
          toast.error('文章不存在或无权编辑')
          navigate('/me/posts')
          return
        }
        const post = data as Post
        if (user && post.user_id && post.user_id !== user.uid) {
          toast.error('你只能编辑自己的文章')
          navigate('/me/posts')
          return
        }
        setTitle(post.title)
        setSummary(post.summary || '')
        setContent(post.content || '')
        setCoverUrl(post.cover_url || '')
        const names = await fetchPostTagNames(post.id)
        setTagNames(names)
      } catch {
        toast.error('加载文章失败')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, isEdit, navigate, user])

  const readMinutes = useMemo(() => estimateReadMinutes(content), [content])

  const addTag = () => {
    const t = tagInput.trim()
    if (!t) return
    if (tagNames.includes(t)) {
      setTagInput('')
      return
    }
    setTagNames((prev) => [...prev, t])
    setTagInput('')
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file, 'cover')
      setCoverUrl(url)
      toast.success('封面图上传成功')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSave = async (status: 'draft' | 'published') => {
    if (!title.trim()) {
      toast.error('请填写文章标题')
      return
    }
    if (!content.trim()) {
      toast.error('请填写文章正文')
      return
    }
    setSaving(status === 'draft' ? 'draft' : 'publish')
    const slug = isEdit ? undefined : `${slugify(title)}-${Date.now().toString(36).slice(-4)}`
    const payload = {
      title: title.trim(),
      summary: summary.trim() || markdownToPlain(content, 120),
      content,
      cover_url: coverUrl || null,
      status,
      read_minutes: readMinutes,
      author_name: user?.name || user?.email?.split('@')[0] || '墨迹',
    }
    try {
      if (isEdit) {
        await updatePost.mutateAsync({ id: Number(id), post: payload, tags: tagNames })
      } else {
        await createPost.mutateAsync({ post: { ...payload, slug: slug! }, tags: tagNames })
      }
      toast.success(status === 'published' ? '文章已发布！' : '草稿已保存')
      navigate('/me/posts')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(null)
    }
  }

  // Live preview card data.
  const previewPost: PostWithTags = {
    id: Number(id) || 0,
    title: title || '未命名文章',
    slug: '',
    summary: summary || markdownToPlain(content, 120) || '文章摘要将在这里显示…',
    content,
    cover_url: coverUrl || null,
    status: 'draft',
    views: 0,
    read_minutes: readMinutes,
    author_name: user?.name || '墨迹',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: null,
    tags: tagNames.map((n, i) => ({ id: i, name: n, slug: n, color: 'amber' })),
  }

  if (loading) {
    return (
      <div className="container flex items-center justify-center" style={{ padding: 'var(--spacing-3xl) 1rem', minHeight: '60vh' }}>
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: 'var(--spacing-2xl) 1rem', maxWidth: '72rem' }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between" style={{ gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          style={{ gap: '0.3rem' }}
        >
          <ArrowLeft size={15} /> 返回
        </button>
        <div className="flex items-center" style={{ gap: 'var(--spacing-sm)' }}>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            预计 {readMinutes} 分钟阅读 · {content.length} 字符
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={saving !== null}
            style={{ gap: 'var(--spacing-xs)' }}
            onClick={() => handleSave('draft')}
          >
            {saving === 'draft' ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            存草稿
          </Button>
          <Button
            size="sm"
            disabled={saving !== null}
            style={{ gap: 'var(--spacing-xs)' }}
            onClick={() => handleSave('published')}
          >
            {saving === 'publish' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {isEdit ? '更新并发布' : '发布文章'}
          </Button>
        </div>
      </div>

      <h1 className="font-serif font-bold" style={{ fontSize: 'var(--font-size-headline)', marginBottom: 'var(--spacing-lg)' }}>
        {isEdit ? '编辑文章' : '写新文章'}
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        {/* Editor */}
        <div className="flex flex-col" style={{ gap: 'var(--spacing-lg)' }}>
          <div className="flex flex-col" style={{ gap: 'var(--spacing-xs)' }}>
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              placeholder="一个吸引人的标题…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-serif"
              style={{ fontSize: '1.1rem', height: 'auto', paddingTop: '0.7rem', paddingBottom: '0.7rem' }}
            />
          </div>

          <div className="flex flex-col" style={{ gap: 'var(--spacing-xs)' }}>
            <Label htmlFor="summary">
              摘要 <span className="text-muted-foreground font-normal">（留空将自动从正文生成）</span>
            </Label>
            <Textarea
              id="summary"
              placeholder="用一两句话概括这篇文章…"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col" style={{ gap: 'var(--spacing-xs)' }}>
            <Label className="inline-flex items-center" style={{ gap: '0.3rem' }}>
              <TagIcon size={14} /> 标签
            </Label>
            <div className="flex items-center" style={{ gap: 'var(--spacing-xs)' }}>
              <Input
                placeholder="输入标签后回车添加"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                添加
              </Button>
            </div>
            {tagNames.length > 0 && (
              <div className="flex flex-wrap" style={{ gap: '0.4rem', marginTop: 'var(--spacing-xs)' }}>
                {tagNames.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 text-primary text-xs font-medium"
                    style={{ gap: '0.3rem', padding: '0.18rem 0.6rem' }}
                  >
                    {t}
                    <button type="button" onClick={() => setTagNames((p) => p.filter((x) => x !== t))} aria-label={`移除 ${t}`}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Content with preview tabs */}
          <div className="flex flex-col" style={{ gap: 'var(--spacing-xs)' }}>
            <Label>正文（支持 Markdown）</Label>
            <Tabs defaultValue="write">
              <TabsList>
                <TabsTrigger value="write" className="gap-1.5">
                  <PenLine size={14} /> 编辑
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-1.5">
                  <Eye size={14} /> 预览
                </TabsTrigger>
              </TabsList>
              <TabsContent value="write">
                <Textarea
                  placeholder={'# 开始写作\n\n支持 **Markdown** 语法、代码块、表格与图片…'}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                  style={{ lineHeight: 1.7 }}
                />
              </TabsContent>
              <TabsContent value="preview">
                <div
                  className="rounded-lg border border-border bg-card min-h-[20rem]"
                  style={{ padding: 'var(--spacing-lg)' }}
                >
                  {content.trim() ? (
                    <MarkdownRenderer content={content} />
                  ) : (
                    <p className="text-sm text-muted-foreground">预览区为空，先在「编辑」标签下写点什么吧。</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar: cover + preview */}
        <aside className="flex flex-col" style={{ gap: 'var(--spacing-lg)' }}>
          <div className="rounded-xl border border-border bg-card shadow-sm" style={{ padding: 'var(--spacing-lg)' }}>
            <h3 className="font-serif font-semibold text-sm" style={{ marginBottom: 'var(--spacing-sm)' }}>
              封面图
            </h3>
            {coverUrl ? (
              <div className="relative">
                <img src={coverUrl} alt="封面预览" className="w-full rounded-lg object-cover" style={{ aspectRatio: '16/9' }} />
                <button
                  onClick={() => setCoverUrl('')}
                  className="absolute flex items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                  style={{ top: '0.4rem', right: '0.4rem', width: '1.6rem', height: '1.6rem' }}
                  aria-label="移除封面"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground cursor-pointer hover:border-primary hover:text-primary transition-colors"
                style={{ aspectRatio: '16/9', gap: 'var(--spacing-xs)' }}
              >
                {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={22} />}
                <span className="text-xs">{uploading ? '上传中…' : '点击上传封面'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              </label>
            )}
            <p className="text-xs text-muted-foreground" style={{ marginTop: 'var(--spacing-sm)' }}>
              图片将上传至云端存储
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm" style={{ padding: 'var(--spacing-lg)' }}>
            <h3 className="font-serif font-semibold text-sm" style={{ marginBottom: 'var(--spacing-sm)' }}>
              卡片预览
            </h3>
            <PostCard post={previewPost} showStatus />
          </div>
        </aside>
      </div>
    </div>
  )
}
