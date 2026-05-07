'use client'

import { Input } from '@/components/ui/input'
import {
  TYPES_WITH_CODE_EDITOR,
  TYPES_WITH_CONTENT,
  TYPES_WITH_LANGUAGE,
  TYPES_WITH_MARKDOWN_EDITOR,
} from '@/lib/item-type-meta'
import { CodeEditor } from './CodeEditor'
import { MarkdownEditor } from './MarkdownEditor'

interface ItemFormFieldsProps {
  typeName: string
  idPrefix: string

  title: string
  setTitle: (v: string) => void
  description: string
  setDescription: (v: string) => void
  content: string
  setContent: (v: string) => void
  language: string
  setLanguage: (v: string) => void
  url: string
  setUrl: (v: string) => void
  tagsInput: string
  setTagsInput: (v: string) => void

  titlePlaceholder?: string
  descriptionPlaceholder?: string
  descriptionRows?: number
  contentPlaceholder?: string
  contentRows?: number
  urlRequired?: boolean

  /** Optional slot rendered between the URL field and the Tags field. */
  extraBeforeTags?: React.ReactNode
  /** Optional slot rendered after the Tags field. */
  extraAfterTags?: React.ReactNode
}

export function ItemFormFields({
  typeName,
  idPrefix,
  title,
  setTitle,
  description,
  setDescription,
  content,
  setContent,
  language,
  setLanguage,
  url,
  setUrl,
  tagsInput,
  setTagsInput,
  titlePlaceholder,
  descriptionPlaceholder,
  descriptionRows = 3,
  contentPlaceholder,
  contentRows = 10,
  urlRequired = false,
  extraBeforeTags,
  extraAfterTags,
}: ItemFormFieldsProps) {
  const showContent = TYPES_WITH_CONTENT.has(typeName)
  const showLanguage = TYPES_WITH_LANGUAGE.has(typeName)
  const showUrl = typeName === 'link'
  const useCodeEditor = TYPES_WITH_CODE_EDITOR.has(typeName)
  const useMarkdownEditor = TYPES_WITH_MARKDOWN_EDITOR.has(typeName)

  return (
    <>
      <Field label="Title" htmlFor={`${idPrefix}-title`}>
        <Input
          id={`${idPrefix}-title`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
          placeholder={titlePlaceholder}
        />
      </Field>

      <Field label="Description" htmlFor={`${idPrefix}-description`}>
        <textarea
          id={`${idPrefix}-description`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={descriptionRows}
          placeholder={descriptionPlaceholder}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </Field>

      {showContent && (
        <Field label="Content" htmlFor={`${idPrefix}-content`}>
          {useCodeEditor ? (
            <CodeEditor value={content} onChange={setContent} language={language} />
          ) : useMarkdownEditor ? (
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder={
                typeName === 'note'
                  ? 'Write your note in markdown…'
                  : 'Write your prompt in markdown…'
              }
            />
          ) : (
            <textarea
              id={`${idPrefix}-content`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={contentRows}
              placeholder={contentPlaceholder}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs leading-relaxed shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          )}
        </Field>
      )}

      {showLanguage && (
        <Field label="Language" htmlFor={`${idPrefix}-language`}>
          <Input
            id={`${idPrefix}-language`}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="e.g. typescript"
          />
        </Field>
      )}

      {showUrl && (
        <Field label="URL" htmlFor={`${idPrefix}-url`}>
          <Input
            id={`${idPrefix}-url`}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            required={urlRequired}
          />
        </Field>
      )}

      {extraBeforeTags}

      <Field label="Tags" htmlFor={`${idPrefix}-tags`} hint="Comma-separated">
        <Input
          id={`${idPrefix}-tags`}
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="react, hooks, ui"
        />
      </Field>

      {extraAfterTags}
    </>
  )
}

interface FieldProps {
  label: string
  htmlFor?: string
  hint?: string
  children: React.ReactNode
}

export function Field({ label, htmlFor, hint, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {label}
        {hint && (
          <span className="ml-2 normal-case text-[10px] text-muted-foreground/70">{hint}</span>
        )}
      </label>
      {children}
    </div>
  )
}
