/* =========================================================
   บทที่ 9 — interactive widgets (วงจรนับและชิฟต์รีจิสเตอร์)
   ripple · synccount · cdesign · shiftreg
   หมายเหตุ: ขีดบนใช้ <span class="ov"> (HTML) และ {X} → tspan overline (SVG) — ไม่ใช้อักขระผสม
   ========================================================= */
(function () {
  const DLD = window.DLD, U = DLD.ui, W = DLD.widgets, BL = DLD.bool;
  const H = (...a) => DLD.h(...a);
  const S = (...a) => DLD.svg(...a);
  const OV = (t) => `<span class="ov">${t}</span>`;
  const Qs = (k) => `Q<sub>${k}</sub>`;
  const hlRow = (on) => (on ? ' style="background:var(--brand-soft);font-weight:700"' : "");
  const bin = (v, n) => v.toString(2).padStart(n, "0");
  /* txt: ข้อความใน SVG — ส่วนที่อยู่ใน {…} แสดงขีดบน */
  const txt = (g, x, y, t, o) => {
    o = o || {};
    const el = S("text", { x, y, "text-anchor": o.a || "start", class: "s-mono", style: `font-size:${o.size || 14}px;font-weight:${o.w || 700};fill:${o.c || "var(--ink)"}` }, g);
    String(t).split(/(\{[^}]*\})/).forEach((p) => {
      if (!p) return;
      if (p[0] === "{") S("tspan", { text: p.slice(1, -1), style: "text-decoration:overline" }, el);
      else S("tspan", { text: p }, el);
    });
    return el;
  };
  const range = (min, max, val, on) => { const i = H("input", { type: "range", min, max, value: val, style: "width:140px;vertical-align:middle" }); i.addEventListener("input", () => on(+i.value)); return i; };

  /* =====================================================
     1) วงจรนับแบบ asynchronous (ripple) + propagation delay + MOD10/12 (9.2)
     ===================================================== */
  W.ripple = function (el) {
    const st = { n: +(el.dataset.n || 3), mod: +(el.dataset.mod || 0), d: +(el.dataset.delay || 0) };
    const body = U.shell(el, "INTERACTIVE", "วงจรนับแบบ asynchronous (ripple counter)",
      "FF0 รับสัญญาณนาฬิกาจากภายนอก ส่วน FF ถัดไปรับนาฬิกาจากเอาต์พุตของตัวก่อนหน้า (toggle เมื่อ Q ตัวก่อนหน้าเปลี่ยนจาก 1 → 0) · ปรับ propagation delay เพื่อดูการ “ไหล” ของการเปลี่ยนสถานะ · MOD10/MOD12 ใช้ NAND ถอดรหัสบางส่วน (partial decoding) ต่อเข้า <span class=\"ov\">CLR</span> ทุกตัว");
    const ctr = H("div", { class: "controls" });
    const segN = U.seg([[2, "2 บิต"], [3, "3 บิต"], [4, "4 บิต"]], st.n, (v) => { st.n = v; if (v < 4) st.mod = 0; draw(); });
    const segM = U.seg([[0, "นับเต็ม 2ⁿ"], [10, "MOD10 (รูปที่ 9.6)"], [12, "MOD12 (รูปที่ 9.7)"]], st.mod, (v) => { st.mod = v; if (v) { st.n = 4; segN.set(4); } draw(); });
    const dl = H("label", { class: "mono", style: "font-size:13px" }); const dv = H("b");
    dl.append("delay ", range(0, 8, st.d, (v) => { st.d = v; draw(); }), " ", dv);
    ctr.append(segN, segM, dl);
    const svg = S("svg");
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, svg, msg);
    function simulate() {
      const n = st.n, P = 40, M = st.mod || 1 << n, cycles = M + 1, T = cycles * P, d = st.d;
      const sel = st.mod === 10 ? [3, 1] : st.mod === 12 ? [3, 2] : null;
      const Q = Array(n).fill(0), q = []; const clk = [], clr = [];
      const queue = {}; const push = (t, op) => (queue[t] = queue[t] || []).push(op);
      let clrPending = false;
      const nandOut = () => (sel ? (sel.every((k) => Q[k]) ? 0 : 1) : 1);
      for (let t = 0; t <= T; t++) {
        const c = t % P >= P / 2 ? 1 : 0;
        if (t % P === P / 2) push(t + d, { tog: 0 });
        const list = queue[t] || [];
        while (list.length) {
          const op = list.shift();
          if (op.clr) { Q.fill(0); clrPending = false; }
          else if (!clrPending || d === 0) {
            const k = op.tog, old = Q[k]; Q[k] ^= 1;
            if (old === 1 && k + 1 < n) { if (d === 0) list.push({ tog: k + 1 }); else push(t + d, { tog: k + 1 }); }
          }
          if (sel && !clrPending && nandOut() === 0) { clrPending = true; if (d === 0) list.push({ clr: 1 }); else push(t + d, { clr: 1 }); }
        }
        clk.push(c); q.push(Q.slice()); clr.push(nandOut());
      }
      return { P, T, cycles, clk, q, clr, M };
    }
    function draw() {
      dv.textContent = st.d ? `${st.d} หน่วย` : "0 (อุดมคติ)";
      segM.style.display = "";
      const r = simulate(), n = st.n;
      const rows = [{ name: "CLK", b: r.clk }];
      for (let k = 0; k < n; k++) rows.push({ name: `Q${k}`, b: r.q.map((v) => v[k]), out: true });
      if (st.mod) rows.push({ name: "{CLR}", b: r.clr, warn: true });
      const X0 = 60, Wd = 780, sx = Wd / r.T, rowH = 40, top = 22;
      const H_ = top + rows.length * rowH + 30;
      svg.setAttribute("viewBox", `0 0 ${X0 + Wd + 14} ${H_}`); svg.innerHTML = "";
      // ขอบขาขึ้นของนาฬิกา
      for (let c = 0; c < r.cycles; c++) {
        const x = X0 + (c * r.P + r.P / 2) * sx;
        S("line", { x1: x, x2: x, y1: top - 6, y2: top + rows.length * rowH, stroke: "var(--accent)", "stroke-dasharray": "2 4", "stroke-width": 1 }, svg);
        txt(svg, x, top - 9, String(c + 1), { a: "middle", size: 9.5, c: "var(--accent)", w: 400 });
      }
      rows.forEach((row, i) => {
        const yH = top + i * rowH + 4, yL = yH + 24;
        txt(svg, 6, yH + 17, row.name, { size: 13, c: row.out ? "var(--hi)" : row.warn ? "var(--danger,#e03131)" : "var(--ink)" });
        S("path", { d: DLD.wavePath(row.b, X0, sx, yH, yL), class: row.out ? "s-hi" : "s-wave2", "stroke-width": 2.2, style: row.warn ? "stroke:var(--danger,#e03131)" : "" }, svg);
      });
      // ค่านับในแต่ละช่วง (ก่อนขอบนาฬิกาถัดไป)
      const yC = top + rows.length * rowH + 20;
      txt(svg, 6, yC, "นับ", { size: 12, c: "var(--brand)" });
      for (let c = 0; c <= r.cycles; c++) {
        const t = Math.min(r.T, c * r.P + r.P / 2 - 1); if (t < 0) continue;
        const v = r.q[t].reduce((a, b, k) => a + (b << k), 0);
        const x = X0 + (c === 0 ? r.P / 4 : c * r.P) * sx;
        txt(svg, x, yC, String(v), { a: "middle", size: 12, c: "var(--brand)" });
      }
      // สถานะชั่วคราวที่ยาวที่สุด
      let worst = null;
      for (let c = 0; c < r.cycles; c++) {
        const t0 = c * r.P + r.P / 2, seq = [];
        for (let t = t0 - 1; t < Math.min(r.T, t0 + r.P / 2); t++) { const v = r.q[t].reduce((a, b, k) => a + (b << k), 0); if (seq[seq.length - 1] !== v) seq.push(v); }
        if (!worst || seq.length > worst.length) worst = seq;
      }
      const M = r.M;
      let m = `ฟลิปฟลอป ${n} ตัว · modulus = <b>${M}</b> (นับ 0 ถึง ${M - 1}) · maximum modulus = 2<sup>${n}</sup> = ${1 << n}`;
      if (st.mod) m += `<br>NAND รับเฉพาะ ${st.mod === 10 ? `${Qs(3)} และ ${Qs(1)}` : `${Qs(3)} และ ${Qs(2)}`} (partial decoding) → เมื่อนับถึง ${bin(st.mod, 4)} (${st.mod}) <span class="ov">CLR</span> เป็น 0 ล้างทุกตัวกลับเป็น 0000` +
        (st.d ? ` · สถานะ ${st.mod} ปรากฏสั้น ๆ เป็น <b>glitch</b> (เส้นแดง)` : "");
      if (st.d && worst && worst.length > 2) m += `<br>ด้วย delay ตัวละ ${st.d} หน่วย การเปลี่ยนที่แย่ที่สุดผ่านสถานะชั่วคราว: <b class="mono">${worst.map((v) => bin(v, n)).join(" → ")}</b> — ripple counter จึงช้าและอาจถอดรหัสผิดชั่วขณะ`;
      else if (!st.d) m += `<br><span class="muted">delay = 0 คือผังเวลาแบบอุดมคติ — ลองเพิ่ม delay เพื่อดูผลของ propagation delay (หัวข้อ 9.2.3)</span>`;
      msg.innerHTML = m;
    }
    draw();
  };

  /* =====================================================
     2) วงจรนับแบบ synchronous: binary / BCD / up-down (9.3)
     ===================================================== */
  const SYNC = {
    bin: { title: "วงจรนับไบนารีแบบ synchronous (รูปที่ 9.8–9.12)",
      T: (Q, k) => Q.slice(0, k).every(Boolean) ? 1 : 0,
      ex: (k) => (k === 0 ? "1" : [...Array(k)].map((_, i) => Qs(k - 1 - i)).join("")) },
    bcd: { title: "วงจรนับ 10 แบบ synchronous (BCD decade · รูปที่ 9.13)", n: 4,
      T: (Q, k) => [1, Q[0] & (1 - Q[3]), Q[1] & Q[0], (Q[2] & Q[1] & Q[0]) | (Q[3] & Q[0])][k],
      ex: (k) => ["1", `${Qs(0)}${OV(Qs(3))}`, `${Qs(1)}${Qs(0)}`, `${Qs(2)}${Qs(1)}${Qs(0)} + ${Qs(3)}${Qs(0)}`][k] },
    updown: { title: "วงจรนับไบนารีขึ้น/ลงแบบ synchronous ขนาด 3 บิต (รูปที่ 9.14–9.15)", n: 3,
      T: (Q, k, up) => [1, up ? Q[0] : 1 - Q[0], up ? Q[1] & Q[0] : (1 - Q[1]) & (1 - Q[0])][k],
      ex: (k) => ["1", `${Qs(0)}·UP + ${OV(Qs(0))}·DOWN`, `${Qs(1)}${Qs(0)}·UP + ${OV(Qs(1))}${OV(Qs(0))}·DOWN`][k] },
  };
  W.synccount = function (el) {
    const C = SYNC[el.dataset.mode || "bin"];
    const st = { n: C.n || +(el.dataset.n || 4), Q: [], hist: [], up: 1 };
    const body = U.shell(el, "INTERACTIVE", C.title,
      "ฟลิปฟลอปทุกตัวรับ<b>สัญญาณนาฬิกาเดียวกัน</b> · J-K ทุกตัวต่อ J = K จึง toggle เมื่อ J = K = 1 · เกต AND สร้างเงื่อนไข toggle จากบิตที่ต่ำกว่า — ช่องสีเขียวคือตัวที่จะ toggle ที่ขอบนาฬิกาถัดไป");
    const ctr = H("div", { class: "controls" });
    const reset = () => { st.Q = Array(st.n).fill(0); st.hist = [0]; };
    reset();
    if (!C.n) ctr.append(U.seg([[2, "2 บิต"], [3, "3 บิต"], [4, "4 บิต"]], st.n, (v) => { st.n = v; reset(); draw(); }));
    ctr.append(U.btn("พัลส์นาฬิกา ↑", () => tick(1), "primary"), U.btn("×4", () => tick(4)), U.btn("รีเซ็ต (CLR)", () => { reset(); draw(); }));
    const upBtn = U.btn("", () => { st.up ^= 1; draw(); });
    if (el.dataset.mode === "updown") ctr.append(upBtn);
    const ffs = H("div", { style: "display:flex;flex-wrap:wrap;gap:10px;margin:8px 0" });
    const svg = S("svg");
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, ffs, svg, msg);
    const val = () => st.Q.reduce((a, b, k) => a + (b << k), 0);
    function tick(k) {
      for (let i = 0; i < k; i++) {
        const t = st.Q.map((_, j) => C.T(st.Q, j, st.up));
        st.Q = st.Q.map((q, j) => q ^ t[j]);
        st.hist.push(val()); if (st.hist.length > 21) st.hist.shift();
      }
      draw();
    }
    function draw() {
      upBtn.textContent = st.up ? "UP/DOWN = 1 (นับขึ้น)" : "UP/DOWN = 0 (นับลง)";
      const n = st.n, t = st.Q.map((_, j) => C.T(st.Q, j, st.up));
      ffs.innerHTML = "";
      for (let k = 0; k < n; k++) {
        ffs.append(H("div", { class: "card", style: `flex:1 1 150px;padding:8px 10px;border:2px solid ${t[k] ? "var(--hi)" : "var(--line)"};background:${t[k] ? "var(--hi-soft)" : "var(--surface)"}` },
          `<div class="tiny muted">FF${k}</div><div class="mono" style="font-size:13px">J<sub>${k}</sub> = K<sub>${k}</sub> = ${C.ex(k)} = <b>${t[k]}</b></div>` +
          `<div class="mono" style="font-size:18px;margin-top:4px">${Qs(k)} = <b style="color:${st.Q[k] ? "var(--hi)" : "var(--ink-3)"}">${st.Q[k]}</b> <span class="tiny" style="color:${t[k] ? "var(--hi)" : "var(--ink-3)"}">${t[k] ? "→ toggle" : "→ คงเดิม"}</span></div>`));
      }
      // ผังเวลาจากประวัติ
      const hs = st.hist, step = 34, X0 = 56, rowH = 36;
      svg.setAttribute("viewBox", `0 0 ${X0 + 21 * step + 10} ${n * rowH + 34}`); svg.innerHTML = "";
      for (let k = 0; k < n; k++) {
        const y = 6 + k * rowH;
        txt(svg, 6, y + 17, `Q${k}`, { size: 13, c: "var(--hi)" });
        S("path", { d: DLD.wavePath(hs.map((v) => (v >> k) & 1), X0, step, y, y + 22), class: "s-hi", "stroke-width": 2.2 }, svg);
      }
      hs.forEach((v, i) => txt(svg, X0 + i * step + step / 2, n * rowH + 24, String(v), { a: "middle", size: 12, c: i === hs.length - 1 ? "var(--accent)" : "var(--brand)" }));
      const v = val(), nxt = st.Q.map((q, j) => q ^ t[j]).reduce((a, b, k) => a + (b << k), 0);
      msg.innerHTML = `สถานะปัจจุบัน ${Qs(n - 1)}…${Qs(0)} = <b class="mono">${bin(v, n)}</b> (${v}) → ขอบนาฬิกาถัดไป: <b class="mono">${bin(nxt, n)}</b> (${nxt})` +
        (el.dataset.mode === "bcd" ? `<br>ที่ 1001 (9): J<sub>1</sub> = K<sub>1</sub> = ${Qs(0)}${OV(Qs(3))} = 0 จึงไม่ toggle และ J<sub>3</sub> = K<sub>3</sub> ได้ 1 จาก ${Qs(3)}${Qs(0)} → กลับเป็น 0000 แทนที่จะไป 1010` : "") +
        (el.dataset.mode === "updown" ? `<br>DOWN = ${OV("UP")} · นับขึ้น: toggle เมื่อบิตต่ำกว่าเป็น 1 ทั้งหมด · นับลง: toggle เมื่อบิตต่ำกว่าเป็น 0 ทั้งหมด` : "") +
        `<br><span class="muted">ทุกบิตเปลี่ยนพร้อมกันที่ขอบนาฬิกาเดียว — ไม่มีสถานะชั่วคราวแบบ ripple counter</span>`;
    }
    draw();
  };


  /* SOP ที่เล็กที่สุดสำหรับ ≤ 4 ตัวแปร: ค้นทุก prime implicant แล้วเลือกชุดที่ใช้พจน์น้อยสุด → literal น้อยสุด → ตัวแปร complement น้อยสุด
     (เมื่อเสมอกัน เลือกแบบไม่ complement ให้ตรงกับคำตอบในเล่ม) */
  function minCover(n, ones, dcs) {
    const ok = new Set([...ones, ...dcs]), pats = [];
    const cellsOf = (p) => { let c = [0]; [...p].forEach((ch, i) => { const b = 1 << (n - 1 - i); c = ch === "-" ? c.flatMap((x) => [x, x | b]) : c.map((x) => (ch === "1" ? x | b : x)); }); return c; };
    for (let i = 0; i < 3 ** n; i++) { let p = "", x = i; for (let k = 0; k < n; k++) { p += "01-"[x % 3]; x = Math.floor(x / 3); } const c = cellsOf(p); if (c.every((v) => ok.has(v)) && c.some((v) => ones.includes(v))) pats.push({ pat: p, cells: c }); }
    const primes = pats.filter((a) => !pats.some((b) => b !== a && a.cells.every((v) => b.cells.includes(v)) && b.cells.length > a.cells.length));
    const cost = (set) => [set.length, set.reduce((a, x) => a + [...x.pat].filter((c) => c !== "-").length, 0), set.reduce((a, x) => a + [...x.pat].filter((c) => c === "0").length, 0)];
    let best = null;
    const covers = (set) => ones.every((v) => set.some((x) => x.cells.includes(v)));
    const rec = (start, set, k) => {
      if (set.length === k) { if (covers(set)) { const c = cost(set); if (!best || c[1] < best.c[1] || (c[1] === best.c[1] && c[2] < best.c[2])) best = { set: set.slice(), c }; } return; }
      for (let i = start; i < primes.length; i++) { set.push(primes[i]); rec(i + 1, set, k); set.pop(); }
    };
    for (let k = 1; k <= primes.length && !best; k++) rec(0, [], k);
    return best ? best.set.sort((a, b) => b.cells.length - a.cells.length) : [];
  }

  /* =====================================================
     3) ออกแบบวงจรนับแบบ synchronous ด้วย J-K FF 6 ขั้นตอน (9.4)
     ===================================================== */
  W.cdesign = function (el) {
    const st = { src: el.dataset.seq || "0,1,3,2,6,7,5,4", step: 1 };
    const body = U.shell(el, "INTERACTIVE", "ออกแบบวงจรนับแบบ synchronous ด้วย J-K flip-flop (9.4.2)",
      "พิมพ์ลำดับการนับ (เลขฐานสิบคั่นด้วยจุลภาค) แล้วเลือกดูทีละขั้นตอน — ระบบสร้างตารางสถานะถัดไป ตาราง transition แผนผังคาร์โนห์ (สถานะที่ไม่ใช้ = X) และนิพจน์ J, K ให้อัตโนมัติ");
    const ctr = H("div", { class: "controls" });
    const inp = U.input("ลำดับ:", st.src, (s) => { st.src = s; draw(); }, { width: 220 });
    ctr.append(inp);
    [["Gray 3 บิต (9.4.2)", "0,1,3,2,6,7,5,4"], ["ตย. 9.2: 1→2→5→7", "1,2,5,7"], ["MOD6", "0,1,2,3,4,5"], ["BCD", "0,1,2,3,4,5,6,7,8,9"]].forEach(([t, v]) =>
      ctr.append(U.btn(t, () => { inp.input.value = st.src = v; draw(); })));
    const steps = U.seg([[1, "1 ผังสถานะ"], [2, "2 ตารางสถานะถัดไป"], [3, "3 transition"], [4, "4 คาร์โนห์"], [5, "5 นิพจน์"], [6, "6 ตรวจวงจร"]], st.step, (v) => { st.step = v; draw(); });
    const out = H("div", { class: "cd-out", style: "margin-top:10px;min-height:120px" });
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, steps, out, msg);
    const JK = (a, b) => (a === 0 ? (b ? ["1", "X"] : ["0", "X"]) : b ? ["X", "0"] : ["X", "1"]);
    function draw() {
      const seq = st.src.split(/[\s,→>-]+/).filter(Boolean).map(Number);
      inp.input.classList.remove("bad");
      if (seq.length < 2 || seq.some((v) => !(v >= 0) || v !== Math.floor(v)) || new Set(seq).size !== seq.length || Math.max(...seq) > 15) {
        inp.input.classList.add("bad"); out.innerHTML = ""; msg.innerHTML = "ใส่เลข 0–15 อย่างน้อย 2 ตัว ไม่ซ้ำกัน เช่น 0,1,3,2"; return;
      }
      const n = Math.max(2, Math.ceil(Math.log2(Math.max(...seq) + 1))), N = 1 << n;
      const next = {}; seq.forEach((s, i) => (next[s] = seq[(i + 1) % seq.length]));
      const unused = [...Array(N).keys()].filter((s) => !(s in next));
      const vars = [...Array(n)].map((_, i) => Qs(n - 1 - i)); // MSB ก่อน
      // J/K ของแต่ละ FF
      const F = [];
      for (let k = n - 1; k >= 0; k--) {
        const Jo = [], Jx = [...unused], Ko = [], Kx = [...unused], Jv = {}, Kv = {};
        seq.forEach((s) => { const a = (s >> k) & 1, b = (next[s] >> k) & 1, [j, kk] = JK(a, b); Jv[s] = j; Kv[s] = kk;
          if (j === "1") Jo.push(s); if (j === "X") Jx.push(s); if (kk === "1") Ko.push(s); if (kk === "X") Kx.push(s); });
        unused.forEach((s) => { Jv[s] = Kv[s] = "X"; });
        const mk = (ones, dcs) => { const g = ones.length ? minCover(n, ones, dcs) : []; return { g, html: g.length ? g.map((x) => BL.termOf(x.pat, vars, "sop", true)).join(" + ") : "0" }; };
        F.push({ k, Jv, Kv, J: mk(Jo, Jx), K: mk(Ko, Kx) });
      }
      const match = (g, s) => g.some((x) => [...x.pat].every((c, i) => c === "-" || +c === ((s >> (n - 1 - i)) & 1)));
      const nextOf = (s) => F.reduce((a, f) => { const q = (s >> f.k) & 1, j = match(f.J.g, s), kk = match(f.K.g, s); const nq = j && kk ? 1 - q : j ? 1 : kk ? 0 : q; return a | (nq << f.k); }, 0);
      out.innerHTML = "";
      const sv = st.step;
      if (sv === 1) { // ผังสถานะ
        const svg = S("svg", { viewBox: "0 0 520 300", style: "max-width:520px" }); out.append(svg);
        const cx = 260, cy = 150, R = 110, L = seq.length;
        S("defs", null, svg).innerHTML = `<marker id="ar9" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--brand)"/></marker>`;
        const pos = seq.map((_, i) => [cx + R * Math.sin((2 * Math.PI * i) / L), cy - R * Math.cos((2 * Math.PI * i) / L)]);
        seq.forEach((s, i) => {
          const [x1, y1] = pos[i], [x2, y2] = pos[(i + 1) % L], dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), r = 26;
          S("path", { d: `M${x1 + (dx * r) / len},${y1 + (dy * r) / len} L${x2 - (dx * r) / len},${y2 - (dy * r) / len}`, stroke: "var(--brand)", "stroke-width": 2, fill: "none", "marker-end": "url(#ar9)" }, svg);
        });
        seq.forEach((s, i) => { const [x, y] = pos[i]; S("circle", { cx: x, cy: y, r: 25, fill: "var(--surface)", stroke: "var(--brand)", "stroke-width": 2.5 }, svg); txt(svg, x, y + 5, bin(s, n), { a: "middle", size: 13 }); });
        out.append(H("p", { class: "small" }, `${seq.length} สถานะ ใช้ฟลิปฟลอป ${n} ตัว` + (unused.length ? ` · สถานะที่ไม่ใช้ (invalid): ${unused.map((s) => `<span class="mono">${bin(s, n)}</span>`).join(", ")} → จะเป็น “don’t care”` : "")));
      } else if (sv === 2 || sv === 3) {
        if (sv === 3) out.append(H("div", { class: "small", style: "margin-bottom:8px" }, `<b>ตารางที่ 9.5</b> transition ของ J-K: <span class="mono">0→0: J=0, K=X · 0→1: J=1, K=X · 1→0: J=X, K=1 · 1→1: J=X, K=0</span>`));
        const t = H("div", { style: "overflow:auto" });
        t.innerHTML = `<table class="data" style="text-align:center;width:auto"><tr><th>present<br>${vars.join("")}</th><th>next<br>${vars.join("")}</th>${sv === 3 ? F.map((f) => `<th>J<sub>${f.k}</sub></th><th>K<sub>${f.k}</sub></th>`).join("") : ""}</tr>` +
          seq.map((s) => `<tr><td class="mono">${bin(s, n)}</td><td class="mono">${bin(next[s], n)}</td>${sv === 3 ? F.map((f) => `<td>${f.Jv[s]}</td><td>${f.Kv[s]}</td>`).join("") : ""}</tr>`).join("") + "</table>";
        out.append(t);
      } else if (sv === 4) {
        const grid = H("div", { style: "display:flex;flex-wrap:wrap;gap:12px" });
        const rb = Math.floor(n / 2), cb = n - rb, gray = (b) => [...Array(1 << b)].map((_, i) => i ^ (i >> 1));
        F.forEach((f) => ["J", "K"].forEach((jk) => {
          const vals = jk === "J" ? f.Jv : f.Kv;
          let h = `<div class="tiny" style="font-weight:700">${jk}<sub>${f.k}</sub></div><table class="data" style="text-align:center;width:auto;font-size:13px"><tr><th style="font-size:11px">${vars.slice(0, rb).join("")}\\${vars.slice(rb).join("")}</th>${gray(cb).map((c) => `<th>${bin(c, cb)}</th>`).join("")}</tr>`;
          gray(rb).forEach((rw) => { h += `<tr><th>${bin(rw, rb)}</th>` + gray(cb).map((c) => { const s = (rw << cb) | c, v = vals[s]; return `<td style="padding:2px 8px;color:${v === "1" ? "var(--hi)" : v === "X" ? "var(--accent)" : "var(--ink-3)"};font-weight:700">${v}</td>`; }).join("") + "</tr>"; });
          grid.append(H("div", null, h + "</table>"));
        }));
        out.append(grid);
      } else if (sv === 5) {
        out.append(H("div", { class: "mono", style: "font-size:17px;line-height:1.9" }, F.map((f) => `J<sub>${f.k}</sub> = ${f.J.html} &nbsp;&nbsp; K<sub>${f.k}</sub> = ${f.K.html}`).join("<br>")));
      } else {
        const t = H("div", { style: "overflow:auto" });
        t.innerHTML = `<table class="data" style="text-align:center;width:auto"><tr><th>สถานะ</th><th>ต้องการ</th><th>วงจรให้</th><th></th></tr>` +
          [...seq, ...unused].map((s) => { const g = nextOf(s), ok = s in next ? g === next[s] : null;
            return `<tr${s in next ? "" : ' style="color:var(--ink-3)"'}><td class="mono">${bin(s, n)}</td><td class="mono">${s in next ? bin(next[s], n) : "(ไม่ใช้)"}</td><td class="mono">${bin(g, n)}</td><td>${ok === null ? (g in next ? "กลับเข้าลำดับ" : "ยังไม่เข้าลำดับ") : ok ? "✓" : "✗"}</td></tr>`; }).join("") + "</table>";
        out.append(t);
      }
      const notes = { 1: "ขั้นที่ 1: เขียนผังสถานะ — วงกลมคือสถานะ ลูกศรคือการเปลี่ยนเมื่อมีขอบนาฬิกา", 2: "ขั้นที่ 2: ตารางสถานะถัดไป (next-state table) — present state แต่ละแถวไปสถานะใดเมื่อมีขอบนาฬิกา",
        3: "ขั้นที่ 3: เทียบแต่ละบิตกับตาราง transition ของ J-K เพื่อหาค่า J, K ที่ต้องการ", 4: "ขั้นที่ 4: บรรจุค่าลงแผนผังคาร์โนห์ (สถานะที่ไม่ใช้ = X) — สีเขียว = 1 · สีส้ม = X",
        5: "ขั้นที่ 5: ลดรูปแผนผังคาร์โนห์ได้นิพจน์ของ J และ K ทุกตัว (ใช้ X ช่วยให้กลุ่มใหญ่ที่สุด) · บางข้ออาจมีคำตอบที่เล็กเท่ากันได้มากกว่าหนึ่งแบบ", 6: "ขั้นที่ 6: ตรวจวงจรที่ได้ — ทุกสถานะในลำดับต้องถูก และดูว่าสถานะที่ไม่ใช้จะกลับเข้าลำดับหรือไม่ (self-correcting)" };
      msg.innerHTML = notes[sv];
    }
    draw();
  };

  /* =====================================================
     4) ชิฟต์รีจิสเตอร์ SISO / SIPO / PISO / PIPO (9.5)
     ===================================================== */
  W.shiftreg = function (el) {
    const st = { mode: el.dataset.mode || "siso", q: [0, 0, 0, 0], data: "1010", pos: 0, par: [1, 0, 1, 1], load: true, log: [], out: [] };
    const body = U.shell(el, "INTERACTIVE", "ชิฟต์รีจิสเตอร์ 4 บิต (รูปที่ 9.23–9.28)",
      "กด “พัลส์นาฬิกา ↑” ทีละครั้ง — บิตข้อมูลเลื่อนจาก FF0 ไปทาง FF3 ทุกขอบนาฬิกา · ข้อมูลอนุกรมป้อนบิตขวาสุดก่อน · PISO ใช้ขา SHIFT/<span class=\"ov\">LOAD</span> เลือกโหลดขนานหรือเลื่อน");
    const ctr = H("div", { class: "controls" });
    const seg = U.seg([["siso", "SISO"], ["sipo", "SIPO"], ["piso", "PISO"], ["pipo", "PIPO"]], st.mode, (v) => { st.mode = v; reset(); });
    ctr.append(seg, U.btn("พัลส์นาฬิกา ↑", () => clock(), "primary"), U.btn("รีเซ็ต", () => reset()));
    const dataIn = U.input("ข้อมูลอนุกรม:", st.data, (s) => { if (/^[01]{1,8}$/.test(s)) { st.data = s; reset(); } }, { width: 90 });
    const loadSeg = U.seg([[true, "LOAD (โหลดขนาน)"], [false, "SHIFT (เลื่อน)"]], st.load, (v) => { st.load = v; draw(); });
    const par = H("div");
    const opts = H("div", { class: "controls" });
    const svg = S("svg", { viewBox: "0 0 720 200", style: "max-width:720px" });
    const tbl = H("div", { class: "sr-log", style: "flex:0 0 auto;max-height:240px;overflow:auto" });
    const msg = H("div", { class: "callout note", style: "flex:1 1 260px;margin:0" });
    const row = H("div", { style: "display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start" }); row.append(tbl, msg);
    body.append(ctr, opts, svg, row);
    function reset() { st.q = [0, 0, 0, 0]; st.pos = 0; st.log = []; st.out = []; st.load = true; loadSeg.set(true); draw(); }
    const serialBit = () => (st.pos < st.data.length ? +st.data[st.data.length - 1 - st.pos] : 0);
    function clock() {
      const m = st.mode;
      let inBit = "–", outBit = "–";
      if (m === "pipo" || (m === "piso" && st.load)) { st.q = st.par.slice(); inBit = "ขนาน"; if (m === "piso") { st.load = false; loadSeg.set(false); } }
      else {
        if (m === "siso" || m === "sipo") { inBit = serialBit(); st.pos++; } else inBit = 0;
        outBit = st.q[3]; st.out.push(outBit);
        st.q = [typeof inBit === "number" ? inBit : 0, st.q[0], st.q[1], st.q[2]];
      }
      st.log.push({ n: st.log.length + 1, inBit, q: st.q.join(""), outBit });
      draw();
    }
    function draw() {
      const m = st.mode, serIn = m === "siso" || m === "sipo", parIn = m === "piso" || m === "pipo", parOut = m === "sipo" || m === "pipo";
      opts.innerHTML = "";
      if (serIn) opts.append(dataIn);
      if (parIn) { par.innerHTML = ""; par.append(U.bitRow(st.par, { labels: ["D₀", "D₁", "D₂", "D₃"], small: true, onToggle: (i) => { st.par[i] ^= 1; draw(); } })); opts.append(H("span", { class: "small" }, "ข้อมูลขนาน:"), par); }
      if (m === "piso") opts.append(loadSeg);
      svg.innerHTML = "";
      const nb = serialBit();
      if (serIn) { txt(svg, 8, 96, st.pos < st.data.length ? `เข้า: ${nb}` : "เข้า: –", { size: 13, c: "var(--accent)" }); S("path", { d: "M70,92 H100", class: nb && st.pos < st.data.length ? "s-wire1" : "s-wire0" }, svg); }
      for (let i = 0; i < 4; i++) {
        const x = 100 + i * 140, v = st.q[i];
        S("rect", { x, y: 56, width: 90, height: 76, rx: 8, class: "s-gate", style: v ? "fill:var(--hi-soft);stroke:var(--hi)" : "" }, svg);
        txt(svg, x + 45, 88, `FF${i}`, { a: "middle", size: 11, w: 400, c: "var(--ink-3)" });
        txt(svg, x + 45, 116, String(v), { a: "middle", size: 24, c: v ? "var(--hi)" : "var(--ink-3)" });
        if (i < 3) S("path", { d: `M${x + 90},92 H${x + 140}`, class: v ? "s-wire1" : "s-wire0" }, svg);
        if (parIn) { S("path", { d: `M${x + 45},24 V56`, class: st.par[i] ? "s-wire1" : "s-wire0" }, svg); txt(svg, x + 52, 20, `D${i}=${st.par[i]}`, { size: 11 }); }
        if (parOut) { S("path", { d: `M${x + 45},132 V166`, class: v ? "s-wire1" : "s-wire0" }, svg); txt(svg, x + 45, 184, `Q${i}=${v}`, { a: "middle", size: 12, c: v ? "var(--hi)" : "var(--ink)" }); }
      }
      { S("path", { d: "M610,92 H650", class: st.q[3] ? "s-wire1" : "s-wire0" }, svg); txt(svg, 656, 96, "ออก", { size: 12 }); }
      txt(svg, 100, 196, "CLK ร่วมกันทุกตัว", { size: 11, w: 400, c: "var(--ink-3)" });
      tbl.innerHTML = `<table class="data" style="text-align:center;font-size:13px"><tr><th>CLK</th><th>เข้า</th><th>Q₀Q₁Q₂Q₃</th><th>ออก</th></tr><tr><td>0</td><td>–</td><td class="mono">0000</td><td>–</td></tr>` +
        st.log.map((r, i) => `<tr${hlRow(i === st.log.length - 1)}><td>${r.n}</td><td>${r.inBit}</td><td class="mono">${r.q}</td><td>${r.outBit}</td></tr>`).join("") + "</table>";
      const k = st.log.length;
      const info = {
        siso: `SISO: เข้าทีละบิต ออกทีละบิต · โหลด 4 บิตต้องใช้ <b>4 พัลส์</b> และอ่านออกอีก 4 พัลส์` + (st.pos >= 4 && st.pos === k && st.data.length === 4 ? ` · ตอนนี้ข้อมูล ${st.data} อยู่ในรีจิสเตอร์ครบแล้ว (Q₀…Q₃ = ${st.q.join("")})` : ""),
        sipo: `SIPO: เข้าทีละบิต แต่<b>อ่านออกพร้อมกัน</b>ทั้ง 4 บิตที่ Q₀–Q₃ หลังครบ 4 พัลส์ — ใช้แปลงข้อมูลอนุกรมเป็นขนาน`,
        piso: `PISO: <span class="ov">LOAD</span> = โหลด D₀–D₃ พร้อมกันใน 1 พัลส์ แล้ว SHIFT เลื่อนออกทีละบิตที่ FF3 — ใช้แปลงข้อมูลขนานเป็นอนุกรม` + (st.out.length ? ` · บิตที่ออกแล้ว: <b class="mono">${st.out.join("")}</b>` : ""),
        pipo: `PIPO: เข้าและออกแบบขนานใน <b>1 พัลส์</b> — ทำงานเหมือนวงจรเก็บข้อมูลแบบขนานในบทที่ 8`,
      };
      msg.innerHTML = info[m] + `<br><span class="muted">ความจุ (storage capability) = 4 บิต · 1 stage = ฟลิปฟลอป 1 ตัว</span>`;
    }
    draw();
  };
})();
