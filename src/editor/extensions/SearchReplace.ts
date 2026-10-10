import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, type EditorState, type Transaction } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Node as PMNode } from '@tiptap/pm/model'

export interface SearchMatch {
  from: number
  to: number
}

export interface SearchState {
  term: string
  caseSensitive: boolean
  results: SearchMatch[]
  index: number
  decorations: DecorationSet
}

type SearchMeta = Partial<Pick<SearchState, 'term' | 'caseSensitive' | 'index'>>

export const searchKey = new PluginKey<SearchState>('searchReplace')

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    searchReplace: {
      setSearch: (meta: SearchMeta) => ReturnType
      nextMatch: () => ReturnType
      previousMatch: () => ReturnType
      replaceMatch: (replacement: string) => ReturnType
      replaceAllMatches: (replacement: string) => ReturnType
    }
  }
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function findMatches(doc: PMNode, term: string, caseSensitive: boolean): SearchMatch[] {
  if (!term) return []
  const regex = new RegExp(escapeRegExp(term), caseSensitive ? 'g' : 'gi')
  const results: SearchMatch[] = []
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true
    // Every inline leaf (image, line break) is exactly one position wide, so a one-char
    // placeholder keeps string indexes aligned with document positions.
    const text = node.textBetween(0, node.content.size, undefined, '\u0000')
    for (const match of text.matchAll(regex)) {
      const from = pos + 1 + match.index
      results.push({ from, to: from + match[0].length })
    }
    return false
  })
  return results
}

function buildState(doc: PMNode, term: string, caseSensitive: boolean, index: number): SearchState {
  const results = findMatches(doc, term, caseSensitive)
  const clamped = results.length ? Math.min(Math.max(index, 0), results.length - 1) : 0
  const decorations = DecorationSet.create(
    doc,
    results.map((r, i) =>
      Decoration.inline(r.from, r.to, { class: i === clamped ? 'search-match search-match-current' : 'search-match' }),
    ),
  )
  return { term, caseSensitive, results, index: clamped, decorations }
}

export const getSearchState = (state: EditorState) => searchKey.getState(state)

function setMeta(tr: Transaction, meta: SearchMeta) {
  return tr.setMeta(searchKey, meta)
}

/** Find & replace with live highlighting of every match (Ctrl+F / Ctrl+H). */
export const SearchReplace = Extension.create({
  name: 'searchReplace',

  addCommands() {
    const step =
      (delta: number) =>
      ({ state, tr, dispatch }: { state: EditorState; tr: Transaction; dispatch?: (tr: Transaction) => void }) => {
        const s = getSearchState(state)
        if (!s || !s.results.length) return false
        const index = (s.index + delta + s.results.length) % s.results.length
        if (dispatch) dispatch(setMeta(tr, { index }))
        return true
      }

    return {
      setSearch:
        (meta) =>
        ({ tr, dispatch }) => {
          if (dispatch) dispatch(setMeta(tr, meta))
          return true
        },
      nextMatch: () => step(1),
      previousMatch: () => step(-1),
      replaceMatch:
        (replacement) =>
        ({ state, tr, dispatch }) => {
          const s = getSearchState(state)
          const match = s?.results[s.index]
          if (!s || !match) return false
          if (dispatch) {
            if (replacement) tr.insertText(replacement, match.from, match.to)
            else tr.delete(match.from, match.to)
            // Stay on the same index: the next match slides into this slot.
            dispatch(setMeta(tr, { index: s.index }))
          }
          return true
        },
      replaceAllMatches:
        (replacement) =>
        ({ state, tr, dispatch }) => {
          const s = getSearchState(state)
          if (!s || !s.results.length) return false
          if (dispatch) {
            for (const match of [...s.results].reverse()) {
              if (replacement) tr.insertText(replacement, match.from, match.to)
              else tr.delete(match.from, match.to)
            }
            dispatch(setMeta(tr, { index: 0 }))
          }
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<SearchState>({
        key: searchKey,
        state: {
          init: (_, { doc }) => buildState(doc, '', false, 0),
          apply(tr, prev) {
            const meta = tr.getMeta(searchKey) as SearchMeta | undefined
            if (!meta && !tr.docChanged) return prev
            if (!meta && !prev.term) return { ...prev, decorations: prev.decorations.map(tr.mapping, tr.doc) }
            return buildState(
              tr.doc,
              meta?.term ?? prev.term,
              meta?.caseSensitive ?? prev.caseSensitive,
              meta?.index ?? (meta?.term !== undefined ? 0 : prev.index),
            )
          },
        },
        props: {
          decorations: (state) => searchKey.getState(state)?.decorations,
        },
      }),
    ]
  },
})
