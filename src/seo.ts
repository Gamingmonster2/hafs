/**
 * بيانات وصفية ديناميكية لكل صفحة مصحف.
 * الصفحات الثابتة (30 جزءاً + 6 روايات) تُولَّد في scripts/build-seo.mjs،
 * وهنا نجعل عنوان كل صفحة قرآن ووصفها فريداً بحسب السورة والجزء والرواية.
 */
import juzNames from './data/juz-names.json'
import type { Mushaf, MushafIndex } from './types'

const juzNameById = juzNames as Record<number, string>

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

function contextForPage(index: MushafIndex | undefined, pageNumber: number) {
  const surah = index?.surahs.find((item) => pageNumber >= item.page && pageNumber <= item.endPage)
  const juzList = index?.juz ?? []
  const juz = juzList.find((item, position) => {
    const end = juzList[position + 1] ? juzList[position + 1].page - 1 : 604
    return pageNumber >= item.page && pageNumber <= end
  })
  return { surah, juz }
}

export function applyReaderSeo(
  mushaf: Mushaf,
  pageNumber: number,
  pageLabel: string,
  imageUrl?: string,
  index?: MushafIndex,
) {
  const host = HOSTS[mushaf.id] ?? window.location.host
  const canonical = `https://${host}/?mushaf=${mushaf.id}&page=${pageNumber}`
  const { surah, juz } = contextForPage(index, pageNumber)
  const juzName = juz ? (juzNameById[juz.number] ?? '') : ''
  const juzLabel = juz ? `جزء ${juz.number}${juzName ? ` — ${juzName}` : ''}` : ''
  const surahLabel = surah ? `سورة ${surah.name}` : ''

  const title = `صفحة ${pageLabel}${surahLabel ? ` — ${surahLabel}` : ''}${juzLabel ? ` — ${juzLabel}` : ''} | ${mushaf.shortName} | Quran Complex`
  const description = `صفحة ${pageNumber} من ${surahLabel || 'مصحف المدينة النبوية'}${juzLabel ? ` في ${juzLabel}` : ''} برواية ${mushaf.riwayah} — صورة عالية الجودة للقراءة، وفهرس السور والأجزاء، وانتقال مباشر إلى أي صفحة.`
  const keywords = [mushaf.riwayah, 'مصحف المدينة النبوية', surahLabel, juzLabel, `صفحة ${pageNumber}`, 'قرآن كريم']
    .filter(Boolean)
    .join('، ')

  document.title = title
  upsertMeta('name', 'description', description)
  upsertMeta('name', 'keywords', keywords)
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
        keywords,
        isPartOf: { '@id': 'https://qurancomplex.ly/#website' },
        about: [
          ...(surah ? [{ '@type': 'Thing', name: surah.name }] : []),
          ...(juzLabel ? [{ '@type': 'Thing', name: juzLabel }] : []),
        ],
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
            name: `صفحة ${pageLabel}`,
            item: canonical,
          },
        ],
      },
    ],
  })
}
