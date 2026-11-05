/* =========================================================
   บทที่ 11 — interactive widgets (วงจรตรรกะแบบโปรแกรมได้)
   pla · lut · flow
   ขีดบน: HTML ใช้ <span class="ov"> · SVG ใช้ {X} ใน txt() — ไม่ใช้อักขระผสม
   ========================================================= */
(function () {
  const DLD = window.DLD, U = DLD.ui, W = DLD.widgets, BL = DLD.bool;
  const H = (...a) => DLD.h(...a);
  const S = (...a) => DLD.svg(...a);
  const OV = (t) => `<span class="ov">${t}</span>`;
  const hl = (on) => (on ? ' style="background:var(--brand-soft);font-weight:700"' : "");
  const bin = (v, n) => v.toString(2).padStart(n, "0");
  const txt = (g, x, y, t, o) => {
    o = o || {};
    const el = S("text", { x, y, "text-anchor": o.a || "start", class: "s-mono", style: `font-size:${o.size || 14}px;font-weight:${o.w || 700};fill:${o.c || "var(--ink)"}` }, g);
    String(t).split(/(\{[^}]*\})/).forEach((p) => { if (!p) return; S("tspan", p[0] === "{" ? { text: p.slice(1, -1), style: "text-decoration:overline" } : { text: p }, el); });
    return el;
  };
  const wire = (g, d, v) => S("path", { d, class: v ? "s-wire1" : "s-wire0" }, g);
  const lamp = (g, x, y, v, r) => { if (v) S("circle", { cx: x, cy: y, r: (r || 13) + 8, fill: "var(--hi)", opacity: 0.2 }, g); S("circle", { cx: x, cy: y, r: r || 13, fill: v ? "var(--hi)" : "var(--surface-2)", stroke: "var(--ink-3)", "stroke-width": 2 }, g); };
  function toggles(vars, env, onChange) {
    const row = H("div", { class: "controls" });
    vars.forEach((v) => { const b = H("button", { type: "button", class: "btn sm", "aria-pressed": String(!!env[v]) }, `${v} = ${env[v] ? 1 : 0}`); b.addEventListener("click", () => { env[v] ^= 1; onChange(); }); row.appendChild(b); });
    return row;
  }

  /* =====================================================
     1) PAL / PLA: AND array และ OR array ที่โปรแกรมได้ (11.2.1)
     ===================================================== */
  const LIT = ["A", "{A}", "B", "{B}", "C", "{C}"]; // คอลัมน์ literal
  const litHTML = (k) => (k % 2 ? OV("ABC"[k >> 1]) : "ABC"[k >> 1]);
  const NP = 8;
  // พจน์ระบุเป็นสตริง เช่น "A'BC" → ชุด literal
  const term = (s) => { const r = Array(6).fill(false); s.replace(/([ABC])('?)/g, (_, v, n) => { r["ABC".indexOf(v) * 2 + (n ? 1 : 0)] = true; }); return r; };
  const PRE = {
    fa: { name: "Full adder (PAL)", and: ["A'B'C", "A'BC'", "AB'C'", "ABC", "AB", "AC", "BC", ""], or: [[1, 0], [1, 0], [1, 0], [1, 0], [0, 1], [0, 1], [0, 1], [0, 1]], out: ["S", "Cout"] },
    xor: { name: "XOR / XNOR", and: ["AB'", "A'B", "", "", "A'B'", "AB", "", ""], or: [[1, 0], [1, 0], [1, 0], [1, 0], [0, 1], [0, 1], [0, 1], [0, 1]], out: ["F1", "F2"] },
    share: { name: "ใช้พจน์ร่วมกัน (PLA)", and: ["AB", "C", "B'C", "", "", "", "", ""], or: [[1, 1], [1, 0], [0, 1], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]], out: ["F1", "F2"], pla: true },
    clear: { name: "ล้าง", and: Array(NP).fill(""), or: [[1, 0], [1, 0], [1, 0], [1, 0], [0, 1], [0, 1], [0, 1], [0, 1]], out: ["F1", "F2"] },
  };
  W.pla = function (el) {
    const st = { pla: false, env: { A: 1, B: 0, C: 1 }, and: [], or: [], out: ["F1", "F2"] };
    const load = (k) => { const p = PRE[k]; st.and = p.and.map(term); st.or = p.or.map((r) => r.slice()); st.out = p.out; if (p.pla !== undefined) { st.pla = p.pla; seg.set(st.pla); } else if (k !== "clear") { st.pla = false; seg.set(false); } };
    const body = U.shell(el, "INTERACTIVE", "SPLD: AND array และ OR array ที่โปรแกรมได้ (รูปที่ 11.2)",
      "คลิกจุดตัดใน AND array เพื่อ “ต่อ/ตัด” ฟิวส์ (✕ = ต่อ) · <b>PAL</b>: OR array ตายตัว (พจน์ 1–4 → F1, 5–8 → F2) · <b>PLA</b>: คลิกจุดตัดใน OR array ได้ด้วย จึงใช้พจน์ร่วมกันได้ · GAL คือ PAL ที่ลบแล้วโปรแกรมใหม่ได้");
    const ctr = H("div", { class: "controls" });
    const seg = U.seg([[false, "PAL (OR ตายตัว)"], [true, "PLA (OR โปรแกรมได้)"]], st.pla, (v) => { st.pla = v; if (!v) st.or = PRE.clear.or.map((r) => r.slice()); draw(); });
    ctr.append(seg);
    Object.entries(PRE).forEach(([k, p]) => ctr.append(U.btn(p.name, () => { load(k); draw(); })));
    const tg = H("div");
    const svg = S("svg", { viewBox: "0 0 660 430", style: "max-width:660px;flex:1 1 380px;min-width:0" });
    const side = H("div", { style: "flex:1 1 220px;min-width:0" });
    const row = H("div", { style: "display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start" }); row.append(svg, side);
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, tg, row, msg);
    load("fa");
    const litVal = (k, env) => { const v = env["ABC"[k >> 1]]; return k % 2 ? 1 - v : v; };
    const prodVal = (p, env) => st.and[p].some(Boolean) && st.and[p].every((c, k) => !c || litVal(k, env)) ? 1 : 0;
    const outVal = (o, env) => (st.or.some((r, p) => r[o] && prodVal(p, env)) ? 1 : 0);
    function draw() {
      tg.innerHTML = ""; tg.append(toggles(["A", "B", "C"], st.env, draw));
      svg.innerHTML = "";
      const wires = S("g", null, svg), g = S("g", null, svg);
      const LX = (k) => 110 + k * 46, PY = (p) => 70 + p * 36, AX = 400, OX = (o) => 500 + o * 70, OY = 380;
      // อินพุตและ inverter
      ["A", "B", "C"].forEach((v, i) => {
        const val = st.env[v], xT = LX(i * 2), xN = LX(i * 2 + 1);
        txt(svg, xT + 2, 18, `${v}=${val}`, { a: "middle", size: 12 });
        wire(wires, `M${xT},24 V${PY(NP - 1) + 14}`, val);
        wire(wires, `M${xT},34 H${xN} V40`, val);
        S("path", { d: `M${xN - 7},40 L${xN + 7},40 L${xN},51 Z`, class: "s-gate" }, g); S("circle", { cx: xN, cy: 54, r: 2.6, class: "s-gate" }, g);
        wire(wires, `M${xN},57 V${PY(NP - 1) + 14}`, 1 - val);
      });
      for (let p = 0; p < NP; p++) {
        const y = PY(p), pv = prodVal(p, st.env), used = st.and[p].some(Boolean);
        wire(wires, `M${LX(0) - 14},${y} H${AX}`, pv);
        S("path", { d: `M${AX},${y - 11} H${AX + 12} A11,11 0 0 1 ${AX + 12},${y + 11} H${AX} Z`, class: "s-gate" }, g);
        txt(svg, LX(0) - 22, y + 4, `P${p + 1}`, { a: "end", size: 11, w: 400, c: used ? "var(--ink)" : "var(--ink-3)" });
        LIT.forEach((_, k) => {
          const on = st.and[p][k], x = LX(k);
          const hit = S("g", { style: "cursor:pointer" }, svg);
          S("circle", { cx: x, cy: y, r: 9, fill: "transparent" }, hit);
          if (on) S("path", { d: `M${x - 5},${y - 5} L${x + 5},${y + 5} M${x + 5},${y - 5} L${x - 5},${y + 5}`, stroke: "var(--accent)", "stroke-width": 2.6 }, hit);
          else S("circle", { cx: x, cy: y, r: 2.4, fill: "var(--ink-3)" }, hit);
          hit.addEventListener("click", () => { st.and[p][k] = !st.and[p][k]; draw(); });
        });
        // OR array
        wire(wires, `M${AX + 23},${y} H${OX(1) + 14}`, pv);
        [0, 1].forEach((o) => {
          const on = st.or[p][o], x = OX(o);
          const hit = S("g", { style: st.pla ? "cursor:pointer" : "" }, svg);
          S("circle", { cx: x, cy: y, r: 9, fill: "transparent" }, hit);
          if (on) S("path", { d: `M${x - 5},${y - 5} L${x + 5},${y + 5} M${x + 5},${y - 5} L${x - 5},${y + 5}`, stroke: st.pla ? "var(--accent)" : "var(--ink-2)", "stroke-width": st.pla ? 2.6 : 2 }, hit);
          else S("circle", { cx: x, cy: y, r: 2.4, fill: "var(--ink-3)" }, hit);
          if (st.pla) hit.addEventListener("click", () => { st.or[p][o] = !st.or[p][o]; draw(); });
        });
      }
      if (!st.pla) S("rect", { x: OX(0) - 22, y: PY(0) - 20, width: 112, height: PY(NP - 1) - PY(0) + 40, rx: 8, fill: "var(--surface-2)", opacity: 0.35, stroke: "var(--ink-3)", "stroke-dasharray": "4 4" }, svg);
      txt(svg, (LX(0) + LX(5)) / 2, PY(NP - 1) + 34, "AND array (โปรแกรมได้)", { a: "middle", size: 12, w: 400, c: "var(--accent)" });
      txt(svg, (OX(0) + OX(1)) / 2, 50, st.pla ? "OR array (โปรแกรมได้)" : "OR array (ตายตัว)", { a: "middle", size: 11, w: 400, c: st.pla ? "var(--accent)" : "var(--ink-3)" });
      [0, 1].forEach((o) => {
        const v = outVal(o, st.env), x = OX(o);
        wire(wires, `M${x},${PY(0) - 10} V${OY - 22}`, v);
        S("path", { d: `M${x - 14},${OY - 22} Q${x},${OY - 14} ${x + 14},${OY - 22} Q${x + 12},${OY} ${x},${OY + 8} Q${x - 12},${OY} ${x - 14},${OY - 22} Z`, class: "s-gate" }, g);
        lamp(svg, x, OY + 26, v, 10); txt(svg, x + 16, OY + 31, `${st.out[o]}=${v}`, { size: 12 });
      });
      // นิพจน์และตาราง
      const termHTML = (p) => st.and[p].map((c, k) => (c ? litHTML(k) : "")).join("");
      const expr = (o) => { const ps = st.or.map((r, p) => (r[o] && st.and[p].some(Boolean) ? termHTML(p) : null)).filter(Boolean); return ps.length ? ps.join(" + ") : "0"; };
      const cur = st.env.A * 4 + st.env.B * 2 + st.env.C;
      side.innerHTML = `<div class="mono" style="font-size:15px;line-height:1.7">${st.out[0]} = ${expr(0)}<br>${st.out[1]} = ${expr(1)}</div>` +
        `<table class="data" style="text-align:center;width:auto;font-size:13px;margin-top:6px"><tr><th>ABC</th><th>${st.out[0]}</th><th>${st.out[1]}</th></tr>` +
        [...Array(8)].map((_, i) => { const env = { A: i >> 2, B: (i >> 1) & 1, C: i & 1 }; return `<tr${hl(i === cur)}><td class="mono">${bin(i, 3)}</td><td>${outVal(0, env)}</td><td>${outVal(1, env)}</td></tr>`; }).join("") + "</table>";
      const shared = st.or.filter((r, p) => r[0] && r[1] && st.and[p].some(Boolean)).length;
      const usedP = st.and.filter((r) => r.some(Boolean)).length;
      msg.innerHTML = `ใช้พจน์ผลคูณ ${usedP} จาก ${NP} เส้น` + (st.pla ? (shared ? ` · มี <b>${shared} พจน์ที่ใช้ร่วมกัน</b>ทั้ง ${st.out[0]} และ ${st.out[1]} — ทำได้เฉพาะ PLA` : " · ลองคลิกจุดตัดใน OR array ให้พจน์หนึ่งต่อเข้าทั้งสองเอาต์พุต") :
        " · PAL: แต่ละเอาต์พุตมีพจน์ของตัวเอง 4 พจน์ (ใช้ร่วมกันไม่ได้) — เป็นโครงสร้าง SOP เดียวกับบทที่ 5–6");
    }
    draw();
  };

  /* =====================================================
     2) FPGA logic block: LUT 3 อินพุต + D flip-flop (11.2.3)
     ===================================================== */
  W.lut = function (el) {
    const st = { bits: [0, 0, 0, 1, 0, 1, 1, 1], env: { A: 1, B: 1, C: 0 }, reg: false, q: 0, src: "AB + AC + BC" };
    const body = U.shell(el, "INTERACTIVE", "บล็อกลอจิกของ FPGA: Look-Up Table (LUT) 3 อินพุต + D flip-flop (รูปที่ 11.6)",
      "LUT คือหน่วยความจำ 8 บิต (SRAM) ที่เก็บ<b>ตารางค่าความจริง</b>ของฟังก์ชัน · อินพุต A, B, C เป็นขา select ของ MUX เลือกบิตออกมา · คลิกบิตเพื่อโปรแกรมเอง หรือพิมพ์นิพจน์ · เลือกให้เอาต์พุตผ่าน D flip-flop (registered) ได้");
    const ctr = H("div", { class: "controls" });
    const inp = U.input("นิพจน์:", st.src, (s) => { st.src = s; fromExpr(); draw(); }, { width: 170 });
    ctr.append(inp);
    [["AND3", "ABC"], ["OR3", "A + B + C"], ["XOR3 (parity)", "A ^ B ^ C"], ["Majority", "AB + AC + BC"]].forEach(([t, v]) => ctr.append(U.btn(t, () => { inp.input.value = st.src = v; fromExpr(); draw(); })));
    const ctr2 = H("div", { class: "controls" });
    const tg = H("span");
    const clk = U.btn("พัลส์นาฬิกา ↑", () => { st.q = st.bits[idx()]; draw(); });
    ctr2.append(tg, U.seg([[false, "เอาต์พุตตรง (combinational)"], [true, "ผ่าน D FF (registered)"]], st.reg, (v) => { st.reg = v; draw(); }), clk);
    const svg = S("svg", { viewBox: "0 0 620 330", style: "max-width:620px" });
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, ctr2, svg, msg);
    const idx = () => st.env.A * 4 + st.env.B * 2 + st.env.C;
    function fromExpr() {
      inp.input.classList.remove("bad");
      try { const e = BL.parse(st.src); const vs = BL.vars(e); if (vs.some((v) => !"ABC".includes(v))) throw 0; st.bits = [...Array(8)].map((_, i) => (BL.eval(e, { A: i >> 2, B: (i >> 1) & 1, C: i & 1 }) ? 1 : 0)); }
      catch (e) { inp.input.classList.add("bad"); }
    }
    function draw() {
      tg.innerHTML = ""; tg.append(toggles(["A", "B", "C"], st.env, draw));
      clk.style.display = st.reg ? "" : "none";
      svg.innerHTML = "";
      const wires = S("g", null, svg), g = S("g", null, svg);
      const i0 = idx(), sel = st.bits[i0];
      txt(svg, 70, 18, "SRAM (LUT)", { a: "middle", size: 11, w: 400, c: "var(--ink-3)" });
      st.bits.forEach((b, i) => {
        const y = 30 + i * 32, on = i === i0;
        const cell = S("g", { style: "cursor:pointer" }, svg);
        S("rect", { x: 46, y, width: 48, height: 26, rx: 4, class: "s-gate", style: on ? "stroke:var(--accent);stroke-width:3" : "" }, cell);
        txt(cell, 70, y + 18, String(b), { a: "middle", size: 15, c: b ? "var(--hi)" : "var(--ink-3)" });
        cell.addEventListener("click", () => { st.bits[i] ^= 1; st.src = ""; inp.input.value = ""; draw(); });
        txt(svg, 40, y + 17, bin(i, 3), { a: "end", size: 11, w: 400, c: on ? "var(--accent)" : "var(--ink-3)" });
        wire(wires, `M94,${y + 13} H200`, on ? b : 0);
      });
      // MUX
      S("path", { d: "M200,24 L262,64 L262,262 L200,302 Z", class: "s-gate" }, g);
      txt(g, 231, 168, "MUX", { a: "middle", size: 12 }); txt(g, 231, 184, "8:1", { a: "middle", size: 11, w: 400 });
      ["A", "B", "C"].forEach((v, k) => { const x = 214 + k * 18; wire(wires, `M${x},${300 - k * 2} V318`, st.env[v]); txt(svg, x, 330, v, { a: "middle", size: 11 }); });
      wire(wires, "M262,163 H330", sel);
      // D FF
      const out = st.reg ? st.q : sel;
      S("rect", { x: 330, y: 128, width: 80, height: 74, rx: 6, class: "s-gate", style: st.reg ? "" : "opacity:.35" }, g);
      txt(g, 338, 152, "D", { size: 12 }); txt(g, 396, 152, "Q", { size: 12 });
      S("path", { d: "M330,176 L340,182 L330,188", fill: "none", class: "s-gate" }, g); txt(svg, 312, 186, "CLK", { a: "end", size: 10, w: 400, c: "var(--ink-3)" });
      txt(svg, 370, 222, `Q = ${st.q}`, { a: "middle", size: 11, w: 400, c: "var(--ink-3)" });
      // MUX เลือกเอาต์พุต (combinational / registered)
      wire(wires, "M300,163 V250 H450", st.reg ? 0 : sel);
      wire(wires, "M410,148 H450", st.reg ? st.q : 0);
      S("path", { d: "M450,130 L478,146 L478,262 L450,278 Z", class: "s-gate" }, g);
      txt(g, 464, 204, "M", { a: "middle", size: 10 });
      wire(wires, `M478,204 H540`, out); lamp(svg, 560, 204, out, 13); txt(svg, 560, 240, `F=${out}`, { a: "middle", size: 13 });
      const nOnes = st.bits.reduce((a, b) => a + b, 0);
      msg.innerHTML = `ABC = ${bin(i0, 3)} → MUX เลือก SRAM บิตที่ ${i0} = <b>${sel}</b>` + (st.reg ? ` · โหมด registered: F = Q = ${st.q} (เปลี่ยนเมื่อกดพัลส์นาฬิกา)` : "") +
        `<br>เนื้อหา LUT: <span class="mono">${st.bits.join("")}</span> (${nOnes} แถวเป็น 1) · LUT 3 อินพุตสร้างได้<b>ทุก</b>ฟังก์ชัน 3 ตัวแปร = 2<sup>8</sup> = 256 แบบ — FPGA มีบล็อกแบบนี้นับหมื่นถึงล้านบล็อก (fine-grained)`;
    }
    fromExpr(); draw();
  };

  /* =====================================================
     3) โฟลว์การออกแบบ (รูปที่ 11.8)
     ===================================================== */
  const CODE_OK = "assign y = (a & b) | (a & c) | (b & c);";
  const CODE_BUG = "assign y = (a & b) | (a & c) | (b | c);   // บั๊ก: ควรเป็น b & c";
  W.flow = function (el) {
    const st = { step: 1, bug: false };
    const body = U.shell(el, "INTERACTIVE", "โฟลว์การออกแบบ: ตัวอย่างวงจร majority (เสียงข้างมาก 3 อินพุต)",
      "คลิกแต่ละขั้นตอนเพื่อดูผลลัพธ์ของขั้นนั้น · เปิด “ใส่บั๊ก” ในขั้น design entry แล้วดูว่า functional simulation จับได้อย่างไร — ต้องย้อนกลับไปแก้ก่อนไปขั้นถัดไป");
    const STEPS = ["1 Design entry", "2 Functional sim", "3 Synthesis", "4 Implementation", "5 Timing sim", "6 Download"];
    const seg = U.seg(STEPS.map((s, i) => [i + 1, s]), st.step, (v) => { st.step = v; draw(); });
    const ctr = H("div", { class: "controls" });
    ctr.append(seg, U.btn("ถัดไป ▶", () => { if (st.step < 6) { st.step++; seg.set(st.step); draw(); } }, "primary"));
    const out = H("div", { style: "min-height:240px;margin-top:8px" });
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, out, msg);
    const maj = (a, b, c) => (a & b) | (a & c) | (b & c), bug = (a, b, c) => (a & b) | (a & c) | (b | c);
    function wave(fn, delay) {
      const svg = S("svg", { viewBox: "0 0 700 190", style: "max-width:700px" });
      const step = 70, X0 = 70, combos = [...Array(8)].map((_, i) => [i >> 2, (i >> 1) & 1, i & 1]);
      const rows = [["a", combos.map((c) => c[0])], ["b", combos.map((c) => c[1])], ["c", combos.map((c) => c[2])], ["y", combos.map((c) => fn(...c))], ["คาด", combos.map((c) => maj(...c))]];
      rows.forEach(([n, b], i) => {
        const y = 8 + i * 34; txt(svg, 8, y + 17, n, { size: 12, c: i === 3 ? "var(--hi)" : i === 4 ? "var(--ink-3)" : "var(--ink)" });
        const d = delay && i === 3 ? delay : 0;
        S("path", { d: DLD.wavePath(b, X0 + d, step, y, y + 20), class: i === 3 ? "s-hi" : "s-wave2", "stroke-width": 2.2, style: i === 4 ? "stroke-dasharray:4 4" : "" }, svg);
      });
      combos.forEach((c, i) => { if (fn(...c) !== maj(...c)) S("rect", { x: X0 + i * step, y: 4, width: step, height: 176, fill: "#e03131", opacity: 0.15 }, svg); });
      return svg;
    }
    function draw() {
      out.innerHTML = "";
      const s = st.step, blocked = st.bug && s > 2;
      if (blocked) { out.append(H("div", { class: "callout warn" }, "การจำลองการทำงานยังไม่ผ่าน — ต้องย้อนกลับไปแก้ design entry ก่อน จึงจะสังเคราะห์วงจรได้ (ในโฟลว์จริงจะวนกลับจนกว่าผลจำลองถูกต้อง)")); msg.innerHTML = ""; return; }
      if (s === 1) {
        const b = U.btn(st.bug ? "เอาบั๊กออก" : "ใส่บั๊ก", () => { st.bug = !st.bug; draw(); });
        out.append(H("pre", { class: "mono", style: "font-size:15px;background:var(--surface-2);padding:12px;border-radius:8px;overflow:auto;margin:0 0 8px" },
          `module majority(input a, b, c, output y);\n  ${st.bug ? CODE_BUG : CODE_OK}\nendmodule`), b);
        msg.innerHTML = "อธิบายวงจรด้วยภาษา HDL (Verilog/VHDL — ข้อความ) หรือวาด schematic/ผังสถานะ (กราฟิก) · ขั้นนี้<b>ไม่ขึ้นกับชนิดอุปกรณ์</b> · จากนั้นคอมไพเลอร์แปลงเป็นออปเจคโค้ด";
      } else if (s === 2) {
        out.append(wave(st.bug ? bug : maj));
        msg.innerHTML = st.bug ? `<b style="color:#e03131">พบเอาต์พุตผิด</b> ในช่องสีแดง (เทียบกับเส้นประ “คาด”) → กลับไปแก้ขั้นที่ 1` : "ป้อนอินพุตครบ 8 กรณี (testbench) — เอาต์พุตตรงกับที่คาดทุกกรณี · ยังไม่คิดเวลาหน่วง (functional)";
      } else if (s === 3) {
        out.append(H("pre", { class: "mono", style: "font-size:14px;background:var(--surface-2);padding:12px;border-radius:8px;overflow:auto;margin:0" },
          "// netlist ระดับเกท (ไม่ขึ้นกับอุปกรณ์)\nAND2  g1 (.A(a), .B(b), .Y(n1));\nAND2  g2 (.A(a), .B(c), .Y(n2));\nAND2  g3 (.A(b), .B(c), .Y(n3));\nOR3   g4 (.A(n1), .B(n2), .C(n3), .Y(y));"));
        msg.innerHTML = "สังเคราะห์ (synthesis): แปลงคำอธิบายเป็น <b>netlist</b> — รายการเกตและการเชื่อมต่อในรูปแบบมาตรฐาน พร้อมลดรูปวงจรให้เหมาะสม";
      } else if (s === 4) {
        const svg = S("svg", { viewBox: "0 0 560 230", style: "max-width:560px" });
        for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
          const x = 30 + c * 85, y = 20 + r * 50, used = r === 1 && c === 2;
          S("rect", { x, y, width: 60, height: 32, rx: 5, fill: used ? "var(--hi-soft)" : "var(--surface)", stroke: used ? "var(--hi)" : "var(--line)", "stroke-width": used ? 2.5 : 1.2 }, svg);
          txt(svg, x + 30, y + 21, used ? "LUT" : "", { a: "middle", size: 12, c: "var(--hi)" });
        }
        S("path", { d: "M10,86 H200 M400,86 H550", stroke: "var(--accent)", "stroke-width": 2.5, fill: "none" }, svg);
        txt(svg, 12, 78, "a,b,c", { size: 11, c: "var(--accent)" }); txt(svg, 548, 78, "y", { a: "end", size: 11, c: "var(--accent)" });
        txt(svg, 285, 222, "LUT = 00010111 (ตารางความจริงของ majority)", { a: "middle", size: 12, w: 400 });
        out.append(svg);
        msg.innerHTML = "นำไปใช้ (implementation / fitting / <b>place and route</b>): จัดวาง netlist ลงบล็อกลอจิกจริงของอุปกรณ์ที่เลือก และเลือกเส้นทางสายเชื่อม — วงจรทั้งหมดนี้ใส่ได้ใน LUT 3 อินพุตเพียงตัวเดียว";
      } else if (s === 5) {
        out.append(wave(maj, 12));
        msg.innerHTML = "จำลองจังหวะเวลา (timing simulation): ใช้เวลาหน่วงจริงหลังจัดวาง — เอาต์พุตเลื่อนไปจากอินพุต (เช่น ≈ 4.2 ns) ตรวจว่าไม่ละเมิด setup/hold และทันคาบนาฬิกา (บทที่ 10 หัวข้อ 10.4)";
      } else {
        const bytes = [...Array(48)].map((_, i) => ((i * 73 + 41) % 256).toString(16).padStart(2, "0").toUpperCase());
        out.append(H("pre", { class: "mono", style: "font-size:13px;background:#1b1e27;color:#7ee787;padding:12px;border-radius:8px;overflow:auto;margin:0" },
          `$ program --cable usb majority.bit\n${bytes.join(" ").replace(/((?:\S+ ){16})/g, "$1\n")}\n✓ configuration done`));
        msg.innerHTML = "ดาวน์โหลด <b>bitstream</b> ลงอุปกรณ์ผ่าน device programmer หรือบอร์ดทดลอง (ข้อมูลข้างบนเป็นตัวอย่างสมมติ) · FPGA แบบ SRAM เป็น <b>volatile</b> — ต้องเก็บ bitstream ในหน่วยความจำ non-volatile แล้วโหลดใหม่ทุกครั้งที่เปิดไฟ";
      }
    }
    draw();
  };
})();
