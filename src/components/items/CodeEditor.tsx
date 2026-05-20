'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy, Loader2, Sparkles, Crown } from 'lucide-react'
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useEditorPreferences } from '@/components/settings/EditorPreferencesContext'
import type { EditorTheme } from '@/lib/validations/editor-preferences'

interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: string | null
  readOnly?: boolean
  placeholder?: string
  minHeight?: number
  maxHeight?: number
  showExplain?: boolean
  userIsPro?: boolean
  onExplain?: () => Promise<string>
}

const THEME_VS_DARK = 'devstash-vs-dark'
const THEME_MONOKAI = 'devstash-monokai'
const THEME_GITHUB_DARK = 'devstash-github-dark'

const THEME_MAP: Record<EditorTheme, string> = {
  'vs-dark': THEME_VS_DARK,
  monokai: THEME_MONOKAI,
  'github-dark': THEME_GITHUB_DARK,
}

const DEFAULT_MIN_HEIGHT = 120
const DEFAULT_MAX_HEIGHT = 400

type ViewTab = 'code' | 'explain'

let themesDefined = false

function defineThemes(monaco: Monaco) {
  if (themesDefined) return
  themesDefined = true

  monaco.editor.defineTheme(THEME_VS_DARK, {
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

  monaco.editor.defineTheme(THEME_MONOKAI, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'f92672' },
      { token: 'string', foreground: 'e6db74' },
      { token: 'number', foreground: 'ae81ff' },
      { token: 'type', foreground: '66d9ef', fontStyle: 'italic' },
      { token: 'function', foreground: 'a6e22e' },
      { token: 'variable', foreground: 'f8f8f2' },
      { token: 'constant', foreground: 'ae81ff' },
      { token: 'tag', foreground: 'f92672' },
      { token: 'attribute.name', foreground: 'a6e22e' },
      { token: 'attribute.value', foreground: 'e6db74' },
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#f8f8f2',
      'editorLineNumber.foreground': '#75715e',
      'editorLineNumber.activeForeground': '#f8f8f2',
      'editor.lineHighlightBackground': '#3e3d32',
      'editor.selectionBackground': '#49483e',
      'editor.inactiveSelectionBackground': '#3a3a35',
      'editorCursor.foreground': '#f8f8f0',
      'editorIndentGuide.background': '#3b3a32',
      'editorIndentGuide.activeBackground': '#75715e',
      'scrollbar.shadow': '#00000000',
      'scrollbarSlider.background': '#75715e80',
      'scrollbarSlider.hoverBackground': '#a59f85b0',
      'scrollbarSlider.activeBackground': '#cfcfc2d0',
    },
  })

  monaco.editor.defineTheme(THEME_GITHUB_DARK, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff7b72' },
      { token: 'string', foreground: 'a5d6ff' },
      { token: 'number', foreground: '79c0ff' },
      { token: 'type', foreground: 'ffa657' },
      { token: 'function', foreground: 'd2a8ff' },
      { token: 'variable', foreground: 'c9d1d9' },
      { token: 'constant', foreground: '79c0ff' },
      { token: 'tag', foreground: '7ee787' },
      { token: 'attribute.name', foreground: '79c0ff' },
      { token: 'attribute.value', foreground: 'a5d6ff' },
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#c9d1d9',
      'editorLineNumber.foreground': '#484f58',
      'editorLineNumber.activeForeground': '#c9d1d9',
      'editor.lineHighlightBackground': '#161b22',
      'editor.selectionBackground': '#264f78',
      'editor.inactiveSelectionBackground': '#1f3a5a',
      'editorCursor.foreground': '#c9d1d9',
      'editorIndentGuide.background': '#21262d',
      'editorIndentGuide.activeBackground': '#30363d',
      'scrollbar.shadow': '#00000000',
      'scrollbarSlider.background': '#30363d80',
      'scrollbarSlider.hoverBackground': '#484f58b0',
      'scrollbarSlider.activeBackground': '#6e7681d0',
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
  showExplain = false,
  userIsPro = false,
  onExplain,
}: CodeEditorProps) {
  const preferences = useEditorPreferences()
  const monacoRef = useRef<Monaco | null>(null)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const [editorHeight, setEditorHeight] = useState(minHeight)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<ViewTab>('code')
  const [explaining, setExplaining] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [explainError, setExplainError] = useState<string | null>(null)

  const themeId = THEME_MAP[preferences.theme]

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
    monacoRef.current = monaco
    defineThemes(monaco)
    monaco.editor.setTheme(themeId)
    ed.onDidContentSizeChange(() => updateHeight(ed))
    updateHeight(ed)
  }

  useEffect(() => {
    const monaco = monacoRef.current
    if (!monaco) return
    monaco.editor.setTheme(themeId)
  }, [themeId])

  useEffect(() => {
    const ed = editorRef.current
    if (!ed) return
    ed.updateOptions({
      tabSize: preferences.tabSize,
      fontSize: preferences.fontSize,
      wordWrap: preferences.wordWrap ? 'on' : 'off',
      minimap: { enabled: preferences.minimap },
    })
  }, [preferences.tabSize, preferences.fontSize, preferences.wordWrap, preferences.minimap])

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

  const handleExplain = async () => {
    if (!onExplain || explaining) return
    setExplaining(true)
    setExplainError(null)
    try {
      const result = await onExplain()
      setExplanation(result)
      setActiveTab('explain')
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : 'Failed to explain code')
    } finally {
      setExplaining(false)
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
        <div className="ml-auto flex items-center gap-1">
          {showExplain && explanation && (
            <div className="flex items-center border border-[hsl(217.2_32.6%_30%)] rounded mr-1">
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors ${
                  activeTab === 'code'
                    ? 'bg-[hsl(217.2_32.6%_24%)] text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Code
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('explain')}
                className={`px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors ${
                  activeTab === 'explain'
                    ? 'bg-[hsl(217.2_32.6%_24%)] text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Explain
              </button>
            </div>
          )}
          {showExplain && (
            userIsPro ? (
              <button
                type="button"
                onClick={handleExplain}
                disabled={explaining || !value}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground hover:bg-[hsl(217.2_32.6%_24%)] hover:text-foreground disabled:opacity-50"
                aria-label="Explain code"
                title="Explain code (AI)"
              >
                {explaining ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                <span>{explaining ? 'Explaining...' : 'Explain'}</span>
              </button>
            ) : (
              <span
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground cursor-not-allowed"
                title="AI features require Pro subscription"
              >
                <Crown className="h-3 w-3" />
                <span>Explain</span>
              </span>
            )
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground hover:bg-[hsl(217.2_32.6%_24%)] hover:text-foreground"
            aria-label="Copy code"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
      {showPlaceholder ? (
        <div
          className="px-4 py-6 font-mono text-xs text-muted-foreground"
          style={{ minHeight }}
        >
          {placeholder}
        </div>
      ) : activeTab === 'explain' && explanation ? (
        <div className="overflow-auto p-4 text-sm leading-relaxed text-foreground/90" style={{ minHeight, maxHeight }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation}</ReactMarkdown>
        </div>
      ) : explaining ? (
        <div
          className="flex items-center justify-center gap-2 text-muted-foreground"
          style={{ minHeight }}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Generating explanation...</span>
        </div>
      ) : explainError ? (
        <div
          className="flex items-center justify-center gap-2 text-destructive p-4"
          style={{ minHeight }}
        >
          <span className="text-xs">{explainError}</span>
        </div>
      ) : (
        <Editor
          value={value}
          onChange={(v) => onChange?.(v ?? '')}
          language={normalizedLanguage}
          theme={themeId}
          onMount={handleMount}
          height={editorHeight}
          options={{
            readOnly,
            domReadOnly: readOnly,
            fontSize: preferences.fontSize,
            tabSize: preferences.tabSize,
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            minimap: { enabled: preferences.minimap },
            scrollBeyondLastLine: false,
            wordWrap: preferences.wordWrap ? 'on' : 'off',
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
