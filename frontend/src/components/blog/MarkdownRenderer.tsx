import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Renders Markdown with GFM support (tables, task lists, strikethrough),
 * raw HTML passthrough and syntax highlighting for code blocks.
 * Styling lives in the `.prose-moji` class in index.css.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={`prose-moji ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
          img: ({ node, ...props }) => <img {...props} loading="lazy" alt={props.alt || ''} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
