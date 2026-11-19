/**
 * فحص صور المصاحف: يتحقق من أن كل رابط يعيد صورة صالحة، ويقيس زمن الاستجابة.
 * الاستخدام:
 *   npm run check:mushaf
 *   npm run check:mushaf -- --id=hafs
 *   npm run check:mushaf -- --limit=20 --concurrency=6 --no-fail
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const dataDir = join(root, 'src', 'data')
const reportsDir = join(root, 'reports')

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = 'true'] = arg.replace(/^--/, '').split('=')
    return [key, value]
  }),
)

const onlyId = args.id ?? null
const limit = Number(args.limit) || 0
const concurrency = Math.max(1, Math.min(Number(args.concurrency) || 8, 40))
const timeoutMs = Number(args.timeout) || 15000
const slowMs = Number(args.slow) || 3500
const failOnBroken = args.fail !== 'false' && args['no-fail'] !== 'true'

function loadMushafFiles() {
  return readdirSync(dataDir)
    .filter((name) => name.endsWith('-pages.json'))
    .filter((name) => !onlyId || name === `${onlyId}-pages.json`)
    .map((name) => ({
      id: name.replace(/-pages\.json$/, ''),
      pages: JSON.parse(readFileSync(join(dataDir, name), 'utf8')),
    }))
}

async function inspect(url) {
  const started = performance.now()
  // الصور المحلية في public/images/ تُفحص من القرص مباشرة، بلا طلب HTTP
  if (url.startsWith('/images/')) {
    try {
      const file = join(root, 'public', url)
      const bytes = statSync(file).size
      return {
        url, ok: bytes > 1000, status: 200, ms: Math.round(performance.now() - started),
        slow: false, contentType: 'image/webp', bytes,
        error: bytes > 1000 ? null : 'file too small',
      }
    } catch (error) {
      return {
        url, ok: false, status: 0, ms: Math.round(performance.now() - started),
        slow: false, contentType: '', bytes: 0,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
  try {
    let response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(timeoutMs) })
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        signal: AbortSignal.timeout(timeoutMs),
      })
    }
    const ms = Math.round(performance.now() - started)
    const contentType = response.headers.get('content-type') ?? ''
    const bytes = Number(response.headers.get('content-length') ?? 0)
    const ok = response.ok && (contentType.startsWith('image/') || contentType === '')
    return {
      url,
      ok,
      status: response.status,
      ms,
      slow: ms > slowMs,
      contentType,
      bytes,
      error: ok ? null : `status=${response.status} type=${contentType || 'unknown'}`,
    }
  } catch (error) {
    return {
      url,
      ok: false,
      status: 0,
      ms: Math.round(performance.now() - started),
      slow: false,
      contentType: '',
      bytes: 0,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function runPool(items, worker) {
  const results = new Array(items.length)
  let cursor = 0
  async function next() {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await worker(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next))
  return results
}

async function main() {
  const files = loadMushafFiles()
  if (files.length === 0) {
    console.error('لم يتم العثور على ملفات روابط مطابقة في src/data/')
    process.exitCode = 1
    return
  }

  mkdirSync(reportsDir, { recursive: true })
  let anyBroken = false

  for (const file of files) {
    const urls = limit > 0 ? file.pages.slice(0, limit) : file.pages
    console.log(`\nفحص ${file.id}: ${urls.length} صفحة (تزامن: ${concurrency})`)
    const results = await runPool(urls, inspect)

    const broken = results.filter((item) => !item.ok)
    const slow = results.filter((item) => item.ok && item.slow)
    const avg = Math.round(results.reduce((sum, item) => sum + item.ms, 0) / Math.max(results.length, 1))
    anyBroken ||= broken.length > 0

    const report = {
      id: file.id,
      checkedAt: new Date().toISOString(),
      total: urls.length,
      ok: urls.length - broken.length,
      broken: broken.length,
      slow: slow.length,
      averageMs: avg,
      items: results,
    }
    const outPath = join(reportsDir, `${file.id}-health.json`)
    writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8')

    console.log(`  سليم: ${report.ok} | مكسور: ${report.broken} | بطيء: ${report.slow} | المتوسط: ${avg}ms`)
    if (broken.length) {
      console.log('  أمثلة على الروابط المكسورة:')
      broken.slice(0, 5).forEach((item) => console.log(`   - ${item.error} :: ${item.url}`))
    }
    console.log(`  التقرير: ${outPath}`)
  }

  if (anyBroken && failOnBroken) process.exitCode = 1
}

await main()
