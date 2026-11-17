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
  /** لون مميز للمصحف */
  accent: string
  /** ملاحظة اختيارية تظهر في فهرس المصاحف */
  note?: string
}

export type Theme = 'light' | 'sepia' | 'dark'

export type ImageStatus = 'loading' | 'loaded' | 'error'
