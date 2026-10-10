import { useEffect, useState } from 'react'

export type Route = { name: 'home' } | { name: 'doc'; id: string }

function parse(hash: string): Route {
  const match = hash.match(/^#\/d\/([\w-]+)/)
  return match ? { name: 'doc', id: match[1] } : { name: 'home' }
}

/** Minimal hash router: works on static hosting (GitHub Pages) without server rewrites. */
export function useRoute() {
  const [route, setRoute] = useState(() => parse(location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parse(location.hash))
    addEventListener('hashchange', onChange)
    return () => removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function navigate(route: Route) {
  location.hash = route.name === 'doc' ? `/d/${route.id}` : '/'
}
