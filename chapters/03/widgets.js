/* =========================================================
   บทที่ 3 — interactive widgets (ลอจิกเกท และตระกูลไอซี)
   ========================================================= */
(function () {
  const DLD = window.DLD, U = DLD.ui, W = DLD.widgets;
  const H = (...a) => DLD.h(...a);
  const S = (...a) => DLD.svg(...a);
  const L = (n) => DLD.letters(n);

  /* expression with overline (book notation) */
  function exprHTML(type, n) {
    const v = L(n), ov = (s) => `<span class="ov">${s}</span>`;
    switch (type) {
      case "NOT": return `X = ${ov("A")}`;
      case "AND": return `X = ${v.join("")}`;
      case "OR": return `X = ${v.join(" + ")}`;
      case "NAND": return `X = ${ov(v.join(""))}`;
      case "NOR": return `X = ${ov(v.join(" + "))}`;
      case "XOR": return `X = A ⊕ B = A${ov("B")} + ${ov("A")}B`;
      case "XNOR": return `X = ${ov("A ⊕ B")} = AB + ${ov("A")}${ov("B")}`;
    }
  }
  const RULE = {
    NOT: "กลับค่าอินพุต",
    AND: "เป็น 1 เฉพาะเมื่ออินพุตทุกขาเป็น 1",
    OR: "เป็น 0 เฉพาะเมื่ออินพุตทุกขาเป็น 0",
    NAND: "เป็น 0 เฉพาะเมื่ออินพุตทุกขาเป็น 1 (complement ของ AND)",
    NOR: "เป็น 1 เฉพาะเมื่ออินพุตทุกขาเป็น 0 (complement ของ OR)",
    XOR: "เป็น 1 เมื่ออินพุตทั้งสองต่างกัน",
    XNOR: "เป็น 1 เมื่ออินพุตทั้งสองเหมือนกัน (complement ของ XOR)",
  };
  const IEC = { NOT: "1", AND: "&", OR: "≥1", NAND: "&", NOR: "≥1", XOR: "=1", XNOR: "=1" };
  const INV = { NOT: 1, NAND: 1, NOR: 1, XNOR: 1 };

  /* rectangular-outline (ANSI/IEEE 91) symbol */
  function drawRect(g, type, x, cy, n) {
    const h = Math.max(56, n * 24), top = cy - h / 2, w = 54;
    S("rect", { x, y: top, width: w, height: h, class: "s-gate" }, g);
    S("text", { x: x + w / 2, y: top + 20, "text-anchor": "middle", class: "s-mono", style: "font-size:15px;font-weight:700;fill:var(--ink)", text: IEC[type] }, g);
    const ins = [];
    for (let i = 0; i < n; i++) ins.push({ x, y: n === 1 ? cy : top + (h * (i + 1)) / (n + 1) });
    let ox = x + w;
    if (INV[type]) { S("path", { d: `M${ox},${cy - 9} L${ox + 12},${cy} L${ox},${cy}`, class: "s-gate", fill: "none", style: "fill:none" }, g); ox += 12; }
    return { inputs: ins, output: { x: ox, y: cy }, width: ox - x, height: h };
  }

  /* =====================================================
     1) ผังเวลาของเกท (รูปคลื่นแก้ไขได้)
     ===================================================== */
  const PRESET = {
    2: { A: [0, 1, 1, 0, 1, 1, 0, 0, 1, 0], B: [0, 0, 1, 1, 1, 0, 0, 1, 1, 0] },
    3: { A: [0, 1, 1, 0, 1, 1, 1, 0, 1, 0], B: [1, 1, 0, 0, 1, 1, 1, 1, 1, 0], C: [0, 1, 1, 1, 0, 1, 1, 0, 1, 0] },
    1: { A: [0, 1, 1, 0, 0, 1, 0, 1, 1, 0] },
  };
  W.gatewave = function (el) {
    const fixed = el.dataset.gate || "AND", compare = el.dataset.compare;
    const st = { type: fixed, n: fixed === "NOT" ? 1 : 2, sig: JSON.parse(JSON.stringify(PRESET[fixed === "NOT" ? 1 : 2])), guess: false, user: null };
    const body = U.shell(el, "INTERACTIVE", `ผังเวลาของ ${fixed} gate${compare ? " เทียบกับ " + compare : ""}`,
      "คลิกช่องของรูปคลื่นอินพุตเพื่อสลับ 0/1 · เปิดโหมด “ลองวาดเอาต์พุตเอง” แล้วคลิกแถว X เพื่อทายรูปคลื่นก่อนกดตรวจคำตอบ");
    const svg = S("svg", { viewBox: "0 0 940 300" }); body.appendChild(svg);
    const g = S("g", null, svg);
    const ctr = H("div", { class: "controls" });
    if (fixed !== "NOT" && fixed !== "XOR") ctr.append(U.seg([[2, "2 อินพุต"], [3, "3 อินพุต"]], 2, (n) => { st.n = n; st.sig = JSON.parse(JSON.stringify(PRESET[n])); st.user = null; draw(); }));
    const guessBtn = U.btn("✏️ ลองวาดเอาต์พุตเอง", () => { st.guess = !st.guess; st.user = st.guess ? Array(10).fill(0) : null; guessBtn.setAttribute("aria-pressed", st.guess); draw(); });
    const checkBtn = U.btn("ตรวจคำตอบ", () => { st.check = true; draw(); }, "primary");
    ctr.append(guessBtn, checkBtn, U.btn("สุ่มรูปคลื่นใหม่", () => { L(st.n).forEach((k) => (st.sig[k] = [...Array(10)].map(() => (Math.random() < 0.5 ? 0 : 1)))); st.user = st.guess ? Array(10).fill(0) : null; st.check = false; draw(); }));
    const msg = H("div", { class: "callout tip", style: "margin-bottom:0" });
    body.append(ctr, msg);
    const X0 = 90, step = 82;
    function draw() {
      g.innerHTML = "";
      checkBtn.style.display = st.guess ? "" : "none";
      const names = L(st.n);
      const out = [...Array(10)].map((_, i) => DLD.evalGate(st.type, names.map((k) => st.sig[k][i])));
      const out2 = compare ? out.map((v) => 1 - v) : null;
      const rows = names.length + (compare ? 2 : 1);
      const rowH = Math.min(62, 250 / rows);
      svg.setAttribute("viewBox", `0 0 940 ${rows * rowH + 40}`);
      for (let i = 0; i <= 10; i++) S("line", { x1: X0 + i * step, x2: X0 + i * step, y1: 8, y2: rows * rowH + 14, class: "s-dim" }, g);
      for (let i = 0; i < 10; i++) S("text", { x: X0 + i * step + step / 2, y: rows * rowH + 32, "text-anchor": "middle", class: "s-mono", style: "font-size:11px;fill:var(--ink-3)", text: "t" + (i + 1) }, g);
      const drawRow = (r, label, bits, cls, onClick, color) => {
        const yH = 14 + r * rowH, yL = yH + rowH * 0.55;
        S("text", { x: 12, y: yL - 4, class: "s-text", style: `font-weight:700;${color ? "fill:" + color : ""}`, text: label }, g);
        if (bits) S("path", { d: DLD.wavePath(bits, X0, step, yH, yL), class: cls }, g);
        if (onClick) for (let i = 0; i < 10; i++) {
          const hit = S("rect", { x: X0 + i * step, y: yH - 6, width: step, height: rowH * 0.55 + 12, fill: "transparent", style: "cursor:pointer" }, g);
          hit.addEventListener("click", () => onClick(i));
        }
      };
      names.forEach((k, r) => drawRow(r, k, st.sig[k], "s-wave", (i) => { st.sig[k][i] ^= 1; st.check = false; draw(); }));
      const rX = names.length;
      if (st.guess) {
        drawRow(rX, (compare ? st.type : "X") + " ?", st.user, "s-wave2", (i) => { st.user[i] ^= 1; st.check = false; draw(); }, "var(--accent)");
        if (st.check) {
          const yH = 14 + rX * rowH, yL = yH + rowH * 0.55;
          S("path", { d: DLD.wavePath(out, X0, step, yH, yL), class: "s-hi", opacity: 0.55, "stroke-dasharray": "6 4" }, g);
          out.forEach((v, i) => { if (v !== st.user[i]) S("rect", { x: X0 + i * step, y: yH - 6, width: step, height: rowH * 0.55 + 12, fill: "var(--bad)", opacity: 0.15 }, g); });
        }
      } else {
        out.forEach((v, i) => { if (v) S("rect", { x: X0 + i * step, y: 8, width: step, height: rows * rowH + 6, fill: "var(--hi)", opacity: 0.08 }, g); });
        drawRow(rX, compare ? st.type : "X", out, "s-hi", null, "var(--hi)");
        if (compare) drawRow(rX + 1, compare, out2, "s-wave2", null, "var(--accent)");
      }
      const wrong = st.guess && st.check ? out.reduce((a, v, i) => a + (v !== st.user[i]), 0) : null;
      msg.className = "callout " + (wrong === null ? "tip" : wrong ? "warn" : "tip");
      // ในโหมดเปรียบเทียบ ใช้ชื่อเกทแทน X เพื่อให้ตรงกับป้ายของแต่ละแถว
      const ex = (t, n) => (compare ? exprHTML(t, n).replace(/^X =/, t + " =") : exprHTML(t, n));
      msg.innerHTML = `<b class="mono">${ex(st.type, st.n)}</b> — ${RULE[st.type]}` +
        (compare ? `<br><b class="mono">${ex(compare, 2)}</b> — ${RULE[compare]} · สองแถวล่างเป็น complement ซึ่งกันและกัน` : "") +
        (wrong === null ? "" : wrong ? `<br>❌ ผิด ${wrong} ช่วงเวลา (แถบแดง) — เส้นประสีเขียวคือคำตอบที่ถูก` : "<br>✅ ถูกต้องทุกช่วงเวลา!");
    }
    draw();
  };

  /* =====================================================
     2) สนามทดลองเกท 7 ชนิด + สัญลักษณ์ 2 แบบ
     ===================================================== */
  W.gatelab = function (el) {
    const body = U.shell(el, "INTERACTIVE", "สนามทดลองเกท 7 ชนิด: สัญลักษณ์ ตารางค่าความจริง และสมการบูลีน",
      "เลือกชนิดเกทและแบบสัญลักษณ์ (รูปทรงเฉพาะ / โครงร่างสี่เหลี่ยมตาม ANSI/IEEE 91-1984) คลิกสวิตช์อินพุตหรือแถวในตาราง · จำนวนกรณี N = 2ⁿ");
    const st = { type: "NAND", n: 2, v: [0, 0, 0, 0], shape: "dist" };
    const ctr = H("div", { class: "controls" });
    const nSeg = U.seg([[2, "2 อินพุต"], [3, "3 อินพุต"], [4, "4 อินพุต"]], 2, (n) => { st.n = n; draw(); });
    ctr.append(U.seg(["NOT", "AND", "OR", "NAND", "NOR", "XOR", "XNOR"].map((t) => [t, t]), st.type, (t) => {
      st.type = t; if (t === "NOT") st.n = 1; else if (t === "XOR" || t === "XNOR") st.n = 2; else if (st.n < 2) st.n = 2;
      nSeg.style.display = t === "NOT" || t === "XOR" || t === "XNOR" ? "none" : ""; nSeg.set(st.n); draw();
    }), nSeg, U.seg([["dist", "รูปทรงเฉพาะ"], ["rect", "โครงร่างสี่เหลี่ยม"]], st.shape, (s) => { st.shape = s; draw(); }));
    const wrap = H("div", { class: "wgrid", style: "grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);align-items:start" });
    const left = H("div"), right = H("div");
    const svg = S("svg", { viewBox: "0 0 520 250" }); left.appendChild(svg);
    const info = H("div", { class: "callout note", style: "margin:10px 0 0" }); left.appendChild(info);
    wrap.append(left, right);
    body.append(ctr, wrap);
    const mq = matchMedia("(max-width:700px)"); const lay = () => (wrap.style.gridTemplateColumns = mq.matches ? "1fr" : "minmax(0,1.3fr) minmax(0,1fr)"); mq.addEventListener("change", lay); lay();
    function draw() {
      svg.innerHTML = "";
      const n = st.n, vals = st.v.slice(0, n), out = DLD.evalGate(st.type, vals), cy = 125, gx = 220;
      const wires = S("g", null, svg), gg = S("g", null, svg);
      const geo = st.shape === "dist" ? DLD.drawGate(gg, st.type, gx, cy, n) : drawRect(gg, st.type, gx, cy, n);
      geo.inputs.forEach((p, i) => {
        const yy = n === 1 ? cy : 30 + (i * 190) / (n - 1);
        S("path", { d: `M90,${yy} H150 L${gx - 20},${p.y} H${p.x}`, class: vals[i] ? "s-wire1" : "s-wire0" }, wires);
        const sw = S("g", { style: "cursor:pointer" }, svg);
        S("rect", { x: 28, y: yy - 15, width: 56, height: 30, rx: 15, fill: vals[i] ? "var(--hi)" : "var(--surface-2)", stroke: "var(--line)" }, sw);
        S("circle", { cx: vals[i] ? 69 : 43, cy: yy, r: 11, fill: "#fff", stroke: "var(--line)" }, sw);
        S("text", { x: 10, y: yy + 5, class: "s-mono", style: "font-size:15px;font-weight:700;fill:var(--ink)", text: L(n)[i] }, svg);
        sw.addEventListener("click", () => { st.v[i] ^= 1; draw(); });
      });
      S("path", { d: `M${geo.output.x},${cy} H440`, class: out ? "s-wire1" : "s-wire0" }, wires);
      S("circle", { cx: 466, cy, r: 20, fill: out ? "var(--hi)" : "var(--surface-2)", stroke: "var(--ink-3)", "stroke-width": 2 }, svg);
      S("text", { x: 466, y: cy + 46, "text-anchor": "middle", class: "s-mono", style: "font-weight:700", text: "X = " + out }, svg);
      const series = { NOT: "7404", AND: "7408", OR: "7432", NAND: n === 2 ? "7400" : n === 3 ? "7410" : "7420", NOR: n === 2 ? "7402" : n === 3 ? "7427" : "—", XOR: "7486", XNOR: "—" }[st.type];
      info.innerHTML = `<b class="mono" style="font-size:18px">${exprHTML(st.type, n)}</b><br>${RULE[st.type]}<br><small>ไอซีอนุกรม 74: <b>${series}</b>${series === "—" ? " (ไม่มีในตารางที่ 3.10)" : ""}</small>`;
      const rows = DLD.combos(n);
      right.innerHTML = `<div class="table-wrap"><table class="data" style="text-align:center;width:100%"><tr>${L(n).map((l) => `<th style="text-align:center">${l}</th>`).join("")}<th style="text-align:center">X</th></tr>` +
        rows.map((r, ri) => { const cur = r.every((b, k) => b === vals[k]); const o = DLD.evalGate(st.type, r);
          return `<tr data-r="${ri}" style="cursor:pointer;${cur ? "background:var(--brand-soft);font-weight:700" : ""}">${r.map((b) => `<td class="num" style="text-align:center">${b}</td>`).join("")}<td class="num" style="text-align:center;color:${o ? "var(--hi)" : "var(--lo)"};font-weight:700">${o}</td></tr>`; }).join("") +
        `</table></div><p class="w-hint" style="margin-top:6px">n = ${n} → N = 2<sup>${n}</sup> = ${1 << n} กรณี</p>`;
      right.querySelectorAll("tr[data-r]").forEach((tr) => tr.addEventListener("click", () => { rows[+tr.dataset.r].forEach((b, k) => (st.v[k] = b)); draw(); }));
    }
    draw();
  };

  /* =====================================================
     3) NAND ≡ Negative-OR · NOR ≡ Negative-AND
     ===================================================== */
  W.equiv = function (el) {
    const body = U.shell(el, "INTERACTIVE", "วงจรเทียบเท่า: NAND ≡ Negative-OR · NOR ≡ Negative-AND",
      "สลับอินพุต A, B แล้วดูว่าวงจรทั้งสองฝั่งให้เอาต์พุตเท่ากันทุกกรณี — ฟองน้ำที่อินพุตคือการ complement อินพุตก่อนเข้าเกท (active-LOW input)");
    const st = { pair: "nand", a: 0, b: 0 };
    const ctr = H("div", { class: "controls" });
    ctr.append(U.seg([["nand", "NAND ≡ Negative-OR"], ["nor", "NOR ≡ Negative-AND"]], st.pair, (p) => { st.pair = p; draw(); }),
      U.btn("สลับ A", () => { st.a ^= 1; draw(); }), U.btn("สลับ B", () => { st.b ^= 1; draw(); }));
    const svg = S("svg", { viewBox: "0 0 900 220" });
    const tbl = H("div", { class: "table-wrap", style: "margin-top:10px" });
    body.append(ctr, svg, tbl);
    function bubbleGate(g, base, x, cy) {
      // base gate with input bubbles
      const geo = DLD.drawGate(g, base, x + 12, cy, 2);
      geo.inputs.forEach((p) => S("circle", { cx: p.x - 6, cy: p.y, r: 6, class: "s-gate" }, g));
      return { inputs: geo.inputs.map((p) => ({ x: p.x - 12, y: p.y })), output: geo.output };
    }
    function draw() {
      svg.innerHTML = "";
      const left = st.pair === "nand" ? "NAND" : "NOR", rightBase = st.pair === "nand" ? "OR" : "AND";
      const out = DLD.evalGate(left, [st.a, st.b]);
      const panel = (ox, title, mk) => {
        S("text", { x: ox + 200, y: 22, "text-anchor": "middle", class: "s-text", style: "font-weight:700", text: title }, svg);
        const g = S("g", null, svg), wires = S("g", null, svg);
        svg.insertBefore(wires, g);
        const geo = mk(g, ox + 170, 120);
        [st.a, st.b].forEach((v, i) => {
          const p = geo.inputs[i];
          S("path", { d: `M${ox + 40},${p.y} H${p.x}`, class: v ? "s-wire1" : "s-wire0" }, wires);
          S("text", { x: ox + 20, y: p.y + 5, class: "s-mono", style: "font-weight:700;fill:var(--ink)", text: (i ? "B=" : "A=") + v }, svg);
        });
        S("path", { d: `M${geo.output.x},120 H${ox + 360}`, class: out ? "s-wire1" : "s-wire0" }, wires);
        S("circle", { cx: ox + 375, cy: 120, r: 14, fill: out ? "var(--hi)" : "var(--surface-2)", stroke: "var(--ink-3)", "stroke-width": 2 }, svg);
        S("text", { x: ox + 375, y: 158, "text-anchor": "middle", class: "s-mono", style: "font-weight:700", text: "X=" + out }, svg);
      };
      panel(0, left + " gate", (g, x, cy) => DLD.drawGate(g, left, x, cy, 2));
      S("text", { x: 450, y: 128, "text-anchor": "middle", class: "s-text", style: "font-size:30px;font-weight:700;fill:var(--accent)", text: "≡" }, svg);
      panel(470, "Negative-" + rightBase, (g, x, cy) => bubbleGate(g, rightBase, x, cy));
      const rows = DLD.combos(2);
      const ov = (s) => `<span class="ov">${s}</span>`;
      tbl.innerHTML = `<table class="data" style="width:100%"><tr><th>A</th><th>B</th><th>${left} = ${st.pair === "nand" ? ov("AB") : ov("A + B")}</th><th>${ov("A")}</th><th>${ov("B")}</th><th>Negative-${rightBase} = ${st.pair === "nand" ? ov("A") + " + " + ov("B") : ov("A") + ov("B")}</th></tr>` +
        rows.map(([a, b]) => { const x = DLD.evalGate(left, [a, b]), y = DLD.evalGate(rightBase, [1 - a, 1 - b]); const cur = a === st.a && b === st.b;
          return `<tr style="${cur ? "background:var(--brand-soft);font-weight:700" : ""}"><td>${a}</td><td>${b}</td><td style="color:var(--hi);font-weight:700">${x}</td><td>${1 - a}</td><td>${1 - b}</td><td style="color:var(--hi);font-weight:700">${y}</td></tr>`; }).join("") +
        `</table><p class="w-hint" style="margin-top:6px">คอลัมน์ผลลัพธ์ทั้งสองเท่ากันทุกแถว (ตารางที่ ${st.pair === "nand" ? "3.5" : "3.7"}) — ความสัมพันธ์นี้คือทฤษฎีบทของ DeMorgan ที่จะเรียนในบทที่ 4</p>`;
    }
    draw();
  };

  /* =====================================================
     4) การประยุกต์ใช้เกท (3.1.6, 3.2.5, 3.3.5, 3.6.4)
     ===================================================== */
  W.gateapps = function (el) {
    const body = U.shell(el, "INTERACTIVE", "การประยุกต์ใช้เกทในบทนี้",
      "เลือกตัวอย่างการประยุกต์ แล้วลองเปลี่ยนสถานะอินพุต");
    const st = { app: "belt", ign: 1, buckled: 0, t: 0, timer: null, doors: [0, 0, 0], bits: [1, 0, 1, 1, 0, 1, 0, 0], a: 1, b: 1 };
    const ctr = H("div", { class: "controls" });
    ctr.append(U.seg([["belt", "AND: เตือนคาดเข็มขัด"], ["alarm", "OR: เตือนการบุกรุก"], ["ones", "NOT: 1’s complement"], ["xor", "XOR: บวกบิต"]], st.app, (a) => { st.app = a; draw(); }));
    const area = H("div");
    body.append(ctr, area);
    const sw = (label, on, fn) => { const b = U.btn((on ? "🟢 " : "⚪ ") + label, fn); return b; };
    function draw() {
      area.innerHTML = "";
      if (st.app === "belt") {
        const C = st.t > 0 ? 1 : 0, A = st.ign, B = st.buckled ? 0 : 1, X = A & B & C;
        const row = H("div", { class: "controls" });
        row.append(sw("A: บิดกุญแจสตาร์ท (HIGH)", st.ign, () => { st.ign ^= 1; if (st.ign) startTimer(); else { st.t = 0; stop(); } draw(); }),
          sw("คาดเข็มขัดแล้ว (B = LOW)", st.buckled, () => { st.buckled ^= 1; draw(); }),
          U.btn("⏱ เริ่มนับ 30 s ใหม่", () => { if (st.ign) startTimer(); draw(); }));
        area.append(row, H("div", { class: "wgrid" },
          `<div class="card"><dl class="kv"><dt>A (กุญแจ)</dt><dd>${A}</dd><dt>B (ช่องเสียบเข็มขัด)</dt><dd>${B} ${st.buckled ? "(เสียบแล้ว)" : "(ไม่ได้เสียบ)"}</dd><dt>C (timer 30 s)</dt><dd>${C} ${st.t > 0 ? `(เหลือ ${st.t} s)` : "(หมดเวลา)"}</dd></dl></div>
           <div class="card" style="text-align:center"><div style="font-size:52px">${X ? "🔔" : "🔕"}</div><b class="mono">X = ABC = ${X}</b><div class="w-hint" style="margin:4px 0 0">${X ? "เสียงเตือนดัง!" : "เงียบ"}</div></div>`));
        area.appendChild(H("p", { class: "w-hint" }, "เสียงเตือนดังเมื่อสตาร์ทเครื่อง (A = 1) ภายใน 30 วินาที (C = 1) และยังไม่ได้เสียบเข็มขัด (B = 1) — รูปที่ 3.14"));
      } else if (st.app === "alarm") {
        const X = st.doors.some(Boolean) ? 1 : 0;
        const row = H("div", { class: "controls" });
        ["ประตู", "หน้าต่าง 1", "หน้าต่าง 2"].forEach((n, i) => row.appendChild(sw(n + (st.doors[i] ? " เปิด (1)" : " ปิด (0)"), st.doors[i], () => { st.doors[i] ^= 1; draw(); })));
        area.append(row, H("div", { class: "card", style: "text-align:center" }, `<div style="font-size:52px">${X ? "🚨" : "🏠"}</div><b class="mono">X = A + B + C = ${X}</b><div class="w-hint" style="margin:4px 0 0">${X ? "มีบานที่เปิดอยู่ → สัญญาณเตือนดัง" : "ทุกบานปิด → เงียบ"}</div>`));
        area.appendChild(H("p", { class: "w-hint" }, "รูปที่ 3.22 · เซนเซอร์ให้ 1 เมื่อบานถูกเปิด — เพียงบานเดียวเปิดก็พอให้ OR gate เป็น 1"));
      } else if (st.app === "ones") {
        const inp = U.bitRow(st.bits, { onToggle: (i) => { st.bits[i] ^= 1; draw(); } });
        const out = U.bitRow(st.bits.map((b) => 1 - b), { cls: () => "hl" });
        area.append(H("div", { class: "w-hint" }, "อินพุต 8 บิต (คลิกเพื่อเปลี่ยน)"), inp, H("div", { style: "font:600 20px var(--mono);color:var(--ink-3);margin:6px 0 6px 12px" }, "▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ &nbsp;<small style='font-size:13px'>อินเวอร์เตอร์ 8 ตัว (ไอซี 7404 สองตัว)</small>"), out,
          H("p", { class: "w-hint" }, "รูปที่ 3.6 · เอาต์พุตคือ 1’s complement ของอินพุต (เชื่อมโยงกับหัวข้อ 2.5.1)"));
      } else {
        const s = st.a ^ st.b;
        const row = H("div", { class: "controls" });
        row.append(sw("บิต A = " + st.a, st.a, () => { st.a ^= 1; draw(); }), sw("บิต B = " + st.b, st.b, () => { st.b ^= 1; draw(); }));
        area.append(row, H("div", { class: "card" }, `<div class="mono" style="font-size:22px">${st.a} + ${st.b} = ${st.a + st.b === 2 ? "(1)0" : st.a + st.b}</div><div>XOR ให้ผลบวก (sum) = <b class="mono" style="color:var(--accent)">${s}</b> ${st.a & st.b ? "— ตัวทด (1) ถูกละไว้ ต้องใช้ AND หาตัวทด (บทที่ 7: half adder)" : ""}</div>`),
          H("p", { class: "w-hint" }, "รูปที่ 3.39 · ผลบวกของบิตสองบิต (ไม่คิดตัวทด) ตรงกับตารางค่าความจริงของ XOR ทุกกรณี"));
      }
    }
    function startTimer() { stop(); st.t = 30; st.timer = setInterval(() => { st.t--; if (st.t <= 0) { st.t = 0; stop(); } if (st.app === "belt") draw(); }, 1000); }
    function stop() { if (st.timer) clearInterval(st.timer); st.timer = null; }
    startTimer(); draw();
  };

  /* =====================================================
     5) การจัดขาไอซี 74xx (DIP-14) + ทดลองจ่ายไฟ
     ===================================================== */
  const STD = [["1A", "1B", "1Y", "2A", "2B", "2Y", "GND"], ["3Y", "3A", "3B", "4Y", "4A", "4B", "VCC"]];
  const PIN = {
    "7400": { name: "quad 2-input NAND", type: "NAND", pins: STD },
    "7402": { name: "quad 2-input NOR", type: "NOR", pins: [["1Y", "1A", "1B", "2Y", "2A", "2B", "GND"], ["3A", "3B", "3Y", "4A", "4B", "4Y", "VCC"]] },
    "7404": { name: "hex inverter", type: "NOT", pins: [["1A", "1Y", "2A", "2Y", "3A", "3Y", "GND"], ["4Y", "4A", "5Y", "5A", "6Y", "6A", "VCC"]] },
    "7408": { name: "quad 2-input AND", type: "AND", pins: STD },
    "7432": { name: "quad 2-input OR", type: "OR", pins: STD },
    "7486": { name: "quad 2-input XOR", type: "XOR", pins: STD },
  };
  W.pinout = function (el) {
    const body = U.shell(el, "LAB", "การจัดขาไอซีอนุกรม 74 (DIP 14 ขา) และทดลองต่อสัญญาณ",
      "เลือกเบอร์ไอซี คลิกขาอินพุต (A/B) เพื่อป้อน 0/1 และดูเอาต์พุต (Y) · ต้องเปิดไฟเลี้ยงขา 14 (VCC) และขา 7 (GND) ก่อนไอซีจึงทำงาน · ขา 1 อยู่ใกล้รอยบาก นับทวนเข็มนาฬิกา");
    const st = { part: "7400", pwr: true, inp: {} };
    const ctr = H("div", { class: "controls" });
    ctr.append(U.seg(Object.keys(PIN).map((k) => [k, k]), st.part, (k) => { st.part = k; st.inp = {}; draw(); }));
    const pwrBtn = U.btn("", () => { st.pwr = !st.pwr; draw(); });
    ctr.append(pwrBtn);
    const svg = S("svg", { viewBox: "0 0 760 330" });
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, svg, msg);
    function draw() {
      svg.innerHTML = "";
      pwrBtn.textContent = st.pwr ? "🔌 ไฟเลี้ยง: เปิด (5 V)" : "🔌 ไฟเลี้ยง: ปิด";
      const ic = PIN[st.part];
      const x0 = 150, w = 460, y0 = 90, h = 150, pitch = w / 7;
      S("rect", { x: x0, y: y0, width: w, height: h, rx: 10, fill: "#2a2f3a", stroke: "#111" }, svg);
      S("path", { d: `M${x0},${y0 + h / 2 - 16} a16,16 0 0 1 0,32`, fill: "#5b6272" }, svg);
      S("circle", { cx: x0 + 22, cy: y0 + h - 22, r: 5, fill: "#9aa3b5" }, svg);
      S("text", { x: x0 + w / 2, y: y0 + h / 2 + 6, "text-anchor": "middle", style: "font:700 22px var(--mono);fill:#e6e9f2", text: "SN74LS" + st.part.slice(2) + "N" }, svg);
      S("text", { x: x0 + w / 2, y: y0 + h / 2 + 28, "text-anchor": "middle", style: "font:13px var(--font);fill:#aab2c5", text: ic.name }, svg);
      const val = {}; // pin label -> value
      const gatesN = st.part === "7404" ? 6 : 4;
      for (let k = 1; k <= gatesN; k++) {
        const ins = st.part === "7404" ? [st.inp[k + "A"] || 0] : [st.inp[k + "A"] || 0, st.inp[k + "B"] || 0];
        val[k + "Y"] = st.pwr ? DLD.evalGate(ic.type, ins) : null;
      }
      const pinXY = (row, i) => (row === 0 ? [x0 + pitch * (i + 0.5), y0 + h] : [x0 + w - pitch * (i + 0.5), y0]);
      ic.pins.forEach((row, r) => row.forEach((lab, i) => {
        const num = r === 0 ? i + 1 : 8 + i;
        const [px, py] = pinXY(r, i);
        const isIn = /[AB]$/.test(lab), isOut = /Y$/.test(lab), isPwr = lab === "VCC" || lab === "GND";
        const v = isIn ? st.inp[lab] || 0 : isOut ? val[lab] : null;
        const col = isPwr ? (st.pwr ? (lab === "VCC" ? "#e03131" : "#3b82f6") : "#888") : v === 1 ? "var(--hi)" : v === 0 ? "var(--lo)" : "#bbb";
        const dir = r === 0 ? 1 : -1;
        S("rect", { x: px - 11, y: r === 0 ? py : py - 34, width: 22, height: 34, fill: "#c8ccd4", stroke: "#888" }, svg);
        S("text", { x: px, y: py + dir * 18 + 5, "text-anchor": "middle", style: "font:700 12px var(--mono);fill:#333", text: num }, svg);
        const pill = S("g", { style: isIn ? "cursor:pointer" : "" }, svg);
        const ly = py + dir * 56;
        S("rect", { x: px - 24, y: ly - 14, width: 48, height: 26, rx: 8, fill: "var(--surface)", stroke: col, "stroke-width": 2.5 }, pill);
        S("text", { x: px, y: ly + 4, "text-anchor": "middle", class: "s-mono", style: `font-size:12px;font-weight:700;fill:${col}`, text: lab + (v === null || v === undefined ? "" : "=" + v) }, pill);
        if (isIn) pill.addEventListener("click", () => { st.inp[lab] = (st.inp[lab] || 0) ^ 1; draw(); });
      }));
      msg.innerHTML = st.pwr
        ? `<b>${st.part} — ${ic.name}</b> · ขา 14 = V<sub>CC</sub> · ขา 7 = GND · เกทที่ไม่ใช้ห้ามปล่อยอินพุตลอย (หัวข้อ 3.7.8)` + (st.part === "7402" ? "<br>⚠️ 7402 จัดขาต่างจาก 7400: เอาต์พุตอยู่ขา 1, 4, 10, 13" : st.part === "7404" ? "<br>7404 มีอินเวอร์เตอร์ 6 ตัว (hex)" : "")
        : "ไฟเลี้ยงปิด → เอาต์พุตไม่มีความหมาย (ในวงจรจริง ลอจิกโพรบจะไม่แสดง HIGH/LOW ที่ถูกต้อง) — ตรวจสายไฟเลี้ยงเป็นอันดับแรกเสมอเมื่อวงจรไม่ทำงาน";
    }
    draw();
  };

  /* =====================================================
     6) ถอดรหัสเบอร์ไอซี (3.7.2)
     ===================================================== */
  const FAM = {
    "": "Standard TTL (TTL มาตรฐานรุ่นแรก)", LS: "Low-power Schottky TTL", S: "Schottky TTL", ALS: "Advanced Low-power Schottky TTL", F: "Fast TTL",
    HC: "High-speed CMOS (2–6 V)", HCT: "High-speed CMOS อินพุตระดับ TTL (4.5–5.5 V)", LVC: "Low-Voltage CMOS (1.65–3.6 V, อินพุตทน 5 V)",
    AC: "Advanced CMOS", ACT: "Advanced CMOS อินพุตระดับ TTL", AHC: "Advanced High-speed CMOS", ALVC: "Advanced Low-Voltage CMOS", AUP: "Advanced Ultra-low-Power CMOS",
  };
  const FN = { "00": "NAND 2 อินพุต × 4 (quad)", "02": "NOR 2 อินพุต × 4", "04": "อินเวอร์เตอร์ × 6 (hex)", "08": "AND 2 อินพุต × 4", "10": "NAND 3 อินพุต × 3 (triple)", "14": "อินเวอร์เตอร์แบบ Schmitt trigger × 6", "20": "NAND 4 อินพุต × 2 (dual)", "27": "NOR 3 อินพุต × 3", "32": "OR 2 อินพุต × 4", "86": "XOR 2 อินพุต × 4" };
  const PRE = { SN: "Texas Instruments", MC: "ON Semiconductor / Motorola", DM: "National Semiconductor", CD: "Texas Instruments (เดิม RCA)", "": "ไม่มีอักษรนำหน้า (เช่น Nexperia)" };
  const PKG = { N: "DIP (through-hole) — เหมาะกับ breadboard", D: "SOIC (surface mount)", DR: "SOIC (ม้วนเทป)", PW: "TSSOP (surface mount)", PWR: "TSSOP (ม้วนเทป)", "": "ไม่ระบุตัวถัง" };
  W.partdecoder = function (el) {
    const body = U.shell(el, "INTERACTIVE", "ถอดรหัสเบอร์ไอซีอนุกรม 74",
      "พิมพ์เบอร์ไอซี เช่น SN74LVC00AD, SN74HCT08N, 74HC32, DM74LS04N — ระบบจะแยกส่วนประกอบตามตารางที่ 3.11 (รหัสตัวถังอ้างอิงแบบของ TI)");
    const inp = U.input("เบอร์ไอซี:", "SN74LVC00AD", () => draw(), { width: 200 });
    const ex = H("div", { class: "controls" });
    ["SN74LVC00AD", "SN74HCT08N", "SN74LS04N", "74HC32", "SN54LS00J", "SN74HC86PW"].forEach((p) => ex.appendChild(U.btn(p, () => { inp.input.value = p; draw(); })));
    const out = H("div", { style: "margin-top:10px" });
    body.append(inp, ex, out);
    function draw() {
      const raw = inp.input.value.toUpperCase().replace(/\s/g, "");
      const m = raw.match(/^([A-Z]{0,2}?)(54|74)([A-Z]*?)(\d{2,3})(A?)([A-Z]{0,3})$/);
      inp.input.classList.toggle("bad", !m);
      if (!m) { out.innerHTML = '<div class="callout warn">รูปแบบเบอร์ไม่ถูกต้อง (ตัวอย่าง: SN74HC00N)</div>'; return; }
      let [, pre, ser, fam, fn, rev, pkg] = m;
      if (!(fam in FAM)) { out.innerHTML = `<div class="callout warn">ไม่รู้จักตระกูล “${fam}” ในตัวอย่างนี้</div>`; return; }
      const parts = [
        ["อักษรนำหน้า", pre || "—", PRE[pre] || "รหัสผู้ผลิต", "#7c3aed"],
        ["อนุกรม", ser, ser === "54" ? "เกรดทหาร (−55 ถึง 125 °C)" : "เกรดใช้งานทั่วไป/อุตสาหกรรม", "#0ea5e9"],
        ["ตระกูล", fam || "—", FAM[fam], "#e8590c"],
        ["ฟังก์ชัน", fn, FN[fn] || "ไม่อยู่ในตารางที่ 3.10 — ตรวจสอบ datasheet", "#12b886"],
        ["รุ่นปรับปรุง", rev || "—", rev ? "รุ่นที่ปรับปรุงคุณลักษณะ" : "ไม่มี", "#64748b"],
        ["ตัวถัง", pkg || "—", PKG[pkg] || (pkg === "J" ? "ceramic DIP (มักใช้กับอนุกรม 54)" : "ดู datasheet ของผู้ผลิต"), "#db2777"],
      ];
      out.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:4px;font:700 30px var(--mono);margin-bottom:12px">${parts.map((p) => (p[1] === "—" ? "" : `<span style="color:${p[3]};border-bottom:4px solid ${p[3]};padding:0 2px">${p[1]}</span>`)).join("")}</div>` +
        `<table class="data" style="width:100%">${parts.map((p) => `<tr><td style="font-family:var(--font);text-align:left;width:130px"><b style="color:${p[3]}">${p[0]}</b></td><td>${p[1]}</td><td style="text-align:left;font-family:var(--font)">${p[2]}</td></tr>`).join("")}</table>` +
        (fam === "LS" || fam === "" ? `<p class="w-hint" style="margin-top:8px">ไฟเลี้ยง 5 V ±5% (4.75–5.25 V)</p>` : "");
    }
    draw();
  };

  /* =====================================================
     7) Noise margin และการเชื่อมต่อต่างตระกูล (3.7.3, 3.7.4, 3.7.7)
     ===================================================== */
  const FAMS = {
    LS: { name: "74LS @5 V", vcc: 5, vih: 2.0, vil: 0.8, voh: 2.7, vol: 0.5, ioh: 0.4, iol: 8, iih: 0.02, iil: 0.4, tol: 5.5 },
    HC: { name: "74HC @5 V", vcc: 5, vih: 3.5, vil: 1.5, voh: 4.4, vol: 0.33, ioh: 4, iol: 4, iih: 0.001, iil: 0.001, tol: 5.5 },
    HCT: { name: "74HCT @5 V", vcc: 5, vih: 2.0, vil: 0.8, voh: 4.4, vol: 0.33, ioh: 4, iol: 4, iih: 0.001, iil: 0.001, tol: 5.5 },
    LVC: { name: "74LVC @3.3 V", vcc: 3.3, vih: 2.0, vil: 0.8, voh: 2.4, vol: 0.4, ioh: 24, iol: 24, iih: 0.005, iil: 0.005, tol: 5.5 },
    HC33: { name: "74HC @3.3 V*", vcc: 3.3, vih: 0.7 * 3.3, vil: 0.3 * 3.3, voh: null, vol: null, iih: 0.001, iil: 0.001, tol: 3.3 + 0.5, rxOnly: true },
  };
  W.noisemargin = function (el) {
    const body = U.shell(el, "INTERACTIVE", "Noise margin: เกทขับ (driver) → เกทรับ (receiver)",
      "เลือกตระกูลของเกทขับและเกทรับ ระบบจะคำนวณ NMH = VOH(min) − VIH(min) และ NML = VIL(max) − VOL(max) · เลื่อนแถบสัญญาณรบกวนเพื่อดูว่าเกทรับยังอ่านค่าถูกหรือไม่");
    const st = { d: "LS", r: "LS", noise: 0.5 };
    const ctr = H("div", { class: "controls" });
    const drv = U.seg(Object.entries(FAMS).filter(([, f]) => !f.rxOnly).map(([k, f]) => [k, f.name]), st.d, (k) => { st.d = k; draw(); });
    const rcv = U.seg(Object.entries(FAMS).map(([k, f]) => [k, f.name]), st.r, (k) => { st.r = k; draw(); });
    const r1 = H("div", { class: "controls" }); r1.append(H("b", null, "เกทขับ:"), drv);
    const r2 = H("div", { class: "controls" }); r2.append(H("b", null, "เกทรับ:"), rcv);
    const nl = H("label"); const ns = H("input", { type: "range", min: 0, max: 2.5, step: 0.05, value: st.noise, style: "width:180px;accent-color:var(--accent)" }); const nv = H("b", { class: "mono" });
    ns.addEventListener("input", () => { st.noise = +ns.value; draw(); }); nl.append("สัญญาณรบกวน ± ", ns, nv);
    const r3 = H("div", { class: "controls" }); r3.append(nl);
    const ex = H("div", { class: "controls" }); ex.appendChild(H("span", { class: "w-hint", style: "margin:0" }, "กรณีในเล่ม:"));
    [["ตย. 3.13 (I) LS→LS", "LS", "LS", 0.5], ["ตย. 3.13 (II) HC→HC", "HC", "HC", 0.5], ["LVC→HC ✗", "LVC", "HC", 0], ["LVC→HCT ✓", "LVC", "HCT", 0], ["LS→HC ✗", "LS", "HC", 0], ["HC 5 V→LVC", "HC", "LVC", 0], ["HC 5 V→HC 3.3 V ✗", "HC", "HC33", 0]].forEach(([t, d, r, n]) =>
      ex.appendChild(U.btn(t, () => { st.d = d; st.r = r; st.noise = n; ns.value = n; drv.set(d); rcv.set(r); draw(); })));
    const svg = S("svg", { viewBox: "0 0 760 300" });
    const out = H("div", { class: "callout" });
    body.append(r1, r2, r3, ex, svg, out);
    function draw() {
      nv.textContent = st.noise.toFixed(2) + " V";
      const D = FAMS[st.d], R = FAMS[st.r];
      const nmh = D.voh - R.vih, nml = R.vil - D.vol;
      const vmax = 5.5, X = 170, Wd = 120, Y = (v) => 270 - (v / vmax) * 250;
      svg.innerHTML = "";
      for (let v = 0; v <= 5.5; v += 0.5) { S("line", { x1: 40, x2: 720, y1: Y(v), y2: Y(v), class: "s-grid" }, svg); if (v % 1 === 0) S("text", { x: 34, y: Y(v) + 4, "text-anchor": "end", class: "s-mono", text: v + " V" }, svg); }
      // driver bar
      const bar = (x, label, segs) => { S("text", { x: x + Wd / 2, y: 14, "text-anchor": "middle", class: "s-text", style: "font-weight:700", text: label }, svg); segs.forEach(([a, b, c, t]) => { S("rect", { x, y: Y(b), width: Wd, height: Y(a) - Y(b), fill: c, opacity: 0.35 }, svg); if (t) S("text", { x: x + Wd / 2, y: (Y(a) + Y(b)) / 2 + 4, "text-anchor": "middle", class: "s-text", style: "font-size:12px;font-weight:700", text: t }, svg); }); };
      bar(X, "เอาต์พุตเกทขับ " + D.name, [[D.voh, D.vcc, "var(--hi)", "HIGH"], [0, D.vol, "var(--lo)", "LOW"]]);
      bar(X + 360, "อินพุตเกทรับ " + R.name, [[R.vih, Math.max(R.vcc, R.vih), "var(--hi)", "HIGH"], [R.vil, R.vih, "var(--bad)", "ไม่กำหนด"], [0, R.vil, "var(--lo)", "LOW"]]);
      [["VOH(min)", D.voh, X], ["VOL(max)", D.vol, X]].forEach(([n, v, x]) => { S("line", { x1: x + Wd, x2: X + 360, y1: Y(v), y2: Y(v), class: "s-dim" }, svg); S("text", { x: x - 4, y: Y(v) + 4, "text-anchor": "end", class: "s-mono", style: "font-size:11px;fill:var(--brand)", text: `${n} ${v}` }, svg); });
      [["VIH(min)", R.vih], ["VIL(max)", R.vil]].forEach(([n, v]) => S("text", { x: X + 360 + Wd + 6, y: Y(v) + 4, class: "s-mono", style: "font-size:11px;fill:var(--brand)", text: `${n} ${+v.toFixed(2)}` }, svg));
      // NM arrows
      const arrow = (x, v1, v2, t, ok) => { const c = ok ? "var(--hi)" : "var(--bad)"; S("line", { x1: x, x2: x, y1: Y(v1), y2: Y(v2), stroke: c, "stroke-width": 4 }, svg); S("text", { x: x + 8, y: (Y(v1) + Y(v2)) / 2 + 4, class: "s-mono", style: `font-size:13px;font-weight:700;fill:${c}`, text: t }, svg); };
      arrow(415, D.voh, R.vih, `NMH = ${nmh.toFixed(2)} V`, nmh > 0);
      arrow(415, D.vol, R.vil, `NML = ${nml.toFixed(2)} V`, nml > 0);
      // noise test points
      const hiIn = D.voh - st.noise, loIn = D.vol + st.noise;
      S("circle", { cx: X + 360 + Wd / 2 - 25, cy: Y(Math.max(0, hiIn)), r: 7, fill: hiIn >= R.vih ? "var(--hi)" : "var(--bad)" }, svg);
      S("circle", { cx: X + 360 + Wd / 2 + 25, cy: Y(loIn), r: 7, fill: loIn <= R.vil ? "var(--hi)" : "var(--bad)" }, svg);
      const over = D.vcc > R.tol; // แรงดันเอาต์พุตสูงกว่าที่อินพุตทนได้
      const ok = nmh > 0 && nml > 0 && !over;
      out.className = "callout " + (ok ? "tip" : "warn");
      out.innerHTML = `NMH = ${D.voh} − ${+R.vih.toFixed(2)} = <b>${nmh.toFixed(2)} V</b> · NML = ${+R.vil.toFixed(2)} − ${D.vol} = <b>${nml.toFixed(2)} V</b><br>` +
        (over ? `⚠️ <b>แรงดันเกินพิกัด:</b> เอาต์พุต ${D.vcc} V เข้าอินพุต CMOS ที่ไฟเลี้ยง ${R.vcc} V ซึ่งไม่ทน 5 V — กระแสไหลผ่านไดโอดป้องกันเข้าไฟเลี้ยง อาจทำให้ไอซีเสียหาย → ใช้ 74LVC (อินพุตทน 5 V)` :
          ok ? `✓ ต่อกันได้ (NM เป็นบวกทั้งคู่) · ความทนทานต่อสัญญาณรบกวนของวงจร = min(NMH, NML) = <b>${Math.min(nmh, nml).toFixed(2)} V</b>` :
            `✗ ต่อกันโดยตรงไม่ได้ — ${nmh <= 0 ? "NMH เป็นลบ เกทรับไม่รับประกันว่าจะอ่าน HIGH ถูก" : "NML เป็นลบ"} ${st.r === "HC" && D.vih !== undefined ? "→ ใช้ 74HCT เป็นตัวแปลงระดับแรงดัน" : ""}`) +
        `<br><small>สัญญาณรบกวน ${st.noise.toFixed(2)} V: HIGH ตกเหลือ ${Math.max(0, hiIn).toFixed(2)} V → ${hiIn >= R.vih ? "ยังอ่านเป็น HIGH ✓" : "อ่านผิด ✗"} · LOW ขึ้นเป็น ${loIn.toFixed(2)} V → ${loIn <= R.vil ? "ยังอ่านเป็น LOW ✓" : "อ่านผิด ✗"}</small>` +
        (R.rxOnly ? "<br><small>* 74HC ที่ 3.3 V ใช้ระดับอินพุตโดยประมาณ 0.7/0.3 V<sub>CC</sub> ตามที่กล่าวในหัวข้อ 3.7.3</small>" : "");
    }
    draw();
  };

  /* =====================================================
     8) Fan-out (3.7.5)
     ===================================================== */
  W.fanout = function (el) {
    const body = U.shell(el, "INTERACTIVE", "Fan-out: เอาต์พุตหนึ่งขับอินพุตได้กี่ตัว",
      "fan-outL = IOL(max) / IIL(max) · fan-outH = IOH(max) / IIH(max) · fan-out = ค่าที่น้อยกว่า (ปัดลง) — เพิ่มจำนวนโหลดเพื่อดูว่าเกินพิกัดเมื่อใด");
    const st = { d: "LS", r: "LS", n: 10 };
    const fams = { LS: FAMS.LS, HC: FAMS.HC, HCT: FAMS.HCT, LVC: FAMS.LVC, STD: { name: "TTL มาตรฐาน (74)", iol: 16, ioh: 0.4, iil: 1.6, iih: 0.04 } };
    const r1 = H("div", { class: "controls" }), r2 = H("div", { class: "controls" });
    const ds = U.seg(Object.entries(fams).map(([k, f]) => [k, f.name]), st.d, (k) => { st.d = k; draw(); });
    const rs = U.seg(Object.entries(fams).map(([k, f]) => [k, f.name]), st.r, (k) => { st.r = k; draw(); });
    r1.append(H("b", null, "เกทขับ:"), ds); r2.append(H("b", null, "เกทรับ:"), rs);
    const sl = H("input", { type: "range", min: 1, max: 40, value: st.n, style: "width:220px;accent-color:var(--brand)" }); const sv = H("b", { class: "mono" });
    sl.addEventListener("input", () => { st.n = +sl.value; draw(); });
    const r3 = H("div", { class: "controls" }); const lab = H("label"); lab.append("จำนวนอินพุตที่ต่อ ", sl, sv); r3.append(lab);
    const ex = H("div", { class: "controls" }); ex.appendChild(H("span", { class: "w-hint", style: "margin:0" }, "กรณีในเล่ม:"));
    [["ตย. 3.14 (I) LS→LS", "LS", "LS"], ["ตย. 3.14 (II) HC→LS", "HC", "LS"]].forEach(([t, d, r]) => ex.appendChild(U.btn(t, () => { st.d = d; st.r = r; ds.set(d); rs.set(r); draw(); })));
    const vis = H("div", { style: "display:flex;flex-wrap:wrap;gap:4px;margin:10px 0" });
    const out = H("div", { class: "callout" });
    body.append(r1, r2, r3, ex, vis, out);
    function draw() {
      sv.textContent = st.n + " ตัว";
      const D = fams[st.d], R = fams[st.r];
      const fl = D.iol / R.iil, fh = D.ioh / R.iih, fo = Math.floor(Math.min(fl, fh) + 1e-9);
      vis.innerHTML = "";
      for (let i = 0; i < st.n; i++) vis.appendChild(H("span", { style: `width:22px;height:22px;border-radius:5px;display:inline-block;background:${i < fo ? "var(--hi)" : "var(--bad)"};opacity:${i < fo ? 0.75 : 0.9}`, title: "อินพุตที่ " + (i + 1) }));
      const cmos = R.iil <= 0.005;
      const ok = st.n <= fo;
      out.className = "callout " + (ok ? "tip" : "warn");
      const f = (x) => (x >= 1000 ? Math.round(x).toLocaleString() : +x.toFixed(2));
      out.innerHTML = `fan-out<sub>L</sub> = ${D.iol} mA / ${R.iil} mA = <b>${f(fl)}</b> · fan-out<sub>H</sub> = ${D.ioh} mA / ${R.iih * 1000} µA = <b>${f(fh)}</b><br>` +
        `fan-out = min = <b style="font-size:1.2em">${f(fo)}</b> ${fl < fh ? "(ถูกจำกัดด้วยสถานะ LOW)" : fl > fh ? "(ถูกจำกัดด้วยสถานะ HIGH)" : ""}<br>` +
        (ok ? `✓ ต่อ ${st.n} อินพุตได้` : `✗ ต่อ ${st.n} อินพุตเกินพิกัด — แรงดันเอาต์พุตจะเลื่อนออกนอกช่วงที่รับประกัน (V<sub>OH</sub> ลดลง / V<sub>OL</sub> สูงขึ้น)`) +
        (cmos ? `<br><small>อินพุต CMOS กินกระแสเพียงระดับ µA จึงได้ fan-out หลายพัน แต่ในทางปฏิบัติถูกจำกัดด้วยความจุอินพุต (3–10 pF ต่ออินพุต) ที่ทำให้ขอบสัญญาณช้าลง</small>` : "");
    }
    draw();
  };

  /* =====================================================
     9) Propagation delay และกำลังไฟฟ้า (3.7.6)
     ===================================================== */
  W.propdelay = function (el) {
    const body = U.shell(el, "INTERACTIVE", "Propagation delay สะสม และกำลังไฟฟ้าแบบพลวัตของ CMOS",
      "อินเวอร์เตอร์ต่ออนุกรม n ชั้น — เวลาหน่วงสะสมทุกชั้น (tPLH, tPHL วัดที่จุด 50%) · ส่วนล่างคำนวณ PD = (CPD + CL)·VCC²·f");
    const st = { n: 3, tplh: 9, tphl: 10, cpd: 20, cl: 0, vcc: 5, f: 1 };
    const sl = (label, k, min, max, step, unit) => { const lab = H("label"); const i = H("input", { type: "range", min, max, step, value: st[k], style: "width:150px;accent-color:var(--brand)" }); const b = H("b", { class: "mono" }); const show = () => (b.textContent = st[k] + " " + unit); i.addEventListener("input", () => { st[k] = +i.value; show(); draw(); }); show(); lab.append(label + " ", i, b); return lab; };
    const r1 = H("div", { class: "controls" }); r1.append(sl("จำนวนชั้น", "n", 1, 6, 1, "ชั้น"), sl("tPLH", "tplh", 1, 30, 1, "ns"), sl("tPHL", "tphl", 1, 30, 1, "ns"));
    const svg = S("svg", { viewBox: "0 0 940 300" });
    const msg = H("div", { class: "callout tip" });
    const r2 = H("div", { class: "controls" }); r2.append(sl("C_PD", "cpd", 5, 50, 1, "pF"), sl("C_L", "cl", 0, 100, 5, "pF"), sl("V_CC", "vcc", 1.8, 5, 0.1, "V"), sl("f", "f", 0.1, 50, 0.1, "MHz"));
    const pw = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(r1, svg, msg, H("h4", { style: "margin:14px 0 4px" }, "กำลังไฟฟ้าแบบพลวัต (CMOS)"), r2, pw);
    function draw() {
      svg.innerHTML = "";
      const rows = st.n + 1, rowH = 260 / rows, X0 = 70, Xs = 860, T = 120; // ns window
      const X = (t) => X0 + (t / T) * (Xs - X0);
      const tr = 2; // edge time ns (visual)
      const rise = 15, fall = 65;
      for (let k = 0; k <= st.n; k++) {
        const yH = 10 + k * rowH, yL = yH + rowH * 0.6, ym = (yH + yL) / 2;
        // stage k: input polarity alternates
        let d1 = 0, d2 = 0;
        for (let j = 0; j < k; j++) { // edge j: input rising -> output falling (tPHL) then alternates
          d1 += j % 2 === 0 ? st.tphl : st.tplh; d2 += j % 2 === 0 ? st.tplh : st.tphl;
        }
        const inv = k % 2 === 1;
        const lo = inv ? yH : yL, hi = inv ? yL : yH;
        const e1 = rise + d1, e2 = fall + d2;
        const d = `M${X0},${lo} L${X(e1 - tr / 2)},${lo} L${X(e1 + tr / 2)},${hi} L${X(e2 - tr / 2)},${hi} L${X(e2 + tr / 2)},${lo} L${Xs},${lo}`;
        S("path", { d, class: k === 0 ? "s-wave" : k === st.n ? "s-hi" : "s-wave2", "stroke-width": 2.2 }, svg);
        S("text", { x: 8, y: ym + 4, class: "s-mono", style: "font-size:12px;font-weight:700", text: k === 0 ? "IN" : "ชั้น " + k }, svg);
        S("line", { x1: X(e1), x2: X(e1), y1: 6, y2: 270, stroke: "var(--ink-3)", "stroke-dasharray": "2 4", opacity: k ? 0.4 : 0.8 }, svg);
      }
      for (let t = 0; t <= T; t += 20) S("text", { x: X(t), y: 292, "text-anchor": "middle", class: "s-mono", style: "font-size:11px", text: t + " ns" }, svg);
      let dr = 0, df = 0;
      for (let j = 0; j < st.n; j++) { dr += j % 2 === 0 ? st.tphl : st.tplh; df += j % 2 === 0 ? st.tplh : st.tphl; }
      const tp = (st.tplh + st.tphl) / 2;
      msg.innerHTML = `t<sub>p</sub> = (t<sub>PLH</sub> + t<sub>PHL</sub>)/2 = (${st.tplh} + ${st.tphl})/2 = <b>${tp} ns</b> ต่อชั้น · ผ่าน ${st.n} ชั้น: ขอบขาขึ้นของอินพุตถึงเอาต์พุตใช้ <b>${dr} ns</b>, ขอบขาลงใช้ <b>${df} ns</b> (≈ ${st.n} × t<sub>p</sub> = ${st.n * tp} ns)` +
        (st.n % 2 ? "<br><small>จำนวนชั้นเป็นเลขคี่ → เอาต์พุตกลับเฟสจากอินพุต</small>" : "<br><small>จำนวนชั้นเป็นเลขคู่ → เอาต์พุตเฟสเดียวกับอินพุต</small>");
      const pd = (st.cpd + st.cl) * 1e-12 * st.vcc ** 2 * st.f * 1e6; // W
      const pd5 = (st.cpd + st.cl) * 1e-12 * 25 * st.f * 1e6;
      pw.innerHTML = `P<sub>D</sub> = (${st.cpd} + ${st.cl}) pF × (${st.vcc} V)² × ${st.f} MHz = <b>${(pd * 1e3).toFixed(3)} mW</b>` +
        `<br>speed-power product = t<sub>p</sub> × P<sub>D</sub> = ${tp} ns × ${(pd * 1e3).toFixed(3)} mW = <b>${(tp * pd * 1e3).toFixed(2)} pJ</b>` +
        (st.vcc < 5 ? `<br><small>เทียบกับที่ 5 V: กำลังเหลือ (${st.vcc}/5)² = ${(st.vcc ** 2 / 25).toFixed(4)} เท่า (ลดลง ${((1 - st.vcc ** 2 / 25) * 100).toFixed(0)}%)</small>` : "<br><small>ลองลด V<sub>CC</sub> เป็น 3.3 V — กำลังจะเหลือ 0.4356 เท่า</small>");
    }
    draw();
  };
})();
