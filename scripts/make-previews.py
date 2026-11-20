#!/usr/bin/env python3
"""Generate small, compressed thumbnails of the first Quran page for every edition.

- Local PDF editions (12 translations + 3 Arabic): use local page 0001.webp.
- Six riwayahs: download the first page from their Blogger URL list.
- Uses Pillow (PIL) to resize + save as WebP (quality-controlled), equivalent to
  ImageMagick's `magick input -resize ... -quality ... output.webp`.

Output: public/images/previews/<id>.webp (about 220x320, quality 72).
"""
from __future__ import annotations

import io
import json
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data"
PAGES = ROOT / "public" / "images"
OUT = PAGES / "previews"
IDS = [
    "hafs", "qaloon", "warsh", "shubah", "susi", "douri",
    "standard1", "standard2", "big",
    "anko", "chinese", "english", "french", "hausa", "indonesian",
    "portuguese", "tamil", "telugu", "turkish", "urdu", "vietnami",
]
TARGET = (240, 348)
QUALITY = 72


def first_url(edition: str) -> str:
    raw = json.loads((DATA / f"{edition}-pages.json").read_text("utf-8"))
    # riwayah page lists include 3 covers; first mosque page is index 3
    return raw[3] if len(raw) > 3 else raw[0]


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as response:
        return response.read()


def make_thumb(blob: bytes) -> bytes:
    img = Image.open(io.BytesIO(blob))
    img = ImageOps.exif_transpose(img).convert("RGB")
    thumb = ImageOps.contain(img, TARGET, Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", TARGET, "white")
    canvas.paste(thumb, ((TARGET[0] - thumb.width) // 2, (TARGET[1] - thumb.height) // 2))
    buf = io.BytesIO()
    canvas.save(buf, "WEBP", quality=QUALITY, method=6)
    return buf.getvalue()


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    made = 0
    for edition in IDS:
        try:
            local = PAGES / edition / "0001.webp"
            if local.exists():
                blob = local.read_bytes()
            else:
                blob = fetch(first_url(edition))
            out = make_thumb(blob)
            (OUT / f"{edition}.webp").write_bytes(out)
            made += 1
            print(f"{edition}: {len(out)} bytes")
        except Exception as exc:  # noqa: BLE001 - report and continue
            print(f"{edition}: FAILED {type(exc).__name__} {exc}", file=sys.stderr)
    print(f"generated {made}/{len(IDS)} previews")
    return 0 if made == len(IDS) else 1


if __name__ == "__main__":
    raise SystemExit(main())
