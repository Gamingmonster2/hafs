/**
 * صوت تقليب ورقة مولّد داخل المتصفح بـ Web Audio:
 * ضجيج ناعم مُرشَّح بنطاقي تردد مع تلاشٍ سريع، بلا ملفات صوت أو اتصال إضافي.
 * يُشغَّل فقط بعد تفاعل المستخدم، لذلك لا يخالف قواعد التشغيل التلقائي.
 */

let context: AudioContext | null = null
let noise: AudioBuffer | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioCtor =
    window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtor) return null
  if (!context) context = new AudioCtor()
  if (context.state === 'suspended') void context.resume().catch(() => undefined)
  return context
}

function getNoise(ctx: AudioContext): AudioBuffer {
  if (noise) return noise
  const length = Math.floor(ctx.sampleRate * 0.5)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let index = 0; index < length; index += 1) {
    const white = Math.random() * 2 - 1
    // ضجيج بني خفيف: أقرب إلى حفيف الورق من الضجيج الأبيض الحاد
    last = (last + 0.035 * white) / 1.035
    data[index] = last * 3.2
  }
  noise = buffer
  return buffer
}

function rustle(
  ctx: AudioContext,
  start: number,
  duration: number,
  peak: number,
  from: number,
  to: number,
  rate: number,
) {
  const source = ctx.createBufferSource()
  source.buffer = getNoise(ctx)
  source.playbackRate.value = rate

  const highpass = ctx.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = 420

  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.Q.value = 0.65
  bandpass.frequency.setValueAtTime(from, start)
  bandpass.frequency.exponentialRampToValueAtTime(to, start + duration)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.04, duration / 3))
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  source.connect(highpass).connect(bandpass).connect(gain).connect(ctx.destination)
  source.start(start)
  source.stop(start + duration + 0.02)
}

/** صوت قلب صفحة واحدة؛ آمن إذا كان Web Audio غير مدعوم */
export function playPageTurnSound(): void {
  const ctx = getContext()
  if (!ctx) return
  const now = ctx.currentTime + 0.005
  // طبقتان: حفيف الورقة ثم صوت استقرارها، مع اختلاف بسيط كل مرة لتجنّب التكرار الآلي
  rustle(ctx, now, 0.3, 0.13, 2100 + Math.random() * 300, 900, 0.92 + Math.random() * 0.12)
  rustle(ctx, now + 0.055, 0.2, 0.07, 1200, 620, 0.8 + Math.random() * 0.1)
}
