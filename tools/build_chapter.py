#!/usr/bin/env python3
"""
build_chapter.py — แปลงเนื้อหาเอกสารประกอบการสอน (source/content_chN.html)
ให้เป็นหน้าเว็บบทเรียน (web/chapters/NN/index.html)

usage:  python3 web/tools/build_chapter.py 2
        (อ่าน web/chapters/02/chapter.json เป็นค่ากำหนดของบท)

chapter.json:
{
  "no": 2, "week": "สัปดาห์ที่ 2–3", "hours": "บรรยาย 4 ชม. + แบบฝึกหัด",
  "clos": [["CLO6", "ข้อความ CLO"], ...], "plos": ["PLO11"],
  "activity": "บรรยาย / แบบฝึกหัด",
  "widgets": { "s2-2-3": ["bitweights"], ... },   # แทรกท้ายหัวข้อนั้น (ก่อนหัวข้อถัดไป)
  "callouts": { "s2-4-1": "<div class='callout warn'>…</div>" },
  "lab": "lab.html"                               # (ไม่บังคับ) ไฟล์ส่วนปฏิบัติการ
}
"""
import json, re, sys, html
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString

ROOT = Path(__file__).resolve().parents[2]          # โฟลเดอร์รวมเล่ม
SRC = ROOT / "source"
WEB = ROOT / "web"

SARABUN_SCALE = 0.78   # TH Sarabun New ตัวเล็กกว่า Sarabun ที่ px เท่ากัน
MM_PX = 3.78 * 1.25    # 1 mm ในเล่ม → px บนจอ (ขยาย 25%)
SVG_SCALE = 1.2        # รูปในเล่มวาดสำหรับ A4 — ขยายเล็กน้อยสำหรับจอ


def fix_svg(svg):
    """ปรับฟอนต์ใน SVG ให้ใช้ฟอนต์เว็บ และให้ย่อขนาดตามจอได้"""
    for t in svg.find_all(["text", "tspan"]):
        ff = t.get("font-family", "")
        if "Sarabun" in ff:
            t["font-family"] = '"Sarabun", "IBM Plex Sans Thai", sans-serif'
            if t.get("font-size"):
                t["font-size"] = f'{float(t["font-size"]) * SARABUN_SCALE:.1f}'
        elif "Prompt" in ff:
            t["font-family"] = '"Prompt", "IBM Plex Sans Thai", sans-serif'
    w = svg.get("width")
    if w:
        svg["style"] = f"max-width:100%;width:{float(w) * SVG_SCALE:.0f}px;height:auto"
        del svg["width"]
        if svg.get("height"):
            del svg["height"]


COLOR_MAP = {"#fff2ea": "var(--soft2)", "#545c6b": "var(--ink-2)", "#8b93a3": "var(--ink-3)", "#6b7280": "var(--ink-3)",
             "#3a4150": "var(--ink-2)", "#eef6fc": "var(--brand-soft)", "#eceef2": "var(--line)", "#d5d9e0": "var(--line)"}


NUM = r"(?<![\w.])(\d*\.?\d+)"   # 12, 1.5, .5


def webify_css(css, skip):
    """แปลง CSS เฉพาะบทของเล่ม (สำหรับพิมพ์) ให้ใช้บนเว็บ: scope ใต้ .book, แปลง mm/pt, ตัดกฎสำหรับพิมพ์"""
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    out = ["/* สร้างอัตโนมัติจาก <style> ใน source/content_chN.html โดย tools/build_chapter.py — อย่าแก้ด้วยมือ */"]
    for m in re.finditer(r"([^{}@]+)\{([^{}]*)\}", css):
        sels, decls = m.group(1).strip(), m.group(2)
        keep = []
        for sel in [x.strip() for x in sels.split(",")]:
            if not sel or sel.startswith(".opener") or sel.startswith("@") or ":has(" in sel:
                continue
            if any(sk in sel for sk in skip):
                continue
            sel = re.sub(r"^\.body\s+", "", sel)
            keep.append(".book " + sel)
        if not keep:
            continue
        is_prompt = "Prompt" in decls
        new = []
        for d in decls.split(";"):
            d = d.strip()
            if not d or ":" not in d:
                continue
            prop, val = [x.strip() for x in d.split(":", 1)]
            if prop.startswith(("break-", "page-break", "orphans", "widows")):
                continue
            def font_pt(mm):
                f = 1.35 if is_prompt else 1.0
                return f"{float(mm.group(1)) * f:.1f}px"
            if prop in ("font-size", "font"):
                val = re.sub(NUM + r"pt", font_pt, val)
            val = re.sub(NUM + r"pt", lambda q: f"{float(q.group(1)) * 1.333:.1f}px", val)
            val = re.sub(NUM + r"mm", lambda q: f"{float(q.group(1)) * MM_PX:.1f}px", val)
            val = val.replace('"Prompt"', '"Prompt", var(--font)')
            for k, v in COLOR_MAP.items():
                val = re.sub(k, v, val, flags=re.I)
            new.append(f"{prop}: {val}")
        if new:
            out.append(f"{', '.join(keep)} {{ {'; '.join(new)}; }}")
    return "\n".join(out) + "\n"


def sec_id(no):
    return "s" + no.replace(".", "-")


def build(n):
    cfg = json.loads((WEB / f"chapters/{n:02d}/chapter.json").read_text(encoding="utf-8"))
    raw = (SRC / f"content_ch{n}.html").read_text(encoding="utf-8")
    soup = BeautifulSoup(raw, "lxml")
    chapter_css = "\n".join(st.get_text() for st in soup.find_all("style"))
    for st in soup.find_all("style"):
        st.decompose()

    op = soup.find("section", class_="opener")
    title_el = op.find(class_="ch-title")
    for br in title_el.find_all("br"):
        br.replace_with(" ")
    title = re.sub(r"\s+", " ", title_el.get_text()).strip()
    title_en = op.find(class_="ch-en").get_text(strip=True)
    objectives = [li.decode_contents() for li in op.select(".objectives li")]

    body = soup.find("section", class_="body")

    # ---------- transform blocks ----------
    for svg in body.find_all("svg"):
        fix_svg(svg)

    # images: copy into chapters/NN/img and convert print sizes (mm) to screen px
    import shutil
    img_dir = WEB / f"chapters/{n:02d}/img"
    for img in body.find_all("img"):
        src = img.get("src", "")
        if src.startswith("img/"):
            img_dir.mkdir(parents=True, exist_ok=True)
            if (SRC / src).exists():
                shutil.copy2(SRC / src, img_dir / Path(src).name)
        img["loading"] = "lazy"
        if not img.get("alt"):
            fig = img.find_parent("figure")
            cap = fig.find("figcaption") if fig else None
            img["alt"] = cap.get_text(" ", strip=True) if cap else ""
    for el in body.find_all(style=True):
        if el.name in ("svg", "text", "tspan"):
            continue
        el["style"] = re.sub(r"(\d+(?:\.\d+)?)mm", lambda m: f"{float(m.group(1)) * MM_PX:.0f}px", el["style"])

    for co in body.select("div.callout"):
        co["class"] = co.get("class", []) + ["bk-callout"]   # กล่องเข้มแบบในเล่ม
    for sel in cfg.get("scroll_wrap", []):
        for el in body.select(sel):
            el.wrap(soup.new_tag("div", attrs={"class": "tbl-scroll"}))
    for sc in body.find_all("script"):
        if sc.string and "addEventListener('load', draw)" in sc.string:
            sc.string = sc.string.replace("window.addEventListener('load', draw);",
                                          "window.addEventListener('load', draw); window.addEventListener('resize', draw);")

    toc = []
    for h in body.find_all(["h2", "h3"]):
        sn = h.find(class_="sec-no")
        if not sn:
            continue
        no = sn.get_text(strip=True)
        h["id"] = sec_id(no)
        sn.name = "span"
        sn["class"] = ["no"]
        toc.append((h.name, h["id"], no, re.sub(r"^\s*" + re.escape(no) + r"\s*", "", h.get_text(" ", strip=True))))

    for ex in body.select("div.example"):
        sol = ex.find("div", class_="solution")
        if sol:
            head = sol.find(class_="sol-head")
            label = head.get_text(strip=True) if head else "วิธีทำ"
            if head:
                head.decompose()
            det = soup.new_tag("details")
            det["class"] = ["solution"]
            summ = soup.new_tag("summary")
            summ.string = f"แสดง{label}"
            det.append(summ)
            sol.wrap(det)
            sol.unwrap()
            det.insert(0, summ)

    # tables must scroll sideways on phones instead of widening the page
    for tbl in body.find_all("table"):
        if tbl.find_parent(class_=["table-wrap", "tt-row", "ldiv-row", "tbl-scroll"]):
            continue
        tbl.wrap(soup.new_tag("div", attrs={"class": "tbl-scroll"}))

    for ex in body.select("div.exercise"):
        t = ex.find(class_="ex-title")
        if t:
            t.insert(0, NavigableString("✍️ "))

    summary_items = []
    sm = body.find(class_="summary")
    if sm:
        summary_items = [li.decode_contents() for li in sm.find_all("li")]
        sm.decompose()

    # wrap every top-level h2 + following siblings into <section class="sec">
    sections = []
    cur = None
    intro = []
    for el in list(body.children):
        if getattr(el, "name", None) == "h2" and el.get("id"):
            cur = [el]
            sections.append(cur)
        elif cur is None:
            intro.append(el)
        else:
            cur.append(el)

    def render_nodes(nodes):
        out = []
        for el in nodes:
            s = str(el)
            if getattr(el, "name", None) in ("h2", "h3", "h4") and el.get("id"):
                pass
            out.append(s)
        return "".join(out)

    # widget insertion: at end of the (sub)section with given id
    widgets = cfg.get("widgets", {})
    callouts = cfg.get("callouts", {})

    def inject(nodes):
        """split a section's nodes at h3 boundaries and append widgets/callouts after each part"""
        parts, buf, cur_id = [], [], None
        for el in nodes:
            if getattr(el, "name", None) in ("h2", "h3") and el.get("id"):
                if buf:
                    parts.append((cur_id, buf))
                buf, cur_id = [el], el["id"]
            else:
                buf.append(el)
        if buf:
            parts.append((cur_id, buf))
        html_out = []
        h2_id = nodes[0].get("id")
        for pid, b in parts:
            html_out.append(render_nodes(b))
            if pid in callouts:
                html_out.append(callouts[pid])
            for w in widgets.get(pid, []):
                if pid != h2_id:
                    html_out.append(widget_tag(w))
        # widgets keyed on the h2 go at the very end of the h2 section
        for w in widgets.get(h2_id, []):
            html_out.append(widget_tag(w))
        return "".join(html_out)

    body_html = '<div class="book">' + render_nodes(intro)
    for sec in sections:
        body_html += f'<section class="sec">{inject(sec)}</section>'
    # สคริปต์ของเล่มที่อยู่นอก section.body (เช่น ตารางที่สร้างด้วย JS) — ใส่ท้ายเนื้อหา
    for sc in soup.find_all("script"):
        if not sc.find_parent("section", class_="body"):
            code = sc.string or ""
            code = code.replace("window.addEventListener('load', draw);", "window.addEventListener('load', draw); window.addEventListener('resize', draw);")
            body_html += f"<script>{code}</script>"
    body_html += "</div>"

    # ---------- page ----------
    nn = f"{n:02d}"
    toc_html = '<li><a href="#overview">ภาพรวมและจุดประสงค์</a></li>'
    for tag, i, no, text in toc:
        short = text if len(text) < 34 else text[:32] + "…"
        cls = ' class="sub"' if tag == "h3" else ""
        toc_html += f'<li{cls}><a href="#{i}">{no} {html.escape(short)}</a></li>'
    toc_html += '<li><a href="#summary">สรุปท้ายบท</a></li><li><a href="#quiz">แบบทดสอบท้ายบท</a></li>'
    lab_html = ""
    if cfg.get("lab"):
        lab_html = (WEB / f"chapters/{nn}/{cfg['lab']}").read_text(encoding="utf-8")
        toc_html += f'<li><a href="#lab">{cfg.get("lab_title", "ปฏิบัติการ")}</a></li>'

    extra_css = ""
    if cfg.get("import_css"):
        (WEB / f"chapters/{n:02d}/chapter.css").write_text(webify_css(chapter_css, cfg.get("css_skip", [])), encoding="utf-8")
        extra_css = '<link rel="stylesheet" href="chapter.css">'

    clo_html = "".join(f'<p style="margin:0 0 8px"><span class="clo-chip">{c}</span> {t}</p>' for c, t in cfg["clos"])
    meta = "".join(f"<span>{m}</span>" for m in cfg.get("meta", []))
    n_widgets = sum(len(v) for v in widgets.values())
    page = TEMPLATE.format(
        n=n, nn=nn, title=html.escape(title), title_en=html.escape(title_en),
        week=cfg["week"], meta=meta, n_sec=len([t for t in toc if t[0] == "h2"]), n_widgets=n_widgets,
        toc=toc_html, objectives="".join(f"<li>{o}</li>" for o in objectives),
        clos=clo_html, activity=cfg.get("activity", ""), assess=cfg.get("assess", ""),
        body=body_html, summary="".join(f"<li>{s}</li>" for s in summary_items),
        lab=lab_html, extra_css=extra_css,
        lab_btn=('<a class="btn ghost" href="#lab">ใบงานปฏิบัติการ</a>' if lab_html else ""),
    )
    out = WEB / f"chapters/{nn}/index.html"
    out.write_text(page, encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)}  ({len(page)//1024} KB, {len(toc)} headings, {n_widgets} widgets)")


def widget_tag(w):
    if isinstance(w, str):
        return f'<div data-widget="{w}"></div>'
    attrs = " ".join(f'data-{k}="{html.escape(str(v))}"' for k, v in w.items() if k != "name")
    return f'<div data-widget="{w["name"]}" {attrs}></div>'


TEMPLATE = """<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>บทที่ {n} {title} · 517 112</title>
<meta name="description" content="517 112 การออกแบบวงจรตรรกะเชิงเลข — บทที่ {n} {title} ({title_en})">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&family=Prompt:wght@400;600;700&family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../assets/css/main.css">
<link rel="stylesheet" href="../../assets/css/book.css">
{extra_css}
<script src="../../assets/js/site.js"></script>
<script src="../../assets/js/logic.js"></script>
<script src="../../assets/js/numbers.js"></script>
<script src="../../assets/js/boolean.js"></script>
<script src="widgets.js"></script>
</head>
<body>
<!-- สร้างอัตโนมัติด้วย web/tools/build_chapter.py — แก้เนื้อหาที่ source/content_ch{n}.html หรือ chapter.json แล้วรันใหม่ -->
<header class="topbar">
  <a class="brand" href="../../index.html"><span class="chip">517 112</span><span>Digital Logic Design</span></a>
  <span class="crumb">/ บทที่ {n} {title}</span>
  <span class="spacer"></span>
  <a class="btn sm" href="slides.html">▶ สไลด์</a>
  <button class="btn sm icon" data-theme-toggle title="สลับโหมดสว่าง/มืด" aria-label="สลับธีม">◐</button>
</header>

<div class="layout">
  <nav class="toc-side" aria-label="สารบัญบทที่ {n}">
    <h4>บทที่ {n}</h4>
    <ol>{toc}</ol>
    <div class="side-actions">
      <a class="btn primary" href="slides.html">▶ เปิดสไลด์บรรยาย</a>
      <a class="btn" href="../../index.html">← หน้ารายวิชา</a>
    </div>
  </nav>

  <main class="lesson">
    <div class="hero">
      <div class="ch-label">CHAPTER {nn} · {week}</div>
      <h1>{title}</h1>
      <div class="en">{title_en}</div>
      <div class="meta">{meta}<span>{n_sec} หัวข้อ · {n_widgets} แบบจำลองเชิงโต้ตอบ</span></div>
      <div class="hero-actions">
        <a class="btn" href="slides.html">▶ สไลด์บรรยาย</a>
        <a class="btn ghost" href="#quiz">แบบทดสอบท้ายบท</a>
        {lab_btn}
      </div>
    </div>

    <section id="overview">
      <div class="grid-2">
        <div class="card objectives">
          <h3 style="font-size:18px">🎯 จุดประสงค์ของบทเรียน</h3>
          <ol>{objectives}</ol>
        </div>
        <div class="card">
          <h3 style="font-size:18px">🧭 ความเชื่อมโยงกับ มคอ.3</h3>
          {clos}
          <p style="margin:0;font-size:15px;color:var(--ink-2)"><b>กิจกรรม:</b> {activity}<br><b>การประเมิน:</b> {assess}</p>
        </div>
      </div>
    </section>

    {body}

    <section class="sec" id="summary">
      <h2>สรุปท้ายบท</h2>
      <div class="summary"><ul>{summary}</ul></div>
    </section>

    <section class="sec" id="quiz">
      <h2>แบบทดสอบท้ายบท</h2>
      <p class="w-hint">เลือกคำตอบ ระบบจะเฉลยพร้อมคำอธิบายทันที (ไม่มีการบันทึกคะแนน ใช้สำหรับทบทวนด้วยตนเอง)</p>
      <div class="quiz" id="quiz-box"></div>
    </section>

    {lab}

    <div style="display:flex;justify-content:space-between;gap:12px;margin-top:48px;flex-wrap:wrap">
      <a class="btn" href="../../index.html">← หน้ารายวิชา</a>
      <a class="btn primary" href="slides.html">▶ ทบทวนด้วยสไลด์</a>
    </div>
  </main>
</div>

<footer class="footer">517 112 การออกแบบวงจรตรรกะเชิงเลข · ภาควิชาคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยศิลปากร · เนื้อหาจากเอกสารประกอบการสอน อ.อภิเษก หงษ์วิทยากร</footer>

<script src="quiz.js"></script>
<script>document.addEventListener("DOMContentLoaded", () => DLD.quiz(document.getElementById("quiz-box"), window.CH_QUIZ));</script>
</body>
</html>
"""

if __name__ == "__main__":
    build(int(sys.argv[1]))
