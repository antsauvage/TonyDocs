import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { JSONContent } from '@tiptap/react'

export interface DocRecord {
  id: string
  title: string
  content: JSONContent
  /** Plain-text excerpt, used for search and fast list rendering. */
  excerpt: string
  wordCount: number
  starred: boolean
  createdAt: number
  updatedAt: number
  openedAt: number
}

interface TonyDocsDB extends DBSchema {
  docs: {
    key: string
    value: DocRecord
    indexes: { 'by-updated': number }
  }
}

let dbPromise: Promise<IDBPDatabase<TonyDocsDB>> | null = null

function db() {
  dbPromise ??= openDB<TonyDocsDB>('tonydocs', 1, {
    upgrade(database) {
      const store = database.createObjectStore('docs', { keyPath: 'id' })
      store.createIndex('by-updated', 'updatedAt')
    },
  })
  return dbPromise
}

export function newId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

export async function listDocs(): Promise<DocRecord[]> {
  const all = await (await db()).getAll('docs')
  return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getDoc(id: string) {
  return (await db()).get('docs', id)
}

export async function putDoc(doc: DocRecord) {
  await (await db()).put('docs', doc)
  return doc
}

export async function updateDoc(id: string, patch: Partial<DocRecord>) {
  const database = await db()
  const current = await database.get('docs', id)
  if (!current) return undefined
  const next = { ...current, ...patch }
  await database.put('docs', next)
  return next
}

export async function deleteDoc(id: string) {
  await (await db()).delete('docs', id)
}

export async function createDoc(init: Partial<DocRecord> = {}): Promise<DocRecord> {
  const now = Date.now()
  return putDoc({
    id: newId(),
    title: '',
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    excerpt: '',
    wordCount: 0,
    starred: false,
    createdAt: now,
    updatedAt: now,
    openedAt: now,
    ...init,
  })
}

export async function duplicateDoc(id: string) {
  const source = await getDoc(id)
  if (!source) return undefined
  const { id: _omit, ...rest } = source
  return createDoc({ ...rest, title: `Copie de ${source.title || 'Document sans titre'}`, starred: false })
}
