import { useRef } from 'react'
import type { CSSProperties, TouchEvent } from 'react'
import type { ImageStatus } from '../types'
import { clampZoom } from '../zoom'

interface PageViewerProps {
  src: string
  alt: string
  page: number
  pageLabel: string
  status: ImageStatus
  zoom: number
  fitMode: boolean
  onRetry: () => void
  onNext: () => void
  onPrevious: () => void
  /** يسمح للقرّب بإصبعين بتغيير مستوى التكبير داخل التطبيق */
  onZoomSet: (zoom: number) => void
  /** الضغط على الصفحة يخفي أو يُظهر كل أدوات الواجهة */
  onToggleUi: () => void
}

export function PageViewer({
  src,
  alt,
  page,
  pageLabel,
  status,
  zoom,
  fitMode,
  onRetry,
  onNext,
  onPrevious,
  onZoomSet,
  onToggleUi,
}: PageViewerProps) {
  const viewerRef = useRef<HTMLElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const pinch = useRef<{ distance: number; zoom: number } | null>(null)
  const didSwipe = useRef(false)
  const didPinch = useRef(false)

  function distanceBetween(a: TouchEvent['touches'][number], b: TouchEvent['touches'][number]) {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
  }

  function handleTouchStart(event: TouchEvent) {
    if (event.touches.length >= 2) {
      // بدء القرّب بإصبعين: نثبّت المسافة ومستوى التكبير الابتدائي
      pinch.current = {
        distance: distanceBetween(event.touches[0], event.touches[1]),
        zoom,
      }
      touchStart.current = null // منع قلب الصفحة أثناء القرّب
      didPinch.current = true
      viewerRef.current?.classList.add('is-pinching')
      return
    }
    const touch = event.touches[0]
    if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  function handleTouchMove(event: TouchEvent) {
    if (event.touches.length < 2 || !pinch.current || pinch.current.distance <= 0) return
    const distance = distanceBetween(event.touches[0], event.touches[1])
    const ratio = distance / pinch.current.distance
    const next = Math.round(pinch.current.zoom * ratio)
    onZoomSet(clampZoom(next))
  }

  function handleTouchEnd(event: TouchEvent) {
    if (pinch.current) {
      // إن بقي إصبع واحد بعد رفع الآخر فلا نعتبرها تمرير صفحة
      pinch.current = null
      touchStart.current = null
      if (event.touches.length === 0) viewerRef.current?.classList.remove('is-pinching')
      return
    }

    const start = touchStart.current
    const touch = event.changedTouches[0]
    touchStart.current = null
    if (!start || !touch) return

    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.4) return

    if (dx < 0) onNext()
    else onPrevious()
    didSwipe.current = true
  }

  /** نقرة واحدة على الصفحة تخفي أو تُظهر الأدوات (بعد استبعاد السحب والقرّب) */
  function handlePageClick() {
    if (didSwipe.current) {
      didSwipe.current = false
      return
    }
    if (didPinch.current) {
      didPinch.current = false
      return
    }
    onToggleUi()
  }

  return (
    <main
      ref={viewerRef}
      className="viewer"
      data-fit={fitMode ? 'true' : 'false'}
      style={{ '--zoom-scale': zoom / 100 } as CSSProperties}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      aria-label={`صفحة المصحف رقم ${pageLabel}`}
    >
      <div className="page-frame">
        {status === 'loading' && (
          <div className="page-skeleton" role="status" aria-live="polite">
            <div className="page-skeleton__line" />
            <div className="page-skeleton__line" />
            <div className="page-skeleton__line" />
            <span>جارٍ تحميل الصفحة {pageLabel}…</span>
          </div>
        )}

        {status === 'error' && (
          <div className="page-error" role="alert">
            <span className="page-error__icon">!</span>
            <h2>تعذّر تحميل الصفحة</h2>
            <p>تحقّق من الاتصال بالإنترنت، ثم أعد المحاولة.</p>
            <button type="button" className="primary-btn" onClick={onRetry}>
              إعادة المحاولة
            </button>
          </div>
        )}

        <div className="page-canvas" onClick={handlePageClick}>
          <img
            key={src}
            data-image-index={page}
            className={`page-image ${status === 'loaded' ? 'is-visible' : ''}`}
            src={src}
            alt={alt}
            decoding="async"
            fetchPriority="high"
            referrerPolicy="no-referrer"
            draggable={false}
          />
        </div>
      </div>
    </main>
  )
}
