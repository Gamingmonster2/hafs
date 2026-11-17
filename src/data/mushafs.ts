import hafsPages from './hafs-pages.json'
import hafsIndex from './hafs-index.json'
import type { Mushaf } from '../types'

/**
 * سجل المصاحف. لإضافة مصحف جديد لاحقاً:
 * 1) أنشئ ملف روابط في `src/data/` بنفس الشكل (مصفوفة من روابط الصور).
 * 2) أضف كائنًا هنا في مصفوفة `mushafs`.
 * لا يحتاج أي مكوّن في الواجهة إلى تعديل.
 */
export const mushafs: Mushaf[] = [
  {
    id: 'hafs',
    name: 'مصحف المدينة الشريفة — رواية حفص عن عاصم',
    shortName: 'حفص عن عاصم',
    riwayah: 'حفص عن عاصم',
    pages: hafsPages,
    // الصور 1-3 أغلفة، والفاتحة في الصورة 4 = صفحة المصحف 1، ثم 604 صفحة قرآن،
    // والصور 608-640 صفحات الفهرس في نهاية المصحف.
    coverPages: 3,
    quranPages: 604,
    index: hafsIndex,
    sourcePdf: 'https://dn711503.ca.archive.org/0/items/Hafs-HD/mumtaz-1.pdf',
    accent: '#0f4c3a',
    note: '640 صفحة مصوّرة — المخزن الحالي على Blogger',
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
  return Math.max(mushaf.quranPages ?? mushaf.pages.length - coverCount(mushaf), 1)
}

/**
 * التسمية التي تُعرض للمستخدم لصورة معينة.
 * page هنا هو رقم الصورة (1-based) داخل مصفوفة الروابط.
 */
export function pageLabel(mushaf: Mushaf, page: number): string {
  const covers = coverCount(mushaf)
  const quran = quranCount(mushaf)
  if (page <= covers) return `غلاف ${page}`
  if (page <= covers + quran) return String(page - covers)
  return `فهرس ${page - covers - quran}`
}

/** تحويل رقم صفحة مصحف يدخله المستخدم إلى رقم الصورة المقابل */
export function imagePageFromNumber(mushaf: Mushaf, number: number): number {
  return clampPage(number + coverCount(mushaf), mushaf.pages.length)
}
