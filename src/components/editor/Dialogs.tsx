import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Modal } from '../ui/Modal'
import { Logo } from '../ui/Logo'
import { countWords, longDate, modKey } from '../../lib/format'
import type { DocRecord } from '../../lib/db'

export function LinkDialog({ editor, open, onClose }: { editor: Editor; open: boolean; onClose: () => void }) {
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [hadSelection, setHadSelection] = useState(false)

  useEffect(() => {
    if (!open) return
    editor.commands.extendMarkRange('link')
    const { from, to, empty } = editor.state.selection
    setHadSelection(!empty)
    setText(editor.state.doc.textBetween(from, to, ' '))
    setUrl(editor.getAttributes('link').href ?? '')
  }, [open, editor])

  const apply = () => {
    const href = url.trim()
    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return onClose()
    }
    const normalized = /^(https?:|mailto:|tel:|#|\/)/i.test(href) ? href : `https://${href}`
    const label = text.trim() || href
    if (hadSelection) {
      const { from, to } = editor.state.selection
      const current = editor.state.doc.textBetween(from, to, ' ')
      const chain = editor.chain().focus()
      if (current !== label) chain.insertContentAt({ from, to }, label).setTextSelection({ from, to: from + label.length })
      chain.setLink({ href: normalized }).run()
    } else {
      editor
        .chain()
        .focus()
        .insertContent({ type: 'text', text: label, marks: [{ type: 'link', attrs: { href: normalized } }] })
        .unsetMark('link')
        .run()
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Insérer un lien"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary" onClick={apply}>
            Appliquer
          </button>
        </>
      }
    >
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          apply()
        }}
      >
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-soft">
          Texte
          <input className="field" value={text} onChange={(e) => setText(e.target.value)} placeholder="Texte à afficher" />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-soft">
          Lien
          <input autoFocus className="field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://exemple.fr" />
        </label>
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}

export function ImageUrlDialog({ editor, open, onClose }: { editor: Editor; open: boolean; onClose: () => void }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    if (open) setUrl('')
  }, [open])
  const apply = () => {
    if (url.trim()) editor.chain().focus().setImage({ src: url.trim() }).run()
    onClose()
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Insérer une image par URL"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary" onClick={apply}>
            Insérer
          </button>
        </>
      }
    >
      <input
        autoFocus
        className="field"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && apply()}
        placeholder="https://exemple.fr/image.jpg"
      />
      {url.trim() && (
        <div className="mt-3 flex max-h-56 justify-center overflow-hidden rounded-lg border border-line bg-surface-2 p-2">
          <img src={url.trim()} alt="" className="max-h-52 object-contain" />
        </div>
      )}
    </Modal>
  )
}

export function WordCountDialog({
  editor,
  doc,
  open,
  onClose,
  showCounter,
  toggleCounter,
}: {
  editor: Editor
  doc: DocRecord
  open: boolean
  onClose: () => void
  showCounter: boolean
  toggleCounter: () => void
}) {
  if (!open) return null
  const text = editor.getText({ blockSeparator: '\n' })
  const { from, to, empty } = editor.state.selection
  const selected = empty ? null : editor.state.doc.textBetween(from, to, '\n')
  const words = countWords(text)
  const rows: [string, string | number][] = [
    ['Pages (A4, estimation)', Math.max(1, Math.ceil(words / 450))],
    ['Mots', words],
    ['Caractères', text.replace(/\n/g, '').length],
    ['Caractères (espaces non compris)', text.replace(/\s/g, '').length],
    ['Paragraphes', text.split('\n').filter((l) => l.trim()).length],
    ['Temps de lecture', `${Math.max(1, Math.round(words / 230))} min`],
  ]
  return (
    <Modal open onClose={onClose} title="Nombre de mots" width={420}>
      {selected !== null && (
        <p className="mb-3 rounded-lg bg-accent-soft px-3 py-2 text-[13px] text-ink">
          Sélection : <strong>{countWords(selected)}</strong> mots
        </p>
      )}
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b border-line last:border-0">
              <td className="py-2 text-ink-soft">{k}</td>
              <td className="py-2 text-right font-medium text-ink tabular-nums">{typeof v === 'number' ? v.toLocaleString('fr-FR') : v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 space-y-1 text-xs text-muted">
        <p>Créé le {longDate(doc.createdAt)}</p>
        <p>Modifié le {longDate(doc.updatedAt)}</p>
      </div>
      <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-ink">
        <input type="checkbox" checked={showCounter} onChange={toggleCounter} className="size-4 accent-[var(--accent)]" />
        Afficher le nombre de mots pendant la saisie
      </label>
    </Modal>
  )
}

const SHORTCUTS: [string, [string, string][]][] = [
  [
    'Mise en forme du texte',
    [
      ['Gras', `${modKey}+B`],
      ['Italique', `${modKey}+I`],
      ['Souligné', `${modKey}+U`],
      ['Barré', `${modKey}+Maj+S`],
      ['Code', `${modKey}+E`],
      ['Exposant / indice', `${modKey}+. / ${modKey}+,`],
      ['Surligner', `${modKey}+Maj+H`],
      ['Effacer la mise en forme', `${modKey}+\\`],
    ],
  ],
  [
    'Paragraphes',
    [
      ['Texte normal', `${modKey}+Alt+0`],
      ['Titre 1 à 4', `${modKey}+Alt+1…4`],
      ['Liste numérotée', `${modKey}+Maj+7`],
      ['Liste à puces', `${modKey}+Maj+8`],
      ['Liste de tâches', `${modKey}+Maj+9`],
      ['Aligner à gauche / centrer / à droite', `${modKey}+Maj+L / E / R`],
      ['Justifier', `${modKey}+Maj+J`],
      ['Augmenter / diminuer le retrait', 'Tab / Maj+Tab'],
    ],
  ],
  [
    'Actions',
    [
      ['Annuler / rétablir', `${modKey}+Z / ${modKey}+Y`],
      ['Insérer un lien', `${modKey}+K`],
      ['Rechercher', `${modKey}+F`],
      ['Rechercher et remplacer', `${modKey}+H`],
      ["Menu d'insertion", '/'],
      ['Nombre de mots', `${modKey}+Maj+C`],
      ['Afficher le plan', `${modKey}+Alt+A`],
      ['Imprimer / PDF', `${modKey}+P`],
      ['Raccourcis clavier', `${modKey}+/`],
    ],
  ],
]

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Raccourcis clavier" width={620}>
      <div className="grid gap-6 sm:grid-cols-2">
        {SHORTCUTS.map(([group, items]) => (
          <section key={group} className={group === 'Actions' ? 'sm:col-span-2' : ''}>
            <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">{group}</h3>
            <dl className={group === 'Actions' ? 'grid gap-x-6 sm:grid-cols-2' : ''}>
              {items.map(([label, keys]) => (
                <div key={label} className="flex items-center justify-between gap-4 border-b border-line py-1.5 text-[13px]">
                  <dt className="text-ink">{label}</dt>
                  <dd>
                    <kbd className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-sans text-xs whitespace-nowrap text-ink-soft">{keys}</kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Modal>
  )
}

export function AboutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="À propos" width={400}>
      <div className="flex flex-col items-center py-2 text-center">
        <Logo className="size-16" />
        <h3 className="mt-3 text-xl font-semibold tracking-tight text-ink">TonyDocs</h3>
        <p className="mt-1 text-sm text-muted">Version 0.1</p>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          Un traitement de texte moderne qui fonctionne entièrement dans votre navigateur. Vos documents restent sur cet appareil.
        </p>
        <p className="mt-4 text-xs text-muted">Conçu et développé avec Claude Code · React · Tiptap</p>
      </div>
    </Modal>
  )
}
