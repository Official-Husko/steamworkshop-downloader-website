import { createContext, type ComponentChildren, type JSX } from 'preact'
import { useCallback, useContext, useEffect, useState } from 'preact/hooks'

interface RouterCtx {
  path: string
  navigate: (to: string) => void
}

const RouterContext = createContext<RouterCtx | null>(null)

export function RouterProvider({ children }: { children: ComponentChildren }) {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((to: string) => {
    if (to !== window.location.pathname) {
      window.history.pushState({}, '', to)
      setPath(to)
    }
    window.scrollTo({ top: 0 })
  }, [])

  return <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>
}

export function useRouter() {
  const ctx = useContext(RouterContext)
  if (!ctx) throw new Error('useRouter must be used within RouterProvider')
  return ctx
}

interface LinkProps extends Omit<JSX.HTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string
  children?: ComponentChildren
}

export function Link({ href, children, onClick, ...rest }: LinkProps) {
  const { navigate } = useRouter()
  return (
    <a
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented) return
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
        e.preventDefault()
        navigate(href)
      }}
    >
      {children}
    </a>
  )
}

export type RouteParams = Record<string, string>

export interface RouteDef {
  path: string
  render: (params: RouteParams) => JSX.Element
}

export function matchRoute(pattern: string, path: string): RouteParams | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)
  if (patternParts.length !== pathParts.length) return null
  const params: RouteParams = {}
  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i]
    if (pp.startsWith(':')) {
      params[pp.slice(1)] = decodeURIComponent(pathParts[i])
    } else if (pp !== pathParts[i]) {
      return null
    }
  }
  return params
}

export function useMatchedRoute(routes: RouteDef[]) {
  const { path } = useRouter()
  for (const route of routes) {
    const params = matchRoute(route.path, path)
    if (params) return route.render(params)
  }
  return null
}
