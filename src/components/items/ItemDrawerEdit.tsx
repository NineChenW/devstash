'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { iconMap, DefaultIcon } from '@/lib/icon-map'
import { firstFieldError, parseTagsInput } from '@/lib/item-utils'
import {
  TYPES_WITH_CONTENT,
  TYPES_WITH_LANGUAGE,
} from '@/lib/item-type-meta'
import { updateItem } from '@/actions/items'
import type { ItemDetail } from '@/lib/db/items'
import { ItemFormFields } from './ItemFormFields'
import { DetailRow, ItemHeader, Section, fmtLongDate } from './ItemDrawerLayout'

interface ItemDrawerEditProps {
  item: ItemDetail
  onCancel: () => void
  onSaved: (updated: ItemDetail) => void
}

export function ItemDrawerEdit({ item, onCancel, onSaved }: ItemDrawerEditProps) {
  const router = useRouter()
  const Icon = iconMap[item.type.icon] || DefaultIcon
  const typeName = item.type.name
  const showContent = TYPES_WITH_CONTENT.has(typeName)
  const showLanguage = TYPES_WITH_LANGUAGE.has(typeName)
  const showUrl = typeName === 'link'

  const [title, setTitle] = useState(item.title)
  const [description, setDescription] = useState(item.description ?? '')
  const [content, setContent] = useState(item.content ?? '')
  const [language, setLanguage] = useState(item.language ?? '')
  const [url, setUrl] = useState(item.url ?? '')
  const [tagsInput, setTagsInput] = useState(item.tags.join(', '))
  const [submitting, setSubmitting] = useState(false)

  const titleTrimmed = title.trim()
  const canSave = titleTrimmed.length > 0 && !submitting

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    if (!canSave) return

    setSubmitting(true)
    try {
      const result = await updateItem(item.id, {
        title: titleTrimmed,
        description: description.trim() ? description : null,
        content: showContent && content.trim() ? content : null,
        url: showUrl && url.trim() ? url : null,
        language: showLanguage && language.trim() ? language : null,
        tags: parseTagsInput(tagsInput),
      })

      if (!result.success) {
        toast.error(firstFieldError(result.fieldErrors, 'url', 'title') ?? result.error)
        return
      }

      toast.success('Item updated')
      onSaved(result.data)
      router.refresh()
    } catch {
      toast.error('Failed to update item')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden">
      <ItemHeader item={item} Icon={Icon} />

      <div className="mt-4 flex items-center gap-2 border-y border-[hsl(217.2_32.6%_22%)] bg-[hsl(217.2_32.6%_14%)] px-3 py-2">
        <Button type="submit" size="sm" disabled={!canSave}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
        <ItemFormFields
          typeName={typeName}
          idPrefix="edit"
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          content={content}
          setContent={setContent}
          language={language}
          setLanguage={setLanguage}
          url={url}
          setUrl={setUrl}
          tagsInput={tagsInput}
          setTagsInput={setTagsInput}
          contentRows={10}
        />

        <Section title="Details">
          <div className="space-y-2 text-sm">
            <DetailRow
              label="Type"
              value={`${typeName.charAt(0).toUpperCase()}${typeName.slice(1)}s`}
            />
            {item.collections.length > 0 && (
              <DetailRow
                label="Collections"
                value={item.collections.map((c) => c.name).join(', ')}
              />
            )}
            <DetailRow label="Created" value={fmtLongDate(item.createdAt)} />
            <DetailRow label="Updated" value={fmtLongDate(item.updatedAt)} />
          </div>
        </Section>
      </div>
    </form>
  )
}
