"""Download the small public data files Phase 0 needs (about 75 MB in all).

The two big USAspending files are downloaded by aggregate_usaspending.py.
Files already on disk are skipped; pass --force to download again.
"""
import sys
import urllib.request

from config import SOURCES

HEADERS = {"User-Agent": "federal-money-map research script (Phase 0)"}


def download(url, path, force=False):
    if path.exists() and path.stat().st_size > 0 and not force:
        print(f"  have   {path.relative_to(path.parents[2])}")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=300) as r, open(path, "wb") as f:
        while chunk := r.read(1 << 20):
            f.write(chunk)
    print(f"  got    {path.relative_to(path.parents[2])}  ({path.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    force = "--force" in sys.argv
    print("Downloading public source files:")
    for name, (url, path) in SOURCES.items():
        download(url, path, force)
