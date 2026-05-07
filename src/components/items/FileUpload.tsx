'use client'

import { useEffect, useRef, useState } from 'react'
import { File as FileIcon, Image as ImageIcon, Upload, X } from 'lucide-react'
import {
  FILE_ACCEPT,
  IMAGE_ACCEPT,
  formatBytes,
  validateUpload,
  type UploadKind,
} from '@/lib/file-constraints'

export interface PendingFile {
  file: File
  previewUrl?: string
}

interface FileUploadProps {
  kind: UploadKind
  value: PendingFile | null
  onChange: (file: PendingFile | null) => void
  /** When non-null (0–100), shows an upload progress bar on the preview. */
  progress?: number | null
}

export function FileUpload({ kind, value, onChange, progress = null }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const accept = kind === 'image' ? IMAGE_ACCEPT : FILE_ACCEPT
  const uploading = progress !== null

  useEffect(() => {
    return () => {
      if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl)
    }
    // We only want to revoke when the FileUpload itself unmounts; the parent
    // is responsible for calling onChange(null) on intentional removal, which
    // also revokes via clearFile below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pickFile() {
    if (uploading) return
    inputRef.current?.click()
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    setError(null)

    const validation = validateUpload(kind, file.name, file.size, file.type)
    if (!validation.ok) {
      setError(validation.error)
      return
    }

    if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl)
    const previewUrl = kind === 'image' ? URL.createObjectURL(file) : undefined
    onChange({ file, previewUrl })
  }

  function clearFile() {
    if (uploading) return
    if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl)
    onChange(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  if (value) {
    return (
      <div className="rounded-md border border-[hsl(217.2_32.6%_22%)] bg-[hsl(217.2_32.6%_14%)] p-3">
        <div className="flex items-start gap-3">
          {kind === 'image' && value.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.previewUrl}
              alt={value.file.name}
              className="h-16 w-16 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted">
              {kind === 'image' ? (
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <FileIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="break-all text-sm font-medium" title={value.file.name}>
              {value.file.name}
            </div>
            <div className="text-xs text-muted-foreground">{formatBytes(value.file.size)}</div>
            {uploading && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[hsl(217.2_32.6%_22%)]">
                  <div
                    className="h-full bg-foreground/70 transition-all"
                    style={{ width: `${progress ?? 0}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{progress}%</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={clearFile}
            disabled={uploading}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        onClick={pickFile}
        onDragOver={(e) => {
          e.preventDefault()
          if (!uploading) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            pickFile()
          }
        }}
        className={
          'flex flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-8 text-sm transition-colors ' +
          (dragOver
            ? 'cursor-copy border-[hsl(217.2_32.6%_45%)] bg-[hsl(217.2_32.6%_18%)]'
            : 'cursor-pointer border-[hsl(217.2_32.6%_28%)] bg-[hsl(217.2_32.6%_14%)] hover:border-[hsl(217.2_32.6%_38%)]')
        }
      >
        <Upload className="h-5 w-5 text-muted-foreground" />
        <div className="text-foreground/90">
          Drop {kind === 'image' ? 'an image' : 'a file'} here, or click to browse
        </div>
        <div className="text-xs text-muted-foreground">
          {kind === 'image'
            ? 'PNG, JPG, GIF, WEBP, SVG · up to 5 MB'
            : 'PDF, TXT, MD, JSON, YAML, XML, CSV, TOML, INI · up to 10 MB'}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}

