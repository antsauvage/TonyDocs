import { pickFile } from './download'

export interface ImportedFile {
  title: string
  content: string
  contentType: 'html' | 'markdown'
}

const escapeHtml = (s: string) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!)

export const IMPORT_ACCEPT = '.docx,.md,.markdown,.txt,.html,.htm'

/** Converts a user-picked file (Word, Markdown, HTML, text) into editor content. */
export async function importFile(file: File): Promise<ImportedFile> {
  const title = file.name.replace(/\.[^.]+$/, '')
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'docx') {
    const mammoth = (await import('mammoth/mammoth.browser.js')).default
    const { value } = await mammoth.convertToHtml(
      { arrayBuffer: await file.arrayBuffer() },
      { convertImage: mammoth.images.dataUri },
    )
    return { title, content: value, contentType: 'html' }
  }
  const text = await file.text()
  if (ext === 'md' || ext === 'markdown') return { title, content: text, contentType: 'markdown' }
  if (ext === 'html' || ext === 'htm') {
    const body = new DOMParser().parseFromString(text, 'text/html').body.innerHTML
    return { title, content: body, contentType: 'html' }
  }
  const html = text
    .split(/\r?\n\s*\r?\n/)
    .map((p) => `<p>${escapeHtml(p).replace(/\r?\n/g, '<br>')}</p>`)
    .join('')
  return { title, content: html, contentType: 'html' }
}

export async function pickAndImport() {
  const file = await pickFile(IMPORT_ACCEPT)
  return file ? importFile(file) : null
}
