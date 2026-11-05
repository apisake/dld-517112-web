/* =========================================================
   บทที่ 6 — interactive widgets (การวิเคราะห์วงจรคอมไบเนชัน)
   ========================================================= */
(function () {
  const DLD = window.DLD, U = DLD.ui, W = DLD.widgets, BL = DLD.bool;
  const H = (...a) => DLD.h(...a);
  const S = (...a) => DLD.svg(...a);
  const parse = (s) => { try { return { e: BL.parse(s) }; } catch (err) { return { err: err.message }; } };
  const X = (html, size) => `<span class="mono" style="font-size:${size || 18}px;font-weight:700">${html}</span>`;
  const wire = (g, d, v) => S("path", { d, class: v ? "s-wire1" : "s-wire0" }, g);
  const lamp = (g, x, y, v, r) => { if (v) S("circle", { cx: x, cy: y, r: (r || 16) + 10, fill: "var(--hi)", opacity: 0.2 }, g); S("circle", { cx: x, cy: y, r: r || 16, fill: v ? "var(--hi)" : "var(--surface-2)", stroke: "var(--ink-3)", "stroke-width": 2 }, g); };
  function toggles(vars, env, onChange) {
    const row = H("div", { class: "controls" });
    vars.forEach((v) => {
      const b = H("button", { type: "button", class: "btn sm", "aria-pressed": String(!!env[v]) }, `${v} = ${env[v] ? 1 : 0}`);
      b.addEventListener("click", () => { env[v] = env[v] ? 0 : 1; onChange(); });
      row.appendChild(b);
    });
    return row;
  }

  /* =====================================================
     1) AND-OR และ AND-OR-Invert (6.1.1–6.1.2)
     ===================================================== */
  W.aoi = function (el) {
    const body = U.shell(el, "INTERACTIVE", "วงจร AND-OR และ AND-OR-Invert",
      "กดเปลี่ยนค่าอินพุต A–D และสลับเป็นแบบ AND-OR-Invert — ตารางด้านล่างแสดงผลระหว่างทาง AB, CD และเอาต์พุต X (ตารางที่ 6.1)");
    const st = { env: { A: 1, B: 1, C: 0, D: 1 }, inv: false };
    const ctr = H("div", { class: "controls" });
    ctr.append(U.seg([[false, "AND-OR (รูปที่ 6.1)"], [true, "AND-OR-Invert (รูปที่ 6.2)"]], false, (v) => { st.inv = v; draw(); }));
    const tg = H("div");
    const svg = S("svg", { viewBox: "0 0 760 220" });
    const msg = H("div", { class: "callout note" });
    const side = el.dataset.layout === "side";
    const tbl = H("div", { style: `max-height:${side ? 360 : 320}px;overflow:auto` });
    if (side) {
      const grid = H("div", { style: "display:grid;grid-template-columns:1fr 330px;gap:16px;align-items:start" });
      const left = H("div"); left.append(tg, svg, msg); grid.append(left, tbl);
      body.append(ctr, grid);
    } else body.append(ctr, tg, svg, msg, tbl);
    function draw() {
      tg.innerHTML = ""; tg.appendChild(toggles(["A", "B", "C", "D"], st.env, draw));
      const { A, B, C, D } = st.env, ab = A & B, cd = C & D, or = ab | cd, x = st.inv ? 1 - or : or;
      svg.innerHTML = "";
      const wires = S("g", null, svg), g = S("g", null, svg);
      const g1 = DLD.drawGate(g, "AND", 200, 60, 2), g2 = DLD.drawGate(g, "AND", 200, 160, 2);
      const g3 = DLD.drawGate(g, st.inv ? "NOR" : "OR", 420, 110, 2);
      [["A", A, g1.inputs[0]], ["B", B, g1.inputs[1]], ["C", C, g2.inputs[0]], ["D", D, g2.inputs[1]]].forEach(([n, v, p]) => {
        wire(wires, `M80,${p.y} H${p.x}`, v);
        S("text", { x: 30, y: p.y + 5, class: "s-mono", style: "font-weight:700;fill:var(--ink)", text: `${n}=${v}` }, svg);
      });
      wire(wires, `M${g1.output.x},60 H330 V${g3.inputs[0].y} H${g3.inputs[0].x}`, ab);
      wire(wires, `M${g2.output.x},160 H330 V${g3.inputs[1].y} H${g3.inputs[1].x}`, cd);
      wire(wires, `M${g3.output.x},110 H640`, x);
      S("text", { x: g1.output.x + 8, y: 50, class: "s-mono", style: "font-weight:700;fill:var(--accent)", text: "AB=" + ab }, svg);
      S("text", { x: g2.output.x + 8, y: 150, class: "s-mono", style: "font-weight:700;fill:var(--accent)", text: "CD=" + cd }, svg);
      lamp(svg, 670, 110, x);
      S("text", { x: 670, y: 155, "text-anchor": "middle", class: "s-mono", style: "font-weight:700", text: "X=" + x }, svg);
      if (st.inv) S("text", { x: 420, y: 186, class: "s-text", style: "font-size:12px", text: "(OR + Invert = NOR)" }, svg);
      msg.innerHTML = st.inv
        ? `X = <span class="ov">AB + CD</span> = (<span class="ov">A</span> + <span class="ov">B</span>)(<span class="ov">C</span> + <span class="ov">D</span>) — นิพจน์ POS · X เป็น <b>LOW</b> เมื่อ A และ B เป็น HIGH หรือ C และ D เป็น HIGH`
        : `X = AB + CD — นิพจน์ SOP · X เป็น <b>HIGH</b> เมื่อ A และ B เป็น HIGH หรือ C และ D เป็น HIGH`;
      const rows = BL.combos(["A", "B", "C", "D"]);
      tbl.innerHTML = `<table class="data" style="width:100%;text-align:center"><tr><th>A</th><th>B</th><th>C</th><th>D</th><th style="background:var(--surface-2);color:var(--ink-2)">AB</th><th style="background:var(--surface-2);color:var(--ink-2)">CD</th><th>X</th></tr>` +
        rows.map((r) => { const a = r.A & r.B, c = r.C & r.D, o = st.inv ? 1 - (a | c) : a | c; const cur = ["A", "B", "C", "D"].every((k) => r[k] === st.env[k]);
          return `<tr style="${cur ? "background:var(--brand-soft);font-weight:700" : ""}"><td>${r.A}</td><td>${r.B}</td><td>${r.C}</td><td>${r.D}</td><td style="color:var(--ink-3)">${a}</td><td style="color:var(--ink-3)">${c}</td><td style="font-weight:700;color:${o ? "var(--hi)" : "var(--lo)"}">${o}</td></tr>`; }).join("") + "</table>";
    }
    draw();
  };

  /* =====================================================
     2) ระบบเตือนระดับสารเคมี 3 ถัง (ตัวอย่างที่ 6.1)
     ===================================================== */
  W.tankalarm = function (el) {
    const body = U.shell(el, "INTERACTIVE", "ตัวอย่างที่ 6.1: เตือนเมื่อสารเคมีต่ำกว่าขีดตั้งแต่ 2 ถังขึ้นไป",
      "คลิกที่ถังเพื่อเปลี่ยนระดับสารเคมี — เซนเซอร์ส่ง HIGH เมื่อระดับต่ำกว่าขีด · X = AB + AC + BC");
    const st = { low: [1, 0, 0] };
    const svg = S("svg", { viewBox: "0 0 820 300" });
    const msg = H("div", { class: "callout tip", style: "margin-bottom:0" });
    body.append(svg, msg);
    function draw() {
      svg.innerHTML = "";
      const [A, B, C] = st.low, ab = A & B, ac = A & C, bc = B & C, x = ab | ac | bc;
      const wires = S("g", null, svg), g = S("g", null, svg);
      ["A", "B", "C"].forEach((n, i) => {
        const tx = 20, ty = 20 + i * 92, low = st.low[i];
        const tank = S("g", { style: "cursor:pointer" }, svg);
        S("rect", { x: tx, y: ty, width: 70, height: 76, rx: 8, fill: "var(--surface)", stroke: "var(--ink-3)", "stroke-width": 2 }, tank);
        const lvl = low ? 20 : 58;
        S("rect", { x: tx + 3, y: ty + 76 - lvl - 2, width: 64, height: lvl, rx: 5, fill: "#4dabf7", opacity: 0.75 }, tank);
        S("line", { x1: tx, x2: tx + 70, y1: ty + 46, y2: ty + 46, stroke: "var(--accent)", "stroke-dasharray": "4 3", "stroke-width": 1.5 }, tank);
        S("text", { x: tx + 35, y: ty + 18, "text-anchor": "middle", class: "s-mono", style: "font-weight:700", text: "ถัง " + n }, tank);
        tank.addEventListener("click", () => { st.low[i] ^= 1; draw(); });
        S("text", { x: tx + 78, y: ty + 22, class: "s-mono", style: `font-size:13px;font-weight:700;fill:${low ? "var(--hi)" : "var(--lo)"}`, text: `${n}=${low}` }, svg);
      });
      const ys = [58, 150, 242];
      const gA = DLD.drawGate(g, "AND", 330, 60, 2), gB = DLD.drawGate(g, "AND", 330, 150, 2), gC = DLD.drawGate(g, "AND", 330, 240, 2);
      const busX = { A: 150, B: 175, C: 200 };
      ["A", "B", "C"].forEach((n, i) => { wire(wires, `M${110},${ys[i] - 8} H${busX[n]} V20 V270`, st.low[i]); });
      const tap = (n, p, v) => { wire(wires, `M${busX[n]},${p.y} H${p.x}`, v); S("circle", { cx: busX[n], cy: p.y, r: 3.5, fill: "var(--ink)" }, svg); };
      tap("A", gA.inputs[0], A); tap("B", gA.inputs[1], B); tap("A", gB.inputs[0], A); tap("C", gB.inputs[1], C); tap("B", gC.inputs[0], B); tap("C", gC.inputs[1], C);
      const gO = DLD.drawGate(g, "OR", 560, 150, 3);
      [[gA, ab, 60], [gB, ac, 150], [gC, bc, 240]].forEach(([gg, v, y], i) => wire(wires, `M${gg.output.x},${y} H520 V${gO.inputs[i].y} H${gO.inputs[i].x}`, v));
      [["G1 AB", ab, 45], ["G2 AC", ac, 135], ["G3 BC", bc, 225]].forEach(([t, v, y]) => S("text", { x: 420, y, class: "s-mono", style: "font-size:12px;font-weight:700;fill:var(--accent)", text: `${t}=${v}` }, svg));
      wire(wires, `M${gO.output.x},150 H720`, x);
      lamp(svg, 750, 150, x, 20);
      S("text", { x: 750, y: 195, "text-anchor": "middle", class: "s-text", style: "font-size:12px;font-weight:700", text: x ? "⚠ เตือน!" : "ปกติ" }, svg);
      const n = st.low.reduce((a, b) => a + b, 0);
      msg.className = "callout " + (x ? "warn" : "tip");
      msg.innerHTML = `ถังที่ต่ำกว่าขีด: ${n} ถัง → X = AB + AC + BC = ${ab} + ${ac} + ${bc} = <b>${x}</b> ${x ? "— Low-level indicator ทำงาน" : ""}` + (n === 3 ? "<br><small>ต่ำทั้ง 3 ถังก็เตือนเช่นกัน (G1, G2, G3 เป็น 1 ทุกตัว)</small>" : "");
    }
    draw();
  };

  /* =====================================================
     3) สร้างวงจร AND-OR จากนิพจน์หรือตารางค่าความจริง (6.1.3–6.1.5)
     ===================================================== */
  function sopTerms(e) { // returns array of literal arrays if e is SOP, else null
    const isLit = (x) => x.t === "var" || (x.t === "not" && x.a.t === "var");
    const term = (x) => (isLit(x) ? [x] : x.t === "and" && x.a.every(isLit) ? x.a : null);
    const ts = e.t === "or" ? e.a.map(term) : [term(e)];
    return ts.every(Boolean) ? ts : null;
  }
  const litOf = (l) => (l.t === "var" ? { v: l.n, neg: false } : { v: l.a.n, neg: true });
  function drawSOP(svg, vars, terms, env) {
    svg.innerHTML = "";
    const rails = [];
    vars.forEach((v) => { rails.push({ v, neg: false }); if (terms.some((t) => t.some((l) => l.v === v && l.neg))) rails.push({ v, neg: true }); });
    const rx = (r) => 40 + rails.indexOf(r) * 40;
    const railOf = (l) => rails.find((r) => r.v === l.v && r.neg === l.neg);
    const val = (r) => (r.neg ? 1 - env[r.v] : env[r.v]) ? 1 : 0;
    const gx = 40 + rails.length * 40 + 60;
    const heights = terms.map((t) => Math.max(56, t.length * 24) + 22);
    const top = 70, total = heights.reduce((a, b) => a + b, 0);
    const Hh = Math.max(top + total + 20, 200);
    svg.setAttribute("viewBox", `0 0 ${gx + 360} ${Hh}`);
    const wires = S("g", null, svg), g = S("g", null, svg);
    rails.forEach((r) => {
      const x = rx(r), v = val(r);
      wire(wires, `M${x},${r.neg ? top - 12 : top - 40} V${Hh - 14}`, v);
      if (r.neg) { // inverter แนวตั้งจากราง v ลงมาเป็นราง v'
        const src = rx(rails.find((q) => q.v === r.v && !q.neg));
        wire(wires, `M${src},${top - 40} H${x} V${top - 34}`, env[r.v]);
        S("circle", { cx: src, cy: top - 40, r: 3.5, fill: "var(--ink)" }, svg);
        S("path", { d: `M${x - 9},${top - 34} L${x + 9},${top - 34} L${x},${top - 19} Z`, class: "s-gate" }, g);
        S("circle", { cx: x, cy: top - 16, r: 3, class: "s-gate" }, g);
      }
      S("text", { x, y: r.neg ? top - 46 : top - 50, "text-anchor": "middle", class: "s-mono", style: "font-size:14px;font-weight:700;fill:var(--ink)", text: r.neg ? "" : `${r.v}=${env[r.v] ? 1 : 0}` }, svg);
      if (r.neg) S("text", { x: x + 12, y: top - 4, class: "s-mono", style: "font-size:11px;fill:var(--ink-3)", text: r.v + "'" }, svg);
    });
    let y = top, outs = [];
    terms.forEach((t, i) => {
      const cy = y + heights[i] / 2;
      if (t.length === 1) {
        const r = railOf(t[0]); outs.push({ x: rx(r), y: cy, v: val(r), direct: true });
        S("circle", { cx: rx(r), cy, r: 3.5, fill: "var(--ink)" }, svg);
      } else {
        const geo = DLD.drawGate(g, "AND", gx, cy, t.length);
        t.forEach((l, k) => { const r = railOf(l), p = geo.inputs[k]; wire(wires, `M${rx(r)},${p.y} H${p.x}`, val(r)); S("circle", { cx: rx(r), cy: p.y, r: 3.5, fill: "var(--ink)" }, svg); });
        outs.push({ x: geo.output.x, y: cy, v: t.every((l) => val(railOf(l))) ? 1 : 0 });
      }
      y += heights[i];
    });
    const out = outs.some((o) => o.v) ? 1 : 0;
    const midY = top + total / 2;
    let outX;
    if (outs.length > 1) {
      const ox = gx + 170;
      const geo = DLD.drawGate(g, "OR", ox, midY, outs.length);
      outs.forEach((o, i) => wire(wires, `M${o.x},${o.y} H${ox - 30} V${geo.inputs[i].y} H${geo.inputs[i].x}`, o.v));
      outX = geo.output.x;
      wire(wires, `M${outX},${midY} H${outX + 50}`, out);
    } else { outX = outs[0].x; wire(wires, `M${outX},${outs[0].y} H${gx + 250}`, out); outX = gx + 200; }
    lamp(svg, outX + 70, midY, out);
    S("text", { x: outX + 70, y: midY + 40, "text-anchor": "middle", class: "s-mono", style: "font-weight:700", text: "X=" + out }, svg);
    const inv = rails.filter((r) => r.neg).length, ands = terms.filter((t) => t.length > 1).length, ors = terms.length > 1 ? 1 : 0;
    return { inv, ands, ors, total: inv + ands + ors, out };
  }
  W.sopcircuit = function (el) {
    const body = U.shell(el, "INTERACTIVE", "สร้างวงจร AND-OR จากนิพจน์หรือจากตารางค่าความจริง",
      "พิมพ์นิพจน์ SOP หรือเลือกตัวอย่าง ระบบจะวาดวงจร (inverter → AND → OR) ให้อัตโนมัติ · แท็บ “จากตารางค่าความจริง” ให้คลิกเอาต์พุต · กด “ลดรูป” เพื่อเทียบจำนวนเกท (บทที่ 5) · พิมพ์: AB = AND · A+B = OR · A' = NOT");
    const st = { tab: el.dataset.tab || "expr", src: el.dataset.expr || "AB' + A'B", n: 3, tt: [0, 0, 0, 1, 1, 0, 0, 0], min: false, env: { A: 1, B: 0, C: 1, D: 0, E: 0 } };
    const ctr = H("div", { class: "controls" });
    const tabSeg = U.seg([["expr", "จากนิพจน์"], ["tt", "จากตารางค่าความจริง"]], st.tab, (t) => { st.tab = t; st.min = false; draw(); });
    const minBtn = U.btn("ลดรูป", () => { st.min = !st.min; draw(); });
    ctr.append(tabSeg, minBtn);
    const inp = U.input("นิพจน์ SOP:", st.src, (s) => { st.src = s; st.min = false; draw(); }, { width: 300 });
    const pre = H("div", { class: "controls" });
    [["XOR (รูป 6.3)", "AB' + A'B"], ["XNOR (รูป 6.4 ข)", "A'B' + AB"], ["AB + CDE (รูป 6.5)", "AB + CDE"], ["รูป 6.6 (ข)", "ABCD' + ABEF"], ["ตย. 6.2", "A'BC + AB'C + ABC'"], ["ตย. 6.3", "A'BCD + AB'CD + ABC'D + ABCD'"], ["ตย. 6.5", "AB'C' + ABC'D' + A'B'C'D + A'B'C'D'"]].forEach(([t, v]) =>
      pre.appendChild(U.btn(t, () => { st.tab = "expr"; tabSeg.set("expr"); inp.input.value = st.src = v; st.min = false; draw(); })));
    const ttBox = H("div", { style: "flex:0 0 auto" });
    const tg = H("div");
    const svg = S("svg");
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    const row = H("div", { style: "display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start" });
    const right = H("div", { style: "flex:1 1 340px;min-width:0" });
    right.append(tg, svg, msg); row.append(ttBox, right);
    body.append(ctr, inp, pre, row);
    function draw() {
      inp.style.display = pre.style.display = st.tab === "expr" ? "" : "none";
      ttBox.style.display = st.tab === "tt" ? "" : "none";
      let vars, terms, note = "", expr;
      if (st.tab === "expr") {
        const p = parse(st.src); inp.input.classList.toggle("bad", !!p.err);
        if (p.err) { msg.innerHTML = p.err; svg.innerHTML = ""; return; }
        vars = BL.vars(p.e);
        if (vars.length > 6) { msg.innerHTML = "ไม่เกิน 6 ตัวแปร"; return; }
        terms = sopTerms(p.e);
        expr = p.e;
        if (!terms || st.min) {
          const ones = BL.combos(vars).map((env, i) => (BL.eval(p.e, env) ? i : -1)).filter((i) => i >= 0);
          const m = BL.minimize(vars.length, ones).sort((a, b) => b.cells.length - a.cells.length);
          if (!terms) note = "นิพจน์ไม่อยู่ในรูป SOP — วาดจากรูป SOP ที่เทียบเท่า (เล็กที่สุด) แทน · ";
          terms = m.map((g) => [...g.pat].map((c, k) => (c === "-" ? null : { v: vars[k], neg: c === "0" })).filter(Boolean));
        } else terms = terms.map((t) => t.map(litOf));
      } else {
        vars = DLD.letters(st.n);
        ttBox.innerHTML = "";
        const segN = U.seg([[3, "3 ตัวแปร"], [4, "4 ตัวแปร"]], st.n, (n) => { st.n = n; st.tt = Array(1 << n).fill(0); st.min = false; draw(); });
        ttBox.append(segN);
        const t = H("table", { class: "data", style: "text-align:center;margin-top:8px" });
        t.innerHTML = `<tr>${vars.map((v) => `<th>${v}</th>`).join("")}<th>X</th></tr>` + st.tt.map((o, i) => `<tr>${[...i.toString(2).padStart(st.n, "0")].map((b) => `<td style="padding:1px 8px">${b}</td>`).join("")}<td data-i="${i}" style="cursor:pointer;font-weight:700;padding:1px 10px;color:${o ? "var(--hi)" : "var(--ink-3)"};background:${o ? "var(--hi-soft)" : ""}">${o}</td></tr>`).join("");
        const wrapT = H("div", { style: "max-height:260px;overflow:auto;display:inline-block" }); wrapT.appendChild(t); ttBox.appendChild(wrapT);
        t.querySelectorAll("td[data-i]").forEach((td) => td.addEventListener("click", () => { st.tt[+td.dataset.i] ^= 1; st.min = false; draw(); }));
        const ones = st.tt.map((o, i) => (o ? i : -1)).filter((i) => i >= 0);
        if (!ones.length) { svg.innerHTML = ""; msg.innerHTML = "คลิกช่อง X เพื่อกำหนดแถวที่เอาต์พุตเป็น 1"; tg.innerHTML = ""; return; }
        terms = st.min ? BL.minimize(st.n, ones).sort((a, b) => b.cells.length - a.cells.length).map((g) => [...g.pat].map((c, k) => (c === "-" ? null : { v: vars[k], neg: c === "0" })).filter(Boolean))
          : ones.map((i) => [...i.toString(2).padStart(st.n, "0")].map((b, k) => ({ v: vars[k], neg: b === "0" })));
      }
      minBtn.textContent = st.min ? "แสดงแบบก่อนลดรูป" : "ลดรูป (แผนผังคาร์โนห์)";
      tg.innerHTML = ""; tg.appendChild(toggles(vars, st.env, draw));
      const env = {}; vars.forEach((v) => (env[v] = st.env[v] ? 1 : 0));
      const c = drawSOP(svg, vars, terms, env);
      const exprHTML = terms.map((t) => t.map((l) => (l.neg ? `<span class="ov">${l.v}</span>` : l.v)).join("")).join(" + ") || "0";
      msg.innerHTML = note + `X = ${X(exprHTML)}<br>ใช้ inverter ${c.inv} ตัว · AND ${c.ands} ตัว · OR ${c.ors} ตัว → รวม <b>${c.total}</b> · ระดับเกทจากอินพุตถึงเอาต์พุตไม่เกิน ${(c.inv ? 1 : 0) + (c.ands ? 1 : 0) + c.ors} ชั้น`;
    }
    draw();
  };

  /* =====================================================
     4) ผังเวลาของวงจรคอมไบเนชัน (6.2)
     ===================================================== */
  W.waveckt = function (el) {
    const body = U.shell(el, "INTERACTIVE", "วงจรคอมไบเนชันกับอินพุตที่เป็นสัญญาณพัลส์",
      "เลือกวงจร (นิพจน์) แล้วคลิกช่องของรูปคลื่นอินพุตเพื่อสลับ 0/1 — ระบบแสดงสัญญาณระหว่างทางของแต่ละเกทและเอาต์พุต X ทีละช่วงเวลา · ตารางค่าความจริงของวงจรไม่เปลี่ยน ไม่ว่าอินพุตจะเป็นพัลส์หรือไม่");
    const st = { src: "(A(B + C))'", sig: {} };
    const ctr = H("div", { class: "controls" });
    const inp = U.input("นิพจน์:", st.src, (s) => { st.src = s; draw(); }, { width: 220 });
    ctr.append(inp);
    [["ตย. 6.6", "(A(B + C))'"], ["ตย. 6.7 (XNOR)", "AB + A'B'"], ["XOR", "AB' + A'B"], ["AND-OR", "AB + CD"], ["AND-OR-Invert", "(AB + CD)'"]].forEach(([t, v]) => ctr.appendChild(U.btn(t, () => { inp.input.value = st.src = v; draw(); })));
    const svg = S("svg");
    const msg = H("div", { class: "callout tip", style: "margin-bottom:0" });
    body.append(ctr, svg, msg);
    const DEF = { A: [0, 1, 1, 1, 0, 1, 1, 0, 1, 0], B: [0, 0, 1, 1, 0, 0, 1, 1, 1, 0], C: [1, 0, 0, 1, 1, 0, 1, 0, 1, 0], D: [0, 1, 0, 1, 0, 1, 1, 0, 0, 1] };
    function draw() {
      const p = parse(st.src); inp.input.classList.toggle("bad", !!p.err);
      if (p.err) { msg.innerHTML = p.err; return; }
      const vars = BL.vars(p.e);
      if (vars.length > 4) { msg.innerHTML = "ไม่เกิน 4 ตัวแปร"; return; }
      vars.forEach((v) => { if (!st.sig[v]) st.sig[v] = (DEF[v] || DEF.A).slice(); });
      const mids = BL.subterms(p.e).filter((x) => BL.text(x) !== BL.text(p.e) && !(x.t === "not" && x.a.t === "var"));
      const rows = [...vars.map((v) => ({ label: v, bits: st.sig[v], edit: v })),
        ...mids.map((m, i) => ({ label: "Y" + (i + 1), sub: BL.text(m), bits: [...Array(10)].map((_, t) => BL.eval(m, Object.fromEntries(vars.map((v) => [v, st.sig[v][t]])))), mid: true })),
        { label: "X", sub: BL.text(p.e), bits: [...Array(10)].map((_, t) => BL.eval(p.e, Object.fromEntries(vars.map((v) => [v, st.sig[v][t]])))), out: true }];
      const rowH = 46, X0 = 170, step = 70;
      svg.setAttribute("viewBox", `0 0 ${X0 + 10 * step + 20} ${rows.length * rowH + 30}`);
      svg.innerHTML = "";
      for (let i = 0; i <= 10; i++) S("line", { x1: X0 + i * step, x2: X0 + i * step, y1: 4, y2: rows.length * rowH + 4, class: "s-dim" }, svg);
      rows.forEach((r, k) => {
        const yH = 10 + k * rowH, yL = yH + 26;
        S("text", { x: 8, y: yL - 6, class: "s-mono", style: `font-weight:700;fill:${r.out ? "var(--hi)" : r.mid ? "var(--accent)" : "var(--ink)"}`, text: r.label }, svg);
        if (r.sub) S("text", { x: 36, y: yL - 6, class: "s-mono", style: "font-size:11px;fill:var(--ink-3)", text: "= " + (r.sub.length > 16 ? r.sub.slice(0, 15) + "…" : r.sub) }, svg);
        S("path", { d: DLD.wavePath(r.bits, X0, step, yH, yL), class: r.out ? "s-hi" : r.mid ? "s-wave2" : "s-wave", "stroke-width": r.mid ? 1.8 : 2.5 }, svg);
        if (r.edit) for (let t = 0; t < 10; t++) {
          const hit = S("rect", { x: X0 + t * step, y: yH - 6, width: step, height: 38, fill: "transparent", style: "cursor:pointer" }, svg);
          hit.addEventListener("click", () => { st.sig[r.edit][t] ^= 1; draw(); });
        }
      });
      for (let t = 0; t < 10; t++) S("text", { x: X0 + t * step + step / 2, y: rows.length * rowH + 22, "text-anchor": "middle", class: "s-mono", style: "font-size:11px;fill:var(--ink-3)", text: "t" + (t + 1) }, svg);
      const lows = rows[rows.length - 1].bits.map((b, t) => (b ? null : "t" + (t + 1))).filter(Boolean);
      msg.innerHTML = `X = ${X(BL.html(p.e))} · สัญญาณระหว่างทาง: ${mids.map((m, i) => `Y${i + 1} = ${BL.html(m)}`).join(", ") || "—"}<br><small>X เป็น LOW ในช่วง ${lows.join(", ") || "—"}</small>`;
    }
    draw();
  };
})();
