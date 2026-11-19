"""استيراد مصاحف pdfquran.com كصور WebP محلية.

المصاحف الثلاثة (standard1، standard2، big) توفّر صورة جاهزة لكل صفحة على
https://www.pdfquran.com/quran-pages/<slug>/<page>.jpg
نُنزّلها مرة واحدة ونحوّلها إلى WebP داخل public/images/، ثم نولّد ملفات
الروابط والفهرس التي يقرأها القارئ. الترقيم: صورة 1 = صفحة المصحف 1.

الاستخدام: python scripts/import-pdfquran.py
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path
import json
import time
import urllib.request

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / 'src' / 'data'
IMAGES_DIR = ROOT / 'public' / 'images'
SLUGS = {
    'standard1': 'standard1',
    'standard2': 'standard2',
    'big': 'big-quran',
}
PAGES = 604
QUALITY = 84
WORKERS = 12
HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; QuranComplexImporter/1.0)'}


def fetch(url: str) -> bytes:
    last = None
    for attempt in range(4):
        try:
            request = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(request, timeout=45) as response:
                return response.read()
        except Exception as error:  # noqa: BLE001 - نعيد المحاومة عند أي فشل شبكي
            last = error
            time.sleep(0.6 * (attempt + 1))
    raise RuntimeError(f'فشل تنزيل {url}: {last}')


def import_page(mushaf: str, slug: str, page: int) -> tuple[str, int]:
    target = IMAGES_DIR / mushaf / f'{page:04d}.webp'
    if target.exists() and target.stat().st_size > 1000:
        return str(target), target.stat().st_size

    source = f'https://www.pdfquran.com/quran-pages/{slug}/{page}.jpg'
    image = Image.open(BytesIO(fetch(source))).convert('RGB')
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target, format='WEBP', quality=QUALITY, method=6)
    return str(target), target.stat().st_size


def main() -> None:
    base_index = json.loads((DATA_DIR / 'hafs-index.json').read_text(encoding='utf-8'))
    grand_total = 0

    for mushaf, slug in SLUGS.items():
        started = time.time()
        sizes: dict[int, int] = {}
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            futures = {
                pool.submit(import_page, mushaf, slug, page): page
                for page in range(1, PAGES + 1)
            }
            for done, future in enumerate(as_completed(futures), start=1):
                page = futures[future]
                _, size = future.result()
                sizes[page] = size
                if done % 100 == 0:
                    print(f'{mushaf}: {done}/{PAGES}', flush=True)

        urls = [f'/images/{mushaf}/{page:04d}.webp' for page in range(1, PAGES + 1)]
        (DATA_DIR / f'{mushaf}-pages.json').write_text(
            json.dumps(urls, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
        )
        index = dict(base_index)
        index['source'] = 'pdfquran.com — ترقيم مصحف المدينة النبوية (604 صفحة)'
        index['sourceUrl'] = f'https://www.pdfquran.com/{slug}/chapters/'
        (DATA_DIR / f'{mushaf}-index.json').write_text(
            json.dumps(index, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
        )

        total = sum(sizes.values())
        grand_total += total
        print(f'{mushaf}: {PAGES} pages, {total / 1024 / 1024:.1f} MB, {time.time() - started:.0f}s', flush=True)

    print(f'total: {grand_total / 1024 / 1024:.1f} MB', flush=True)


if __name__ == '__main__':
    main()
