import { Plus, Upload } from 'lucide-react'
import { TEMPLATES, type Template } from '../../lib/templates'
import { DocThumbnail } from './DocThumbnail'

export function TemplateGallery({ onCreate, onImport }: { onCreate: (t: Template) => void; onImport: () => void }) {
  return (
    <section className="border-b border-line bg-surface-2/70">
      <div className="mx-auto max-w-[1080px] px-4 pt-4 pb-5 sm:px-6 sm:pt-5 sm:pb-7">
        <h2 className="mb-3.5 text-[15px] font-medium text-ink">Créer un document</h2>
        <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:gap-5 sm:px-0">
          {TEMPLATES.map((t, i) => (
            <button
              key={t.id}
              onClick={() => onCreate(t)}
              className="group shrink-0 snap-start animate-rise text-left"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="overflow-hidden rounded-md border border-line bg-page transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-accent group-hover:shadow-lg">
                {t.id === 'blank' ? (
                  <div className="flex h-[175px] w-[136px] items-center justify-center">
                    <Plus className="size-14 stroke-[1.25] text-accent transition-transform duration-200 group-hover:scale-110" />
                  </div>
                ) : (
                  <DocThumbnail html={t.html} width={136} />
                )}
              </div>
              <div className="mt-2 text-[13px] font-medium text-ink">{t.name}</div>
            </button>
          ))}
          <button
            onClick={onImport}
            className="group shrink-0 snap-start animate-rise text-left"
            style={{ animationDelay: `${TEMPLATES.length * 40}ms` }}
          >
            <div className="flex h-[177px] w-[138px] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line-strong text-muted transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-accent group-hover:text-accent">
              <Upload className="size-7 stroke-[1.5]" />
              <span className="px-3 text-center text-xs leading-snug">Word, Markdown,<br />HTML ou texte</span>
            </div>
            <div className="mt-2 text-[13px] font-medium text-ink">Importer un fichier</div>
          </button>
        </div>
      </div>
    </section>
  )
}
