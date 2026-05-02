'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Eye, Pencil } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  placeholder?: string
  minHeight?: number
  maxHeight?: number
}

const DEFAULT_MIN_HEIGHT = 240
const DEFAULT_MAX_HEIGHT = 400

type Tab = 'write' | 'preview'

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  placeholder,
  minHeight = DEFAULT_MIN_HEIGHT,
  maxHeight = DEFAULT_MAX_HEIGHT,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<Tab>(readOnly ? 'preview' : 'write')
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Force preview tab whenever readOnly flips on (e.g. drawer goes view → readonly).
  useEffect(() => {
    if (readOnly) setTab('preview')
  }, [readOnly])

  // Auto-resize the textarea so the editor grows with content (capped by maxHeight).
  useEffect(() => {
    if (tab !== 'write' || readOnly) return
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    const next = Math.max(minHeight, Math.min(ta.scrollHeight, maxHeight))
    ta.style.height = `${next}px`
  }, [tab, value, readOnly, minHeight, maxHeight])

  const handleCopy = async () => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // swallow — drawer-level Copy already toasts
    }
  }

  const showPlaceholder = readOnly && !value

  return (
    <div className="overflow-hidden rounded-md border border-[hsl(217.2_32.6%_22%)] bg-[#1e1e1e]">
      <div className="flex items-center gap-1 border-b border-[hsl(217.2_32.6%_22%)] bg-[#2d2d2d] px-2 py-1.5">
        {!readOnly && (
          <button
            type="button"
            onClick={() => setTab('write')}
            aria-pressed={tab === 'write'}
            className={
              'flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors ' +
              (tab === 'write'
                ? 'bg-[hsl(217.2_32.6%_24%)] text-foreground'
                : 'text-muted-foreground hover:text-foreground')
            }
          >
            <Pencil className="h-3 w-3" />
            <span>Write</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setTab('preview')}
          aria-pressed={tab === 'preview'}
          className={
            'flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors ' +
            (tab === 'preview'
              ? 'bg-[hsl(217.2_32.6%_24%)] text-foreground'
              : 'text-muted-foreground hover:text-foreground')
          }
        >
          <Eye className="h-3 w-3" />
          <span>Preview</span>
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground hover:bg-[hsl(217.2_32.6%_24%)] hover:text-foreground"
          aria-label="Copy markdown"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {tab === 'write' && !readOnly ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder ?? 'Write markdown…'}
          spellCheck={false}
          className="block w-full resize-none border-0 bg-[#1e1e1e] px-4 py-3 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
          style={{ minHeight, maxHeight }}
        />
      ) : showPlaceholder ? (
        <div
          className="px-4 py-6 text-xs text-muted-foreground"
          style={{ minHeight }}
        >
          {placeholder ?? 'Nothing to preview.'}
        </div>
      ) : (
        <div
          className="markdown-preview overflow-y-auto px-4 py-3 text-sm"
          style={{ minHeight, maxHeight }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{value || ''}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}
