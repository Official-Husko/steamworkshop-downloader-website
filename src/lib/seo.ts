// Single source of truth for the deployed origin. The site is a
// client-rendered SPA with no SSR, so this also drives the static tags in
// index.html, robots.txt, and sitemap.xml — update all four together if
// the domain ever changes.
export const SITE_URL = 'https://workshop.lonewolves.dev'
export const SITE_NAME = 'MODRELAY'
