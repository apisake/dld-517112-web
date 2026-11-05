/* =========================================================
   บทที่ 4 — interactive widgets (พีชคณิตบูลีน)
   ใช้ DLD.bool จาก assets/js/boolean.js
   ========================================================= */
(function () {
  const DLD = window.DLD, U = DLD.ui, W = DLD.widgets, BL = DLD.bool;
  const H = (...a) => DLD.h(...a);
  const S = (...a) => DLD.svg(...a);
  const SYNTAX = "พิมพ์ได้: AB = A AND B · A+B = OR · A' หรือ ~A = NOT · (A+B)' = NOT ทั้งวงเล็บ · A^B = XOR";

  function safeParse(s) { try { return { e: BL.parse(s) }; } catch (err) { return { err: err.message }; } }
  function exprBox(html, big) { return `<span class="mono bexpr" style="font-size:${big ? 22 : 17}px;font-weight:700">${html}</span>`; }
  function toggles(vars, env, onChange) {
    const row = H("div", { class: "controls" });
    vars.forEach((v) => {
      const b = H("button", { type: "button", class: "btn sm", "aria-pressed": String(!!env[v]) }, `${v} = ${env[v] ? 1 : 0}`);
      b.addEventListener("click", () => { env[v] = env[v] ? 0 : 1; onChange(); });
      row.appendChild(b);
    });
    return row;
  }
  /* truth table with optional intermediate columns. cols: [{label(html), fn(env)}] */
  function ttHTML(vars, cols, highlight) {
    const rows = BL.combos(vars);
    return `<div class="table-wrap"><table class="data" style="width:100%;text-align:center"><tr>${vars.map((v) => `<th>${v}</th>`).join("")}${cols.map((c) => `<th class="${c.cls || ""}">${c.label}</th>`).join("")}</tr>` +
      rows.map((env) => {
        const cur = highlight && vars.every((v) => (highlight[v] ? 1 : 0) === env[v]);
        return `<tr style="${cur ? "background:var(--brand-soft);font-weight:700" : ""}">${vars.map((v) => `<td class="num">${env[v]}</td>`).join("")}${cols.map((c) => { const o = c.fn(env); return `<td class="num" style="${c.strong ? `color:${o ? "var(--hi)" : "var(--lo)"};font-weight:700` : ""}">${o}</td>`; }).join("")}</tr>`;
      }).join("") + "</table></div>";
  }

  /* =====================================================
     1) Sum term / Product term (4.2)
     ===================================================== */
  W.termeval = function (el) {
    const body = U.shell(el, "INTERACTIVE", "Sum term และ Product term: literal แต่ละตัวมีค่าเท่าไร",
      "เลือกพจน์จากตัวอย่างที่ 4.1–4.2 หรือพิมพ์เอง แล้วกดเปลี่ยนค่าตัวแปร — sum term เป็น 0 เมื่อทุก literal เป็น 0 · product term เป็น 1 เมื่อทุก literal เป็น 1 · " + SYNTAX);
    const st = { src: "A + B' + C + D'", env: { A: 0, B: 1, C: 0, D: 1 } };
    const ctr = H("div", { class: "controls" });
    const inp = U.input("พจน์:", st.src, (s) => { st.src = s; draw(); }, { width: 220 });
    ctr.append(inp);
    [["ตย. 4.1 sum term", "A + B' + C + D'"], ["ตย. 4.2 product term", "AB'CD'"], ["A + B + C'", "A + B + C'"], ["A'BC", "A'BC"]].forEach(([t, v]) => ctr.appendChild(U.btn(t, () => { inp.input.value = st.src = v; draw(); })));
    const tg = H("div"), out = H("div");
    body.append(ctr, tg, out);
    function draw() {
      const p = safeParse(st.src);
      inp.input.classList.toggle("bad", !!p.err);
      if (p.err) { out.innerHTML = `<div class="callout warn">${p.err}</div>`; tg.innerHTML = ""; return; }
      const e = p.e, vars = BL.vars(e);
      vars.forEach((v) => (st.env[v] = st.env[v] ? 1 : 0));
      tg.innerHTML = ""; tg.appendChild(toggles(vars, st.env, draw));
      const isSum = e.t === "or", isProd = e.t === "and";
      const lits = isSum || isProd ? e.a : [e];
      const ok = lits.every((l) => l.t === "var" || (l.t === "not" && l.a.t === "var"));
      const val = BL.eval(e, st.env);
      const cells = lits.map((l) => `<div style="text-align:center;padding:6px 10px;border-radius:10px;border:1.5px solid ${BL.eval(l, st.env) ? "var(--hi)" : "var(--line)"};background:${BL.eval(l, st.env) ? "var(--hi-soft)" : "var(--surface-2)"}"><div class="mono" style="font-size:20px;font-weight:700">${BL.html(l)}</div><div class="mono" style="font-size:13px">${l.t === "not" ? `${l.a.n}=${st.env[l.a.n]} → ` : ""}${BL.eval(l, st.env)}</div></div>`);
      const join = isSum ? "+" : isProd ? "·" : "";
      out.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0">${cells.join(`<b class="mono" style="font-size:22px;color:var(--ink-3)">${join}</b>`)}<b class="mono" style="font-size:22px">= <span style="color:${val ? "var(--hi)" : "var(--accent)"}">${val}</span></b></div>` +
        `<div class="callout ${ok ? "note" : "warn"}" style="margin:6px 0 0">` +
        (!ok ? "นิพจน์นี้ไม่ใช่ sum term หรือ product term ล้วน (มีทั้ง AND และ OR หรือมี complement ของกลุ่ม)" :
          isSum ? `<b>Sum term</b> (ผลรวมของ literal = OR) มีค่า 0 กรณีเดียว: ${lits.map((l) => (l.t === "not" ? `${l.a.n} = 1` : `${l.n} = 0`)).join(", ")}` :
          isProd ? `<b>Product term</b> (ผลคูณของ literal = AND) มีค่า 1 กรณีเดียว: ${lits.map((l) => (l.t === "not" ? `${l.a.n} = 0` : `${l.n} = 1`)).join(", ")}` :
          "literal เดี่ยว") + `<br><small>literal = ตัวแปรหรือ complement ของตัวแปร · พจน์นี้มี ${lits.length} literal</small></div>`;
    }
    draw();
  };

  /* =====================================================
     2) ตรวจความเท่ากันของสองนิพจน์ (กฎ 4.3.1)
     ===================================================== */
  W.lawcheck = function (el) {
    const body = U.shell(el, "INTERACTIVE", "พิสูจน์ความเท่ากันด้วยตารางค่าความจริง",
      "เลือกกฎ หรือพิมพ์นิพจน์ฝั่งซ้ายและขวาเอง — ถ้าคอลัมน์ผลลัพธ์เท่ากันทุกแถว นิพจน์ทั้งสองเทียบเท่ากัน · " + SYNTAX);
    const st = { l: "A(B + C)", r: "AB + AC" };
    const ctr = H("div", { class: "controls" });
    const il = U.input("ซ้าย:", st.l, (s) => { st.l = s; draw(); }, { width: 200 });
    const ir = U.input("ขวา:", st.r, (s) => { st.r = s; draw(); }, { width: 200 });
    ctr.append(il, H("b", { style: "font-size:22px" }, "="), ir);
    const pre = H("div", { class: "controls" });
    pre.appendChild(H("span", { class: "w-hint", style: "margin:0" }, "กฎ:"));
    [["สลับที่ (+) สมการ 4.1", "A + B", "B + A"], ["สลับที่ (·) 4.2", "AB", "BA"], ["เปลี่ยนกลุ่ม (+) 4.3", "A + (B + C)", "(A + B) + C"], ["เปลี่ยนกลุ่ม (·) 4.4", "A(BC)", "(AB)C"], ["กระจาย 4.5", "A(B + C)", "AB + AC"], ["⚠️ ลองข้อผิด", "A + BC", "(A + B)C"]].forEach(([t, l, r]) =>
      pre.appendChild(U.btn(t, () => { il.input.value = st.l = l; ir.input.value = st.r = r; draw(); })));
    const out = H("div");
    body.append(ctr, pre, out);
    function draw() {
      const L = safeParse(st.l), R = safeParse(st.r);
      il.input.classList.toggle("bad", !!L.err); ir.input.classList.toggle("bad", !!R.err);
      if (L.err || R.err) { out.innerHTML = `<div class="callout warn">${L.err || R.err}</div>`; return; }
      const vars = [...new Set([...BL.vars(L.e), ...BL.vars(R.e)])].sort();
      if (vars.length > 5) { out.innerHTML = '<div class="callout warn">ใช้ตัวแปรได้ไม่เกิน 5 ตัว</div>'; return; }
      const eq = BL.equivalent(L.e, R.e);
      const mids = [...BL.subterms(L.e), ...BL.subterms(R.e)].filter((x) => BL.text(x) !== BL.text(L.e) && BL.text(x) !== BL.text(R.e)).slice(0, 4);
      const cols = mids.map((m) => ({ label: BL.html(m), fn: (env) => BL.eval(m, env) }))
        .concat([{ label: BL.html(L.e), fn: (env) => BL.eval(L.e, env), strong: true }, { label: BL.html(R.e), fn: (env) => BL.eval(R.e, env), strong: true }]);
      const diff = BL.combos(vars).filter((env) => BL.eval(L.e, env) !== BL.eval(R.e, env)).length;
      out.innerHTML = ttHTML(vars, cols) + `<div class="callout ${eq ? "tip" : "warn"}" style="margin-top:10px">${exprBox(BL.html(L.e), 1)} ${eq ? "=" : "≠"} ${exprBox(BL.html(R.e), 1)}<br>` +
        (eq ? `✓ เท่ากันทุก ${1 << vars.length} แถว (equal)` : `✗ ต่างกัน ${diff} แถวจาก ${1 << vars.length} แถว — ไม่เทียบเท่ากัน`) + "</div>";
    }
    draw();
  };

  /* =====================================================
     3) หลักเกณฑ์ 12 ข้อ (ตารางที่ 4.1)
     ===================================================== */
  const RULES = [
    ["A + 0", "A", "ตัวแปร OR กับ 0 ได้ตัวแปรนั้น", "OR", ["A", "0"]],
    ["A + 1", "1", "ตัวแปร OR กับ 1 ได้ 1 เสมอ", "OR", ["A", "1"]],
    ["A · 0", "0", "ตัวแปร AND กับ 0 ได้ 0 เสมอ", "AND", ["A", "0"]],
    ["A · 1", "A", "ตัวแปร AND กับ 1 ได้ตัวแปรนั้น", "AND", ["A", "1"]],
    ["A + A", "A", "OR กับตัวเองได้ตัวเอง", "OR", ["A", "A"]],
    ["A + A'", "1", "OR กับ complement ของตัวเองได้ 1", "OR", ["A", "A'"]],
    ["A · A", "A", "AND กับตัวเองได้ตัวเอง", "AND", ["A", "A"]],
    ["A · A'", "0", "AND กับ complement ของตัวเองได้ 0", "AND", ["A", "A'"]],
    ["A''", "A", "complement สองชั้นได้ค่าเดิม", "NOT2", ["A"]],
    ["A + AB", "A", "พิสูจน์: A(1 + B) = A · 1 = A", null],
    ["A + A'B", "A + B", "พิสูจน์ด้วยข้อ 10, 7, 8, 6, 4", null],
    ["(A + B)(A + C)", "A + BC", "พิสูจน์ด้วยกฎการกระจายและข้อ 7, 2, 4", null],
  ];
  /* แสดงหลักเกณฑ์ตามที่เขียนในเล่ม (คงเครื่องหมาย · ไว้) */
  const asBook = (t) => t.replace(/A''/g, '<span class="ov"><span class="ov">A</span></span>').replace(/([A-Z])'/g, '<span class="ov">$1</span>');
  W.rules12 = function (el) {
    const body = U.shell(el, "INTERACTIVE", "หลักเกณฑ์พื้นฐาน 12 ข้อของพีชคณิตบูลีน",
      "เลือกหลักเกณฑ์ แล้วกดเปลี่ยนค่าตัวแปร — ข้อ 1–9 แสดงด้วยเกทหนึ่งตัวที่มีอินพุตคงที่ (รูปที่ 4.6–4.14) · ข้อ 10–12 แสดงด้วยตารางค่าความจริงพร้อมคอลัมน์ระหว่างทาง");
    const st = { k: 9, env: { A: 1, B: 0, C: 1 } };
    const grid = H("div", { style: "display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;margin-bottom:12px" });
    const area = H("div");
    body.append(grid, area);
    function draw() {
      grid.innerHTML = "";
      RULES.forEach((r, i) => {
        const b = H("button", { type: "button", class: "btn sm", "aria-pressed": String(i === st.k), style: "justify-content:center;flex-direction:column;gap:0;padding:6px 4px" },
          `<small style="color:var(--accent);font-weight:700">ข้อ ${i + 1}</small><span class="mono" style="font-size:13px">${asBook(r[0])} = ${asBook(r[1])}</span>`);
        b.addEventListener("click", () => { st.k = i; draw(); });
        grid.appendChild(b);
      });
      const [l, r, why, gate, ins] = RULES[st.k];
      const L = BL.parse(l), R = BL.parse(r), vars = [...new Set([...BL.vars(L), ...BL.vars(R)])].sort();
      area.innerHTML = "";
      area.appendChild(H("div", { class: "callout note", style: "margin:0 0 10px" }, `<b style="color:var(--accent)">หลักเกณฑ์ข้อที่ ${st.k + 1}</b> &nbsp; ${exprBox(asBook(l) + " = " + asBook(r), 1)}<br>${why}`));
      area.appendChild(toggles(vars, st.env, draw));
      if (gate) {
        const svg = S("svg", { viewBox: "0 0 620 170" });
        const g = S("g", null, svg), wires = S("g", null, svg);
        svg.insertBefore(wires, g);
        const A = st.env.A ? 1 : 0;
        const out = BL.eval(L, st.env);
        if (gate === "NOT2") {
          const g1 = DLD.drawGate(g, "NOT", 170, 85, 1), g2 = DLD.drawGate(g, "NOT", 330, 85, 1);
          S("path", { d: `M90,85 H${g1.inputs[0].x}`, class: A ? "s-wire1" : "s-wire0" }, wires);
          S("path", { d: `M${g1.output.x},85 H${g2.inputs[0].x}`, class: A ? "s-wire0" : "s-wire1" }, wires);
          S("path", { d: `M${g2.output.x},85 H520`, class: out ? "s-wire1" : "s-wire0" }, wires);
          S("text", { x: g1.output.x + 18, y: 74, class: "s-mono", style: "font-weight:700", text: "A' = " + (1 - A) }, svg);
        } else {
          const geo = DLD.drawGate(g, gate, 250, 85, 2);
          ins.forEach((src, i) => {
            const v = BL.eval(BL.parse(src), st.env), p = geo.inputs[i];
            const y = i ? 130 : 40;
            S("path", { d: `M120,${y} H190 L${p.x - 14},${p.y} H${p.x}`, class: v ? "s-wire1" : "s-wire0" }, wires);
            S("text", { x: 40, y: y + 5, class: "s-mono", style: `font-size:15px;font-weight:700;fill:${/^[01]$/.test(src) ? "var(--accent)" : "var(--ink)"}`, text: (/^[01]$/.test(src) ? "ค่าคงที่ " : "") + src.replace("A'", "A' (NOT A)") + " = " + v }, svg);
          });
          S("path", { d: `M${geo.output.x},85 H520`, class: out ? "s-wire1" : "s-wire0" }, wires);
        }
        S("circle", { cx: 545, cy: 85, r: 18, fill: out ? "var(--hi)" : "var(--surface-2)", stroke: "var(--ink-3)", "stroke-width": 2 }, svg);
        S("text", { x: 545, y: 125, "text-anchor": "middle", class: "s-mono", style: "font-weight:700", text: "X = " + out }, svg);
        area.appendChild(svg);
        area.insertAdjacentHTML("beforeend", ttHTML(vars, [{ label: BL.html(L), fn: (env) => BL.eval(L, env), strong: true }, { label: BL.html(R), fn: (env) => BL.eval(R, env) }], st.env));
      } else {
        const mids = BL.subterms(L).filter((x) => BL.text(x) !== BL.text(L));
        const midsR = BL.subterms(R).filter((x) => BL.text(x) !== BL.text(R) && !mids.some((m) => BL.text(m) === BL.text(x)));
        const cols = mids.concat(midsR).map((m) => ({ label: BL.html(m), fn: (env) => BL.eval(m, env) }))
          .concat([{ label: BL.html(L), fn: (env) => BL.eval(L, env), strong: true }, { label: BL.html(R), fn: (env) => BL.eval(R, env), strong: true }]);
        area.insertAdjacentHTML("beforeend", ttHTML(vars, cols, st.env) + `<p class="w-hint" style="margin-top:6px">คอลัมน์ ${BL.html(L)} และ ${BL.html(R)} เท่ากันทุกแถว (equal) → วงจรฝั่งซ้ายลดรูปเป็นฝั่งขวาได้ (ตารางที่ ${["4.2", "4.3", "4.4"][st.k - 9]})</p>`);
      }
    }
    draw();
  };

  /* =====================================================
     4) ทฤษฎีบทของ DeMorgan ทีละขั้น (4.4, 4.4.1)
     ===================================================== */
  W.demorgan = function (el) {
    const body = U.shell(el, "STEP-BY-STEP", "ทลายเส้น bar ด้วยทฤษฎีบทของ DeMorgan ทีละขั้น",
      "เลือกนิพจน์จากตัวอย่างในเล่มหรือพิมพ์เอง แล้วกด “ขั้นถัดไป” — ระบบจะใช้ DeMorgan หรือหลักเกณฑ์ข้อที่ 9 กับเส้น bar ที่อยู่นอกสุดก่อน และตรวจว่าทุกขั้นยังเทียบเท่ากับนิพจน์เดิม · " + SYNTAX);
    const st = { src: "(XY)'", shown: 0 };
    const ctr = H("div", { class: "controls" });
    const inp = U.input("นิพจน์:", st.src, (s) => { st.src = s; st.shown = 0; draw(); }, { width: 260 });
    ctr.append(inp, U.btn("ขั้นถัดไป ▶", () => { st.shown++; draw(); }, "primary"), U.btn("แสดงทั้งหมด", () => { st.shown = 99; draw(); }), U.btn("เริ่มใหม่", () => { st.shown = 0; draw(); }));
    const pre = H("div", { class: "controls" });
    pre.appendChild(H("span", { class: "w-hint", style: "margin:0" }, "ตัวอย่าง:"));
    [["สมการ 4.6", "(XY)'"], ["สมการ 4.7", "(X+Y)'"], ["ตย. 4.3", "(XYZ)'"], ["ตย. 4.4", "(W+X+Y+Z)'"], ["4.4 (หลายชั้น)", "((AB+C)(A+BC))'"], ["4.4.1", "((A+BC')' + D(E+F')')'"], ["ตย. 4.5 (I)", "((A+B+C)D)'"], ["ตย. 4.5 (II)", "(ABC+DEF)'"], ["ตย. 4.5 (III)", "(AB'+C'D+EF)'"], ["ตย. 4.6 (II)", "((A'+B) + CD)'"], ["ตย. 4.7 XOR→XNOR", "(AB'+A'B)'"]].forEach(([t, v]) =>
      pre.appendChild(U.btn(t, () => { inp.input.value = st.src = v; st.shown = 0; draw(); })));
    const out = H("div");
    body.append(ctr, pre, out);
    function draw() {
      const p = safeParse(st.src);
      inp.input.classList.toggle("bad", !!p.err);
      if (p.err) { out.innerHTML = `<div class="callout warn">${p.err}</div>`; return; }
      const steps = BL.steps(p.e);
      const n = Math.min(st.shown, steps.length);
      let h = `<div class="card" style="padding:12px 16px"><div style="display:grid;grid-template-columns:auto 1fr;gap:8px 16px;align-items:baseline">` +
        `<span class="w-hint" style="margin:0">เริ่ม</span>${exprBox(BL.html(BL.flatten(p.e)), 1)}`;
      for (let k = 0; k < n; k++) {
        const ok = BL.equivalent(p.e, steps[k].e);
        h += `<span class="mono" style="color:var(--accent);font-weight:700">ขั้น ${k + 1}</span><div>${exprBox("= " + BL.html(steps[k].e), 1)}<div class="w-hint" style="margin:2px 0 0">${steps[k].rule} ${ok ? "✓" : "✗"}</div></div>`;
      }
      h += "</div></div>";
      const done = n >= steps.length;
      h += `<div class="callout ${done ? "tip" : "note"}" style="margin-top:10px">${!steps.length ? "นิพจน์นี้ไม่มีเส้น bar คร่อมกลุ่ม — ไม่ต้องใช้ DeMorgan" : done ? `เสร็จใน ${steps.length} ขั้น · ผลลัพธ์: ${exprBox(BL.html(steps[steps.length - 1].e), 1)} — เส้น bar เหลือเฉพาะบนตัวแปรเดี่ยว` : `กด “ขั้นถัดไป” (${n}/${steps.length})`}` +
        `<br><small>หลักจำ: <b>ทลายเส้น bar แล้วเปลี่ยนเครื่องหมาย</b> (· ↔ +) · bar ซ้อนสองชั้นหักล้างกัน</small></div>`;
      out.innerHTML = h;
    }
    draw();
  };

  /* =====================================================
     5) วงจรในรูปที่ 4.16 → นิพจน์ A(B + CD)
     ===================================================== */
  W.circuit416 = function (el) {
    const body = U.shell(el, "INTERACTIVE", "จากวงจรสู่นิพจน์บูลีน: เขียนนิพจน์ทีละเกทจากซ้ายไปขวา",
      "วงจรในรูปที่ 4.16 · กด “เกทถัดไป” เพื่อเขียนนิพจน์ของแต่ละเกท แล้วกดเปลี่ยนค่าอินพุตเพื่อดูค่าบนทุกเส้นสัญญาณ");
    const st = { stage: 0, env: { A: 1, B: 0, C: 1, D: 1 } };
    const ctr = H("div", { class: "controls" });
    ctr.append(U.btn("เกทถัดไป ▶", () => { st.stage = Math.min(3, st.stage + 1); draw(); }, "primary"), U.btn("เริ่มใหม่", () => { st.stage = 0; draw(); }));
    const tg = H("div");
    const svg = S("svg", { viewBox: "0 0 760 260" });
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, tg, svg, msg);
    function draw() {
      tg.innerHTML = ""; tg.appendChild(toggles(["A", "B", "C", "D"], st.env, draw));
      svg.innerHTML = "";
      const { A, B, C, D } = st.env, cd = C & D, bcd = B | cd, x = A & bcd;
      const wires = S("g", null, svg), g = S("g", null, svg);
      const g1 = DLD.drawGate(g, "AND", 170, 190, 2);
      const g2 = DLD.drawGate(g, "OR", 360, 140, 2);
      const g3 = DLD.drawGate(g, "AND", 560, 90, 2);
      const w = (d, v) => S("path", { d, class: v ? "s-wire1" : "s-wire0" }, wires);
      const lab = (x0, y, t) => S("text", { x: x0, y, class: "s-mono", style: "font-size:15px;font-weight:700;fill:var(--ink)", text: t }, svg);
      lab(20, g1.inputs[0].y + 5, "C=" + C); w(`M70,${g1.inputs[0].y} H${g1.inputs[0].x}`, C);
      lab(20, g1.inputs[1].y + 5, "D=" + D); w(`M70,${g1.inputs[1].y} H${g1.inputs[1].x}`, D);
      lab(20, g2.inputs[0].y + 5, "B=" + B); w(`M70,${g2.inputs[0].y} H${g2.inputs[0].x}`, B);
      lab(20, g3.inputs[0].y + 5, "A=" + A); w(`M70,${g3.inputs[0].y} H${g3.inputs[0].x}`, A);
      w(`M${g1.output.x},190 H${g1.output.x + 20} V${g2.inputs[1].y} H${g2.inputs[1].x}`, cd);
      w(`M${g2.output.x},140 H${g2.output.x + 20} V${g3.inputs[1].y} H${g3.inputs[1].x}`, bcd);
      w(`M${g3.output.x},90 H720`, x);
      const tag = (x0, y, t, v, show) => { if (!show) return; S("rect", { x: x0 - 4, y: y - 18, width: t.length * 9 + 40, height: 24, rx: 6, fill: "var(--accent-soft)" }, svg); S("text", { x: x0, y, class: "s-mono", style: "font-size:14px;font-weight:700;fill:var(--accent)", text: `${t} = ${v}` }, svg); };
      tag(g1.output.x + 26, 205, "CD", cd, st.stage >= 1);
      tag(g2.output.x + 26, 160, "B + CD", bcd, st.stage >= 2);
      tag(g3.output.x + 10, 70, "A(B + CD)", x, st.stage >= 3);
      S("circle", { cx: 735, cy: 90, r: 14, fill: x ? "var(--hi)" : "var(--surface-2)", stroke: "var(--ink-3)", "stroke-width": 2 }, svg);
      msg.innerHTML = ["เริ่มจากเกทที่อยู่ซ้ายมือสุด (ใกล้อินพุตที่สุด)",
        "① AND gate ซ้ายสุด อินพุต C และ D → <b class='mono'>CD</b>",
        "② OR gate อินพุต B และ CD → <b class='mono'>B + CD</b>",
        "③ AND gate ขวาสุด อินพุต A และ B + CD → <b class='mono'>A(B + CD)</b> = นิพจน์ของทั้งวงจร"][st.stage] +
        `<br><small>ตอนนี้: A = ${A}, B = ${B}, C = ${C}, D = ${D} → X = ${x} ${x ? (A && B ? "(เข้าเงื่อนไข ① A = 1 และ B = 1)" : "(เข้าเงื่อนไข ② A = 1 และ C = D = 1)") : ""}</small>`;
    }
    draw();
  };

  /* =====================================================
     6) สร้างตารางค่าความจริงจากนิพจน์ (4.5.2)
     ===================================================== */
  W.truthtable = function (el) {
    const body = U.shell(el, "INTERACTIVE", "สร้างตารางค่าความจริงจากนิพจน์บูลีน",
      "พิมพ์นิพจน์ (ไม่เกิน 5 ตัวแปร) ระบบจะสร้างทุกกรณี 2ⁿ แถวพร้อมคอลัมน์ระหว่างทาง · เปิดโหมด “ลองเติมเอง” แล้วคลิกช่องเอาต์พุตเพื่อเติม 0/1 ก่อนตรวจคำตอบ · " + SYNTAX);
    const st = { src: "A(B + CD)", guess: false, user: {}, check: false, mids: true };
    const ctr = H("div", { class: "controls" });
    const inp = U.input("นิพจน์:", st.src, (s) => { st.src = s; st.user = {}; st.check = false; draw(); }, { width: 240 });
    const gb = U.btn("✏️ ลองเติมเอง", () => { st.guess = !st.guess; st.user = {}; st.check = false; gb.setAttribute("aria-pressed", st.guess); draw(); });
    const cb = U.btn("ตรวจคำตอบ", () => { st.check = true; draw(); }, "primary");
    const mb = U.btn("ซ่อนคอลัมน์ระหว่างทาง", () => { st.mids = !st.mids; mb.textContent = st.mids ? "ซ่อนคอลัมน์ระหว่างทาง" : "แสดงคอลัมน์ระหว่างทาง"; draw(); });
    ctr.append(inp, gb, cb, mb);
    const pre = H("div", { class: "controls" });
    [["รูปที่ 4.16", "A(B + CD)"], ["XOR", "AB' + A'B"], ["XNOR", "A'B' + AB"], ["ข้อ 12", "(A + B)(A + C)"], ["(A + B)'C", "(A + B)'C"]].forEach(([t, v]) => pre.appendChild(U.btn(t, () => { inp.input.value = st.src = v; st.user = {}; st.check = false; draw(); })));
    const out = H("div");
    body.append(ctr, pre, out);
    function draw() {
      cb.style.display = st.guess ? "" : "none";
      const p = safeParse(st.src);
      inp.input.classList.toggle("bad", !!p.err);
      if (p.err) { out.innerHTML = `<div class="callout warn">${p.err}</div>`; return; }
      const e = p.e, vars = BL.vars(e);
      if (vars.length > 5) { out.innerHTML = '<div class="callout warn">ใช้ตัวแปรได้ไม่เกิน 5 ตัว</div>'; return; }
      const mids = st.mids ? BL.subterms(e).filter((x) => BL.text(x) !== BL.text(e)) : [];
      const rows = BL.combos(vars);
      let wrong = 0;
      const t = H("table", { class: "data", style: "width:100%;text-align:center" });
      t.innerHTML = `<tr>${vars.map((v) => `<th>${v}</th>`).join("")}${mids.map((m) => `<th style="background:var(--surface-2);color:var(--ink-2)">${BL.html(m)}</th>`).join("")}<th>${BL.html(e)}</th></tr>` +
        rows.map((env, ri) => {
          const o = BL.eval(e, env);
          let cell;
          if (st.guess) {
            const u = st.user[ri];
            const bad = st.check && u !== o;
            if (bad) wrong++;
            cell = `<td data-r="${ri}" class="num" style="cursor:pointer;font-weight:700;${bad ? "background:var(--bad-soft);color:var(--bad)" : st.check ? "background:var(--hi-soft)" : "background:var(--warn-soft)"}">${u === undefined ? "?" : u}</td>`;
          } else cell = `<td class="num" style="font-weight:700;color:${o ? "var(--hi)" : "var(--lo)"};${o ? "background:var(--hi-soft)" : ""}">${o}</td>`;
          return `<tr>${vars.map((v) => `<td class="num">${env[v]}</td>`).join("")}${mids.map((m) => `<td class="num" style="color:var(--ink-3)">${st.guess && !st.check ? "" : BL.eval(m, env)}</td>`).join("")}${cell}</tr>`;
        }).join("");
      out.innerHTML = '<div class="table-wrap"></div>';
      out.firstChild.appendChild(t);
      t.querySelectorAll("td[data-r]").forEach((td) => td.addEventListener("click", () => { const r = +td.dataset.r; st.user[r] = st.user[r] === 1 ? 0 : 1; st.check = false; draw(); }));
      const ones = rows.filter((env) => BL.eval(e, env)).length;
      out.insertAdjacentHTML("beforeend", `<div class="callout ${st.check ? (wrong ? "warn" : "tip") : "note"}" style="margin-top:10px">${vars.length} ตัวแปร → 2<sup>${vars.length}</sup> = ${rows.length} กรณี · เอาต์พุตเป็น 1 จำนวน ${st.guess && !st.check ? "?" : ones} แถว` +
        (st.check ? `<br>${wrong ? `❌ ผิด ${wrong} แถว (สีแดง)` : "✅ ถูกต้องทุกแถว!"}` : "") + "</div>");
    }
    draw();
  };
})();
