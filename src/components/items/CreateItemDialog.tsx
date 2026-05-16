'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { iconMap, DefaultIcon } from '@/lib/icon-map'
import { createItem } from '@/actions/items'
import { CREATE_ITEM_TYPES, type CreateItemType } from '@/lib/validations/items'
import {
  CREATE_TYPE_META,
  PRO_TYPES,
  TYPES_WITH_CONTENT,
  TYPES_WITH_FILE_UPLOAD,
  TYPES_WITH_LANGUAGE,
} from '@/lib/item-type-meta'
import { appendTagToInput, firstFieldError, parseTagsInput } from '@/lib/item-utils'
import { uploadFile } from '@/lib/upload'
import { AutoTagSuggestions } from './AutoTagSuggestions'
import { Field, ItemFormFields } from './ItemFormFields'
import { FileUpload, type PendingFile } from './FileUpload'
import { CollectionSelect } from '@/components/collections/CollectionSelect'
import { listMyCollections } from '@/actions/collections'
import type { UserCollectionOption } from '@/lib/db/collections'

interface CreateItemDialogProps {
  open: boolean
  onClose: () => void
  defaultType?: CreateItemType
  userIsPro?: boolean
}

export function CreateItemDialog({
  open,
  onClose,
  defaultType,
  userIsPro = false,
}: CreateItemDialogProps) {
  const router = useRouter()
  const availableTypes = userIsPro
    ? CREATE_ITEM_TYPES
    : CREATE_ITEM_TYPES.filter((t) => !PRO_TYPES.has(t))
  const safeDefault =
    defaultType && (userIsPro || !PRO_TYPES.has(defaultType)) ? defaultType : 'snippet'
  const initialType: CreateItemType = safeDefault
  const [typeName, setTypeName] = useState<CreateItemType>(initialType)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [language, setLanguage] = useState('')
  const [url, setUrl] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [collections, setCollections] = useState<UserCollectionOption[]>([])
  const [collectionsLoading, setCollectionsLoading] = useState(false)
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setTypeName(initialType)
    } else {
      setTypeName(initialType)
      setTitle('')
      setDescription('')
      setContent('')
      setLanguage('')
      setUrl('')
      setTagsInput('')
      if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl)
      setPendingFile(null)
      setUploadProgress(null)
      setSubmitting(false)
      setSelectedCollectionIds([])
    }
    // pendingFile intentionally excluded — we only want this to fire on open/initialType change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialType])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setCollectionsLoading(true)
    listMyCollections()
      .then((list) => {
        if (!cancelled) setCollections(list)
      })
      .catch((err) => {
        console.error('listMyCollections failed', err)
      })
      .finally(() => {
        if (!cancelled) setCollectionsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const showContent = TYPES_WITH_CONTENT.has(typeName)
  const showLanguage = TYPES_WITH_LANGUAGE.has(typeName)
  const showUrl = typeName === 'link'
  const showFileUpload = TYPES_WITH_FILE_UPLOAD.has(typeName)

  const titleTrimmed = title.trim()
  const urlTrimmed = url.trim()
  const canSubmit =
    titleTrimmed.length > 0 &&
    !submitting &&
    (!showUrl || urlTrimmed.length > 0) &&
    (!showFileUpload || pendingFile !== null)

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    try {
      let fileUrl: string | null = null
      let fileName: string | null = null
      let fileSize: number | null = null

      if (showFileUpload && pendingFile) {
        setUploadProgress(0)
        try {
          const uploaded = await uploadFile(
            pendingFile.file,
            typeName === 'image' ? 'image' : 'file',
            setUploadProgress,
          )
          fileUrl = uploaded.url
          fileName = uploaded.fileName
          fileSize = uploaded.fileSize
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Upload failed'
          toast.error(message)
          return
        } finally {
          setUploadProgress(null)
        }
      }

      const result = await createItem({
        typeName,
        title: titleTrimmed,
        description: description.trim() ? description : null,
        content: showContent && content.trim() ? content : null,
        url: showUrl && urlTrimmed ? urlTrimmed : null,
        language: showLanguage && language.trim() ? language : null,
        tags: parseTagsInput(tagsInput),
        fileUrl,
        fileName,
        fileSize,
        collectionIds: selectedCollectionIds,
      })

      if (!result.success) {
        toast.error(
          firstFieldError(result.fieldErrors, 'fileUrl', 'url', 'title') ?? result.error,
        )
        return
      }

      toast.success('Item created')
      onClose()
      router.refresh()
    } catch {
      toast.error('Failed to create item')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg border-[hsl(217.2_32.6%_25%)] bg-[hsl(217.2_32.6%_12%)] p-0">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <DialogHeader className="border-b border-[hsl(217.2_32.6%_22%)] px-6 py-4">
            <DialogTitle>New Item</DialogTitle>
            <DialogDescription>
              Save a new snippet, prompt, command, note, or link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5 max-h-[70vh] overflow-y-auto">
            <Field label="Type">
              <div
                className={`grid gap-2 ${userIsPro ? 'grid-cols-4 sm:grid-cols-7' : 'grid-cols-5'}`}
              >
                {availableTypes.map((t) => {
                  const meta = CREATE_TYPE_META[t]
                  const Icon = iconMap[meta.icon] || DefaultIcon
                  const active = typeName === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTypeName(t)}
                      aria-pressed={active}
                      className={
                        'flex flex-col items-center gap-1 rounded-md border p-2 text-xs transition-colors ' +
                        (active
                          ? 'border-[hsl(217.2_32.6%_45%)] bg-[hsl(217.2_32.6%_18%)] text-foreground'
                          : 'border-[hsl(217.2_32.6%_22%)] text-muted-foreground hover:border-[hsl(217.2_32.6%_35%)] hover:text-foreground')
                      }
                    >
                      <Icon className="h-4 w-4" style={{ color: meta.color }} />
                      <span>{meta.label}</span>
                    </button>
                  )
                })}
              </div>
              {!userIsPro && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Need files & images?{' '}
                  <Link
                    href="/settings#billing"
                    className="font-medium text-foreground underline-offset-2 hover:underline"
                    onClick={onClose}
                  >
                    Upgrade to Pro
                  </Link>
                </p>
              )}
            </Field>

            <ItemFormFields
              typeName={typeName}
              idPrefix="create"
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
              titlePlaceholder="Give it a name"
              descriptionPlaceholder="Optional"
              descriptionRows={2}
              contentPlaceholder="Paste your code…"
              contentRows={8}
              urlRequired
              extraBeforeTags={
                showFileUpload ? (
                  <Field label={typeName === 'image' ? 'Image' : 'File'}>
                    <FileUpload
                      kind={typeName === 'image' ? 'image' : 'file'}
                      value={pendingFile}
                      onChange={setPendingFile}
                      progress={uploadProgress}
                    />
                  </Field>
                ) : null
              }
              tagsBelow={
                userIsPro ? (
                  <AutoTagSuggestions
                    title={title}
                    content={content}
                    typeName={typeName}
                    tagsInput={tagsInput}
                    onAcceptTag={(tag) => setTagsInput((prev) => appendTagToInput(prev, tag))}
                  />
                ) : null
              }
              extraAfterTags={
                <Field label="Collections">
                  <CollectionSelect
                    collections={collections}
                    value={selectedCollectionIds}
                    onChange={setSelectedCollectionIds}
                    loading={collectionsLoading}
                  />
                </Field>
              }
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[hsl(217.2_32.6%_22%)] px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {uploadProgress !== null
                ? `Uploading ${uploadProgress}%`
                : submitting
                  ? 'Creating…'
                  : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
