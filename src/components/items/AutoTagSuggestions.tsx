'use client'

import { useState } from 'react'
import { Check, Loader2, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { generateAutoTags } from '@/actions/ai'
import { parseTagsInput } from '@/lib/item-utils'

interface AutoTagSuggestionsProps {
  title: string
  content: string
  typeName: string
  tagsInput: string
  onAcceptTag: (tag: string) => void
}

export function AutoTagSuggestions({
  title,
  content,
  typeName,
  tagsInput,
  onAcceptTag,
}: AutoTagSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const titleTrimmed = title.trim()
  const disabled = loading || titleTrimmed.length === 0

  const handleSuggest = async () => {
    if (disabled) return
    setLoading(true)
    try {
      const result = await generateAutoTags({
        title: titleTrimmed,
        content: content || null,
        typeName: typeName || null,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      const existing = new Set(parseTagsInput(tagsInput).map((t) => t.toLowerCase()))
      const fresh = result.tags.filter((t) => !existing.has(t))
      if (fresh.length === 0) {
        toast.message('No new tags suggested.')
        setSuggestions([])
        return
      }
      setSuggestions(fresh)
    } catch (err) {
      console.error('generateAutoTags client error', err)
      toast.error('AI request failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = (tag: string) => {
    onAcceptTag(tag)
    setSuggestions((prev) => prev.filter((t) => t !== tag))
  }

  const handleReject = (tag: string) => {
    setSuggestions((prev) => prev.filter((t) => t !== tag))
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
          title={titleTrimmed.length === 0 ? 'Add a title first' : 'Suggest tags with AI'}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-[#8b5cf6]" />
          )}
          {loading ? 'Thinking…' : 'Suggest tags'}
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-[hsl(217.2_32.6%_30%)] bg-[hsl(217.2_32.6%_18%)] py-0.5 pl-2 pr-0.5 text-xs"
            >
              <span className="text-foreground">{tag}</span>
              <button
                type="button"
                onClick={() => handleAccept(tag)}
                className="flex h-5 w-5 items-center justify-center rounded-full text-emerald-400 hover:bg-emerald-400/15 focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
                title={`Add "${tag}"`}
                aria-label={`Add ${tag}`}
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => handleReject(tag)}
                className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/15 hover:text-destructive focus:outline-none focus-visible:ring-1 focus-visible:ring-destructive"
                title={`Dismiss "${tag}"`}
                aria-label={`Dismiss ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
