/**
 * بوابة qurancomplex.ly: صفحة هبوط على النطاق الرئيسي، وتوجيه ذكي للنطاقات الفرعية.
 * التصميم يستخدم design tokens بأسلوب shadcn/ui وتأثيرات Magic UI
 * (Aurora, Spotlight card, Shine border, layering) بصيغة CSS مدمجة تعمل في Worker واحد.
 */

const DEFAULT_READER_BASE = 'https://gamingmonster2.github.io/hafs/'
const ROUTER_VERSION = '6.1-glass-previews'

const RIWAYAHS = ['hafs', 'qaloon', 'warsh', 'shubah', 'susi', 'douri']

const PDF_EDITIONS = [
  { id: 'standard1', title: 'المصحف العادي 1' },
  { id: 'standard2', title: 'المصحف العادي 2' },
  { id: 'big', title: 'المصحف الكبير' },
]

const TRANSLATIONS = [
  { id: 'anko', title: 'الترجمة بالأنكو', language: 'الأنكو' },
  { id: 'chinese', title: 'الترجمة بالصينية', language: 'الصينية' },
  { id: 'english', title: 'الترجمة بالإنجليزية', language: 'الإنجليزية' },
  { id: 'french', title: 'الترجمة بالفرنسية', language: 'الفرنسية' },
  { id: 'hausa', title: 'الترجمة بالهوساوية', language: 'الهوساوية' },
  { id: 'indonesian', title: 'الترجمة بالإندونيسية', language: 'الإندونيسية' },
  { id: 'portuguese', title: 'الترجمة بالبرتغالية', language: 'البرتغالية' },
  { id: 'tamil', title: 'الترجمة بالتاميل', language: 'التاميل' },
  { id: 'telugu', title: 'الترجمة بالتيلجو', language: 'التيلجو' },
  { id: 'turkish', title: 'الترجمة بالتركية', language: 'التركية' },
  { id: 'urdu', title: 'الترجمة بالأوردو', language: 'الأوردو' },
  { id: 'vietnami', title: 'الترجمة بالفيتنامية', language: 'الفيتنامية' },
]

const EDITIONS = [
  ...RIWAYAHS.map((id, index) => ({
    id,
    title: [
      'رواية حفص عن عاصم', 'رواية قالون عن نافع', 'رواية ورش عن نافع',
      'رواية شعبة عن عاصم', 'رواية السوسي عن أبي عمرو', 'رواية الدوري عن أبي عمرو',
    ][index],
    group: 'رواية قرآنية',
    description: 'مصحف المدينة النبوية المصوّر مع فهرس السور والأجزاء وانتقال مباشر إلى أي صفحة.',
  })),
  ...PDF_EDITIONS.map((item) => ({
    ...item,
    group: 'إصدار عربي',
    description: 'إصدار عربي كامل من مصاحف pdfquran.com بجودة عالية وتصفّح سريع.',
  })),
  ...TRANSLATIONS.map((item) => ({
    ...item,
    group: 'ترجمة',
    description: `ترجمة مصحف المدينة النبوية إلى ${item.language}، صفحات مصوّرة وفهرس كامل للسور.`,
  })),
]

const EDITION_CARDS = EDITIONS.map((item) => `
      <a href="https://${item.id}.qurancomplex.ly" class="card card--preview">
        <span class="card__glass">
          <img class="card__preview" src="/images/previews/${item.id}.webp" alt="الصفحة الأولى من ${item.title}" loading="lazy" decoding="async" width="240" height="348">
          <span class="card__shine" aria-hidden="true"></span>
        </span>
        <div class="card__body card__body--under">
          <span class="card__eyebrow">${item.group}</span>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <span class="badge">تصفح المصحف <span aria-hidden="true">←</span></span>
        </div>
      </a>`).join('')

const LANDING_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://qurancomplex.ly/#website',
      name: 'مجمع القرآن الرقمي',
      url: 'https://qurancomplex.ly/',
      inLanguage: 'ar',
      description: 'روايات ومصاحف وترجمات مصوّرة في قارئ رقمي سريع يعمل على كل الأجهزة.',
    },
    {
      '@type': 'ItemList',
      '@id': 'https://qurancomplex.ly/#mushafs',
      name: 'المصاحف والترجمات',
      itemListElement: EDITIONS.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.title,
        url: `https://${item.id}.qurancomplex.ly/`,
      })),
    },
  ],
}

/** ملفات SEO وملفات تثبيت التطبيق تُولَّد في public/ وتُنشر مع القارئ، ثم يمرّرها الـ Worker على النطاق الرئيسي */
const SEO_FILES = new Set([
  '/robots.txt',
  '/sitemap.xml',
  '/sitemap-mushafs.xml',
  '/sitemap-pages.xml',
  '/sitemap-images.xml',
  '/sitemap-images-amma.xml',
  '/sitemap-images-tabarak.xml',
  '/seo/juz.html',
  '/seo/riwayat.html',
  '/manifest.webmanifest',
  '/landing-sw.js',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
])

/** ملفات جاهزة للوكلاء الأذكياء: تُقرأ بطلب واحد دون زحف على 18,847 صفحة */
const AI_FILES = new Set([
  '/llms.txt',
  '/llms-full.txt',
  '/ai/editions.json',
  '/ai/surahs.json',
  '/ai/pages.json',
  '/ai/juz.json',
])

/** عناوين قصيرة لصفحات الأجزاء والروايات (30 + 6 + فهران) */
const SEO_ALIASES = {
  '/juz': '/seo/juz.html',
  '/riwayat': '/seo/riwayat.html',
  '/juz-amma': '/seo/juz-amma.html',
  '/juz-tabarak': '/seo/juz-tabarak.html',
}
for (let number = 1; number <= 30; number++) {
  SEO_ALIASES[`/juz-${number}`] = `/seo/juz-${number}.html`
  SEO_ALIASES[`/juz/${number}`] = `/seo/juz-${number}.html`
}
for (const { id } of EDITIONS) {
  SEO_ALIASES[`/riwayah/${id}`] = `/seo/riwayah-${id}.html`
  SEO_ALIASES[`/riwayah-${id}`] = `/seo/riwayah-${id}.html`
}

/** أي ملف داخل seo/ يُسمح بتمريره (صفحات مولّدة، بما فيها صفحات المصاحف لكل صفحة) */
function isGeneratedSeoFile(pathname) {
  return /^\/seo\/(?:pages\/[a-z0-9-]+\/[0-9]+|[a-z0-9-]+)\.html$/.test(pathname)
}

const EDITION_IDS = new Set(EDITIONS.map(({ id }) => id))

/** تحويل /page/12 على نطاق فرعي، أو /page/english/12 على النطاق الرئيسي، إلى ملف SEO الثابت */
function pageSeoAlias(pathname, mushaf) {
  if (mushaf) {
    const match = pathname.match(/^\/page\/([0-9]+)\/?$/)
    return match ? `/seo/pages/${mushaf}/${Number(match[1])}.html` : null
  }
  const match = pathname.match(/^\/page\/([a-z0-9-]+)\/([0-9]+)\/?$/)
  if (!match || !EDITION_IDS.has(match[1])) return null
  return `/seo/pages/${match[1]}/${Number(match[2])}.html`
}

const SEO_CONTENT_TYPES = {
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

/** اسم النطاق الفرعي → معرّف الرواية في التطبيق */
const ROUTES = Object.fromEntries(EDITIONS.map(({ id }) => [`${id}.qurancomplex.ly`, id]))
ROUTES['duri.qurancomplex.ly'] = 'douri'

/** بيانات SEO ثابتة لكل مصحف: تُحقن في HTML المُمرَّر قبل تشغيل JavaScript */
const MUSHAF_SEO = Object.fromEntries(
  EDITIONS.map(({ id, title }) => [id, { edition: title }]),
)

function localizeReaderHtml(html, mushafId, hostname) {
  const seo = MUSHAF_SEO[mushafId]
  if (!seo) return html
  const label = seo.riwayah ? `رواية ${seo.riwayah}` : seo.edition
  const title = `مصحف المدينة - ${label} | Quran Complex - Mushaf`
  const description = `تصفح وقراءة مصحف المدينة (${label}) أونلاين بجودة عالية: انتقال مباشر إلى أي صفحة، فهرس السور والأجزاء، تكبير ووضع ليلي، وتجربة قراءة سريعة على كل الأجهزة.`

  let output = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
  output = output.replace(
    /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="description" content="${description}" />`,
  )
  if (!/rel=["']canonical["']/i.test(output)) {
    const tags = `  <link rel="canonical" href="https://${hostname}/" />\n`
      + `  <meta property="og:title" content="${title}" />\n`
      + `  <meta property="og:description" content="${description}" />\n`
      + `  <meta property="og:url" content="https://${hostname}/" />\n`
    output = output.replace('</head>', `${tags}  </head>`)
  }
  return output
}

/** صفحة الهبوط للنطاق الرئيسي */
const landingHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0f4c3a">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="المصاحف">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="description" content="مجمع القرآن الرقمي - 21 إصداراً مصوّراً: ست روايات، ثلاثة مصاحف عربية، واثنتا عشرة ترجمة، مع فهرس السور والأجزاء وقراءة سريعة على كل الأجهزة.">
  <meta name="keywords" content="قرآن كريم, رواية حفص, رواية قالون, رواية ورش, رواية شعبة, رواية السوسي, رواية الدوري, ترجمة القرآن, مصحف المدينة, مجمع القرآن الرقمي, قراءات قرآنية">
  <meta property="og:title" content="مجمع القرآن الرقمي | QURAN COMPLEX">
  <meta property="og:description" content="ست روايات من مصحف المدينة النبوية في قارئ رقمي سريع يعمل على كل الأجهزة.">
  <meta name="robots" content="index, follow">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ar">
  <meta property="og:url" content="https://qurancomplex.ly/">
  <meta name="twitter:card" content="summary_large_image">
  <title>مجمع القرآن الرقمي | QURAN COMPLEX</title>
  <link rel="canonical" href="https://qurancomplex.ly/">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" href="/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@700&family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
  <script type="application/ld+json">${JSON.stringify(LANDING_SCHEMA)}</script>
  <style>
    @property --angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }

    :root {
      --bg: #f6f6f4;
      --fg: #18181b;
      --muted: #71717a;
      --card: rgba(255, 255, 255, 0.62);
      --card-border: rgba(255, 255, 255, 0.8);
      --gold: #b8892b;
      --gold-2: #e6c766;
      --ring: rgba(212, 175, 55, 0.38);
      --spot: rgba(212, 175, 55, 0.2);
      --radius: 22px;
      --shadow: 0 1px 2px rgba(24, 24, 27, 0.04),
                0 10px 30px -12px rgba(24, 24, 27, 0.18),
                0 30px 60px -30px rgba(24, 24, 27, 0.25);
    }

    [data-theme="dark"] {
      --bg: #090b0a;
      --fg: #f4f4f5;
      --muted: #a1a1aa;
      --card: rgba(24, 28, 26, 0.58);
      --card-border: rgba(255, 255, 255, 0.1);
      --gold: #d4af37;
      --gold-2: #f0d98a;
      --ring: rgba(212, 175, 55, 0.42);
      --spot: rgba(212, 175, 55, 0.16);
      --shadow: 0 1px 2px rgba(0, 0, 0, 0.5),
                0 18px 45px -18px rgba(0, 0, 0, 0.85);
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: var(--bg);
      color: var(--fg);
      font-family: 'Cairo', system-ui, sans-serif;
      transition: background 0.5s ease, color 0.5s ease;
      overflow-x: hidden;
    }
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      z-index: -2;
      pointer-events: none;
      background-image: radial-gradient(rgba(120, 120, 120, 0.16) 1px, transparent 1px);
      background-size: 28px 28px;
      -webkit-mask-image: linear-gradient(to bottom, #000, transparent 72%);
      mask-image: linear-gradient(to bottom, #000, transparent 72%);
    }

    /* Magic UI — Aurora background */
    .aurora { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
    .aurora span {
      position: absolute;
      width: 46vw;
      height: 46vw;
      min-width: 340px;
      min-height: 340px;
      border-radius: 50%;
      filter: blur(90px);
      opacity: 0.34;
      animation: drift 18s ease-in-out infinite alternate;
    }
    .aurora span:nth-child(1) { background: #d4af37; top: -18vw; right: -10vw; }
    .aurora span:nth-child(2) { background: #0f766e; bottom: -22vw; left: -12vw; animation-delay: -6s; }
    .aurora span:nth-child(3) { background: #7c3aed; top: 34%; left: 42%; opacity: 0.16; animation-delay: -12s; }
    [data-theme="dark"] .aurora span { opacity: 0.24; }
    @keyframes drift { to { transform: translate3d(4vw, 3vw, 0) scale(1.12); } }

    .container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 46px 20px 64px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* shadcn/ui — focus-visible ring + rounded control */
    .theme-toggle {
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 50;
      width: 46px;
      height: 46px;
      display: grid;
      place-items: center;
      border-radius: 999px;
      border: 1px solid var(--card-border);
      background: var(--card);
      color: var(--fg);
      box-shadow: var(--shadow);
      backdrop-filter: blur(16px) saturate(150%);
      -webkit-backdrop-filter: blur(16px) saturate(150%);
      cursor: pointer;
      font-size: 18px;
      transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .theme-toggle:hover { transform: rotate(12deg) scale(1.06); border-color: var(--ring); }
    .theme-toggle:focus-visible, .card:focus-visible, .repo-link:focus-visible,
    .link-tile:focus-visible, .youtube-card:focus-visible, .juz-strip a:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px var(--ring), var(--shadow);
    }

    .header { text-align: center; margin-bottom: 48px; animation: rise 0.7s ease both; }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      border: 1px solid var(--ring);
      border-radius: 999px;
      color: var(--gold);
      background: rgba(212, 175, 55, 0.06);
      font-size: 11px;
      letter-spacing: 1.5px;
    }
    .header h1 {
      font-family: 'Amiri', serif;
      font-size: clamp(2.6rem, 7vw, 4.4rem);
      line-height: 1.2;
      margin: 16px 0 8px;
      background: linear-gradient(135deg, var(--gold), var(--gold-2), var(--gold));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      filter: drop-shadow(0 6px 18px rgba(212, 175, 55, 0.22));
    }
    .header p { margin: 0; color: var(--muted); font-size: 0.82rem; letter-spacing: 3px; font-weight: 300; }

    /* تثبيت الواجهة الرئيسية كتطبيق أندرويد */
    .install-bar { display: flex; justify-content: center; margin: -20px 0 34px; }
    .install-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      min-height: 46px;
      padding: 11px 22px;
      border: 1px solid var(--ring);
      border-radius: 999px;
      background: var(--card);
      color: var(--gold);
      font-family: 'Cairo', sans-serif;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: var(--shadow);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      transition: transform 0.25s ease, border-color 0.25s ease;
    }
    .install-btn:hover { transform: translateY(-3px); border-color: var(--gold); }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 20px;
      width: 100%;
    }

    /* صندوق زجاجي: صورة الصفحة الأولى داخل إطار شفاف والكتابة تحتها */
    .card--preview {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      min-height: 0;
      padding: 14px;
    }
    .card__glass {
      position: relative;
      display: block;
      overflow: hidden;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.4);
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.22), rgba(212, 175, 55, 0.08));
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 12px 30px -14px rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(8px) saturate(140%);
      -webkit-backdrop-filter: blur(8px) saturate(140%);
    }
    .card__preview {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: 240 / 348;
      object-fit: contain;
      object-position: top center;
      background: #fff;
      transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .card:hover .card__preview { transform: scale(1.04); }
    .card__shine {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.35) 48%, transparent 62%);
      transform: translateX(-120%);
      transition: transform 0.8s ease;
    }
    .card:hover .card__shine { transform: translateX(120%); }
    .card__body--under {
      align-items: stretch;
      gap: 8px;
      text-align: center;
    }
    .card__body--under h3 { font-size: 1rem; margin: 2px 0; }
    .card__body--under p { font-size: 0.76rem; line-height: 1.55; margin: 0; }
    .card__body--under .badge { align-self: center; }

    /* Magic UI — Spotlight card + Shine border على خلفية زجاجية */
    .card {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      min-height: 168px;
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 18px;
      padding: 20px;
      border-radius: var(--radius);
      border: 1px solid var(--card-border);
      background: var(--card);
      box-shadow: var(--shadow);
      backdrop-filter: blur(22px) saturate(165%);
      -webkit-backdrop-filter: blur(22px) saturate(165%);
      color: inherit;
      text-decoration: none;
      animation: rise 0.6s ease both;
      transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1),
                  box-shadow 0.35s ease, border-color 0.35s ease;
    }
    .grid .card:nth-child(1) { animation-delay: 0.04s; }
    .grid .card:nth-child(2) { animation-delay: 0.09s; }
    .grid .card:nth-child(3) { animation-delay: 0.14s; }
    .grid .card:nth-child(4) { animation-delay: 0.19s; }
    .grid .card:nth-child(5) { animation-delay: 0.24s; }
    .grid .card:nth-child(6) { animation-delay: 0.29s; }
    .card > * { position: relative; z-index: 2; }
    .card::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
      background: radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%), var(--spot), transparent 48%);
    }
    .card:hover::after { opacity: 1; }
    .card::before {
      content: '';
      position: absolute;
      inset: -1px;
      z-index: 1;
      border-radius: inherit;
      padding: 1px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
      background: conic-gradient(from var(--angle), transparent 58%, var(--gold-2) 72%, transparent 86%);
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      mask-composite: exclude;
    }
    .card:hover::before { opacity: 0.9; animation: spin-border 4s linear infinite; }
    @keyframes spin-border { to { --angle: 360deg; } }
    .card:hover {
      transform: translateY(-8px);
      border-color: rgba(212, 175, 55, 0.5);
      box-shadow: 0 24px 60px -22px rgba(180, 137, 43, 0.38), var(--shadow);
    }

    .card__cover {
      width: 72px;
      height: 104px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid rgba(212, 175, 55, 0.35);
      background: #fff;
      box-shadow: 0 8px 20px -10px rgba(0,0,0,.5);
      flex: 0 0 auto;
    }
    .card__body {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
      flex: 1 1 auto;
      min-width: 0;
    }
    .card__eyebrow {
      display: inline-block;
      font-size: 0.68rem;
      letter-spacing: 1px;
      color: var(--gold);
      border: 1px solid var(--ring);
      border-radius: 999px;
      padding: 2px 10px;
      margin-bottom: 8px;
    }
    .card h3 {
      margin: 0 0 8px;
      font-family: 'Amiri', serif;
      font-size: 1.35rem;
      color: var(--gold);
    }
    .card p { margin: 0; font-size: 0.9rem; line-height: 1.85; color: var(--muted); }

    .badge {
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 22px;
      border: 1px solid var(--ring);
      border-radius: 12px;
      color: var(--gold);
      font-size: 0.82rem;
      font-weight: 700;
      transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
    }
    .badge span { transition: transform 0.25s ease; }
    .card:hover .badge {
      background: linear-gradient(135deg, var(--gold), var(--gold-2));
      color: #17140b;
      border-color: transparent;
    }
    .card:hover .badge span { transform: translateX(-5px); }

    /* أدلة الأجزاء — روابط داخلية لصفحات SEO المخصّصة */
    .juz-strip {
      margin-top: 34px;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
    }
    .juz-strip a {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 12px 22px;
      border-radius: 999px;
      border: 1px solid var(--ring);
      background: var(--card);
      color: var(--gold);
      text-decoration: none;
      font-family: 'Amiri', serif;
      font-size: 1.1rem;
      box-shadow: var(--shadow);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      transition: transform 0.25s ease, border-color 0.25s ease;
    }
    .juz-strip a:hover { transform: translateY(-3px); border-color: var(--gold); }
    .juz-strip small { font-family: 'Cairo', sans-serif; color: var(--muted); font-size: 0.72rem; }

    /* فهرس مختصر لكل الأجزاء والروايات */
    .index-panel { margin-top: 34px; width: 100%; text-align: center; }
    .index-panel details {
      border: 1px solid var(--card-border);
      border-radius: var(--radius);
      background: var(--card);
      box-shadow: var(--shadow);
      backdrop-filter: blur(16px) saturate(150%);
      -webkit-backdrop-filter: blur(16px) saturate(150%);
      padding: 16px 22px;
    }
    .index-panel summary {
      cursor: pointer;
      color: var(--gold);
      font-family: 'Amiri', serif;
      font-size: 1.25rem;
      list-style: none;
    }
    .index-panel summary::-webkit-details-marker { display: none; }
    .index-panel summary::after { content: ' ▾'; font-family: 'Cairo', sans-serif; font-size: .8rem; }
    .index-panel[open] summary::after { content: ' ▴'; }
    .index-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 8px;
      margin-top: 16px;
      text-align: right;
    }
    .index-grid--riwayat { margin-top: 12px; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); }
    .index-grid a {
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: 10px;
      color: inherit;
      text-decoration: none;
      font-size: .78rem;
      background: rgba(212, 175, 55, .05);
      transition: border-color .2s ease, color .2s ease;
    }
    .index-grid a:hover { border-color: var(--gold); color: var(--gold); }

    /* قسم الروابط */
    .links-section {
      margin-top: 56px;
      width: 100%;
      text-align: center;
      animation: rise 0.7s ease 0.3s both;
    }
    .links-section h2 {
      margin: 0 0 8px;
      font-family: 'Amiri', serif;
      font-size: 1.9rem;
      color: var(--gold);
    }
    .links-note { margin: 0 0 24px; color: var(--muted); font-size: 0.82rem; }
    .links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 14px;
    }
    .link-tile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 18px;
      border-radius: 16px;
      border: 1px solid var(--card-border);
      background: var(--card);
      box-shadow: var(--shadow);
      backdrop-filter: blur(16px) saturate(150%);
      -webkit-backdrop-filter: blur(16px) saturate(150%);
      color: inherit;
      text-decoration: none;
      transition: transform 0.3s ease, border-color 0.3s ease;
    }
    .link-tile:hover { transform: translateY(-4px); border-color: var(--ring); }
    .link-tile__mark {
      flex: 0 0 auto;
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      border: 1px solid var(--ring);
      color: var(--gold);
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.18), rgba(212, 175, 55, 0.03));
      font-family: 'Amiri', serif;
      font-size: 15px;
    }
    .link-tile strong { display: block; font-size: 0.88rem; }
    .link-tile small {
      display: block;
      color: var(--muted);
      font-size: 0.72rem;
      direction: ltr;
      text-align: right;
    }

    .youtube-card {
      margin-top: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 18px;
      padding: 20px 24px;
      border-radius: var(--radius);
      border: 1px solid rgba(239, 68, 68, 0.35);
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(212, 175, 55, 0.08));
      box-shadow: var(--shadow);
      backdrop-filter: blur(18px) saturate(150%);
      -webkit-backdrop-filter: blur(18px) saturate(150%);
      color: inherit;
      text-decoration: none;
      transition: transform 0.3s ease, border-color 0.3s ease;
    }
    .youtube-card:hover { transform: translateY(-4px); border-color: rgba(239, 68, 68, 0.7); }
    .youtube-icon { width: 54px; height: 54px; flex: 0 0 auto; }
    .youtube-card strong { display: block; font-family: 'Amiri', serif; font-size: 1.35rem; color: var(--gold); }
    .youtube-card small { display: block; color: var(--muted); font-size: 0.8rem; }

    .seo-content {
      margin-top: 56px;
      max-width: 900px;
      padding: 32px;
      border-radius: var(--radius);
      border: 1px solid var(--card-border);
      background: var(--card);
      box-shadow: var(--shadow);
      backdrop-filter: blur(18px) saturate(150%);
      -webkit-backdrop-filter: blur(18px) saturate(150%);
      animation: rise 0.7s ease 0.35s both;
    }
    .seo-content h2 { margin: 0 0 14px; color: var(--gold); font-family: 'Amiri', serif; font-size: 1.8rem; }
    .seo-content p { margin: 0; color: var(--muted); font-size: 0.95rem; line-height: 2.1; text-align: justify; }

    footer {
      margin-top: 48px;
      text-align: center;
      color: var(--muted);
      font-size: 0.72rem;
      letter-spacing: 1.5px;
    }
    .repo-link { color: var(--gold); text-decoration: none; border-bottom: 1px solid var(--ring); padding-bottom: 2px; }
    .repo-link:hover { color: var(--gold-2); }

    @keyframes rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
    @media (max-width: 600px) {
      .container { padding: 28px 16px 48px; }
      .grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; }
      .card { min-height: 0; padding: 10px; }
      .card--preview { gap: 8px; }
      .card__body--under p { display: none; }
      .card__body--under h3 { font-size: 0.85rem; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation: none !important; transition: none !important; }
    }
  </style>
</head>
<body data-theme="light">
  <div class="aurora" aria-hidden="true"><span></span><span></span><span></span></div>
  <button class="theme-toggle" onclick="toggleTheme()" title="تبديل الوضع" aria-label="تبديل الوضع">🌓</button>

  <main class="container">
    <header class="header">
      <span class="eyebrow">QURAN COMPLEX · منصة مصاحف رقمية</span>
      <h1>مجمع القرآن الرقمي</h1>
      <p>INDIVIDUAL TECH INFRASTRUCTURE FOR QURANIC TEXTS</p>
    </header>

    <div class="install-bar">
      <button type="button" id="install-app" class="install-btn" onclick="installApp()" title="تثبيت الموقع كتطبيق على أندرويد">
        <span aria-hidden="true">⬇</span><span id="install-label">تثبيت الموقع كتطبيق</span>
      </button>
    </div>

    <div class="grid">
${EDITION_CARDS}
    </div>

    <nav class="juz-strip" aria-label="أدلة سريعة">
      <a href="/juz-amma">جزء عم <small>الجزء الثلاثون · 23 صفحة</small></a>
      <a href="/juz-tabarak">جزء تبارك <small>الجزء التاسع والعشرون · 20 صفحة</small></a>
    </nav>

    <section class="index-panel" aria-labelledby="index-title">
      <details>
        <summary id="index-title">فهرس الأجزاء والمصاحف والترجمات — 53 صفحة مخصّصة</summary>
        <div class="index-grid">
          <a href="/juz">كل الأجزاء</a>
          <a href="/juz-1">1 · الم</a>
          <a href="/juz-2">2 · سيقول السفهاء</a>
          <a href="/juz-3">3 · تلك الرسل</a>
          <a href="/juz-4">4 · لن تنالوا</a>
          <a href="/juz-5">5 · والمحصنات</a>
          <a href="/juz-6">6 · لا يحب الله</a>
          <a href="/juz-7">7 · وإذا سمعوا</a>
          <a href="/juz-8">8 · ولو أننا</a>
          <a href="/juz-9">9 · قال الملأ</a>
          <a href="/juz-10">10 · واعلموا</a>
          <a href="/juz-11">11 · يعتذرون</a>
          <a href="/juz-12">12 · وما من دابة</a>
          <a href="/juz-13">13 · وما أبرئ</a>
          <a href="/juz-14">14 · ربما</a>
          <a href="/juz-15">15 · سبحان الذي</a>
          <a href="/juz-16">16 · قال ألم</a>
          <a href="/juz-17">17 · اقترب للناس</a>
          <a href="/juz-18">18 · قد أفلح</a>
          <a href="/juz-19">19 · وقال الذين</a>
          <a href="/juz-20">20 · أمن خلق</a>
          <a href="/juz-21">21 · اتل ما أوحي</a>
          <a href="/juz-22">22 · ومن يقنت</a>
          <a href="/juz-23">23 · وما لي</a>
          <a href="/juz-24">24 · فمن أظلم</a>
          <a href="/juz-25">25 · إليه يرد</a>
          <a href="/juz-26">26 · حم</a>
          <a href="/juz-27">27 · قال فما خطبكم</a>
          <a href="/juz-28">28 · قد سمع الله</a>
          <a href="/juz-29">29 · تبارك الذي</a>
          <a href="/juz-30">30 · عم</a>
        </div>
        <div class="index-grid index-grid--riwayat">
          <a href="/riwayat">كل المصاحف والترجمات</a>
${EDITIONS.map((item) => `          <a href="/riwayah/${item.id}">${item.title}</a>`).join('\n')}
        </div>
      </details>
    </section>

    <section class="links-section" aria-labelledby="links-title">
      <h2 id="links-title">روابط ذات صلة</h2>
      <p class="links-note">جميعها مشاريعنا المرتبطة بالمستودع</p>
      <div class="links-grid">
        <a class="link-tile" href="https://quranvoice.org" target="_blank" rel="noreferrer" title="quranvoice.org">
          <span class="link-tile__mark">﷽</span><span><strong>القران الكريم - Quran Voice</strong><small>PDF للتحميل + تلاوات شيوخ</small></span>
        </a>
        <a class="link-tile" href="https://quran.com.ly" target="_blank" rel="noreferrer" title="quran.com.ly">
          <span class="link-tile__mark">◈</span><span><strong>Quran.com.ly</strong><small>امتداد ليبي — مصحف إلكتروني متكامل: قراءة ومجتمع</small></span>
        </a>
        <a class="link-tile" href="https://quran.net.ly" target="_blank" rel="noreferrer" title="quran.net.ly">
          <span class="link-tile__mark">♫</span><span><strong>Quran.net.ly</strong><small>تلاوات +50 شيخاً مرتبة أبجدياً</small></span>
        </a>
        <a class="link-tile" href="https://www.muslim.com.ly/" target="_blank" rel="noreferrer" title="www.muslim.com.ly">
          <span class="link-tile__mark">◈</span><span><strong>muslim.com.ly</strong><small>الرقية الشرعية والاستماع إليها</small></span>
        </a>
        <a class="link-tile" href="https://q.com.ly" target="_blank" rel="noreferrer" title="q.com.ly">
          <span class="link-tile__mark">⬇</span><span><strong>تحميل القرآن الكريم</strong><small>q.com.ly</small></span>
        </a>
        <a class="link-tile" href="https://quranbook.org" target="_blank" rel="noreferrer" title="quranbook.org">
          <span class="link-tile__mark">▤</span><span><strong>Quran Book</strong><small>مقالات قرآنية وتحميل PDF</small></span>
        </a>
        <a class="link-tile" href="https://vector.ai.id.ly/" target="_blank" rel="noreferrer" title="vector.ai.id.ly">
          <span class="link-tile__mark">◇</span><span><strong>أرشيف مصحف المدينة - المتجهات AI</strong><small>نسخ SVG غير متاحة سابقاً</small></span>
        </a>
      </div>

      <a class="youtube-card" href="https://www.youtube.com/@quranvoiceorg" target="_blank" rel="noreferrer" aria-label="اشترك وشاهد قناة Quran Voice على يوتيوب">
        <svg class="youtube-icon" viewBox="0 0 64 64" aria-hidden="true">
          <rect x="2" y="16" width="60" height="40" rx="13" fill="#ef4444"/>
          <path d="M27 26 L44 36 L27 46 Z" fill="#ffffff"/>
          <path d="M50 3 a7 7 0 0 1 7 7 v5 l3 4 h-20 l3-4 v-5 a7 7 0 0 1 7-7 z" fill="#ffffff"/>
          <circle cx="50" cy="25" r="2.6" fill="#ffffff"/>
          <path d="M50 0 v4 M47.5 2 h5" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
        <span>
          <strong>اشترك وشاهد · Quran Voice</strong>
          <small>فيديوهات قصيرة وتلاوات بأصوات شيوخ من العالم الإسلامي</small>
        </span>
      </a>
    </section>

    <section class="seo-content">
      <h2>عن مجمع القرآن الرقمي المستقل</h2>
      <p>
        يعتبر مجمع القرآن الرقمي منصة رائدة تهدف إلى تقديم خدمة تقنية متميزة في عرض المصاحف الرقمية بمختلف الروايات والقراءات. نعتمد في بنية موقعنا على تقنيات الخوادم بدون خادم (Serverless) و Cloudflare Workers لضمان سرعة فائقة في تحميل الصفحات وحماية كاملة لخصوصية المستخدم.
        مشروعنا يركز على تيسير الوصول إلى مصحف المدينة النبوية بروايات (حفص، قالون، ورش، شعبة، السوسي، والدوري)، مع توفير واجهة مستخدم زجاجية حديثة تدعم كافة الأجهزة. نحن نسعى لتقديم أدوات رقمية تساعد الباحثين والقراء في تصفح القرآن الكريم بسهولة وموثوقية عالية.
      </p>
    </section>

    <footer>
      QURANCOMPLEX.LY &copy; 2026 ·
      <a class="repo-link" href="https://github.com/Gamingmonster2/hafs" target="_blank" rel="noreferrer">مستودع المشروع على GitHub</a>
    </footer>
  </main>

  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/landing-sw.js', { scope: '/' }).catch(function () {});
      });
    }
    var deferredInstall = null;
    window.addEventListener('beforeinstallprompt', function (event) {
      event.preventDefault();
      deferredInstall = event;
      var label = document.getElementById('install-label');
      if (label) label.textContent = 'تثبيت التطبيق على الجهاز';
    });
    window.addEventListener('appinstalled', function () {
      deferredInstall = null;
      var label = document.getElementById('install-label');
      if (label) label.textContent = 'تم تثبيت التطبيق ✓';
    });
    async function installApp() {
      var label = document.getElementById('install-label');
      if (!deferredInstall) {
        if (label) label.textContent = 'القائمة ⋮ ← تثبيت التطبيق / إضافة إلى الشاشة الرئيسية';
        return;
      }
      try {
        await deferredInstall.prompt();
        await deferredInstall.userChoice;
      } catch (error) { /* المستخدم ألغى التثبيت */ }
      deferredInstall = null;
      if (label) label.textContent = 'تثبيت الموقع كتطبيق';
    }
    function toggleTheme() {
      var next = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.body.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    }
    if (localStorage.getItem('theme')) {
      document.body.setAttribute('data-theme', localStorage.getItem('theme'));
    }
    // Magic UI — تتبّع Spotlight لموضع المؤشر داخل البطاقة
    document.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (event) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', (event.clientX - rect.left) + 'px');
        card.style.setProperty('--my', (event.clientY - rect.top) + 'px');
      });
    });
  </script>
</body>
</html>`

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

/** استخراج معرّف الإصدار ورقم الصفحة من /page/12 أو /page/english/12 */
function parsePagePath(pathname, mushaf) {
  if (mushaf) {
    const match = pathname.match(/^\/page\/([0-9]+)\/?$/)
    return match ? { edition: mushaf, page: Number(match[1]) } : null
  }
  const match = pathname.match(/^\/page\/([a-z0-9-]+)\/([0-9]+)\/?$/)
  return match && EDITION_IDS.has(match[1])
    ? { edition: match[1], page: Number(match[2]) }
    : null
}

/** ردّ JSON مضغوط لوكيل ذكي يطلب ?format=json على أي صفحة مصوّرة */
async function pageJsonResponse(env, edition, page, pathname) {
  const base = new URL(env.READER_BASE || DEFAULT_READER_BASE)
  const target = new URL('ai/pages.json', base)
  const source = await fetch(target.toString(), { cf: { cacheEverything: true, cacheTtl: 86400 } })
  if (!source.ok) return json({ error: 'AI index unavailable', edition, page }, 503)

  const data = await source.json()
  const ed = data.editions?.[edition]
  if (!ed) return json({ error: 'unknown edition', edition }, 404)

  const surahs = ed.surahs || []
  const found = surahs.find((s) => page >= s.page && page <= s.endPage)
  const maxPage = ed.pageCount || (surahs.length ? surahs[surahs.length - 1].endPage : page)

  return json({
    edition,
    page,
    host: ed.host,
    title: found
      ? `${found.nameAr} — ${found.nameEn} · صفحة ${page}`
      : `صفحة ${page} · ${edition}`,
    surah: found
      ? { number: found.number, nameAr: found.nameAr, nameEn: found.nameEn }
      : null,
    juz: found ? found.juz : null,
    juzApproximate: Boolean(ed.juzApproximate),
    pageUrl: `https://${edition}.qurancomplex.ly/page/${page}`,
    canonicalUrl: `https://qurancomplex.ly${pathname}`,
    imageUrl: found ? found.imageUrl : null,
    neighbors: {
      prev: page > 1 ? page - 1 : null,
      next: page < maxPage ? page + 1 : null,
    },
  })
}

/** تمرير ملف ثابت من مبنى القارئ (حيث وُلد) إلى النطاق الرئيسي */
async function serveReaderFile(env, readerPath) {
  const base = new URL(env.READER_BASE || DEFAULT_READER_BASE)
  const target = new URL(readerPath.replace(/^\/+/, ''), base)
  const response = await fetch(target.toString(), {
    headers: { 'X-Forwarded-Host': 'qurancomplex.ly' },
    cf: { cacheEverything: true, cacheTtl: 3600 },
  })

  const headers = new Headers(response.headers)
  const dot = readerPath.lastIndexOf('.')
  const contentType = SEO_CONTENT_TYPES[dot === -1 ? '' : readerPath.slice(dot)]
  if (contentType) headers.set('Content-Type', contentType)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-QC-Router', ROUTER_VERSION)
  if (readerPath.endsWith('.xml') || readerPath.endsWith('robots.txt')) {
    headers.set('Cache-Control', 'public, max-age=3600')
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const hostname = url.hostname.replace(/^www\./, '').toLowerCase()

    if (url.pathname === '/health') {
      return json({
        ok: true,
        host: hostname,
        router: ROUTER_VERSION,
        readerBase: env.READER_BASE || DEFAULT_READER_BASE,
        routes: Object.keys(ROUTES),
      })
    }

    const mushaf = ROUTES[hostname]

    // وكيل ذكي يطلب تمثيلاً JSON مضغوطاً لأي صفحة بدل زحف صفحات HTML.
    if (url.searchParams.get('format') === 'json') {
      const parsed = parsePagePath(url.pathname, mushaf)
      if (parsed) return pageJsonResponse(env, parsed.edition, parsed.page, url.pathname)
    }

    // بيانات SEO على النطاق الرئيسي: تُقرأ من نسخة القارئ المنشورة فلا يتكرر تخزينها في الـ Worker.
    const pageAlias = pageSeoAlias(url.pathname, mushaf)
    const seoPath = SEO_ALIASES[url.pathname] ?? pageAlias ?? url.pathname
    if (!mushaf && (SEO_FILES.has(seoPath) || AI_FILES.has(url.pathname) || isGeneratedSeoFile(seoPath) || url.pathname.startsWith('/images/'))) {
      return serveReaderFile(env, url.pathname.startsWith('/images/') ? url.pathname : seoPath)
    }

    if (mushaf) {
      // صفحة مستقلة لكل صفحة مصوّرة: عنوان ووصف وصورة OG فريدة لنتائج البحث والصور
      if (pageAlias) return serveReaderFile(env, pageAlias)

      const base = new URL(env.READER_BASE || DEFAULT_READER_BASE)
      const relativePath = url.pathname.replace(/^\/+/, '')
      const target = new URL(relativePath + url.search, base)

      // الملفات المجزّأة تُخزَّن طويلاً؛ HTML يُحدَّث دائماً حتى تظهر البنية الجديدة فوراً.
      const isHashedAsset = /\.[0-9a-zA-Z_-]{8,}\.(js|css)$/.test(url.pathname)
      const isStaticFile = /\.(js|css|png|webp|svg|webmanifest|ico|jpg|woff2?)$/.test(url.pathname)
      const response = await fetch(target.toString(), {
        headers: { 'X-Forwarded-Host': hostname },
        cf: isHashedAsset || isStaticFile
          ? { cacheEverything: true, cacheTtl: isHashedAsset ? 604800 : 3600 }
          : undefined,
      })

      const headers = new Headers(response.headers)
      headers.set('X-Content-Type-Options', 'nosniff')
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      headers.set('X-QC-Router', ROUTER_VERSION)

      // كل نطاق فرعي يحمل عنوان ووصف روايته في HTML الخام، لا عنواناً عاماً مشتركاً
      if (!isStaticFile && url.pathname === '/') {
        headers.set('Cache-Control', 'no-store')
        headers.delete('content-length')
        const html = localizeReaderHtml(await response.text(), mushaf, hostname)
        return new Response(html, { status: response.status, statusText: response.statusText, headers })
      }

      return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
    }

    return new Response(landingHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'X-QC-Router': ROUTER_VERSION,
      },
    })
  },
}
