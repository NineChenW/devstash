'use client'

import { useState } from 'react'
import { Check, Loader2, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { generateAutoDescription } from '@/actions/ai'

interface AutoDescriptionSuggestionProps {
  title: string
  content: string
  url: string
  fileName: string | null
  typeName: string
  onAccept: (description: string) => void
}

export function AutoDescriptionSuggestion({
  title,
  content,
  url,
  fileName,
  typeName,
  onAccept,
}: AutoDescriptionSuggestionProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const titleTrimmed = title.trim()
  const disabled = loading || titleTrimmed.length === 0

  const handleSuggest = async () => {
    if (disabled) return
    setLoading(true)
    try {
      const result = await generateAutoDescription({
        title: titleTrimmed,
        content: content || null,
        url: url || null,
        fileName: fileName || null,
        typeName: typeName || null,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setSuggestion(result.description)
    } catch (err) {
      console.error('generateAutoDescription client error', err)
      toast.error('AI request failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = () => {
    if (!suggestion) return
    onAccept(suggestion)
    setSuggestion(null)
  }

  const handleReject = () => {
    setSuggestion(null)
  }

  return (
    <div className="mt-2 space-y-2">
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSuggest}
          disabled={disabled}
          className="h-7 gap-1.5 px-2 text-xs"
          title={
            titleTrimmed.length === 0
              ? 'Add a title first'
              : 'Suggest a description with AI'
          }
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-[#8b5cf6]" />
          )}
          {loading ? 'Thinking…' : 'Suggest description'}
        </Button>
      </div>

      {suggestion && (
        <div className="flex items-start gap-2 rounded-md border border-[hsl(217.2_32.6%_30%)] bg-[hsl(217.2_32.6%_18%)] p-2">
          <p className="flex-1 text-xs leading-relaxed text-foreground">{suggestion}</p>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={handleAccept}
              className="flex h-6 w-6 items-center justify-center rounded-md text-emerald-400 hover:bg-emerald-400/15 focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
              title="Use this description"
              aria-label="Use suggested description"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive focus:outline-none focus-visible:ring-1 focus-visible:ring-destructive"
              title="Dismiss"
              aria-label="Dismiss suggested description"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
