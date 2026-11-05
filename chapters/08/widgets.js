/* =========================================================
   บทที่ 8 — interactive widgets (วงจรแลทช์และฟลิปฟลอป)
   srlatch · ffwave (gsr, dlatch, cmp, srff, dff, jkff, jkpc) · pregister · freqdiv
   ========================================================= */
(function () {
  const DLD = window.DLD, U = DLD.ui, W = DLD.widgets;
  const H = (...a) => DLD.h(...a);
  const S = (...a) => DLD.svg(...a);
  const wire = (g, d, v) => S("path", { d, class: v ? "s-wire1" : "s-wire0" }, g);
  const lamp = (g, x, y, v, r) => { if (v) S("circle", { cx: x, cy: y, r: (r || 14) + 9, fill: "var(--hi)", opacity: 0.2 }, g); S("circle", { cx: x, cy: y, r: r || 14, fill: v ? "var(--hi)" : "var(--surface-2)", stroke: "var(--ink-3)", "stroke-width": 2 }, g); };
  const dot = (g, x, y) => S("circle", { cx: x, cy: y, r: 3.5, fill: "var(--ink)" }, g);
  /* ขีดบน: ตัวอักษรผสม (U+0304/U+0305) แสดงเยื้องในฟอนต์นี้ → แปลงเป็น overline จริง */
  const OVRX = /(PRE|CLR)[\u0304\u0305]|(.)[\u0304\u0305]/gu;
  const txt = (g, x, y, t, o) => {
    o = o || {};
    const el = S("text", { x, y, "text-anchor": o.a || "start", class: "s-mono", style: `font-size:${o.size || 14}px;font-weight:${o.w || 700};fill:${o.c || "var(--ink)"};${o.ov ? "text-decoration:overline;" : ""}` }, g);
    let last = 0; t = String(t);
    t.replace(OVRX, (m, w, ch, i) => {
      if (i > last) S("tspan", { text: t.slice(last, i) }, el);
      S("tspan", { text: w || ch, style: "text-decoration:overline" }, el);
      last = i + m.length; return m;
    });
    if (last < t.length) S("tspan", { text: t.slice(last) }, el);
    return el;
  };
  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  function fixDom(root) { // แปลงข้อความ HTML (ไม่รวม SVG) ที่มีตัวอักษรผสมขีดบน
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [];
    while (tw.nextNode()) { const n = tw.currentNode; if (/[\u0304\u0305]/.test(n.nodeValue) && !n.parentNode.closest("svg")) list.push(n); }
    list.forEach((n) => {
      const span = document.createElement("span");
      span.innerHTML = esc(n.nodeValue).replace(OVRX, (m, w, ch) => `<span class="ov">${w || ch}</span>`);
      n.replaceWith(...span.childNodes);
    });
  }
  const bits = (s) => s.split("").map(Number);
  const hlRow = (on) => (on ? ' style="background:var(--brand-soft);font-weight:700"' : "");
  const OV = (t) => `<span class="ov">${t}</span>`;

  /* =====================================================
     1) S-R latch แบบ NOR (active-HIGH) / NAND (active-LOW) (8.1.1)
     ===================================================== */
  const watch = (el) => { fixDom(el); new MutationObserver(() => fixDom(el)).observe(el, { childList: true, subtree: true, characterData: true }); };
  W.srlatch = function (el) {
    const body = U.shell(el, "INTERACTIVE", "S-R latch: เกทต่อไขว้ป้อนกลับ (รูปที่ 8.1 · ตารางที่ 8.1–8.2)",
      "กดปุ่ม S และ R เพื่อเปลี่ยนระดับอินพุต — สังเกตว่าเมื่ออินพุตกลับสู่สภาวะ “ไม่ active” เอาต์พุตยังจำค่าเดิมไว้ได้ด้วยเส้นป้อนกลับ · ผังเวลาด้านล่างบันทึกทุกครั้งที่กด");
    const st = { low: el.dataset.mode === "nand", s: 0, r: 0, q: 0, inv: false, hist: [] };
    const ctr = H("div", { class: "controls" });
    const seg = U.seg([[false, "NOR · active-HIGH (รูปที่ 8.1 ก)"], [true, "NAND · active-LOW (รูปที่ 8.1 ข)"]], st.low, (v) => { st.low = v; reset(); });
    const bS = U.btn("S", () => { st.s ^= 1; step(); }), bR = U.btn("R", () => { st.r ^= 1; step(); });
    ctr.append(seg, bS, bR, U.btn("ล้างผังเวลา", () => { st.hist = [st.hist[st.hist.length - 1]]; draw(); }));
    const svg = S("svg", { viewBox: "0 0 560 260", style: "max-width:560px" });
    const tbl = H("div", { style: "flex:0 0 auto" });
    const left = H("div", { style: "flex:1 1 340px;min-width:0" }); left.append(svg);
    const row = H("div", { style: "display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start" }); row.append(left, tbl);
    const wave = S("svg", { style: "max-width:720px" });
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, row, wave, msg);
    function reset() { st.s = st.r = st.low ? 1 : 0; st.q = 0; st.inv = false; st.hist = []; step(); }
    function step() {
      const aS = st.low ? !st.s : !!st.s, aR = st.low ? !st.r : !!st.r;
      st.inv = aS && aR;
      if (!st.inv) { if (aS) st.q = 1; else if (aR) st.q = 0; }
      st.hist.push({ s: st.s, r: st.r, q: st.q, inv: st.inv });
      if (st.hist.length > 14) st.hist.shift();
      draw();
    }
    function draw() {
      const sN = st.low ? "S̄" : "S", rN = st.low ? "R̄" : "R";
      bS.textContent = `${sN} = ${st.s}`; bR.textContent = `${rN} = ${st.r}`;
      bS.setAttribute("aria-pressed", String(!!st.s)); bR.setAttribute("aria-pressed", String(!!st.r));
      const q = st.inv ? (st.low ? 1 : 0) : st.q, qn = st.inv ? (st.low ? 1 : 0) : 1 - st.q;
      svg.innerHTML = "";
      const wires = S("g", null, svg), g = S("g", null, svg);
      const type = st.low ? "NAND" : "NOR";
      const g1 = DLD.drawGate(g, type, 230, 80, 2), g2 = DLD.drawGate(g, type, 230, 190, 2);
      // บน: NOR รับ R → Q ; NAND รับ S̄ → Q
      const topIn = st.low ? ["S̄", st.s] : ["R", st.r], botIn = st.low ? ["R̄", st.r] : ["S", st.s];
      txt(svg, 14, g1.inputs[0].y + 5, `${topIn[0]}=${topIn[1]}`); wire(wires, `M70,${g1.inputs[0].y} H${g1.inputs[0].x}`, topIn[1]);
      txt(svg, 14, g2.inputs[1].y + 5, `${botIn[0]}=${botIn[1]}`); wire(wires, `M70,${g2.inputs[1].y} H${g2.inputs[1].x}`, botIn[1]);
      const ox = g1.output.x;
      wire(wires, `M${ox},80 H470`, q); wire(wires, `M${ox},190 H470`, qn);
      // ป้อนกลับไขว้
      wire(wires, `M${ox + 30},80 V112 L170,158 V${g2.inputs[0].y} H${g2.inputs[0].x}`, q); dot(svg, ox + 30, 80);
      wire(wires, `M${ox + 30},190 V158 L170,112 V${g1.inputs[1].y} H${g1.inputs[1].x}`, qn); dot(svg, ox + 30, 190);
      lamp(svg, 490, 80, q, 13); lamp(svg, 490, 190, qn, 13);
      txt(svg, 512, 85, `Q=${q}`); txt(svg, 512, 195, `Q̄=${qn}`);
      if (st.inv) S("rect", { x: 456, y: 52, width: 100, height: 168, rx: 10, fill: "none", stroke: "var(--danger,#e03131)", "stroke-width": 2.5, "stroke-dasharray": "6 4" }, svg);
      // ตาราง
      const rows = st.low ? [[1, 1, "NC", "คงสภาวะเดิม"], [0, 1, "Q=1", "SET"], [1, 0, "Q=0", "RESET"], [0, 0, "Q=Q̄=1", "invalid"]]
        : [[0, 0, "NC", "คงสภาวะเดิม"], [0, 1, "Q=0", "RESET"], [1, 0, "Q=1", "SET"], [1, 1, "Q=Q̄=0", "invalid"]];
      tbl.innerHTML = `<div class="tiny muted" style="margin-bottom:4px">ตารางที่ ${st.low ? "8.2" : "8.1"}</div><table class="data" style="text-align:center"><tr><th>${sN}</th><th>${rN}</th><th>เอาต์พุต</th><th>ความหมาย</th></tr>` +
        rows.map(([s, r, o, m]) => `<tr${hlRow(s === st.s && r === st.r)}><td>${s}</td><td>${r}</td><td class="mono">${o}</td><td${m === "invalid" ? ' style="color:var(--danger,#e03131)"' : ""}>${m}</td></tr>`).join("") + "</table>";
      // ผังเวลาจากประวัติ
      const hs = st.hist, step = 44, X0 = 50, W_ = X0 + 14 * step + 10;
      wave.setAttribute("viewBox", `0 0 ${W_} 150`); wave.innerHTML = "";
      [["s", sN, 20], ["r", rN, 66], ["q", "Q", 112]].forEach(([k, n, y]) => {
        txt(wave, 8, y + 18, n, { size: 13 });
        S("path", { d: DLD.wavePath(hs.map((h) => h[k]), X0, step, y, y + 26), class: k === "q" ? "s-hi" : "s-wave", "stroke-width": 2.5 }, wave);
      });
      hs.forEach((h, i) => { if (h.inv) S("rect", { x: X0 + i * step, y: 10, width: step, height: 134, fill: "var(--danger,#e03131)", opacity: 0.12 }, wave); });
      msg.innerHTML = st.inv
        ? `<b style="color:var(--danger,#e03131)">invalid</b>: ${sN} และ ${rN} active พร้อมกัน → Q = Q̄ = ${q} ซึ่งขัดกับนิยามที่ Q และ Q̄ ต้องตรงข้ามกัน · ถ้าปล่อยทั้งสองพร้อมกัน สภาวะต่อไปทำนายไม่ได้`
        : `Q = ${q} · ` + ((st.low ? !st.s : st.s) ? "SET (Q = 1)" : (st.low ? !st.r : st.r) ? "RESET (Q = 0)" : `ไม่มีอินพุต active → <b>คงสภาวะเดิม</b> (เส้นป้อนกลับจำค่า Q = ${q} ไว้)`) +
          `<br><span class="muted">${st.low ? "แบบ NAND: อินพุต active เมื่อเป็น 0 (active-LOW)" : "แบบ NOR: อินพุต active เมื่อเป็น 1 (active-HIGH)"}</span>`;
    }
    reset(); watch(el);
  };

  /* =====================================================
     2) ffwave — ผังเวลาของแลทช์/ฟลิปฟลอป (8.1.2–8.2.5)
     ===================================================== */
  const N = 20; // จำนวนช่องเวลา (ครึ่งคาบนาฬิกา)
  const CLK = [...Array(N)].map((_, t) => t % 2);
  const TYPES = {
    gsr: { title: "Gated S-R latch (รูปที่ 8.3)", ins: ["S", "R", "EN"], latch: "EN", fn: "sr",
      def: { S: "00111000000000110000", R: "00000001110000000011", EN: "01111100111110001111" },
      hint: "แลทช์ทำงานตาม<b>ระดับ</b> (level) ของ EN — เมื่อ EN = 1 ทำตาม S, R · เมื่อ EN = 0 คงสภาวะเดิม" },
    dlatch: { title: "Gated D latch (รูปที่ 8.4)", ins: ["D", "EN"], latch: "EN", fn: "d",
      def: { D: "01100111000110011100", EN: "00111100001111000011" },
      hint: "EN = 1: Q ตาม D ตลอดเวลา (โปร่งใส) · EN = 0: จำค่าล่าสุดไว้ — S และ R ไม่มีวันเท่ากันจึงไม่มี invalid" },
    cmp: { title: "แลทช์ ⇄ ฟลิปฟลอป: D latch กับ D flip-flop ที่ได้ D และนาฬิกาเดียวกัน", ins: ["D"], clk: true, fn: "d", compare: true,
      def: { D: "00110111001100011000" },
      hint: "แลทช์เปลี่ยนตาม D ตลอดช่วงที่ CLK (EN) เป็น HIGH · ฟลิปฟลอปสุ่มค่า D <b>เฉพาะที่ขอบขาขึ้น</b> เท่านั้น — คลิกช่องของ D แล้วเทียบ Q ทั้งสองแถว" },
    srff: { title: "Positive edge-triggered S-R flip-flop (ตารางที่ 8.3 · รูปที่ 8.6)", ins: ["S", "R"], clk: true, fn: "sr",
      def: { S: "01100000001100000000", R: "00000110000000110000" },
      hint: "เอาต์พุตเปลี่ยนเฉพาะที่ขอบขาขึ้น (↑) ของ CLK ตามค่า S, R ณ ขณะนั้น · ช่วงอื่นไม่สนใจอินพุต" },
    dff: { title: "Positive edge-triggered D flip-flop (ตารางที่ 8.4 · รูปที่ 8.9)", ins: ["D"], clk: true, fn: "d",
      def: { D: "00111100110001111001" },
      hint: "ที่ขอบขาขึ้น Q รับค่า D ณ ขณะนั้น (เก็บข้อมูล 1 บิต)" },
    jkff: { title: "Edge-triggered J-K flip-flop (ตารางที่ 8.5–8.6 · รูปที่ 8.10–8.11)", ins: ["J", "K"], clk: true, fn: "jk", edgeSel: true,
      def: { J: "01111100000011111100", K: "00000111111011111100" },
      hint: "J = SET · K = RESET · J = K = 1 → <b>toggle</b> (กลับค่า) แทนสภาวะ invalid · เลือกขอบขาขึ้นหรือขอบขาลงได้" },
    jkpc: { title: "J-K flip-flop ที่มี preset และ clear แบบ active-LOW (ตัวอย่างที่ 8.2)", ins: ["J", "K", "PRE", "CLR"], clk: true, fn: "jk", async: true,
      def: { J: "11111111111111111111", K: "11111111111111111111", PRE: "00000011111111111111", CLR: "11111111111111100000" },
      hint: "PRE̅ = 0 → Q = 1 และ CLR̅ = 0 → Q = 0 <b>ทันที</b> โดยไม่รอนาฬิกาและไม่สนใจ J, K (asynchronous) · ค่าเริ่มต้นตามตัวอย่างที่ 8.2" },
  };
  const ACT = { set: "SET", reset: "RESET", nc: "NC", tog: "TOG", inv: "INV", d1: "D=1", d0: "D=0" };
  function apply(fn, v, q) { // คืน [Qใหม่, ชื่อการทำงาน]
    if (fn === "d") return [v.D, v.D ? "d1" : "d0"];
    const a = fn === "sr" ? v.S : v.J, b = fn === "sr" ? v.R : v.K;
    if (a && b) return fn === "sr" ? [q, "inv"] : [1 - q, "tog"];
    if (a) return [1, "set"]; if (b) return [0, "reset"]; return [q, "nc"];
  }
  W.ffwave = function (el) {
    const T = TYPES[el.dataset.type || "dff"];
    const body = U.shell(el, "INTERACTIVE", T.title, T.hint + " · <b>คลิกช่องของรูปคลื่นอินพุตเพื่อสลับ 0/1</b>");
    const st = { sig: {}, neg: false, q0: 0 };
    const reset = () => T.ins.forEach((k) => (st.sig[k] = bits(T.def[k])));
    reset();
    const ctr = H("div", { class: "controls" });
    if (T.edgeSel) ctr.append(U.seg([[false, "ขอบขาขึ้น ↑ (ตารางที่ 8.5)"], [true, "ขอบขาลง ↓ (ตารางที่ 8.6)"]], false, (v) => { st.neg = v; draw(); }));
    ctr.append(U.btn("Q เริ่มต้น = 0/1", () => { st.q0 ^= 1; draw(); }), U.btn("ค่าเริ่มต้น", () => { reset(); draw(); }),
      U.btn("สุ่มอินพุต", () => { const r = DLD.rng(Date.now() & 0xffff); T.ins.forEach((k) => { if (k === "PRE" || k === "CLR") return; let v = 0; st.sig[k] = [...Array(N)].map(() => (r() < 0.3 ? (v ^= 1) : v)); }); draw(); }));
    const svg = S("svg");
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, svg, msg);
    function sim(isLatch, en) {
      const Q = [], acts = [], inv = [];
      let q = st.q0;
      for (let t = 0; t < N; t++) {
        const v = {}; T.ins.forEach((k) => (v[k] = st.sig[k][t]));
        if (isLatch) {
          if (en[t]) { const [nq, a] = apply(T.fn, v, q); q = nq; if (a === "inv") inv[t] = 1; }
        } else if (t > 0) {
          const edge = st.neg ? CLK[t - 1] === 1 && CLK[t] === 0 : CLK[t - 1] === 0 && CLK[t] === 1;
          if (edge) {
            const pv = {}; T.ins.forEach((k) => (pv[k] = st.sig[k][t - 1])); // ค่าก่อนขอบนาฬิกา
            const [nq, a] = apply(T.fn, pv, q); q = nq; acts[t] = a;
          }
        }
        if (T.async) {
          const pre = st.sig.PRE[t], clr = st.sig.CLR[t];
          if (!pre && !clr) inv[t] = 1; else if (!pre) { q = 1; if (acts[t]) acts[t] = "pre"; } else if (!clr) { q = 0; if (acts[t]) acts[t] = "clr"; }
        }
        Q.push(q);
      }
      return { Q, acts, inv };
    }
    function draw() {
      const isLatch = !!T.latch;
      const rows = T.ins.map((k) => ({ name: k === "PRE" || k === "CLR" ? k : k, ov: k === "PRE" || k === "CLR", bits: st.sig[k], edit: k }));
      if (T.clk) rows.push({ name: T.compare ? "CLK/EN" : "CLK", bits: CLK, clk: true });
      let res, res2;
      if (T.compare) {
        res = sim(true, CLK); res2 = sim(false);
        rows.push({ name: "Q latch", bits: res.Q, out: true, sub: "D latch" }, { name: "Q FF", bits: res2.Q, out: true, out2: true, sub: "D FF ↑" });
      } else {
        res = sim(isLatch, isLatch ? st.sig[T.latch] : null);
        rows.push({ name: "Q", bits: res.Q, out: true }, { name: "Q̄", bits: res.Q.map((b) => 1 - b), out: true, faint: true });
      }
      const step = 34, X0 = 92, rowH = 46, top = 26;
      svg.setAttribute("viewBox", `0 0 ${X0 + N * step + 14} ${top + rows.length * rowH + 6}`);
      svg.innerHTML = "";
      const bg = S("g", null, svg);
      // เส้นขอบนาฬิกาที่ทำงาน
      const acts = (T.compare ? res2 : res).acts;
      if (!isLatch) for (let t = 1; t < N; t++) if (acts[t]) {
        const x = X0 + t * step;
        S("line", { x1: x, x2: x, y1: top - 4, y2: top + rows.length * rowH, stroke: "var(--accent)", "stroke-dasharray": "3 4", "stroke-width": 1.2 }, bg);
        txt(svg, x, top - 9, ACT[acts[t]] || acts[t].toUpperCase(), { a: "middle", size: 9.5, c: acts[t] === "inv" ? "var(--danger,#e03131)" : "var(--accent)" });
      }
      // ช่วง EN ของแลทช์
      if (isLatch) st.sig[T.latch].forEach((b, t) => { if (b) S("rect", { x: X0 + t * step, y: top - 6, width: step, height: rows.length * rowH + 6, fill: "var(--brand-soft)", opacity: 0.55 }, bg); });
      (res.inv || []).forEach((b, t) => { if (b) S("rect", { x: X0 + t * step, y: top - 6, width: step, height: rows.length * rowH + 6, fill: "var(--danger,#e03131)", opacity: 0.15 }, bg); });
      rows.forEach((r, i) => {
        const yH = top + i * rowH + 6, yL = yH + 26;
        txt(svg, 8, yH + 19, r.name, { size: 13, ov: r.ov, c: r.out ? "var(--hi)" : "var(--ink)" });
        S("path", { d: DLD.wavePath(r.bits, X0, step, yH, yL), class: r.out ? (r.faint ? "s-wave2" : "s-hi") : r.clk ? "s-wave2" : "s-wave", "stroke-width": r.out && !r.faint ? 3 : 2.2, style: r.out2 ? "stroke:var(--accent)" : "" }, svg);
        if (r.edit) r.bits.forEach((_, t) => {
          const hit = S("rect", { x: X0 + t * step, y: yH - 4, width: step, height: 34, fill: "transparent", style: "cursor:pointer" }, svg);
          hit.addEventListener("click", () => { st.sig[r.edit][t] ^= 1; draw(); });
        });
      });
      // ข้อความ
      const cnt = {}; Object.values(acts).forEach((a) => (cnt[a] = (cnt[a] || 0) + 1));
      if (T.compare) {
        const diff = res.Q.filter((b, t) => b !== res2.Q[t]).length;
        msg.innerHTML = `Q ของแลทช์และฟลิปฟลอป<b>ต่างกัน ${diff} ช่องเวลา</b> — แลทช์ “โปร่งใส” ตลอดช่วง CLK = 1 ส่วนฟลิปฟลอปเปลี่ยนเฉพาะที่ขอบขาขึ้น (เส้นประ)`;
      } else if (isLatch) {
        msg.innerHTML = `ช่วงที่ระบายพื้นคือ ${T.latch} = 1 (แลทช์ทำงาน) · Q เปลี่ยนได้<b>เฉพาะ</b>ในช่วงนี้` + ((res.inv || []).some(Boolean) ? ` · <b style="color:var(--danger,#e03131)">พื้นแดง = S = R = 1 ขณะ EN = 1 (invalid)</b>` : "");
      } else {
        const names = { set: "SET", reset: "RESET", nc: "NC", tog: "toggle", inv: "invalid", d1: "เก็บ 1", d0: "เก็บ 0", pre: "ถูก PRE̅ บังคับเป็น 1", clr: "ถูก CLR̅ บังคับเป็น 0" };
        msg.innerHTML = `ขอบนาฬิกาที่ทำงาน (${st.neg ? "ขอบขาลง ↓" : "ขอบขาขึ้น ↑"}): ` + Object.entries(cnt).map(([k, v]) => `${names[k] || k} ${v} ครั้ง`).join(" · ") +
          (T.async ? `<br>ช่วงพื้นแดง = PRE̅ และ CLR̅ เป็น 0 พร้อมกัน (ห้ามใช้) · Q₀ เริ่มต้น = ${st.q0}` : `<br>ใช้ค่าอินพุต “ก่อน” ขอบนาฬิกาเล็กน้อย · Q₀ เริ่มต้น = ${st.q0}`);
      }
    }
    draw(); watch(el);
  };

  /* =====================================================
     3) วงจรเก็บข้อมูลแบบขนาน 4 บิต (8.3.1)
     ===================================================== */
  W.pregister = function (el) {
    const body = U.shell(el, "INTERACTIVE", "วงจรเก็บข้อมูลแบบขนานด้วย D flip-flop 4 ตัว (รูปที่ 8.14)",
      "ตั้งค่าข้อมูล D₃–D₀ แล้วกด “พัลส์นาฬิกา ↑” — ข้อมูลทั้ง 4 บิตถูกเก็บพร้อมกันที่ขอบขาขึ้น · เปลี่ยน D หลังจากนั้นได้โดย Q ไม่เปลี่ยนจนกว่าจะมีพัลส์ถัดไป · CLR̅ ล้างทุกบิตเป็น 0 ทันที");
    const st = { d: [1, 0, 1, 1], q: [0, 0, 0, 0], log: [] };
    const ctr = H("div", { class: "controls" });
    ctr.append(U.btn("พัลส์นาฬิกา ↑ (เก็บข้อมูล)", () => { st.q = st.d.slice(); st.log.unshift(`↑ เก็บ ${st.q.join("")}`); draw(); }, "primary"),
      U.btn("CLR̅ = 0 (ล้าง)", () => { st.q = [0, 0, 0, 0]; st.log.unshift("CLR̅ → 0000"); draw(); }));
    const dRow = H("div"), svg = S("svg", { viewBox: "0 0 640 230", style: "max-width:640px" });
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, dRow, svg, msg);
    function draw() {
      dRow.innerHTML = ""; dRow.append(U.bitRow(st.d, { labels: ["D₃", "D₂", "D₁", "D₀"], onToggle: (i) => { st.d[i] ^= 1; draw(); } }));
      svg.innerHTML = "";
      const wires = S("g", null, svg), g = S("g", null, svg);
      for (let i = 0; i < 4; i++) {
        const x = 70 + i * 140, b = 3 - i, pend = st.d[i] !== st.q[i];
        wire(wires, `M${x + 30},10 V60`, st.d[i]); txt(svg, x + 36, 26, `D${b}=${st.d[i]}`, { size: 12 });
        S("rect", { x, y: 60, width: 80, height: 90, rx: 6, class: "s-gate", style: pend ? "stroke:var(--accent);stroke-width:3" : "" }, g);
        txt(g, x + 10, 84, "D", { size: 13 }); txt(g, x + 66, 84, "Q", { size: 13 });
        S("path", { d: `M${x},${124} L${x + 10},${130} L${x},${136}`, fill: "none", class: "s-gate" }, g); txt(g, x + 14, 135, "C", { size: 12 });
        wire(wires, `M${x + 80},80 H${x + 110}`, st.q[i]); lamp(svg, x + 120, 80, st.q[i], 11); txt(svg, x + 106, 112, `Q${b}=${st.q[i]}`, { size: 12, c: st.q[i] ? "var(--hi)" : "var(--ink)" });
        wire(wires, `M${x - 20},130 H${x}`, 0); dot(svg, x - 20, 130);
        if (pend) txt(svg, x + 40, 170, "รอ ↑", { a: "middle", size: 11, c: "var(--accent)" });
      }
      wire(wires, `M8,200 H${70 + 3 * 140 - 20}`, 0);
      for (let i = 0; i < 4; i++) wire(wires, `M${50 + i * 140},130 V200`, 0);
      txt(svg, 8, 222, "CLK (ต่อร่วมกันทุกตัว)", { size: 12, w: 400, c: "var(--ink-3)" });
      const pend = st.d.some((b, i) => b !== st.q[i]);
      msg.innerHTML = `ข้อมูลที่เก็บอยู่: <b class="mono">${st.q.join("")}</b>` + (pend ? ` · ข้อมูลขาเข้า ${st.d.join("")} <b>ยังไม่ถูกเก็บ</b> จนกว่าจะมีขอบขาขึ้นของนาฬิกา` : " · ตรงกับข้อมูลขาเข้า") +
        (st.log.length ? `<br><span class="muted">ประวัติ: ${st.log.slice(0, 5).join(" · ")}</span>` : "");
    }
    draw(); watch(el);
  };

  /* =====================================================
     4) วงจรหารความถี่ / วงจรนับ (8.3.2–8.3.3)
     ===================================================== */
  W.freqdiv = function (el) {
    const count = el.dataset.mode === "count";
    const body = U.shell(el, "INTERACTIVE", count ? "วงจรนับไบนารีด้วย negative edge-triggered J-K flip-flop (รูปที่ 8.17–8.18)" : "วงจรหารความถี่ด้วย J-K flip-flop แบบ toggle (รูปที่ 8.15–8.16 · ตัวอย่างที่ 8.3)",
      count ? "J = K = 1 ทุกตัว (toggle) · Q ของตัวก่อนหน้าเป็นนาฬิกาของตัวถัดไป · อ่าน Q ตัวท้ายเป็น MSB และ Q_A เป็น LSB จะได้ลำดับการนับ"
        : "J = K = 1 → ฟลิปฟลอป toggle ทุกขอบขาขึ้น เอาต์พุตจึงมีความถี่ครึ่งหนึ่ง · ต่อ n ตัวหารด้วย 2ⁿ");
    const st = { n: +(el.dataset.n || (count ? 3 : 3)), f: 8, neg: count };
    const ctr = H("div", { class: "controls" });
    ctr.append(U.seg([[1, "1 ตัว"], [2, "2 ตัว"], [3, "3 ตัว"], [4, "4 ตัว"]], st.n, (v) => { st.n = v; draw(); }),
      U.seg([[false, "ขอบขาขึ้น ↑"], [true, "ขอบขาลง ↓"]], st.neg, (v) => { st.neg = v; draw(); }));
    if (!count) ctr.append(U.input("f_CLK (kHz):", String(st.f), (s) => { const v = parseFloat(s); if (v > 0) { st.f = v; draw(); } }, { width: 70 }));
    const blk = S("svg", { style: "max-width:720px" }), svg = S("svg");
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, blk, svg, msg);
    const fmt = (v) => (v >= 1 ? `${+v.toFixed(3)} kHz` : `${+(v * 1000).toFixed(1)} Hz`);
    function draw() {
      const n = st.n, L = "ABCD";
      // block diagram
      blk.setAttribute("viewBox", `0 0 ${60 + n * 150 + 40} 120`); blk.innerHTML = "";
      for (let i = 0; i < n; i++) {
        const x = 60 + i * 150;
        S("rect", { x, y: 20, width: 80, height: 80, rx: 6, class: "s-gate" }, blk);
        txt(blk, x + 8, 42, "J", { size: 12 }); txt(blk, x + 8, 92, "K", { size: 12 }); txt(blk, x + 64, 42, "Q", { size: 12 });
        S("path", { d: `M${x},60 L${x + 10},66 L${x},72`, fill: "none", class: "s-gate" }, blk);
        if (st.neg) S("circle", { cx: x - 5, cy: 66, r: 4.5, class: "s-gate" }, blk);
        txt(blk, x + 40, 118, `FF ${L[i]}`, { a: "middle", size: 11, w: 400, c: "var(--ink-3)" });
        txt(blk, x - 4, 34, "1", { a: "end", size: 11, c: "var(--hi)" }); txt(blk, x - 4, 96, "1", { a: "end", size: 11, c: "var(--hi)" });
        S("path", { d: `M${x + 80},38 H${x + 100}`, class: "s-wire0" }, blk);
        txt(blk, x + 104, 34, `Q${L[i]}`, { size: 12, c: "var(--hi)" });
        const cx = st.neg ? x - 10 : x;
        if (i === 0) { S("path", { d: `M10,66 H${cx}`, class: "s-wire0" }, blk); txt(blk, 8, 58, "CLK", { size: 12 }); }
        else S("path", { d: `M${x - 50},38 V66 H${cx}`, class: "s-wire0" }, blk);
      }
      // waveforms
      const slots = Math.max(8, Math.min(4 << n, 32)), step = Math.max(14, Math.min(34, 640 / slots)), X0 = 70, rowH = 44;
      const clk = [...Array(slots)].map((_, t) => (st.neg ? 1 - (t % 2) : t % 2));
      const Qs = []; let src = clk;
      for (let i = 0; i < n; i++) {
        let q = 0; const out = [];
        for (let t = 0; t < slots; t++) {
          if (t > 0) { const e = st.neg ? src[t - 1] === 1 && src[t] === 0 : src[t - 1] === 0 && src[t] === 1; if (e) q ^= 1; }
          out.push(q);
        }
        Qs.push(out); src = out;
      }
      const rows = [{ n: "CLK", b: clk, f: st.f }, ...Qs.map((b, i) => ({ n: "Q" + L[i], b, f: st.f / (2 << i), out: true }))];
      const extra = count ? 30 : 0;
      svg.setAttribute("viewBox", `0 0 ${X0 + slots * step + 110} ${rows.length * rowH + 12 + extra}`); svg.innerHTML = "";
      rows.forEach((r, i) => {
        const yH = 8 + i * rowH, yL = yH + 26;
        txt(svg, 8, yH + 19, r.n, { size: 13, c: r.out ? "var(--hi)" : "var(--ink)" });
        S("path", { d: DLD.wavePath(r.b, X0, step, yH, yL), class: r.out ? "s-hi" : "s-wave2", "stroke-width": 2.4 }, svg);
        txt(svg, X0 + slots * step + 8, yH + 19, count ? (i ? `÷${2 << (i - 1)}` : "") : i ? `${fmt(r.f)}` : `${fmt(st.f)}`, { size: 11, c: "var(--ink-3)" });
      });
      if (count) { // ค่านับในแต่ละช่วง
        const y = rows.length * rowH + 26;
        for (let t = 0; t < slots; t++) {
          const v = Qs.reduce((a, q, i) => a + (q[t] << i), 0);
          if (t === 0 || v !== Qs.reduce((a, q, i) => a + (q[t - 1] << i), 0)) txt(svg, X0 + t * step + 3, y, String(v), { size: 12, c: "var(--brand)" });
        }
        txt(svg, 8, y, "นับ", { size: 12, c: "var(--brand)" });
      }
      const seq = [...new Set([...Array(slots)].map((_, t) => Qs.reduce((a, q, i) => a + (q[t] << i), 0)))];
      msg.innerHTML = count
        ? `ลำดับที่ได้ (Q${L[n - 1]}…Q<sub>A</sub>): ${seq.slice(0, 1 << n).map((v) => v.toString(2).padStart(n, "0")).join(" → ")} → วนซ้ำ · นับ 0 ถึง ${(1 << n) - 1}` +
          (st.neg ? "" : `<br><b>สังเกต:</b> เมื่อใช้ขอบขาขึ้นและ Q เป็นนาฬิกาของตัวถัดไป ลำดับจะเป็น<b>การนับลง</b> — วงจรในรูปที่ 8.17 จึงใช้ขอบขาลง`)
        : `ฟลิปฟลอป ${n} ตัว หารความถี่ด้วย 2<sup>${n}</sup> = <b>${1 << n}</b>: ${fmt(st.f)} → <b>${fmt(st.f / (1 << n))}</b>` + (st.f === 8 && n === 3 ? " (ตรงกับตัวอย่างที่ 8.3)" : "");
    }
    draw();
  };
})();
