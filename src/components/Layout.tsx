import type { ComponentChildren } from 'preact'
import { Header } from './Header'
import { Footer } from './Footer'
import { QuotaBanner } from './QuotaBanner'
import { useRouter } from '../router'

export function Layout({ children }: { children: ComponentChildren }) {
  const { path } = useRouter()
  return (
    <div class="site">
      <div class="scanlines" aria-hidden="true" />
      <div class="page-sweep" aria-hidden="true" />
      <Header />
      <QuotaBanner />
      <main class="site-main" key={path}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
