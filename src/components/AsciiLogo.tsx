const GLYPH = `██     ██  ██████  ██████  ██   ██ ███████ ██   ██  ██████  ██████
██     ██ ██    ██ ██   ██ ██  ██  ██      ██   ██ ██    ██ ██   ██
██  █  ██ ██    ██ ██████  █████   ███████ ███████ ██    ██ ██████
██ ███ ██ ██    ██ ██   ██ ██  ██       ██ ██   ██ ██    ██ ██
 ███ ███   ██████  ██   ██ ██   ██ ███████ ██   ██  ██████  ██     `

export function AsciiLogo({ class: className }: { class?: string }) {
  return (
    <pre class={`ascii-logo ${className ?? ''}`} aria-label="WORKSHOP.DL">
      {GLYPH}
    </pre>
  )
}
