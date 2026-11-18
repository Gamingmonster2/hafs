import { useEffect, useRef, useState } from 'react'
import type { Mushaf, Theme } from '../types'

interface ToolbarProps {
  mushaf: Mushaf
  mushafs: Mushaf[]
  page: number
  pageLabel: string
  theme: Theme
  clarity: boolean
  onMushafChange: (id: string) => void
  onOpenIndex: () => void
  onThemeChange: (theme: Theme) => void
  onClarityChange: (value: boolean) => void
  onToggleFullscreen: () => void
}

const REPO_URL = 'https://github.com/Gamingmonster2/hafs'
/** الواجهة الأمامية على النطاق الرئيسي: يسمح للقارئ باختيار رواية أخرى */
const HOME_URL = 'https://qurancomplex.ly/'

const themes: { id: Theme; label: string }[] = [
  { id: 'light', label: '☀️ فاتح' },
  { id: 'sepia', label: '📖 ورقي' },
  { id: 'dark', label: '🌙 ليلي' },
]

export function Toolbar({
  mushaf,
  mushafs,
  page,
  pageLabel,
  theme,
  clarity,
  onMushafChange,
  onOpenIndex,
  onThemeChange,
  onClarityChange,
  onToggleFullscreen,
}: ToolbarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <div className="brand-mark" aria-hidden="true">ق</div>
        <div className="brand-text">
          <strong>{mushaf.shortName}</strong>
          <span>Quran Complex</span>
        </div>
      </div>

      <div className="toolbar__center">
        <label className="mushaf-select">
          <span className="sr-only">اختر المصحف</span>
          <select
            value={mushaf.id}
            onChange={(event) => onMushafChange(event.target.value)}
            aria-label="اختر المصحف"
          >
            {mushafs.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <span className="page-chip" title={`الصورة رقم ${page} في الملف`}>{pageLabel}</span>
      </div>

      <nav className="toolbar__actions" aria-label="أدوات القارئ">
        <a className="tool-btn home-btn" href={HOME_URL} title="العودة للواجهة الرئيسية" aria-label="العودة للواجهة الرئيسية">
          <b aria-hidden="true">⌂</b><span>الرئيسية</span>
        </a>
        <button type="button" className="icon-btn" onClick={onOpenIndex} title="فهرس الصفحات" aria-label="فهرس الصفحات">
          ☰
        </button>
        <div className="settings-wrap" ref={settingsRef}>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSettingsOpen((open) => !open)}
            title="المظهر والإعدادات"
            aria-label="المظهر والإعدادات"
            aria-expanded={settingsOpen}
          >
            ⚙
          </button>
          {settingsOpen && (
            <div className="settings-popover">
              <p className="settings-popover__title">المظهر</p>
              <div className="theme-options">
                {themes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={theme === item.id ? 'theme-option is-active' : 'theme-option'}
                    onClick={() => {
                      onThemeChange(item.id)
                      setSettingsOpen(false)
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="settings-popover__title settings-popover__title--spaced">قراءة أوضح</p>
              <button
                type="button"
                className={clarity ? 'clarity-toggle is-active' : 'clarity-toggle'}
                onClick={() => onClarityChange(!clarity)}
                aria-pressed={clarity}
              >
                <span>وضوح الصورة</span>
                <b aria-hidden="true">{clarity ? '◉' : '○'}</b>
                <span className="clarity-toggle__state">{clarity ? 'مفعّل' : 'متوقف'}</span>
              </button>
              {mushaf.sourcePdf && (
                <a className="pdf-link" href={mushaf.sourcePdf} target="_blank" rel="noreferrer">
                  تحميل نسخة PDF ↗
                </a>
              )}
              <a className="repo-link" href={REPO_URL} target="_blank" rel="noreferrer">
                <span>＜/＞</span>
                مستودع المشروع على GitHub
              </a>
              <p className="settings-popover__hint">تُحفظ إعداداتك تلقائياً على هذا الجهاز.</p>
            </div>
          )}
        </div>
        <button type="button" className="icon-btn" onClick={onToggleFullscreen} title="ملء الشاشة" aria-label="ملء الشاشة">
          ⛶
        </button>
      </nav>
    </header>
  )
}
