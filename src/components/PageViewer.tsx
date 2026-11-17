import { useRef } from 'react'
import type { TouchEvent } from 'react'
import type { ImageStatus } from '../types'

interface PageViewerProps {
  src: string
  alt: string
  page: number
  pageLabel: string
  status: ImageStatus
  zoom: number
  onRetry: () => void
  onNext: () => void
  onPrevious: () => void
}

export function PageViewer({ src, alt, page, pageLabel, status, zoom, onRetry, onNext, onPrevious }: PageViewerProps) {
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  function handleTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  function handleTouchEnd(event: TouchEvent) {
    const start = touchStart.current
    const touch = event.changedTouches[0]
    touchStart.current = null
    if (!start || !touch) return

    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.4) return

    if (dx < 0) onNext()
    else onPrevious()
  }

  const width = `${zoom}%`

  return (
    <main
      className="viewer"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label={`صفحة المصحف رقم ${pageLabel}`}
    >
      <div className="page-frame" style={{ width, maxWidth: zoom <= 100 ? `${850 * (zoom / 100)}px` : 'none' }}>
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
    </main>
  )
}
