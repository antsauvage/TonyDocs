export interface FontOption {
  label: string
  value: string
}

/** `value` is the CSS font-family stored in the document. */
export const FONTS: FontOption[] = [
  { label: 'Inter', value: 'Inter Variable' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Roboto', value: 'Roboto Flex Variable' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Lora', value: 'Lora Variable' },
  { label: 'Source Serif', value: 'Source Serif 4 Variable' },
  { label: 'Playfair Display', value: 'Playfair Display Variable' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'JetBrains Mono', value: 'JetBrains Mono Variable' },
  { label: 'Courier New', value: 'Courier New' },
]

export const DEFAULT_FONT = FONTS[0]

export function fontLabel(family?: string | null) {
  if (!family) return DEFAULT_FONT.label
  const clean = family.split(',')[0].trim().replace(/^['"]|['"]$/g, '')
  return FONTS.find((f) => f.value === clean)?.label ?? clean
}

export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72, 96]

/** Default sizes (pt) mirrored from the CSS, used when no explicit size is set. */
export const BLOCK_SIZES: Record<string, number> = { p: 11, h1: 22, h2: 16, h3: 13.5, h4: 12 }

export const LINE_SPACINGS = [
  { label: 'Simple', value: '1' },
  { label: '1,15', value: '1.15' },
  { label: '1,5', value: '1.5' },
  { label: 'Double', value: '2' },
]

export const ZOOMS = [50, 75, 90, 100, 125, 150, 200]
