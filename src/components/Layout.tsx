import type { ComponentChildren } from 'preact'
import { Header } from './Header'
import { Footer } from './Footer'
import { useRouter } from '../router'

export function Layout({ children }: { children: ComponentChildren }) {
  const { path } = useRouter()
  return (
    <div class="site">
      <div class="scanlines" aria-hidden="true" />
      <Header />
      <main class="site-main" key={path}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
