// A single shared, hidden mirror element used to measure rendered text
// width in pixels (there's no direct DOM API for "width of this substring
// in this element's font"). Synchronous set-then-read, so one shared
// instance is safe even with multiple callers across the page.
let mirror: HTMLSpanElement | null = null

function getMirror(): HTMLSpanElement {
  if (!mirror) {
    mirror = document.createElement('span')
    mirror.style.position = 'fixed'
    mirror.style.top = '-9999px'
    mirror.style.left = '-9999px'
    mirror.style.visibility = 'hidden'
    mirror.style.whiteSpace = 'pre'
    document.body.appendChild(mirror)
  }
  return mirror
}

export function measureTextWidth(referenceEl: Element, text: string): number {
  const m = getMirror()
  const cs = getComputedStyle(referenceEl)
  m.style.font = cs.font
  m.style.letterSpacing = cs.letterSpacing
  m.textContent = text
  return m.getBoundingClientRect().width
}
