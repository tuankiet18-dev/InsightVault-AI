import { useEffect, useRef } from 'react'
import { AlertCircle, Download, FileText, Loader2 } from 'lucide-react'
import { useDocumentOriginalAccess, useDocumentOriginalText } from '@/hooks/useDocuments'
import type { DocumentDto } from '@/types/api'

export function DocumentOriginalViewer({
  document,
  sourceSnippet,
  sourcePageNumber,
}: {
  document: DocumentDto
  sourceSnippet?: string
  sourcePageNumber?: number | null
}) {
  const accessQuery = useDocumentOriginalAccess(document.id)
  const access = accessQuery.data
  const textQuery = useDocumentOriginalText(document.id, access?.previewKind === 'text')

  if (accessQuery.isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-border bg-surface-0 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Preparing original file preview...
      </div>
    )
  }

  if (accessQuery.isError || !access) {
    return (
      <PreviewNotice
        tone="danger"
        title="Original file is unavailable"
        detail="The document metadata is available, but the uploaded object could not be prepared for preview."
      />
    )
  }

  if (access.previewKind === 'pdf') {
    return (
      <section className="flex flex-1 flex-col overflow-hidden min-h-0 bg-background">
        <iframe
          src={sourcePageNumber ? `${access.downloadUrl}#page=${sourcePageNumber}` : access.downloadUrl}
          title={`Original PDF preview for ${access.fileName}`}
          className="flex-1 w-full bg-white"
        />
      </section>
    )
  }

  if (access.previewKind === 'text') {
    return (
      <section className="flex flex-1 flex-col overflow-hidden min-h-0 bg-background">
        {textQuery.isLoading ? (
          <div className="flex min-h-[360px] items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading text preview...
          </div>
        ) : textQuery.isError || !textQuery.data ? (
          <PreviewNotice
            tone="warning"
            title="Text preview could not be loaded"
            detail="Download the original file, or try again after the object storage service is ready."
          />
        ) : (
          <TextPreview content={textQuery.data.content} sourceSnippet={sourceSnippet} />
        )}
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-border bg-surface-0 p-8">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <FileText className="h-6 w-6" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">Inline preview is not available</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This file type cannot be rendered as the original browser preview. Use Extracted Text or Chunks after processing, or download the original file.
        </p>
        <a
          href={access.downloadUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
        >
          <Download className="h-4 w-4" />
          Download original
        </a>
      </div>
    </section>
  )
}

function TextPreview({ content, sourceSnippet }: { content: string; sourceSnippet?: string }) {
  const match = findSnippetMatch(content, sourceSnippet)
  const markRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    markRef.current?.scrollIntoView({ block: 'center' })
  }, [match?.start])

  if (!match) {
    return (
      <pre className="max-h-[calc(100dvh-220px)] overflow-auto whitespace-pre-wrap p-6 font-mono text-[13px] leading-6 text-foreground">
        {content}
      </pre>
    )
  }

  return (
    <pre className="max-h-[calc(100dvh-220px)] overflow-auto whitespace-pre-wrap p-6 font-mono text-[13px] leading-6 text-foreground">
      {content.slice(0, match.start)}
      <mark ref={markRef} className="rounded bg-ai-100 px-0.5 text-ai-950 ring-1 ring-ai-200">
        {content.slice(match.start, match.end)}
      </mark>
      {content.slice(match.end)}
    </pre>
  )
}

function findSnippetMatch(content: string, snippet?: string) {
  const rawSnippet = snippet?.replace(/\.\.\.$/, '').trim()
  const normalizedSnippet = rawSnippet?.replace(/\s+/g, ' ').trim()
  if (!rawSnippet || !normalizedSnippet) return null

  const candidates = [
    rawSnippet,
    normalizedSnippet,
    normalizedSnippet.slice(0, 180),
    normalizedSnippet.slice(0, 120),
  ].filter(candidate => candidate.length >= 24)

  for (const candidate of candidates) {
    const index = content.toLowerCase().indexOf(candidate.toLowerCase())
    if (index >= 0) {
      return { start: index, end: index + candidate.length }
    }
  }

  return null
}

function PreviewNotice({
  title,
  detail,
  tone,
}: {
  title: string
  detail: string
  tone: 'danger' | 'warning'
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-0 p-8 text-center">
      <AlertCircle className={tone === 'danger' ? 'mb-3 h-6 w-6 text-danger-600' : 'mb-3 h-6 w-6 text-warning-600'} />
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  )
}
