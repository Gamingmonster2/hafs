/**
 * صوت تقليب الصفحة من الملف المرفق في public/audio/page-turn.mp3.
 * يُشغَّل ثانية واحدة فقط، بمستوى صوت منخفض، مع تلاشٍ في البداية والنهاية،
 * ويُحمَّل محلياً ضمن التطبيق لذلك يعمل دون اتصال بعد الزيارة الأولى.
 */

const MAX_DURATION = 1
const VOLUME = 0.22

let context: AudioContext | null = null
let audioData: ArrayBuffer | null = null
let dataRequest: Promise<ArrayBuffer | null> | null = null
let decoded: AudioBuffer | null = null

function audioUrl(): string {
  return new URL('audio/page-turn.mp3', document.baseURI).href
}

function loadAudioData(): Promise<ArrayBuffer | null> {
  if (audioData) return Promise.resolve(audioData)
  if (!dataRequest) {
    dataRequest = fetch(audioUrl())
      .then((response) => (response.ok ? response.arrayBuffer() : null))
      .then((buffer) => {
        audioData = buffer
        return buffer
      })
      .catch(() => null)
  }
  return dataRequest
}

/** تحميل مبكر للملف دون تشغيل أي صوت، حتى تكون أول قلبة سريعة */
export function preloadPageTurnSound(): void {
  void loadAudioData()
}

async function getContext(): Promise<AudioContext | null> {
  if (typeof window === 'undefined') return null
  const AudioCtor =
    window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtor) return null
  if (!context) context = new AudioCtor()
  if (context.state === 'suspended') await context.resume().catch(() => undefined)
  return context
}

async function getDecoded(ctx: AudioContext): Promise<AudioBuffer | null> {
  if (decoded) return decoded
  const data = await loadAudioData()
  if (!data) return null
  try {
    decoded = await ctx.decodeAudioData(data.slice(0))
    return decoded
  } catch {
    return null
  }
}

/** مسار احتياطي إذا تعذّر فكّ MP3 عبر Web Audio */
function playFallback(): void {
  const audio = new Audio(audioUrl())
  audio.volume = VOLUME
  void audio.play().then(() => window.setTimeout(() => audio.pause(), MAX_DURATION * 1000)).catch(() => undefined)
}

/** صوت قلب صفحة واحدة؛ آمن إذا كان الصوت غير متاح أو المتصفح يمنعه */
export async function playPageTurnSound(): Promise<void> {
  const ctx = await getContext()
  if (!ctx) {
    playFallback()
    return
  }
  const buffer = await getDecoded(ctx)
  if (!buffer) {
    playFallback()
    return
  }

  const duration = Math.min(MAX_DURATION, buffer.duration)
  const now = ctx.currentTime
  const source = ctx.createBufferSource()
  source.buffer = buffer

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.linearRampToValueAtTime(VOLUME, now + 0.015)
  gain.gain.setValueAtTime(VOLUME, now + Math.max(0.02, duration - 0.08))
  gain.gain.linearRampToValueAtTime(0.0001, now + duration)

  source.connect(gain).connect(ctx.destination)
  source.start(now, 0, duration)
  source.stop(now + duration + 0.02)
}
