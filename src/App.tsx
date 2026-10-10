import { useEffect, useState } from 'react'
import { useRoute } from './lib/router'
import { useTheme } from './lib/theme'
import { createDoc, listDocs } from './lib/db'
import { htmlToJSON, docStats } from './lib/content'
import { WELCOME_HTML, WELCOME_TITLE } from './lib/templates'
import { HomePage } from './components/home/HomePage'
import { EditorPage } from './components/editor/EditorPage'
import { ToastProvider } from './components/ui/Toast'

const SEEDED_KEY = 'tonydocs:seeded'

/** On the very first visit, create a welcome document that showcases the editor. */
async function seedWelcomeDoc() {
  try {
    if (localStorage.getItem(SEEDED_KEY)) return false
    localStorage.setItem(SEEDED_KEY, '1')
  } catch {
    return false
  }
  if ((await listDocs()).length) return false
  const content = htmlToJSON(WELCOME_HTML)
  await createDoc({ title: WELCOME_TITLE, content, ...docStats(content) })
  return true
}

// Module-level so it runs exactly once, even under StrictMode double effects.
const seeding = seedWelcomeDoc().catch(() => false)

export default function App() {
  const route = useRoute()
  const [theme, setTheme] = useTheme()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    seeding.then(() => setReady(true))
  }, [])

  if (!ready) return null
  return (
    <ToastProvider>
      {route.name === 'doc' ? (
        <EditorPage id={route.id} theme={theme} setTheme={setTheme} />
      ) : (
        <HomePage theme={theme} setTheme={setTheme} />
      )}
    </ToastProvider>
  )
}
