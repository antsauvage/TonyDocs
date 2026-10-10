import type { JSONContent } from '@tiptap/core'
import { generateHTML, generateJSON } from '@tiptap/html'
import { MarkdownManager } from '@tiptap/markdown'
import { contentExtensions } from '../editor/extensions'
import { countWords } from './format'

let extensions: ReturnType<typeof contentExtensions> | null = null
const exts = () => (extensions ??= contentExtensions())

let markdown: MarkdownManager | null = null

export function htmlToJSON(html: string): JSONContent {
  return generateJSON(html, exts())
}

export function markdownToJSON(md: string): JSONContent {
  markdown ??= new MarkdownManager({ extensions: exts() })
  return markdown.parse(md)
}

export function jsonToHTML(json: JSONContent): string {
  try {
    return generateHTML(json, exts())
  } catch {
    return ''
  }
}

/** Plain text of a document, walking the JSON tree (no editor instance needed). */
export function jsonToText(node: JSONContent): string {
  if (node.type === 'text') return node.text ?? ''
  if (node.type === 'hardBreak') return '\n'
  const inner = (node.content ?? []).map(jsonToText)
  return node.type === 'doc' || node.type?.endsWith('List') || node.type === 'tableRow' || node.type === 'table'
    ? inner.join('\n')
    : inner.join(node.content?.some((c) => c.type !== 'text' && c.type !== 'hardBreak') ? '\n' : '')
}

export function docStats(json: JSONContent) {
  const text = jsonToText(json)
  return {
    excerpt: text.replace(/\s+/g, ' ').trim().slice(0, 280),
    wordCount: countWords(text),
  }
}

/** First heading text, used as a fallback title when importing. */
export function firstHeading(json: JSONContent): string | undefined {
  const h = json.content?.find((n) => n.type === 'heading')
  return h ? jsonToText(h).trim() || undefined : undefined
}
