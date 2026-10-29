#!/usr/bin/env python3
"""Render a magazine PDF into page JPEGs for the archive viewer.

Usage: python scripts/render_pages.py <issue.pdf> <outdir> [--dpi 110]

Writes cover.jpg (page 1, larger) and p01.jpg, p02.jpg, ... into <outdir>,
then prints the page count. Needs PyMuPDF (pip install pymupdf).
"""
import argparse
import os
import sys
import warnings

warnings.filterwarnings("ignore")
try:
    import pymupdf
except ImportError:  # pragma: no cover
    sys.exit("PyMuPDF is required: pip install pymupdf")


def render(pdf: str, outdir: str, dpi: int) -> int:
    os.makedirs(outdir, exist_ok=True)
    doc = pymupdf.open(pdf)
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=dpi)
        pix.save(os.path.join(outdir, f"p{i + 1:02d}.jpg"), jpg_quality=80)
        if i == 0:
            cover = page.get_pixmap(dpi=max(dpi, 150))
            cover.save(os.path.join(outdir, "cover.jpg"), jpg_quality=84)
    return len(doc)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("outdir")
    ap.add_argument("--dpi", type=int, default=110)
    a = ap.parse_args()
    print(render(a.pdf, a.outdir, a.dpi))


if __name__ == "__main__":
    main()
