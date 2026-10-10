import type { Template } from '../../lib/templates'
import type { ThemePref } from '../../lib/theme'

export type ExportFormat = 'docx' | 'pdf' | 'md' | 'html' | 'txt'

/** Everything the chrome (menus, toolbar) can ask the editor page to do. */
export interface EditorUi {
  openFind: (replace?: boolean) => void
  openLink: () => void
  insertImage: () => void
  insertImageUrl: () => void
  exportAs: (format: ExportFormat) => void
  newDoc: (template: Template) => void
  importDoc: () => void
  duplicate: () => void
  remove: () => void
  focusTitle: () => void
  toggleStar: () => void
  starred: boolean
  zoom: number
  setZoom: (z: number) => void
  showOutline: boolean
  toggleOutline: () => void
  showRuler: boolean
  toggleRuler: () => void
  showWordCounter: boolean
  toggleWordCounter: () => void
  theme: ThemePref
  setTheme: (t: ThemePref) => void
  openDialog: (d: 'wordcount' | 'shortcuts' | 'about') => void
}
