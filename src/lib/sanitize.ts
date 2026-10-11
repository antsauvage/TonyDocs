import type { JSONContent } from '@tiptap/core'

/*
 * Allow-list validation for every value that ends up in an `href`, a `src` or a
 * `style` attribute. Content can come from untrusted places (imported files,
 * pasted HTML, a tampered IndexedDB), so it is validated on the way in, and the
 * editor's own extensions validate again when rendering.
 */

// Browsers ignore control characters and whitespace inside a URL scheme ("java\tscript:").
const stripInvisible = (s: string) => s.replace(/[\u0000-\u0020\u007f-\u009f\u200b-\u200f\u2028\u2029\ufeff]/g, '')
const SCHEME = /^([a-z][a-z0-9+.-]*):/i

const LINK_SCHEMES = new Set(['http', 'https', 'mailto', 'tel'])
const IMAGE_SCHEMES = new Set(['http', 'https', 'blob'])
const DATA_IMAGE = /^data:image\/(png|jpe?g|gif|webp|avif|bmp|svg\+xml);base64,[a-z0-9+/=\s]+$/i

/** Link targets: http(s), mailto, tel, or relative / in-page references. */
export function safeHref(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const scheme = stripInvisible(trimmed).match(SCHEME)?.[1].toLowerCase()
  if (scheme === undefined) return trimmed // relative URL, #anchor, /path
  return LINK_SCHEMES.has(scheme) ? trimmed : null
}

/** Image sources: http(s), blob:, or base64 raster/SVG data URLs (SVG in <img> cannot run script). */
export function safeImageSrc(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  const scheme = stripInvisible(trimmed).match(SCHEME)?.[1].toLowerCase()
  if (scheme === 'data') return DATA_IMAGE.test(trimmed) ? trimmed : null
  return scheme && IMAGE_SCHEMES.has(scheme) ? trimmed : null
}

/* -------------------------------------------------------------------------- CSS values */

const COLOR = /^(#[0-9a-f]{3,8}|(rgb|hsl)a?\(\s*[\d.,%\s/deg-]+\)|[a-z]{3,20})$/i
const FONT_SIZE = /^\d{1,3}(\.\d{1,2})?(pt|px|em|rem|%)$/
const FONT_FAMILY = /^[\w\s,'"-]{1,100}$/
const ALIGNMENTS = new Set(['left', 'center', 'right', 'justify'])

export const safeColor = (v: unknown) => (typeof v === 'string' && COLOR.test(v.trim()) ? v.trim() : null)
export const safeFontSize = (v: unknown) => (typeof v === 'string' && FONT_SIZE.test(v.trim()) ? v.trim() : null)
export const safeFontFamily = (v: unknown) => (typeof v === 'string' && FONT_FAMILY.test(v.trim()) ? v.trim() : null)
export const safeTextAlign = (v: unknown) => (typeof v === 'string' && ALIGNMENTS.has(v) ? v : null)

/** Unitless line height between 0.5 and 4. */
export function safeLineHeight(v: unknown): string | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && /^\d+(\.\d+)?$/.test(v.trim()) ? Number(v) : NaN
  return n >= 0.5 && n <= 4 ? String(n) : null
}

/** Integer indentation level between 0 and 8. */
export function safeIndent(v: unknown): number {
  const n = Math.trunc(Number(v))
  return Number.isFinite(n) ? Math.min(8, Math.max(0, n)) : 0
}

/* -------------------------------------------------------------------------- documents */

const MAX_DEPTH = 100

function cleanAttrs(type: string | undefined, attrs: Record<string, unknown>): Record<string, unknown> {
  const out = { ...attrs }
  if ('lineHeight' in out) out.lineHeight = safeLineHeight(out.lineHeight)
  if ('indent' in out) out.indent = safeIndent(out.indent)
  if ('textAlign' in out) out.textAlign = safeTextAlign(out.textAlign)
  if (type === 'image') out.src = safeImageSrc(out.src)
  if (type === 'link') out.href = safeHref(out.href)
  if (type === 'textStyle' || type === 'highlight') {
    if ('color' in out) out.color = safeColor(out.color)
    if ('fontSize' in out) out.fontSize = safeFontSize(out.fontSize)
    if ('fontFamily' in out) out.fontFamily = safeFontFamily(out.fontFamily)
  }
  return out
}

/**
 * Returns a copy of a Tiptap JSON document with every URL and style value validated.
 * Unsafe links lose their link mark (text is kept); unsafe images are dropped.
 */
export function sanitizeDoc(node: JSONContent, depth = 0): JSONContent {
  if (depth > MAX_DEPTH) return { type: 'paragraph' }
  const out: JSONContent = { ...node }
  if (node.attrs) out.attrs = cleanAttrs(node.type, node.attrs)
  if (node.marks) {
    out.marks = node.marks
      .map((m) => (m.attrs ? { ...m, attrs: cleanAttrs(m.type, m.attrs) } : m))
      .filter((m) => m.type !== 'link' || m.attrs?.href)
  }
  if (node.content) {
    out.content = node.content
      .filter((child) => child.type !== 'image' || safeImageSrc(child.attrs?.src))
      .map((child) => sanitizeDoc(child, depth + 1))
  }
  return out
}
