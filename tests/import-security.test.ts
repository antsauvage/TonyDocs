import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/core'
import { importFile } from '../src/lib/import'
import { htmlToJSON, jsonToHTML, markdownToJSON } from '../src/lib/content'
import { contentExtensions } from '../src/editor/extensions'

/** Anything that could run script or leak a request to the attacker's server. */
const DANGEROUS = /javascript:|data:text\/html|\son[a-z]+=|<script|<iframe|<svg|evil\.example/i

const fixture = (name: string) => new File([readFileSync(resolve('tests/fixtures', name))], name)

async function importToHTML(file: File) {
  const imported = await importFile(file)
  const json = imported.contentType === 'markdown' ? markdownToJSON(imported.content) : htmlToJSON(imported.content)
  return { json: JSON.stringify(json), html: jsonToHTML(json) }
}

describe('import de fichiers piégés', () => {
  it.each(['evil.html', 'evil.md', 'evil.docx'])('%s ne laisse passer aucun contenu dangereux', async (name) => {
    const { json, html } = await importToHTML(fixture(name))
    expect(json).not.toMatch(DANGEROUS)
    expect(html).not.toMatch(DANGEROUS)
  })

  it('conserve le contenu légitime', async () => {
    const { html } = await importToHTML(fixture('evil.html'))
    expect(html).toMatch(/<h1[^>]*>Titre<\/h1>/)
    expect(html).toContain('lien JS') // link text kept, link removed
  })

  it('refuse les fichiers trop volumineux et les formats inconnus', async () => {
    const big = new File([new Uint8Array(26 * 1024 * 1024)], 'gros.txt')
    await expect(importFile(big)).rejects.toThrow(/trop volumineux/)
    await expect(importFile(new File(['x'], 'script.exe'))).rejects.toThrow(/non pris en charge/)
  })
})

describe('collage de HTML (analyse par le schéma)', () => {
  it('neutralise les attributs de style et de couleur injectés', () => {
    const html = htmlToJSON(
      `<p><mark data-color="red;background:url(https://evil.example/z)">surligné</mark>
       <span style="color: red" data-x="1">rouge</span>
       <a href=" java&#x09;script:alert(1)">lien</a></p>
       <p data-indent="2;background:url(https://evil.example/i)">retrait</p>`,
    )
    expect(JSON.stringify(html)).not.toMatch(DANGEROUS)
  })
})

describe("rendu d'un document stocké altéré (défense en profondeur)", () => {
  const tampered = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        attrs: { lineHeight: '1;background:url(https://evil.example/a)', indent: '2;x' },
        content: [
          {
            type: 'text',
            text: 'clic',
            marks: [
              { type: 'link', attrs: { href: 'javascript:alert(1)' } },
              { type: 'textStyle', attrs: { color: 'red;background:url(https://evil.example/b)' } },
              { type: 'highlight', attrs: { color: 'red;background:url(https://evil.example/c)' } },
            ],
          },
        ],
      },
      { type: 'image', attrs: { src: 'javascript:alert(1)' } },
    ],
  }

  it("l'éditeur ne rend rien de dangereux même sans nettoyage préalable", () => {
    const editor = new Editor({ extensions: contentExtensions(), content: tampered })
    expect(editor.view.dom.innerHTML).not.toMatch(DANGEROUS)
    expect(editor.getHTML()).not.toMatch(DANGEROUS)
    editor.destroy()
  })

  it('les miniatures non plus', () => {
    expect(jsonToHTML(tampered)).not.toMatch(DANGEROUS)
  })
})
