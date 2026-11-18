/**
 * بوابة qurancomplex.ly: صفحة هبوط على النطاق الرئيسي، وتوجيه ذكي للنطاقات الفرعية.
 * النطاقات الفرعية تُخدم من بناء التطبيق الموحّد (كافة الروايات في مستودع واحد)،
 * ويتم اختيار الرواية تلقائياً داخل التطبيق من خلال اسم النطاق.
 */

const DEFAULT_READER_BASE = 'https://gamingmonster2.github.io/hafs/'

/** اسم النطاق الفرعي → معرّف الرواية في التطبيق */
const ROUTES = {
  'hafs.qurancomplex.ly': 'hafs',
  'qaloon.qurancomplex.ly': 'qaloon',
  'warsh.qurancomplex.ly': 'warsh',
  'shubah.qurancomplex.ly': 'shubah',
  'susi.qurancomplex.ly': 'susi',
  'duri.qurancomplex.ly': 'douri',
  'douri.qurancomplex.ly': 'douri',
}

/** صفحة الهبوط للنطاق الرئيسي (مبنية على تصميم Glassmorphism الأصلي) */
const landingHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="مجمع القرآن الرقمي - منصة تقنية مستقلة تهدف لأرشفة وعرض مصاحف القراءات والروايات القرآنية بجودة عالية عبر بنية تحتية سحابية متطورة.">
  <meta name="keywords" content="قرآن كريم, رواية حفص, رواية قالون, رواية ورش, رواية شعبة, رواية السوسي, رواية الدوري, مصحف المدينة, مجمع القرآن الرقمي, قراءات قرآنية">
  <meta property="og:title" content="مجمع القرآن الرقمي | QURAN COMPLEX">
  <meta property="og:description" content="ست روايات من مصحف المدينة النبوية في قارئ رقمي سريع يعمل على كل الأجهزة.">
  <meta property="og:type" content="website">
  <title>مجمع القرآن الرقمي | QURAN COMPLEX</title>
  <link rel="canonical" href="https://qurancomplex.ly/">
  <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@700&family=Cairo:wght@300;400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --gold: #d4af37;
      --bg: #fdfdfd;
      --text: #222;
      --card-bg: rgba(255, 255, 255, 0.7);
      --border: rgba(212, 175, 55, 0.3);
      --shadow: rgba(0, 0, 0, 0.05);
    }
    [data-theme="dark"] {
      --bg: #0a0a0a;
      --text: #eee;
      --card-bg: rgba(20, 20, 20, 0.6);
      --border: rgba(212, 175, 55, 0.2);
      --shadow: rgba(0, 0, 0, 0.5);
    }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Cairo', sans-serif;
      margin: 0;
      transition: 0.5s ease;
      background-image: radial-gradient(circle at 50% 50%, transparent 0%, var(--bg) 100%),
                        url('https://www.transparenttextures.com/patterns/cubes.png');
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .theme-toggle {
      position: fixed;
      top: 20px;
      left: 20px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      padding: 10px;
      border-radius: 50%;
      cursor: pointer;
      backdrop-filter: blur(10px);
      z-index: 1000;
      box-shadow: 0 4px 15px var(--shadow);
    }
    .header { text-align: center; margin-bottom: 60px; }
    .header h1 { font-family: 'Amiri', serif; font-size: clamp(2.5rem, 8vw, 4rem); color: var(--gold); margin: 0; }
    .header p { opacity: 0.7; font-size: 0.9rem; letter-spacing: 3px; font-weight: 300; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 25px;
      width: 100%;
    }
    .card {
      background: var(--card-bg);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      border: 1px solid var(--border);
      padding: 40px 30px;
      text-decoration: none;
      color: inherit;
      transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      border-radius: 24px;
      box-shadow: 0 10px 30px var(--shadow);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .card:hover { transform: translateY(-10px); border-color: var(--gold); background: rgba(212, 175, 55, 0.05); }
    .card h3 { color: var(--gold); margin: 0 0 15px 0; font-size: 1.8rem; font-family: 'Amiri', serif; }
    .card p { font-size: 0.95rem; opacity: 0.8; line-height: 1.8; margin-bottom: 20px; }
    .badge {
      align-self: flex-start;
      padding: 8px 25px;
      border: 1px solid var(--gold);
      color: var(--gold);
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: bold;
      transition: 0.3s;
    }
    .card:hover .badge { background: var(--gold); color: #fff; }
    .seo-content {
      margin-top: 80px;
      background: var(--card-bg);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      padding: 40px;
      border: 1px solid var(--border);
      max-width: 900px;
      text-align: justify;
    }
    .seo-content h2 { color: var(--gold); font-family: 'Amiri', serif; }
    .seo-content p { opacity: 0.8; font-size: 1rem; line-height: 2; }
    .repo-link { color: var(--gold); text-decoration: none; border-bottom: 1px solid var(--border); }
    footer { margin-top: 60px; opacity: 0.6; font-size: 0.75rem; letter-spacing: 2px; text-align: center; }
    @media (max-width: 600px) {
      .container { padding: 20px; }
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body data-theme="light">
  <button class="theme-toggle" onclick="toggleTheme()" title="تبديل الوضع" aria-label="تبديل الوضع">🌓</button>

  <div class="container">
    <header class="header">
      <h1>مجمع القرآن الرقمي</h1>
      <p>INDIVIDUAL TECH INFRASTRUCTURE FOR QURANIC TEXTS</p>
    </header>

    <div class="grid">
      <a href="https://hafs.qurancomplex.ly" class="card">
        <div><h3>رواية حفص عن عاصم</h3><p>تصفح مصحف المدينة النبوية برواية حفص بوضوح تام، مع الحفاظ على التنسيق الأصلي للمصحف الورقي في بيئة رقمية سريعة.</p></div>
        <span class="badge">تصفح المصحف</span>
      </a>
      <a href="https://qaloon.qurancomplex.ly" class="card">
        <div><h3>رواية قالون عن نافع</h3><p>الإصدار الرقمي المعتمد لمصحف المدينة النبوية برواية قالون، مجهز ليعمل على كافة الشاشات والمتصفحات الحديثة.</p></div>
        <span class="badge">تصفح المصحف</span>
      </a>
      <a href="https://warsh.qurancomplex.ly" class="card">
        <div><h3>رواية ورش عن نافع</h3><p>تصفح رقمي متطور وفق طريق الأزرق، تم بناؤه ليوفر تجربة قراءة مريحة لطلاب العلم والقراء المهتمين برواية أهل المغرب.</p></div>
        <span class="badge">تصفح المصحف</span>
      </a>
      <a href="https://shubah.qurancomplex.ly" class="card">
        <div><h3>رواية شعبة عن عاصم</h3><p>المستودع الرقمي المتكامل لرواية شعبة، تم ربط الكود وتجهيز الواجهة لتقديم أفضل عرض لمصحف شعبة عن عاصم.</p></div>
        <span class="badge">تصفح المصحف</span>
      </a>
      <a href="https://susi.qurancomplex.ly" class="card">
        <div><h3>رواية السوسي عن أبي عمرو</h3><p>المستودع الرقمي المتكامل لرواية السوسي عن أبي عمرو البصري، تصفح رقمي سلس وبنية تحتية سريعة لخدمة طلاب العلم والمطورين.</p></div>
        <span class="badge">تصفح المصحف</span>
      </a>
      <a href="https://duri.qurancomplex.ly" class="card">
        <div><h3>رواية الدوري عن أبي عمرو</h3><p>المستودع الرقمي المتكامل لرواية الدوري عن أبي عمرو البصري، تصفح سلس عبر خوادم حافة سريعة ومستقرة تماماً.</p></div>
        <span class="badge">تصفح المصحف</span>
      </a>
    </div>

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
  </div>

  <script>
    function toggleTheme() {
      document.body.setAttribute('data-theme', document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
      localStorage.setItem('theme', document.body.getAttribute('data-theme'));
    }
    if (localStorage.getItem('theme')) {
      document.body.setAttribute('data-theme', localStorage.getItem('theme'));
    }
  </script>
</body>
</html>`

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
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
        readerBase: env.READER_BASE || DEFAULT_READER_BASE,
        routes: Object.keys(ROUTES),
      })
    }

    const mushaf = ROUTES[hostname]
    if (mushaf) {
      const base = new URL(env.READER_BASE || DEFAULT_READER_BASE)
      const relativePath = url.pathname.replace(/^\/+/, '')
      const target = new URL(relativePath + url.search, base)

      // الملفات ذات الاسم المجزّأ تُخزَّن طويلاً؛ صفحة HTML تُحدَّث دائماً حتى تظهر البنية الجديدة فوراً.
      const isHashedAsset = /\.[0-9a-zA-Z_-]{8,}\.(js|css)$/.test(url.pathname)
      const isStaticFile = /\.(js|css|png|svg|webmanifest|ico|jpg|woff2?)$/.test(url.pathname)
      const response = await fetch(target.toString(), {
        headers: { 'X-Forwarded-Host': hostname },
        cf: isHashedAsset || isStaticFile
          ? { cacheEverything: true, cacheTtl: isHashedAsset ? 604800 : 3600 }
          : undefined,
      })

      const headers = new Headers(response.headers)
      headers.set('X-Content-Type-Options', 'nosniff')
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      if (!isStaticFile && url.pathname === '/') headers.set('Cache-Control', 'no-store')
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
    }

    return new Response(landingHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  },
}
