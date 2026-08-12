import { useEffect, useState } from 'preact/hooks'
import type { RefObject } from 'preact'
import { measureTextWidth } from '../lib/measureText'

interface CaretInfo {
  offset: number
  visible: boolean
  /** Bumped on every caret-affecting event so the cursor's blink animation
   * can be remounted (via `key`) and restart solid, like a real terminal. */
  restartToken: number
}

const IDLE: CaretInfo = { offset: 0, visible: false, restartToken: 0 }

/** Tracks where a native text input's caret actually is, in pixels, so a
 * custom terminal-style block cursor can replace the browser's native one. */
export function useCaretOffset(ref: RefObject<HTMLInputElement>, value: string): CaretInfo {
  const [info, setInfo] = useState<CaretInfo>(IDLE)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function measure(bump: boolean) {
      const input = el as HTMLInputElement
      const pos = input.selectionEnd ?? input.value.length
      const textWidth = measureTextWidth(input, input.value.slice(0, pos))
      const cs = getComputedStyle(input)
      const leftInset = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.borderLeftWidth) || 0)

      const hasSelection = input.selectionStart !== input.selectionEnd
      const focused = document.activeElement === input
      const offset = leftInset + textWidth - input.scrollLeft
      const visible = !hasSelection && (focused || !input.value)

      setInfo((prev) => ({ offset, visible, restartToken: bump ? prev.restartToken + 1 : prev.restartToken }))
    }

    const onActivity = () => measure(true)
    measure(false)

    el.addEventListener('input', onActivity)
    el.addEventListener('keyup', onActivity)
    el.addEventListener('keydown', onActivity)
    el.addEventListener('click', onActivity)
    el.addEventListener('focus', onActivity)
    el.addEventListener('blur', onActivity)
    el.addEventListener('select', onActivity)
    window.addEventListener('resize', onActivity)

    return () => {
      el.removeEventListener('input', onActivity)
      el.removeEventListener('keyup', onActivity)
      el.removeEventListener('keydown', onActivity)
      el.removeEventListener('click', onActivity)
      el.removeEventListener('focus', onActivity)
      el.removeEventListener('blur', onActivity)
      el.removeEventListener('select', onActivity)
      window.removeEventListener('resize', onActivity)
    }
  }, [ref, value])

  return info
}
