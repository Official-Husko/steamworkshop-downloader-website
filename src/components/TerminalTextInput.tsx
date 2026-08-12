import { useEffect, useRef, useState } from 'preact/hooks'
import type { JSX, RefObject } from 'preact'
import { useCaretOffset } from '../hooks/useCaretOffset'
import { useTypewriter } from '../hooks/useTypewriter'
import { measureTextWidth } from '../lib/measureText'
import '../styles/terminal-caret.css'

interface TerminalTextInputProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'ref' | 'value' | 'placeholder'> {
  value: string
  /** A single placeholder, or a list of example values to cycle through
   * (randomly, never repeating the one just shown) instead of typing and
   * erasing the same word forever. */
  placeholder?: string | string[]
  inputRef?: RefObject<HTMLInputElement>
}

/** A text input whose blinking block cursor is the real caret indicator —
 * it types out the placeholder itself (looping) while empty, and once
 * focused with real content, tracks the actual typing position instead,
 * hiding the native caret. */
export function TerminalTextInput({
  value,
  placeholder,
  inputRef,
  class: className,
  'aria-label': ariaLabel,
  ...rest
}: TerminalTextInputProps) {
  const internalRef = useRef<HTMLInputElement>(null)
  const ref = inputRef ?? internalRef
  const isEmpty = value === ''
  const hasPlaceholder = Array.isArray(placeholder) ? placeholder.length > 0 : !!placeholder
  const firstPlaceholder = Array.isArray(placeholder) ? placeholder[0] : placeholder

  const { offset: caretOffset, visible: caretVisible, restartToken } = useCaretOffset(ref, value)
  const ghostRevealed = useTypewriter(placeholder ?? '', isEmpty && hasPlaceholder)

  const [ghostOffset, setGhostOffset] = useState(0)
  useEffect(() => {
    const input = ref.current
    if (!input) return
    const cs = getComputedStyle(input)
    const leftInset = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.borderLeftWidth) || 0)
    setGhostOffset(leftInset + measureTextWidth(input, ghostRevealed))
  }, [ghostRevealed, ref])

  const showGhost = isEmpty && hasPlaceholder
  const cursorOffset = showGhost ? ghostOffset : caretOffset
  const cursorVisible = showGhost ? true : caretVisible

  return (
    <span class="terminal-caret-host">
      {showGhost && (
        <span class={`terminal-ghost ${className ?? ''}`} aria-hidden="true">
          {ghostRevealed}
        </span>
      )}
      <input
        ref={ref}
        value={value}
        aria-label={ariaLabel ?? firstPlaceholder}
        class={`terminal-caret-input ${className ?? ''}`}
        {...rest}
      />
      {cursorVisible && (
        <span
          key={showGhost ? `ghost-${ghostRevealed.length}` : restartToken}
          class="cursor terminal-caret"
          style={{ left: `${cursorOffset}px` }}
          aria-hidden="true"
        />
      )}
    </span>
  )
}
