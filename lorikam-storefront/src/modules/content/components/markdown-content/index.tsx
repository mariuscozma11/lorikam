import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="space-y-4 text-ui-fg-subtle leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: (props) => (
            <h1 className="text-2xl font-semibold text-ui-fg-base mt-8 mb-3" {...props} />
          ),
          h2: (props) => (
            <h2 className="text-xl font-semibold text-ui-fg-base mt-8 mb-3" {...props} />
          ),
          h3: (props) => (
            <h3 className="text-lg font-semibold text-ui-fg-base mt-6 mb-2" {...props} />
          ),
          p: (props) => <p className="text-ui-fg-subtle" {...props} />,
          ul: (props) => (
            <ul className="list-disc pl-6 space-y-1 text-ui-fg-subtle" {...props} />
          ),
          ol: (props) => (
            <ol className="list-decimal pl-6 space-y-1 text-ui-fg-subtle" {...props} />
          ),
          a: (props) => (
            <a className="text-ui-fg-interactive hover:underline" {...props} />
          ),
          strong: (props) => (
            <strong className="font-semibold text-ui-fg-base" {...props} />
          ),
          hr: () => <hr className="my-6 border-ui-border-base" />,
          blockquote: (props) => (
            <blockquote
              className="border-l-2 border-ui-border-base pl-4 italic text-ui-fg-muted"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
