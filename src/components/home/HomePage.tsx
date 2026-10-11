import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, X, LayoutGrid, List as ListIcon, Star, FileText, Moon, Sun, Monitor, Upload } from 'lucide-react'
import { createDoc, deleteDoc, duplicateDoc, listDocs, putDoc, updateDoc, type DocRecord } from '../../lib/db'
import { navigate } from '../../lib/router'
import { displayTitle } from '../../lib/format'
import { htmlToJSON, markdownToJSON, docStats, firstHeading } from '../../lib/content'
import { pickAndImport } from '../../lib/import'
import { userMessage } from '../../lib/errors'
import { TEMPLATES, type Template } from '../../lib/templates'
import type { ThemePref } from '../../lib/theme'
import { Logo } from '../ui/Logo'
import { Tooltip } from '../ui/Tooltip'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/Toast'
import { TemplateGallery } from './TemplateGallery'
import { DocCard, DocRow, type DocActions } from './DocCard'

type Filter = 'all' | 'starred'
type View = 'grid' | 'list'

const VIEW_KEY = 'tonydocs:view'

export function HomePage({ theme, setTheme }: { theme: ThemePref; setTheme: (t: ThemePref) => void }) {
  const [docs, setDocs] = useState<DocRecord[] | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [view, setView] = useState<View>(() => {
    try {
      return (localStorage.getItem(VIEW_KEY) as View) || 'grid'
    } catch {
      return 'grid'
    }
  })
  const [renaming, setRenaming] = useState<DocRecord | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const refresh = useCallback(
    () =>
      listDocs()
        .then(setDocs)
        .catch((err) => {
          console.error(err)
          setDocs([])
          toast("Le stockage du navigateur est indisponible (navigation privée ?) : les documents ne peuvent pas être enregistrés.")
        }),
    [toast],
  )
  useEffect(() => {
    refresh()
    document.title = 'TonyDocs'
  }, [refresh])

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view)
    } catch {
      /* not persisted */
    }
  }, [view])

  // "/" focuses search, like many productivity apps.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement === document.body) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  const visible = useMemo(() => {
    if (!docs) return []
    const q = query.trim().toLowerCase()
    return docs.filter(
      (d) =>
        (filter === 'all' || d.starred) &&
        (!q || displayTitle(d.title).toLowerCase().includes(q) || d.excerpt.toLowerCase().includes(q)),
    )
  }, [docs, query, filter])

  const createFromTemplate = async (t: Template) => {
    const content = htmlToJSON(t.html)
    const doc = await createDoc({ title: t.title, content, ...docStats(content) })
    navigate({ name: 'doc', id: doc.id })
  }

  const importDoc = async () => {
    try {
      const file = await pickAndImport()
      if (!file) return
      const content = file.contentType === 'markdown' ? markdownToJSON(file.content) : htmlToJSON(file.content)
      const doc = await createDoc({ title: file.title || firstHeading(content) || '', content, ...docStats(content) })
      toast(`« ${displayTitle(doc.title)} » importé`)
      navigate({ name: 'doc', id: doc.id })
    } catch (err) {
      console.error(err)
      toast(userMessage(err, "Impossible d'importer ce fichier"))
    }
  }

  const actions: DocActions = {
    open: (doc) => navigate({ name: 'doc', id: doc.id }),
    rename: (doc) => setRenaming(doc),
    duplicate: async (doc) => {
      await duplicateDoc(doc.id)
      await refresh()
      toast('Copie créée')
    },
    toggleStar: async (doc) => {
      await updateDoc(doc.id, { starred: !doc.starred })
      refresh()
    },
    remove: async (doc) => {
      await deleteDoc(doc.id)
      await refresh()
      toast(`« ${displayTitle(doc.title)} » supprimé`, {
        label: 'Annuler',
        run: async () => {
          await putDoc(doc)
          refresh()
        },
      })
    },
  }

  const nextTheme: Record<ThemePref, ThemePref> = { light: 'dark', dark: 'system', system: 'light' }
  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
  const themeLabel = { light: 'Thème clair', dark: 'Thème sombre', system: 'Thème du système' }[theme]

  return (
    <div className="min-h-full bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-2 px-3 sm:gap-4 sm:px-4">
          <a href="#/" className="flex shrink-0 items-center gap-2.5 sm:pr-2" aria-label="TonyDocs">
            <Logo className="size-9" />
            <span className="hidden text-[22px] font-medium tracking-tight text-ink-soft md:inline">
              Tony<span className="text-ink">Docs</span>
            </span>
          </a>
          <div className="mx-auto flex w-full max-w-[720px] min-w-0 items-center gap-2 rounded-full bg-surface-2 px-3 sm:gap-3 sm:px-4 transition-shadow focus-within:bg-surface focus-within:shadow-[var(--popover-shadow)]">
            <Search className="size-5 shrink-0 text-muted" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher"
              className="h-11 w-full min-w-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted sm:h-12"
              aria-label="Rechercher"
            />
            {query && (
              <button onClick={() => setQuery('')} className="tb-btn size-8 rounded-full" aria-label="Effacer">
                <X className="size-4" />
              </button>
            )}
          </div>
          <Tooltip label="Importer un fichier">
            <button onClick={importDoc} className="tb-btn hidden size-10 shrink-0 rounded-full sm:inline-flex">
              <Upload className="size-5" />
            </button>
          </Tooltip>
          <Tooltip label={themeLabel}>
            <button onClick={() => setTheme(nextTheme[theme])} className="tb-btn size-10 shrink-0 rounded-full">
              <ThemeIcon className="size-5" />
            </button>
          </Tooltip>
          <div className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br sm:flex from-violet-500 to-fuchsia-500 text-sm font-semibold text-white">
            T
          </div>
        </div>
      </header>

      {!query && <TemplateGallery onCreate={createFromTemplate} onImport={importDoc} />}

      <main className="mx-auto max-w-[1080px] px-4 py-5 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-6">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="mr-auto min-w-0 truncate text-[15px] font-medium text-ink">
            {query ? `Résultats pour « ${query} »` : 'Documents récents'}
          </h2>
          <div className="flex rounded-full border border-line p-0.5">
            {(
              [
                ['all', 'Tous'],
                ['starred', 'Favoris'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors ${
                  filter === key ? 'bg-selected text-selected-ink' : 'text-ink-soft hover:bg-hover'
                }`}
              >
                {key === 'starred' && <Star className="size-3.5" />}
                {label}
              </button>
            ))}
          </div>
          <Tooltip label={view === 'grid' ? 'Affichage en liste' : 'Affichage en grille'}>
            <button onClick={() => setView(view === 'grid' ? 'list' : 'grid')} className="tb-btn size-9 rounded-full">
              {view === 'grid' ? <ListIcon className="size-[18px]" /> : <LayoutGrid className="size-[18px]" />}
            </button>
          </Tooltip>
        </div>

        {docs && visible.length === 0 && (
          <div className="flex animate-fade flex-col items-center py-20 text-center">
            <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-accent-soft">
              <FileText className="size-9 text-accent" />
            </div>
            <p className="text-base font-medium text-ink">
              {query ? 'Aucun document ne correspond' : filter === 'starred' ? 'Aucun favori pour le moment' : 'Aucun document'}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              {query
                ? 'Essayez avec d’autres mots-clés.'
                : filter === 'starred'
                  ? 'Ajoutez une étoile à un document pour le retrouver ici.'
                  : 'Créez votre premier document à partir d’un modèle ci-dessus.'}
            </p>
            {!query && filter === 'all' && (
              <button onClick={() => createFromTemplate(TEMPLATES[0])} className="btn-primary mt-6">
                Nouveau document
              </button>
            )}
          </div>
        )}

        {view === 'grid' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(208px,1fr))] sm:gap-5">
            {visible.map((doc, i) => (
              <DocCard key={doc.id} doc={doc} actions={actions} index={i} />
            ))}
          </div>
        ) : (
          visible.length > 0 && (
            <div className="-mx-3 flex flex-col sm:-mx-4">
              <div className="flex px-4 pb-2 text-xs font-medium text-muted">
                <span className="flex-1 pl-9">Nom</span>
                <span className="hidden w-24 text-right sm:block">Longueur</span>
                <span className="w-24 text-right">Modifié</span>
                <span className="w-8" />
              </div>
              {visible.map((doc) => (
                <DocRow key={doc.id} doc={doc} actions={actions} />
              ))}
            </div>
          )
        )}
      </main>

      <RenameDialog
        doc={renaming}
        onClose={() => setRenaming(null)}
        onSave={async (title) => {
          if (renaming) await updateDoc(renaming.id, { title })
          setRenaming(null)
          refresh()
        }}
      />
    </div>
  )
}

function RenameDialog({ doc, onClose, onSave }: { doc: DocRecord | null; onClose: () => void; onSave: (t: string) => void }) {
  const [value, setValue] = useState('')
  useEffect(() => setValue(doc?.title ?? ''), [doc])
  return (
    <Modal
      open={!!doc}
      onClose={onClose}
      title="Renommer"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary" onClick={() => onSave(value.trim())}>
            OK
          </button>
        </>
      }
    >
      <p className="mb-3 text-sm text-muted">Saisissez un nouveau nom pour ce document :</p>
      <input
        autoFocus
        className="field"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSave(value.trim())}
        onFocus={(e) => e.target.select()}
      />
    </Modal>
  )
}
