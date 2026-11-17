import { useEffect, useMemo, useRef, useState } from 'react'
import type { MushafIndex } from '../types'

interface PageIndexDrawerProps {
  open: boolean
  index?: MushafIndex
  /** رقم صفحة المصحف الحالي (بدون الأغلفة) */
  currentPage: number
  quranPages: number
  onClose: () => void
  /** يستقبل رقم صفحة المصحف */
  onSelect: (page: number) => void
}

type Tab = 'surah' | 'juz'

export function PageIndexDrawer({
  open,
  index,
  currentPage,
  quranPages,
  onClose,
  onSelect,
}: PageIndexDrawerProps) {
  const [tab, setTab] = useState<Tab>('surah')
  const [number, setNumber] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setNumber('')
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

  const currentSurah = useMemo(
    () => index?.surahs.find((surah) => currentPage >= surah.page && currentPage <= surah.endPage),
    [index, currentPage],
  )
  const currentJuz = useMemo(() => {
    if (!index) return undefined
    return [...index.juz].reverse().find((juz) => currentPage >= juz.page)
  }, [index, currentPage])

  const jump = Number(number)
  const canJump = Number.isFinite(jump) && jump >= 1 && jump <= quranPages

  return (
    <div className={open ? 'drawer-root is-open' : 'drawer-root'} aria-hidden={!open}>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="فهرس المصحف">
        <div className="drawer__header">
          <h2>فهرس المصحف</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="إغلاق الفهرس">✕</button>
        </div>

        <form
          className="drawer__search"
          onSubmit={(event) => {
            event.preventDefault()
            if (!canJump) return
            onSelect(Math.trunc(jump))
            onClose()
          }}
        >
          <input
            ref={inputRef}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="رقم الصفحة للبحث السريع…"
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            aria-label="رقم الصفحة للبحث السريع"
          />
          <button type="submit" className="mini-btn" disabled={!canJump}>اذهب</button>
        </form>

        {!index ? (
          <p className="drawer__empty">لا يوجد فهرس لهذا المصحف بعد.</p>
        ) : (
          <>
            <div className="drawer__tabs" role="tablist" aria-label="نوع الفهرس">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'surah'}
                className={tab === 'surah' ? 'is-active' : ''}
                onClick={() => setTab('surah')}
              >
                السور
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'juz'}
                className={tab === 'juz' ? 'is-active' : ''}
                onClick={() => setTab('juz')}
              >
                الأجزاء
              </button>
            </div>

            <div className="drawer__list">
              {tab === 'surah' &&
                index.surahs.map((surah) => (
                  <button
                    key={surah.number}
                    type="button"
                    className={`index-row ${currentSurah?.number === surah.number ? 'is-current' : ''}`}
                    onClick={() => {
                      onSelect(surah.page)
                      onClose()
                    }}
                  >
                    <span className="index-row__num">{surah.number}</span>
                    <span className="index-row__name">{surah.name}</span>
                    <span className="index-row__page">ص {surah.page}</span>
                  </button>
                ))}

              {tab === 'juz' &&
                index.juz.map((juz) => (
                  <button
                    key={juz.number}
                    type="button"
                    className={`index-row ${currentJuz?.number === juz.number ? 'is-current' : ''}`}
                    onClick={() => {
                      onSelect(juz.page)
                      onClose()
                    }}
                  >
                    <span className="index-row__num">{juz.number}</span>
                    <span className="index-row__name">الجزء {juz.number}</span>
                    <span className="index-row__page">ص {juz.page}</span>
                  </button>
                ))}
            </div>

            {index.source && <p className="drawer__source">المصدر: {index.source}</p>}
          </>
        )}
      </aside>
    </div>
  )
}
