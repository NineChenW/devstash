'use client'

import { useEffect, useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { iconMap, DefaultIcon } from '@/lib/icon-map'
import { createItem } from '@/actions/items'
import { CREATE_ITEM_TYPES, type CreateItemType } from '@/lib/validations/items'
import { CREATE_TYPE_META } from '@/lib/item-type-meta'
import { CodeEditor } from './CodeEditor'
import { MarkdownEditor } from './MarkdownEditor'
import { FileUpload, uploadFile, type PendingFile } from './FileUpload'

interface CreateItemDialogProps {
  open: boolean
  onClose: () => void
  defaultType?: CreateItemType
}

const TYPES_WITH_CONTENT = new Set<CreateItemType>(['snippet', 'prompt', 'command', 'note'])
const TYPES_WITH_LANGUAGE = new Set<CreateItemType>(['snippet', 'command'])
const TYPES_WITH_CODE_EDITOR = new Set<CreateItemType>(['snippet', 'command'])
const TYPES_WITH_MARKDOWN_EDITOR = new Set<CreateItemType>(['note', 'prompt'])
const TYPES_WITH_FILE_UPLOAD = new Set<CreateItemType>(['file', 'image'])

export function CreateItemDialog({ open, onClose, defaultType }: CreateItemDialogProps) {
  const router = useRouter()
  const initialType: CreateItemType = defaultType ?? 'snippet'
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
    }
    // pendingFile intentionally excluded — we only want this to fire on open/initialType change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialType])

  const showContent = TYPES_WITH_CONTENT.has(typeName)
  const showLanguage = TYPES_WITH_LANGUAGE.has(typeName)
  const showUrl = typeName === 'link'
  const showFileUpload = TYPES_WITH_FILE_UPLOAD.has(typeName)
  const useCodeEditor = TYPES_WITH_CODE_EDITOR.has(typeName)
  const useMarkdownEditor = TYPES_WITH_MARKDOWN_EDITOR.has(typeName)

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

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

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
        tags,
        fileUrl,
        fileName,
        fileSize,
      })

      if (!result.success) {
        const msg =
          result.fieldErrors?.fileUrl?.[0] ??
          result.fieldErrors?.url?.[0] ??
          result.fieldErrors?.title?.[0] ??
          result.error
        toast.error(msg)
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
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {CREATE_ITEM_TYPES.map((t) => {
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
            </Field>

            <Field label="Title" htmlFor="create-title">
              <Input
                id="create-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
                placeholder="Give it a name"
              />
            </Field>

            <Field label="Description" htmlFor="create-description">
              <textarea
                id="create-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Optional"
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </Field>

            {showContent && (
              <Field label="Content" htmlFor="create-content">
                {useCodeEditor ? (
                  <CodeEditor
                    value={content}
                    onChange={setContent}
                    language={language}
                  />
                ) : useMarkdownEditor ? (
                  <MarkdownEditor
                    value={content}
                    onChange={setContent}
                    placeholder={
                      typeName === 'note' ? 'Write your note in markdown…' : 'Write your prompt in markdown…'
                    }
                  />
                ) : (
                  <textarea
                    id="create-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    placeholder="Paste your code…"
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs leading-relaxed shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                )}
              </Field>
            )}

            {showLanguage && (
              <Field label="Language" htmlFor="create-language">
                <Input
                  id="create-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="e.g. typescript"
                />
              </Field>
            )}

            {showUrl && (
              <Field label="URL" htmlFor="create-url">
                <Input
                  id="create-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://…"
                  required
                />
              </Field>
            )}

            {showFileUpload && (
              <Field label={typeName === 'image' ? 'Image' : 'File'}>
                <FileUpload
                  kind={typeName === 'image' ? 'image' : 'file'}
                  value={pendingFile}
                  onChange={setPendingFile}
                  progress={uploadProgress}
                />
              </Field>
            )}

            <Field label="Tags" htmlFor="create-tags" hint="Comma-separated">
              <Input
                id="create-tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="react, hooks, ui"
              />
            </Field>
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

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {label}
        {hint && (
          <span className="ml-2 normal-case text-[10px] text-muted-foreground/70">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  )
}
