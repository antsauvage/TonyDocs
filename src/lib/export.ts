import type { Editor, JSONContent } from '@tiptap/core'
import { downloadBlob, safeFilename } from './download'

/* ---------------------------------------------------------------------------
   Simple formats
   ------------------------------------------------------------------------ */

export function exportMarkdown(editor: Editor, title: string) {
  const md = editor.getMarkdown()
  downloadBlob(new Blob([md], { type: 'text/markdown;charset=utf-8' }), `${safeFilename(title)}.md`)
}

export function exportText(editor: Editor, title: string) {
  const text = editor.getText({ blockSeparator: '\n\n' })
  downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${safeFilename(title)}.txt`)
}

export function exportHtml(editor: Editor, title: string) {
  const safeTitle = title.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!)
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
<style>
  body { max-width: 720px; margin: 48px auto; padding: 0 24px; font: 16px/1.6 Inter, Arial, sans-serif; color: #1f1f1f; }
  h1, h2, h3 { line-height: 1.25; }
  img { max-width: 100%; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #c7ccd3; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f3f6fb; }
  blockquote { border-left: 3px solid #0b57d0; margin-left: 0; padding-left: 1em; color: #555; font-style: italic; }
  pre { background: #1e1f24; color: #e6e6e6; padding: 14px 16px; border-radius: 8px; overflow-x: auto; }
  ul[data-type="taskList"] { list-style: none; padding-left: 0; }
  ul[data-type="taskList"] li { display: flex; gap: .5em; }
  ul[data-type="taskList"] p { margin: 0; }
</style>
</head>
<body>
${editor.getHTML()}
</body>
</html>`
  downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `${safeFilename(title)}.html`)
}

/** PDF export goes through the browser's print engine: vector text, real fonts, selectable output. */
export function exportPdf(title: string) {
  const previous = document.title
  document.title = safeFilename(title) // becomes the suggested PDF filename
  window.print()
  document.title = previous
}

/* ---------------------------------------------------------------------------
   Microsoft Word (.docx)
   ------------------------------------------------------------------------ */

type Docx = typeof import('docx')

const FONT_ALIASES: Record<string, string> = {
  'Inter Variable': 'Inter',
  'Lora Variable': 'Lora',
  'Roboto Flex Variable': 'Roboto',
  'Playfair Display Variable': 'Playfair Display',
  'JetBrains Mono Variable': 'JetBrains Mono',
  'Source Serif 4 Variable': 'Source Serif 4',
}

const cleanFont = (family?: string) => {
  const first = family?.split(',')[0].trim().replace(/^['"]|['"]$/g, '')
  return first ? (FONT_ALIASES[first] ?? first) : undefined
}

const hex = (color?: string | null) => {
  if (!color) return undefined
  const c = color.trim()
  if (/^#[0-9a-f]{6}$/i.test(c)) return c.slice(1).toUpperCase()
  if (/^#[0-9a-f]{3}$/i.test(c)) return c.slice(1).split('').map((x) => x + x).join('').toUpperCase()
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (m) return m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, '0')).join('').toUpperCase()
  return undefined
}

/** CSS font-size ("11pt", "14px") → docx half-points. */
const halfPoints = (size?: string) => {
  if (!size) return undefined
  const n = parseFloat(size)
  if (Number.isNaN(n)) return undefined
  return Math.round((size.endsWith('px') ? n * 0.75 : n) * 2)
}

async function loadImage(src: string): Promise<{ data: Uint8Array; type: 'png' | 'jpg' | 'gif' | 'bmp'; width: number; height: number } | null> {
  try {
    const blob = await (await fetch(src)).blob()
    const bitmap = await createImageBitmap(blob)
    const { width, height } = bitmap
    bitmap.close()
    let type: 'png' | 'jpg' | 'gif' | 'bmp' = 'png'
    let data = new Uint8Array(await blob.arrayBuffer())
    if (blob.type.includes('jpeg') || blob.type.includes('jpg')) type = 'jpg'
    else if (blob.type.includes('gif')) type = 'gif'
    else if (blob.type.includes('bmp')) type = 'bmp'
    else if (!blob.type.includes('png')) {
      // webp, svg…: rasterise to PNG, which every Word version understands.
      const canvas = new OffscreenCanvas(width, height)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(await createImageBitmap(blob), 0, 0)
      data = new Uint8Array(await (await canvas.convertToBlob({ type: 'image/png' })).arrayBuffer())
    }
    return { data, type, width, height }
  } catch {
    return null
  }
}

interface Ctx {
  d: Docx
  listInstance: number
}

function runsFor(ctx: Ctx, nodes: JSONContent[] = [], extra: Record<string, unknown> = {}) {
  const { d } = ctx
  const out: InstanceType<Docx['TextRun'] | Docx['ExternalHyperlink']>[] = []
  for (const node of nodes) {
    if (node.type === 'hardBreak') {
      out.push(new d.TextRun({ break: 1 }))
      continue
    }
    if (node.type !== 'text') continue
    const opts: Record<string, unknown> = { text: node.text ?? '', ...extra }
    let link: string | undefined
    for (const mark of node.marks ?? []) {
      const a = mark.attrs ?? {}
      switch (mark.type) {
        case 'bold':
          opts.bold = true
          break
        case 'italic':
          opts.italics = true
          break
        case 'underline':
          opts.underline = {}
          break
        case 'strike':
          opts.strike = true
          break
        case 'subscript':
          opts.subScript = true
          break
        case 'superscript':
          opts.superScript = true
          break
        case 'code':
          opts.font = 'Consolas'
          opts.shading = { type: d.ShadingType.CLEAR, color: 'auto', fill: 'F1F3F4' }
          break
        case 'highlight':
          opts.shading = { type: d.ShadingType.CLEAR, color: 'auto', fill: hex(a.color) ?? 'FFF2CC' }
          break
        case 'textStyle':
          if (hex(a.color)) opts.color = hex(a.color)
          if (cleanFont(a.fontFamily)) opts.font = cleanFont(a.fontFamily)
          if (halfPoints(a.fontSize)) opts.size = halfPoints(a.fontSize)
          break
        case 'link':
          link = a.href
          break
      }
    }
    if (link) {
      out.push(new d.ExternalHyperlink({ link, children: [new d.TextRun({ ...opts, style: 'Hyperlink' })] }))
    } else {
      out.push(new d.TextRun(opts))
    }
  }
  return out
}

const ALIGN = (d: Docx, a?: string) =>
  a === 'center' ? d.AlignmentType.CENTER : a === 'right' ? d.AlignmentType.RIGHT : a === 'justify' ? d.AlignmentType.JUSTIFIED : undefined

function paragraphProps(d: Docx, attrs: Record<string, any> = {}) {
  return {
    alignment: ALIGN(d, attrs.textAlign),
    indent: attrs.indent ? { left: attrs.indent * 720 } : undefined,
    spacing: attrs.lineHeight ? { line: Math.round(parseFloat(attrs.lineHeight) * 240) } : undefined,
  }
}

const emboldenBlock = (node: JSONContent): JSONContent =>
  node.type === 'text'
    ? { ...node, marks: [...(node.marks ?? []).filter((m) => m.type !== 'bold'), { type: 'bold' }] }
    : { ...node, content: node.content?.map(emboldenBlock) }

async function blocksFor(ctx: Ctx, nodes: JSONContent[] = [], level = 0): Promise<any[]> {
  const { d } = ctx
  const out: any[] = []
  for (const node of nodes) {
    const attrs = node.attrs ?? {}
    switch (node.type) {
      case 'paragraph':
        out.push(new d.Paragraph({ children: runsFor(ctx, node.content), ...paragraphProps(d, attrs) }))
        break
      case 'heading': {
        const levels = [d.HeadingLevel.HEADING_1, d.HeadingLevel.HEADING_2, d.HeadingLevel.HEADING_3, d.HeadingLevel.HEADING_4]
        out.push(new d.Paragraph({ heading: levels[(attrs.level ?? 1) - 1], children: runsFor(ctx, node.content), ...paragraphProps(d, attrs) }))
        break
      }
      case 'bulletList':
      case 'orderedList':
      case 'taskList': {
        const instance = ++ctx.listInstance
        for (const item of node.content ?? []) {
          const [first, ...rest] = item.content ?? []
          const prefix = node.type === 'taskList' ? (item.attrs?.checked ? '☑ ' : '☐ ') : ''
          const listProps =
            node.type === 'bulletList'
              ? { bullet: { level } }
              : node.type === 'orderedList'
                ? { numbering: { reference: 'ordered', level, instance } }
                : { indent: { left: 360 * (level + 1) } }
          const runs = runsFor(ctx, first?.content)
          out.push(new d.Paragraph({ ...listProps, children: prefix ? [new d.TextRun(prefix), ...runs] : runs }))
          for (const child of rest) out.push(...(await blocksFor(ctx, [child], level + 1)))
        }
        break
      }
      case 'blockquote':
        for (const child of node.content ?? []) {
          out.push(
            new d.Paragraph({
              children: runsFor(ctx, child.content, { italics: true, color: '555555' }),
              indent: { left: 400 },
              border: { left: { style: d.BorderStyle.SINGLE, size: 18, color: '0B57D0', space: 12 } },
            }),
          )
        }
        break
      case 'codeBlock': {
        const lines = (node.content?.map((c) => c.text ?? '').join('') ?? '').split('\n')
        for (const line of lines) {
          out.push(
            new d.Paragraph({
              children: [new d.TextRun({ text: line, font: 'Consolas', size: 19 })],
              shading: { type: d.ShadingType.CLEAR, color: 'auto', fill: 'F1F3F4' },
              spacing: { after: 0 },
            }),
          )
        }
        break
      }
      case 'horizontalRule':
        out.push(new d.Paragraph({ border: { bottom: { style: d.BorderStyle.SINGLE, size: 6, color: 'C7CCD3', space: 1 } } }))
        break
      case 'image': {
        const img = attrs.src ? await loadImage(attrs.src) : null
        if (!img) break
        const maxWidth = 600 // ~ printable width of an A4 page at 96 dpi
        const width = Math.min(attrs.width ?? img.width, maxWidth)
        const height = Math.round((img.height / img.width) * width)
        out.push(
          new d.Paragraph({
            children: [new d.ImageRun({ type: img.type, data: img.data, transformation: { width, height } })],
          }),
        )
        break
      }
      case 'table': {
        const rows = []
        for (const row of node.content ?? []) {
          const cells = []
          for (const cell of row.content ?? []) {
            const isHeader = cell.type === 'tableHeader'
            const content = isHeader ? cell.content?.map(emboldenBlock) : cell.content
            const children = await blocksFor(ctx, content, 0)
            cells.push(
              new d.TableCell({
                children: children.length ? children : [new d.Paragraph('')],
                columnSpan: cell.attrs?.colspan ?? 1,
                rowSpan: cell.attrs?.rowspan ?? 1,
                shading: isHeader ? { type: d.ShadingType.CLEAR, color: 'auto', fill: 'F3F6FB' } : undefined,
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
              }),
            )
          }
          rows.push(new d.TableRow({ children: cells }))
        }
        out.push(new d.Table({ rows, width: { size: 100, type: d.WidthType.PERCENTAGE } }))
        out.push(new d.Paragraph(''))
        break
      }
    }
  }
  return out
}

export async function exportDocx(content: JSONContent, title: string) {
  const d = await import('docx')
  const children = await blocksFor({ d, listInstance: 0 }, content.content)
  const doc = new d.Document({
    title: title || 'Document sans titre',
    creator: 'TonyDocs',
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 22 }, paragraph: { spacing: { after: 120, line: 300 } } },
        heading1: { run: { size: 40, bold: true, color: '1F1F1F' }, paragraph: { spacing: { before: 360, after: 120 } } },
        heading2: { run: { size: 32, bold: true, color: '1F1F1F' }, paragraph: { spacing: { before: 280, after: 100 } } },
        heading3: { run: { size: 27, bold: true, color: '1F1F1F' }, paragraph: { spacing: { before: 240, after: 80 } } },
        heading4: { run: { size: 24, bold: true, color: '444746' }, paragraph: { spacing: { before: 200, after: 80 } } },
      },
    },
    numbering: {
      config: [
        {
          reference: 'ordered',
          levels: [0, 1, 2, 3, 4].map((level) => ({
            level,
            format: [d.LevelFormat.DECIMAL, d.LevelFormat.LOWER_LETTER, d.LevelFormat.LOWER_ROMAN][level % 3],
            text: `%${level + 1}.`,
            alignment: d.AlignmentType.START,
            style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } },
          })),
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4 in twips
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  })
  const blob = await d.Packer.toBlob(doc)
  downloadBlob(blob, `${safeFilename(title)}.docx`)
}
