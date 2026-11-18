/**
 * توليد فهرس السور والأجزاء من Quran.com API v4.
 * الترقيم هو ترقيم مصحف المدينة النبوية المعتمد (604 صفحة) لمجمع الملك فهد.
 * الاستخدام: node scripts/build-index.mjs --id=hafs
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = 'true'] = arg.replace(/^--/, '').split('=')
    return [key, value]
  }),
)
const id = args.id ?? 'hafs'

const BASE = 'https://api.quran.com/api/v4'
const json = async (url) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`فشل جلب ${url}: ${response.status}`)
  return response.json()
}

const [{ chapters }, juzResponses] = await Promise.all([
  json(`${BASE}/chapters`),
  Promise.all(
    Array.from({ length: 30 }, (_, index) => json(`${BASE}/verses/by_juz/${index + 1}?per_page=1`)),
  ),
])

const surahs = chapters.map((chapter) => ({
  number: chapter.id,
  name: chapter.name_arabic,
  page: chapter.pages[0],
  endPage: chapter.pages[1],
}))

const juz = juzResponses.map((response, index) => ({
  number: index + 1,
  page: response.verses[0]?.page_number ?? null,
  verse: response.verses[0]?.verse_key ?? null,
}))

if (surahs.length !== 114 || juz.some((item) => item.page === null)) {
  throw new Error('البيانات التي أرجعها المصدر غير مكتملة، لم تتم الكتابة.')
}

const output = {
  source: 'Quran.com API v4 — ترقيم مصحف المدينة النبوية (604 صفحة)',
  sourceUrl: 'https://api.quran.com/api/v4/chapters',
  generatedAt: new Date().toISOString().slice(0, 10),
  note: 'يجب على المستخدم مطابقة أرقام الصفحات مع الصور بصرياً قبل الاعتماد النهائي.',
  surahs,
  juz,
}

const out = resolve(root, 'src', 'data', `${id}-index.json`)
writeFileSync(out, JSON.stringify(output, null, 2) + '\n', 'utf8')
console.log(`تم توليد ${surahs.length} سورة و${juz.length} جزءاً → ${out}`)
