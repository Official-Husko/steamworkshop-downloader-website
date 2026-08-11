import { useEffect, useRef, useState } from 'preact/hooks'
import '../styles/dropdown.css'

export interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  value: string
  options: DropdownOption[]
  onChange: (value: string) => void
  ariaLabel?: string
}

export function Dropdown({ value, options, onChange, ariaLabel }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    function onDocPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div class="dropdown" ref={ref}>
      <button
        type="button"
        class={open ? 'dropdown-trigger is-open' : 'dropdown-trigger'}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span>{current?.label ?? value}</span>
        <span class="dropdown-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <ul class="dropdown-menu" role="listbox">
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                class={o.value === value ? 'dropdown-option is-selected' : 'dropdown-option'}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
              >
                <span class="dropdown-check" aria-hidden="true">
                  ›
                </span>
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
