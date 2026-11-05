/* =========================================================
   บทที่ 7 — interactive widgets (วงจรคอมไบเนชันของฟังก์ชันต่าง ๆ)
   adder · paradder · comparator · decoder · seg7 · encoder · graycode · mux
   ========================================================= */
(function () {
  const DLD = window.DLD, U = DLD.ui, W = DLD.widgets;
  const H = (...a) => DLD.h(...a);
  const S = (...a) => DLD.svg(...a);
  const wire = (g, d, v) => S("path", { d, class: v === null ? "s-wire0" : v ? "s-wire1" : "s-wire0", style: v === null ? "stroke-dasharray:4 4;opacity:.5" : "" }, g);
  const lamp = (g, x, y, v, r) => { if (v) S("circle", { cx: x, cy: y, r: (r || 14) + 9, fill: "var(--hi)", opacity: 0.2 }, g); S("circle", { cx: x, cy: y, r: r || 14, fill: v ? "var(--hi)" : "var(--surface-2)", stroke: "var(--ink-3)", "stroke-width": 2 }, g); };
  const dot = (g, x, y) => S("circle", { cx: x, cy: y, r: 3.5, fill: "var(--ink)" }, g);
  const txt = (g, x, y, t, o) => { o = o || {}; return S("text", { x, y, "text-anchor": o.a || "start", class: "s-mono", style: `font-size:${o.size || 14}px;font-weight:${o.w || 700};fill:${o.c || "var(--ink)"};${o.ov ? "text-decoration:overline;" : ""}`, text: t }, g); };
  const shade = (g, x, y, w, h, label) => { S("rect", { x, y, width: w, height: h, rx: 10, fill: "var(--brand-soft)", stroke: "var(--brand)", "stroke-dasharray": "5 4", opacity: 0.8 }, g); if (label) txt(g, x + 8, y + 16, label, { size: 12, c: "var(--brand)" }); };
  const sub = (s) => s.replace(/([A-Za-zΣ])(\d+|in|out|n−1|n)\b/g, "$1<sub>$2</sub>");
  const ov = (h) => `<span class="ov">${h}</span>`;
  const bin = (v, n) => v.toString(2).padStart(n, "0");
  function toggles(vars, env, onChange, labels) {
    const row = H("div", { class: "controls" });
    vars.forEach((v, i) => {
      const b = H("button", { type: "button", class: "btn sm", "aria-pressed": String(!!env[v]) }, `${labels ? labels[i] : v} = ${env[v] ? 1 : 0}`);
      b.addEventListener("click", () => { env[v] = env[v] ? 0 : 1; onChange(); });
      row.appendChild(b);
    });
    return row;
  }
  const flexRow = () => H("div", { style: "display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start" });
  const hlRow = (on) => (on ? ' style="background:var(--brand-soft);font-weight:700"' : "");

  /* =====================================================
     1) Half-adder / Full-adder (7.1)
     ===================================================== */
  W.adder = function (el) {
    let mode = el.dataset.mode || "full";
    const body = U.shell(el, "INTERACTIVE", "วงจร Half-adder และ Full-adder",
      "กดเปลี่ยนค่าอินพุต — เส้นสีเขียว = 1 · กรอบที่ระบายพื้นคือ half-adder (รูปที่ 7.5–7.6) · แถวที่ไฮไลต์ในตารางคือกรณีปัจจุบัน");
    const env = { A: 1, B: 0, Cin: 1 };
    const ctr = H("div", { class: "controls" });
    ctr.append(U.seg([["half", "Half-adder (รูปที่ 7.2)"], ["full", "Full-adder (รูปที่ 7.5)"]], mode, (v) => { mode = v; draw(); }));
    const tg = H("div"), svg = S("svg", { style: "max-width:720px" }), tbl = H("div", { style: "flex:0 0 auto" });
    const left = H("div", { style: "flex:1 1 380px;min-width:0" }); left.append(tg, svg);
    const row = flexRow(); row.append(left, tbl);
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, row, msg);
    function draw() {
      const full = mode === "full";
      tg.innerHTML = ""; tg.appendChild(toggles(full ? ["A", "B", "Cin"] : ["A", "B"], env, draw, full ? ["A", "B", "Cᵢₙ"] : null));
      const A = env.A, B = env.B, C = full ? env.Cin : 0;
      const s1 = A ^ B, c1 = A & B, sum = s1 ^ C, c2 = s1 & C, cout = c1 | c2;
      svg.innerHTML = "";
      const bg = S("g", null, svg), wires = S("g", null, svg), g = S("g", null, svg);
      if (!full) {
        svg.setAttribute("viewBox", "0 0 560 250");
        shade(bg, 100, 18, 300, 220, "Half-adder");
        const gx = DLD.drawGate(g, "XOR", 200, 75, 2), ga = DLD.drawGate(g, "AND", 200, 180, 2);
        txt(svg, 14, gx.inputs[0].y + 5, `A=${A}`); txt(svg, 14, gx.inputs[1].y + 22, `B=${B}`);
        wire(wires, `M60,${gx.inputs[0].y} H${gx.inputs[0].x}`, A);
        wire(wires, `M120,${gx.inputs[0].y} V${ga.inputs[0].y} H${ga.inputs[0].x}`, A); dot(svg, 120, gx.inputs[0].y);
        wire(wires, `M60,${gx.inputs[1].y + 17} H150 V${gx.inputs[1].y} H${gx.inputs[1].x}`, B);
        wire(wires, `M150,${gx.inputs[1].y + 17} V${ga.inputs[1].y} H${ga.inputs[1].x}`, B); dot(svg, 150, gx.inputs[1].y + 17);
        wire(wires, `M${gx.output.x},75 H470`, s1); wire(wires, `M${ga.output.x},180 H470`, c1);
        lamp(svg, 490, 75, s1); lamp(svg, 490, 180, c1);
        txt(svg, 490, 112, `Σ=${s1}`, { a: "middle" }); txt(svg, 490, 217, `Cout=${c1}`, { a: "middle" });
      } else {
        svg.setAttribute("viewBox", "0 0 800 320");
        shade(bg, 150, 22, 130, 284, "HA 1"); shade(bg, 400, 58, 130, 184, "HA 2");
        const x1 = DLD.drawGate(g, "XOR", 180, 80, 2), a1 = DLD.drawGate(g, "AND", 180, 260, 2);
        const x2 = DLD.drawGate(g, "XOR", 430, 115, 2), a2 = DLD.drawGate(g, "AND", 430, 205, 2);
        const or = DLD.drawGate(g, "OR", 610, 240, 2);
        txt(svg, 10, x1.inputs[0].y + 5, `A=${A}`); txt(svg, 10, x1.inputs[1].y + 25, `B=${B}`);
        wire(wires, `M56,${x1.inputs[0].y} H${x1.inputs[0].x}`, A);
        wire(wires, `M100,${x1.inputs[0].y} V${a1.inputs[0].y} H${a1.inputs[0].x}`, A); dot(svg, 100, x1.inputs[0].y);
        const by = x1.inputs[1].y + 20;
        wire(wires, `M56,${by} H128 V${x1.inputs[1].y} H${x1.inputs[1].x}`, B);
        wire(wires, `M128,${by} V${a1.inputs[1].y} H${a1.inputs[1].x}`, B); dot(svg, 128, by);
        // Cin มาจากด้านบน → in0 ของ HA2, A⊕B → in1
        txt(svg, 400, 20, `Cin=${C}`, { a: "middle" });
        wire(wires, `M400,28 V${x2.inputs[0].y} H${x2.inputs[0].x}`, C);
        wire(wires, `M400,${x2.inputs[0].y} V${a2.inputs[0].y} H${a2.inputs[0].x}`, C); dot(svg, 400, x2.inputs[0].y);
        wire(wires, `M${x1.output.x},80 H375 V${x2.inputs[1].y} H${x2.inputs[1].x}`, s1);
        wire(wires, `M375,${x2.inputs[1].y} V${a2.inputs[1].y} H${a2.inputs[1].x}`, s1); dot(svg, 375, x2.inputs[1].y);
        txt(svg, x1.output.x + 4, 72, `A⊕B=${s1}`, { size: 12, c: "var(--accent)" });
        txt(svg, a1.output.x + 6, 252, `AB=${c1}`, { size: 12, c: "var(--accent)" });
        txt(svg, a2.output.x + 6, 197, `(A⊕B)Cin=${c2}`, { size: 12, c: "var(--accent)" });
        wire(wires, `M${a2.output.x},205 H575 V${or.inputs[0].y} H${or.inputs[0].x}`, c2);
        wire(wires, `M${a1.output.x},260 H575 V${or.inputs[1].y} H${or.inputs[1].x}`, c1);
        wire(wires, `M${x2.output.x},115 H730`, sum); wire(wires, `M${or.output.x},240 H730`, cout);
        lamp(svg, 752, 115, sum); lamp(svg, 752, 240, cout);
        txt(svg, 752, 150, `Σ=${sum}`, { a: "middle" }); txt(svg, 752, 275, `Cout=${cout}`, { a: "middle" });
      }
      const S_ = full ? sum : s1, Co = full ? cout : c1;
      const vars = full ? ["A", "B", "Cᵢₙ"] : ["A", "B"];
      const rows = DLD.combos(vars.length);
      tbl.innerHTML = `<table class="data" style="text-align:center"><tr>${vars.map((v) => `<th>${v}</th>`).join("")}<th>C<sub>out</sub></th><th>Σ</th></tr>` +
        rows.map((r) => { const t = r.reduce((a, b) => a + b, 0); const cur = r.every((b, i) => b === [A, B, C][i]);
          return `<tr${hlRow(cur)}>${r.map((b) => `<td>${b}</td>`).join("")}<td style="color:${t >> 1 ? "var(--hi)" : "var(--ink-3)"}">${t >> 1}</td><td style="color:${t & 1 ? "var(--hi)" : "var(--ink-3)"}">${t & 1}</td></tr>`; }).join("") + "</table>";
      const total = A + B + C;
      msg.innerHTML = (full ? `Σ = (A ⊕ B) ⊕ C<sub>in</sub> · C<sub>out</sub> = AB + (A ⊕ B)C<sub>in</sub>` : `Σ = A ⊕ B · C<sub>out</sub> = AB`) +
        `<br><b>${A} + ${B}${full ? " + " + C : ""} = ${total}</b> (ฐานสิบ) = <b>${Co}${S_}</b><sub>2</sub> → Σ = ${S_}, C<sub>out</sub> = ${Co}` +
        (full ? "" : ` · half-adder ไม่มีอินพุตตัวทด จึงใช้ได้เฉพาะบิต LSB`);
    }
    draw();
  };

  /* =====================================================
     2) Parallel binary adder 4 / 8 บิต (7.2)
     ===================================================== */
  W.paradder = function (el) {
    const n = +(el.dataset.bits || 4);
    const body = U.shell(el, "INTERACTIVE", n === 8 ? "Adder 4 บิต 2 ชุดต่อแบบ cascade เป็น 8 บิต (รูปที่ 7.9)" : "Parallel binary adder ขนาด 4 บิต (รูปที่ 7.8 · ตารางที่ 7.3)",
      "คลิกบิตของ A และ B เพื่อสลับ 0/1 · กด “ทีละขั้น” เพื่อดูตัวทดส่งต่อ (ripple carry) จากบิต LSB ไปยัง MSB ทีละตัว เหมือนวิธีทำของตัวอย่างที่ 7.3");
    const st = n === 8 ? { a: [1, 0, 1, 1, 0, 1, 0, 1], b: [0, 1, 1, 0, 1, 1, 1, 0], cin: 0, step: 8 } : { a: [1, 1, 0, 0], b: [1, 1, 0, 0], cin: 0, step: 4 };
    const ctr = H("div", { class: "controls" });
    const stepBtn = U.btn("ทีละขั้น ▶", () => { st.step = st.step >= n ? 0 : st.step + 1; draw(); });
    ctr.append(stepBtn, U.btn("แสดงทั้งหมด", () => { st.step = n; draw(); }), U.btn("C₀ (input carry)", () => { st.cin ^= 1; draw(); }));
    if (n === 4) {
      ctr.append(U.btn("ตย. 7.2: 101 + 011", () => { st.a = [0, 1, 0, 1]; st.b = [0, 0, 1, 1]; st.cin = 0; st.step = 0; draw(); }),
        U.btn("ตย. 7.3: 1100 + 1100", () => { st.a = [1, 1, 0, 0]; st.b = [1, 1, 0, 0]; st.cin = 0; st.step = 0; draw(); }));
    } else ctr.append(U.btn("ล้นเกิน 8 บิต: 255 + 1", () => { st.a = Array(8).fill(1); st.b = [0, 0, 0, 0, 0, 0, 0, 1]; st.cin = 0; st.step = 0; draw(); }));
    const rows = H("div");
    const svg = S("svg", { style: n === 4 ? "max-width:680px" : "" });
    const tbl = H("div", { style: "flex:0 0 auto;max-height:330px;overflow:auto" });
    const msg = H("div", { class: "callout note", style: "flex:1 1 260px;margin:0" });
    if (el.dataset.layout === "side") { // สไลด์: วงจรซ้าย ตาราง+คำอธิบายขวา
      const grid = H("div", { style: "display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:16px;align-items:start" });
      const L = H("div"), R = H("div", { style: "display:flex;flex-direction:column;gap:10px" });
      L.append(rows, svg); R.append(tbl, msg); grid.append(L, R); body.append(ctr, grid);
    } else { const row = flexRow(); row.append(tbl, msg); body.append(ctr, rows, svg, row); }
    function draw() {
      const labels = (p) => [...Array(n)].map((_, i) => p + (n - i));
      rows.innerHTML = "";
      const mk = (name, arr) => { const r = H("div", { class: "controls", style: "align-items:center" }); r.append(H("b", { class: "mono", style: "width:24px" }, name));
        r.append(U.bitRow(arr, { labels: labels(name), small: n === 8, onToggle: (i) => { arr[i] ^= 1; draw(); } })); return r; };
      rows.append(mk("A", st.a), mk("B", st.b));
      // ripple
      const C = [st.cin], Sg = [];
      for (let k = 1; k <= n; k++) { const a = st.a[n - k], b = st.b[n - k], t = a + b + C[k - 1]; Sg[k] = t & 1; C[k] = t >> 1; }
      const known = (k) => k <= st.step;
      stepBtn.textContent = st.step >= n ? "เริ่มทีละขั้นใหม่ ↺" : `ทีละขั้น ▶ (บิตที่ ${st.step + 1})`;
      // svg
      const bw = 78, gap = 30, x0 = 100, W_ = x0 + n * bw + (n - 1) * gap + 90;
      svg.setAttribute("viewBox", `0 0 ${W_} 230`);
      svg.innerHTML = "";
      const bg = S("g", null, svg), wires = S("g", null, svg), g = S("g", null, svg);
      const bx = (k) => x0 + (n - k) * (bw + gap); // k = 1..n (1 = LSB อยู่ขวาสุด)
      if (n === 8) {
        [[8, 5, "adder 4 บิต ชุดที่ 2 (บิตสูง)"], [4, 1, "adder 4 บิต ชุดที่ 1 (บิตต่ำ)"]].forEach(([hi, lo, t]) => {
          S("rect", { x: bx(hi) - 10, y: 40, width: bx(lo) + bw - bx(hi) + 20, height: 150, rx: 10, fill: "var(--brand-soft)", stroke: "var(--brand)", "stroke-dasharray": "5 4" }, bg);
          txt(bg, bx(hi), 205, t, { size: 12, c: "var(--brand)" });
        });
      }
      for (let k = 1; k <= n; k++) {
        const x = bx(k), on = known(k), a = st.a[n - k], b = st.b[n - k];
        wire(wires, `M${x + 22},22 V70`, a); wire(wires, `M${x + 56},22 V70`, b);
        txt(svg, x + 22, 16, `A${k}=${a}`, { a: "middle", size: 12 }); txt(svg, x + 56, 16, `B${k}=${b}`, { a: "middle", size: 12 });
        S("rect", { x, y: 70, width: bw, height: 72, rx: 8, class: "s-gate", style: k === st.step + 1 && st.step < n ? "stroke:var(--accent);stroke-width:3" : "" }, g);
        txt(g, x + bw / 2, 104, "FA", { a: "middle", size: 16 }); txt(g, x + bw / 2, 124, `บิต ${k}`, { a: "middle", size: 11, w: 400, c: "var(--ink-3)" });
        wire(wires, `M${x + bw / 2},142 V172`, on ? Sg[k] : null);
        txt(svg, x + bw / 2, 190, on ? `Σ${k}=${Sg[k]}` : `Σ${k}=?`, { a: "middle", size: 13, c: on ? (Sg[k] ? "var(--hi)" : "var(--ink)") : "var(--ink-3)" });
        // carry เข้าทางขวา
        const cinKnown = k === 1 || known(k - 1);
        wire(wires, `M${x + bw + (k === 1 ? 46 : gap)},106 H${x + bw}`, cinKnown ? C[k - 1] : null);
        if (k === 1) txt(svg, x + bw + 50, 102, `C0=${st.cin}`, { size: 12 });
        else txt(svg, x + bw + gap / 2, 98, cinKnown ? `C${k - 1}=${C[k - 1]}` : `C${k - 1}`, { a: "middle", size: 10, c: "var(--accent)" });
      }
      wire(wires, `M${bx(n)},106 H${bx(n) - 40}`, known(n) ? C[n] : null);
      txt(svg, bx(n) - 44, 100, known(n) ? `C${n}=${C[n]}` : `C${n}`, { a: "end", size: 12, c: known(n) && C[n] ? "var(--hi)" : "var(--ink)" });
      // step table (รูปแบบตัวอย่างที่ 7.3)
      tbl.innerHTML = `<table class="data" style="text-align:center"><tr><th>n</th><th>A<sub>n</sub></th><th>B<sub>n</sub></th><th>C<sub>n−1</sub></th><th>Σ<sub>n</sub></th><th>C<sub>n</sub></th></tr>` +
        [...Array(n)].map((_, i) => { const k = i + 1, on = known(k);
          return `<tr${hlRow(k === st.step)}><td>${k}</td><td>${st.a[n - k]}</td><td>${st.b[n - k]}</td><td>${on ? C[k - 1] : "?"}</td><td>${on ? Sg[k] : "?"}</td><td>${on ? C[k] : "?"}</td></tr>`; }).join("") + "</table>";
      const av = parseInt(st.a.join(""), 2), bv = parseInt(st.b.join(""), 2), sv = av + bv + st.cin;
      const res = Sg.slice(1).reverse().join("");
      if (st.step < n) {
        const k = st.step + 1;
        msg.innerHTML = st.step === 0 ? `เริ่มที่บิต LSB (n = 1) กด “ทีละขั้น”` :
          `บิตที่ ${st.step}: A<sub>${st.step}</sub> + B<sub>${st.step}</sub> + C<sub>${st.step - 1}</sub> = ${st.a[n - st.step]} + ${st.b[n - st.step]} + ${C[st.step - 1]} → Σ<sub>${st.step}</sub> = ${Sg[st.step]}, C<sub>${st.step}</sub> = ${C[st.step]} ส่งต่อไปยังบิตที่ ${k}`;
        msg.innerHTML += `<br><span class="muted">บิตที่สูงกว่าต้อง<b>รอ</b>ตัวทดจากบิตที่ต่ำกว่า — นี่คือเหตุที่ adder แบบนี้เรียกว่า ripple carry</span>`;
      } else {
        msg.innerHTML = `${st.a.join("")}<sub>2</sub> + ${st.b.join("")}<sub>2</sub>${st.cin ? " + 1" : ""} = <b>${C[n]}${res}</b><sub>2</sub><br>ตรวจด้วยฐานสิบ: ${av} + ${bv}${st.cin ? " + 1" : ""} = <b>${sv}</b>` +
          (C[n] ? `<br>C<sub>${n}</sub> = 1 คือ output carry — ผลลัพธ์มี ${n + 1} บิต` : "") +
          (n === 8 ? `<br>C<sub>4</sub> ของชุดบิตต่ำต่อเข้าเป็น C<sub>0</sub> (input carry) ของชุดบิตสูง` : "");
      }
    }
    draw();
  };

  /* =====================================================
     3) Comparator (7.3)
     ===================================================== */
  W.comparator = function (el) {
    let mode = el.dataset.mode || "2";
    const body = U.shell(el, "INTERACTIVE", "วงจรเปรียบเทียบ (Comparator)",
      "2 บิต: ใช้ XOR เปรียบเทียบทีละบิต แล้วกลับค่าด้วย inverter และ AND (รูปที่ 7.12, ตัวอย่างที่ 7.4) · 4 บิต: หา A > B, A = B, A < B โดยเริ่มจากบิตที่มีนัยสำคัญสูงสุด (รูปที่ 7.13)");
    const st = { a: [1, 0, 1, 1], b: [1, 0, 0, 1], a2: [1, 1], b2: [1, 0] };
    const ctr = H("div", { class: "controls" });
    ctr.append(U.seg([["2", "2 บิต: ความเท่ากัน"], ["4", "4 บิต: ความไม่เท่ากัน"]], mode, (v) => { mode = v; draw(); }));
    const pre = H("div", { class: "controls" });
    pre.append(U.btn("ตย. 7.4 (I) 10 กับ 10", () => { mode = "2"; st.a2 = [1, 0]; st.b2 = [1, 0]; ctr.firstChild.set("2"); draw(); }),
      U.btn("ตย. 7.4 (II) 11 กับ 10", () => { mode = "2"; st.a2 = [1, 1]; st.b2 = [1, 0]; ctr.firstChild.set("2"); draw(); }));
    const rows = H("div"), svg = S("svg", { style: "max-width:640px" }), extra = H("div");
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, pre, rows, svg, extra, msg);
    function draw() {
      pre.style.display = mode === "2" ? "" : "none";
      const n = +mode, a = n === 2 ? st.a2 : st.a, b = n === 2 ? st.b2 : st.b;
      rows.innerHTML = "";
      const mk = (name, arr) => { const r = H("div", { class: "controls", style: "align-items:center" }); r.append(H("b", { class: "mono", style: "width:24px" }, name));
        r.append(U.bitRow(arr, { labels: arr.map((_, i) => name + (n - 1 - i)), onToggle: (i) => { arr[i] ^= 1; draw(); } })); return r; };
      rows.append(mk("A", a), mk("B", b));
      svg.innerHTML = ""; extra.innerHTML = "";
      const bg = S("g", null, svg), wires = S("g", null, svg), g = S("g", null, svg);
      if (n === 2) {
        svg.setAttribute("viewBox", "0 0 680 250"); svg.style.display = "";
        const ins = [["A0", a[1]], ["B0", b[1]], ["A1", a[0]], ["B1", b[0]]];
        const g1 = DLD.drawGate(g, "XOR", 170, 70, 2), g2 = DLD.drawGate(g, "XOR", 170, 180, 2);
        const n1 = DLD.drawGate(g, "NOT", 300, 70, 1), n2 = DLD.drawGate(g, "NOT", 300, 180, 1);
        const ad = DLD.drawGate(g, "AND", 450, 125, 2);
        [[g1, 0, 0], [g1, 1, 1], [g2, 0, 2], [g2, 1, 3]].forEach(([gg, j, k]) => {
          const y = gg.inputs[j].y + (j ? 14 : -14);
          txt(svg, 14, y + 5, `${ins[k][0]}=${ins[k][1]}`);
          wire(wires, `M70,${y} H${120 + j * 14} V${gg.inputs[j].y} H${gg.inputs[j].x}`, ins[k][1]);
        });
        const x0 = a[1] ^ b[1], x1 = a[0] ^ b[0];
        txt(svg, 210, 50, "G1", { size: 12, c: "var(--ink-3)" }); txt(svg, 210, 160, "G2", { size: 12, c: "var(--ink-3)" });
        wire(wires, `M${g1.output.x},70 H${n1.inputs[0].x}`, x0); wire(wires, `M${g2.output.x},180 H${n2.inputs[0].x}`, x1);
        txt(svg, g1.output.x + 4, 62, String(x0), { size: 12, c: "var(--accent)" }); txt(svg, g2.output.x + 4, 172, String(x1), { size: 12, c: "var(--accent)" });
        wire(wires, `M${n1.output.x},70 H415 V${ad.inputs[0].y} H${ad.inputs[0].x}`, 1 - x0);
        wire(wires, `M${n2.output.x},180 H415 V${ad.inputs[1].y} H${ad.inputs[1].x}`, 1 - x1);
        const eq = (1 - x0) & (1 - x1);
        wire(wires, `M${ad.output.x},125 H600`, eq); lamp(svg, 622, 125, eq);
        txt(svg, 622, 165, eq ? "A = B" : "A ≠ B", { a: "middle" });
        msg.innerHTML = `G1: A<sub>0</sub> ⊕ B<sub>0</sub> = ${a[1]} ⊕ ${b[1]} = ${x0} · G2: A<sub>1</sub> ⊕ B<sub>1</sub> = ${a[0]} ⊕ ${b[0]} = ${x1}` +
          `<br>XOR ให้ 1 เมื่อบิต<b>ไม่เท่ากัน</b> → inverter กลับค่า → AND ให้ 1 เมื่อทุกบิตเท่ากัน: <b>${a.join("")} ${eq ? "=" : "≠"} ${b.join("")}</b>`;
      } else {
        svg.style.display = "none";
        let first = -1; for (let i = 0; i < 4; i++) if (a[i] !== b[i]) { first = i; break; }
        const gt = first >= 0 && a[first] === 1, lt = first >= 0 && b[first] === 1, eq = first < 0;
        const t = H("table", { class: "data", style: "text-align:center;width:auto" });
        t.innerHTML = `<tr><th>บิต</th>${a.map((_, i) => `<th>${3 - i}</th>`).join("")}</tr>` +
          `<tr><td>A</td>${a.map((v, i) => `<td${i === first ? ' style="background:var(--accent-soft,#fff3bf);font-weight:700"' : ""}>${v}</td>`).join("")}</tr>` +
          `<tr><td>B</td>${b.map((v, i) => `<td${i === first ? ' style="background:var(--accent-soft,#fff3bf);font-weight:700"' : ""}>${v}</td>`).join("")}</tr>` +
          `<tr><td class="muted">A<sub>i</sub> ⊕ B<sub>i</sub></td>${a.map((v, i) => `<td style="color:${v ^ b[i] ? "var(--hi)" : "var(--ink-3)"}">${v ^ b[i]}</td>`).join("")}</tr>` +
          `<tr><td class="muted">ตรวจ</td>${a.map((_, i) => `<td class="tiny">${first < 0 || i < first ? "เท่ากัน →" : i === first ? "<b>ตัดสิน</b>" : "—"}</td>`).join("")}</tr>`;
        const lamps = H("div", { class: "controls", style: "gap:18px;margin-top:10px" });
        [["A > B", gt], ["A = B", eq], ["A < B", lt]].forEach(([l, v]) => lamps.append(H("span", { class: "mono", style: `padding:6px 14px;border-radius:999px;font-weight:700;border:2px solid ${v ? "var(--hi)" : "var(--line)"};background:${v ? "var(--hi-soft)" : "transparent"};color:${v ? "var(--hi)" : "var(--ink-3)"}` }, l)));
        const wrap = H("div", { style: "overflow:auto" }); wrap.append(t); extra.append(wrap, lamps);
        const av = parseInt(a.join(""), 2), bv = parseInt(b.join(""), 2);
        msg.innerHTML = eq ? `ทุกบิตเท่ากัน → <b>A = B</b> (${av} = ${bv})` :
          `เริ่มจาก A<sub>3</sub>, B<sub>3</sub> ${first > 0 ? `· บิตที่ 3${first > 1 ? `–${4 - first}` : ""} เท่ากันจึงตรวจบิตถัดไป ` : ""}· บิตที่ ${3 - first}: A<sub>${3 - first}</sub> = ${a[first]}, B<sub>${3 - first}</sub> = ${b[first]} → <b>${gt ? "A > B" : "A < B"}</b> (${av} ${gt ? ">" : "<"} ${bv}) — ไม่ต้องดูบิตที่ต่ำกว่าอีก`;
      }
    }
    draw();
  };

  /* =====================================================
     4) Decoder 4-line-to-16-line / BCD-to-decimal (7.4)
     ===================================================== */
  W.decoder = function (el) {
    const bcd = el.dataset.mode === "bcd";
    const body = U.shell(el, "INTERACTIVE", bcd ? "BCD-to-decimal decoder (ตารางที่ 7.5 · รูปที่ 7.17)" : "Decoder 4-line-to-16-line (1-of-16) (รูปที่ 7.14 · ตารางที่ 7.4)",
      "คลิกบิตอินพุต A₃–A₀ — ด้านบนคือเกทถอดรหัส (decoding function) ของเอาต์พุตที่ทำงาน: complement เฉพาะบิตที่เป็น 0 · เลือกเอาต์พุตแบบ active-HIGH (AND) หรือ active-LOW (NAND)");
    const st = { code: [1, 0, 0, 1], low: true };
    const ctr = H("div", { class: "controls" });
    ctr.append(U.seg([[false, "active-HIGH (AND)"], [true, "active-LOW (NAND)"]], st.low, (v) => { st.low = v; draw(); }));
    if (!bcd) ctr.append(U.btn("รหัส 1001 (รูปที่ 7.14)", () => { st.code = [1, 0, 0, 1]; draw(); }), U.btn("ตย. 7.5: 1011", () => { st.code = [1, 0, 1, 1]; st.low = false; ctr.firstChild.set(false); draw(); }));
    const bits = H("div"), svg = S("svg", { viewBox: "0 0 560 200", style: "max-width:560px" }), pins = H("div", { style: "display:flex;flex-wrap:wrap;gap:6px;margin:10px 0" });
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, bits, svg, pins, msg);
    function draw() {
      bits.innerHTML = "";
      bits.append(U.bitRow(st.code, { labels: ["A₃", "A₂", "A₁", "A₀"], onToggle: (i) => { st.code[i] ^= 1; draw(); } }));
      const d = parseInt(st.code.join(""), 2), valid = !bcd || d <= 9;
      svg.innerHTML = "";
      const wires = S("g", null, svg), g = S("g", null, svg);
      const ys = [40, 80, 120, 160], gate = DLD.drawGate(g, st.low ? "NAND" : "AND", 300, 100, 4, valid ? null : { cls: "s-gate" });
      const xs = [250, 262, 262, 250];
      st.code.forEach((b, j) => {
        txt(svg, 14, ys[j] + 5, `A${3 - j}=${b}`);
        const inv = b === 0, y = ys[j], p = gate.inputs[j];
        const v = inv ? 1 - b : b;
        if (inv) {
          const ng = DLD.drawGate(g, "NOT", 120, y, 1);
          wire(wires, `M66,${y} H${ng.inputs[0].x}`, b);
          wire(wires, `M${ng.output.x},${y} H${xs[j]} V${p.y} H${p.x}`, v);
          txt(svg, ng.output.x + 4, y - 6, `A${3 - j}'`, { size: 11, w: 400, c: "var(--ink-3)" });
        } else wire(wires, `M66,${y} H${xs[j]} V${p.y} H${p.x}`, v);
      });
      const out = valid ? (st.low ? 0 : 1) : null;
      wire(wires, `M${gate.output.x},100 H470`, out);
      const lit = valid && !st.low;
      lamp(svg, 492, 100, lit);
      txt(svg, 492, 140, valid ? `${st.low ? "Ȳ" : "Y"}${d} = ${st.low ? 0 : 1}` : "ไม่มีเอาต์พุต", { a: "middle", size: 13 });
      if (!valid) S("rect", { x: 0, y: 0, width: 560, height: 200, fill: "var(--surface)", opacity: 0.6 }, svg);
      // pins
      pins.innerHTML = "";
      const N = bcd ? 10 : 16;
      for (let i = 0; i < N; i++) {
        const act = valid && i === d, lvl = st.low ? (act ? 0 : 1) : act ? 1 : 0;
        pins.append(H("div", { class: "mono", style: `min-width:40px;text-align:center;padding:4px 2px;border-radius:8px;border:2px solid ${act ? "var(--hi)" : "var(--line)"};background:${act ? "var(--hi-soft)" : "transparent"};font-size:13px` },
          `<small style="display:block;color:var(--ink-3)">${st.low ? "<span style='text-decoration:overline'>" + i + "</span>" : i}</small><b style="color:${lvl ? "var(--hi)" : "var(--ink-3)"}">${lvl}</b>`));
      }
      const fn = st.code.map((b, j) => (b ? `A<sub>${3 - j}</sub>` : ov(`A<sub>${3 - j}</sub>`))).join("");
      msg.innerHTML = valid
        ? `อินพุต ${st.code.join("")}<sub>2</sub> = ${d} → decoding function: ${st.low ? ov(fn) : fn}` +
          `<br>เอาต์พุต ${d} ${st.low ? "เป็น <b>LOW</b> ส่วนเอาต์พุตอื่นเป็น HIGH (active-LOW)" : "เป็น <b>HIGH</b> ส่วนเอาต์พุตอื่นเป็น LOW (active-HIGH)"} · ใช้ inverter ${st.code.filter((b) => !b).length} ตัวกับ${st.low ? " NAND" : " AND"} 4 อินพุต`
        : `<b>${st.code.join("")}</b> (${d}) ไม่ใช่รหัส BCD — BCD decoder มีเพียง 10 เอาต์พุต (0–9) จึง<b>ไม่มีเอาต์พุตใดทำงาน</b>`;
    }
    draw();
  };

  /* =====================================================
     5) BCD-to-7-segment decoder (7.4.5)
     ===================================================== */
  const SEG = [ // a b c d e f g (ตารางที่ 7.6)
    [1, 1, 1, 1, 1, 1, 0], [0, 1, 1, 0, 0, 0, 0], [1, 1, 0, 1, 1, 0, 1], [1, 1, 1, 1, 0, 0, 1], [0, 1, 1, 0, 0, 1, 1],
    [1, 0, 1, 1, 0, 1, 1], [1, 0, 1, 1, 1, 1, 1], [1, 1, 1, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1]];
  DLD.SEG7 = SEG;
  function drawDigit(svg, segs, x, y, s) {
    s = s || 1;
    const P = { // polygon แต่ละ segment (กล่อง 100×180)
      a: "18,8 82,8 72,20 28,20", b: "86,12 86,86 76,80 76,24", c: "86,94 86,168 76,156 76,100",
      d: "18,172 82,172 72,160 28,160", e: "14,94 24,100 24,156 14,168", f: "14,12 24,24 24,80 14,86", g: "20,90 28,83 72,83 80,90 72,97 28,97" };
    const gg = S("g", { transform: `translate(${x},${y}) scale(${s})` }, svg);
    S("rect", { x: -6, y: -6, width: 112, height: 192, rx: 12, fill: "#1b1e27" }, gg);
    "abcdefg".split("").forEach((k, i) => {
      S("polygon", { points: P[k], fill: segs[i] ? "#ff4b4b" : "#3a3f4d" }, gg);
    });
    return gg;
  }
  W.seg7 = function (el) {
    const body = U.shell(el, "INTERACTIVE", "BCD-to-7-segment decoder (รูปที่ 7.19–7.20 · ตารางที่ 7.6)",
      "คลิกบิต DCBA หรือปุ่มตัวเลข — decoder ส่งเอาต์พุต a–g ไปยัง 7-segment · เลือกแบบเอาต์พุต active-HIGH (common cathode) หรือ active-LOW (common anode เช่น 74LS47)");
    const st = { code: [0, 1, 0, 1], low: false };
    const ctr = H("div", { class: "controls" });
    ctr.append(U.seg([[false, "active-HIGH"], [true, "active-LOW"]], st.low, (v) => { st.low = v; draw(); }));
    const digs = H("div", { class: "controls" });
    for (let i = 0; i < 10; i++) digs.append(U.btn(String(i), () => { st.code = bin(i, 4).split("").map(Number); draw(); }));
    const bits = H("div");
    const svg = S("svg", { viewBox: "0 0 400 210", style: "max-width:420px" });
    const tbl = H("div", { style: "flex:0 0 auto;max-height:340px;overflow:auto" });
    const left = H("div", { style: "flex:1 1 300px;min-width:0" }); left.append(bits, svg);
    const row = flexRow(); row.append(left, tbl);
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, digs, row, msg);
    function draw() {
      bits.innerHTML = ""; bits.append(U.bitRow(st.code, { labels: ["D", "C", "B", "A"], onToggle: (i) => { st.code[i] ^= 1; draw(); } }));
      const d = parseInt(st.code.join(""), 2), segs = d <= 9 ? SEG[d] : [0, 0, 0, 0, 0, 0, 0];
      svg.innerHTML = "";
      drawDigit(svg, segs, 250, 12, 1);
      // decoder block + ขา a–g
      S("rect", { x: 20, y: 20, width: 110, height: 170, rx: 8, class: "s-gate" }, svg);
      txt(svg, 75, 98, "BCD/7-seg", { a: "middle", size: 12 }); txt(svg, 75, 116, "decoder", { a: "middle", size: 12, w: 400 });
      "abcdefg".split("").forEach((k, i) => {
        const y = 32 + i * 23, lvl = st.low ? 1 - segs[i] : segs[i];
        wire(svg, `M130,${y} H220`, lvl);
        if (st.low) S("circle", { cx: 135, cy: y, r: 4, class: "s-gate" }, svg);
        txt(svg, 148, y - 4, k, { size: 12 }); txt(svg, 214, y - 4, String(lvl), { a: "end", size: 12, c: lvl ? "var(--hi)" : "var(--ink-3)" });
      });
      // ตารางแสดง "ระดับขาเอาต์พุต" ตามโหมด: active-HIGH = ตารางที่ 7.6 · active-LOW = กลับค่า (segment ที่สว่าง = 0)
      tbl.innerHTML = `<div class="tiny muted" style="margin-bottom:4px">${st.low ? "ระดับขาเอาต์พุต active-LOW: segment ที่สว่าง = <b>0</b>" : "ตารางที่ 7.6: segment ที่สว่าง = <b>1</b>"} · <span style="color:var(--hi)">■</span> = สว่าง</div>` +
        `<table class="data" style="text-align:center;font-size:13px"><tr><th>ฐานสิบ</th><th>DCBA</th>${"abcdefg".split("").map((k) => `<th>${st.low ? `<span style="text-decoration:overline">${k}</span>` : k}</th>`).join("")}</tr>` +
        [...Array(16)].map((_, i) => `<tr${hlRow(i === d)}><td>${i}</td><td class="mono">${bin(i, 4)}</td>${(i <= 9 ? SEG[i] : Array(7).fill("X")).map((v) => `<td style="color:${v === 1 ? "var(--hi)" : "var(--ink-3)"};padding:2px 5px">${v === "X" ? "X" : st.low ? 1 - v : v}</td>`).join("")}</tr>`).join("") + "</table>";
      const on = "abcdefg".split("").filter((_, i) => segs[i]);
      msg.innerHTML = d <= 9
        ? `อินพุต ${st.code.join("")} = <b>${d}</b> → segment ที่สว่าง: <b>${on.join(", ")}</b> (${on.length} segment)` +
          (st.low ? `<br>active-LOW: ขาของ segment ที่สว่างมีระดับ <b>0</b> (ใช้กับ 7-segment แบบ common anode)` : `<br>active-HIGH: ขาของ segment ที่สว่างมีระดับ <b>1</b> (ใช้กับ 7-segment แบบ common cathode)`)
        : `${st.code.join("")} (${d}) ไม่ใช่รหัส BCD — ในตารางที่ 7.6 เป็น X (don’t care) ผู้ออกแบบจะกำหนดเป็นอะไรก็ได้ (ที่นี่แสดงเป็นจอดับ)`;
    }
    draw();
  };

  /* =====================================================
     6) Decimal-to-BCD encoder + แป้นกด (7.5)
     ===================================================== */
  W.encoder = function (el) {
    const body = U.shell(el, "INTERACTIVE", "Decimal-to-BCD encoder กับแป้นกดตัวเลข (รูปที่ 7.22–7.23)",
      "กดปุ่มบนแป้น (กดค้างได้หลายปุ่ม) — encoder สร้างจาก OR gate 4 ตัว: A₃ = 8 + 9 · A₂ = 4 + 5 + 6 + 7 · A₁ = 2 + 3 + 6 + 7 · A₀ = 1 + 3 + 5 + 7 + 9 · โหมด priority เลือกตัวเลขที่มากที่สุดเมื่อกดหลายปุ่มพร้อมกัน");
    const st = { keys: new Set([7]), prio: false };
    const ctr = H("div", { class: "controls" });
    ctr.append(U.seg([[false, "OR gate (รูปที่ 7.22)"], [true, "Priority encoder"]], st.prio, (v) => { st.prio = v; draw(); }), U.btn("ปล่อยทุกปุ่ม", () => { st.keys.clear(); draw(); }));
    const pad = H("div", { style: "display:grid;grid-template-columns:repeat(3,52px);gap:8px;flex:0 0 auto" });
    const right = H("div", { style: "flex:1 1 300px;min-width:0" });
    const row = flexRow(); row.append(pad, right);
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, row, msg);
    const EQ = [[3, [8, 9]], [2, [4, 5, 6, 7]], [1, [2, 3, 6, 7]], [0, [1, 3, 5, 7, 9]]];
    function draw() {
      pad.innerHTML = "";
      [7, 8, 9, 4, 5, 6, 1, 2, 3, 0].forEach((k) => {
        const b = H("button", { type: "button", class: "btn", style: `height:48px;font:700 20px var(--mono);${k === 0 ? "grid-column:2;" : ""}${st.keys.has(k) ? "background:var(--brand);color:#fff;border-color:var(--brand)" : ""}` }, String(k));
        b.addEventListener("click", () => { st.keys.has(k) ? st.keys.delete(k) : st.keys.add(k); draw(); });
        pad.append(b);
      });
      const keys = [...st.keys].sort((a, b) => a - b), top = keys.length ? keys[keys.length - 1] : -1;
      const used = st.prio ? (top >= 0 ? [top] : []) : keys;
      const out = EQ.map(([, terms]) => (terms.some((t) => used.includes(t)) ? 1 : 0));
      right.innerHTML = "";
      EQ.forEach(([bit, terms], i) => {
        right.append(H("div", { class: "mono", style: "font-size:17px;margin:4px 0" },
          `A<sub>${bit}</sub> = ${terms.map((t) => `<span style="${used.includes(t) ? "color:var(--hi);font-weight:700;text-decoration:underline" : "color:var(--ink-3)"}">${t}</span>`).join(" + ")} = <b style="color:${out[i] ? "var(--hi)" : "var(--ink-3)"}">${out[i]}</b>`));
      });
      right.append(U.bitRow(out, { labels: ["A₃", "A₂", "A₁", "A₀"] }));
      const code = out.join(""), val = parseInt(code, 2);
      if (!keys.length) msg.innerHTML = `ไม่มีการกดปุ่ม → เอาต์พุต 0000 (เหมือนกดปุ่ม 0 — จึงไม่ต้องต่อขา 0 เข้าวงจร)`;
      else if (keys.length === 1) msg.innerHTML = `กดปุ่ม ${keys[0]} → รหัส BCD <b>${code}</b>`;
      else if (st.prio) msg.innerHTML = `กด ${keys.join(", ")} พร้อมกัน → priority encoder เลือกตัวที่มากที่สุด (${top}) → <b>${code}</b>`;
      else msg.innerHTML = `กด ${keys.join(", ")} พร้อมกัน → OR ของรหัสทุกตัว = <b>${code}</b> (${val}) — encoder แบบ OR ธรรมดา<b>แยกไม่ออก</b>ว่ากดปุ่มใด ผลอาจเป็นตัวเลขที่ไม่ได้กดเลย · จึงต้องใช้ priority encoder`;
    }
    draw();
  };

  /* =====================================================
     7) Binary ↔ Gray ด้วย XOR (7.6)
     ===================================================== */
  W.graycode = function (el) {
    let mode = el.dataset.mode || "b2g";
    const body = U.shell(el, "INTERACTIVE", "วงจรแปลงรหัส Binary ⇄ Gray ด้วย XOR (รูปที่ 7.24–7.25)",
      "คลิกบิตอินพุต — Binary→Gray: G₃ = B₃ และ Gᵢ = Bᵢ₊₁ ⊕ Bᵢ · Gray→Binary: B₃ = G₃ และ Bᵢ = Bᵢ₊₁ ⊕ Gᵢ (ใช้บิตไบนารีที่เพิ่งได้ต่อเป็นทอด)");
    const st = { b2g: [0, 1, 0, 1], g2b: [1, 0, 1, 1] };
    const ctr = H("div", { class: "controls" });
    const seg = U.seg([["b2g", "Binary → Gray (รูปที่ 7.24)"], ["g2b", "Gray → Binary (รูปที่ 7.25)"]], mode, (v) => { mode = v; draw(); });
    ctr.append(seg, U.btn("ตย. 7.6 (I) 0101", () => { mode = "b2g"; seg.set(mode); st.b2g = [0, 1, 0, 1]; draw(); }), U.btn("ตย. 7.6 (II) 1011", () => { mode = "g2b"; seg.set(mode); st.g2b = [1, 0, 1, 1]; draw(); }));
    const bits = H("div"), svg = S("svg", { viewBox: "0 0 540 300", style: "max-width:560px" });
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, bits, svg, msg);
    function draw() {
      const b2g = mode === "b2g", inp = st[mode], iN = b2g ? "B" : "G", oN = b2g ? "G" : "B";
      bits.innerHTML = ""; bits.append(U.bitRow(inp, { labels: [3, 2, 1, 0].map((i) => iN + i), onToggle: (i) => { inp[i] ^= 1; draw(); } }));
      const out = [inp[0]];
      for (let k = 1; k < 4; k++) out[k] = b2g ? inp[k - 1] ^ inp[k] : out[k - 1] ^ inp[k];
      svg.innerHTML = "";
      const wires = S("g", null, svg), g = S("g", null, svg);
      const ys = [40, 110, 180, 250], outY = [40];
      txt(svg, 14, ys[0] + 5, `${iN}3=${inp[0]}`);
      wire(wires, `M66,${ys[0]} H450`, inp[0]);
      for (let k = 1; k < 4; k++) {
        const cy = ys[k] - 4, gt = DLD.drawGate(g, "XOR", 220, cy, 2);
        outY[k] = cy;
        txt(svg, 14, ys[k] + 5, `${iN}${3 - k}=${inp[k]}`);
        wire(wires, `M66,${ys[k]} H180 V${gt.inputs[1].y} H${gt.inputs[1].x}`, inp[k]);
        if (b2g) { // แตะสาย B ของบิตที่สูงกว่า
          wire(wires, `M140,${ys[k - 1]} V${gt.inputs[0].y} H${gt.inputs[0].x}`, inp[k - 1]); dot(svg, 140, ys[k - 1]);
        } else { // แตะเอาต์พุตไบนารีของบิตที่สูงกว่า
          wire(wires, `M380,${outY[k - 1]} V${ys[k] - 32} H200 V${gt.inputs[0].y} H${gt.inputs[0].x}`, out[k - 1]); dot(svg, 380, outY[k - 1]);
        }
        wire(wires, `M${gt.output.x},${cy} H450`, out[k]);
      }
      out.forEach((v, k) => { lamp(svg, 468, outY[k], v, 11); txt(svg, 486, outY[k] + 5, `${oN}${3 - k}=${v}`); });
      const steps = out.map((v, k) => k === 0 ? `${oN}<sub>3</sub> = ${iN}<sub>3</sub> = ${v}` :
        b2g ? `G<sub>${3 - k}</sub> = B<sub>${4 - k}</sub> ⊕ B<sub>${3 - k}</sub> = ${inp[k - 1]} ⊕ ${inp[k]} = ${v}` : `B<sub>${3 - k}</sub> = B<sub>${4 - k}</sub> ⊕ G<sub>${3 - k}</sub> = ${out[k - 1]} ⊕ ${inp[k]} = ${v}`);
      msg.innerHTML = steps.join(" · ") + `<br><b>${inp.join("")}</b> (${b2g ? "binary" : "Gray"}) → <b>${out.join("")}</b> (${b2g ? "Gray" : "binary"})`;
    }
    draw();
  };

  /* =====================================================
     8) Multiplexer / Demultiplexer 4 ช่อง (7.7–7.8)
     ===================================================== */
  W.mux = function (el) {
    const demux = el.dataset.mode === "demux";
    const body = U.shell(el, "INTERACTIVE", demux ? "1-line-to-4-line Demultiplexer (รูปที่ 7.29)" : "1-of-4 Multiplexer / data selector (รูปที่ 7.26–7.27 · ตารางที่ 7.8)",
      demux ? "เลือก S₁S₀ แล้วสลับข้อมูลเข้า D — ข้อมูลจะถูกส่งไปยังเอาต์พุตที่ถูกเลือกเพียงช่องเดียว ช่องอื่นเป็น 0"
        : "เลือก S₁S₀ แล้วสลับค่าข้อมูลเข้า D₀–D₃ — มี AND gate ที่ถูกเปิด (enable) เพียงตัวเดียว เอาต์พุต Y จึงเท่ากับข้อมูลช่องที่เลือก");
    const st = { s: 1, d: [0, 1, 1, 0], D: 1 };
    const ctr = H("div", { class: "controls" });
    ctr.append(U.seg([0, 1, 2, 3].map((i) => [i, `S₁S₀ = ${bin(i, 2)}`]), st.s, (v) => { st.s = v; draw(); }));
    const tg = H("div"), svg = S("svg", { viewBox: "0 0 650 400", style: "max-width:650px" });
    const tbl = H("div", { style: "flex:0 0 auto" });
    const msg = H("div", { class: "callout note", style: "flex:1 1 260px;margin:0" });
    if (el.dataset.layout === "side") { // สไลด์: วงจรซ้าย ตาราง+คำอธิบายขวา
      const grid = H("div", { style: "display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px;align-items:start" });
      const L = H("div"), R = H("div", { style: "display:flex;flex-direction:column;gap:10px" });
      L.append(tg, svg); R.append(tbl, msg); grid.append(L, R); body.append(ctr, grid);
    } else { const row = flexRow(); row.append(tbl, msg); body.append(ctr, tg, svg, row); }
    function draw() {
      tg.innerHTML = "";
      if (demux) { const env = { D: st.D }; tg.append(toggles(["D"], env, () => { st.D = env.D; draw(); })); }
      else { const env = {}; st.d.forEach((v, i) => (env["D" + i] = v)); tg.append(toggles(["D0", "D1", "D2", "D3"], env, () => { st.d = [0, 1, 2, 3].map((i) => env["D" + i]); draw(); }, ["D₀", "D₁", "D₂", "D₃"])); }
      const s1 = st.s >> 1, s0 = st.s & 1;
      svg.innerHTML = "";
      const bg = S("g", null, svg), wires = S("g", null, svg), g = S("g", null, svg);
      const R = { S1: [150, s1], S1n: [180, 1 - s1], S0: [222, s0], S0n: [252, 1 - s0] };
      const top = 72;
      [["S1", "S1n"], ["S0", "S0n"]].forEach(([t, nn]) => {
        const [xt, vt] = R[t], [xn, vn] = R[nn];
        txt(svg, xt, 18, `${t[0]}${t[1]}=${vt}`, { a: "middle" });
        wire(wires, `M${xt},26 V392`, vt);
        wire(wires, `M${xt},40 H${xn} V46`, vt); dot(svg, xt, 40);
        S("path", { d: `M${xn - 9},46 L${xn + 9},46 L${xn},61 Z`, class: "s-gate" }, g);
        S("circle", { cx: xn, cy: 64, r: 3, class: "s-gate" }, g);
        wire(wires, `M${xn},${top - 5} V392`, vn);
        txt(svg, xn + 10, top + 4, `${t[0]}${t[1]}'`, { size: 11, w: 400, c: "var(--ink-3)" });
      });
      if (demux) { txt(svg, 112, 18, `D=${st.D}`, { a: "middle" }); wire(wires, `M112,26 V392`, st.D); }
      const outs = [];
      for (let i = 0; i < 4; i++) {
        const cy = 112 + i * 80, b1 = i >> 1, b0 = i & 1, sel = i === st.s;
        if (sel) S("rect", { x: 312, y: cy - 42, width: 100, height: 84, rx: 10, fill: "var(--brand-soft)", stroke: "var(--brand)", "stroke-dasharray": "5 4" }, bg);
        const gt = DLD.drawGate(g, "AND", 330, cy, 3);
        const dv = demux ? st.D : st.d[i];
        if (demux) { wire(wires, `M112,${gt.inputs[0].y} H${gt.inputs[0].x}`, dv); dot(svg, 112, gt.inputs[0].y); }
        else { txt(svg, 10, gt.inputs[0].y + 5, `D${i}=${dv}`, { size: 13 }); wire(wires, `M62,${gt.inputs[0].y} H${gt.inputs[0].x}`, dv); }
        const r1 = R[b1 ? "S1" : "S1n"], r0 = R[b0 ? "S0" : "S0n"];
        wire(wires, `M${r1[0]},${gt.inputs[1].y} H${gt.inputs[1].x}`, r1[1]); dot(svg, r1[0], gt.inputs[1].y);
        wire(wires, `M${r0[0]},${gt.inputs[2].y} H${gt.inputs[2].x}`, r0[1]); dot(svg, r0[0], gt.inputs[2].y);
        const v = dv & r1[1] & r0[1];
        outs.push({ x: gt.output.x, y: cy, v });
        txt(svg, gt.output.x + 4, cy - 8, `${b1 ? "S₁" : "S₁'"}${b0 ? "S₀" : "S₀'"}`, { size: 10, w: 400, c: "var(--ink-3)" });
      }
      if (demux) {
        outs.forEach((o, i) => { wire(wires, `M${o.x},${o.y} H570`, o.v); lamp(svg, 590, o.y, o.v, 12); txt(svg, 610, o.y + 5, `Y${i}`); });
      } else {
        const or = DLD.drawGate(g, "OR", 490, 232, 4), xs = [458, 446, 446, 458];
        outs.forEach((o, i) => wire(wires, `M${o.x},${o.y} H${xs[i]} V${or.inputs[i].y} H${or.inputs[i].x}`, o.v));
        const y = outs.some((o) => o.v) ? 1 : 0;
        wire(wires, `M${or.output.x},232 H590`, y); lamp(svg, 606, 232, y, 13); txt(svg, 606, 268, `Y=${y}`, { a: "middle" });
      }
      // ตาราง 7.8
      tbl.innerHTML = demux
        ? `<table class="data" style="text-align:center"><tr><th>S<sub>1</sub></th><th>S<sub>0</sub></th><th>Y<sub>0</sub></th><th>Y<sub>1</sub></th><th>Y<sub>2</sub></th><th>Y<sub>3</sub></th></tr>` +
          [0, 1, 2, 3].map((i) => `<tr${hlRow(i === st.s)}><td>${i >> 1}</td><td>${i & 1}</td>${[0, 1, 2, 3].map((j) => `<td>${j === i ? "D" : 0}</td>`).join("")}</tr>`).join("") + "</table>"
        : `<table class="data" style="text-align:center"><tr><th>S<sub>1</sub></th><th>S<sub>0</sub></th><th>Input selected</th></tr>` +
          [0, 1, 2, 3].map((i) => `<tr${hlRow(i === st.s)}><td>${i >> 1}</td><td>${i & 1}</td><td>D<sub>${i}</sub></td></tr>`).join("") + "</table>";
      const term = (i) => `D<sub>${i}</sub>${i >> 1 ? "S<sub>1</sub>" : ov("S<sub>1</sub>")}${i & 1 ? "S<sub>0</sub>" : ov("S<sub>0</sub>")}`;
      msg.innerHTML = demux
        ? `S<sub>1</sub>S<sub>0</sub> = ${bin(st.s, 2)} → AND ตัวที่ ${st.s} ถูกเปิด: Y<sub>${st.s}</sub> = D = <b>${st.D}</b> · เอาต์พุตอื่นเป็น 0`
        : `Y = ${[0, 1, 2, 3].map(term).join(" + ")}<br>S<sub>1</sub>S<sub>0</sub> = ${bin(st.s, 2)} → เหลือพจน์เดียว Y = D<sub>${st.s}</sub> = <b>${st.d[st.s]}</b>`;
    }
    draw();
  };
})();
