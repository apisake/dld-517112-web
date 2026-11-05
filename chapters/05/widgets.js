/* =========================================================
   บทที่ 5 — interactive widgets (การลดรูป · SOP/POS · แผนผังคาร์โนห์)
   ใช้ DLD.bool จาก assets/js/boolean.js
   ========================================================= */
(function () {
  const DLD = window.DLD, U = DLD.ui, W = DLD.widgets, BL = DLD.bool;
  const H = (...a) => DLD.h(...a);
  const S = (...a) => DLD.svg(...a);
  const SYNTAX = "พิมพ์: AB = AND · A+B = OR · A' = NOT · (A+B)' = NOT ทั้งวงเล็บ";
  const parse = (s) => { try { return { e: BL.parse(s) }; } catch (err) { return { err: err.message }; } };
  const X = (html, size) => `<span class="mono" style="font-size:${size || 18}px;font-weight:700">${html}</span>`;
  const GRAY = ["00", "01", "11", "10"];

  /* นับเกท: AND/OR หลายอินพุต + อินเวอร์เตอร์ (ไม่นับพจน์ซ้ำ) */
  function gateCount(e) {
    const seen = new Set(); let and = 0, or = 0, not = 0;
    (function walk(x) {
      if (x.t === "var" || x.t === "const") return;
      const k = BL.text(x); if (seen.has(k)) return; seen.add(k);
      if (x.t === "not") { if (x.a.t !== "const") not++; walk(x.a); return; }
      const real = x.a.filter((y) => y.t !== "const");
      if (real.length > 1) { if (x.t === "and") and++; else if (x.t === "or") or++; }
      x.a.forEach(walk);
    })(e);
    return { and, or, not, total: and + or + not };
  }
  const minterms = (e, vars) => BL.combos(vars).map((env, i) => (BL.eval(e, env) ? i : -1)).filter((i) => i >= 0);
  const bin = (i, n) => i.toString(2).padStart(n, "0");
  const mintermHTML = (i, vars) => [...bin(i, vars.length)].map((b, k) => (b === "1" ? vars[k] : `<span class="ov">${vars[k]}</span>`)).join("");
  const maxtermHTML = (i, vars) => "(" + [...bin(i, vars.length)].map((b, k) => (b === "0" ? vars[k] : `<span class="ov">${vars[k]}</span>`)).join(" + ") + ")";

  /* =====================================================
     1) ลดรูปด้วยพีชคณิตบูลีนทีละขั้น (ตัวอย่างที่ 5.1–5.4)
     ===================================================== */
  const ALG = {
    "5.1": [["AB + A(B + C) + B(B + C)", ""], ["AB + AB + AC + BB + BC", "กฎการกระจาย กับพจน์ที่ 2 และ 3"], ["AB + AB + AC + B + BC", "ข้อ 7: BB = B"], ["AB + AC + B + BC", "ข้อ 5: AB + AB = AB"], ["AB + AC + B", "ข้อ 10: B + BC = B"], ["B + AC", "ข้อ 10: AB + B = B"]],
    "5.2": [["(AB'(C + BD) + A'B')C", ""], ["(AB'C + AB'BD + A'B')C", "กฎการกระจายในวงเล็บเหลี่ยม"], ["(AB'C + A·0·D + A'B')C", "ข้อ 8: B'B = 0"], ["(AB'C + 0 + A'B')C", "ข้อ 3: A·0·D = 0"], ["(AB'C + A'B')C", "ข้อ 1: ละ 0"], ["AB'CC + A'B'C", "กฎการกระจาย"], ["AB'C + A'B'C", "ข้อ 7: CC = C"], ["B'C(A + A')", "แยกตัวประกอบ B'C"], ["B'C·1", "ข้อ 6: A + A' = 1"], ["B'C", "ข้อ 4: ละ 1"]],
    "5.3": [["A'BC + AB'C' + A'B'C' + AB'C + ABC", ""], ["BC(A' + A) + AB'C' + A'B'C' + AB'C", "แยกตัวประกอบ BC"], ["BC·1 + AB'(C' + C) + A'B'C'", "ข้อ 6 และแยกตัวประกอบ AB'"], ["BC + AB'·1 + A'B'C'", "ข้อ 4 และข้อ 6"], ["BC + AB' + A'B'C'", "ข้อ 4: ละ 1"], ["BC + B'(A + A'C')", "แยกตัวประกอบ B'"], ["BC + B'(A + C')", "ข้อ 11: A + A'C' = A + C'"], ["BC + AB' + B'C'", "กฎการกระจายและสลับที่"]],
    "5.4": [["(AB + AC)' + A'B'C", ""], ["(AB)'(AC)' + A'B'C", "DeMorgan กับพจน์แรก"], ["(A' + B')(A' + C') + A'B'C", "DeMorgan ในวงเล็บทั้งสอง"], ["A'A' + A'C' + A'B' + B'C' + A'B'C", "กฎการกระจาย"], ["A' + A'C' + A'B' + B'C'", "ข้อ 7 และข้อ 10"], ["A' + A'B' + B'C'", "ข้อ 10: A' + A'C' = A'"], ["A' + B'C'", "ข้อ 10: A' + A'B' = A'"]],
  };
  W.algsimp = function (el) {
    const body = U.shell(el, "STEP-BY-STEP", "ลดรูปด้วยพีชคณิตบูลีนทีละขั้น และเทียบจำนวนเกท",
      "เลือกตัวอย่างจากเล่มแล้วกด “ขั้นถัดไป” — ทุกขั้นถูกตรวจด้วยตารางค่าความจริงว่ายังเท่ากับนิพจน์ตั้งต้น (✓) · หรือพิมพ์นิพจน์เองเพื่อหารูป SOP ที่เล็กที่สุด · " + SYNTAX);
    const st = { ex: "5.1", shown: 0, own: "AB + A'C + BC" };
    const ctr = H("div", { class: "controls" });
    const sel = U.seg([...Object.keys(ALG).map((k) => [k, "ตัวอย่างที่ " + k]), ["own", "ลองเอง"]], st.ex, (k) => { st.ex = k; st.shown = 0; draw(); });
    ctr.append(sel, U.btn("ขั้นถัดไป ▶", () => { st.shown++; draw(); }, "primary"), U.btn("แสดงทั้งหมด", () => { st.shown = 99; draw(); }));
    const own = U.input("นิพจน์:", st.own, (s) => { st.own = s; draw(); }, { width: 260 });
    const out = H("div");
    body.append(ctr, own, out);
    function draw() {
      own.style.display = st.ex === "own" ? "" : "none";
      let steps;
      if (st.ex === "own") {
        const p = parse(st.own); own.input.classList.toggle("bad", !!p.err);
        if (p.err) { out.innerHTML = `<div class="callout warn">${p.err}</div>`; return; }
        const vars = BL.vars(p.e);
        if (vars.length > 6) { out.innerHTML = '<div class="callout warn">ไม่เกิน 6 ตัวแปร</div>'; return; }
        const m = BL.minimize(vars.length, minterms(p.e, vars)).sort((a, b) => b.cells.length - a.cells.length);
        const res = m.length ? m.map((x) => BL.termOf(x.pat, vars, "sop")).join(" + ") : "0";
        steps = [[st.own, ""], [res, "รูป SOP ที่เล็กที่สุด (หาด้วยวิธีเดียวกับแผนผังคาร์โนห์ หัวข้อ 5.4–5.5)"]];
        st.shown = 99;
      } else steps = ALG[st.ex];
      const e0 = BL.parse(steps[0][0]);
      const n = Math.min(st.shown, steps.length - 1);
      let h = `<div class="card" style="padding:12px 16px"><div style="display:grid;grid-template-columns:auto 1fr;gap:6px 16px;align-items:baseline"><span class="w-hint" style="margin:0">ตั้งต้น</span>${X(BL.html(e0))}`;
      for (let k = 1; k <= n; k++) {
        const e = BL.parse(steps[k][0]), ok = BL.equivalent(e0, e);
        h += `<span class="mono" style="color:var(--accent);font-weight:700">ขั้น ${k}</span><div>${X("= " + BL.html(e))}<div class="w-hint" style="margin:0">${steps[k][1]} ${ok ? "✓" : "✗"}</div></div>`;
      }
      h += "</div></div>";
      if (n >= steps.length - 1) {
        const g0 = gateCount(e0), g1 = gateCount(BL.parse(steps[steps.length - 1][0]));
        h += `<div class="wgrid" style="margin-top:10px"><div class="card"><b>วงจรตั้งต้น</b><div class="mono" style="font-size:28px;color:var(--bad);font-weight:700">${g0.total} เกท</div><small>AND ${g0.and} · OR ${g0.or} · NOT ${g0.not}</small></div>` +
          `<div class="card"><b>วงจรหลังลดรูป</b><div class="mono" style="font-size:28px;color:var(--hi);font-weight:700">${g1.total} เกท</div><small>AND ${g1.and} · OR ${g1.or} · NOT ${g1.not}</small></div></div>` +
          `<p class="w-hint" style="margin-top:6px">นับเกท 2 อินพุตขึ้นไปและอินเวอร์เตอร์ โดยพจน์ที่ซ้ำกันใช้เกทร่วมกัน${st.ex === "5.1" ? " — ตรงกับรูปที่ 5.1: 5 เกท → 2 เกท" : ""}</p>`;
      } else h += `<div class="callout note" style="margin-top:10px">กด “ขั้นถัดไป” (${n}/${steps.length - 1}) · ลองคิดก่อนว่าขั้นต่อไปควรใช้กฎหรือหลักเกณฑ์ข้อใด</div>`;
      out.innerHTML = h;
    }
    draw();
  };

  /* =====================================================
     2) รูปแบบมาตรฐาน SOP / POS (5.2)
     ===================================================== */
  function classify(e) {
    const isLit = (x) => x.t === "var" || (x.t === "not" && x.a.t === "var");
    const isProd = (x) => isLit(x) || (x.t === "and" && x.a.every(isLit));
    const isSum = (x) => isLit(x) || (x.t === "or" && x.a.every(isLit));
    const vars = BL.vars(e);
    const full = (x) => BL.vars(x).length === vars.length && (isLit(x) ? 1 : x.a.length) === vars.length;
    if (e.t === "or" && e.a.every(isProd)) return e.a.every(full) ? "SOP มาตรฐาน" : "SOP";
    if (e.t === "and" && e.a.every(isSum)) return e.a.every(full) ? "POS มาตรฐาน" : "POS";
    if (isProd(e)) return "พจน์การคูณเดี่ยว (ถือเป็น SOP)";
    return "ยังไม่อยู่ในรูปมาตรฐาน";
  }
  W.stdform = function (el) {
    const body = U.shell(el, "INTERACTIVE", "รูปแบบมาตรฐาน: SOP มาตรฐาน ⇄ POS มาตรฐาน",
      "พิมพ์นิพจน์ใด ๆ ระบบจะบอกชนิด หาโดเมน และเขียนเป็น SOP มาตรฐาน (จาก combination ที่ได้ 1) และ POS มาตรฐาน (จาก combination ที่ได้ 0) พร้อมค่าไบนารีตัวแทนของแต่ละพจน์ · " + SYNTAX);
    const st = { src: "A'B'C' + A'BC' + A'BC + AB'C + ABC" };
    const inp = U.input("นิพจน์:", st.src, (s) => { st.src = s; draw(); }, { width: 360 });
    const pre = H("div", { class: "controls" });
    [["ตย. 5.6", "AB'C + A'B' + ABC'D"], ["ตย. 5.8", "(A + B' + C)(B' + C + D')(A + B' + C' + D)"], ["ตย. 5.10", "A'B'C' + A'BC' + A'BC + AB'C + ABC"], ["ตย. 5.5 (II)", "(A + B)(B + C + D)"], ["A(B + CD)", "A(B + CD)"]].forEach(([t, v]) =>
      pre.appendChild(U.btn(t, () => { inp.input.value = st.src = v; draw(); })));
    const out = H("div");
    body.append(inp, pre, out);
    function draw() {
      const p = parse(st.src); inp.input.classList.toggle("bad", !!p.err);
      if (p.err) { out.innerHTML = `<div class="callout warn">${p.err}</div>`; return; }
      const vars = BL.vars(p.e), n = vars.length;
      if (n > 5) { out.innerHTML = '<div class="callout warn">ไม่เกิน 5 ตัวแปร</div>'; return; }
      const ones = minterms(p.e, vars), zeros = [...Array(1 << n).keys()].filter((i) => !ones.includes(i));
      const chip = (i, cls) => `<span class="pill ${cls}" style="margin:2px">${bin(i, n)}</span>`;
      out.innerHTML = `<div class="callout note" style="margin:8px 0"><b>ชนิด:</b> ${classify(p.e)} · <b>โดเมน:</b> {${vars.join(", ")}} → ${1 << n} combination</div>` +
        `<div class="wgrid">` +
        `<div class="card"><b style="color:var(--hi)">SOP มาตรฐาน</b> — combination ที่ได้ 1 (${ones.length})<div style="margin:6px 0">${ones.map((i) => chip(i, "hi")).join("") || "—"}</div><div class="mono" style="font-size:15px;line-height:2">${ones.length ? ones.map((i) => mintermHTML(i, vars)).join(" + ") : "0"}</div><small class="w-hint">1 → ตัวแปร · 0 → complement</small></div>` +
        `<div class="card"><b style="color:var(--accent)">POS มาตรฐาน</b> — combination ที่ได้ 0 (${zeros.length})<div style="margin:6px 0">${zeros.map((i) => chip(i, "bad")).join("") || "—"}</div><div class="mono" style="font-size:15px;line-height:2">${zeros.length ? zeros.map((i) => maxtermHTML(i, vars)).join("") : "1"}</div><small class="w-hint">0 → ตัวแปร · 1 → complement</small></div></div>` +
        `<p class="w-hint" style="margin-top:8px">การแปลง SOP มาตรฐาน → POS มาตรฐาน (หัวข้อ 5.2.3): ค่าไบนารีที่ไม่ปรากฏใน SOP คือพจน์ของ POS — ทั้งสองรวมกันครบ ${1 << n} combination พอดี</p>`;
    }
    draw();
  };

  /* =====================================================
     3) ตารางค่าความจริง → นิพจน์มาตรฐาน (5.3)
     ===================================================== */
  W.tt2expr = function (el) {
    const body = U.shell(el, "INTERACTIVE", "ตารางค่าความจริง → นิพจน์ SOP และ POS มาตรฐาน",
      "คลิกช่องเอาต์พุต X เพื่อสลับ 0/1 — แถวที่เป็น 1 กลายเป็นพจน์การคูณของ SOP · แถวที่เป็น 0 กลายเป็นพจน์การบวกของ POS");
    const st = { n: 3, out: [0, 0, 0, 1, 1, 0, 1, 1] };
    const ctr = H("div", { class: "controls" });
    ctr.append(U.seg([[3, "3 ตัวแปร"], [4, "4 ตัวแปร"]], 3, (n) => { st.n = n; st.out = Array(1 << n).fill(0); draw(); }),
      U.btn("ตย. 5.13", () => { st.n = 3; ctr.firstChild.set(3); st.out = [0, 0, 0, 1, 1, 0, 1, 1]; draw(); }), U.btn("ล้าง", () => { st.out.fill(0); draw(); }));
    const wrap = H("div", { class: "wgrid", style: "grid-template-columns:minmax(0,240px) 1fr;align-items:start" });
    const tbl = H("div"), res = H("div");
    wrap.append(tbl, res);
    body.append(ctr, wrap);
    const mq = matchMedia("(max-width:700px)"); const lay = () => (wrap.style.gridTemplateColumns = mq.matches ? "1fr" : "minmax(0,240px) 1fr"); mq.addEventListener("change", lay); lay();
    function draw() {
      const vars = DLD.letters(st.n);
      tbl.innerHTML = `<table class="data" style="width:100%;text-align:center"><tr>${vars.map((v) => `<th>${v}</th>`).join("")}<th>X</th></tr>` +
        st.out.map((o, i) => `<tr>${[...bin(i, st.n)].map((b) => `<td class="num" style="padding:2px 6px">${b}</td>`).join("")}<td data-i="${i}" class="num" style="cursor:pointer;font-weight:700;padding:2px 6px;color:${o ? "var(--hi)" : "var(--accent)"};background:${o ? "var(--hi-soft)" : "var(--accent-soft)"}">${o}</td></tr>`).join("") + "</table>";
      tbl.querySelectorAll("td[data-i]").forEach((td) => td.addEventListener("click", () => { st.out[+td.dataset.i] ^= 1; draw(); }));
      const ones = st.out.map((o, i) => (o ? i : -1)).filter((i) => i >= 0), zeros = st.out.map((o, i) => (o ? -1 : i)).filter((i) => i >= 0);
      res.innerHTML = `<div class="card" style="margin-bottom:10px"><b style="color:var(--hi)">SOP มาตรฐาน</b><div style="margin:6px 0;font-size:14px">${ones.map((i) => `${bin(i, st.n)} → ${X(mintermHTML(i, vars), 15)}`).join("<br>") || "—"}</div><div>X = ${X(ones.length ? ones.map((i) => mintermHTML(i, vars)).join(" + ") : "0", 16)}</div></div>` +
        `<div class="card"><b style="color:var(--accent)">POS มาตรฐาน</b><div style="margin:6px 0;font-size:14px">${zeros.map((i) => `${bin(i, st.n)} → ${X(maxtermHTML(i, vars), 15)}`).join("<br>") || "—"}</div><div>X = ${X(zeros.length ? zeros.map((i) => maxtermHTML(i, vars)).join("") : "1", 16)}</div></div>`;
    }
    draw();
  };

  /* =====================================================
     แผนผังคาร์โนห์: เรขาคณิตของ cell
     rows = AB (รหัสเกรย์), cols = C (3 ตัวแปร) หรือ CD (4 ตัวแปร)
     ===================================================== */
  function layout(n) {
    const rows = GRAY, cols = n === 3 ? ["0", "1"] : GRAY;
    const idx = (r, c) => parseInt(rows[r] + cols[c], 2);
    const pos = {}; rows.forEach((_, r) => cols.forEach((_, c) => (pos[idx(r, c)] = [r, c])));
    return { rows, cols, idx, pos, rv: "AB", cv: n === 3 ? "C" : "CD" };
  }
  function runs(list, len) { // contiguous runs on a ring of length len
    const set = new Set(list), out = [];
    if (set.size === len) return [[0, len - 1]];
    let start = [...Array(len).keys()].find((i) => set.has(i) && !set.has((i + len - 1) % len));
    if (start === undefined) return [[0, len - 1]];
    for (let k = 0, i = start; k < len; k++, i = (start + k) % len) {
      if (set.has(i) && !set.has((i + len - 1) % len)) { let j = i; while (set.has((j + 1) % len) && (j + 1) % len !== i) j = (j + 1) % len; out.push([i, j]); }
    }
    return out;
  }
  const COLORS = ["#e8590c", "#1f6feb", "#12b886", "#ae3ec9", "#f59f00", "#e03131", "#0ca678", "#5c7cfa"];
  function drawMap(svg, n, vals, opts) {
    opts = opts || {};
    svg.innerHTML = "";
    const L = layout(n), cw = 72, ch = 52, x0 = 92, y0 = 64;
    const W2 = x0 + L.cols.length * cw + 20, H2 = y0 + 4 * ch + 20;
    svg.setAttribute("viewBox", `0 0 ${W2} ${H2}`);
    S("line", { x1: x0 - 50, y1: y0 - 44, x2: x0, y2: y0, stroke: "var(--ink-3)" }, svg);
    S("text", { x: x0 - 52, y: y0 - 6, class: "s-mono", style: "font-size:14px;font-weight:700", text: L.rv }, svg);
    S("text", { x: x0 - 22, y: y0 - 34, class: "s-mono", style: "font-size:14px;font-weight:700", text: L.cv }, svg);
    L.cols.forEach((c, j) => S("text", { x: x0 + j * cw + cw / 2, y: y0 - 12, "text-anchor": "middle", class: "s-mono", style: "font-size:14px;font-weight:700;fill:var(--brand)", text: c }, svg));
    L.rows.forEach((r, i) => S("text", { x: x0 - 12, y: y0 + i * ch + ch / 2 + 5, "text-anchor": "end", class: "s-mono", style: "font-size:14px;font-weight:700;fill:var(--brand)", text: r }, svg));
    L.rows.forEach((_, i) => L.cols.forEach((_, j) => {
      const m = L.idx(i, j), v = vals[m];
      const hl = opts.highlight && opts.highlight(m);
      const cell = S("rect", { x: x0 + j * cw, y: y0 + i * ch, width: cw, height: ch, fill: hl || "var(--surface)", stroke: "var(--ink-3)", "stroke-width": 1.2, style: opts.onClick ? "cursor:pointer" : "" }, svg);
      if (opts.onClick) cell.addEventListener("click", () => opts.onClick(m));
      S("text", { x: x0 + j * cw + 5, y: y0 + i * ch + 13, class: "s-mono", style: "font-size:10px;fill:var(--ink-3);pointer-events:none", text: opts.labels === "bin" ? bin(m, n) : "m" + m }, svg);
      const show = v === "X" ? "X" : opts.mode === "pos" ? (v === 0 ? "0" : "") : v === 1 ? "1" : "";
      if (show) S("text", { x: x0 + j * cw + cw / 2, y: y0 + i * ch + ch / 2 + 9, "text-anchor": "middle", class: "s-mono", style: `font-size:24px;font-weight:700;pointer-events:none;fill:${v === "X" ? "var(--ink-3)" : opts.mode === "pos" ? "var(--accent)" : "var(--hi)"}`, text: show }, svg);
    }));
    (opts.groups || []).forEach((g, gi) => {
      const col = COLORS[gi % COLORS.length];
      const rs = [...new Set(g.cells.map((m) => L.pos[m][0]))], cs = [...new Set(g.cells.map((m) => L.pos[m][1]))];
      const pad = 4 + (gi % 4) * 3;
      const split = (rr, len) => rr.flatMap(([a, b]) => (a <= b ? [[a, b]] : [[a, len - 1], [0, b]])); // กลุ่มที่ม้วนข้ามขอบ → วาดสองส่วน
      split(runs(rs, 4), 4).forEach(([r0, r1]) => split(runs(cs, L.cols.length), L.cols.length).forEach(([c0, c1]) => {
        S("rect", { x: x0 + c0 * cw + pad, y: y0 + r0 * ch + pad, width: (c1 - c0 + 1) * cw - 2 * pad, height: (r1 - r0 + 1) * ch - 2 * pad, rx: 14, fill: col, "fill-opacity": 0.1, stroke: col, "stroke-width": 3, style: "pointer-events:none" }, svg);
      }));
    });
    return L;
  }

  /* =====================================================
     4) cell ที่ติดกัน (5.4.3)
     ===================================================== */
  W.adjacency = function (el) {
    const body = U.shell(el, "INTERACTIVE", "Cell adjacency: cell ใดบ้างที่ “ติดกัน”",
      "คลิก cell ใดก็ได้ — cell ที่ติดกัน (ต่างกันเพียง 1 บิต) จะเป็นสีเขียว รวมถึง cell ที่ขอบซ้าย–ขวาและบน–ล่างซึ่งม้วนบรรจบกัน · แนวทแยงไม่นับว่าติดกัน");
    const st = { n: 4, sel: 12 };
    const ctr = H("div", { class: "controls" });
    ctr.append(U.seg([[3, "3 ตัวแปร"], [4, "4 ตัวแปร"]], 4, (n) => { st.n = n; st.sel = n === 3 ? 2 : 12; draw(); }));
    const svg = S("svg", { style: "max-width:460px" });
    const msg = H("div", { class: "callout tip", style: "margin-bottom:0" });
    body.append(ctr, svg, msg);
    function draw() {
      const n = st.n, s = st.sel;
      const adj = [...Array(n).keys()].map((k) => s ^ (1 << k));
      drawMap(svg, n, {}, { labels: "bin", onClick: (m) => { st.sel = m; draw(); }, highlight: (m) => (m === s ? "var(--accent-soft)" : adj.includes(m) ? "var(--hi-soft)" : null) });
      const L = layout(n);
      const wrapAdj = adj.filter((m) => Math.abs(L.pos[m][0] - L.pos[s][0]) === 3 || Math.abs(L.pos[m][1] - L.pos[s][1]) === 3);
      msg.innerHTML = `cell <b class="mono">${bin(s, n)}</b> ติดกับ ${adj.map((m) => `<b class="mono">${bin(m, n)}</b>`).join(", ")} (${n} cell — เปลี่ยนทีละบิต)` +
        (wrapAdj.length ? `<br><small>ในจำนวนนี้ ${wrapAdj.map((m) => bin(m, n)).join(", ")} อยู่คนละขอบ แต่ติดกันเมื่อม้วนแผนผังบรรจบกัน (รูปที่ 5.6)</small>` : "");
    }
    draw();
  };

  /* =====================================================
     5) แผนผังคาร์โนห์: จัดกลุ่มและลดรูปอัตโนมัติ (5.5–5.6)
     ===================================================== */
  const PRESETS = {
    "5.19": { n: 4, ones: [4, 5, 6, 7, 12, 13, 14, 15, 2, 3, 9] },
    "5.21": { n: 3, expr: "AB'C + A'BC + A'B'C + A'B'C' + AB'C'" },
    "5.22": { n: 4, expr: "B'C'D' + A'BC'D' + ABC'D' + A'B'CD + AB'CD + A'B'CD' + A'BCD' + ABCD' + AB'CD'" },
    "รูป 5.9": { n: 4, ones: [7, 8, 9], dcs: [10, 11, 12, 13, 14, 15] },
    "5.24 (POS)": { n: 3, mode: "pos", zeros: [0, 1, 2, 3, 6] },
    "5.25 (POS)": { n: 4, mode: "pos", zeros: [0, 8, 2, 9, 4, 12] },
  };
  W.kmap = function (el) {
    const startMode = el.dataset.mode || "sop";
    const startPreset = el.dataset.preset || (startMode === "pos" ? "5.24 (POS)" : "5.21");
    const body = U.shell(el, "INTERACTIVE", "แผนผังคาร์โนห์: จัดกลุ่มและลดรูปอัตโนมัติ",
      "คลิก cell เพื่อวนค่า 0 → 1 → X (don’t care) หรือพิมพ์นิพจน์ SOP แล้วกด “จัดลงแผนผัง” · กด “จัดกลุ่มถัดไป” เพื่อดูทีละกลุ่ม — กลุ่มของ 1 ให้ SOP, กลุ่มของ 0 ให้ POS");
    const st = { n: 3, vals: {}, mode: startMode, shown: 99, src: "" };
    const ctr = H("div", { class: "controls" });
    const nSeg = U.seg([[3, "3 ตัวแปร"], [4, "4 ตัวแปร"]], 3, (n) => { st.n = n; st.vals = {}; st.shown = 0; draw(); });
    const mSeg = U.seg([["sop", "SOP (จัดกลุ่ม 1)"], ["pos", "POS (จัดกลุ่ม 0)"]], st.mode, (m) => { st.mode = m; st.shown = 0; draw(); });
    ctr.append(nSeg, mSeg, U.btn("จัดกลุ่มถัดไป ▶", () => { st.shown++; draw(); }, "primary"), U.btn("แสดงทั้งหมด", () => { st.shown = 99; draw(); }), U.btn("ล้าง", () => { st.vals = {}; st.shown = 0; draw(); }));
    const ctr2 = H("div", { class: "controls" });
    const inp = U.input("นิพจน์ SOP:", "", (s) => (st.src = s), { width: 260 });
    ctr2.append(inp, U.btn("จัดลงแผนผัง", () => {
      const p = parse(st.src); inp.input.classList.toggle("bad", !!p.err); if (p.err) return;
      const vars = BL.vars(p.e); if (vars.length > 4) { inp.input.classList.add("bad"); return; }
      const V = DLD.letters(vars.length <= 3 ? 3 : 4); st.n = V.length; nSeg.set(st.n);
      st.vals = {}; BL.combos(V).forEach((env, i) => { if (BL.eval(p.e, env)) st.vals[i] = 1; });
      st.shown = 0; draw();
    }));
    const pre = H("div", { class: "controls" });
    pre.appendChild(H("span", { class: "w-hint", style: "margin:0" }, "ตัวอย่างในเล่ม:"));
    Object.keys(PRESETS).forEach((k) => pre.appendChild(U.btn(k, () => load(k))));
    const wrap = H("div", { class: "wgrid", style: "grid-template-columns:minmax(0,440px) 1fr;align-items:start" });
    const svg = S("svg"), res = H("div");
    const left = H("div"); left.appendChild(svg);
    wrap.append(left, res);
    body.append(ctr, ctr2, pre, wrap);
    const mq = matchMedia("(max-width:760px)"); const lay = () => (wrap.style.gridTemplateColumns = mq.matches ? "1fr" : "minmax(0,440px) 1fr"); mq.addEventListener("change", lay); lay();
    function load(k) {
      const p = PRESETS[k]; st.n = p.n; nSeg.set(p.n); st.vals = {};
      if (p.mode) { st.mode = p.mode; mSeg.set(p.mode); }
      if (p.expr) { const e = BL.parse(p.expr); BL.combos(DLD.letters(p.n)).forEach((env, i) => { if (BL.eval(e, env)) st.vals[i] = 1; }); inp.input.value = p.expr; }
      (p.ones || []).forEach((i) => (st.vals[i] = 1));
      (p.dcs || []).forEach((i) => (st.vals[i] = "X"));
      if (p.zeros) { for (let i = 0; i < 1 << p.n; i++) st.vals[i] = 1; p.zeros.forEach((i) => delete st.vals[i]); }
      st.shown = 0; draw();
    }
    function draw() {
      const n = st.n, vars = DLD.letters(n), N = 1 << n;
      const v = (i) => (st.vals[i] === "X" ? "X" : st.vals[i] ? 1 : 0);
      const ones = [...Array(N).keys()].filter((i) => v(i) === 1), zeros = [...Array(N).keys()].filter((i) => v(i) === 0), dcs = [...Array(N).keys()].filter((i) => v(i) === "X");
      const target = st.mode === "sop" ? ones : zeros;
      const groups = BL.minimize(n, target, dcs).sort((a, b) => b.cells.length - a.cells.length);
      const shown = groups.slice(0, st.shown);
      const vals = {}; for (let i = 0; i < N; i++) vals[i] = v(i);
      drawMap(svg, n, vals, { mode: st.mode, groups: shown, onClick: (m) => { const c = v(m); st.vals[m] = c === 0 ? 1 : c === 1 ? "X" : 0; if (!st.vals[m]) delete st.vals[m]; st.shown = 0; draw(); } });
      const term = (g) => BL.termOf(g.pat, vars, st.mode, true);
      const elim = (g) => [...g.pat].map((c, k) => (c === "-" ? vars[k] : null)).filter(Boolean);
      const join = st.mode === "sop" ? " + " : "";
      let h = `<div class="card" style="margin-bottom:10px"><b>${st.mode === "sop" ? "กลุ่มของ 1 → พจน์การคูณ" : "กลุ่มของ 0 → พจน์การบวก"}</b>`;
      if (!target.length) h += `<p class="w-hint" style="margin:6px 0 0">ยังไม่มี ${st.mode === "sop" ? "1" : "0"} ในแผนผัง — X = ${st.mode === "sop" ? "0" : "1"}</p>`;
      groups.forEach((g, gi) => {
        const on = gi < st.shown, col = COLORS[gi % COLORS.length];
        const dcIn = g.cells.filter((c) => dcs.includes(c)).length;
        h += `<div style="display:flex;gap:10px;align-items:center;margin:8px 0;opacity:${on ? 1 : 0.35}"><span style="width:14px;height:14px;border-radius:4px;background:${col};flex:none"></span><div><b class="mono" style="font-size:18px">${on ? term(g) : "?"}</b><br><small class="w-hint" style="margin:0">${g.cells.length} cell${dcIn ? ` (มี don’t care ${dcIn})` : ""} · ${on ? (elim(g).length ? "ตัวแปรขัดแย้งที่กำจัดได้: " + elim(g).join(", ") : "ไม่มีตัวแปรขัดแย้ง") : "กดจัดกลุ่มถัดไป"}</small></div></div>`;
      });
      h += "</div>";
      const all = st.shown >= groups.length;
      const result = groups.length ? groups.map(term).join(join) : st.mode === "sop" ? "0" : "1";
      h += `<div class="callout ${all ? "tip" : "note"}" style="margin:0">X = ${all ? X(result, 20) : "…"}` +
        (all && groups.length ? `<br><small>${groups.length} พจน์ · ${groups.reduce((a, g) => a + [...g.pat].filter((c) => c !== "-").length, 0)} literal · เทียบกับรูปมาตรฐานที่มี ${target.length} พจน์</small>` : "") +
        (all && dcs.length && st.mode === "sop" ? (() => { const g2 = BL.minimize(n, ones, []); return `<br><small>ถ้าไม่ใช้ don’t care จะได้ ${X(g2.map((g) => BL.termOf(g.pat, vars, "sop", true)).join(" + ") || "0", 14)}</small>`; })() : "") + "</div>";
      res.innerHTML = h;
    }
    load(startPreset);
  };
})();
