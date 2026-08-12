export type LogCategory = 'RESOLVE' | 'CACHE' | 'XFER' | 'WARN' | 'ERROR' | 'AUDIT' | 'API'

export interface LogLine {
  time: string
  category: LogCategory
  actor: string
  message: string
}

export const logCounts = { all: 4812, warn: 61, error: 14, audit: 9 }

export const logLines: LogLine[] = [
  { time: '11:41:08', category: 'RESOLVE', actor: '81.7.14.•••', message: '2874113045 ok 341ms · cache miss · Stellar Drift' },
  { time: '11:41:08', category: 'CACHE', actor: '—', message: 'stored 2874113045 ttl 24h' },
  { time: '11:41:11', category: 'XFER', actor: '81.7.14.•••', message: 'start 2874113045 184.2MB' },
  { time: '11:41:14', category: 'WARN', actor: '45.155.203.•••', message: '429 rate limited · python-requests/2.32 · 6th in 60s' },
  { time: '11:41:19', category: 'RESOLVE', actor: '104.28.90.•••', message: '3011884502 ok 12ms · cache hit · 17 children' },
  { time: '11:41:22', category: 'ERROR', actor: '203.0.113.•••', message: 'extractor failed 1602880 · Cobalt Wharf · unknown container magic 0x4357' },
  { time: '11:41:24', category: 'XFER', actor: '81.7.14.•••', message: 'done 2874113045 184.2MB 13.1s 14.0MB/s sha1 ok' },
  { time: '11:41:31', category: 'AUDIT', actor: 'session a71f', message: 'key revealed · donation #612 · Stellar Drift' },
  { time: '11:41:33', category: 'API', actor: 'wdl_live_b104', message: 'GET /v1/item/1902334761 200 · 1,941st today' },
  { time: '11:41:33', category: 'WARN', actor: 'wdl_live_b104', message: 'daily read cap reached · further reads 429 until 00:00 UTC' },
  { time: '11:41:36', category: 'RESOLVE', actor: '188.22.7.•••', message: '2233901847 ok 9ms · cache hit' },
  { time: '11:41:38', category: 'XFER', actor: '92.184.104.•••', message: 'start 1902334761 42.8MB' },
]
