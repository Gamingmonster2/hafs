export interface Mushaf {
  /** معرّف ثابت يُستخدم في الرابط والإعدادات المحلية */
  id: string
  /** الاسم الكامل الظاهر للمستخدم */
  name: string
  /** اسم مختصر لقائمة المصاحف */
  shortName: string
  /** الرواية */
  riwayah: string
  /** تحميل كسول لروابط الصور حتى لا تُحمّل كل المصاحف دفعة واحدة */
  loadPages: () => Promise<{ default: string[] }>
  /** تحميل كسول لفهرس السور والأجزاء */
  loadIndex?: () => Promise<{ default: MushafIndex }>
  /** عدد الصور التمهيدية (الأغلفة) قبل أول صفحة قرآن. الافتراضي 0 */
  coverPages?: number
  /** عدد صفحات القرآن الحقيقية بعد الأغلفة. الباقي في نهاية الملف فهرس */
  quranPages?: number
  /** رابط ملف PDF الأصلي إن وُجد */
  sourcePdf?: string
  /** صورة غلاف مصغّرة تُعرض في قوائم الاختيار */
  cover: string
  /** نوع الإصدار: رواية، إصدار عربي، أو ترجمة */
  kind: 'riwayah' | 'edition' | 'translation'
  /** لغة الإصدار (للترجمات) */
  language?: string
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
  /** الترجمات لا تحمل ترقيم المصحف العربي؛ صفحات أجزائها تقديرية ويجب ألا تُعرض كرقم مؤكد */
  juzApproximate?: boolean
  surahs: { number: number; name: string; localName?: string; page: number; endPage: number }[]
  juz: { number: number; page: number; verse: string | null }[]
}

/** بيانات المصحف التي تُحمّل وقت التشغيل */
export interface MushafData {
  pages: string[]
  index?: MushafIndex
}

export type Theme = 'light' | 'sepia' | 'dark'

export type ImageStatus = 'loading' | 'loaded' | 'error'
