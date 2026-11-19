/**
 * مولّد SEO الكامل: robots، خرائط المواقع والصور، صفحات لكل الأجزاء والروايات.
 * تُنتج الملفات داخل public/ فتُنسخ إلى dist/ أثناء البناء.
 * الاستخدام: npm run build:seo (أو npm run build)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const dataDir = join(root, 'src', 'data')
const publicDir = join(root, 'public')
const seoDir = join(publicDir, 'seo')
mkdirSync(seoDir, { recursive: true })

const SITE = 'https://qurancomplex.ly'
const REPO = 'https://github.com/Gamingmonster2/hafs'
const today = new Date().toISOString().slice(0, 10)
const COVERS = 3 // الصور 1-3 أغلفة، صفحة المصحف 1 = الصورة 4

function readJson(name) {
  return JSON.parse(readFileSync(join(dataDir, name), 'utf8'))
}

const JUZ_NAMES = readJson('juz-names.json')

const MUSHAFS = [
  { id: 'hafs', host: 'hafs.qurancomplex.ly', short: 'حفص عن عاصم', riwayah: 'حفص عن عاصم' },
  { id: 'qaloon', host: 'qaloon.qurancomplex.ly', short: 'قالون عن نافع', riwayah: 'قالون عن نافع' },
  { id: 'warsh', host: 'warsh.qurancomplex.ly', short: 'ورش عن نافع', riwayah: 'ورش عن نافع' },
  { id: 'shubah', host: 'shubah.qurancomplex.ly', short: 'شعبة عن عاصم', riwayah: 'شعبة عن عاصم' },
  { id: 'susi', host: 'susi.qurancomplex.ly', short: 'السوسي عن أبي عمرو', riwayah: 'السوسي عن أبي عمرو' },
  { id: 'douri', host: 'duri.qurancomplex.ly', short: 'الدوري عن أبي عمرو', riwayah: 'الدوري عن أبي عمرو' },
  { id: 'standard1', host: 'standard1.qurancomplex.ly', short: 'المصحف العادي 1', riwayah: 'حفص عن عاصم', covers: 0 },
  { id: 'standard2', host: 'standard2.qurancomplex.ly', short: 'المصحف العادي 2', riwayah: 'حفص عن عاصم', covers: 0 },
  { id: 'big', host: 'big.qurancomplex.ly', short: 'المصحف الكبير', riwayah: 'حفص عن عاصم', covers: 0 },
]

const data = MUSHAFS.map((m) => ({
  ...m,
  index: readJson(`${m.id}-index.json`),
  pages: readJson(`${m.id}-pages.json`),
}))

const xml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;')

const readerUrl = (mushaf, page) => `https://${mushaf.host}/?mushaf=${mushaf.id}&page=${page}`
const imageForPage = (mushaf, page) => {
  const src = mushaf.pages[page + (mushaf.covers ?? COVERS) - 1]
  // الصور المحلية مسارات نسبية، لكن خرائط المواقع وبيانات OG تحتاج روابط مطلقة
  return src?.startsWith('/') ? `${SITE}${src}` : src
}

function juzRange(mushaf, number) {
  const start = mushaf.index.juz[number - 1].page
  const end = number === 30 ? 604 : mushaf.index.juz[number].page - 1
  return { start, end }
}

function surahsBetween(mushaf, start, end) {
  return mushaf.index.surahs.filter((surah) => surah.page >= start && surah.page <= end)
}

/** العنوانCanonical: جزء عم وتبارك لهما صفحاتهما الاسمية */
const juzPath = (number) => (number === 30 ? '/juz-amma' : number === 29 ? '/juz-tabarak' : `/juz-${number}`)
const juzFile = (number) => (number === 30 ? 'juz-amma' : number === 29 ? 'juz-tabarak' : `juz-${number}`)

/* ---------- robots.txt ---------- */
writeFileSync(join(publicDir, 'robots.txt'), [
  'User-agent: *',
  'Allow: /',
  '',
  `Sitemap: ${SITE}/sitemap.xml`,
  '',
].join('\n'), 'utf8')

/* ---------- مساعدات XML ---------- */
function urlEntry(loc, { priority = '0.5', changefreq = 'weekly', images = [] } = {}) {
  const imageLines = images.map((image) => [
    '    <image:image>',
    `      <image:loc>${xml(image.loc)}</image:loc>`,
    `      <image:title>${xml(image.title)}</image:title>`,
    `      <image:caption>${xml(image.caption)}</image:caption>`,
    '    </image:image>',
  ].join('\n'))
  return [
    '  <url>',
    `    <loc>${xml(loc)}</loc>`,
    `    <lastmod>${today}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    ...imageLines,
    '  </url>',
  ].join('\n')
}

function urlset(entries, withImages = false) {
  const ns = withImages ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ''
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${ns}>\n${entries.join('\n')}\n</urlset>\n`
}

/* ---------- خريطة الصفحات ---------- */
const pageEntries = [
  urlEntry(`${SITE}/`, { priority: '1.0', changefreq: 'daily' }),
  urlEntry(`${SITE}/juz`, { priority: '0.9' }),
  urlEntry(`${SITE}/riwayat`, { priority: '0.9' }),
]

for (let number = 1; number <= 30; number++) {
  pageEntries.push(urlEntry(`${SITE}${juzPath(number)}`, { priority: '0.8' }))
}
for (const mushaf of data) {
  pageEntries.push(urlEntry(`${SITE}/riwayah/${mushaf.id}`, { priority: '0.8' }))
  pageEntries.push(urlEntry(`https://${mushaf.host}/`, { priority: '0.9', changefreq: 'daily' }))
  for (const juz of mushaf.index.juz) {
    pageEntries.push(urlEntry(readerUrl(mushaf, juz.page), { priority: '0.7', changefreq: 'monthly' }))
  }
  for (const surah of mushaf.index.surahs) {
    pageEntries.push(urlEntry(readerUrl(mushaf, surah.page), { priority: '0.6', changefreq: 'monthly' }))
  }
}
writeFileSync(join(publicDir, 'sitemap-mushafs.xml'), urlset(pageEntries), 'utf8')

/* ---------- خرائط الصور ---------- */
function imagesForJuz(number) {
  const images = []
  for (const mushaf of data) {
    const { start, end } = juzRange(mushaf, number)
    for (let page = start; page <= end; page++) {
      const loc = imageForPage(mushaf, page)
      if (!loc) continue
      images.push({
        loc,
        title: `صفحة ${page} من جزء ${number} — ${mushaf.short}`,
        caption: `صفحة ${page} من مصحف المدينة النبوية برواية ${mushaf.riwayah}، جزء ${number}، صورة عالية الجودة للقراءة والتصفح.`,
      })
    }
  }
  return images
}

// خريطة شاملة: كل صورة مدرجة تحت صفحة الجزء التي تعرضها فعلاً (معرض الصور).
const allImageEntries = []
for (let number = 1; number <= 30; number++) {
  allImageEntries.push(urlEntry(`${SITE}${juzPath(number)}`, {
    priority: '0.8',
    changefreq: 'monthly',
    images: imagesForJuz(number),
  }))
}
writeFileSync(join(publicDir, 'sitemap-images.xml'), urlset(allImageEntries, true), 'utf8')

// خريطتان مخصّصتان للجزأين الأكثر بحثاً (تبقيان كمرجع مباشر)
for (const number of [30, 29]) {
  const file = number === 30 ? 'sitemap-images-amma.xml' : 'sitemap-images-tabarak.xml'
  writeFileSync(join(publicDir, file), urlset([
    urlEntry(`${SITE}${juzPath(number)}`, { priority: '0.9', images: imagesForJuz(number) }),
  ], true), 'utf8')
}

/* ---------- فهرس الخرائط ---------- */
const sitemapFiles = [
  'sitemap-mushafs.xml',
  'sitemap-images.xml',
  'sitemap-images-amma.xml',
  'sitemap-images-tabarak.xml',
]
const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapFiles.map((file) => `  <sitemap><loc>${SITE}/${file}</loc><lastmod>${today}</lastmod></sitemap>`).join('\n')}\n</sitemapindex>\n`
writeFileSync(join(publicDir, 'sitemap.xml'), sitemapIndex, 'utf8')

/* ---------- قالب الصفحات ---------- */
const styles = `
  :root{--gold:#b8892b;--bg:#f6f6f4;--fg:#18181b;--muted:#71717a;--card:rgba(255,255,255,.66);--border:rgba(212,175,55,.3);--radius:20px;--shadow:0 14px 40px -18px rgba(24,24,27,.3)}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--fg);font-family:'Cairo',system-ui,sans-serif;line-height:1.9;direction:rtl}
  .wrap{max-width:1000px;margin:0 auto;padding:48px 20px 72px}
  header{text-align:center;margin-bottom:40px}
  .eyebrow{display:inline-block;padding:6px 16px;border:1px solid var(--border);border-radius:999px;color:var(--gold);font-size:12px}
  h1{font-family:'Amiri',serif;font-size:clamp(2.2rem,6vw,3.6rem);color:var(--gold);margin:14px 0 8px}
  .lead{color:var(--muted);max-width:820px;margin:0 auto}
  .panel{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);padding:28px;margin:28px 0;backdrop-filter:blur(16px)}
  h2{font-family:'Amiri',serif;color:var(--gold);font-size:1.8rem;margin-top:0}
  h3{font-family:'Amiri',serif;color:var(--gold);margin:18px 0 0}
  .surahs{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;list-style:none;padding:0;margin:0}
  .surahs li{display:flex;justify-content:space-between;gap:10px;padding:9px 12px;border:1px solid var(--border);border-radius:10px;font-size:14px}
  .surahs small{color:var(--muted)}
  .mushaf-grid,.juz-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
  .mushaf-card{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px;border:1px solid var(--border);border-radius:14px;text-decoration:none;color:inherit;background:rgba(255,255,255,.35);transition:.25s ease}
  .mushaf-card:hover{transform:translateY(-4px);border-color:var(--gold)}
  .mushaf-card strong{color:var(--gold);font-size:1rem}
  .mushaf-card small{display:block;color:var(--muted)}
  .mushaf-card span:last-child{color:var(--gold);font-size:20px}
  .juz-grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}
  .juz-card{padding:14px 16px;border:1px solid var(--border);border-radius:12px;text-decoration:none;color:inherit;background:rgba(255,255,255,.35);transition:.25s ease}
  .juz-card:hover{transform:translateY(-3px);border-color:var(--gold)}
  .juz-card strong{display:block;color:var(--gold);font-family:'Amiri',serif;font-size:1.2rem}
  .juz-card small{color:var(--muted)}
  .gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px;margin:10px 0 26px}
  .thumb{position:relative;display:block;border:1px solid var(--border);border-radius:8px;overflow:hidden;background:#fff}
  .thumb img{width:100%;height:auto;display:block}
  .thumb span{position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.62);color:#fff;font-size:11px;text-align:center;padding:2px}
  .thumb-image{width:100%;max-width:80px;height:auto;display:block;margin:8px auto 0;border-radius:6px;border:1px solid var(--border)}
  .pager{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:24px}
  .pager a{color:var(--gold);text-decoration:none;border:1px solid var(--border);border-radius:999px;padding:8px 18px;background:var(--card)}
  footer{text-align:center;color:var(--muted);font-size:13px;margin-top:40px}
  footer a{color:var(--gold);text-decoration:none}
  @media(max-width:600px){.wrap{padding:28px 14px 48px}.panel{padding:20px}}
`

function renderPage({ title, description, canonical, schema, body, ogImage }) {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${xml(title)}</title>
  <meta name="description" content="${xml(description)}">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${xml(title)}">
  <meta property="og:description" content="${xml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ar">
  <meta property="og:url" content="${canonical}">
  ${ogImage ? `<meta property="og:image" content="${xml(ogImage)}">` : ''}
  <link rel="manifest" href="/manifest.webmanifest">
  <style>${styles}</style>
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body>
  <main class="wrap">
${body}
    <footer>
      <a href="${SITE}/">الواجهة الرئيسية</a> ·
      <a href="${SITE}/juz">فهرس الأجزاء</a> ·
      <a href="${SITE}/riwayat">الفهرس حسب الرواية</a> ·
      <a href="${REPO}" target="_blank" rel="noreferrer">المستودع على GitHub</a> ·
      QURANCOMPLEX.LY © 2026
    </footer>
  </main>
</body>
</html>
`
}

function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE}/#website`,
    name: 'مجمع القرآن الرقمي',
    url: `${SITE}/`,
    inLanguage: 'ar',
  }
}

function breadcrumb(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/* ---------- صفحات الأجزاء (30) ---------- */
function juzPage(number) {
  const sample = data[0]
  const { start, end } = juzRange(sample, number)
  const surahs = surahsBetween(sample, start, end)
  const name = JUZ_NAMES[String(number)] || ''
  const shownSurahs = surahs.slice(0, 6).map((surah) => surah.name).join('، ') + (surahs.length > 6 ? ' وغيرها' : '')
  const canonical = `${SITE}${juzPath(number)}`
  const title = `جزء ${number}${name ? ` — ${name}` : ''} | صفحات ${start}-${end} من مصحف المدينة النبوية | Quran Complex`
  const description = `الجزء ${number}${name ? ` المعروف بـ${name}` : ''} من مصحف المدينة النبوية، الصفحات ${start} إلى ${end}، يضم ${shownSurahs}. تصفحه مصوّراً بروايات حفص وقالون وورش وشعبة والسوسي والدوري مع فهرس السور.`

  const surahRows = surahs.map((surah) => (
    `<li><span>${surah.number}. ${xml(surah.name)}</span><small>ص ${surah.page}</small></li>`
  )).join('\n        ')

  const cards = data.map((mushaf) => {
    const page = juzRange(mushaf, number).start
    return `<a class="mushaf-card" href="${readerUrl(mushaf, page)}">
          <span><strong>${xml(mushaf.short)}</strong><small>من الصفحة ${page} إلى ${juzRange(mushaf, number).end}</small></span>
          <span aria-hidden="true">←</span>
        </a>`
  }).join('\n        ')

  const galleries = data.map((mushaf) => {
    const range = juzRange(mushaf, number)
    const thumbs = []
    for (let page = range.start; page <= range.end; page++) {
      const image = imageForPage(mushaf, page)
      if (!image) continue
      thumbs.push(`<a class="thumb" href="${readerUrl(mushaf, page)}" aria-label="صفحة ${page} — ${xml(mushaf.short)}">
            <img src="${xml(image)}" alt="صفحة ${page} من مصحف المدينة برواية ${xml(mushaf.riwayah)} — جزء ${number}" loading="lazy" decoding="async">
            <span>${page}</span>
          </a>`)
    }
    return `<h3>${xml(mushaf.short)}</h3>\n        <div class="gallery">${thumbs.join('\n          ')}</div>`
  }).join('\n        ')

  const previous = number > 1
    ? `<a href="${SITE}${juzPath(number - 1)}">← الجزء ${number - 1}</a>`
    : ''
  const next = number < 30
    ? `<a href="${SITE}${juzPath(number + 1)}">الجزء ${number + 1} →</a>`
    : ''

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      websiteSchema(),
      {
        '@type': 'CollectionPage',
        '@id': `${canonical}#page`,
        name: `جزء ${number}${name ? ` — ${name}` : ''}`,
        description,
        url: canonical,
        inLanguage: 'ar',
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: data.map((mushaf, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'WebPage',
              name: `جزء ${number} — رواية ${mushaf.riwayah}`,
              url: readerUrl(mushaf, juzRange(mushaf, number).start),
            },
          })),
        },
      },
      breadcrumb([
        { name: 'الرئيسية', url: `${SITE}/` },
        { name: 'فهرس الأجزاء', url: `${SITE}/juz` },
        { name: `جزء ${number}`, url: canonical },
      ]),
    ],
  }

  const body = `    <header>
      <span class="eyebrow">مصحف المدينة النبوية · الجزء ${number} من 30</span>
      <h1>جزء ${number}${name ? ` — ${name}` : ''}</h1>
      <p class="lead">من الصفحة ${start} إلى الصفحة ${end}، ويضم ${surahs.length} سورة. صفحات مصوّرة كاملة في الروايات الستة، مع فهرس دقيق وانتقال مباشر إلى أي صفحة.</p>
    </header>

    <section class="panel">
      <h2>سور الجزء ${number}</h2>
      <ul class="surahs">
        ${surahRows}
      </ul>
    </section>

    <section class="panel">
      <h2>معاينة صفحات الجزء ${number} في الروايات الستة</h2>
      <p class="lead">اضغط على أي صفحة لفتحها في قارئ الرواية المقابلة بحجم كامل.</p>
        ${galleries}
    </section>

    <section class="panel">
      <h2>اقرأ الجزء ${number} حسب الرواية</h2>
      <div class="mushaf-grid">
        ${cards}
      </div>
    </section>

    <nav class="pager" aria-label="التنقل بين الأجزاء">
      ${previous}${next}
    </nav>`

  return renderPage({
    title,
    description,
    canonical,
    schema,
    body,
    ogImage: imageForPage(sample, start),
  })
}

/* ---------- صفحات الروايات (6) ---------- */
function riwayahPage(mushaf) {
  const canonical = `${SITE}/riwayah/${mushaf.id}`
  const title = `مصحف المدينة النبوية برواية ${mushaf.riwayah} — 604 صفحة مصوّرة | Quran Complex`
  const description = `مصحف المدينة النبوية برواية ${mushaf.riwayah}: 604 صفحة مصوّرة بجودة عالية، فهرس كامل للسور والأجزاء، انتقال مباشر إلى أي صفحة، وقراءة دون اتصال.`

  const juzCards = []
  for (let number = 1; number <= 30; number++) {
    const range = juzRange(mushaf, number)
    const thumb = imageForPage(mushaf, range.start)
    juzCards.push(`<a class="juz-card" href="${SITE}${juzPath(number)}">
        <strong>جزء ${number} — ${xml(JUZ_NAMES[String(number)] || '')}</strong>
        <small>الصفحات ${range.start}–${range.end}</small>
        ${thumb ? `<img class="thumb-image" src="${xml(thumb)}" alt="صفحة ${range.start} من جزء ${number} برواية ${xml(mushaf.riwayah)}" loading="lazy" decoding="async" width="80">` : ''}
      </a>`)
  }

  const other = data.filter((item) => item.id !== mushaf.id).map((item) => (
    `<a class="mushaf-card" href="${SITE}/riwayah/${item.id}"><span><strong>${xml(item.short)}</strong><small>فتح فهرس الرواية</small></span><span aria-hidden="true">←</span></a>`
  )).join('\n        ')

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      websiteSchema(),
      {
        '@type': 'CollectionPage',
        '@id': `${canonical}#page`,
        name: `مصحف ${mushaf.riwayah}`,
        description,
        url: canonical,
        inLanguage: 'ar',
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: Array.from({ length: 30 }, (_, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'WebPage',
              name: `جزء ${index + 1} — ${mushaf.riwayah}`,
              url: `${SITE}${juzPath(index + 1)}`,
            },
          })),
        },
      },
      breadcrumb([
        { name: 'الرئيسية', url: `${SITE}/` },
        { name: 'الفهرس حسب الرواية', url: `${SITE}/riwayat` },
        { name: mushaf.short, url: canonical },
      ]),
    ],
  }

  const body = `    <header>
      <span class="eyebrow">مصحف المدينة النبوية · ${xml(mushaf.short)}</span>
      <h1>رواية ${xml(mushaf.riwayah)}</h1>
      <p class="lead">604 صفحة مصوّرة من مصحف المدينة النبوية برواية ${xml(mushaf.riwayah)}، مع فهرس السور والأجزاء، وتصفّح مباشر لكل جزء على حدة.</p>
    </header>

    <section class="panel">
      <h2>ابدأ القراءة</h2>
      <div class="mushaf-grid">
        <a class="mushaf-card" href="${readerUrl(mushaf, 1)}"><span><strong>الفاتحة — الصفحة 1</strong><small>افتح القارئ مباشرة</small></span><span aria-hidden="true">←</span></a>
        <a class="mushaf-card" href="${readerUrl(mushaf, 582)}"><span><strong>جزء عم — الصفحة 582</strong><small>افتح القارئ مباشرة</small></span><span aria-hidden="true">←</span></a>
      </div>
    </section>

    <section class="panel">
      <h2>فهرس الأجزاء — ${xml(mushaf.short)}</h2>
      <div class="juz-grid">
        ${juzCards.join('\n        ')}
      </div>
    </section>

    <section class="panel">
      <h2>روايات أخرى</h2>
      <div class="mushaf-grid">
        ${other}
      </div>
    </section>`

  return renderPage({
    title,
    description,
    canonical,
    schema,
    body,
    ogImage: imageForPage(mushaf, 1),
  })
}

/* ---------- صفحتا الفهرس ---------- */
function juzHubPage() {
  const canonical = `${SITE}/juz`
  const title = 'فهرس أجزاء القرآن الكريم — 30 جزءاً مصوّراً بالروايات الستة | Quran Complex'
  const description = 'فهرس كامل لأجزاء القرآن الكريم الثلاثين من مصحف المدينة النبوية، مع صفحات مصوّرة لكل جزء في روايات حفص وقالون وورش وشعبة والسوسي والدوري.'
  const cards = Array.from({ length: 30 }, (_, index) => {
    const number = index + 1
    const range = juzRange(data[0], number)
    return `<a class="juz-card" href="${SITE}${juzPath(number)}"><strong>جزء ${number} — ${xml(JUZ_NAMES[String(number)] || '')}</strong><small>ص ${range.start}–${range.end}</small></a>`
  }).join('\n        ')
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      websiteSchema(),
      {
        '@type': 'CollectionPage',
        name: 'فهرس الأجزاء',
        url: canonical,
        inLanguage: 'ar',
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: Array.from({ length: 30 }, (_, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: `جزء ${index + 1}`,
            url: `${SITE}${juzPath(index + 1)}`,
          })),
        },
      },
      breadcrumb([{ name: 'الرئيسية', url: `${SITE}/` }, { name: 'فهرس الأجزاء', url: canonical }]),
    ],
  }
  const body = `    <header>
      <span class="eyebrow">مصحف المدينة النبوية · 604 صفحة</span>
      <h1>فهرس الأجزاء</h1>
      <p class="lead">ثلاثون جزءاً من القرآن الكريم، لكل جزء صفحته الخاصة التي تضم معاينة صفحاته في الروايات الستة وأرقامها حسب ترقيم المدينة.</p>
    </header>
    <section class="panel">
      <h2>اختر الجزء</h2>
      <div class="juz-grid">
        ${cards}
      </div>
    </section>`
  return renderPage({ title, description, canonical, schema, body })
}

function riwayatHubPage() {
  const canonical = `${SITE}/riwayat`
  const title = 'مصاحف المدينة النبوية الستة — حفص، قالون، ورش، شعبة، السوسي، الدوري | Quran Complex'
  const description = 'ست روايات من مصحف المدينة النبوية في قارئ رقمي واحد: حفص عن عاصم، قالون عن نافع، ورش عن نافع، شعبة عن عاصم، السوسي والدوري عن أبي عمرو.'
  const cards = data.map((mushaf) => (
    `<a class="mushaf-card" href="${canonical}/${mushaf.id}"><span><strong>${xml(mushaf.riwayah)}</strong><small>604 صفحة مصوّرة</small></span><span aria-hidden="true">←</span></a>`
  )).join('\n        ')
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      websiteSchema(),
      {
        '@type': 'CollectionPage',
        name: 'الفهرس حسب الرواية',
        url: canonical,
        inLanguage: 'ar',
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: data.map((mushaf, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: mushaf.riwayah,
            url: `${canonical}/${mushaf.id}`,
          })),
        },
      },
      breadcrumb([{ name: 'الرئيسية', url: `${SITE}/` }, { name: 'الفهرس حسب الرواية', url: canonical }]),
    ],
  }
  const body = `    <header>
      <span class="eyebrow">مجمع القرآن الرقمي</span>
      <h1>الفهرس حسب الرواية</h1>
      <p class="lead">اختر روايتك لتصفح مصحف المدينة النبوية كاملاً، أو ابدأ من فهرس الأجزاء الثلاثين.</p>
    </header>
    <section class="panel">
      <h2>الروايات الستة</h2>
      <div class="mushaf-grid">
        ${cards}
      </div>
      <p class="lead"><a href="${SITE}/juz">انتقل إلى فهرس الأجزاء</a></p>
    </section>`
  return renderPage({ title, description, canonical, schema, body })
}

/* ---------- كتابة الصفحات ---------- */
for (let number = 1; number <= 30; number++) {
  writeFileSync(join(seoDir, `${juzFile(number)}.html`), juzPage(number), 'utf8')
}
for (const mushaf of data) {
  writeFileSync(join(seoDir, `riwayah-${mushaf.id}.html`), riwayahPage(mushaf), 'utf8')
}
writeFileSync(join(seoDir, 'juz.html'), juzHubPage(), 'utf8')
writeFileSync(join(seoDir, 'riwayat.html'), riwayatHubPage(), 'utf8')

const imageTotal = allImageEntries.reduce((sum, entry) => sum + (entry.match(/<image:image>/g) || []).length, 0)
console.log(`تم توليد: ${pageEntries.length} رابطاً، ${imageTotal} صورة، 30 جزءاً، 6 روايات، وصفحتا فهرس.`)
