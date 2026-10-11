import { createRef, useCallback, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  FilePlus2,
  FolderOpen,
  Upload,
  Copy,
  Download,
  Pencil,
  Star,
  Trash2,
  Printer,
  Undo2,
  Redo2,
  Scissors,
  ClipboardPaste,
  TextSelect,
  Replace,
  PanelLeft,
  Ruler,
  Hash,
  ZoomIn,
  SunMoon,
  Maximize,
  ImagePlus,
  Table,
  Link2,
  Minus,
  ListChecks,
  Code,
  TextQuote,
  CalendarDays,
  Bold,
  Heading,
  AlignLeft,
  ListOrdered,
  RemoveFormatting,
  Keyboard,
  Info,
  Type,
  ArrowUpDown,
  FileText,
} from 'lucide-react'
import { Floating } from '../ui/Popover'
import { MenuList, type MenuEntry } from '../ui/Menu'
import { TEMPLATES } from '../../lib/templates'
import { LINE_SPACINGS, ZOOMS } from '../../editor/fonts'
import { modKey } from '../../lib/format'
import { TableGridPicker } from './TableGridPicker'
import type { EditorUi } from './types'

function buildMenus(editor: Editor, ui: EditorUi): { label: string; items: MenuEntry[] }[] {
  const chain = () => editor.chain().focus()
  const today = () => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date())

  return [
    {
      label: 'Fichier',
      items: [
        {
          type: 'submenu',
          label: 'Nouveau',
          icon: FilePlus2,
          items: TEMPLATES.map((t) => ({ label: t.name, icon: FileText, onSelect: () => ui.newDoc(t) })),
        },
        { label: 'Ouvrir…', icon: FolderOpen, onSelect: () => (location.hash = '/') },
        { label: 'Importer un fichier…', icon: Upload, onSelect: ui.importDoc },
        { label: 'Créer une copie', icon: Copy, onSelect: ui.duplicate },
        { type: 'separator' },
        {
          type: 'submenu',
          label: 'Télécharger',
          icon: Download,
          items: [
            { label: 'Microsoft Word (.docx)', onSelect: () => ui.exportAs('docx') },
            { label: 'Document PDF (.pdf)', onSelect: () => ui.exportAs('pdf') },
            { label: 'Markdown (.md)', onSelect: () => ui.exportAs('md') },
            { label: 'Page Web (.html)', onSelect: () => ui.exportAs('html') },
            { label: 'Texte brut (.txt)', onSelect: () => ui.exportAs('txt') },
          ],
        },
        { type: 'separator' },
        { label: 'Renommer', icon: Pencil, onSelect: ui.focusTitle },
        { label: ui.starred ? 'Retirer des favoris' : 'Ajouter aux favoris', icon: Star, onSelect: ui.toggleStar },
        { label: 'Placer dans la corbeille', icon: Trash2, onSelect: ui.remove },
        { type: 'separator' },
        { label: 'Imprimer', icon: Printer, shortcut: `${modKey}+P`, onSelect: () => ui.exportAs('pdf') },
      ],
    },
    {
      label: 'Édition',
      items: [
        { label: 'Annuler', icon: Undo2, shortcut: `${modKey}+Z`, disabled: !editor.can().undo(), onSelect: () => chain().undo().run() },
        { label: 'Rétablir', icon: Redo2, shortcut: `${modKey}+Y`, disabled: !editor.can().redo(), onSelect: () => chain().redo().run() },
        { type: 'separator' },
        {
          label: 'Couper',
          icon: Scissors,
          shortcut: `${modKey}+X`,
          disabled: editor.state.selection.empty,
          onSelect: () => {
            editor.view.focus()
            document.execCommand('cut')
          },
        },
        {
          label: 'Copier',
          icon: Copy,
          shortcut: `${modKey}+C`,
          disabled: editor.state.selection.empty,
          onSelect: () => {
            editor.view.focus()
            document.execCommand('copy')
          },
        },
        {
          label: 'Coller',
          icon: ClipboardPaste,
          shortcut: `${modKey}+V`,
          onSelect: async () => {
            try {
              const text = await navigator.clipboard.readText()
              chain().insertContent(text).run()
            } catch {
              editor.view.focus()
            }
          },
        },
        { type: 'separator' },
        { label: 'Tout sélectionner', icon: TextSelect, shortcut: `${modKey}+A`, onSelect: () => chain().selectAll().run() },
        { type: 'separator' },
        { label: 'Rechercher et remplacer', icon: Replace, shortcut: `${modKey}+H`, onSelect: () => ui.openFind(true) },
      ],
    },
    {
      label: 'Affichage',
      items: [
        { label: 'Afficher le plan', icon: PanelLeft, checked: ui.showOutline, shortcut: `${modKey}+Alt+A`, onSelect: ui.toggleOutline },
        { label: 'Afficher la règle', icon: Ruler, checked: ui.showRuler, onSelect: ui.toggleRuler },
        { label: 'Afficher le nombre de mots', icon: Hash, checked: ui.showWordCounter, onSelect: ui.toggleWordCounter },
        { type: 'separator' },
        {
          type: 'submenu',
          label: 'Zoom',
          icon: ZoomIn,
          items: ZOOMS.map((z) => ({ label: `${z} %`, checked: ui.zoom === z, onSelect: () => ui.setZoom(z) })),
        },
        {
          type: 'submenu',
          label: 'Thème',
          icon: SunMoon,
          items: [
            { label: 'Clair', checked: ui.theme === 'light', onSelect: () => ui.setTheme('light') },
            { label: 'Sombre', checked: ui.theme === 'dark', onSelect: () => ui.setTheme('dark') },
            { label: 'Selon le système', checked: ui.theme === 'system', onSelect: () => ui.setTheme('system') },
          ],
        },
        { type: 'separator' },
        {
          label: 'Plein écran',
          icon: Maximize,
          onSelect: () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()),
        },
      ],
    },
    {
      label: 'Insertion',
      items: [
        {
          type: 'submenu',
          label: 'Image',
          icon: ImagePlus,
          items: [
            { label: "Importer depuis l'ordinateur", onSelect: ui.insertImage },
            { label: 'Par URL', onSelect: ui.insertImageUrl },
          ],
        },
        {
          type: 'submenu',
          label: 'Tableau',
          icon: Table,
          items: [
            {
              type: 'custom',
              render: (close) => (
                <div className="p-2">
                  <TableGridPicker
                    onPick={(rows, cols) => {
                      close()
                      chain().insertTable({ rows, cols, withHeaderRow: true }).run()
                    }}
                  />
                </div>
              ),
            },
          ],
        },
        { label: 'Lien', icon: Link2, shortcut: `${modKey}+K`, onSelect: ui.openLink },
        { type: 'separator' },
        { label: 'Ligne horizontale', icon: Minus, onSelect: () => chain().setHorizontalRule().run() },
        { label: 'Liste de tâches', icon: ListChecks, onSelect: () => chain().toggleTaskList().run() },
        { label: 'Citation', icon: TextQuote, onSelect: () => chain().toggleBlockquote().run() },
        { label: 'Bloc de code', icon: Code, shortcut: `${modKey}+Alt+C`, onSelect: () => chain().toggleCodeBlock().run() },
        { label: 'Date du jour', icon: CalendarDays, onSelect: () => chain().insertContent(today()).run() },
      ],
    },
    {
      label: 'Format',
      items: [
        {
          type: 'submenu',
          label: 'Texte',
          icon: Bold,
          items: [
            { label: 'Gras', shortcut: `${modKey}+B`, checked: editor.isActive('bold'), onSelect: () => chain().toggleBold().run() },
            { label: 'Italique', shortcut: `${modKey}+I`, checked: editor.isActive('italic'), onSelect: () => chain().toggleItalic().run() },
            { label: 'Souligné', shortcut: `${modKey}+U`, checked: editor.isActive('underline'), onSelect: () => chain().toggleUnderline().run() },
            { label: 'Barré', shortcut: `${modKey}+Maj+S`, checked: editor.isActive('strike'), onSelect: () => chain().toggleStrike().run() },
            { label: 'Exposant', shortcut: `${modKey}+.`, checked: editor.isActive('superscript'), onSelect: () => chain().toggleSuperscript().run() },
            { label: 'Indice', shortcut: `${modKey}+,`, checked: editor.isActive('subscript'), onSelect: () => chain().toggleSubscript().run() },
          ],
        },
        {
          type: 'submenu',
          label: 'Styles de paragraphe',
          icon: Heading,
          items: [
            { label: 'Texte normal', shortcut: `${modKey}+Alt+0`, checked: editor.isActive('paragraph'), onSelect: () => chain().setParagraph().run() },
            ...([1, 2, 3, 4] as const).map((level) => ({
              label: `Titre ${level}`,
              shortcut: `${modKey}+Alt+${level}`,
              checked: editor.isActive('heading', { level }),
              onSelect: () => chain().setHeading({ level }).run(),
            })),
          ],
        },
        {
          type: 'submenu',
          label: 'Aligner et mettre en retrait',
          icon: AlignLeft,
          items: [
            { label: 'Gauche', checked: editor.isActive({ textAlign: 'left' }), onSelect: () => chain().setTextAlign('left').run() },
            { label: 'Centre', checked: editor.isActive({ textAlign: 'center' }), onSelect: () => chain().setTextAlign('center').run() },
            { label: 'Droite', checked: editor.isActive({ textAlign: 'right' }), onSelect: () => chain().setTextAlign('right').run() },
            { label: 'Justifié', checked: editor.isActive({ textAlign: 'justify' }), onSelect: () => chain().setTextAlign('justify').run() },
            { type: 'separator' },
            { label: 'Augmenter le retrait', shortcut: 'Tab', onSelect: () => chain().indent().run() },
            { label: 'Diminuer le retrait', shortcut: 'Maj+Tab', onSelect: () => chain().outdent().run() },
          ],
        },
        {
          type: 'submenu',
          label: 'Interligne',
          icon: ArrowUpDown,
          items: LINE_SPACINGS.map((l) => ({
            label: l.label,
            checked: (editor.getAttributes(editor.isActive('heading') ? 'heading' : 'paragraph').lineHeight ?? '1.5') === l.value,
            onSelect: () => chain().setLineSpacing(l.value).run(),
          })),
        },
        {
          type: 'submenu',
          label: 'Puces et numéros',
          icon: ListOrdered,
          items: [
            { label: 'Liste à puces', checked: editor.isActive('bulletList'), onSelect: () => chain().toggleBulletList().run() },
            { label: 'Liste numérotée', checked: editor.isActive('orderedList'), onSelect: () => chain().toggleOrderedList().run() },
            { label: 'Liste de tâches', checked: editor.isActive('taskList'), onSelect: () => chain().toggleTaskList().run() },
          ],
        },
        { type: 'separator' },
        {
          label: 'Effacer la mise en forme',
          icon: RemoveFormatting,
          shortcut: `${modKey}+\\`,
          onSelect: () => chain().unsetAllMarks().unsetTextAlign().unsetLineSpacing().run(),
        },
      ],
    },
    {
      label: 'Outils',
      items: [
        { label: 'Nombre de mots', icon: Type, shortcut: `${modKey}+Maj+C`, onSelect: () => ui.openDialog('wordcount') },
        { label: 'Rechercher et remplacer', icon: Replace, shortcut: `${modKey}+H`, onSelect: () => ui.openFind(true) },
      ],
    },
    {
      label: 'Aide',
      items: [
        { label: 'Raccourcis clavier', icon: Keyboard, shortcut: `${modKey}+/`, onSelect: () => ui.openDialog('shortcuts') },
        { label: 'À propos de TonyDocs', icon: Info, onSelect: () => ui.openDialog('about') },
      ],
    },
  ]
}

/** Docs-style menu bar: click to open, then hover to move between menus. */
export function MenuBar({ editor, ui }: { editor: Editor; ui: EditorUi }) {
  const [open, setOpen] = useState<number | null>(null)
  const refs = useRef(Array.from({ length: 7 }, () => createRef<HTMLButtonElement>())).current
  const close = useCallback(() => setOpen(null), [])
  // Rebuilt on every open so "checked" / "disabled" states are fresh.
  const menus = buildMenus(editor, ui)

  return (
    <nav className="-ml-1.5 flex items-center overflow-x-auto [scrollbar-width:none]" aria-label="Menu principal">
      {menus.map((menu, i) => (
        <div key={menu.label}>
          <button
            ref={refs[i]}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpen(open === i ? null : i)}
            onMouseEnter={() => open !== null && setOpen(i)}
            className={`h-7 shrink-0 rounded-md px-2 text-[14px] whitespace-nowrap text-ink transition-colors hover:bg-hover lg:h-6 ${open === i ? 'bg-press' : ''}`}
          >
            {menu.label}
          </button>
          <Floating
            anchor={refs[i]}
            open={open === i}
            onClose={close}
            ignore={refs}
          >
            <MenuList items={menu.items} close={close} />
          </Floating>
        </div>
      ))}
    </nav>
  )
}
