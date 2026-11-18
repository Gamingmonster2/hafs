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
    accent: '#4a5d8a',
    note: '640 صورة — المخزن الحالي على Blogger',
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
