import { useState } from 'preact/hooks'
import type { ComponentChildren, VNode } from 'preact'

// Renders Steam's workshop-description BBCode dialect
// (https://steamcommunity.com/comment/Recommendation/formattinghelp, plus
// [img] which that page omits but workshop descriptions do use) as real
// Preact elements -- never via dangerouslySetInnerHTML, so nothing from
// arbitrary Steam-hosted text can inject raw markup. [url]/[img] targets
// are passed through safeHref, which only accepts http(s), so
// javascript:/data:/etc are silently dropped rather than rendered live.

type Token = { type: 'text'; value: string } | { type: 'open'; tag: string; attr: string } | { type: 'close'; tag: string }

const TAG_RE = /\[(\/?)([a-z0-9*]+)([^\]]*)\]/gi

function tokenize(src: string): Token[] {
  const tokens: Token[] = []
  let last = 0
  TAG_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = TAG_RE.exec(src))) {
    if (m.index > last) tokens.push({ type: 'text', value: src.slice(last, m.index) })
    const [, closing, rawTag, rawAttr] = m
    const tag = rawTag.toLowerCase()

    // [noparse] and [code] bodies are never re-parsed as BBCode -- scan
    // ahead for the raw closing tag instead of tokenizing the interior.
    if (!closing && (tag === 'noparse' || tag === 'code')) {
      const closeTag = `[/${tag}]`
      const closeIdx = src.toLowerCase().indexOf(closeTag, TAG_RE.lastIndex)
      const end = closeIdx === -1 ? src.length : closeIdx
      const inner = src.slice(TAG_RE.lastIndex, end)
      if (tag === 'code') {
        tokens.push({ type: 'open', tag: 'code', attr: '' })
        tokens.push({ type: 'text', value: inner })
        tokens.push({ type: 'close', tag: 'code' })
      } else {
        tokens.push({ type: 'text', value: inner })
      }
      last = closeIdx === -1 ? src.length : closeIdx + closeTag.length
      TAG_RE.lastIndex = last
      continue
    }

    tokens.push(closing ? { type: 'close', tag } : { type: 'open', tag, attr: rawAttr.trim() })
    last = TAG_RE.lastIndex
  }
  if (last < src.length) tokens.push({ type: 'text', value: src.slice(last) })
  return tokens
}

function textToNodes(text: string, pos: Pos): (string | VNode)[] {
  const lines = text.split(/\r\n|\r|\n/)
  const out: (string | VNode)[] = []
  lines.forEach((line, i) => {
    if (line) out.push(line)
    // Keyed off pos.k, a counter shared across the whole parse (not just
    // this call) -- text tokens get flattened into one combined sibling
    // array by parseNodes, so a per-call-local index here would let <br>
    // keys from *different* text tokens collide once merged.
    if (i < lines.length - 1) out.push(<br key={`br-${pos.k++}`} />)
  })
  return out
}

function nodesToPlainText(nodes: (string | VNode)[]): string {
  return nodes.filter((n): n is string => typeof n === 'string').join('')
}

function safeHref(raw: string): string | null {
  const trimmed = raw.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^\/\//.test(trimmed)) return `https:${trimmed}`
  return null
}

interface Pos {
  i: number
  k: number // shared key counter, see textToNodes
}

function parseNodes(tokens: Token[], pos: Pos, stopTag: string | null): (string | VNode)[] {
  const out: (string | VNode)[] = []
  while (pos.i < tokens.length) {
    const t = tokens[pos.i]
    if (t.type === 'close') {
      pos.i++
      if (t.tag === stopTag) return out
      continue // stray/mismatched closing tag -- best-effort recovery, just skip it
    }
    if (t.type === 'text') {
      out.push(...textToNodes(t.value, pos))
      pos.i++
      continue
    }
    pos.i++
    out.push(renderTag(t.tag, t.attr, tokens, pos))
  }
  return out
}

// [*] has no closing tag -- each marker ends the previous item and starts
// the next, up to the list's own closing tag. Needs its own loop rather
// than fitting into parseNodes' generic open/close handling.
function parseListItems(tokens: Token[], pos: Pos, stopTag: string): VNode[] {
  const items: (string | VNode)[][] = []
  let current: (string | VNode)[] = []
  let started = false

  while (pos.i < tokens.length) {
    const t = tokens[pos.i]
    if (t.type === 'close' && t.tag === stopTag) {
      pos.i++
      break
    }
    if (t.type === 'open' && t.tag === '*') {
      if (started) items.push(current)
      current = []
      started = true
      pos.i++
      continue
    }
    if (t.type === 'text') {
      current.push(...textToNodes(t.value, pos))
      pos.i++
      continue
    }
    if (t.type === 'open') {
      pos.i++
      current.push(renderTag(t.tag, t.attr, tokens, pos))
      continue
    }
    pos.i++ // stray close not matching stopTag
  }
  if (started || current.length) items.push(current)
  return items.map((content, i) => <li key={i}>{content}</li>)
}

function renderTag(tag: string, attr: string, tokens: Token[], pos: Pos): VNode {
  switch (tag) {
    case 'b':
      return <strong>{parseNodes(tokens, pos, 'b')}</strong>
    case 'i':
      return <em>{parseNodes(tokens, pos, 'i')}</em>
    case 'u':
      return <u>{parseNodes(tokens, pos, 'u')}</u>
    case 'strike':
      return <s>{parseNodes(tokens, pos, 'strike')}</s>
    case 'h1':
      return <h1 class="bb-heading">{parseNodes(tokens, pos, 'h1')}</h1>
    case 'h2':
      return <h2 class="bb-heading">{parseNodes(tokens, pos, 'h2')}</h2>
    case 'h3':
      return <h3 class="bb-heading">{parseNodes(tokens, pos, 'h3')}</h3>
    case 'hr':
      return <hr class="bb-hr" />
    case 'spoiler':
      return <Spoiler>{parseNodes(tokens, pos, 'spoiler')}</Spoiler>
    case 'list':
      return <ul class="bb-list">{parseListItems(tokens, pos, 'list')}</ul>
    case 'olist':
      return <ol class="bb-list">{parseListItems(tokens, pos, 'olist')}</ol>
    case 'quote': {
      const author = attr.startsWith('=') ? attr.slice(1).trim().replace(/^"|"$/g, '') : ''
      const children = parseNodes(tokens, pos, 'quote')
      return (
        <blockquote class="bb-quote">
          {author && <cite class="bb-quote-author">{author}</cite>}
          <div>{children}</div>
        </blockquote>
      )
    }
    case 'code':
      return (
        <pre class="bb-code">
          <code>{parseNodes(tokens, pos, 'code')}</code>
        </pre>
      )
    case 'table': {
      const children = parseNodes(tokens, pos, 'table')
      const classes = ['bb-table']
      if (/noborder\s*=\s*1/i.test(attr)) classes.push('is-noborder')
      if (/equalcells\s*=\s*1/i.test(attr)) classes.push('is-equalcells')
      return <table class={classes.join(' ')}>{children}</table>
    }
    case 'tr':
      return <tr>{parseNodes(tokens, pos, 'tr')}</tr>
    case 'th':
      return <th>{parseNodes(tokens, pos, 'th')}</th>
    case 'td':
      return <td>{parseNodes(tokens, pos, 'td')}</td>
    case 'url': {
      const explicit = attr.startsWith('=') ? attr.slice(1).trim().replace(/^"|"$/g, '') : ''
      const children = parseNodes(tokens, pos, 'url')
      const href = safeHref(explicit || nodesToPlainText(children))
      if (!href) return <>{children}</>
      return (
        <a href={href} target="_blank" rel="noopener noreferrer nofollow ugc" class="bb-link">
          {children}
        </a>
      )
    }
    case 'img': {
      const children = parseNodes(tokens, pos, 'img')
      const src = safeHref(nodesToPlainText(children))
      if (!src) return <>{children}</>
      return (
        <img
          src={src}
          alt=""
          loading="lazy"
          class="bb-img"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      )
    }
    default:
      // Unrecognized tag -- show it literally rather than silently eating
      // whatever it contains or guessing at its close semantics.
      return <>{`[${tag}${attr}]`}</>
  }
}

function Spoiler({ children }: { children: ComponentChildren }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <span
      class={revealed ? 'bb-spoiler is-revealed' : 'bb-spoiler'}
      role="button"
      tabIndex={0}
      onClick={() => setRevealed(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setRevealed(true)
      }}
    >
      {children}
    </span>
  )
}

export function renderBBCode(text: string): VNode {
  const tokens = tokenize(text)
  const pos: Pos = { i: 0, k: 0 }
  return <>{parseNodes(tokens, pos, null)}</>
}

// For contexts that need plain text, not elements -- e.g. an SEO meta
// description, which would otherwise show literal [h1]/[img] bracket tags
// verbatim in search results and link previews.
export function bbcodeToPlainText(text: string): string {
  return tokenize(text)
    .filter((t): t is Extract<Token, { type: 'text' }> => t.type === 'text')
    .map((t) => t.value)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}
