/**
 * بيانات وصفية ديناميكية لصفحة القارئ.
 * الصفحات الثابتة (جزء عم / جزء تبارك) تُولَّد في scripts/build-seo.mjs،
 * وهنا نحدّث عنوان الصفحة ووصفها وروابط المشاركة وJSON-LD مع كل صفحة مصحف.
 */
import type { Mushaf } from './types'

const HOSTS: Record<string, string> = {
  hafs: 'hafs.qurancomplex.ly',
  qaloon: 'qaloon.qurancomplex.ly',
  warsh: 'warsh.qurancomplex.ly',
  shubah: 'shubah.qurancomplex.ly',
  susi: 'susi.qurancomplex.ly',
  douri: 'duri.qurancomplex.ly',
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

export function applyReaderSeo(mushaf: Mushaf, pageNumber: number, pageLabel: string, imageUrl?: string) {
  const host = HOSTS[mushaf.id] ?? window.location.host
  const canonical = `https://${host}/?mushaf=${mushaf.id}&page=${pageNumber}`
  const title = `صفحة ${pageLabel} من ${mushaf.shortName} — مصحف المدينة النبوية | Quran Complex`
  const description = `اقرأ صفحة ${pageLabel} من مصحف المدينة النبوية برواية ${mushaf.riwayah} بصورة عالية الجودة، مع فهرس السور والأجزاء وانتقال مباشر إلى أي صفحة.`

  document.title = title
  upsertMeta('name', 'description', description)
  upsertMeta('name', 'robots', 'index, follow')
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:type', 'website')
  upsertMeta('property', 'og:locale', 'ar')
  upsertMeta('property', 'og:url', canonical)
  upsertMeta('name', 'twitter:card', 'summary_large_image')
  if (imageUrl) upsertMeta('property', 'og:image', imageUrl)
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
        isPartOf: { '@id': 'https://qurancomplex.ly/#website' },
        ...(imageUrl
          ? {
              primaryImageOfPage: {
                '@type': 'ImageObject',
                contentUrl: imageUrl,
                name: `صفحة ${pageLabel} — ${mushaf.shortName}`,
              },
            }
          : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'مجمع القرآن الرقمي', item: 'https://qurancomplex.ly/' },
          { '@type': 'ListItem', position: 2, name: mushaf.shortName, item: `https://${host}/` },
          { '@type': 'ListItem', position: 3, name: `صفحة ${pageLabel}`, item: canonical },
        ],
      },
    ],
  })
}
