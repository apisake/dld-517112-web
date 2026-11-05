#!/usr/bin/env python3
"""
embed_figs.py — ใส่รูป SVG จากหน้าบทเรียน (chapters/NN/index.html) ลงในสไลด์

ใช้กับบทที่รูปในเล่มเป็น SVG ฝังในหน้า (ไม่มีไฟล์ภาพ) เช่น บทที่ 9
ในสไลด์ให้เขียนตำแหน่งรูปเป็น
    <div class="figbox" data-fig="9.6" data-i="0" style="height:260px"></div>
  data-fig = เลขรูปตามคำบรรยายใต้รูป ("รูปที่ 9.6 ...")
  data-i   = ลำดับ SVG ภายในรูปนั้น (ไม่ใส่ = 0)
แล้วรัน   python3 web/tools/embed_figs.py 9
สคริปต์จะเติม/แทนที่ SVG ภายใน div นั้นทุกครั้ง (รันซ้ำได้) — แก้ไขสไลด์ส่วนอื่นได้ตามปกติ
"""
import re
import sys
from pathlib import Path
from bs4 import BeautifulSoup

WEB = Path(__file__).resolve().parents[1]


def main(no: int):
    d = WEB / "chapters" / f"{no:02d}"
    page = BeautifulSoup((d / "index.html").read_text(encoding="utf-8"), "html.parser")
    figs = {}
    for f in page.select("figure"):
        cap = f.find("figcaption")
        if not cap:
            continue
        m = re.match(r"รูปที่\s*(\d+\.\d+)", cap.get_text(" ", strip=True))
        if m:
            figs[m.group(1)] = f.find_all("svg")
    src = (d / "slides.html").read_text(encoding="utf-8")

    def fill(m):
        open_tag = m.group(1)
        num = re.search(r'data-fig="([\d.]+)"', open_tag).group(1)
        i = int((re.search(r'data-i="(\d+)"', open_tag) or [0, 0])[1])
        svgs = figs.get(num) or []
        if i >= len(svgs):
            print(f"  ! ไม่พบรูปที่ {num} (#{i})")
            return m.group(0)
        svg = svgs[i]
        svg = BeautifulSoup(str(svg), "html.parser").svg
        svg.attrs.pop("style", None)                     # ให้สไลด์กำหนดขนาดเอง
        if svg.has_attr("viewbox"):
            svg["viewBox"] = svg.attrs.pop("viewbox")
        svg["style"] = "width:100%;height:100%"
        svg["preserveAspectRatio"] = "xMidYMid meet"
        html = str(svg)
        # bs4 ทำให้ชื่อ attribute ของ SVG เป็นตัวเล็ก — คืนรูปที่เบราว์เซอร์ต้องการ
        for a in ["markerWidth", "markerHeight", "refX", "refY", "viewBox", "preserveAspectRatio"]:
            html = re.sub(rf"\b{a.lower()}=", f"{a}=", html)
        return f"{open_tag}{html}</div>"

    out, n = re.subn(r'(<div[^>]*data-fig="[\d.]+"[^>]*>)(?:<svg.*?</svg>)?</div>', fill, src, flags=re.S)
    (d / "slides.html").write_text(out, encoding="utf-8")
    print(f"embedded {n} figures into chapters/{no:02d}/slides.html")


if __name__ == "__main__":
    main(int(sys.argv[1]))
