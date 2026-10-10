import { memo, useMemo } from 'react'
import type { JSONContent } from '@tiptap/core'
import { jsonToHTML } from '../../lib/content'

/** A real, scaled-down rendering of the document's first page. */
export const DocThumbnail = memo(function DocThumbnail({
  content,
  html,
  width,
}: {
  content?: JSONContent
  html?: string
  width: number
}) {
  const markup = useMemo(() => html ?? (content ? jsonToHTML(content) : ''), [content, html])
  const scale = width / 794
  return (
    <div className="relative overflow-hidden bg-page" style={{ width, height: width * 1.294 }} aria-hidden="true">
      <div
        className="doc-content thumb-page"
        style={{ transform: `scale(${scale})` }}
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    </div>
  )
})
