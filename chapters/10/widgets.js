/* =========================================================
   บทที่ 10 — interactive widgets (การวิเคราะห์และออกแบบวงจรเชิงลำดับ)
   ffchar · fsmsim (ex1, ex2, moore101, mealy101, traffic, johnson) · statered · fmax
   ขีดบน: HTML ใช้ <span class="ov"> · SVG ใช้ {X} ใน txt() — ไม่ใช้อักขระผสม
   ========================================================= */
(function () {
  const DLD = window.DLD, U = DLD.ui, W = DLD.widgets;
  const H = (...a) => DLD.h(...a);
  const S = (...a) => DLD.svg(...a);
  const OV = (t) => `<span class="ov">${t}</span>`;
  const Q = (k) => `Q<sub>${k}</sub>`;
  const hl = (on) => (on ? ' style="background:var(--brand-soft);font-weight:700"' : "");
  const bin = (v, n) => v.toString(2).padStart(n, "0");
  const txt = (g, x, y, t, o) => {
    o = o || {};
    const el = S("text", { x, y, "text-anchor": o.a || "start", class: "s-mono", style: `font-size:${o.size || 14}px;font-weight:${o.w || 700};fill:${o.c || "var(--ink)"}` }, g);
    String(t).split(/(\{[^}]*\})/).forEach((p) => { if (!p) return; S("tspan", p[0] === "{" ? { text: p.slice(1, -1), style: "text-decoration:overline" } : { text: p }, el); });
    return el;
  };

  /* =====================================================
     1) สมการคุณลักษณะและตาราง excitation (10.1.3)
     ===================================================== */
  W.ffchar = function (el) {
    const st = { ff: "jk", view: "char", q: 0, a: 1, b: 1, qn: 1 };
    const body = U.shell(el, "INTERACTIVE", "สมการคุณลักษณะ ⇄ ตาราง excitation ของ D, T, J-K flip-flop (ตารางที่ 10.1–10.2)",
      "<b>คุณลักษณะ</b> (ใช้วิเคราะห์): รู้อินพุตและ Q → หา Q<sup>+</sup> · <b>excitation</b> (ใช้ออกแบบ): รู้ว่าต้องการ Q → Q<sup>+</sup> → หาอินพุตที่ต้องป้อน");
    const ctr = H("div", { class: "controls" });
    ctr.append(U.seg([["d", "D"], ["t", "T"], ["jk", "J-K"]], st.ff, (v) => { st.ff = v; draw(); }),
      U.seg([["char", "คุณลักษณะ (วิเคราะห์)"], ["exc", "excitation (ออกแบบ)"]], st.view, (v) => { st.view = v; draw(); }));
    const io = H("div", { class: "controls" });
    const out = H("div", { style: "display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start" });
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, io, out, msg);
    const nextQ = (ff, q, a, b) => (ff === "d" ? a : ff === "t" ? a ^ q : a && b ? 1 - q : a ? 1 : b ? 0 : q);
    const exc = (ff, q, qn) => (ff === "d" ? [String(qn)] : ff === "t" ? [String(q ^ qn)] : q === 0 ? [String(qn), "X"] : ["X", String(1 - qn)]);
    const EQ = { d: "Q<sup>+</sup> = D", t: `Q<sup>+</sup> = T ⊕ Q = T${OV("Q")} + ${OV("T")}Q`, jk: `Q<sup>+</sup> = J${OV("Q")} + ${OV("K")}Q` };
    const tog = (lab, k) => { const b = H("button", { type: "button", class: "btn sm", "aria-pressed": String(!!st[k]) }, `${lab} = ${st[k]}`); b.addEventListener("click", () => { st[k] ^= 1; draw(); }); return b; };
    function draw() {
      const ff = st.ff, ins = ff === "jk" ? ["J", "K"] : [ff.toUpperCase()];
      io.innerHTML = "";
      if (st.view === "char") { io.append(tog("Q", "q"), tog(ins[0], "a")); if (ins[1]) io.append(tog("K", "b")); }
      else io.append(tog("Q", "q"), tog("Q⁺", "qn"));
      const qn = nextQ(ff, st.q, st.a, st.b), need = exc(ff, st.q, st.qn);
      // ตาราง
      let t;
      if (st.view === "char") {
        const rows = ff === "jk" ? [[0, 0], [0, 1], [1, 0], [1, 1]] : [[0], [1]];
        const mean = (r) => (ff === "d" ? (r[0] ? "SET" : "RESET") : ff === "t" ? (r[0] ? "toggle" : "คงเดิม") : ["คงเดิม", "RESET", "SET", "toggle"][r[0] * 2 + r[1]]);
        const cur = ff === "jk" ? [st.a, st.b] : [st.a];
        t = `<table class="data" style="text-align:center;width:auto"><tr>${ins.map((i) => `<th>${i}</th>`).join("")}<th>Q<sup>+</sup></th><th></th></tr>` +
          rows.map((r) => `<tr${hl(r.every((v, i) => v === cur[i]))}>${r.map((v) => `<td>${v}</td>`).join("")}<td class="mono">${ff === "d" ? r[0] : ff === "t" ? (r[0] ? OV("Q") : "Q") : ["Q", "0", "1", OV("Q")][r[0] * 2 + r[1]]}</td><td>${mean(r)}</td></tr>`).join("") + "</table>";
      } else {
        const cols = ff === "jk" ? ["J", "K"] : [ins[0]];
        t = `<table class="data" style="text-align:center;width:auto"><tr><th>Q</th><th>Q<sup>+</sup></th>${cols.map((c) => `<th>${c}</th>`).join("")}</tr>` +
          [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => `<tr${hl(a === st.q && b === st.qn)}><td>${a}</td><td>${b}</td>${exc(ff, a, b).map((v) => `<td style="color:${v === "X" ? "var(--accent)" : "inherit"}">${v}</td>`).join("")}</tr>`).join("") + "</table>";
      }
      out.innerHTML = `<div>${t}</div><div class="mono" style="font-size:18px;padding-top:8px">${EQ[ff]}</div>`;
      msg.innerHTML = st.view === "char"
        ? `Q = ${st.q}, ${ins.map((i, k) => `${i} = ${k ? st.b : st.a}`).join(", ")} → <b>Q<sup>+</sup> = ${qn}</b>`
        : `ต้องการ Q: ${st.q} → ${st.qn} → ป้อน ${(ff === "jk" ? ["J", "K"] : [ins[0]]).map((c, i) => `<b>${c} = ${need[i]}</b>`).join(", ")}` +
          (need.includes("X") ? ` · X = don’t care (เพราะ${st.q === 0 ? " J = 1 กับ K = 0 (SET) หรือ K = 1 (toggle) ให้ผลเหมือนกัน" : " K = " + (1 - st.qn) + " กับ J ใดก็ได้ ให้ผลเหมือนกัน"})` : "") +
          (ff === "d" ? " · D flip-flop: D = Q<sup>+</sup> เสมอ ออกแบบง่ายที่สุด" : "");
    }
    draw();
  };

  /* =====================================================
     2) fsmsim — จำลองเครื่องสถานะ + ผังสถานะ + ผังเวลา
     ===================================================== */
  // ทุกเครื่องนิยามด้วยสมการบิต (ตามเล่ม) เพื่อให้จำลองสถานะที่ไม่ใช้ได้ด้วย
  const M = {
    ex1: { title: "ตัวอย่างที่ 10.1 · D flip-flop 2 ตัว (Mealy) — รูปที่ 10.3–10.5", n: 2, mealy: true, inName: "x", outName: "y",
      next: (q, x) => { const [q1, q0] = [q >> 1, q & 1]; return (((q1 & x) | (q0 & x)) << 1) | ((1 - q1) & x); },
      out: (q, x) => ((q >> 1) | (q & 1)) & (1 - x),
      eqs: `D<sub>1</sub> = ${Q(1)}x + ${Q(0)}x · D<sub>0</sub> = ${OV(Q(1))}x · y = (${Q(1)} + ${Q(0)})${OV("x")}`,
      states: [[0, "00", 120, 70], [1, "01", 330, 70], [3, "11", 330, 230], [2, "10", 120, 230]], seq: "01101110010",
      note: "ทุกลูกศร x = 0 กลับไป 00 · y = 1 เมื่อ x เปลี่ยนจาก 1 เป็น 0 หลังจากได้ 1 แล้ว (ตรวจจับจุดสิ้นสุดของกลุ่มเลข 1)" },
    ex2: { title: "ตัวอย่างที่ 10.2 · J-K flip-flop 2 ตัว (Moore) — รูปที่ 10.6–10.7", n: 2, inName: "x", outName: "y",
      next: (q, x) => { const [q1, q0] = [q >> 1, q & 1]; const j1 = x & q0, k1 = 1 - x, j0 = x, k0 = 1 - x; const nq = (q, j, k) => (j & k ? 1 - q : j ? 1 : k ? 0 : q); return (nq(q1, j1, k1) << 1) | nq(q0, j0, k0); },
      out: (q) => q >> 1,
      eqs: `J<sub>1</sub> = x${Q(0)} · K<sub>1</sub> = ${OV("x")} · J<sub>0</sub> = x · K<sub>0</sub> = ${OV("x")} · y = ${Q(1)}`,
      states: [[0, "00", 110, 70], [1, "01", 340, 70], [3, "11", 340, 230], [2, "10", 110, 230, true]], seq: "01101110010",
      note: "Q<sub>0</sub> จำอินพุตรอบก่อน · y = 1 เมื่อได้ x = 1 ติดกันอย่างน้อยสองรอบ · สถานะ 10 ไปถึงไม่ได้จาก 00 (เส้นประ)" },
    moore101: { title: "ตัวอย่างที่ 10.4 · ตรวจจับลำดับ 101 แบบ Moore (D flip-flop) — รูปที่ 10.9–10.12", n: 2, inName: "x", outName: "z",
      next: (q, x) => { const [q1, q0] = [q >> 1, q & 1]; return (((q0 & (1 - x)) | (q1 & (1 - q0) & x)) << 1) | x; },
      out: (q) => (q >> 1) & (q & 1),
      eqs: `D<sub>1</sub> = ${Q(0)}${OV("x")} + ${Q(1)}${OV(Q(0))}x · D<sub>0</sub> = x · z = ${Q(1)}${Q(0)}`,
      states: [[0, "S0", 80, 150], [1, "S1", 230, 60], [2, "S2", 380, 150], [3, "S3", 230, 250]], seq: "0101101001010",
      note: "S0 ยังไม่พบ · S1 พบ “1” · S2 พบ “10” · S3 พบ “101” (z = 1 ตลอดคาบถัดไป) · ซ้อนทับได้: จาก S3 ถ้า x = 0 ไป S2" },
    mealy101: { title: "ตัวอย่างที่ 10.5 · ตรวจจับลำดับ 101 แบบ Mealy (D flip-flop) — รูปที่ 10.13–10.16", n: 2, mealy: true, inName: "x", outName: "y",
      next: (q, x) => (((q & 1) & (1 - x)) << 1) | x,
      out: (q, x) => (q >> 1) & x,
      eqs: `D<sub>1</sub> = ${Q(0)}${OV("x")} · D<sub>0</sub> = x · y = ${Q(1)}x`,
      states: [[0, "S0", 80, 150], [1, "S1", 230, 60], [2, "S2", 380, 150], [3, "11", 230, 255, true]], seq: "0101101001010",
      note: "ใช้เพียง 3 สถานะ · y = 1 ทันทีในคาบที่บิต “1” ตัวสุดท้ายเข้ามา (เร็วกว่า Moore หนึ่งคาบ) · รหัส 11 ไม่ใช้ (เส้นประ) แต่ไปสู่ S2 หรือ S1 ได้ จึง self-starting" },
    traffic: { title: "ตัวอย่างที่ 10.6 · วงจรควบคุมสัญญาณไฟจราจร (Moore) — รูปที่ 10.17–10.19", n: 2, inName: "s", outName: "ไฟ", lights: true,
      next: (q, s) => { const [q1, q0] = [q >> 1, q & 1]; return (q0 << 1) | (((1 - q1) & q0) | ((1 - q1) & s) | (q0 & s)); },
      out: (q) => ({ 0: "MG·SR", 1: "MY·SR", 3: "MR·SG", 2: "MR·SY" })[q],
      eqs: `D<sub>1</sub> = ${Q(0)} · D<sub>0</sub> = ${OV(Q(1))}${Q(0)} + ${OV(Q(1))}s + ${Q(0)}s`,
      states: [[0, "S0", 90, 80], [1, "S1", 370, 80], [3, "S2", 370, 230], [2, "S3", 90, 230]], seq: "0011100110",
      names: { 0: "S0 (00)", 1: "S1 (01)", 3: "S2 (11)", 2: "S3 (10)" },
      note: "ใช้รหัสเกรย์ S0 = 00, S1 = 01, S2 = 11, S3 = 10 · s = 1 คือมีรถรอที่ถนนรอง · ถนนรองเขียวอยู่ตราบที่ยังมีรถ" },
    johnson: { title: "ตัวอย่างที่ 10.8 · วงจรนับจอห์นสัน 3 บิตกับสถานะที่ไม่ใช้ (รูปที่ 10.23)", n: 3, noInput: true, outName: "",
      next: (q, _x, fix) => { const q2 = q >> 2, q1 = (q >> 1) & 1, q0 = q & 1; const d1 = fix ? q2 & (q1 | (1 - q0)) : q2; return ((1 - q0) << 2) | (d1 << 1) | q1; },
      out: () => "",
      eqs: (fix) => `D<sub>2</sub> = ${OV(Q(0))} · D<sub>1</sub> = ${fix ? `${Q(2)}(${Q(1)} + ${OV(Q(0))})` : Q(2)} · D<sub>0</sub> = ${Q(1)}`,
      states: [[0, "000", 230, 40], [4, "100", 390, 95], [6, "110", 390, 205], [7, "111", 230, 260], [3, "011", 70, 205], [1, "001", 70, 95], [2, "010", 185, 150, true], [5, "101", 285, 150, true]], seq: "",
      note: "สถานะที่ไม่ใช้ 010 และ 101 (เส้นประ) · วงจรเดิมวนกันเอง (lock-up) · เปิด “แก้ D<sub>1</sub>” แล้ว 101 → 000 จึง self-starting" },
  };

  W.fsmsim = function (el) {
    const m = M[el.dataset.machine || "ex1"];
    const st = { q: 0, x: 0, hist: [], fix: false, seq: m.seq };
    const body = U.shell(el, "INTERACTIVE", m.title,
      (m.noInput ? "กด “พัลส์นาฬิกา ↑” เพื่อเปลี่ยนสถานะ · เลือกสถานะเริ่มต้นเป็นสถานะที่ไม่ใช้เพื่อตรวจ self-starting" :
        `ตั้งค่า ${m.inName} แล้วกด “พัลส์นาฬิกา ↑” หรือพิมพ์ลำดับอินพุตแล้วกด “รันลำดับ” · วงกลมสีคือสถานะปัจจุบัน ลูกศรสีคือการเปลี่ยนที่จะเกิดที่ขอบถัดไป · ${m.mealy ? "Mealy: ป้ายลูกศร x / y" : "Moore: เอาต์พุตเขียนในวงกลม"}`));
    const ctr = H("div", { class: "controls" });
    const xBtn = U.btn("", () => { st.x ^= 1; draw(); });
    const startSel = H("select", { class: "num-in", style: "width:auto" });
    m.states.forEach(([c, lab]) => startSel.append(H("option", { value: c }, `เริ่ม: ${lab}`)));
    startSel.addEventListener("change", () => { st.q = +startSel.value; st.hist = []; draw(); });
    if (!m.noInput) ctr.append(xBtn);
    ctr.append(U.btn("พัลส์นาฬิกา ↑", () => { clock(st.x); draw(); }, "primary"), U.btn("รีเซ็ต", () => { st.q = +startSel.value; st.hist = []; draw(); }), startSel);
    if (el.dataset.machine === "johnson") ctr.append(U.seg([[false, "วงจรเดิม"], [true, "แก้ D₁"]], false, (v) => { st.fix = v; st.hist = []; st.q = +startSel.value; draw(); }));
    const seqRow = H("div", { class: "controls" });
    if (!m.noInput) {
      const inp = U.input(`ลำดับ ${m.inName}:`, st.seq, (s) => (st.seq = s.replace(/[^01]/g, "")), { width: 160 });
      seqRow.append(inp, U.btn("รันลำดับ", () => { st.q = +startSel.value; st.hist = []; [...st.seq].forEach((c) => clock(+c)); draw(); }));
    }
    const grid = H("div", { style: "display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start" });
    const svg = S("svg", { viewBox: "0 0 470 345", style: "flex:1 1 320px;max-width:470px;min-width:0" });
    const side = H("div", { style: "flex:1 1 230px;min-width:0" });
    grid.append(svg, side);
    const wave = S("svg", { style: "max-width:760px" });
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    if (el.dataset.layout === "side") { // สไลด์: ผังสถานะซ้าย · ตาราง ผังเวลา และคำอธิบายขวา
      ctr.append(...seqRow.childNodes);
      const g2 = H("div", { style: "display:grid;grid-template-columns:minmax(0,0.95fr) minmax(0,1.05fr);gap:14px;align-items:start" });
      svg.setAttribute("style", "width:100%;max-height:360px");
      const R = H("div", { style: "display:flex;flex-direction:column;gap:8px" });
      side.style.cssText = ""; R.append(side, wave, msg); msg.style.fontSize = "15px";
      g2.append(svg, R); body.append(ctr, g2);
    } else body.append(ctr, seqRow, grid, wave, msg);
    const nx = (q, x) => m.next(q, x, st.fix);
    function clock(x) { const o = m.out(st.q, x); st.hist.push({ q: st.q, x, o }); if (st.hist.length > 16) st.hist.shift(); st.q = nx(st.q, x); }
    const P = {}; m.states.forEach((r) => { if (!r.shifted) { r[3] += 22; r.shifted = true; } const [c, lab, x, y, dash] = r; P[c] = { lab, x, y, dash }; });
    function draw() {
      xBtn.textContent = `${m.inName} = ${st.x}`; xBtn.setAttribute("aria-pressed", String(!!st.x));
      svg.innerHTML = "";
      const defs = S("defs", null, svg);
      defs.innerHTML = `<marker id="fa-${el.dataset.machine}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink-3)"/></marker><marker id="fh-${el.dataset.machine}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--accent)"/></marker>`;
      const R = 27, xs = m.noInput ? [0] : [0, 1];
      // รวมลูกศรที่ไปปลายทางเดียวกัน
      m.states.forEach(([c]) => {
        const groups = {};
        xs.forEach((x) => { const t = nx(c, x); (groups[t] = groups[t] || []).push(x); });
        Object.entries(groups).forEach(([t, xl]) => {
          t = +t; const a = P[c], b = P[t]; if (!b) return;
          const active = c === st.q && (m.noInput || xl.includes(st.x));
          const lab = m.noInput ? "" : xl.map((x) => (m.mealy ? `${x}/${m.out(c, x)}` : String(x))).join(", ");
          const col = active ? "var(--accent)" : "var(--ink-3)", dash = a.dash || b.dash ? "5 4" : "";
          let d, lx, ly;
          if (t === c) { // วนกลับตัวเอง
            const up = a.y > 182 ? 1 : -1;
            d = `M${a.x - 12},${a.y + up * (R - 4)} C${a.x - 34},${a.y + up * 74} ${a.x + 34},${a.y + up * 74} ${a.x + 12},${a.y + up * (R - 4)}`;
            lx = a.x; ly = a.y + up * 66 + (up > 0 ? 12 : -2);
          } else {
            const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, off = 16;
            const sx = a.x + ux * R - uy * 8, sy = a.y + uy * R + ux * 8, ex = b.x - ux * R - uy * 8, ey = b.y - uy * R + ux * 8;
            const cx = (sx + ex) / 2 - uy * off, cy = (sy + ey) / 2 + ux * off;
            d = `M${sx},${sy} Q${cx},${cy} ${ex},${ey}`; lx = cx - uy * 6; ly = cy + ux * 6 + 4;
          }
          S("path", { d, fill: "none", stroke: col, "stroke-width": active ? 2.6 : 1.6, "stroke-dasharray": dash, "marker-end": `url(#${active ? "fh" : "fa"}-${el.dataset.machine})` }, svg);
          if (lab) txt(svg, lx, ly, lab, { a: "middle", size: 11.5, c: active ? "var(--accent)" : "var(--ink-2)" });
        });
      });
      m.states.forEach(([c, lab, x, y, dash]) => {
        const cur = c === st.q;
        S("circle", { cx: x, cy: y, r: R, fill: cur ? "var(--brand)" : "var(--surface)", stroke: dash ? "var(--ink-3)" : "var(--brand)", "stroke-width": 2.4, "stroke-dasharray": dash ? "5 4" : "" }, svg);
        const o = !m.mealy && !m.noInput && !m.lights ? `/${m.out(c)}` : "";
        txt(svg, x, y + (m.lights ? -2 : 5), lab + o, { a: "middle", size: 13, c: cur ? "#fff" : "var(--ink)" });
        if (m.lights) txt(svg, x, y + 13, m.out(c), { a: "middle", size: 8.5, w: 400, c: cur ? "#fff" : "var(--ink-3)" });
      });
      // แผงข้าง: สมการ + ตารางสถานะ (+ไฟจราจร)
      const eq = typeof m.eqs === "function" ? m.eqs(st.fix) : m.eqs;
      const rows = m.states.map(([c, lab, , , dash]) => {
        const cells = xs.map((x) => { const t = nx(c, x), tl = P[t] ? P[t].lab : bin(t, m.n); return `<td${c === st.q && (m.noInput || x === st.x) ? ' style="color:var(--accent);font-weight:700"' : ""}>${tl}${m.mealy ? ` / ${m.out(c, x)}` : ""}</td>`; }).join("");
        return `<tr${hl(c === st.q)}${dash && c !== st.q ? ' style="color:var(--ink-3)"' : ""}><td>${lab}</td>${cells}${!m.mealy && !m.noInput ? `<td>${m.out(c)}</td>` : ""}</tr>`;
      }).join("");
      side.innerHTML = `<div class="mono" style="font-size:13px;margin-bottom:8px">${eq}</div><table class="data" style="text-align:center;width:auto;font-size:13px"><tr><th>PS</th>${m.noInput ? "<th>NS</th>" : xs.map((x) => `<th>${m.inName}=${x}</th>`).join("")}${!m.mealy && !m.noInput ? `<th>${m.outName}</th>` : ""}</tr>${rows}</table>`;
      if (m.lights) {
        const L = m.out(st.q);
        const lamp = (on, c) => `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;margin:1px;background:${on ? c : "#3a3f4d"}"></span>`;
        const road = (p) => `<div style="display:inline-flex;flex-direction:column;align-items:center;background:#1b1e27;padding:5px;border-radius:8px;margin-right:10px">${lamp(L.includes(p + "R"), "#ff4b4b")}${lamp(L.includes(p + "Y"), "#ffc53d")}${lamp(L.includes(p + "G"), "#3ddc84")}</div>`;
        side.innerHTML += `<div style="margin-top:10px;display:flex;align-items:center;gap:4px">${road("M")}<span class="tiny">ถนนหลัก</span>&nbsp;&nbsp;${road("S")}<span class="tiny">ถนนรอง</span></div>`;
      }
      // ผังเวลา
      const hs = st.hist, step = 42, X0 = 62, rowH = 34;
      const rws = [];
      if (!m.noInput) rws.push({ n: m.inName, b: hs.map((h) => h.x) });
      for (let k = m.n - 1; k >= 0; k--) rws.push({ n: `Q${k}`, b: hs.map((h) => (h.q >> k) & 1), s: true });
      if (!m.noInput && !m.lights) rws.push({ n: m.outName, b: hs.map((h) => h.o), o: true });
      wave.setAttribute("viewBox", `0 0 ${X0 + 16 * step + 10} ${rws.length * rowH + 30}`); wave.innerHTML = "";
      if (hs.length) {
        rws.forEach((r, i) => {
          const y = 6 + i * rowH;
          txt(wave, 6, y + 17, r.n, { size: 12, c: r.o ? "var(--hi)" : "var(--ink)" });
          S("path", { d: DLD.wavePath(r.b, X0, step, y, y + 20), class: r.o ? "s-hi" : r.s ? "s-wave2" : "s-wave", "stroke-width": 2.2 }, wave);
        });
        hs.forEach((h, i) => txt(wave, X0 + i * step + step / 2, rws.length * rowH + 22, P[h.q] ? P[h.q].lab : bin(h.q, m.n), { a: "middle", size: 10.5, c: "var(--brand)" }));
      } else txt(wave, X0, 24, "กดพัลส์นาฬิกาหรือรันลำดับเพื่อสร้างผังเวลา", { size: 12, w: 400, c: "var(--ink-3)" });
      const detect = hs.map((h) => h.o).join("");
      msg.innerHTML = m.note + (hs.length && !m.noInput && !m.lights ? `<br>${m.inName} = <b class="mono">${hs.map((h) => h.x).join("")}</b> → ${m.outName} = <b class="mono">${detect}</b>` : "") +
        (m.noInput && hs.length ? `<br>ลำดับ: <b class="mono">${[...hs.map((h) => bin(h.q, 3)), bin(st.q, 3)].join(" → ")}</b>` : "");
    }
    draw();
  };

  /* =====================================================
     3) ลดจำนวนสถานะด้วยการจับคู่แถว (10.3.2)
     ===================================================== */
  const RED = {
    ex3: { name: "ตัวอย่างที่ 10.3 (จากตัวอย่างที่ 10.1)", rows: { a: ["a", "b", 0, 0], b: ["a", "d", 1, 0], c: ["a", "c", 1, 0], d: ["a", "c", 1, 0] } },
    hw4: { name: "แบบฝึกหัดท้ายบท ข้อ 4", rows: { a: ["a", "b", 0, 0], b: ["c", "b", 0, 0], c: ["a", "d", 0, 1], d: ["c", "b", 0, 0], e: ["a", "d", 0, 1] } },
  };
  W.statered = function (el) {
    const st = { key: "ex3", step: 0 };
    const body = U.shell(el, "INTERACTIVE", "ลดจำนวนสถานะด้วยการจับคู่แถว (row matching)",
      "สองแถวที่มี<b>สถานะถัดไปและเอาต์พุตเหมือนกันทุกช่อง</b>สมมูลกัน → ตัดแถวหนึ่งทิ้งแล้วแทนชื่อด้วยอีกแถวทุกแห่ง · ทำซ้ำจนไม่มีแถวซ้ำ");
    const ctr = H("div", { class: "controls" });
    ctr.append(U.seg(Object.entries(RED).map(([k, v]) => [k, v.name]), st.key, (v) => { st.key = v; st.step = 0; draw(); }),
      U.btn("ขั้นถัดไป ▶", () => { st.step++; draw(); }, "primary"), U.btn("เริ่มใหม่", () => { st.step = 0; draw(); }));
    const out = H("div", { style: "display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start" });
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, out, msg);
    function stepsOf(rows) {
      const hist = [{ rows: JSON.parse(JSON.stringify(rows)), pair: null }];
      let cur = JSON.parse(JSON.stringify(rows));
      for (;;) {
        const ks = Object.keys(cur); let pair = null;
        for (let i = 0; i < ks.length && !pair; i++) for (let j = i + 1; j < ks.length; j++) if (cur[ks[i]].join() === cur[ks[j]].join()) { pair = [ks[i], ks[j]]; break; }
        if (!pair) break;
        const [keep, drop] = pair, nxt = {};
        ks.filter((k) => k !== drop).forEach((k) => (nxt[k] = cur[k].map((v, i) => (i < 2 && v === drop ? keep : v))));
        hist[hist.length - 1].pair = pair; hist.push({ rows: nxt, pair: null }); cur = nxt;
      }
      return hist;
    }
    function draw() {
      const hist = stepsOf(RED[st.key].rows), k = Math.min(st.step, hist.length - 1), h = hist[k];
      const tbl = (rows, pair, title) => `<div><div class="tiny" style="font-weight:700;margin-bottom:4px">${title}</div><table class="data" style="text-align:center;width:auto"><tr><th>PS</th><th>x=0</th><th>x=1</th><th>y (x=0)</th><th>y (x=1)</th></tr>` +
        Object.entries(rows).map(([s, r]) => `<tr${pair && pair.includes(s) ? ` style="background:${s === pair[1] ? "var(--danger-soft,#ffe3e3)" : "var(--hi-soft)"};font-weight:700"` : ""}><td>${s}</td>${r.map((v) => `<td>${v}</td>`).join("")}</tr>`).join("") + "</table></div>";
      out.innerHTML = tbl(h.rows, h.pair, k === 0 ? "ตารางเริ่มต้น" : `หลังขั้นที่ ${k}`);
      if (h.pair) msg.innerHTML = `แถว <b>${h.pair[0]}</b> และ <b>${h.pair[1]}</b> เหมือนกันทุกช่อง → ตัดแถว ${h.pair[1]} และแทน ${h.pair[1]} ด้วย ${h.pair[0]} ทุกแห่ง (กด “ขั้นถัดไป”)`;
      else msg.innerHTML = `ไม่มีแถวที่เหมือนกันแล้ว → เหลือ <b>${Object.keys(h.rows).length} สถานะ</b> (${Object.keys(h.rows).join(", ")}) จากเดิม ${Object.keys(RED[st.key].rows).length} สถานะ` +
        (st.key === "ex3" ? " · ตรงกับรูปที่ 10.8: วงจรตัวอย่างที่ 10.1 ต้องการฟลิปฟลอปเพียงตัวเดียว" : "");
    }
    draw();
  };

  /* =====================================================
     4) ความถี่สัญญาณนาฬิกาสูงสุด (10.4.2 · ตัวอย่างที่ 10.7)
     ===================================================== */
  W.fmax = function (el) {
    const st = { tpd: 8, tsu: 4, th: 2, not: 3, and: 5, or: 6, T: 30 };
    const body = U.shell(el, "INTERACTIVE", "ความถี่สัญญาณนาฬิกาสูงสุดและเส้นทางวิกฤต (ตัวอย่างที่ 10.7 · รูปที่ 10.21)",
      "แก้เวลาหน่วง (ns) แล้วดูว่าเส้นทางใดยาวที่สุด · T ≥ t<sub>pd,FF</sub> + t<sub>comb(max)</sub> + t<sub>su</sub> · ลากแถบคาบนาฬิกา T เพื่อดูว่าเมื่อใดละเมิด setup time");
    const ctr = H("div", { class: "controls" });
    const field = (k, lab) => U.input(lab, String(st[k]), (s) => { const v = parseFloat(s); if (v >= 0) { st[k] = v; draw(); } }, { width: 48 });
    ctr.append(field("tpd", "t_pd,FF"), field("tsu", "t_su"), field("th", "t_h"), field("not", "NOT"), field("and", "AND"), field("or", "OR"));
    const tRow = H("div", { class: "controls" }); const tv = H("b", { class: "mono" });
    const rg = H("input", { type: "range", min: 10, max: 60, value: st.T, style: "width:260px" }); rg.addEventListener("input", () => { st.T = +rg.value; draw(); });
    tRow.append("คาบนาฬิกา T = ", rg, tv);
    const tbl = H("div"), svg = S("svg", { viewBox: "0 0 760 120", style: "max-width:760px" });
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, tRow, tbl, svg, msg);
    function draw() {
      const p = [
        { n: `${Q(0)} → AND → OR → D<sub>1</sub>`, parts: [st.tpd, st.and, st.or] },
        { n: `${Q(1)},${Q(0)} → AND → OR → D<sub>1</sub>`, parts: [st.tpd, st.and, st.or] },
        { n: "x → NOT → AND → OR → D<sub>1</sub>", parts: [st.tpd, st.not, st.and, st.or] },
        { n: "x → D<sub>0</sub>", parts: [st.tpd] },
      ].map((r) => ({ ...r, t: r.parts.reduce((a, b) => a + b, 0) }));
      const mx = Math.max(...p.map((r) => r.t)), mn = Math.min(...p.map((r) => r.t)), Tmin = mx + st.tsu, f = 1000 / Tmin;
      tbl.innerHTML = `<table class="data" style="width:auto"><tr><th>เส้นทาง</th><th>เวลาหน่วง (ns)</th><th>รวม</th></tr>` +
        p.map((r) => `<tr${r.t === mx ? ' style="background:var(--danger-soft,#ffe3e3);font-weight:700"' : ""}><td>${r.n}</td><td class="mono">${r.parts.join(" + ")}</td><td class="mono">${r.t}</td></tr>`).join("") + "</table>";
      tv.textContent = ` ${st.T} ns (${(1000 / st.T).toFixed(1)} MHz)`;
      // แถบเวลา
      svg.innerHTML = "";
      const sc = 680 / 60, X0 = 40, y = 30;
      S("rect", { x: X0, y, width: st.T * sc, height: 34, fill: "var(--surface-2)", stroke: "var(--ink-3)" }, svg);
      const seg = (a, w, c, lab) => { S("rect", { x: X0 + a * sc, y: y + 4, width: Math.max(0, w * sc), height: 26, fill: c, opacity: 0.85 }, svg); if (w * sc > 30) txt(svg, X0 + (a + w / 2) * sc, y + 22, lab, { a: "middle", size: 11, c: "#fff" }); };
      seg(0, st.tpd, "#4c6ef5", "t_pd"); seg(st.tpd, mx - st.tpd, "#7950f2", "t_comb"); const slack = st.T - Tmin;
      seg(st.T - st.tsu, st.tsu, slack < 0 ? "#e03131" : "#f59f00", "t_su");
      S("line", { x1: X0 + st.T * sc, x2: X0 + st.T * sc, y1: 14, y2: 80, stroke: "var(--accent)", "stroke-width": 2 }, svg);
      txt(svg, X0, 14, "ขอบนาฬิกา", { size: 11, w: 400, c: "var(--ink-3)" }); txt(svg, X0 + st.T * sc, 96, "ขอบถัดไป", { a: "middle", size: 11, w: 400, c: "var(--accent)" });
      txt(svg, X0 + mx * sc, 112, `ข้อมูลถึง D ที่ ${mx} ns`, { a: "middle", size: 11, c: slack < 0 ? "#e03131" : "var(--ink-2)" });
      msg.innerHTML = `เส้นทางวิกฤต = <b>${mx} ns</b> → T<sub>min</sub> = ${mx} + ${st.tsu} = <b>${Tmin} ns</b> → f<sub>max</sub> = 1 / ${Tmin} ns ≈ <b>${f.toFixed(1)} MHz</b>` +
        `<br>T = ${st.T} ns: ${slack >= 0 ? `เหลือเวลา (slack) ${slack} ns — <b>ทำงานได้</b>` : `<b style="color:#e03131">ละเมิด setup time ${-slack} ns</b> — ฟลิปฟลอปอาจเก็บค่าผิดหรือเกิด metastability`}` +
        `<br>hold time: เส้นทางสั้นสุด ${mn} ns ${mn >= st.th ? "≥" : "<"} t<sub>h</sub> = ${st.th} ns → ${mn >= st.th ? "ไม่ละเมิด" : '<b style="color:#e03131">ละเมิด hold time</b>'}`;
    }
    draw();
  };
})();
