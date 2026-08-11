/** FNV-1a hash mod 360, so a given name always renders the same hue. */
export function nameHue(name: string): number {
  let h = 2166136261
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h) % 360
}

export function nameColor(name: string): string {
  return `oklch(0.80 0.14 ${nameHue(name)})`
}
