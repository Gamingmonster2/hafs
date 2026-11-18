import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BottomBar } from './components/BottomBar'
import { PageIndexDrawer } from './components/PageIndexDrawer'
import { PageViewer } from './components/PageViewer'
import { Toolbar } from './components/Toolbar'
import { clampPage, coverCount, getMushaf, imagePageFromNumber, mushafs, pageLabel, quranCount } from './data/mushafs'
import { usePersistentState } from './hooks/usePersistentState'
import type { ImageStatus, MushafData, Theme } from './types'

const ZOOM_STEPS = [50, 75, 100, 125, 150, 200, 250]

function readParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name)
}

/** يسمح بفتح كل رواية مباشرة من نطاقها الفرعي دون كتابة ?mushaf= */
function mushafFromHost(): string | null {
  const subdomain = window.location.hostname.split('.')[0]?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    hafs: 'hafs',
    qaloon: 'qaloon',
    warsh: 'warsh',
    shubah: 'shubah',
    susi: 'susi',
    duri: 'douri',
  }
  return map[subdomain] ?? null
}

function zoomStep(current: number, direction: 1 | -1): number {
  if (direction === 1) return ZOOM_STEPS.find((step) => step > current) ?? Math.min(current + 25, 300)
  return [...ZOOM_STEPS].reverse().find((step) => step < current) ?? Math.max(current - 25, 50)
}

export default function App() {
  const initialMushaf = getMushaf(readParam('mushaf') ?? mushafFromHost())
  const [mushafId, setMushafId] = useState(initialMushaf.id)
  const mushaf = getMushaf(mushafId)

  const [page, setPage] = useState(() => {
    const requested = Number(readParam('page'))
    if (Number.isFinite(requested) && requested >= 1 && requested <= quranCount(initialMushaf)) {
      return requested + coverCount(initialMushaf)
    }
    const image = Number(readParam('image'))
    if (Number.isFinite(image) && image >= 1) return Math.trunc(image)
    return coverCount(initialMushaf) + 1
  })
  const [zoom, setZoom] = useState(100)
  const [theme, setTheme] = usePersistentState<Theme>('qurancomplex:theme', 'light')
  const [bookmark, setBookmark] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [status, setStatus] = useState<ImageStatus>('loading')
  const [retryCount, setRetryCount] = useState(0)
  const [data, setData] = useState<MushafData>({ pages: [] })
  const [dataReady, setDataReady] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | null>(null)
  const firstLoad = useRef(true)

  const totalPages = data.pages.length
  const covers = coverCount(mushaf)
  const quranPages = quranCount(mushaf)
  const label = pageLabel(mushaf, page)
  const pageNumber = page > covers && page <= covers + quranPages ? page - covers : page
  const currentSrc = useMemo(() => data.pages[page - 1] ?? '', [data.pages, page])
  const displaySrc = useMemo(
    () => (retryCount === 0 ? currentSrc : `${currentSrc}${currentSrc.includes('?') ? '&' : '?'}retry=${retryCount}`),
    [currentSrc, retryCount],
  )

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  /* تحميل بيانات المصحف المختار فقط (روابط + فهرس) */
  useEffect(() => {
    let cancelled = false
    setDataReady(false)
    Promise.all([mushaf.loadPages(), mushaf.loadIndex?.() ?? Promise.resolve(undefined)])
      .then(([pagesModule, indexModule]) => {
        if (cancelled) return
        setData({ pages: pagesModule.default, index: indexModule?.default })
        setDataReady(true)
      })
      .catch(() => {
        if (!cancelled) {
          setData({ pages: [] })
          setDataReady(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [mushaf])

  useEffect(() => {
    if (dataReady && totalPages > 0) {
      setPage((current) => clampPage(current, totalPages))
    }
  }, [dataReady, totalPages])

  /* استعادة الجلسة وعلامة القراءة عند تغيير المصحف */
  useEffect(() => {
    let saved: { page?: unknown; zoom?: unknown } | null = null
    try {
      saved = JSON.parse(window.localStorage.getItem(`qurancomplex:session:${mushaf.id}`) || 'null')
    } catch {
      saved = null
    }

    if (saved && typeof saved.zoom === 'number' && Number.isFinite(saved.zoom)) {
      setZoom(Math.min(Math.max(Math.trunc(saved.zoom), 50), 300))
    }

    const shouldUseUrlPage = firstLoad.current && (readParam('page') !== null || readParam('image') !== null)
    if (!shouldUseUrlPage && saved && typeof saved.page === 'number' && Number.isFinite(saved.page)) {
      // الإصدارات القديمة كانت تحفظ رقم الصورة؛ نفرّقها هنا حتى لا تضيع الجلسة
      const restored = saved.page > quranPages
        ? Math.trunc(saved.page)
        : imagePageFromNumber(mushaf, saved.page)
      setPage(restored)
    }
    firstLoad.current = false

    try {
      const raw = window.localStorage.getItem(`qurancomplex:bookmark:${mushaf.id}`)
      const savedBookmark = raw === null ? NaN : Number(raw)
      setBookmark(Number.isFinite(savedBookmark) && savedBookmark > 0 ? Math.trunc(savedBookmark) : null)
    } catch {
      setBookmark(null)
    }
  }, [mushaf.id, quranPages])

  /* حفظ الجلسة ومزامنة الرابط */
  useEffect(() => {
    try {
      window.localStorage.setItem(
        `qurancomplex:session:${mushaf.id}`,
        JSON.stringify({ page: pageNumber, zoom }),
      )
    } catch {
      /* تجاهل تعطّل التخزين */
    }

    const params = new URLSearchParams(window.location.search)
    params.set('mushaf', mushaf.id)
    params.set('page', String(pageNumber))
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
  }, [mushaf.id, pageNumber, zoom])

  /* تحميل صفحة واحدة فقط + تحميل مسبق للصفحتين المجاورتين */
  useEffect(() => {
    let cancelled = false
    if (!currentSrc) return

    setStatus('loading')

    const image = new Image()
    image.referrerPolicy = 'no-referrer'
    image.onload = () => {
      if (!cancelled) setStatus('loaded')
    }
    image.onerror = () => {
      if (!cancelled) setStatus('error')
    }
    image.src = currentSrc

    for (const neighbor of [page + 1, page - 1]) {
      const url = data.pages[neighbor - 1]
      if (!url) continue
      const preload = new Image()
      preload.referrerPolicy = 'no-referrer'
      preload.src = url
    }

    return () => {
      cancelled = true
    }
  }, [currentSrc, page, data.pages, retryCount])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  /* في ملء الشاشة لا يبقى سوى المصحف، ويُغلق بالضغط على Escape */
  useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.focus = isFullscreen ? 'true' : 'false'
  }, [isFullscreen])

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(new URL('sw.js', document.baseURI).href).catch(() => {
        /* فشل التسجيل لا يوقف القراءة */
      })
    })
  }, [])

  const goTo = useCallback(
    (target: number) => {
      setPage((current) => {
        const next = clampPage(target, totalPages)
        return next === current ? current : next
      })
    },
    [totalPages],
  )

  /** يأخذ رقم صفحة المصحف (كما يراه القارئ) ويحوله إلى رقم الصورة */
  const goToNumber = useCallback(
    (number: number) => goTo(imagePageFromNumber(mushaf, number)),
    [goTo, mushaf],
  )

  const nextPage = useCallback(() => goTo(page + 1), [goTo, page])
  const previousPage = useCallback(() => goTo(page - 1), [goTo, page])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
      else await document.exitFullscreen()
    } catch {
      showToast('تعذّر تفعيل وضع ملء الشاشة على هذا المتصفح')
    }
  }, [showToast])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.isContentEditable)) return

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          nextPage()
          break
        case 'ArrowRight':
          event.preventDefault()
          previousPage()
          break
        case 'Home':
          goTo(1)
          break
        case 'End':
          goTo(totalPages)
          break
        case '+':
        case '=':
          setZoom((current) => zoomStep(current, 1))
          break
        case '-':
          setZoom((current) => zoomStep(current, -1))
          break
        case 'f':
        case 'F':
          void toggleFullscreen()
          break
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [nextPage, previousPage, goTo, totalPages, toggleFullscreen])

  function handleMushafChange(id: string) {
    setMushafId(id)
    setDrawerOpen(false)
    showToast(`تم فتح ${getMushaf(id).shortName}`)
  }

  function toggleBookmark() {
    const value = bookmark === page ? null : page
    setBookmark(value)
    try {
      const key = `qurancomplex:bookmark:${mushaf.id}`
      if (value === null) window.localStorage.removeItem(key)
      else window.localStorage.setItem(key, String(value))
    } catch {
      /* تجاهل */
    }
    showToast(value === null ? 'تمت إزالة علامة القراءة' : `تم حفظ الصفحة ${label} كعلامة قراءة`)
  }

  async function cacheCurrentPage() {
    if (!('serviceWorker' in navigator)) {
      showToast('هذا المتصفح لا يدعم الحفظ دون اتصال')
      return
    }
    try {
      const registration = await navigator.serviceWorker.ready
      const worker = registration.active
      if (!worker) throw new Error('no worker')
      worker.postMessage({ type: 'CACHE_PAGE', url: currentSrc })
      showToast('جارٍ حفظ الصفحة للقراءة دون اتصال…')
    } catch {
      showToast('تعذّر حفظ الصفحة حالياً')
    }
  }

  return (
    <div className="app-shell">
      <Toolbar
        mushaf={mushaf}
        mushafs={mushafs}
        page={page}
        pageLabel={label}
        theme={theme}
        onMushafChange={handleMushafChange}
        onOpenIndex={() => setDrawerOpen(true)}
        onThemeChange={setTheme}
        onToggleFullscreen={() => void toggleFullscreen()}
      />

      <PageViewer
        src={displaySrc}
        alt={`${mushaf.name} — الصفحة ${label}`}
        page={page}
        pageLabel={label}
        status={dataReady ? status : 'loading'}
        zoom={zoom}
        onRetry={() => setRetryCount((count) => count + 1)}
        onNext={nextPage}
        onPrevious={previousPage}
      />

      <BottomBar
        page={page}
        pageNumber={pageNumber}
        pageLabel={label}
        totalPages={quranPages}
        zoom={zoom}
        bookmark={bookmark}
        onPrevious={previousPage}
        onNext={nextPage}
        onPageChange={goToNumber}
        onZoomIn={() => setZoom((current) => zoomStep(current, 1))}
        onZoomOut={() => setZoom((current) => zoomStep(current, -1))}
        onToggleBookmark={toggleBookmark}
        onGoToBookmark={() => {
          if (bookmark !== null) goTo(bookmark)
        }}
        onCachePage={() => void cacheCurrentPage()}
      />

      <PageIndexDrawer
        open={drawerOpen}
        index={data.index}
        currentPage={pageNumber}
        quranPages={quranPages}
        onClose={() => setDrawerOpen(false)}
        onSelect={goToNumber}
      />

      <div className={toast ? 'toast is-visible' : 'toast'} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  )
}
