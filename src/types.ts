export interface Mushaf {
  /** معرّف ثابت يُستخدم في الرابط والإعدادات المحلية */
  id: string
  /** الاسم الكامل الظاهر للمستخدم */
  name: string
  /** اسم مختصر لقائمة المصاحف */
  shortName: string
  /** الرواية */
  riwayah: string
  /** روابط صفحات المصحف بالترتيب، الفهرس 0 = الصورة 1 */
  pages: string[]
  /** عدد الصور التمهيدية (الأغلفة) قبل أول صفحة قرآن. الافتراضي 0 */
  coverPages?: number
  /** عدد صفحات القرآن الحقيقية بعد الأغلفة. الباقي في نهاية الملف فهرس */
  quranPages?: number
  /** رابط ملف PDF الأصلي إن وُجد */
  sourcePdf?: string
  /** فهرس السور/Aجزاء إن وُجد */
  index?: MushafIndex
  /** لون مميز للمصحف */
  accent: string
  /** ملاحظة اختيارية تظهر في فهرس المصاحف */
  note?: string
}

/** فهرس السور والأجزاء مأخوذ من ترقيم مصحف المدينة المعتمد */
export interface MushafIndex {
  source: string
  sourceUrl?: string
  generatedAt?: string
  note?: string
  surahs: { number: number; name: string; page: number; endPage: number }[]
  juz: { number: number; page: number; verse: string | null }[]
}

export type Theme = 'light' | 'sepia' | 'dark'

export type ImageStatus = 'loading' | 'loaded' | 'error'
