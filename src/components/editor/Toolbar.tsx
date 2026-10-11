import { useEffect, useState, type ReactNode } from 'react'
import { useEditorState, type Editor } from '@tiptap/react'
import {
  Undo2,
  Redo2,
  Printer,
  Search,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  Highlighter,
  Link2,
  ImagePlus,
  Table,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListChecks,
  IndentDecrease,
  IndentIncrease,
  RemoveFormatting,
  Minus,
  Plus,
  Baseline,
  Strikethrough,
  Code,
  TextQuote,
  Check,
  ArrowUpDown,
} from 'lucide-react'
import { Tooltip } from '../ui/Tooltip'
import { Popover } from '../ui/Popover'
import { ColorPicker } from '../ui/ColorPicker'
import { FONTS, FONT_SIZES, BLOCK_SIZES, LINE_SPACINGS, ZOOMS, fontLabel } from '../../editor/fonts'
import { modKey } from '../../lib/format'
import { TableGridPicker } from './TableGridPicker'
import type { EditorUi } from './types'

const Sep = () => <div className="mx-1 h-5 w-px shrink-0 bg-line-strong/70" />

function Btn({
  label,
  shortcut,
  onClick,
  active,
  disabled,
  children,
}: {
  label: string
  shortcut?: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <Tooltip label={label} shortcut={shortcut}>
      <button
        className="tb-btn shrink-0"
        data-active={active ? 'true' : undefined}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
      >
        {children}
      </button>
    </Tooltip>
  )
}

/** Dropdown trigger styled like Docs' toolbar selects. */
function Select({
  label,
  width,
  value,
  children,
  tooltip,
}: {
  label?: string
  width: number
  value: ReactNode
  tooltip: string
  children: (close: () => void) => ReactNode
}) {
  return (
    <Popover
      trigger={({ toggle, ref, open }) => (
        <Tooltip label={tooltip}>
          <button
            ref={ref}
            aria-label={label ?? tooltip}
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggle}
            className="tb-btn shrink-0 justify-between gap-1 px-2 text-[13.5px] text-ink"
            data-active={open ? 'true' : undefined}
            style={{ width }}
          >
            <span className="truncate">{value}</span>
            <ChevronDown className="size-3.5 shrink-0 opacity-70" />
          </button>
        </Tooltip>
      )}
    >
      {children}
    </Popover>
  )
}

function OptionList<T>({
  options,
  current,
  onPick,
  render,
  close,
  width = 180,
}: {
  options: T[]
  current: (o: T) => boolean
  onPick: (o: T) => void
  render: (o: T) => ReactNode
  close: () => void
  width?: number
}) {
  return (
    <div className="popover-surface max-h-[60vh] overflow-y-auto p-1.5" style={{ width }}>
      {options.map((o, i) => (
        <button
          key={i}
          className="menu-item"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onPick(o)
            close()
          }}
        >
          <span className="flex size-4 shrink-0 items-center justify-center">{current(o) && <Check className="size-4 text-accent" />}</span>
          {render(o)}
        </button>
      ))}
    </div>
  )
}

const STYLES = [
  { label: 'Texte normal', level: 0, className: 'text-[14px]' },
  { label: 'Titre 1', level: 1, className: 'text-[22px] font-semibold' },
  { label: 'Titre 2', level: 2, className: 'text-[18px] font-semibold' },
  { label: 'Titre 3', level: 3, className: 'text-[16px] font-semibold' },
  { label: 'Titre 4', level: 4, className: 'text-[14px] font-semibold opacity-80' },
] as const

function FontSizeControl({ editor, size }: { editor: Editor; size: number }) {
  const [draft, setDraft] = useState(String(size))
  useEffect(() => setDraft(String(size)), [size])
  const apply = (n: number) => {
    const clamped = Math.min(400, Math.max(1, Math.round(n * 2) / 2))
    editor.chain().focus().setFontSize(`${clamped}pt`).run()
  }
  const step = (dir: 1 | -1) => {
    const next =
      dir > 0 ? (FONT_SIZES.find((s) => s > size) ?? size + 10) : ([...FONT_SIZES].reverse().find((s) => s < size) ?? Math.max(1, size - 1))
    apply(next)
  }
  return (
    <div className="flex shrink-0 items-center">
      <Btn label="Diminuer la taille de police" onClick={() => step(-1)}>
        <Minus className="size-4" />
      </Btn>
      <Popover
        trigger={({ toggle, ref }) => (
          <input
            ref={ref as unknown as React.RefObject<HTMLInputElement>}
            aria-label="Taille de police"
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/[^\d.,]/g, ''))}
            onFocus={(e) => {
              e.target.select()
              toggle()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const n = parseFloat(draft.replace(',', '.'))
                if (!Number.isNaN(n)) apply(n)
              }
            }}
            onBlur={() => setDraft(String(size))}
            className="h-7 w-9 rounded-md border border-line-strong bg-transparent text-center text-[13.5px] text-ink outline-none focus:border-accent"
          />
        )}
      >
        {(close) => (
          <OptionList
            options={FONT_SIZES}
            width={80}
            current={(s) => s === size}
            onPick={(s) => apply(s)}
            render={(s) => s}
            close={close}
          />
        )}
      </Popover>
      <Btn label="Augmenter la taille de police" onClick={() => step(1)}>
        <Plus className="size-4" />
      </Btn>
    </div>
  )
}

function ColorButton({
  editor,
  kind,
  color,
}: {
  editor: Editor
  kind: 'text' | 'highlight'
  color: string | null
}) {
  const isText = kind === 'text'
  const Icon = isText ? Baseline : Highlighter
  return (
    <Popover
      trigger={({ toggle, ref, open }) => (
        <Tooltip label={isText ? 'Couleur du texte' : 'Couleur de surlignage'}>
          <button
            ref={ref}
            className="tb-btn shrink-0 flex-col !gap-0 px-1"
            data-active={open ? 'true' : undefined}
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggle}
          >
            <Icon className="size-4" />
            <span
              className="mt-px h-[3px] w-4 rounded-full"
              style={{ background: color ?? (isText ? 'var(--page-ink)' : 'transparent'), boxShadow: color ? undefined : isText ? undefined : 'inset 0 0 0 1px var(--line-strong)' }}
            />
          </button>
        </Tooltip>
      )}
    >
      {(close) => (
        <ColorPicker
          value={color}
          resetLabel={isText ? 'Couleur par défaut' : 'Aucun surlignage'}
          onChange={(c) => {
            if (isText) editor.chain().focus().setColor(c).run()
            else editor.chain().focus().setHighlight({ color: c }).run()
            close()
          }}
          onReset={() => {
            if (isText) editor.chain().focus().unsetColor().run()
            else editor.chain().focus().unsetHighlight().run()
            close()
          }}
        />
      )}
    </Popover>
  )
}

export function Toolbar({ editor, ui }: { editor: Editor; ui: EditorUi }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const heading = [1, 2, 3, 4].find((level) => e.isActive('heading', { level })) ?? 0
      const ts = e.getAttributes('textStyle')
      const block = e.isActive('heading') ? e.getAttributes('heading') : e.getAttributes('paragraph')
      return {
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
        heading,
        font: ts.fontFamily as string | undefined,
        size: ts.fontSize ? parseFloat(ts.fontSize) * (String(ts.fontSize).endsWith('px') ? 0.75 : 1) : BLOCK_SIZES[heading ? `h${heading}` : 'p'],
        color: (ts.color as string) ?? null,
        highlight: (e.getAttributes('highlight').color as string) ?? null,
        bold: e.isActive('bold'),
        italic: e.isActive('italic'),
        underline: e.isActive('underline'),
        strike: e.isActive('strike'),
        code: e.isActive('code'),
        link: e.isActive('link'),
        quote: e.isActive('blockquote'),
        align: (['left', 'center', 'right', 'justify'] as const).find((a) => e.isActive({ textAlign: a })) ?? 'left',
        lineHeight: (block.lineHeight as string | null) ?? null,
        bullet: e.isActive('bulletList'),
        ordered: e.isActive('orderedList'),
        task: e.isActive('taskList'),
      }
    },
  })

  const chain = () => editor.chain().focus()
  const styleLabel = STYLES.find((st) => st.level === s.heading)?.label ?? 'Texte normal'

  return (
    <div className="px-2 pb-2">
      <div
        role="toolbar"
        aria-label="Mise en forme"
        className="flex h-10 items-center gap-0.5 overflow-x-auto rounded-full bg-toolbar px-3 [scrollbar-width:none]"
      >
        <Btn label="Rechercher" shortcut={`${modKey}+F`} onClick={() => ui.openFind()}>
          <Search className="size-4" />
        </Btn>
        <Btn label="Annuler" shortcut={`${modKey}+Z`} onClick={() => chain().undo().run()} disabled={!s.canUndo}>
          <Undo2 className="size-4" />
        </Btn>
        <Btn label="Rétablir" shortcut={`${modKey}+Y`} onClick={() => chain().redo().run()} disabled={!s.canRedo}>
          <Redo2 className="size-4" />
        </Btn>
        <div className="hidden lg:contents">
          <Btn label="Imprimer" shortcut={`${modKey}+P`} onClick={() => ui.exportAs('pdf')}>
            <Printer className="size-4" />
          </Btn>
        </div>

        {/* Zoom only makes sense with the fixed-width page (desktop). */}
        <div className="hidden lg:contents">
          <Select tooltip="Zoom" width={74} value={`${ui.zoom} %`}>
            {(close) => (
              <OptionList options={ZOOMS} width={110} current={(z) => z === ui.zoom} onPick={ui.setZoom} render={(z) => `${z} %`} close={close} />
            )}
          </Select>
          <Sep />
        </div>

        <Select tooltip="Styles" width={124} value={styleLabel}>
          {(close) => (
            <OptionList
              options={[...STYLES]}
              width={240}
              current={(st) => st.level === s.heading}
              onPick={(st) => (st.level ? chain().setHeading({ level: st.level }).run() : chain().setParagraph().run())}
              render={(st) => <span className={`text-ink ${st.className}`}>{st.label}</span>}
              close={close}
            />
          )}
        </Select>
        <Sep />

        <Select tooltip="Police" width={118} value={fontLabel(s.font)}>
          {(close) => (
            <OptionList
              options={FONTS}
              width={210}
              current={(f) => fontLabel(s.font) === f.label}
              onPick={(f) => chain().setFontFamily(f.value).run()}
              render={(f) => <span style={{ fontFamily: f.value }}>{f.label}</span>}
              close={close}
            />
          )}
        </Select>
        <Sep />

        <FontSizeControl editor={editor} size={Math.round(s.size * 2) / 2} />
        <Sep />

        <Btn label="Gras" shortcut={`${modKey}+B`} active={s.bold} onClick={() => chain().toggleBold().run()}>
          <Bold className="size-4" />
        </Btn>
        <Btn label="Italique" shortcut={`${modKey}+I`} active={s.italic} onClick={() => chain().toggleItalic().run()}>
          <Italic className="size-4" />
        </Btn>
        <Btn label="Souligné" shortcut={`${modKey}+U`} active={s.underline} onClick={() => chain().toggleUnderline().run()}>
          <Underline className="size-4" />
        </Btn>
        <Btn label="Barré" shortcut={`${modKey}+Maj+S`} active={s.strike} onClick={() => chain().toggleStrike().run()}>
          <Strikethrough className="size-4" />
        </Btn>
        <ColorButton editor={editor} kind="text" color={s.color} />
        <ColorButton editor={editor} kind="highlight" color={s.highlight} />
        <Sep />

        <Btn label="Insérer un lien" shortcut={`${modKey}+K`} active={s.link} onClick={ui.openLink}>
          <Link2 className="size-4" />
        </Btn>
        <Btn label="Insérer une image" onClick={ui.insertImage}>
          <ImagePlus className="size-4" />
        </Btn>
        <Popover
          trigger={({ toggle, ref, open }) => (
            <Tooltip label="Insérer un tableau">
              <button ref={ref} className="tb-btn shrink-0" data-active={open ? 'true' : undefined} onMouseDown={(e) => e.preventDefault()} onClick={toggle}>
                <Table className="size-4" />
              </button>
            </Tooltip>
          )}
        >
          {(close) => (
            <div className="popover-surface p-3">
              <TableGridPicker
                onPick={(rows, cols) => {
                  chain().insertTable({ rows, cols, withHeaderRow: true }).run()
                  close()
                }}
              />
            </div>
          )}
        </Popover>
        <Btn label="Citation" active={s.quote} onClick={() => chain().toggleBlockquote().run()}>
          <TextQuote className="size-4" />
        </Btn>
        <Btn label="Code" shortcut={`${modKey}+E`} active={s.code} onClick={() => chain().toggleCode().run()}>
          <Code className="size-4" />
        </Btn>
        <Sep />

        <Btn label="Aligner à gauche" shortcut={`${modKey}+Maj+L`} active={s.align === 'left'} onClick={() => chain().setTextAlign('left').run()}>
          <AlignLeft className="size-4" />
        </Btn>
        <Btn label="Centrer" shortcut={`${modKey}+Maj+E`} active={s.align === 'center'} onClick={() => chain().setTextAlign('center').run()}>
          <AlignCenter className="size-4" />
        </Btn>
        <Btn label="Aligner à droite" shortcut={`${modKey}+Maj+R`} active={s.align === 'right'} onClick={() => chain().setTextAlign('right').run()}>
          <AlignRight className="size-4" />
        </Btn>
        <Btn label="Justifier" shortcut={`${modKey}+Maj+J`} active={s.align === 'justify'} onClick={() => chain().setTextAlign('justify').run()}>
          <AlignJustify className="size-4" />
        </Btn>
        <Select tooltip="Interligne" width={46} value={<ArrowUpDown className="size-4" />}>
          {(close) => (
            <OptionList
              options={LINE_SPACINGS}
              width={160}
              current={(l) => (s.lineHeight ?? '1.5') === l.value}
              onPick={(l) => chain().setLineSpacing(l.value).run()}
              render={(l) => l.label}
              close={close}
            />
          )}
        </Select>
        <Sep />

        <Btn label="Liste de tâches" shortcut={`${modKey}+Maj+9`} active={s.task} onClick={() => chain().toggleTaskList().run()}>
          <ListChecks className="size-4" />
        </Btn>
        <Btn label="Liste à puces" shortcut={`${modKey}+Maj+8`} active={s.bullet} onClick={() => chain().toggleBulletList().run()}>
          <List className="size-4" />
        </Btn>
        <Btn label="Liste numérotée" shortcut={`${modKey}+Maj+7`} active={s.ordered} onClick={() => chain().toggleOrderedList().run()}>
          <ListOrdered className="size-4" />
        </Btn>
        <Btn label="Diminuer le retrait" shortcut="Maj+Tab" onClick={() => chain().outdent().run()}>
          <IndentDecrease className="size-4" />
        </Btn>
        <Btn label="Augmenter le retrait" shortcut="Tab" onClick={() => chain().indent().run()}>
          <IndentIncrease className="size-4" />
        </Btn>
        <Sep />
        <Btn
          label="Effacer la mise en forme"
          shortcut={`${modKey}+\\`}
          onClick={() => chain().unsetAllMarks().unsetTextAlign().unsetLineSpacing().run()}
        >
          <RemoveFormatting className="size-4" />
        </Btn>
      </div>
    </div>
  )
}
