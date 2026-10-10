const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const dayFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const fullFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
const longFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' })

export function shortDate(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return timeFmt.format(d)
  if (d.getFullYear() === now.getFullYear()) return dayFmt.format(d)
  return fullFmt.format(d)
}

export function longDate(ts: number) {
  return longFmt.format(new Date(ts))
}

export function relativeTime(ts: number) {
  const seconds = Math.round((Date.now() - ts) / 1000)
  if (seconds < 10) return "à l'instant"
  if (seconds < 60) return `il y a ${seconds} s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  return shortDate(ts)
}

export function countWords(text: string) {
  const words = text.trim().match(/[\p{L}\p{N}'’-]+/gu)
  return words ? words.length : 0
}

export const displayTitle = (title: string) => title.trim() || 'Document sans titre'

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
export const modKey = isMac ? '⌘' : 'Ctrl'
