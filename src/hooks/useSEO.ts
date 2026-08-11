import { useEffect } from 'preact/hooks'
import { SITE_NAME, SITE_URL } from '../lib/seo'

interface SEOOptions {
  title: string
  description: string
  path: string
  noindex?: boolean
}

/**
 * Updates document.title plus the description/canonical/OpenGraph/Twitter
 * tags on route change. There's no SSR here, so this only helps
 * JS-executing crawlers and the browser tab/bookmark — link unfurlers that
 * don't run JS (Discord, iMessage, etc.) fall back to the static tags in
 * index.html for whatever route they were given.
 */
export function useSEO({ title, description, path, noindex }: SEOOptions) {
  useEffect(() => {
    const fullTitle = title === SITE_NAME ? title : `${title} · ${SITE_NAME}`
    const url = `${SITE_URL}${path}`

    document.title = fullTitle
    setMeta('description', description)
    setMeta('robots', noindex ? 'noindex, follow' : 'index, follow')
    setMeta('og:title', fullTitle, 'property')
    setMeta('og:description', description, 'property')
    setMeta('og:url', url, 'property')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', description)
    setCanonical(url)
  }, [title, description, path, noindex])
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}
