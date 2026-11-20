"""استيراد ترجمات pdfquran.com من ملفات PDF إلى صفحات WebP محلية.

تحتوي ملفات الترجمات على صفحات تمهيدية وفهارس، ولا تتطابق صفحاتها مع ترقيم
مصحف المدينة. نستخدم الإشارات المرجعية (PDF bookmarks) لتحديد بداية كل سورة،
ونبني فهرساً خاصاً بالترجمة، ثم نحول صفحات المحتوى فقط إلى WebP.

الاستخدام:
  python scripts/import-translations.py --pdf-dir "C:\\path\\to\\pdfs"
  python scripts/import-translations.py --pdf-dir "..." --only english
"""

from concurrent.futures import ProcessPoolExecutor, as_completed
from datetime import date
from pathlib import Path
import argparse
import json
import os
import time

import numpy as np
import pypdfium2 as pdfium
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / 'src' / 'data'
IMAGES_DIR = ROOT / 'public' / 'images'

SLUGS = [
    'anko', 'chinese', 'english', 'french', 'hausa', 'indonesian',
    'portuguese', 'tamil', 'telugu', 'turkish', 'urdu', 'vietnami',
]
SOURCE_URL = 'https://www.pdfquran.com/download/{slug}/{slug}-quran.pdf'
SCALE = 0.85
QUALITY = 78
CHUNK = 25

# عتبة ظهور الإطار الجانبي المميز لصفحات الترجمة (قبل فهارس نهاية الكتاب)
SIDE_THRESHOLD = 0.075


def read_arabic_index() -> dict:
    return json.loads((DATA_DIR / 'hafs-index.json').read_text(encoding='utf-8'))


def bookmarks(document) -> list[tuple[str, int]]:
    items: list[tuple[str, int]] = []
    for bookmark in document.get_toc():
        title = bookmark.get_title()
        page = bookmark.get_dest().get_index() + 1  # 1-based
        if title:
            items.append((title, page))
    return items[:114]


def side_score(page) -> float:
    """يقيس ظهور العلامات الجانبية أعلى/أسفل صفحات المحتوى في نسخ pdfquran."""
    image = page.render(scale=0.3).to_pil().convert('L').resize((108, 162))
    dark = (255 - np.asarray(image, dtype=float)) / 255
    left = dark[20:140, 8:16].mean()
    right = dark[20:140, 92:100].mean()
    return float((left + right) / 2)


def find_content_end(document, last_surah_page: int) -> int:
    """آخر صفحة محتوى قبل فهارس نهاية الكتاب أو الصفحات الفارغة."""
    limit = min(len(document), last_surah_page + 40)
    low_streak = 0
    for page_number in range(last_surah_page + 1, limit + 1):
        if side_score(document[page_number - 1]) < SIDE_THRESHOLD:
            low_streak += 1
            if low_streak >= 3:
                return page_number - low_streak
        else:
            low_streak = 0
    # انتهى الملف أثناء سلسلة صفحات بلا علامات جانبية: استبعدها كلها
    return limit - low_streak


def build_index(arabic: dict, marks: list[tuple[str, int]], start: int, end: int) -> dict:
    total = end - start + 1
    # حماية من إشارات PDF معكوسة في نهاية بعض الملفات (مثل anko):
    # نحافظ على ترتيب السور الشرعي ونمنع تراجع رقم الصفحة.
    pages = [max(pdf_page - start + 1, 1) for _, pdf_page in marks]
    for position in range(1, len(pages)):
        pages[position] = max(pages[position], pages[position - 1])

    surahs = []
    for position, page in enumerate(pages):
        end_page = pages[position + 1] - 1 if position + 1 < len(pages) else total
        surahs.append({
            'number': position + 1,
            'name': arabic['surahs'][position]['name'],
            'localName': marks[position][0],
            'page': page,
            'endPage': max(end_page, page),
        })

    juz = []
    previous = 1
    for entry in arabic['juz']:
        number = entry['number']
        arabic_page = entry['page']
        arabic_surah = next(
            item for item in arabic['surahs']
            if item['page'] <= arabic_page <= item['endPage']
        )
        translation_surah = surahs[arabic_surah['number'] - 1]
        span = max(translation_surah['endPage'] - translation_surah['page'], 1)
        fraction = (arabic_page - arabic_surah['page']) / max(
            arabic_surah['endPage'] - arabic_surah['page'], 1
        )
        page = translation_surah['page'] + round(fraction * span)
        if number > 1:
            page = max(previous + 1, min(page, total))
        else:
            page = 1
        juz.append({'number': number, 'page': page, 'verse': entry.get('verse')})
        previous = page

    return {
        'source': 'pdfquran.com — ترجمة مصحف المدينة النبوية',
        'sourceUrl': '',
        'generatedAt': date.today().isoformat(),
        'note': 'بدايات السور مأخوذة من إشارات ملف PDF المرجعي. أرقام صفحات الأجزاء تقديرية لأن الترجمة لا تحمل ترقيم المصحف العربي.',
        'juzApproximate': True,
        'surahs': surahs,
        'juz': juz,
    }


def render_chunk(args: tuple[str, int, int, int, str]) -> dict[int, int]:
    pdf_path, first, last, content_start, output_dir = args
    document = pdfium.PdfDocument(pdf_path)
    directory = Path(output_dir)
    sizes: dict[int, int] = {}
    try:
        for pdf_page in range(first, last + 1):
            number = pdf_page - content_start + 1
            target = directory / f'{number:04d}.webp'
            if target.exists() and target.stat().st_size > 1000:
                sizes[number] = target.stat().st_size
                continue
            image = document[pdf_page - 1].render(scale=SCALE).to_pil().convert('RGB')
            image.save(target, format='WEBP', quality=QUALITY, method=6)
            sizes[number] = target.stat().st_size
    finally:
        document.close()
    return sizes


def import_one(slug: str, pdf_dir: Path, arabic: dict, workers: int) -> tuple[int, int]:
    pdf_path = pdf_dir / f'{slug}.pdf'
    if not pdf_path.exists():
        raise FileNotFoundError(pdf_path)

    started = time.time()
    document = pdfium.PdfDocument(str(pdf_path))
    marks = bookmarks(document)
    if len(marks) != 114:
        raise RuntimeError(f'{slug}: expected 114 bookmarks, got {len(marks)}')
    start = min(page for _, page in marks)
    end = find_content_end(document, max(page for _, page in marks))
    total = end - start + 1
    document.close()

    index = build_index(arabic, marks, start, end)
    index['sourceUrl'] = SOURCE_URL.format(slug=slug)

    output_dir = IMAGES_DIR / slug
    output_dir.mkdir(parents=True, exist_ok=True)
    chunks = [
        (str(pdf_path), first, min(first + CHUNK - 1, end), start, str(output_dir))
        for first in range(start, end + 1, CHUNK)
    ]
    sizes: dict[int, int] = {}
    with ProcessPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(render_chunk, chunk): chunk for chunk in chunks}
        for done, future in enumerate(as_completed(futures), start=1):
            sizes.update(future.result())
            if done % 10 == 0 or done == len(futures):
                print(f'{slug}: {done}/{len(chunks)} chunks', flush=True)

    urls = [f'/images/{slug}/{number:04d}.webp' for number in range(1, total + 1)]
    (DATA_DIR / f'{slug}-pages.json').write_text(
        json.dumps(urls, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
    )
    (DATA_DIR / f'{slug}-index.json').write_text(
        json.dumps(index, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
    )

    # احذف أي صفحات زائدة من تشغيل سابق بحدّ مختلف
    removed = 0
    for target in output_dir.glob('*.webp'):
        try:
            number = int(target.stem)
        except ValueError:
            continue
        if number > total:
            target.unlink()
            removed += 1

    megabytes = sum(sizes.values()) / 1024 / 1024
    print(
        f'{slug}: PDF pages {start}-{end} -> {total} WebP pages, '
        f'{megabytes:.1f} MB, {removed} removed, {time.time() - started:.0f}s',
        flush=True,
    )
    return total, sizes


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--pdf-dir',
        type=Path,
        default=Path(os.environ.get('TEMP', '.')) / 'opencode' / 'pdfs' / 'translations',
        help='المجلد الذي يحتوي على anko.pdf ... vietnami.pdf',
    )
    parser.add_argument('--only', nargs='*', default=None, help='ترجمة واحدة أو أكثر')
    parser.add_argument('--workers', type=int, default=int(os.environ.get('QC_WORKERS', '4')))
    args = parser.parse_args()

    arabic = read_arabic_index()
    slugs = args.only or SLUGS
    grand_total = 0
    grand_bytes = 0
    for slug in slugs:
        total, sizes = import_one(slug, args.pdf_dir, arabic, args.workers)
        grand_total += total
        grand_bytes += sum(sizes.values())
    print(f'total: {grand_total} pages, {grand_bytes / 1024 / 1024:.1f} MB', flush=True)


if __name__ == '__main__':
    main()
