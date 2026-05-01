'use client'

import { useCallback, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: string | null
  readOnly?: boolean
  placeholder?: string
  minHeight?: number
  maxHeight?: number
}

const DEVSTASH_THEME = 'devstash-dark'

const DEFAULT_MIN_HEIGHT = 120
const DEFAULT_MAX_HEIGHT = 400

function defineDevstashTheme(monaco: Monaco) {
  monaco.editor.defineTheme(DEVSTASH_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#161e2c',
      'editor.foreground': '#e2e8f0',
      'editorLineNumber.foreground': '#475569',
      'editorLineNumber.activeForeground': '#94a3b8',
      'editor.lineHighlightBackground': '#1c2536',
      'editor.selectionBackground': '#334155',
      'editor.inactiveSelectionBackground': '#27313f',
      'editorCursor.foreground': '#e2e8f0',
      'editorIndentGuide.background': '#1f2937',
      'editorIndentGuide.activeBackground': '#334155',
      'scrollbar.shadow': '#00000000',
      'scrollbarSlider.background': '#33415580',
      'scrollbarSlider.hoverBackground': '#475569b0',
      'scrollbarSlider.activeBackground': '#64748bd0',
    },
  })
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  placeholder,
  minHeight = DEFAULT_MIN_HEIGHT,
  maxHeight = DEFAULT_MAX_HEIGHT,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const [editorHeight, setEditorHeight] = useState(minHeight)
  const [copied, setCopied] = useState(false)

  const normalizedLanguage = (language ?? '').trim().toLowerCase() || 'plaintext'

  const updateHeight = useCallback(
    (ed: editor.IStandaloneCodeEditor) => {
      const contentHeight = Math.max(minHeight, Math.min(ed.getContentHeight(), maxHeight))
      setEditorHeight(contentHeight)
    },
    [minHeight, maxHeight],
  )

  const handleMount: OnMount = (ed, monaco) => {
    editorRef.current = ed
    defineDevstashTheme(monaco)
    monaco.editor.setTheme(DEVSTASH_THEME)
    ed.onDidContentSizeChange(() => updateHeight(ed))
    updateHeight(ed)
  }

  const handleCopy = async () => {
    const text = editorRef.current?.getValue() ?? value
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // swallow — caller can rely on toast elsewhere if desired
    }
  }

  const showPlaceholder = readOnly && !value && placeholder

  return (
    <div className="overflow-hidden rounded-md border border-[hsl(217.2_32.6%_22%)] bg-[#161e2c]">
      <div className="flex items-center gap-2 border-b border-[hsl(217.2_32.6%_22%)] bg-[hsl(217.2_32.6%_18%)] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" aria-hidden />
        </div>
        <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {normalizedLanguage}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground hover:bg-[hsl(217.2_32.6%_24%)] hover:text-foreground"
          aria-label="Copy code"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      {showPlaceholder ? (
        <div
          className="px-4 py-6 font-mono text-xs text-muted-foreground"
          style={{ minHeight }}
        >
          {placeholder}
        </div>
      ) : (
        <Editor
          value={value}
          onChange={(v) => onChange?.(v ?? '')}
          language={normalizedLanguage}
          theme={DEVSTASH_THEME}
          onMount={handleMount}
          height={editorHeight}
          options={{
            readOnly,
            domReadOnly: readOnly,
            fontSize: 12,
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            wrappingIndent: 'same',
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: readOnly ? 'none' : 'line',
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
              alwaysConsumeMouseWheel: false,
            },
            overviewRulerLanes: 0,
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            folding: false,
            guides: { indentation: false },
            contextmenu: !readOnly,
          }}
        />
      )}
    </div>
  )
}
