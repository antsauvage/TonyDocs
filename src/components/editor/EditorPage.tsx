import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import { CloudAlert, CloudCheck, LoaderCircle, Star, Download, ChevronDown, ListTree, FileX2 } from 'lucide-react'
import { editorExtensions } from '../../editor/extensions'
import { createDoc, deleteDoc, duplicateDoc, getDoc, putDoc, updateDoc, type DocRecord } from '../../lib/db'
import { navigate } from '../../lib/router'
import { docStats, htmlToJSON, markdownToJSON, firstHeading } from '../../lib/content'
import { sanitizeDoc } from '../../lib/sanitize'
import { displayTitle, relativeTime } from '../../lib/format'
import { exportDocx, exportHtml, exportMarkdown, exportPdf, exportText } from '../../lib/export'
import { pickFile } from '../../lib/download'
import { imageFileToDataURL } from '../../lib/image'
import { pickAndImport } from '../../lib/import'
import { userMessage } from '../../lib/errors'
import type { Template } from '../../lib/templates'
import type { ThemePref } from '../../lib/theme'
import { Logo } from '../ui/Logo'
import { Tooltip } from '../ui/Tooltip'
import { Popover } from '../ui/Popover'
import { MenuList } from '../ui/Menu'
import { useToast } from '../ui/Toast'
import { MenuBar } from './MenuBar'
import { Toolbar } from './Toolbar'
import { Outline } from './Outline'
import { Ruler } from './Ruler'
import { FindReplace } from './FindReplace'
import { TextBubble, LinkBubble, TableBubble } from './Bubbles'
import { AboutDialog, ImageUrlDialog, LinkDialog, ShortcutsDialog, WordCountDialog } from './Dialogs'
import type { EditorUi, ExportFormat } from './types'

type SaveState = 'saved' | 'saving' | 'error'
type Dialog = 'link' | 'imageUrl' | 'wordcount' | 'shortcuts' | 'about' | null

const PREFS_KEY = 'tonydocs:editor-prefs'
interface Prefs {
  zoom: number
  showOutline: boolean
  showRuler: boolean
  showWordCounter: boolean
}

function loadPrefs(): Prefs {
  const defaults = { zoom: 100, showOutline: true, showRuler: true, showWordCounter: false }
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') }
  } catch {
    return defaults
  }
}

export function EditorPage({ id, theme, setTheme }: { id: string; theme: ThemePref; setTheme: (t: ThemePref) => void }) {
  const [doc, setDoc] = useState<DocRecord | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    setDoc(undefined)
    getDoc(id)
      .then((d) => {
        if (cancelled) return
        setDoc(d ?? null)
        if (d) updateDoc(id, { openedAt: Date.now() }).catch(() => {})
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setDoc(null)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (doc === undefined) {
    return (
      <div className="flex h-full items-center justify-center bg-canvas">
        <LoaderCircle className="size-6 animate-spin text-muted" />
      </div>
    )
  }
  if (doc === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-bg text-center">
        <FileX2 className="size-12 stroke-[1.25] text-muted" />
        <p className="text-lg font-medium text-ink">Document introuvable</p>
        <p className="text-sm text-muted">Il a peut-être été supprimé, ou il a été créé sur un autre appareil.</p>
        <button className="btn-primary mt-3" onClick={() => navigate({ name: 'home' })}>
          Retour aux documents
        </button>
      </div>
    )
  }
  return <DocumentEditor key={doc.id} initial={doc} theme={theme} setTheme={setTheme} />
}

function DocumentEditor({ initial, theme, setTheme }: { initial: DocRecord; theme: ThemePref; setTheme: (t: ThemePref) => void }) {
  const [doc, setDoc] = useState(initial)
  const docRef = useRef(initial)
  docRef.current = doc
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [, forceTick] = useState(0)
  const [prefs, setPrefs] = useState(loadPrefs)
  const [find, setFind] = useState<{ open: boolean; replace: boolean }>({ open: false, replace: false })
  const [dialog, setDialog] = useState<Dialog>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const saveTimer = useRef<number>(0)
  const pending = useRef<Partial<DocRecord> | null>(null)
  const toast = useToast()

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
    } catch {
      /* not persisted */
    }
  }, [prefs])

  /* ---------------------------------------------------------------- saving */

  const failureNotified = useRef(false)
  const flushRef = useRef<() => Promise<boolean>>(async () => true)

  /** Writes pending changes. Resolves to false (and keeps them queued for retry) if storage fails. */
  const flush = useCallback(async (): Promise<boolean> => {
    clearTimeout(saveTimer.current)
    if (!pending.current) return true
    const patch = pending.current
    pending.current = null
    const next = { ...docRef.current, ...patch, updatedAt: Date.now() }
    try {
      await putDoc(next)
    } catch (err) {
      console.error('Enregistrement impossible', err)
      // Re-queue; anything typed meanwhile is newer and wins.
      pending.current = { ...patch, ...(pending.current as Partial<DocRecord> | null) }
      setSaveState('error')
      if (!failureNotified.current) {
        failureNotified.current = true
        toast("Échec de l'enregistrement : l'espace de stockage du navigateur est peut-être plein. Nouvel essai automatique…")
      }
      saveTimer.current = window.setTimeout(() => void flushRef.current(), 5000)
      return false
    }
    if (failureNotified.current) {
      failureNotified.current = false
      toast('Enregistrement rétabli')
    }
    docRef.current = next
    setDoc(next)
    if (!pending.current) setSaveState('saved')
    return true
  }, [toast])
  flushRef.current = flush

  const schedule = useCallback(
    (patch: Partial<DocRecord>) => {
      pending.current = { ...pending.current, ...patch }
      setSaveState('saving')
      clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => void flush(), 500)
    },
    [flush],
  )

  useEffect(() => {
    const onHide = () => void flush()
    // Ask before leaving while changes are not safely stored yet.
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!pending.current) return
      void flush()
      e.preventDefault()
    }
    addEventListener('pagehide', onHide)
    addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      removeEventListener('pagehide', onHide)
      removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('visibilitychange', onHide)
      void flush()
    }
  }, [flush])

  // Refresh the "Modifié il y a…" label.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  /* ---------------------------------------------------------------- editor */

  const editor = useEditor({
    extensions: useMemo(() => editorExtensions(), []),
    content: useMemo(() => sanitizeDoc(initial.content), [initial.content]),
    autofocus: initial.wordCount === 0 && !initial.title ? 'start' : false,
    editorProps: {
      attributes: { class: 'doc-content', spellcheck: 'true', lang: 'fr' },
      handlePaste: (view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'))
        if (!files.length) return false
        files.forEach((file) =>
          imageFileToDataURL(file)
            .then((src) => view.dispatch(view.state.tr.replaceSelectionWith(view.state.schema.nodes.image.create({ src }))))
            .catch((err) => toast(userMessage(err, "Impossible d'insérer cette image"))),
        )
        return true
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith('image/'))
        if (!files.length) return false
        event.preventDefault()
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? view.state.selection.from
        files.forEach((file) =>
          imageFileToDataURL(file)
            .then((src) => view.dispatch(view.state.tr.insert(pos, view.state.schema.nodes.image.create({ src }))))
            .catch((err) => toast(userMessage(err, "Impossible d'insérer cette image"))),
        )
        return true
      },
    },
    onUpdate: ({ editor: e }) => {
      const content = e.getJSON()
      schedule({ content, ...docStats(content) })
    },
  })

  useEffect(() => {
    document.title = `${displayTitle(doc.title)} – TonyDocs`
  }, [doc.title])

  /* ---------------------------------------------------------------- actions */

  const insertImage = useCallback(async () => {
    const file = await pickFile('image/*')
    if (!file) return
    try {
      const src = await imageFileToDataURL(file)
      editor.chain().focus().setImage({ src, alt: file.name }).run()
    } catch (err) {
      toast(userMessage(err, "Impossible d'insérer cette image"))
    }
  }, [editor, toast])

  useEffect(() => {
    const onInsert = () => void insertImage()
    addEventListener('tonydocs:insert-image', onInsert)
    return () => removeEventListener('tonydocs:insert-image', onInsert)
  }, [insertImage])

  const exportAs = useCallback(
    async (format: ExportFormat) => {
      const title = displayTitle(docRef.current.title)
      try {
        if (format === 'pdf') return exportPdf(title)
        if (format === 'docx') {
          toast('Préparation du fichier Word…')
          await exportDocx(editor.getJSON(), title)
        }
        if (format === 'md') exportMarkdown(editor, title)
        if (format === 'html') exportHtml(editor, title)
        if (format === 'txt') exportText(editor, title)
      } catch (err) {
        console.error(err)
        toast("L'export a échoué")
      }
    },
    [editor, toast],
  )

  const ui: EditorUi = {
    openFind: (replace = false) => setFind({ open: true, replace }),
    openLink: () => setDialog('link'),
    insertImage,
    insertImageUrl: () => setDialog('imageUrl'),
    exportAs,
    newDoc: async (t: Template) => {
      if (!(await flush())) return
      const content = htmlToJSON(t.html)
      const created = await createDoc({ title: t.title, content, ...docStats(content) })
      navigate({ name: 'doc', id: created.id })
    },
    importDoc: async () => {
      try {
        const file = await pickAndImport()
        if (!file) return
        if (!(await flush())) return
        const content = file.contentType === 'markdown' ? markdownToJSON(file.content) : htmlToJSON(file.content)
        const created = await createDoc({ title: file.title || firstHeading(content) || '', content, ...docStats(content) })
        toast(`« ${displayTitle(created.title)} » importé`)
        navigate({ name: 'doc', id: created.id })
      } catch (err) {
        console.error(err)
        toast(userMessage(err, "Impossible d'importer ce fichier"))
      }
    },
    duplicate: async () => {
      if (!(await flush())) return
      const copy = await duplicateDoc(docRef.current.id)
      if (copy) {
        toast('Copie créée')
        navigate({ name: 'doc', id: copy.id })
      }
    },
    remove: async () => {
      await flush()
      const snapshot = docRef.current
      await deleteDoc(snapshot.id)
      navigate({ name: 'home' })
      toast(`« ${displayTitle(snapshot.title)} » supprimé`, { label: 'Annuler', run: () => void putDoc(snapshot).then(() => navigate({ name: 'doc', id: snapshot.id })) })
    },
    focusTitle: () => {
      titleRef.current?.focus()
      titleRef.current?.select()
    },
    toggleStar: () => {
      const starred = !docRef.current.starred
      setDoc((d) => ({ ...d, starred }))
      docRef.current = { ...docRef.current, starred }
      void updateDoc(docRef.current.id, { starred })
      toast(starred ? 'Ajouté aux favoris' : 'Retiré des favoris')
    },
    starred: doc.starred,
    zoom: prefs.zoom,
    setZoom: (zoom) => setPrefs((p) => ({ ...p, zoom })),
    showOutline: prefs.showOutline,
    toggleOutline: () => setPrefs((p) => ({ ...p, showOutline: !p.showOutline })),
    showRuler: prefs.showRuler,
    toggleRuler: () => setPrefs((p) => ({ ...p, showRuler: !p.showRuler })),
    showWordCounter: prefs.showWordCounter,
    toggleWordCounter: () => setPrefs((p) => ({ ...p, showWordCounter: !p.showWordCounter })),
    theme,
    setTheme,
    openDialog: (d) => setDialog(d),
  }
  const uiRef = useRef(ui)
  uiRef.current = ui

  /* ---------------------------------------------------------------- keyboard */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      const key = e.key.toLowerCase()
      const u = uiRef.current
      if (key === 'f' && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        u.openFind(false)
      } else if (key === 'h' && !e.shiftKey) {
        e.preventDefault()
        u.openFind(true)
      } else if (key === 'k') {
        e.preventDefault()
        u.openLink()
      } else if (key === 'p') {
        e.preventDefault()
        u.exportAs('pdf')
      } else if (key === 's') {
        if (e.shiftKey) return // Mod+Shift+S = strike
        e.preventDefault()
        void flush().then((ok) => ok && toast('Toutes les modifications sont enregistrées'))
      } else if (key === '/') {
        e.preventDefault()
        u.openDialog('shortcuts')
      } else if (key === '\\') {
        e.preventDefault()
        editor.chain().focus().unsetAllMarks().unsetTextAlign().unsetLineSpacing().run()
      } else if (key === 'c' && e.shiftKey) {
        e.preventDefault()
        u.openDialog('wordcount')
      } else if (key === 'a' && e.altKey) {
        e.preventDefault()
        u.toggleOutline()
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [editor, flush, toast])

  /* ---------------------------------------------------------------- render */

  return (
    <div className="print-root flex min-h-full flex-col bg-canvas lg:h-full">
      {/* On phones the window scrolls (plays best with the iOS keyboard), so the chrome sticks to the top. */}
      <div className="no-print sticky top-0 z-30 bg-bg lg:static">
      <header className="flex items-center gap-1.5 bg-bg px-2 pt-2 pb-1 sm:gap-2 sm:px-3 sm:pb-1.5">
        <Tooltip label="Accueil TonyDocs">
          <a href="#/" className="shrink-0 rounded-lg p-1 transition-colors hover:bg-hover">
            <Logo className="size-8 sm:size-9" />
          </a>
        </Tooltip>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <TitleInput
              inputRef={titleRef}
              value={doc.title}
              onChange={(title) => {
                setDoc((d) => ({ ...d, title }))
                schedule({ title })
              }}
              onDone={() => {
                titleRef.current?.blur()
                editor.view.focus()
              }}
            />
            <Tooltip label={doc.starred ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
              <button onClick={ui.toggleStar} className="tb-btn size-7 rounded-full">
                <Star className={`size-4 transition-all ${doc.starred ? 'scale-110 fill-amber-400 text-amber-400' : ''}`} />
              </button>
            </Tooltip>
            <SaveIndicator state={saveState} updatedAt={doc.updatedAt} onRetry={() => void flush()} />
          </div>
          <MenuBar editor={editor} ui={ui} />
        </div>
        <Popover
          placement="bottom-end"
          trigger={({ toggle, ref }) => (
            <button ref={ref} onClick={toggle} className="btn-primary shrink-0 !rounded-full !pr-3">
              <Download className="size-4" />
              <span className="hidden sm:inline">Télécharger</span>
              <ChevronDown className="hidden size-4 opacity-80 sm:block" />
            </button>
          )}
        >
          {(close) => (
            <MenuList
              close={close}
              minWidth={240}
              items={[
                { label: 'Microsoft Word (.docx)', onSelect: () => exportAs('docx') },
                { label: 'Document PDF (.pdf)', onSelect: () => exportAs('pdf') },
                { label: 'Markdown (.md)', onSelect: () => exportAs('md') },
                { label: 'Page Web (.html)', onSelect: () => exportAs('html') },
                { label: 'Texte brut (.txt)', onSelect: () => exportAs('txt') },
              ]}
            />
          )}
        </Popover>
        <div className="ml-1 hidden size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br sm:flex from-violet-500 to-fuchsia-500 text-sm font-semibold text-white">
          T
        </div>
      </header>

      <Toolbar editor={editor} ui={ui} />
      </div>

      <div className="print-root relative flex flex-1 border-t border-line lg:min-h-0">
        {prefs.showOutline ? (
          <Outline editor={editor} onClose={ui.toggleOutline} />
        ) : (
          <div className="no-print absolute top-4 left-4 z-10 hidden lg:block">
            <Tooltip label="Afficher le plan">
              <button onClick={ui.toggleOutline} className="tb-btn size-9 rounded-full bg-surface shadow-sm">
                <ListTree className="size-[18px]" />
              </button>
            </Tooltip>
          </div>
        )}

        <div className="print-root min-w-0 flex-1 lg:overflow-auto" id="doc-scroller">
          <div className="page-zoom flex flex-col items-center lg:min-w-fit lg:px-6 lg:pb-16" style={{ zoom: prefs.zoom / 100 }}>
            {prefs.showRuler && (
              <div className="no-print sticky top-0 z-20 hidden bg-canvas pt-1.5 pb-1 lg:block">
                <Ruler />
              </div>
            )}
            <div className={`page ${prefs.showRuler ? 'lg:mt-2' : 'lg:mt-6'}`} onClick={(e) => e.target === e.currentTarget && editor.commands.focus('end')}>
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {find.open && <FindReplace editor={editor} withReplace={find.replace} onClose={() => setFind({ open: false, replace: false })} />}
        {prefs.showWordCounter && <WordCounter editor={editor} onClick={() => setDialog('wordcount')} />}
      </div>

      <TextBubble editor={editor} onLink={() => setDialog('link')} />
      <LinkBubble editor={editor} onEdit={() => setDialog('link')} />
      <TableBubble editor={editor} />

      <LinkDialog editor={editor} open={dialog === 'link'} onClose={() => setDialog(null)} />
      <ImageUrlDialog editor={editor} open={dialog === 'imageUrl'} onClose={() => setDialog(null)} />
      <WordCountDialog
        editor={editor}
        doc={doc}
        open={dialog === 'wordcount'}
        onClose={() => setDialog(null)}
        showCounter={prefs.showWordCounter}
        toggleCounter={ui.toggleWordCounter}
      />
      <ShortcutsDialog open={dialog === 'shortcuts'} onClose={() => setDialog(null)} />
      <AboutDialog open={dialog === 'about'} onClose={() => setDialog(null)} />
    </div>
  )
}

/** Auto-sizing title field, like the document name in Docs. */
function TitleInput({
  value,
  onChange,
  onDone,
  inputRef,
}: {
  value: string
  onChange: (v: string) => void
  onDone: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  const shown = value || 'Document sans titre'
  return (
    <div className="relative max-w-[min(480px,60vw)] min-w-0">
      <span aria-hidden className="invisible block truncate px-2 text-lg whitespace-pre">
        {shown}
      </span>
      <input
        ref={inputRef}
        value={value}
        placeholder="Document sans titre"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') {
            e.preventDefault()
            onDone()
          }
        }}
        aria-label="Titre du document"
        className="absolute inset-0 w-full rounded-md border border-transparent bg-transparent px-2 text-lg text-ink outline-none placeholder:text-ink hover:border-line-strong focus:border-accent"
      />
    </div>
  )
}

function SaveIndicator({ state, updatedAt, onRetry }: { state: SaveState; updatedAt: number; onRetry: () => void }) {
  if (state === 'error') {
    return (
      <Tooltip label="Vos dernières modifications ne sont pas enregistrées. Cliquez pour réessayer.">
        <button onClick={onRetry} className="flex h-7 items-center gap-1.5 rounded-full px-2 text-xs font-medium text-danger hover:bg-hover">
          <CloudAlert className="size-4" />
          <span className="hidden md:inline">Non enregistré</span>
        </button>
      </Tooltip>
    )
  }
  return (
    <Tooltip label={state === 'saving' ? 'Enregistrement…' : `Enregistré sur cet appareil · ${relativeTime(updatedAt)}`}>
      <span className="flex h-7 items-center gap-1.5 rounded-full px-1.5 text-xs text-muted">
        {state === 'saving' ? <LoaderCircle className="size-4 animate-spin" /> : <CloudCheck className="size-4" />}
        <span className="hidden md:inline">{state === 'saving' ? 'Enregistrement…' : 'Enregistré'}</span>
      </span>
    </Tooltip>
  )
}

function WordCounter({ editor, onClick }: { editor: Editor; onClick: () => void }) {
  const { words, selection } = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const { from, to, empty } = e.state.selection
      return {
        words: e.storage.characterCount.words() as number,
        selection: empty ? null : e.state.doc.textBetween(from, to, ' ').trim().split(/\s+/).filter(Boolean).length,
      }
    },
  })
  return (
    <button
      onClick={onClick}
      className="no-print fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-10 animate-rise lg:absolute lg:bottom-5 lg:left-5 rounded-lg bg-surface px-3 py-2 text-[13px] text-ink shadow-[var(--popover-shadow)] hover:bg-surface-2"
    >
      {selection !== null ? `${selection.toLocaleString('fr-FR')} sur ` : ''}
      {words.toLocaleString('fr-FR')} mot{words > 1 ? 's' : ''}
    </button>
  )
}
