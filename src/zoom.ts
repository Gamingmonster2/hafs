/** حدود ومستويات التكبير المريحة: خطوات صغيرة قرب 100% حتى لا تفاجئ القارئ */
export const ZOOM_MIN = 75
export const ZOOM_MAX = 200

export const ZOOM_STEPS = [75, 85, 100, 110, 115, 125, 140, 160, 180, 200]

export function clampZoom(value: number): number {
  if (!Number.isFinite(value)) return 100
  return Math.min(Math.max(Math.trunc(value), ZOOM_MIN), ZOOM_MAX)
}

export function zoomStep(current: number, direction: 1 | -1): number {
  const safe = clampZoom(current)
  if (direction === 1) return ZOOM_STEPS.find((step) => step > safe) ?? ZOOM_MAX
  return [...ZOOM_STEPS].reverse().find((step) => step < safe) ?? ZOOM_MIN
}
