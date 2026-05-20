'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { formatBytes } from '@/lib/file-constraints'
import { TYPES_WITH_CODE_EDITOR, TYPES_WITH_MARKDOWN_EDITOR } from '@/lib/item-type-meta'
import type { ItemDetail } from '@/lib/db/items'
import { CodeEditor } from './CodeEditor'
import { MarkdownEditor } from './MarkdownEditor'
import { explainCode } from '@/actions/ai'

interface ItemContentPreviewProps {
  item: ItemDetail
  userIsPro?: boolean
}

export function ItemContentPreview({ item, userIsPro = false }: ItemContentPreviewProps) {
  if (item.contentType === 'url' && item.url) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block break-all rounded-md border border-[hsl(217.2_32.6%_22%)] bg-[hsl(217.2_32.6%_14%)] p-3 text-sm text-emerald-400 hover:underline"
      >
        {item.url}
      </a>
    )
  }

  if (item.contentType === 'file') {
    const isImage = item.type.name === 'image'
    return (
      <div className="space-y-3">
        {isImage && item.fileUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.fileUrl}
            alt={item.fileName ?? item.title}
            className="max-h-96 w-full rounded-md border border-[hsl(217.2_32.6%_22%)] bg-[hsl(217.2_32.6%_14%)] object-contain"
          />
        )}
        <div className="rounded-md border border-[hsl(217.2_32.6%_22%)] bg-[hsl(217.2_32.6%_14%)] p-3 text-sm">
          <div className="break-all font-medium">{item.fileName ?? 'Attached file'}</div>
          {item.fileSize != null && (
            <div className="mt-0.5 text-xs text-muted-foreground">
              {formatBytes(item.fileSize)}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (item.content) {
    if (TYPES_WITH_CODE_EDITOR.has(item.type.name)) {
      const handleExplain = async () => {
        const result = await explainCode({
          title: item.title,
          content: item.content,
          language: item.language,
          typeName: item.type.name,
        })
        if (!result.success) {
          toast.error(result.error)
          throw new Error(result.error)
        }
        return result.explanation
      }
      return (
        <CodeEditor
          value={item.content}
          language={item.language}
          readOnly
          showExplain
          userIsPro={userIsPro}
          onExplain={handleExplain}
        />
      )
    }
    if (TYPES_WITH_MARKDOWN_EDITOR.has(item.type.name)) {
      return <MarkdownEditor value={item.content} readOnly />
    }
    return (
      <pre className="overflow-x-auto rounded-md border border-[hsl(217.2_32.6%_22%)] bg-[hsl(217.2_32.6%_14%)] p-3 text-xs leading-relaxed">
        <code>{item.content}</code>
      </pre>
    )
  }

  return <p className="text-sm text-muted-foreground">No content.</p>
}
