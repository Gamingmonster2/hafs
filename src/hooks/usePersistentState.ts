import { useEffect, useState } from 'react'

/** حالة تُحفظ تلقائياً في localStorage مع حماية من تعطّل التخزين أو بيانات تالفة. */
export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw === null ? initialValue : (JSON.parse(raw) as T)
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* التخزين قد يكون معطلاً في وضع التصفح الخاص */
    }
  }, [key, value])

  return [value, setValue] as const
}
