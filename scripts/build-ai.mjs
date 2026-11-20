#!/usr/bin/env node
/**
 * AI-agent discoverability layer.
 *
 * Generates small, machine-readable files so chat assistants and search agents
 * can answer "which page/image is surah X in edition Y?" with ONE fetch,
 * without crawling 18,847 HTML pages:
 *
 *   public/llms.txt          — concise guide (llmstxt.org convention)
 *   public/llms-full.txt     — full surah list + all editions
 *   public/ai/editions.json  — every edition: host, pages, first/last, cover
 *   public/ai/surahs.json    — 114 surahs with Arabic + English names
 *   public/ai/pages.json     — per-edition surah -> page range + direct image URLs
 *   public/ai/juz.json       — 30 juz ranges
 *
 * All paths are absolute https://qurancomplex.ly so an agent can use them directly.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url)) + '/..'
const dataDir = join(root, 'src', 'data')
const publicDir = join(root, 'public')
const SITE = 'https://qurancomplex.ly'
const today = new Date().toISOString().slice(0, 10)

const readJson = (name) => JSON.parse(readFileSync(join(dataDir, name), 'utf8'))
const write = (rel, data) => {
  const file = join(publicDir, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n', 'utf8')
  return file
}

const SURAH_NAMES_EN = readJson('surah-names-en.json')
const JUZ_NAMES = readJson('juz-names.json')

const EDITIONS = [
  ['hafs', 'حفص عن عاصم', 'Hafs Quran', 'riwayah'],
  ['qaloon', 'قالون عن نافع', 'Qaloon Quran', 'riwayah'],
  ['warsh', 'ورش عن نافع', 'Warsh Quran', 'riwayah'],
  ['shubah', 'شعبة عن عاصم', 'Shubah Quran', 'riwayah'],
  ['susi', 'السوسي عن أبي عمرو', 'Susi Quran', 'riwayah'],
  ['douri', 'الدوري عن أبي عمرو', 'Douri Quran', 'riwayah'],
  ['standard1', 'المصحف العادي 1', 'Standard Mushaf 1', 'arabic'],
  ['standard2', 'المصحف العادي 2', 'Standard Mushaf 2', 'arabic'],
  ['big', 'المصحف الكبير', 'Large Mushaf', 'arabic'],
  ['anko', 'الترجمة بالأنكو', 'Anko translation', 'translation'],
  ['chinese', 'الترجمة بالصينية', 'Chinese translation', 'translation'],
  ['english', 'الترجمة بالإنجليزية', 'English translation', 'translation'],
  ['french', 'الترجمة بالفرنسية', 'French translation', 'translation'],
  ['hausa', 'الترجمة بالهوساوية', 'Hausa translation', 'translation'],
  ['indonesian', 'الترجمة بالإندونيسية', 'Indonesian translation', 'translation'],
  ['portuguese', 'الترجمة بالبرتغالية', 'Portuguese translation', 'translation'],
  ['tamil', 'الترجمة بالتاميل', 'Tamil translation', 'translation'],
  ['telugu', 'الترجمة بالتيلجو', 'Telugu translation', 'translation'],
  ['turkish', 'الترجمة بالتركية', 'Turkish translation', 'translation'],
  ['urdu', 'الترجمة بالأوردو', 'Urdu translation', 'translation'],
  ['vietnami', 'الترجمة بالفيتنامية', 'Vietnamese translation', 'translation'],
]

const editions = EDITIONS.map(([id, title, titleEn, kind]) => {
  const index = readJson(`${id}-index.json`)
  const pages = readJson(`${id}-pages.json`)
  return {
    id, title, titleEn, kind,
    host: `https://${id}.qurancomplex.ly`,
    home: `${SITE}/riwayah/${id}`,
    cover: `${SITE}/images/covers/${id}.webp`,
    preview: `${SITE}/images/previews/${id}.webp`,
    pageCount: pages.length,
    firstPage: `${SITE}/page/${id}/1`,
    juzApproximate: Boolean(index.juzApproximate),
    pageUrl: (n) => `https://${id}.qurancomplex.ly/page/${n}`,
    imageUrl: (n) => pages[n - 1]
      ? (String(pages[n - 1]).startsWith('http') ? pages[n - 1] : SITE + pages[n - 1])
      : null,
    index,
  }
})

/* ---------- ai/editions.json ---------- */
write('ai/editions.json', {
  site: SITE,
  generated: today,
  description: '21 Quran editions: six riwayahs, three Arabic mushafs, twelve translations. Each has 18,847 individually indexable page images in total.',
  editions: editions.map(({ index, pageUrl, imageUrl, ...rest }) => ({
    ...rest,
    surahCount: index.surahs.length,
    example: {
      surah: index.surahs[0].name,
      page: index.surahs[0].page,
      pageUrl: pageUrl(index.surahs[0].page),
      imageUrl: imageUrl(index.surahs[0].page),
    },
  })),
})

/* ---------- ai/surahs.json ---------- */
const first = editions[0].index.surahs
write('ai/surahs.json', {
  generated: today,
  note: 'Page numbers are from the Hafs riwayah with 604 numbered Quran pages; other editions have their own page numbers in ai/pages.json.',
  surahs: first.map((s) => ({
    number: s.number,
    nameAr: s.name,
    nameEn: SURAH_NAMES_EN[s.number] ?? '',
    hafsStartPage: s.page,
    hafsEndPage: s.endPage,
    firstPageUrl: `${SITE}/page/hafs/${s.page}`,
  })),
})

/* ---------- ai/pages.json ---------- */
const pagesByEdition = {}
for (const e of editions) {
  const juzFor = (p) => {
    let best = null
    for (const j of e.index.juz) if (j.page <= p && (!best || j.page > best.page)) best = j
    return best ? best.number : null
  }
  pagesByEdition[e.id] = {
    host: e.host,
    juzApproximate: e.juzApproximate,
    pageCount: e.pageCount,
    surahs: e.index.surahs.map((s) => ({
      number: s.number,
      nameAr: s.name,
      nameEn: SURAH_NAMES_EN[s.number] ?? s.localName ?? '',
      page: s.page,
      endPage: s.endPage,
      juz: juzFor(s.page),
      pageUrl: `https://${e.id}.qurancomplex.ly/page/${s.page}`,
      imageUrl: e.imageUrl(s.page),
    })),
  }
}
write('ai/pages.json', {
  generated: today,
  usage: 'Look up edition id, then surah number, to get the canonical page URL and direct full-size page image URL. Add ?format=json to any page URL for a token response.',
  editions: pagesByEdition,
})

/* ---------- ai/juz.json ---------- */
write('ai/juz.json', {
  generated: today,
  juz: editions[0].index.juz.map((j) => ({
    number: j.number,
    nameAr: JUZ_NAMES[String(j.number)] ?? '',
    startPage: j.page,
    endPage: j.endPage,
    url: `${SITE}/juz-${j.number}`,
  })),
})

/* ---------- llms.txt ---------- */
const llms = `# Quran Complex — qurancomplex.ly

> A free, independent digital Quran library: six canonical riwayahs (Hafs, Qaloon, Warsh, Shubah, Susi, Douri), three Arabic mushafs from pdfquran.com, and twelve translations — 21 editions, 18,847 individually indexable full-page images with surah/juz navigation.

This site is built for agents. All data below is public, stable and machine-readable. Prefer the JSON endpoints over crawling HTML pages.

## Machine-readable data (start here)
- [Editions catalog](https://qurancomplex.ly/ai/editions.json): all 21 editions, hosts, page counts, covers, example page/image.
- [Surahs](https://qurancomplex.ly/ai/surahs.json): 114 surahs with Arabic + English names (e.g. Al-'Ankabut — The Spider) and Hafs start pages.
- [Pages by edition](https://qurancomplex.ly/ai/pages.json): for every edition, each surah's page range plus canonical page URL and direct full-size image URL.
- [Juz ranges](https://qurancomplex.ly/ai/juz.json): 30 juz with page ranges.

## How to answer common questions
- "Which page is surah Al-Kahf in the English translation?" → fetch /ai/pages.json, editions.english.surahs[18].
- "Give me the image of Quran page 7 in Warsh." → https://warsh.qurancomplex.ly/page/7 (HTML) or use imageUrl from /ai/pages.json.
- "List all translations." → /ai/editions.json, filter kind = translation.
- Any page URL also accepts ?format=json for a compact JSON object with title, surah, juz, image URL and neighbor pages.

## Human-facing indexes
- Home: https://qurancomplex.ly/
- All editions: https://qurancomplex.ly/riwayat
- Juz index: https://qurancomplex.ly/juz
- Sitemaps: https://qurancomplex.ly/sitemap.xml (includes sitemap-pages.xml with all 18,847 pages and image tags)

## Attribution
Independent project. Page images sourced from pdfquran.com and King Fahd Complex; not affiliated with or endorsed by them.
`
write('llms.txt', llms)

/* ---------- llms-full.txt ---------- */
const surahLines = first.map((s) =>
  `${String(s.number).padStart(3)}. ${s.name} — ${SURAH_NAMES_EN[s.number] ?? ''} (Hafs p.${s.page})`
).join('\n')
const editionLines = editions.map((e) =>
  `- ${e.id} | ${e.title} | ${e.titleEn} | ${e.host} | ${e.pageCount} pages | ${e.kind}`
).join('\n')
write('llms-full.txt', `${llms}\n\n## All 114 surahs\n\n${surahLines}\n\n## All 21 editions\n\n${editionLines}\n`)

console.log(`AI layer generated: llms.txt, llms-full.txt, ai/{editions,surahs,pages,juz}.json (${editions.length} editions, ${first.length} surahs)`)
