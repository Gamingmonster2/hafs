/**
 * بيانات وصفية ديناميكية لكل صفحة مصحف.
 * الصفحات الثابتة (30 جزءاً + 6 روايات) تُولَّد في scripts/build-seo.mjs،
 * وهنا نجعل عنوان كل صفحة قرآن ووصفها فريداً بحسب السورة والجزء والرواية.
 */
import juzNames from './data/juz-names.json'
import surahNamesEn from './data/surah-names-en.json'
import type { Mushaf, MushafIndex } from './types'

const juzNameById = juzNames as Record<number, string>
const surahNameEnById = surahNamesEn as Record<number, string>

const HOSTS: Record<string, string> = {
  hafs: 'hafs.qurancomplex.ly',
  qaloon: 'qaloon.qurancomplex.ly',
  warsh: 'warsh.qurancomplex.ly',
  shubah: 'shubah.qurancomplex.ly',
  susi: 'susi.qurancomplex.ly',
  douri: 'duri.qurancomplex.ly',
  standard1: 'standard1.qurancomplex.ly',
  standard2: 'standard2.qurancomplex.ly',
  big: 'big.qurancomplex.ly',
  anko: 'anko.qurancomplex.ly',
  chinese: 'chinese.qurancomplex.ly',
  english: 'english.qurancomplex.ly',
  french: 'french.qurancomplex.ly',
  hausa: 'hausa.qurancomplex.ly',
  indonesian: 'indonesian.qurancomplex.ly',
  portuguese: 'portuguese.qurancomplex.ly',
  tamil: 'tamil.qurancomplex.ly',
  telugu: 'telugu.qurancomplex.ly',
  turkish: 'turkish.qurancomplex.ly',
  urdu: 'urdu.qurancomplex.ly',
  vietnami: 'vietnami.qurancomplex.ly',
}

function editionLabel(mushaf: Mushaf): string {
  if (mushaf.kind === 'translation') return mushaf.riwayah
  if (mushaf.kind === 'edition') return mushaf.shortName
  return `رواية ${mushaf.riwayah}`
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.content = content
}

function setCanonical(url: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.appendChild(element)
  }
  element.href = url
}

function setJsonLd(id: string, value: unknown) {
  let element = document.getElementById(id) as HTMLScriptElement | null
  if (!element) {
    element = document.createElement('script')
    element.type = 'application/ld+json'
    element.id = id
    document.head.appendChild(element)
  }
  element.textContent = JSON.stringify(value)
}

function contextForPage(index: MushafIndex | undefined, pageNumber: number) {
  const surah = index?.surahs.find((item) => pageNumber >= item.page && pageNumber <= item.endPage)
  const juzList = index?.juz ?? []
  const juz = juzList.find((item, position) => {
    const end = juzList[position + 1] ? juzList[position + 1].page - 1 : 604
    return pageNumber >= item.page && pageNumber <= end
  })
  return { surah, juz }
}

/** روابط المشاركة يجب أن تكون مطلقة؛ مسارات /images/* النسبية لا تُقرأ خارج الموقع */
function absoluteImageUrl(src: string, host: string): string {
  if (/^https?:\/\//i.test(src)) return src
  return `https://${host}${src.startsWith('/') ? src : `/${src}`}`
}

/** رابط الصورة يحمل اسماً نصياً (al-ankabut-page-441.webp) لا اسماً رقمياً (0441.webp) */
function descriptiveImageUrl(src: string, mushaf: Mushaf, pageNumber: number, index?: MushafIndex): string {
  const match = src.match(/^\/images\/([a-z0-9-]+)\/([0-9]+)\.webp$/)
  if (!match || match[1] !== mushaf.id) return src
  const surah = index?.surahs.find((item) => pageNumber >= item.page && pageNumber <= item.endPage)
    ?? index?.surahs[0]
  const en = surah ? (surahNameEnById[surah.number] ?? '').split('—')[0].trim() : ''
  const slug = (en || (surah ? `Surah ${surah.number}` : `page-${pageNumber}`))
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `/images/${mushaf.id}/${slug || `page-${pageNumber}`}-page-${pageNumber}.webp`
}

export function applyReaderSeo(
  mushaf: Mushaf,
  pageNumber: number,
  pageLabel: string,
  imageUrl?: string,
  index?: MushafIndex,
) {
  const host = HOSTS[mushaf.id] ?? window.location.host
  // الرابط النظيف هو نفسه الذي تخدمه الصفحة الثابتة، فتتوافق مشاركات السوشيال مع الفهرسة
  const canonical = `https://${host}/page/${pageNumber}`
  const { surah, juz } = contextForPage(index, pageNumber)
  const juzName = juz ? (juzNameById[juz.number] ?? '') : ''
  const juzLabel = juz ? `جزء ${juz.number}${juzName ? ` — ${juzName}` : ''}` : ''
  const surahNameEn = surah ? (surahNameEnById[surah.number] ?? '') : ''
  const surahLabel = surah ? `سورة ${surah.name}${surahNameEn ? ` (${surahNameEn})` : ''}` : ''

  const title = `${surahLabel || mushaf.shortName}${juzLabel ? ` — ${juzLabel}` : ''} — صفحة ${pageLabel} | ${mushaf.shortName} | Quran Complex`
  const description = `${surahLabel || mushaf.shortName} — صفحة ${pageNumber}${juzLabel ? `، ${juzLabel}` : ''} — ${editionLabel(mushaf)}: صورة كاملة عالية الجودة للقراءة، وفهرس السور والأجزاء، وانتقال مباشر إلى أي صفحة.`
  const keywords = [mushaf.riwayah, 'مصحف المدينة النبوية', surahLabel, surahNameEn, juzLabel, `صفحة ${pageNumber}`, 'قرآن كريم']
    .filter(Boolean)
    .join('، ')

  const descriptiveSrc = imageUrl ? descriptiveImageUrl(imageUrl, mushaf, pageNumber, index) : undefined
  const ogImage = descriptiveSrc ? absoluteImageUrl(descriptiveSrc, 'qurancomplex.ly') : undefined
  // اسم الصورة نصّي يبدأ باسم السورة لا برقم الصفحة، حتى يظهر كاسم لا كرقم في نتائج الصور
  const imageAlt = `${surahLabel || mushaf.shortName} — ${editionLabel(mushaf)} — صفحة ${pageNumber}`

  document.title = title
  upsertMeta('name', 'description', description)
  upsertMeta('name', 'keywords', keywords)
  upsertMeta('name', 'robots', 'index, follow')
  upsertMeta('property', 'og:site_name', 'مجمع القرآن الرقمي')
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:type', 'article')
  upsertMeta('property', 'og:locale', 'ar')
  upsertMeta('property', 'og:url', canonical)
  upsertMeta('name', 'twitter:card', 'summary_large_image')
  if (ogImage) {
    upsertMeta('property', 'og:image', ogImage)
    upsertMeta('property', 'og:image:alt', imageAlt)
    upsertMeta('name', 'twitter:image', ogImage)
    upsertMeta('name', 'twitter:image:alt', imageAlt)
  }
  setCanonical(canonical)

  setJsonLd('qurancomplex-reader-schema', {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        name: title,
        description,
        url: canonical,
        inLanguage: 'ar',
        keywords,
        isPartOf: { '@id': 'https://qurancomplex.ly/#website' },
        about: [
          ...(surah ? [{ '@type': 'Thing', name: surahLabel }] : []),
          ...(juzLabel ? [{ '@type': 'Thing', name: juzLabel }] : []),
        ],
        ...(ogImage
          ? {
              primaryImageOfPage: {
                '@type': 'ImageObject',
                contentUrl: ogImage,
                name: imageAlt,
                caption: imageAlt,
              },
            }
          : {}),
        publisher: { '@type': 'Organization', name: 'مجمع القرآن الرقمي — مشروع مستقل', url: 'https://qurancomplex.ly/' },
        creditText: 'صفحات المصاحف من pdfquran.com ومجمع الملك فهد — مشروع مستقل غير رسمي',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'مجمع القرآن الرقمي', item: 'https://qurancomplex.ly/' },
          { '@type': 'ListItem', position: 2, name: mushaf.shortName, item: `https://${host}/` },
          ...(juz
            ? [{
                '@type': 'ListItem',
                position: 3,
                name: juzLabel,
                item: `https://qurancomplex.ly/${juz.number === 30 ? 'juz-amma' : juz.number === 29 ? 'juz-tabarak' : `juz-${juz.number}`}`,
              }]
            : []),
          {
            '@type': 'ListItem',
            position: juz ? 4 : 3,
            name: `${surahLabel || mushaf.shortName} — صفحة ${pageLabel}`,
            item: canonical,
          },
        ],
      },
    ],
  })
}
