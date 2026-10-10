import { Extension, type Editor, type Range } from '@tiptap/core'
import { PluginKey } from '@tiptap/pm/state'
import { ReactRenderer } from '@tiptap/react'
import Suggestion, { type SuggestionProps } from '@tiptap/suggestion'
import { SlashMenu, type SlashMenuHandle } from '../SlashMenu'
import { filterSlashItems, type SlashItem } from '../slashItems'

function place(el: HTMLElement, rect: DOMRect | null | undefined) {
  if (!rect) return
  const menuHeight = el.offsetHeight || 320
  const below = rect.bottom + 6
  const top = below + menuHeight > innerHeight - 8 ? Math.max(8, rect.top - menuHeight - 6) : below
  el.style.top = `${top + scrollY}px`
  el.style.left = `${Math.min(rect.left, innerWidth - el.offsetWidth - 8) + scrollX}px`
}

/** Notion-style "/" command palette to insert blocks without leaving the keyboard. */
export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashItem, SlashItem>({
        editor: this.editor,
        pluginKey: new PluginKey('slashCommand'),
        char: '/',
        allow: ({ editor }) => !editor.isActive('codeBlock'),
        items: ({ query }) => filterSlashItems(query),
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: SlashItem }) =>
          props.run(editor, range),
        render: () => {
          let renderer: ReactRenderer<SlashMenuHandle> | null = null
          let wrapper: HTMLDivElement | null = null

          return {
            onStart: (props: SuggestionProps<SlashItem, SlashItem>) => {
              renderer = new ReactRenderer(SlashMenu, { props, editor: props.editor })
              wrapper = document.createElement('div')
              wrapper.className = 'slash-menu-portal'
              wrapper.style.position = 'absolute'
              wrapper.style.zIndex = '60'
              wrapper.appendChild(renderer.element)
              document.body.appendChild(wrapper)
              requestAnimationFrame(() => wrapper && place(wrapper, props.clientRect?.()))
            },
            onUpdate: (props) => {
              renderer?.updateProps(props)
              if (wrapper) place(wrapper, props.clientRect?.())
            },
            onKeyDown: ({ event }) => {
              if (event.key === 'Escape') {
                wrapper?.remove()
                return true
              }
              return renderer?.ref?.onKeyDown(event) ?? false
            },
            onExit: () => {
              wrapper?.remove()
              renderer?.destroy()
              wrapper = null
              renderer = null
            },
          }
        },
      }),
    ]
  },
})
