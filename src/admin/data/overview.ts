export const statTiles = [
  { value: '63,412', tier: 'ok' as const, label: 'FILE REQUESTS · 63%' },
  { value: '88,140', tier: 'warn' as const, label: 'DETAIL LOOKUPS · 88%' },
  { value: '18,904', tier: 'ok' as const, label: 'UNIQUE VISITORS' },
  { value: '4.1', unit: 'TB', tier: 'ok' as const, label: 'EGRESS TODAY' },
  { value: '1.8%', tier: 'err' as const, label: 'FAILED TRANSFERS' },
]

/** One bar per hour, 24h, height as % of the chart's max height. */
export const hourlyRequestBars = [
  22, 18, 15, 12, 16, 26, 44, 68, 100, 88, 74, 66, 71, 63, 58, 61, 70, 82, 78, 64, 48, 36, 29, 24,
]
export const hourlyPeak = '7,104'

export type Severity = 'warn' | 'err' | 'info'

export const needsAttention: { severity: Severity; text: string }[] = [
  { severity: 'warn', text: 'Detail lookups at 88% — throttle at 90%' },
  { severity: 'err', text: 'Cobalt Wharf extractor failing since 06:14' },
  { severity: 'warn', text: '4 API applications older than 7 days' },
  { severity: 'warn', text: '7 donated keys unredeemed' },
  { severity: 'info', text: 'One IP at 41% of all downloads — review' },
]

export const topUserAgents = [
  { agent: 'Chrome 141 / Windows', count: '7,214', percent: 38, flagged: false },
  { agent: 'Firefox 142 / Windows', count: '3,880', percent: 21, flagged: false },
  { agent: 'Chrome 141 / Android', count: '2,104', percent: 11, flagged: false },
  { agent: 'Safari 19 / macOS', count: '1,660', percent: 9, flagged: false },
  { agent: 'python-requests/2.32', count: '1,402', percent: 7, flagged: true },
  { agent: 'curl/8.9.1', count: '988', percent: 5, flagged: true },
]

export const lastVisitors = [
  { ip: '81.7.14', lastOctet: 203, geo: 'DE', agent: 'Firefox 142', reqs: 14, seen: '2s', flagged: false },
  { ip: '104.28.90', lastOctet: 17, geo: 'US', agent: 'Chrome 141', reqs: 3, seen: '9s', flagged: false },
  { ip: '45.155.203', lastOctet: 91, geo: 'NL', agent: 'python-requests/2.32', reqs: 1402, seen: '11s', flagged: true },
  { ip: '92.184.104', lastOctet: 55, geo: 'FR', agent: 'Safari 19 / iOS', reqs: 1, seen: '18s', flagged: false },
  { ip: '203.0.113', lastOctet: 128, geo: 'JP', agent: 'Chrome 141 / Android', reqs: 6, seen: '24s', flagged: false },
  { ip: '188.22.7', lastOctet: 244, geo: 'AT', agent: 'Edge 141', reqs: 2, seen: '31s', flagged: false },
]
