import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

interface BottomBarProps {
  page: number
  /** رقم الصفحة كما يراها القارئ (بدون أغلفة الفهرس) */
  pageNumber: number
  pageLabel: string
  totalPages: number
  zoom: number
  bookmark: number | null
  onPrevious: () => void
  onNext: () => void
  onPageChange: (page: number) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onToggleBookmark: () => void
  onGoToBookmark: () => void
  onCachePage: () => void
}

export function BottomBar({
  page,
  pageNumber,
  pageLabel,
  totalPages,
  zoom,
  bookmark,
  onPrevious,
  onNext,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onToggleBookmark,
  onGoToBookmark,
  onCachePage,
}: BottomBarProps) {
  const [draft, setDraft] = useState(String(pageNumber))

  useEffect(() => setDraft(String(pageNumber)), [pageNumber])

  function submitPage(event: FormEvent) {
    event.preventDefault()
    const value = Number(draft)
    if (Number.isFinite(value)) {
      onPageChange(value)
    } else {
      setDraft(String(page))
    }
  }

  const isBookmarked = bookmark === page

  return (
    <footer className="bottom-bar">
      <div className="bottom-bar__group">
        <button type="button" className="nav-btn" onClick={onPrevious} aria-label="الصفحة السابقة" title="الصفحة السابقة (→)">
          ›
        </button>
        <form className="page-jump" onSubmit={submitPage}>
          <label className="sr-only" htmlFor="page-jump-input">رقم الصفحة</label>
          <input
            id="page-jump-input"
            inputMode="numeric"
            pattern="[0-9]*"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onFocus={(event) => event.target.select()}
            aria-label="رقم الصفحة"
          />
          <span>/ {totalPages.toLocaleString('ar-EG')}</span>
          <button type="submit" className="mini-btn">اذهب</button>
          <span className="page-jump__label" title="الصورة الحالية في الملف">{pageLabel}</span>
        </form>
        <button type="button" className="nav-btn" onClick={onNext} aria-label="الصفحة التالية" title="الصفحة التالية (←)">
          ‹
        </button>
      </div>

      <div className="bottom-bar__group">
        <button
          type="button"
          className={isBookmarked ? 'tool-btn is-active' : 'tool-btn'}
          onClick={onToggleBookmark}
          title={isBookmarked ? 'إزالة العلامة' : 'حفظ العلامة'}
        >
          {isBookmarked ? '🔖' : '🔖'}
          <span>علامة</span>
        </button>
        <button
          type="button"
          className="tool-btn"
          onClick={onGoToBookmark}
          disabled={bookmark === null}
          title="الانتقال إلى العلامة المحفوظة"
        >
          📖<span>{bookmark ? `ص ${bookmark}` : 'لا علامة'}</span>
        </button>
        <button type="button" className="tool-btn" onClick={onCachePage} title="حفظ هذه الصفحة للقراءة دون اتصال">
          💾<span>أوفلاين</span>
        </button>
      </div>

      <div className="bottom-bar__group zoom-group">
        <button type="button" className="nav-btn" onClick={onZoomOut} aria-label="تصغير" title="تصغير (−)">−</button>
        <span className="zoom-value">{zoom}%</span>
        <button type="button" className="nav-btn" onClick={onZoomIn} aria-label="تكبير" title="تكبير (+)">+</button>
      </div>
    </footer>
  )
}
