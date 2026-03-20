"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"

type MarkdownContentProps = {
  content: string
  className?: string
}

const MarkdownContent = ({ content, className = "" }: MarkdownContentProps) => {
  return (
    <div
      className={`prose prose-sm max-w-none text-ui-fg-subtle ${className}`}
      data-testid="markdown-content"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // Style headings
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-ui-fg-base mb-4 mt-6 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-ui-fg-base mb-3 mt-5 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-ui-fg-base mb-2 mt-4 first:mt-0">
              {children}
            </h3>
          ),
          // Style paragraphs
          p: ({ children }) => (
            <p className="text-ui-fg-subtle mb-4 leading-relaxed">{children}</p>
          ),
          // Style lists - use pl-5 for proper bullet indentation
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-4 space-y-1 text-ui-fg-subtle">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-4 space-y-1 text-ui-fg-subtle">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-ui-fg-subtle pl-1">{children}</li>
          ),
          // Style links
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // Style bold and italic
          strong: ({ children }) => (
            <strong className="font-semibold text-ui-fg-base">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          // Style code blocks
          code: ({ children, className }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="bg-ui-bg-subtle px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              )
            }
            return (
              <code className="block bg-ui-bg-subtle p-4 rounded-lg text-sm font-mono overflow-x-auto mb-4">
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="bg-ui-bg-subtle p-4 rounded-lg overflow-x-auto mb-4">
              {children}
            </pre>
          ),
          // Style blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-ui-border-base pl-4 italic text-ui-fg-muted mb-4">
              {children}
            </blockquote>
          ),
          // Style horizontal rules
          hr: () => <hr className="border-ui-border-base my-6" />,
          // Style tables (GFM)
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-ui-border-base">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-ui-bg-subtle">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-ui-border-base px-4 py-2 text-left font-semibold text-ui-fg-base">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-ui-border-base px-4 py-2 text-ui-fg-subtle">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownContent
