import { MoreVertical, Star, Pencil, Copy, Trash2, StarOff, ExternalLink } from 'lucide-react'
import type { DocRecord } from '../../lib/db'
import { displayTitle, shortDate } from '../../lib/format'
import { Popover } from '../ui/Popover'
import { MenuList } from '../ui/Menu'
import { DocThumbnail } from './DocThumbnail'
import { Logo } from '../ui/Logo'
import { useElementWidth } from '../../lib/useElementWidth'

export interface DocActions {
  open: (doc: DocRecord) => void
  rename: (doc: DocRecord) => void
  duplicate: (doc: DocRecord) => void
  toggleStar: (doc: DocRecord) => void
  remove: (doc: DocRecord) => void
}

function DocMenu({ doc, actions }: { doc: DocRecord; actions: DocActions }) {
  return (
    <Popover
      placement="bottom-end"
      trigger={({ toggle, ref, open }) => (
        <button
          ref={ref}
          onClick={(e) => {
            e.stopPropagation()
            toggle()
          }}
          className={`tb-btn size-8 rounded-full ${open ? 'bg-press' : ''}`}
          aria-label="Plus d'actions"
        >
          <MoreVertical className="size-4" />
        </button>
      )}
    >
      {(close) => (
        <MenuList
          close={close}
          minWidth={220}
          items={[
            { label: 'Ouvrir', icon: ExternalLink, onSelect: () => actions.open(doc) },
            { label: 'Renommer', icon: Pencil, onSelect: () => actions.rename(doc) },
            { label: 'Créer une copie', icon: Copy, onSelect: () => actions.duplicate(doc) },
            {
              label: doc.starred ? 'Retirer des favoris' : 'Ajouter aux favoris',
              icon: doc.starred ? StarOff : Star,
              onSelect: () => actions.toggleStar(doc),
            },
            { type: 'separator' },
            { label: 'Supprimer', icon: Trash2, danger: true, onSelect: () => actions.remove(doc) },
          ]}
        />
      )}
    </Popover>
  )
}

export function DocCard({ doc, actions, index }: { doc: DocRecord; actions: DocActions; index: number }) {
  const [thumbRef, boxWidth] = useElementWidth<HTMLDivElement>(216)
  // Fill the card on phones (2 columns), cap at the desktop size.
  const thumbWidth = Math.max(80, Math.min(176, boxWidth - 28))
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => actions.open(doc)}
      onKeyDown={(e) => e.key === 'Enter' && actions.open(doc)}
      className="group animate-rise cursor-pointer overflow-hidden rounded-lg border border-line bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-lg"
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
    >
      <div
        ref={thumbRef}
        className="flex justify-center overflow-hidden border-b border-line bg-canvas/60 pt-3.5 sm:pt-5"
        style={{ height: Math.round(thumbWidth * 1.08) + 16 }}
      >
        <div className="rounded-t-sm shadow-sm">
          <DocThumbnail content={doc.content} width={thumbWidth} />
        </div>
      </div>
      <div className="flex items-center gap-1 py-2 pr-1 pl-3 sm:gap-2 sm:py-2.5 sm:pr-1.5 sm:pl-3.5">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink">{displayTitle(doc.title)}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
            <Logo className="size-3.5" />
            {doc.starred && <Star className="size-3 fill-amber-400 text-amber-400" />}
            <span>Modifié {shortDate(doc.updatedAt)}</span>
          </div>
        </div>
        <DocMenu doc={doc} actions={actions} />
      </div>
    </div>
  )
}

export function DocRow({ doc, actions }: { doc: DocRecord; actions: DocActions }) {
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => actions.open(doc)}
      onKeyDown={(e) => e.key === 'Enter' && actions.open(doc)}
      className="group flex cursor-pointer items-center gap-4 rounded-full px-4 py-1.5 transition-colors hover:bg-hover"
    >
      <Logo className="size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">{displayTitle(doc.title)}</div>
        <div className="truncate text-xs text-muted">{doc.excerpt || 'Document vide'}</div>
      </div>
      {doc.starred && <Star className="size-4 shrink-0 fill-amber-400 text-amber-400" />}
      <div className="hidden w-24 shrink-0 text-right text-xs text-muted sm:block">{doc.wordCount.toLocaleString('fr-FR')} mots</div>
      <div className="w-24 shrink-0 text-right text-sm text-muted">{shortDate(doc.updatedAt)}</div>
      <DocMenu doc={doc} actions={actions} />
    </div>
  )
}
