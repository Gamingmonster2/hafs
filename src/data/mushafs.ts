import type { Mushaf } from '../types'

/**
 * سجل المصاحف. كل مصحف له ملف روابط وملف فهرس يُحمّلان عند اختياره فقط،
 * حتى لا تُحمّل روابط كل المصاحف دفعة واحدة عند فتح الموقع.
 */
export const mushafs: Mushaf[] = [
  {
    id: 'hafs',
    name: 'مصحف المدينة الشريفة — رواية حفص عن عاصم',
    shortName: 'حفص عن عاصم',
    riwayah: 'حفص عن عاصم',
    loadPages: () => import('./hafs-pages.json'),
    loadIndex: () => import('./hafs-index.json'),
    // النمط مؤكّد للمصاحف الستة: الصور 1-3 أغلفة، والصورة 4 = الفاتحة (صفحة 1)،
    // ثم 604 صفحة قرآن، والباقي فهارس في نهاية الملف.
    coverPages: 3,
    quranPages: 604,
    cover: '/images/covers/hafs.webp',
    kind: 'riwayah',
    sourcePdf: 'https://dn711503.ca.archive.org/0/items/Hafs-HD/mumtaz-1.pdf',
    accent: '#0f4c3a',
    note: '640 صورة — المخزن الحالي على Blogger',
  },
  {
    id: 'qaloon',
    name: 'مصحف المدينة الشريفة — رواية قالون عن نافع',
    shortName: 'قالون عن نافع',
    riwayah: 'قالون عن نافع',
    loadPages: () => import('./qaloon-pages.json'),
    loadIndex: () => import('./qaloon-index.json'),
    coverPages: 3,
    quranPages: 604,
    cover: '/images/covers/qaloon.webp',
    kind: 'riwayah',
    accent: '#7a4b8a',
    note: '640 صورة — المخزن الحالي على Blogger',
  },
  {
    id: 'warsh',
    name: 'مصحف المدينة الشريفة — رواية ورش عن نافع',
    shortName: 'ورش عن نافع',
    riwayah: 'ورش عن نافع',
    loadPages: () => import('./warsh-pages.json'),
    loadIndex: () => import('./warsh-index.json'),
    coverPages: 3,
    quranPages: 604,
    cover: '/images/covers/warsh.webp',
    kind: 'riwayah',
    accent: '#9c4a2f',
    note: '640 صورة — المخزن الحالي على Blogger',
  },
  {
    id: 'shubah',
    name: 'مصحف المدينة الشريفة — رواية شعبة عن عاصم',
    shortName: 'شعبة عن عاصم',
    riwayah: 'شعبة عن عاصم',
    loadPages: () => import('./shubah-pages.json'),
    loadIndex: () => import('./shubah-index.json'),
    coverPages: 3,
    quranPages: 604,
    cover: '/images/covers/shubah.webp',
    kind: 'riwayah',
    accent: '#1f5f7a',
    note: '640 صورة — المخزن الحالي على Blogger',
  },
  {
    id: 'susi',
    name: 'مصحف المدينة الشريفة — رواية السوسي عن أبي عمرو',
    shortName: 'السوسي عن أبي عمرو',
    riwayah: 'السوسي عن أبي عمرو',
    loadPages: () => import('./susi-pages.json'),
    loadIndex: () => import('./susi-index.json'),
    coverPages: 3,
    quranPages: 604,
    cover: '/images/covers/susi.webp',
    kind: 'riwayah',
    accent: '#8a6b1f',
    note: '624 صورة — المخزن الحالي على Blogger',
  },
  {
    id: 'douri',
    name: 'مصحف المدينة الشريفة — رواية الدوري عن أبي عمرو',
    shortName: 'الدوري عن أبي عمرو',
    riwayah: 'الدوري عن أبي عمرو',
    loadPages: () => import('./douri-pages.json'),
    loadIndex: () => import('./douri-index.json'),
    coverPages: 3,
    quranPages: 604,
    cover: '/images/covers/douri.webp',
    kind: 'riwayah',
    accent: '#4a5d8a',
    note: '640 صورة — المخزن الحالي على Blogger',
  },
  {
    id: 'standard1',
    name: 'مصحف المدينة — المصحف العادي 1',
    shortName: 'المصحف العادي 1',
    riwayah: 'حفص عن عاصم',
    loadPages: () => import('./standard1-pages.json'),
    loadIndex: () => import('./standard1-index.json'),
    coverPages: 0,
    quranPages: 604,
    cover: '/images/covers/standard1.webp',
    kind: 'edition',
    sourcePdf: 'https://www.pdfquran.com/download/standard1/standard1-quran.pdf',
    accent: '#2f6f5e',
    note: '604 صفحة — صور WebP من مصاحف pdfquran.com',
  },
  {
    id: 'standard2',
    name: 'مصحف المدينة — المصحف العادي 2',
    shortName: 'المصحف العادي 2',
    riwayah: 'حفص عن عاصم',
    loadPages: () => import('./standard2-pages.json'),
    loadIndex: () => import('./standard2-index.json'),
    coverPages: 0,
    quranPages: 604,
    cover: '/images/covers/standard2.webp',
    kind: 'edition',
    sourcePdf: 'https://www.pdfquran.com/download/standard2/standard2-quran.pdf',
    accent: '#5c5a8a',
    note: '604 صفحة — صور WebP من مصاحف pdfquran.com',
  },
  {
    id: 'big',
    name: 'مصحف المدينة — المصحف الكبير',
    shortName: 'المصحف الكبير',
    riwayah: 'حفص عن عاصم',
    loadPages: () => import('./big-pages.json'),
    loadIndex: () => import('./big-index.json'),
    coverPages: 0,
    quranPages: 604,
    cover: '/images/covers/big.webp',
    kind: 'edition',
    sourcePdf: 'https://www.pdfquran.com/download/big/big-quran.pdf',
    accent: '#8a5a2f',
    note: '604 صفحة — صور WebP من مصاحف pdfquran.com',
  },
  {
    id: 'anko', name: 'ترجمة القرآن الكريم — لغة الأنكو', shortName: 'الترجمة بالأنكو', riwayah: 'لغة الأنكو', language: 'الأنكو',
    loadPages: () => import('./anko-pages.json'), loadIndex: () => import('./anko-index.json'),
    coverPages: 0, quranPages: 1208, cover: '/images/covers/anko.webp', kind: 'translation',
    sourcePdf: 'https://www.pdfquran.com/download/anko/anko-quran.pdf', accent: '#6b5b3a',
    note: 'ترجمة — صور WebP من ملف PDF الأصلي',
  },
  {
    id: 'chinese', name: 'ترجمة القرآن الكريم — اللغة الصينية', shortName: 'الترجمة بالصينية', riwayah: 'اللغة الصينية', language: 'الصينية',
    loadPages: () => import('./chinese-pages.json'), loadIndex: () => import('./chinese-index.json'),
    coverPages: 0, quranPages: 1227, cover: '/images/covers/chinese.webp', kind: 'translation',
    sourcePdf: 'https://www.pdfquran.com/download/chinese/chinese-quran.pdf', accent: '#a33b3b',
    note: 'ترجمة — صور WebP من ملف PDF الأصلي',
  },
  {
    id: 'english', name: 'ترجمة القرآن الكريم — اللغة الإنجليزية', shortName: 'الترجمة بالإنجليزية', riwayah: 'اللغة الإنجليزية', language: 'الإنجليزية',
    loadPages: () => import('./english-pages.json'), loadIndex: () => import('./english-index.json'),
    coverPages: 0, quranPages: 694, cover: '/images/covers/english.webp', kind: 'translation',
    sourcePdf: 'https://www.pdfquran.com/download/english/english-quran.pdf', accent: '#285f8a',
    note: 'ترجمة — صور WebP من ملف PDF الأصلي',
  },
  {
    id: 'french', name: 'ترجمة القرآن الكريم — اللغة الفرنسية', shortName: 'الترجمة بالفرنسية', riwayah: 'اللغة الفرنسية', language: 'الفرنسية',
    loadPages: () => import('./french-pages.json'), loadIndex: () => import('./french-index.json'),
    coverPages: 0, quranPages: 988, cover: '/images/covers/french.webp', kind: 'translation',
    sourcePdf: 'https://www.pdfquran.com/download/french/french-quran.pdf', accent: '#4364a3',
    note: 'ترجمة — صور WebP من ملف PDF الأصلي',
  },
  {
    id: 'hausa', name: 'ترجمة القرآن الكريم — اللغة الهوساوية', shortName: 'الترجمة بالهوساوية', riwayah: 'اللغة الهوساوية', language: 'الهوساوية',
    loadPages: () => import('./hausa-pages.json'), loadIndex: () => import('./hausa-index.json'),
    coverPages: 0, quranPages: 960, cover: '/images/covers/hausa.webp', kind: 'translation',
    sourcePdf: 'https://www.pdfquran.com/download/hausa/hausa-quran.pdf', accent: '#5e7a35',
    note: 'ترجمة — صور WebP من ملف PDF الأصلي',
  },
  {
    id: 'indonesian', name: 'ترجمة القرآن الكريم — اللغة الإندونيسية', shortName: 'الترجمة بالإندونيسية', riwayah: 'اللغة الإندونيسية', language: 'الإندونيسية',
    loadPages: () => import('./indonesian-pages.json'), loadIndex: () => import('./indonesian-index.json'),
    coverPages: 0, quranPages: 1131, cover: '/images/covers/indonesian.webp', kind: 'translation',
    sourcePdf: 'https://www.pdfquran.com/download/indonesian/indonesian-quran.pdf', accent: '#b05a2f',
    note: 'ترجمة — صور WebP من ملف PDF الأصلي',
  },
  {
    id: 'portuguese', name: 'ترجمة القرآن الكريم — اللغة البرتغالية', shortName: 'الترجمة بالبرتغالية', riwayah: 'اللغة البرتغالية', language: 'البرتغالية',
    loadPages: () => import('./portuguese-pages.json'), loadIndex: () => import('./portuguese-index.json'),
    coverPages: 0, quranPages: 1069, cover: '/images/covers/portuguese.webp', kind: 'translation',
    sourcePdf: 'https://www.pdfquran.com/download/portuguese/portuguese-quran.pdf', accent: '#3f7a55',
    note: 'ترجمة — صور WebP من ملف PDF الأصلي',
  },
  {
    id: 'tamil', name: 'ترجمة القرآن الكريم — اللغة التاميل', shortName: 'الترجمة بالتاميل', riwayah: 'اللغة التاميل', language: 'التاميل',
    loadPages: () => import('./tamil-pages.json'), loadIndex: () => import('./tamil-index.json'),
    coverPages: 0, quranPages: 1219, cover: '/images/covers/tamil.webp', kind: 'translation',
    sourcePdf: 'https://www.pdfquran.com/download/tamil/tamil-quran.pdf', accent: '#8a3f7a',
    note: 'ترجمة — صور WebP من ملف PDF الأصلي',
  },
  {
    id: 'telugu', name: 'ترجمة القرآن الكريم — اللغة التيلجو', shortName: 'الترجمة بالتيلجو', riwayah: 'اللغة التيلجو', language: 'التيلجو',
    loadPages: () => import('./telugu-pages.json'), loadIndex: () => import('./telugu-index.json'),
    coverPages: 0, quranPages: 1294, cover: '/images/covers/telugu.webp', kind: 'translation',
    sourcePdf: 'https://www.pdfquran.com/download/telugu/telugu-quran.pdf', accent: '#8a6a2f',
    note: 'ترجمة — صور WebP من ملف PDF الأصلي',
  },
  {
    id: 'turkish', name: 'ترجمة القرآن الكريم — اللغة التركية', shortName: 'الترجمة بالتركية', riwayah: 'اللغة التركية', language: 'التركية',
    loadPages: () => import('./turkish-pages.json'), loadIndex: () => import('./turkish-index.json'),
    coverPages: 0, quranPages: 646, cover: '/images/covers/turkish.webp', kind: 'translation',
    sourcePdf: 'https://www.pdfquran.com/download/turkish/turkish-quran.pdf', accent: '#a0473b',
    note: 'ترجمة — صور WebP من ملف PDF الأصلي',
  },
  {
    id: 'urdu', name: 'ترجمة القرآن الكريم — اللغة الأوردو', shortName: 'الترجمة بالأوردو', riwayah: 'اللغة الأوردو', language: 'الأوردو',
    loadPages: () => import('./urdu-pages.json'), loadIndex: () => import('./urdu-index.json'),
    coverPages: 0, quranPages: 1768, cover: '/images/covers/urdu.webp', kind: 'translation',
    sourcePdf: 'https://www.pdfquran.com/download/urdu/urdu-quran.pdf', accent: '#2f7a6a',
    note: 'ترجمة — صور WebP من ملف PDF الأصلي',
  },
  {
    id: 'vietnami', name: 'ترجمة القرآن الكريم — اللغة الفيتنامية', shortName: 'الترجمة بالفيتنامية', riwayah: 'اللغة الفيتنامية', language: 'الفيتنامية',
    loadPages: () => import('./vietnami-pages.json'), loadIndex: () => import('./vietnami-index.json'),
    coverPages: 0, quranPages: 1207, cover: '/images/covers/vietnami.webp', kind: 'translation',
    sourcePdf: 'https://www.pdfquran.com/download/vietnami/vietnami-quran.pdf', accent: '#7a4f8a',
    note: 'ترجمة — صور WebP من ملف PDF الأصلي',
  },
]

export function getMushaf(id: string | null | undefined): Mushaf {
  return mushafs.find((mushaf) => mushaf.id === id) ?? mushafs[0]
}

export function clampPage(page: number, total: number): number {
  if (!Number.isFinite(page)) return 1
  return Math.min(Math.max(Math.trunc(page), 1), Math.max(total, 1))
}

/** عدد الصور التمهيدية قبل أول صفحة قرآن */
export function coverCount(mushaf: Mushaf): number {
  return Math.max(mushaf.coverPages ?? 0, 0)
}

/** عدد صفحات القرآن الفعلية (بدون الأغلفة والفهرس) */
export function quranCount(mushaf: Mushaf): number {
  return Math.max(mushaf.quranPages ?? 1, 1)
}

/** التسمية التي تُعرض للمستخدم لصورة معينة (page = رقم الصورة داخل الملف) */
export function pageLabel(mushaf: Mushaf, page: number): string {
  const covers = coverCount(mushaf)
  const quran = quranCount(mushaf)
  if (page <= covers) return `غلاف ${page}`
  if (page <= covers + quran) return String(page - covers)
  return `فهرس ${page - covers - quran}`
}

/** تحويل رقم صفحة مصحف يدخله المستخدم إلى رقم الصورة المقابل */
export function imagePageFromNumber(mushaf: Mushaf, number: number): number {
  return number + coverCount(mushaf)
}
