import { useEffect, useMemo, useRef, useState } from 'react'

interface PageIndexDrawerProps {
  open: boolean
  totalPages: number
  /** عدد الصور التمهيدية (الأغلفة) */
  coverPages: number
  /** عدد صفحات القرآن الفعلية */
  quranPages: number
  currentPage: number
  onClose: () => void
  /** يستقبل رقم الصورة داخل الملف */
  onSelect: (page: number) => void
}

interface Entry {
  image: number
  label: string
  group: 'cover' | 'quran' | 'index'
}

export function PageIndexDrawer({
  open,
  totalPages,
  coverPages,
  quranPages,
  currentPage,
  onClose,
  onSelect,
}: PageIndexDrawerProps) {
  const [filter, setFilter] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setFilter('')
      window.setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [open])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const entries = useMemo<Entry[]>(() => {
    const result: Entry[] = []
    for (let page = 1; page <= coverPages; page += 1) {
      result.push({ image: page, label: `غلاف ${page}`, group: 'cover' })
    }
    for (let page = coverPages + 1; page <= coverPages + quranPages && page <= totalPages; page += 1) {
      result.push({ image: page, label: String(page - coverPages), group: 'quran' })
    }
    for (let page = coverPages + quranPages + 1; page <= totalPages; page += 1) {
      result.push({ image: page, label: `فهرس ${page - coverPages - quranPages}`, group: 'index' })
    }
    return result
  }, [coverPages, quranPages, totalPages])

  const visible = useMemo(() => {
    const trimmed = filter.trim()
    if (!trimmed) return entries
    return entries.filter((entry) => entry.label.includes(trimmed) || String(entry.image).includes(trimmed))
  }, [entries, filter])

  const groups: { id: Entry['group']; title: string }[] = [
    { id: 'cover', title: 'الأغلفة' },
    { id: 'quran', title: 'صفحات المصحف' },
    { id: 'index', title: 'الفهرس في نهاية المصحف' },
  ]

  return (
    <div className={open ? 'drawer-root is-open' : 'drawer-root'} aria-hidden={!open}>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="فهرس المصحف">
        <div className="drawer__header">
          <h2>فهرس المصحف</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="إغلاق الفهرس">✕</button>
        </div>

        <div className="drawer__search">
          <input
            ref={inputRef}
            inputMode="numeric"
            placeholder="ابحث برقم الصفحة…"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="ابحث برقم الصفحة"
          />
        </div>

        <div className="drawer__grid">
          {groups.map((group) => {
            const items = visible.filter((entry) => entry.group === group.id)
            if (items.length === 0) return null
            return (
              <section key={group.id} className="drawer__section">
                <h3>{group.title}</h3>
                <div className="drawer__cells">
                  {items.map((entry) => (
                    <button
                      key={entry.image}
                      type="button"
                      title={`الصورة ${entry.image}`}
                      className={entry.image === currentPage ? 'page-cell is-current' : 'page-cell'}
                      onClick={() => onSelect(entry.image)}
                      aria-current={entry.image === currentPage ? 'page' : undefined}
                    >
                      {entry.label}
                    </button>
                  ))}
                </div>
              </section>
            )
          })}
          {visible.length === 0 && <p className="drawer__empty">لا توجد صفحة مطابقة.</p>}
        </div>
      </aside>
    </div>
  )
}
