// Generates a standalone preview of the Worker landing page with local preview images.
// Used only for local review; not part of the production build.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const worker = readFileSync(join(root, 'worker', 'index.js'), 'utf8')

const version = worker.match(/ROUTER_VERSION\s*=\s*'([^']+)'/)?.[1] ?? 'preview'
const cards = worker.match(/const EDITION_CARDS = EDITIONS\.map\([\s\S]*?\)\.join\(''\)/)?.[0] ?? ''

// Evaluate just the data + card template by loading a trimmed module.
const dataPart = worker.slice(0, worker.indexOf('const LANDING_SCHEMA'))
const templateSource = `
${dataPart}
export const cards = ${cards.replace('const EDITION_CARDS = ', '')}
export const editions = EDITIONS
`
const { cards: renderedCards, editions } = await import(
  'data:text/javascript;charset=utf-8,' + encodeURIComponent(templateSource)
)

const css = worker.slice(worker.indexOf('<style>') + 8, worker.indexOf('</style>'))

const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>معاينة الواجهة — Quran Complex ${version}</title>
<style>${css}
body{padding-bottom:40px}
.preview-note{max-width:1180px;margin:0 auto 8px;padding:8px 14px;color:#8a6a1f;background:rgba(212,175,55,.12);border:1px solid rgba(212,175,55,.3);border-radius:10px;font-size:13px}
</style>
</head>
<body data-theme="light">
<div class="preview-note">معاينة محلية للواجهة — إصدار ${version} · ${editions.length} مصحفاً وترجمة</div>
<div class="aurora" aria-hidden="true"><span></span><span></span><span></span></div>
<main class="container">
  <header class="header">
    <span class="eyebrow">QURAN COMPLEX · منصة مصاحف رقمية</span>
    <h1>مجمع القرآن الرقمي</h1>
    <p>INDIVIDUAL TECH INFRASTRUCTURE FOR QURANIC TEXTS</p>
  </header>
  <div class="install-bar">
    <button type="button" id="install-app" class="install-btn"><span aria-hidden="true">⬇</span><span id="install-label">تثبيت الموقع كتطبيق</span></button>
  </div>
  <div class="grid">
${renderedCards.replaceAll('/images/previews/', 'public/images/previews/')}
  </div>
  <nav class="juz-strip" aria-label="أدلة سريعة">
    <a href="#">جزء عم <small>الجزء الثلاثون · 23 صفحة</small></a>
    <a href="#">جزء تبارك <small>الجزء التاسع والعشرون · 20 صفحة</small></a>
  </nav>
</main>
</body>
</html>`

const out = join(root, 'preview.html')
writeFileSync(out, html, 'utf8')
console.log('wrote', out, html.length, 'bytes')
