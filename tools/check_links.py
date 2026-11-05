#!/usr/bin/env python3
"""check_links.py — ตรวจลิงก์และไฟล์ที่อ้างถึงในทุกหน้า HTML ของเว็บ (ก่อน deploy)
usage: python3 web/tools/check_links.py"""
import re, sys
from pathlib import Path
from urllib.parse import urlparse, unquote
from bs4 import BeautifulSoup

WEB = Path(__file__).resolve().parents[1]
bad, n = [], 0
ids_cache = {}

def ids_of(p):
    if p not in ids_cache:
        s = BeautifulSoup(p.read_text(encoding="utf-8"), "html.parser")
        ids_cache[p] = {t.get("id") for t in s.find_all(id=True)}
    return ids_cache[p]

for page in sorted(WEB.rglob("*.html")):
    if "tools" in page.parts or page.name.startswith("_test") or page.name == "lab.html":  # lab.html ถูกแทรกใน index.html
        continue
    soup = BeautifulSoup(page.read_text(encoding="utf-8"), "html.parser")
    for tag, attr in [("a", "href"), ("img", "src"), ("script", "src"), ("link", "href")]:
        for t in soup.find_all(tag):
            url = t.get(attr)
            if not url or url.startswith(("http:", "https:", "mailto:", "data:", "javascript:")):
                continue
            n += 1
            u = urlparse(url)
            if u.path:
                target = (WEB / u.path.lstrip("/")) if u.path.startswith("/") else (page.parent / unquote(u.path))
                target = target.resolve()
                if target.is_dir():
                    target = target / "index.html"
                if not target.exists():
                    bad.append(f"{page.relative_to(WEB)} → {url} (ไม่พบไฟล์)")
                    continue
            else:
                target = page
            if u.fragment and target.suffix == ".html" and u.fragment not in ids_of(target) and not u.fragment.isdigit():
                bad.append(f"{page.relative_to(WEB)} → {url} (ไม่พบ #{u.fragment})")

# ลิงก์ที่สร้างจาก course.js
course = (WEB / "assets/js/course.js").read_text(encoding="utf-8")
for no in re.findall(r"\{ no: (\d+),[^}]*ready: true", course):
    d = WEB / "chapters" / f"{int(no):02d}"
    for f in ["index.html", "slides.html", "widgets.js", "quiz.js"]:
        n += 1
        if not (d / f).exists():
            bad.append(f"course.js บทที่ {no} → ขาด {f}")

print(f"ตรวจ {n} ลิงก์/ไฟล์")
print("\n".join(bad) if bad else "✓ ไม่พบลิงก์เสีย")
sys.exit(1 if bad else 0)
