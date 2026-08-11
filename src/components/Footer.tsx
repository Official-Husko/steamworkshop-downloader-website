import { Link } from '../router'

export function Footer() {
  return (
    <footer class="site-footer">
      <span>This website is a community project and is not affiliated with Valve Corporation or Steam.</span>
      <nav class="site-footer-links" aria-label="Legal">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
    </footer>
  )
}
