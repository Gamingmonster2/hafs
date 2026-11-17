/**
 * استيراد مصحف جديد من مستودع قديم يحتوي على ملف HTML فيه روابط الصور.
 * الاستخدام:
 *   node scripts/import-from-repo.mjs --repo=Gamingmonster2/hafs --id=hafs --name="مصحف المدينة — حفص عن عاصم" --riwayah="حفص عن عاصم"
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = 'true'] = arg.replace(/^--/, '').split('=')
    return [key, value]
  }),
)

const repo = args.repo
if (!repo) {
  console.error('يلزم تمرير --repo=owner/name')
  process.exit(1)
}

const id = args.id ?? repo.split('/').pop()
const name = args.name ?? id
const riwayah = args.riwayah ?? name
const accent = args.accent ?? '#0f4c3a'
const tmp = mkdtempSync(join(tmpdir(), 'qc-mushaf-'))

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

try {
  console.log(`جارٍ استنساخ ${repo} …`)
  execFileSync('git', ['clone', '--depth', '1', `https://github.com/${repo}.git`, tmp], { stdio: 'inherit' })

  const files = walk(tmp).filter((file) => /\.(html|js|jsx|ts|tsx|json)$/i.test(file))
  const imagePattern = /https?:\/\/[^\s"'()<>]+?\.(?:jpe?g|png|webp)(?:\?[^\s"'<>]*)?/gi
  const found = new Set()

  // أولاً: قراءة مصفوفة الروابط الأساسية إن وُجدت (تتجنب روابط og:image/preload المكررة)
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const arrayMatch of text.matchAll(/(?:const|let|var)\s+\w*[Ii]mages?\w*\s*=\s*\[([\s\S]*?)\];/g)) {
      for (const urlMatch of arrayMatch[1].matchAll(imagePattern)) found.add(urlMatch[0])
    }
  }

  // ثانياً: fallback إلى أي روابط صور في الملفات
  if (found.size === 0) {
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      for (const match of text.matchAll(imagePattern)) found.add(match[0])
    }
  }

  // ترتيب حسب رقم الملف إن وُجد (001، 002 …) لضمان تطابق الفهرس
  const pages = [...found].sort((a, b) => {
    const numA = a.match(/[-_](\d{3,4})\.(?:jpe?g|png|webp)/i)?.[1]
    const numB = b.match(/[-_](\d{3,4})\.(?:jpe?g|png|webp)/i)?.[1]
    if (numA && numB) return Number(numA) - Number(numB)
    return 0
  })

  if (pages.length === 0) {
    throw new Error('لم يتم العثور على روابط صور في هذا المستودع.')
  }

  const out = join(root, 'src', 'data', `${id}-pages.json`)
  writeFileSync(out, JSON.stringify(pages, null, 2), 'utf8')
  const varName = id.replace(/[^a-zA-Z0-9_$]/g, '').replace(/^[0-9]/, '_$&')

  console.log(`\nتم استخراج ${pages.length} رابط → ${out}`)
  console.log('\nأضف هذا الكائن إلى مصفوفة mushafs في src/data/mushafs.ts:')
  console.log(`import ${varName}Pages from './${id}-pages.json'
{
  id: '${id}',
  name: '${name}',
  shortName: '${name}',
  riwayah: '${riwayah}',
  pages: ${varName}Pages,
  accent: '${accent}',
},`)
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
