import type { Extensions } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle, Color, FontFamily, FontSize } from '@tiptap/extension-text-style'
import { TableKit } from '@tiptap/extension-table'
import Image from '@tiptap/extension-image'
import { TaskList, TaskItem } from '@tiptap/extension-list'
import { Placeholder, CharacterCount } from '@tiptap/extensions'
import { Markdown } from '@tiptap/markdown'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { LineSpacing } from './extensions/LineSpacing'
import { Indent } from './extensions/Indent'
import { SlashCommand } from './extensions/SlashCommand'
import { SearchReplace } from './extensions/SearchReplace'

/** Schema-defining extensions, shared by the live editor, thumbnails and exporters. */
export function contentExtensions(): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
    }),
    TextStyle,
    Color,
    FontFamily,
    FontSize,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TableKit.configure({ table: { resizable: true } }),
    Image.configure({
      allowBase64: true,
      resize: { enabled: true, alwaysPreserveAspectRatio: true, minWidth: 48, minHeight: 48 },
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Subscript,
    Superscript,
    LineSpacing,
    Indent,
  ]
}

/** Full set for the interactive editor: schema + editing UX. */
export function editorExtensions(): Extensions {
  return [
    ...contentExtensions(),
    Placeholder.configure({
      placeholder: ({ node, pos }) =>
        node.type.name === 'heading'
          ? 'Titre'
          : pos === 0
            ? 'Commencez à écrire, ou tapez « / » pour insérer un élément…'
            : '',
    }),
    CharacterCount,
    Markdown,
    SlashCommand,
    SearchReplace,
  ]
}
