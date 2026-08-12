import { TypewriterText } from './TypewriterText'

const GLYPH = `
███    ███  ██████  ██████  ██████  ███████ ██       █████  ██    ██
████  ████ ██    ██ ██   ██ ██   ██ ██      ██      ██   ██  ██  ██
██ ████ ██ ██    ██ ██   ██ ██████  █████   ██      ███████   ████
██  ██  ██ ██    ██ ██   ██ ██   ██ ██      ██      ██   ██    ██
 ██      ██  ██████  ██████  ██   ██ ███████ ███████ ██   ██    ██`

export function AsciiLogo({ class: className }: { class?: string }) {
  return <TypewriterText as="pre" text={GLYPH} class={`ascii-logo ${className ?? ''}`} typeMs={4} aria-label="MODRELAY" />
}
