import { describe, expect, it } from 'vitest'
import {
  safeColor,
  safeFontFamily,
  safeFontSize,
  safeHref,
  safeImageSrc,
  safeIndent,
  safeLineHeight,
  sanitizeDoc,
} from '../src/lib/sanitize'

describe('safeHref', () => {
  it.each(['https://exemple.fr', 'http://a.b/c?d=e', 'mailto:a@b.fr', 'tel:+33123456789', '#section', '/chemin', 'page.html'])(
    'accepte %s',
    (url) => expect(safeHref(url)).toBe(url),
  )
  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    '\u0000javascript:alert(1)',
    'vbscript:msgbox(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
    '',
    null,
    42,
  ])('refuse %j', (url) => expect(safeHref(url)).toBeNull())
})

describe('safeImageSrc', () => {
  it.each(['https://exemple.fr/a.png', 'blob:https://exemple.fr/uuid', 'data:image/png;base64,iVBORw0KGgo=', 'data:image/svg+xml;base64,PHN2Zz4='])(
    'accepte %s',
    (src) => expect(safeImageSrc(src)).toBe(src),
  )
  it.each(['javascript:alert(1)', 'data:text/html;base64,PHNjcmlwdD4=', 'data:image/png,<svg onload=alert(1)>', '/relative.png', 'x', null])(
    'refuse %j',
    (src) => expect(safeImageSrc(src)).toBeNull(),
  )
})

describe('valeurs CSS', () => {
  it('couleurs', () => {
    expect(safeColor('#ff0000')).toBe('#ff0000')
    expect(safeColor('rgb(255, 0, 0)')).toBe('rgb(255, 0, 0)')
    expect(safeColor('red')).toBe('red')
    expect(safeColor('red; background: url(https://evil.example/x)')).toBeNull()
    expect(safeColor('expression(alert(1))')).toBeNull()
  })
  it('tailles et polices', () => {
    expect(safeFontSize('11pt')).toBe('11pt')
    expect(safeFontSize('11pt; background:url(x)')).toBeNull()
    expect(safeFontFamily("'Inter Variable', Arial")).toBe("'Inter Variable', Arial")
    expect(safeFontFamily('x; background:url(https://evil.example)')).toBeNull()
  })
  it('interligne et retrait', () => {
    expect(safeLineHeight('1.15')).toBe('1.15')
    expect(safeLineHeight('1;background:url(x)')).toBeNull()
    expect(safeLineHeight('99')).toBeNull()
    expect(safeIndent('3')).toBe(3)
    expect(safeIndent('1e9')).toBe(8)
    expect(safeIndent('-4')).toBe(0)
    expect(safeIndent('abc')).toBe(0)
  })
})

describe('sanitizeDoc', () => {
  it('retire les liens et images dangereux et neutralise les styles injectés', () => {
    const doc = sanitizeDoc({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { lineHeight: '1;background:url(https://evil.example/a)', indent: 'x' },
          content: [
            {
              type: 'text',
              text: 'clic',
              marks: [
                { type: 'link', attrs: { href: 'javascript:alert(1)' } },
                { type: 'textStyle', attrs: { color: 'red;background:url(https://evil.example/b)', fontSize: '12pt' } },
              ],
            },
          ],
        },
        { type: 'image', attrs: { src: 'javascript:alert(1)' } },
        { type: 'image', attrs: { src: 'https://exemple.fr/ok.png' } },
      ],
    })
    const json = JSON.stringify(doc)
    expect(json).not.toMatch(/javascript:|evil\.example/)
    expect(doc.content).toHaveLength(2)
    expect(doc.content![0].content![0].marks!.map((m) => m.type)).toEqual(['textStyle'])
    expect(doc.content![0].content![0].marks![0].attrs!.fontSize).toBe('12pt')
    expect(doc.content![1].attrs!.src).toBe('https://exemple.fr/ok.png')
  })
})
