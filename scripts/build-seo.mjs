/**
 * توليد بيانات SEO: robots.txt، خريطة مواقع، خرائط صور، وصفحات مخصّصة لجزء عم وجزء تبارك.
 * تُنتج الملفات داخل public/ فيُنسخ تلقائياً إلى dist/ أثناء البناء.
 * الاستخدام: npm run build:seo
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

const MUSHAFS = [
  { id: 'hafs', host: 'hafs.qurancomplex.ly', short: 'حفص عن عاصم', riwayah: 'حفص عن عاصم', accent: '#0f4c3a' },
  { id: 'qaloon', host: 'qaloon.qurancomplex.ly', short: 'قالون عن نافع', riwayah: 'قالون عن نافع', accent: '#7a4b8a' },
  { id: 'warsh', host: 'warsh.qurancomplex.ly', short: 'ورش عن نافع', riwayah: 'ورش عن نافع', accent: '#9c4a2f' },
  { id: 'shubah', host: 'shubah.qurancomplex.ly', short: 'شعبة عن عاصم', riwayah: 'شعبة عن عاصم', accent: '#1f5f7a' },
  { id: 'susi', host: 'susi.qurancomplex.ly', short: 'السوسي عن أبي عمرو', riwayah: 'السوسي عن أبي عمرو', accent: '#8a6b1f' },
  { id: 'douri', host: 'duri.qurancomplex.ly', short: 'الدوري عن أبي عمرو', riwayah: 'الدوري عن أبي عمرو', accent: '#4a5d8a' },
]

const xml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;')

const readJson = (name) => JSON.parse(readFileSync(join(dataDir, name), 'utf8'))

const data = MUSHAFS.map((m) => ({
  ...m,
  index: readJson(`${m.id}-index.json`),
  pages: readJson(`${m.id}-pages.json`),
}))

const readerUrl = (mushaf, page) => `https://${mushaf.host}/?mushaf=${mushaf.id}&page=${page}`
const imageForPage = (mushaf, page) => mushaf.pages[page + COVERS - 1]

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
  urlEntry(`${SITE}/juz-amma`, { priority: '0.9' }),
  urlEntry(`${SITE}/juz-tabarak`, { priority: '0.9' }),
]

for (const mushaf of data) {
  pageEntries.push(urlEntry(`https://${mushaf.host}/`, { priority: '0.9', changefreq: 'daily' }))
  for (const juz of mushaf.index.juz) {
    pageEntries.push(urlEntry(readerUrl(mushaf, juz.page), { priority: '0.7', changefreq: 'monthly' }))
  }
  for (const surah of mushaf.index.surahs) {
    pageEntries.push(urlEntry(readerUrl(mushaf, surah.page), { priority: '0.6', changefreq: 'monthly' }))
  }
}
writeFileSync(join(publicDir, 'sitemap-mushafs.xml'), urlset(pageEntries), 'utf8')

/* ---------- خرائط الصور لجزء عم وجزء تبارك ---------- */
const JUZ = [
  {
    slug: 'amma',
    number: 30,
    name: 'جزء عم',
    pageKey: 'juz-amma',
    file: 'sitemap-images-amma.xml',
  },
  {
    slug: 'tabarak',
    number: 29,
    name: 'جزء تبارك',
    pageKey: 'juz-tabarak',
    file: 'sitemap-images-tabarak.xml',
  },
]

for (const juz of JUZ) {
  // الصور تُدرج تحت الصفحة التي تعرضها فعلاً (معرض الصور) لا تحت روابط القارئ،
  // لأن قواعد image sitemap تشترط وجود الصورة داخل الصفحة المرتبطة بها.
  const images = []
  const readerEntries = []
  for (const mushaf of data) {
    const start = mushaf.index.juz[juz.number - 1].page
    const end = juz.number === 30 ? 604 : mushaf.index.juz[juz.number].page - 1
    for (let page = start; page <= end; page++) {
      const loc = imageForPage(mushaf, page)
      if (!loc) continue
      images.push({
        loc,
        title: `صفحة ${page} من ${juz.name} — ${mushaf.short}`,
        caption: `صفحة ${page} من مصحف المدينة النبوية برواية ${mushaf.riwayah}، ${juz.name}، صورة عالية الجودة للقراءة والتصفح.`,
      })
    }
    readerEntries.push(urlEntry(readerUrl(mushaf, start), { priority: '0.7', changefreq: 'monthly' }))
  }
  const entries = [
    urlEntry(`${SITE}/${juz.pageKey}`, { priority: '0.8', changefreq: 'monthly', images }),
    ...readerEntries,
  ]
  writeFileSync(join(publicDir, juz.file), urlset(entries, true), 'utf8')
}

/* ---------- فهرس الخرائط ---------- */
const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE}/sitemap-mushafs.xml</loc><lastmod>${today}</lastmod></sitemap>
  <sitemap><loc>${SITE}/sitemap-images-amma.xml</loc><lastmod>${today}</lastmod></sitemap>
  <sitemap><loc>${SITE}/sitemap-images-tabarak.xml</loc><lastmod>${today}</lastmod></sitemap>
</sitemapindex>
`
writeFileSync(join(publicDir, 'sitemap.xml'), sitemapIndex, 'utf8')

/* ---------- صفحات جزء عم / جزء تبارك ---------- */
const styles = `
  :root{--gold:#b8892b;--bg:#f6f6f4;--fg:#18181b;--muted:#71717a;--card:rgba(255,255,255,.66);--border:rgba(212,175,55,.3);--radius:20px;--shadow:0 14px 40px -18px rgba(24,24,27,.3)}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--fg);font-family:'Cairo',system-ui,sans-serif;line-height:1.9;direction:rtl}
  .wrap{max-width:1000px;margin:0 auto;padding:48px 20px 72px}
  header{text-align:center;margin-bottom:40px}
  .eyebrow{display:inline-block;padding:6px 16px;border:1px solid var(--border);border-radius:999px;color:var(--gold);font-size:12px}
  h1{font-family:'Amiri',serif;font-size:clamp(2.2rem,6vw,3.6rem);color:var(--gold);margin:14px 0 8px}
  .lead{color:var(--muted);max-width:760px;margin:0 auto}
  .panel{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);padding:28px;margin:28px 0;backdrop-filter:blur(16px)}
  h2{font-family:'Amiri',serif;color:var(--gold);font-size:1.8rem;margin-top:0}
  .surahs{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;list-style:none;padding:0;margin:0}
  .surahs li{display:flex;justify-content:space-between;gap:10px;padding:9px 12px;border:1px solid var(--border);border-radius:10px;font-size:14px}
  .surahs small{color:var(--muted)}
  .mushaf-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
  .mushaf-card{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px;border:1px solid var(--border);border-radius:14px;text-decoration:none;color:inherit;background:rgba(255,255,255,.35);transition:.25s ease}
  .mushaf-card:hover{transform:translateY(-4px);border-color:var(--gold)}
  .mushaf-card strong{color:var(--gold);font-size:1rem}
  .mushaf-card small{display:block;color:var(--muted)}
  .mushaf-card span:last-child{color:var(--gold);font-size:20px}
  .gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px;margin:10px 0 26px}
  .thumb{position:relative;display:block;border:1px solid var(--border);border-radius:8px;overflow:hidden;background:#fff}
  .thumb img{width:100%;height:auto;display:block}
  .thumb span{position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.62);color:#fff;font-size:11px;text-align:center;padding:2px}
  .panel h3{font-family:'Amiri',serif;color:var(--gold);margin:18px 0 0}
  footer{text-align:center;color:var(--muted);font-size:13px;margin-top:40px}
  footer a{color:var(--gold)}
  @media(max-width:600px){.wrap{padding:28px 14px 48px}.panel{padding:20px}}
`

function juzPage(juz) {
  const sample = data[0]
  const start = sample.index.juz[juz.number - 1].page
  const end = juz.number === 30 ? 604 : sample.index.juz[juz.number].page - 1
  const surahs = sample.index.surahs.filter((s) => s.page >= start && s.page <= end)
  const canonical = `${SITE}/${juz.pageKey}`
  const title = `${juz.name} — مصحف المدينة النبوية بالروايات الستة | Quran Complex`
  const description = `تصفح ${juz.name} من مصحف المدينة النبوية بروايات حفص وقالون وورش وشعبة والسوسي والدوري، مع صفحات مصوّرة وفهرس السور والأجزاء.`
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        name: 'مجمع القرآن الرقمي',
        url: SITE,
        inLanguage: 'ar',
      },
      {
        '@type': 'CollectionPage',
        '@id': `${canonical}#page`,
        name: juz.name,
        description,
        url: canonical,
        inLanguage: 'ar',
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: data.map((m, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'WebPage',
              name: `${juz.name} — رواية ${m.riwayah}`,
              url: readerUrl(m, m.index.juz[juz.number - 1].page),
            },
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE },
          { '@type': 'ListItem', position: 2, name: juz.name, item: canonical },
        ],
      },
    ],
  }

  const surahRows = surahs.map((s) => (
    `<li><span>${s.number}. ${xml(s.name)}</span><small>ص ${s.page}</small></li>`
  )).join('\n        ')

  const cards = data.map((m) => {
    const page = m.index.juz[juz.number - 1].page
    return `<a class="mushaf-card" href="${readerUrl(m, page)}">
          <span><strong>${xml(m.short)}</strong><small>الصفحة ${page} من 604</small></span>
          <span aria-hidden="true">←</span>
        </a>`
  }).join('\n        ')

  const galleries = data.map((m) => {
    const startPage = m.index.juz[juz.number - 1].page
    const endPage = juz.number === 30 ? 604 : m.index.juz[juz.number].page - 1
    const thumbs = []
    for (let page = startPage; page <= endPage; page++) {
      const image = imageForPage(m, page)
      if (!image) continue
      thumbs.push(`<a class="thumb" href="${readerUrl(m, page)}" aria-label="صفحة ${page} — ${xml(m.short)}">
            <img src="${xml(image)}" alt="صفحة ${page} من مصحف المدينة برواية ${xml(m.riwayah)} — ${juz.name}" loading="lazy" decoding="async">
            <span>${page}</span>
          </a>`)
    }
    return `<h3>${xml(m.short)}</h3>\n        <div class="gallery">${thumbs.join('\n          ')}</div>`
  }).join('\n        ')

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
  <link rel="manifest" href="/manifest.webmanifest">
  <style>${styles}</style>
  <script type="application/ld+json">${JSON.stringify(graph)}</script>
</head>
<body>
  <main class="wrap">
    <header>
      <span class="eyebrow">مصحف المدينة النبوية · فهرس الأجزاء</span>
      <h1>${juz.name}</h1>
      <p class="lead">${juz.number === 30
        ? 'الجزء الثلاثون من المصحف الشريف، ويضم سورًا قصيرة مكية لمّاعة، يبدأ بسورة النبأ وينتهي بسورة الناس.'
        : 'الجزء التاسع والعشرون من المصحف الشريف، يبدأ بسورة الملك ويتضمن سورًا مكية ومدنية، منه آيات التوحيد والبعث.'}
        تصفحه الآن مصوّرًا بالروايات الستة مع انتقال مباشر إلى أي صفحة.</p>
    </header>

    <section class="panel">
      <h2>سور ${juz.name}</h2>
      <ul class="surahs">
        ${surahRows}
      </ul>
    </section>

    <section class="panel">
      <h2>معاينة صفحات ${juz.name} في الروايات الستة</h2>
      <p class="lead">اضغط على أي صفحة لفتحها في قارئ الرواية المقابلة بحجم كامل.</p>
        ${galleries}
    </section>

    <section class="panel">
      <h2>اقرأ ${juz.name} حسب الرواية</h2>
      <div class="mushaf-grid">
        ${cards}
      </div>
      <p class="lead">الصفحات من ${start} إلى ${end} من ترقيم مصحف المدينة المعتمد (604 صفحة). الصور محفوظة في مخزن الصور الخاص بكل رواية.</p>
    </section>

    <footer>
      <a href="${SITE}/">العودة للواجهة الرئيسية</a> ·
      <a href="${REPO}" target="_blank" rel="noreferrer">مستودع المشروع</a> ·
      QURANCOMPLEX.LY © 2026
    </footer>
  </main>
</body>
</html>
`
}

for (const juz of JUZ) {
  writeFileSync(join(seoDir, `${juz.pageKey}.html`), juzPage(juz), 'utf8')
}

console.log(`تم توليد robots.txt + 4 خرائط + صفحتين SEO (${JUZ.map((j) => j.name).join('، ')})`)
