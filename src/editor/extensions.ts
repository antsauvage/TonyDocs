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
import { safeColor, safeFontFamily, safeFontSize, safeHref, safeImageSrc } from '../lib/sanitize'

/*
 * Hardened variants: every attribute that is written into `style`, `href` or `src`
 * is validated both when parsed (paste, import) and when rendered (editor, export).
 */

/** Re-declares a textStyle attribute so its CSS value goes through a validator. */
function styleAttribute(name: string, cssProperty: string, validate: (v: unknown) => string | null) {
  return {
    [name]: {
      default: null,
      parseHTML: (el: HTMLElement) => validate(el.style.getPropertyValue(cssProperty)),
      renderHTML: (attrs: Record<string, unknown>) => {
        const value = validate(attrs[name])
        return value ? { style: `${cssProperty}: ${value}` } : {}
      },
    },
  }
}

const SafeColor = Color.extend({
  addGlobalAttributes() {
    return [{ types: this.options.types, attributes: styleAttribute('color', 'color', safeColor) }]
  },
})
const SafeFontFamily = FontFamily.extend({
  addGlobalAttributes() {
    return [{ types: this.options.types, attributes: styleAttribute('fontFamily', 'font-family', safeFontFamily) }]
  },
})
const SafeFontSize = FontSize.extend({
  addGlobalAttributes() {
    return [{ types: this.options.types, attributes: styleAttribute('fontSize', 'font-size', safeFontSize) }]
  },
})

const SafeHighlight = Highlight.extend({
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (el: HTMLElement) => safeColor(el.getAttribute('data-color') || el.style.backgroundColor),
        renderHTML: (attrs: Record<string, unknown>) => {
          const color = safeColor(attrs.color)
          return color ? { 'data-color': color, style: `background-color: ${color}; color: inherit` } : {}
        },
      },
    }
  },
})

const SafeImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
        parseHTML: (el: HTMLElement) => safeImageSrc(el.getAttribute('src')),
        renderHTML: (attrs: Record<string, unknown>) => ({ src: safeImageSrc(attrs.src) }),
      },
    }
  },
})

/** Schema-defining extensions, shared by the live editor, thumbnails and exporters. */
export function contentExtensions(): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        isAllowedUri: (url) => safeHref(url) !== null,
      },
    }),
    TextStyle,
    SafeColor,
    SafeFontFamily,
    SafeFontSize,
    SafeHighlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TableKit.configure({ table: { resizable: true } }),
    SafeImage.configure({
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
