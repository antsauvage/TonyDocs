import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Content-Security-Policy, injected as a <meta> tag because GitHub Pages cannot send
 * HTTP headers. Production only: Vite's dev server relies on inline scripts (HMR).
 * - scripts: this origin only, no inline, no eval
 * - styles: 'unsafe-inline' is required by the editor's inline formatting (colors, sizes…)
 * - images / fetch: https: allowed because documents may embed remote images,
 *   which the .docx export also downloads
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' data: blob: https:",
  "media-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'none'",
  'upgrade-insecure-requests',
].join('; ')

const contentSecurityPolicy = (): Plugin => ({
  name: 'tonydocs:csp',
  apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
  ],
})

// Relative base so the build works on GitHub Pages (served from /<repo>/) and anywhere else.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), contentSecurityPolicy()],
  build: {
    chunkSizeWarningLimit: 1500,
  },
})
