import type { Editor, Range } from '@tiptap/core'
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  TextQuote,
  Code,
  Minus,
  Table,
  Image,
  Pilcrow,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react'

export interface SlashItem {
  title: string
  description: string
  keywords: string[]
  icon: LucideIcon
  run: (editor: Editor, range: Range) => void
}

export const SLASH_ITEMS: SlashItem[] = [
  {
    title: 'Texte',
    description: 'Paragraphe simple',
    keywords: ['paragraphe', 'texte', 'normal', 'p'],
    icon: Pilcrow,
    run: (e, r) => e.chain().focus().deleteRange(r).setParagraph().run(),
  },
  {
    title: 'Titre 1',
    description: 'Grand titre de section',
    keywords: ['titre', 'heading', 'h1'],
    icon: Heading1,
    run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 1 }).run(),
  },
  {
    title: 'Titre 2',
    description: 'Titre de sous-section',
    keywords: ['titre', 'heading', 'h2'],
    icon: Heading2,
    run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 2 }).run(),
  },
  {
    title: 'Titre 3',
    description: 'Petit titre',
    keywords: ['titre', 'heading', 'h3'],
    icon: Heading3,
    run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 3 }).run(),
  },
  {
    title: 'Liste à puces',
    description: 'Liste non ordonnée',
    keywords: ['liste', 'puces', 'bullet', 'ul'],
    icon: List,
    run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run(),
  },
  {
    title: 'Liste numérotée',
    description: 'Liste ordonnée 1, 2, 3…',
    keywords: ['liste', 'numéro', 'ordered', 'ol'],
    icon: ListOrdered,
    run: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run(),
  },
  {
    title: 'Liste de tâches',
    description: 'Cases à cocher',
    keywords: ['tâche', 'todo', 'checklist', 'case'],
    icon: ListChecks,
    run: (e, r) => e.chain().focus().deleteRange(r).toggleTaskList().run(),
  },
  {
    title: 'Citation',
    description: 'Mettre en valeur une citation',
    keywords: ['citation', 'quote', 'blockquote'],
    icon: TextQuote,
    run: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run(),
  },
  {
    title: 'Bloc de code',
    description: 'Code avec police à chasse fixe',
    keywords: ['code', 'programme', 'pre'],
    icon: Code,
    run: (e, r) => e.chain().focus().deleteRange(r).toggleCodeBlock().run(),
  },
  {
    title: 'Tableau',
    description: 'Tableau 3 × 3',
    keywords: ['tableau', 'table', 'grille'],
    icon: Table,
    run: (e, r) => e.chain().focus().deleteRange(r).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: 'Image',
    description: 'Importer depuis votre ordinateur',
    keywords: ['image', 'photo', 'img'],
    icon: Image,
    run: (e, r) => {
      e.chain().focus().deleteRange(r).run()
      window.dispatchEvent(new CustomEvent('tonydocs:insert-image'))
    },
  },
  {
    title: 'Ligne horizontale',
    description: 'Séparateur visuel',
    keywords: ['ligne', 'séparateur', 'hr', 'divider'],
    icon: Minus,
    run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run(),
  },
  {
    title: 'Date du jour',
    description: "Insère la date d'aujourd'hui",
    keywords: ['date', 'jour', 'aujourd'],
    icon: CalendarDays,
    run: (e, r) =>
      e
        .chain()
        .focus()
        .deleteRange(r)
        .insertContent(new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date()))
        .run(),
  },
]

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

export function filterSlashItems(query: string) {
  const q = normalize(query.trim())
  if (!q) return SLASH_ITEMS
  return SLASH_ITEMS.filter((item) =>
    [item.title, ...item.keywords].some((k) => normalize(k).includes(q)),
  )
}
