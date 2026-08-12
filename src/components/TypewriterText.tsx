import { useTypewriter } from '../hooks/useTypewriter'

interface TypewriterTextProps {
  text: string
  as?: 'span' | 'div' | 'pre' | 'h1'
  class?: string
  startDelayMs?: number
  typeMs?: number
  cursorWhileTyping?: boolean
  'aria-label'?: string
}

/** Types `text` out once on mount, then stays — for headings and "$ "
 * command kickers. Respects prefers-reduced-motion (renders instantly). */
export function TypewriterText({
  text,
  as: Tag = 'span',
  class: className,
  startDelayMs,
  typeMs,
  cursorWhileTyping = true,
  'aria-label': ariaLabel,
}: TypewriterTextProps) {
  const revealed = useTypewriter(text, true, { once: true, startDelayMs, typeMs })
  const done = revealed === text

  return (
    <Tag class={className} aria-label={ariaLabel ?? text}>
      <span aria-hidden="true">{revealed}</span>
      {cursorWhileTyping && !done && <span class="cursor typewriter-caret" aria-hidden="true" />}
    </Tag>
  )
}
