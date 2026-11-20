"""تنزيل صور أغلفة مصغّرة لكل الإصدارات داخل public/images/covers/.

- إصدارات pdfquran.com (النسخ العربية والترجمات): من /images/covers/<slug>.webp
- روايات مصحف المدينة: نأخذ أول صفحة قرآن من ملف الروابط الموجود ونصغّرها محلياً.

الاستخدام: python scripts/import-covers.py
"""

from io import BytesIO
from pathlib import Path
import json
import time
import urllib.request

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / 'src' / 'data'
OUT_DIR = ROOT / 'public' / 'images' / 'covers'
HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; QuranComplexImporter/1.0)'}
SIZE = (180, 260)

RIWAYAHS = ['hafs', 'qaloon', 'warsh', 'shubah', 'susi', 'douri']
PDFQURAN_EDITIONS = ['standard1', 'standard2', 'big', 'anko', 'chinese', 'english',
                     'french', 'hausa', 'indonesian', 'portuguese', 'tamil',
                     'telugu', 'turkish', 'urdu', 'vietnami']


def fetch(url: str) -> bytes:
    last = None
    for attempt in range(4):
        try:
            request = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read()
        except Exception as error:  # noqa: BLE001 - network retry
            last = error
            time.sleep(0.8 * (attempt + 1))
    raise RuntimeError(f'فشل تنزيل {url}: {last}')


def save_thumb(data: bytes, target: Path) -> int:
    image = Image.open(BytesIO(data)).convert('RGB')
    contained = ImageOps.contain(image, SIZE, method=Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', SIZE, 'white')
    canvas.paste(contained, ((SIZE[0] - contained.width) // 2, (SIZE[1] - contained.height) // 2))
    canvas.save(target, format='WEBP', quality=82, method=6)
    return target.stat().st_size


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    total = 0

    for mushaf in PDFQURAN_EDITIONS:
        url = f'https://www.pdfquran.com/images/covers/{mushaf}.webp'
        target = OUT_DIR / f'{mushaf}.webp'
        size = save_thumb(fetch(url), target)
        total += size
        print(f'{mushaf}: {size / 1024:.1f} KB', flush=True)

    for mushaf in RIWAYAHS:
        pages = json.loads((DATA_DIR / f'{mushaf}-pages.json').read_text(encoding='utf-8'))
        url = pages[3]  # الصور 1-3 أغلفة، والصورة 4 = صفحة المصحف الأولى
        target = OUT_DIR / f'{mushaf}.webp'
        size = save_thumb(fetch(url), target)
        total += size
        print(f'{mushaf}: {size / 1024:.1f} KB', flush=True)

    print(f'total: {total / 1024:.1f} KB', flush=True)


if __name__ == '__main__':
    main()
