/* =========================================================
   บทที่ 2 — interactive widgets (ระบบตัวเลข การคำนวณ และรหัส)
   ใช้ DLD.num และ DLD.ui จาก assets/js/numbers.js
   ========================================================= */
(function () {
  const DLD = window.DLD, N = DLD.num, U = DLD.ui, W = DLD.widgets;
  const H = (...a) => DLD.h(...a);
  const S = (...a) => DLD.svg(...a);
  const pow2 = (e) => (e >= 0 ? String(2 ** e) : String(2 ** e));
  const supE = (b, e) => `${b}<sup>${N.sup(e)}</sup>`;

  /* column-arithmetic grid. rows: [{label, cells:[...], cls: fn(i)|string}] */
  function colGrid(width, rows) {
    const g = H("div", { class: "colcalc", style: `grid-template-columns:auto repeat(${width}, 26px)` });
    rows.forEach((r) => {
      g.appendChild(H("span", { class: "lbl" }, r.label || ""));
      for (let i = 0; i < width; i++) {
        const v = r.cells[i] == null ? "" : r.cells[i];
        const c = typeof r.cls === "function" ? r.cls(i) : r.cls || "";
        g.appendChild(H("span", { class: c }, String(v)));
      }
    });
    return g;
  }
  const padL = (arr, w, fill) => Array(Math.max(0, w - arr.length)).fill(fill == null ? "" : fill).concat(arr);
  const cleanBin = (s) => String(s).replace(/[^01]/g, "");

  /* =====================================================
     1) ค่าน้ำหนักของบิต · ไบนารี ⇄ ฐานสิบ (2.2)
     ===================================================== */
  W.bitweights = function (el) {
    const body = U.shell(el, "INTERACTIVE", "ค่าน้ำหนักประจำบิต: ไบนารี → ฐานสิบ",
      "คลิกที่บิตเพื่อสลับ 0/1 — ค่าฐานสิบคือผลรวมค่าน้ำหนักของบิตที่เป็น 1 · ปุ่ม +1 ใช้ดูรูปแบบการนับแบบไบนารี (ตารางที่ 2.1)");
    const st = { I: 8, F: 4, frac: true, bits: N.bits(89, 8).concat([0, 0, 0, 0]) };
    const ctr = H("div", { class: "controls" });
    const fracBtn = U.btn("ซ่อนบิตเศษส่วน", () => { st.frac = !st.frac; fracBtn.textContent = st.frac ? "ซ่อนบิตเศษส่วน" : "แสดงบิตเศษส่วน"; if (!st.frac) st.bits.fill(0, st.I); draw(); });
    const val = () => st.bits.reduce((a, b, i) => a + b * 2 ** (st.I - 1 - i), 0);
    const setInt = (v) => { const f = st.bits.slice(st.I); st.bits = N.bits(((v % 256) + 256) % 256, st.I).concat(f); draw(); };
    const dec = U.input("ป้อนเลขฐานสิบ:", "89", (s) => {
      const v = parseFloat(s);
      const ok = isFinite(v) && v >= 0 && v < 256;
      dec.input.classList.toggle("bad", !ok);
      if (!ok) return;
      const ip = Math.floor(v); let f = v - ip; const fb = [];
      for (let k = 0; k < st.F; k++) { f *= 2; fb.push(f >= 1 ? 1 : 0); if (f >= 1) f -= 1; }
      st.bits = N.bits(ip, st.I).concat(fb); if (fb.some(Boolean)) st.frac = true; draw(true);
    }, { width: 110 });
    ctr.append(U.btn("−1", () => setInt(Math.floor(val()) - 1)), U.btn("+1", () => setInt(Math.floor(val()) + 1)), U.btn("ล้างเป็น 0", () => { st.bits.fill(0); draw(); }), fracBtn, dec);
    const rowBox = H("div", { style: "overflow-x:auto;padding:4px 0" });
    const out = H("div", { class: "callout tip", style: "margin-bottom:0" });
    body.append(rowBox, ctr, out);
    function draw(fromInput) {
      const n = st.I + (st.frac ? st.F : 0);
      const bits = st.bits.slice(0, n);
      const labels = bits.map((_, i) => "2" + toSup(st.I - 1 - i));
      const subs = bits.map((_, i) => { const e = st.I - 1 - i; return e >= 0 ? String(2 ** e) : String(2 ** e).replace(/^0/, ""); });
      const row = U.bitRow(bits, { labels, sub: subs, onToggle: (i) => { st.bits[i] ^= 1; draw(); }, cls: (i) => (i === st.I ? "gap" : "") });
      if (st.frac) row.insertBefore(H("span", { class: "dot" }, "."), row.children[st.I]);
      rowBox.innerHTML = ""; rowBox.appendChild(row);
      const terms = [];
      bits.forEach((b, i) => { if (b) terms.push(st.I - 1 - i); });
      const v = val();
      const s = N.str(bits.slice(0, st.I)).replace(/^0+(?=\d)/, "") + (st.frac ? "." + N.str(bits.slice(st.I)) : "");
      out.innerHTML = `<b class="mono">${s}<sub>2</sub></b> = ${terms.length ? terms.map((e) => supE(2, e)).join(" + ") : "0"}<br>` +
        `= ${terms.length ? terms.map((e) => fmtW(2 ** e)).join(" + ") : "0"} = <b class="mono" style="color:var(--accent);font-size:1.15em">${fmtW(v)}<sub>10</sub></b>` +
        `<br><small style="color:var(--ink-2)">ส่วนจำนวนเต็ม ${st.I} บิต นับได้ 0 ถึง 2<sup>${st.I}</sup> − 1 = ${2 ** st.I - 1}</small>`;
      if (!fromInput) { dec.input.value = fmtW(v); dec.input.classList.remove("bad"); }
    }
    const toSup = (e) => String(e).split("").map((c) => ({ "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" }[c])).join("");
    const fmtW = (x) => String(+x.toFixed(6));
    draw();
  };

  /* =====================================================
     2) ฐานสิบ → ไบนารี: หารด้วย 2 / คูณด้วย 2 แบบวนซ้ำ (2.3)
     ===================================================== */
  W.dec2bin = function (el) {
    const body = U.shell(el, "STEP-BY-STEP", "แปลงฐานสิบเป็นไบนารี: หารด้วย 2 และคูณด้วย 2 แบบวนซ้ำ",
      "ป้อนเลขฐานสิบ (มีทศนิยมได้ เช่น 14, 53, 0.3125, 23.75) แล้วกด “ขั้นถัดไป” เพื่อดูทีละขั้น — ส่วนจำนวนเต็มอ่านเศษจากล่างขึ้นบน ส่วนเศษส่วนอ่านบิตจากบนลงล่าง");
    const st = { v: "14", shown: 0, steps: [] };
    const ctr = H("div", { class: "controls" });
    const inp = U.input("เลขฐานสิบ:", st.v, (s) => { st.v = s; st.shown = 0; draw(); }, { width: 120 });
    ctr.append(inp, U.btn("ขั้นถัดไป ▶", () => { st.shown = Math.min(st.shown + 1, st.total); draw(); }, "primary"), U.btn("แสดงทั้งหมด", () => { st.shown = st.total; draw(); }), U.btn("เริ่มใหม่", () => { st.shown = 0; draw(); }));
    const ex = H("div", { class: "controls" });
    ["14", "17", "53", "0.3125", "0.625", "23.75", "0.1"].forEach((x) => ex.appendChild(U.btn(x, () => { inp.input.value = x; st.v = x; st.shown = 0; draw(); })));
    ex.prepend(H("span", { class: "w-hint", style: "margin:0" }, "ตัวอย่าง:"));
    const grid = H("div", { class: "wgrid" });
    const res = H("div", { class: "callout tip", style: "margin-bottom:0" });
    body.append(ctr, ex, grid, res);
    function draw() {
      const v = parseFloat(st.v);
      const ok = /^\s*\d+(\.\d+)?\s*$/.test(st.v) && v < 1e9;
      inp.input.classList.toggle("bad", !ok);
      grid.innerHTML = ""; if (!ok) { res.innerHTML = "ป้อนเลขฐานสิบที่ไม่ติดลบ"; return; }
      const ip = Math.floor(v);
      const fracStr = (st.v.split(".")[1] || "");
      // exact fraction via integer arithmetic: f = num / den
      let den = 10 ** fracStr.length, num = fracStr ? parseInt(fracStr, 10) : 0;
      const divs = []; let q = ip;
      if (ip === 0) divs.push([0, 0, 0]);
      while (q > 0) { divs.push([q, Math.floor(q / 2), q % 2]); q = Math.floor(q / 2); }
      const muls = []; const seen = new Set(); let repeat = false;
      while (num > 0 && muls.length < 12) {
        if (seen.has(num)) repeat = true;
        seen.add(num);
        const p = num * 2; const bit = p >= den ? 1 : 0;
        muls.push([num / den, p / den, bit]);
        num = p - bit * den;
      }
      const trunc = num > 0;
      st.total = divs.length + muls.length;
      let k = 0;
      // integer part
      const t1 = H("div");
      t1.innerHTML = `<b>ส่วนจำนวนเต็ม ${ip}</b> — หารด้วย 2 แบบวนซ้ำ`;
      const tb = H("table", { class: "data steps-tbl", style: "margin-top:6px" });
      tb.innerHTML = "<tr><th>ตัวตั้ง ÷ 2</th><th>ผลหาร</th><th>เศษ</th></tr>" + divs.map((d, i) => {
        const vis = k++ < st.shown;
        return `<tr class="${vis ? "" : "hide"}"><td>${d[0]} ÷ 2</td><td>${d[1]}</td><td class="r">${d[2]}${i === 0 ? " ← LSB" : i === divs.length - 1 ? " ← MSB" : ""}</td></tr>`;
      }).join("");
      t1.appendChild(tb);
      grid.appendChild(t1);
      if (muls.length) {
        const t2 = H("div");
        t2.innerHTML = `<b>ส่วนเศษส่วน ${(v - ip).toFixed(fracStr.length)}</b> — คูณด้วย 2 แบบวนซ้ำ`;
        const tm = H("table", { class: "data steps-tbl", style: "margin-top:6px" });
        tm.innerHTML = "<tr><th>เศษส่วน × 2</th><th>ผลคูณ</th><th>บิต</th></tr>" + muls.map((m, i) => {
          const vis = k++ < st.shown;
          return `<tr class="${vis ? "" : "hide"}"><td>${+m[0].toFixed(8)} × 2</td><td>${+m[1].toFixed(8)}</td><td class="r">${m[2]}${i === 0 ? " ← MSB" : ""}</td></tr>`;
        }).join("");
        t2.appendChild(tm);
        grid.appendChild(t2);
      }
      const intBits = divs.map((d) => d[2]).reverse().join("");
      const fracBits = muls.map((m) => m[2]).join("");
      const done = st.shown >= st.total;
      res.innerHTML = done
        ? `ผลลัพธ์: <b class="mono">${st.v.trim()}<sub>10</sub> = ${intBits}${fracBits ? "." + fracBits : ""}<sub>2</sub></b>` +
          (repeat || trunc ? `<br><small>⚠️ เศษส่วนนี้แปลงเป็นไบนารีแบบลงตัวไม่ได้ (เกิดบิตวนซ้ำ) — แสดงเพียง ${muls.length} บิตแรก</small>` : "")
        : `กด “ขั้นถัดไป” (${st.shown}/${st.total})`;
    }
    draw();
  };

  /* =====================================================
     3) การคำนวณเลขไบนารี + − × ÷ (2.4)
     ===================================================== */
  W.binarith = function (el) {
    const body = U.shell(el, "INTERACTIVE", "เครื่องคิดเลขไบนารีแบบแสดงวิธีทำ",
      "ป้อนเลขไบนารีสองจำนวน เลือกปฏิบัติการ — การบวกกด “ขั้นถัดไป” เพื่อไล่ทีละหลักจากขวาไปซ้ายพร้อมตัวทด (carry) · การลบแสดงการยืม (borrow) · การคูณแสดงผลคูณย่อย (partial products)");
    const st = { a: "1101", b: "1010", op: "+", col: -1 };
    const ctr = H("div", { class: "controls" });
    const ia = U.input("A =", st.a, (s) => { st.a = s; st.col = -1; draw(); }, { width: 150 });
    const ib = U.input("B =", st.b, (s) => { st.b = s; st.col = -1; draw(); }, { width: 150 });
    const op = U.seg([["+", "บวก +"], ["−", "ลบ −"], ["×", "คูณ ×"], ["÷", "หาร ÷"]], st.op, (v) => { st.op = v; st.col = -1; draw(); });
    ctr.append(ia, ib, op);
    const ctr2 = H("div", { class: "controls" });
    const stepB = U.btn("ขั้นถัดไป ▶", () => { st.col++; draw(); }, "primary");
    ctr2.append(stepB, U.btn("แสดงทั้งหมด", () => { st.col = 99; draw(); }));
    const area = H("div", { style: "overflow-x:auto" });
    const msg = H("div", { class: "callout tip", style: "margin-bottom:0" });
    body.append(ctr, ctr2, area, msg);
    function draw() {
      const A = cleanBin(st.a), B = cleanBin(st.b);
      ia.input.classList.toggle("bad", !/^[01]+$/.test(st.a.trim()));
      ib.input.classList.toggle("bad", !/^[01]+$/.test(st.b.trim()));
      area.innerHTML = ""; if (!A || !B) { msg.textContent = "ป้อนเฉพาะ 0 และ 1"; return; }
      const a = parseInt(A, 2), b = parseInt(B, 2);
      stepB.style.display = st.op === "+" ? "" : "none";
      if (st.op === "+") {
        const w = Math.max(A.length, B.length) + 1;
        const ab = padL(A.split("").map(Number), w, 0), bb = padL(B.split("").map(Number), w, 0);
        const r = N.addBits(ab, bb, 0);
        const total = w; const shown = Math.min(st.col + 1, total); // columns revealed from right
        const vis = (i) => i >= w - shown;
        const cur = st.col >= 0 && st.col < total ? w - 1 - st.col : -1;
        area.appendChild(colGrid(w, [
          { label: "ตัวทด", cells: r.carry.slice(1).map((c, i) => (i < w - 1 && vis(i + 1) && c ? c : "")), cls: (i) => "carry" + (i === cur ? " cur" : "") },
          { label: `A (${a})`, cells: padL(A.split(""), w), cls: (i) => (i === cur ? "cur" : "") },
          { label: `+ B (${b})`, cells: padL(B.split(""), w), cls: (i) => (i === cur ? "cur" : "") },
          { label: "ผลรวม", cells: r.sum.map((s, i) => (vis(i) ? (i === 0 && !s ? "" : s) : "")), cls: (i) => "rule res" + (i === cur ? " cur" : "") },
        ]));
        if (cur >= 0) {
          const ai = ab[cur], bi = bb[cur], ci = r.carry[cur + 1], t = ai + bi + ci;
          msg.innerHTML = `หลักที่ ${st.col + 1} (นับจากขวา): ${ai} + ${bi}${ci ? " + 1 (ตัวทด)" : ""} = ${t} → ผลรวม <b>${t & 1}</b> ตัวทด <b>${t >> 1}</b>`;
        } else msg.innerHTML = shown >= total ? `ผลลัพธ์ <b class="mono">${A} + ${B} = ${(a + b).toString(2)}</b> &nbsp;(ตรวจสอบ: ${a} + ${b} = ${a + b})` : "กด “ขั้นถัดไป” เพื่อเริ่มบวกจากหลักขวาสุด (LSB)";
      } else if (st.op === "−") {
        if (a < b) { msg.innerHTML = `A น้อยกว่า B ผลลัพธ์เป็นจำนวนติดลบ (${a} − ${b} = ${a - b}) — การลบลักษณะนี้ใช้ 2’s complement ดูหัวข้อ 2.7.2`; return; }
        const w = A.length;
        const ab = A.split("").map(Number), bb = padL(B.split("").map(Number), w, 0);
        const res = [], borrow = Array(w).fill(0); let br = 0;
        for (let i = w - 1; i >= 0; i--) { let d = ab[i] - bb[i] - br; br = d < 0 ? 1 : 0; if (d < 0) d += 2; res[i] = d; if (br && i > 0) borrow[i - 1] = 1; }
        area.appendChild(colGrid(w, [
          { label: "ยืม", cells: borrow.map((x) => (x ? "1" : "")), cls: "carry" },
          { label: `A (${a})`, cells: ab },
          { label: `− B (${b})`, cells: padL(B.split(""), w) },
          { label: "ผลลบ", cells: res, cls: "rule res" },
        ]));
        msg.innerHTML = `ผลลัพธ์ <b class="mono">${(a - b).toString(2)}</b> (ตรวจสอบ: ${a} − ${b} = ${a - b}) · <small>“ยืม” คือหลักที่ถูกยืม 1 ไปให้หลักทางขวา (0 − 1 → ยืมมาเป็น 10 − 1 = 1)</small>`;
      } else if (st.op === "×") {
        const w = A.length + B.length;
        const rows = [{ label: `A (${a})`, cells: padL(A.split(""), w) }, { label: `× B (${b})`, cells: padL(B.split(""), w), cls: "" }];
        const Bs = B.split("").reverse();
        Bs.forEach((bit, k) => {
          const pp = (bit === "1" ? A : "0".repeat(A.length)) + "0".repeat(k);
          rows.push({ label: k === 0 ? "ผลคูณย่อย" : "", cells: padL(pp.split("").map((c, i) => (i >= A.length ? "·" : c)), w), cls: (i) => (k === 0 ? "rule " : "") + (bit === "1" ? "" : "dim") });
        });
        rows.push({ label: "ผลคูณ", cells: padL((a * b).toString(2).split(""), w), cls: "rule res" });
        area.appendChild(colGrid(w, rows));
        msg.innerHTML = `ผลลัพธ์ <b class="mono">${(a * b).toString(2)}</b> (ตรวจสอบ: ${a} × ${b} = ${a * b}) · <small>บิตของ B ที่เป็น 1 → คัดลอก A แล้วเลื่อนซ้าย · บิตที่เป็น 0 → แถวศูนย์</small>`;
      } else {
        if (b === 0) { msg.textContent = "หารด้วยศูนย์ไม่ได้"; return; }
        const q = Math.floor(a / b), r = a % b;
        // long division rows
        const steps = []; let rem = 0;
        A.split("").forEach((c, i) => { rem = rem * 2 + +c; const fit = rem >= b; steps.push({ i, rem, fit }); if (fit) rem -= b; });
        const tb = H("table", { class: "data steps-tbl" });
        tb.innerHTML = "<tr><th>ดึงบิต</th><th>ส่วนที่พิจารณา</th><th>หาร " + B + " ได้?</th><th>บิตผลหาร</th></tr>" +
          steps.map((s) => `<tr><td>${A[s.i]}</td><td>${s.rem.toString(2)}</td><td>${s.fit ? "ได้ → ลบ " + B : "ไม่ได้"}</td><td class="r">${s.fit ? 1 : 0}</td></tr>`).join("");
        area.appendChild(tb);
        msg.innerHTML = `ผลหาร <b class="mono">${q.toString(2)}</b> เศษ <b class="mono">${r.toString(2)}</b> (ตรวจสอบ: ${a} ÷ ${b} = ${q} เศษ ${r})`;
      }
    }
    draw();
  };

  /* =====================================================
     4) 1's และ 2's complement (2.5)
     ===================================================== */
  W.complement = function (el) {
    const body = U.shell(el, "INTERACTIVE", "หา 1’s complement และ 2’s complement",
      "คลิกบิตด้านบนเพื่อเปลี่ยนเลขตั้งต้น — แถวล่างแสดงสองวิธีหา 2’s complement: (1) 1’s complement + 1 และ (2) ลอกบิตจาก LSB จนถึง 1 ตัวแรก แล้วกลับบิตที่เหลือ");
    const st = { bits: N.bits(0b10110100, 8) };
    const ctr = H("div", { class: "controls" });
    ["10110100", "00010111", "01001011", "11001101", "00000000", "10000000"].forEach((x) => ctr.appendChild(U.btn(x, () => { st.bits = x.split("").map(Number); draw(); })));
    ctr.prepend(H("span", { class: "w-hint", style: "margin:0" }, "ตัวอย่าง:"));
    const area = H("div", { style: "display:grid;gap:10px;overflow-x:auto" });
    body.append(area, ctr);
    function draw() {
      area.innerHTML = "";
      const b = st.bits, one = N.ones(b), add = N.addBits(one, b.map(() => 0), 1), two = add.sum;
      const firstOne = b.lastIndexOf(1);
      const row = (label, el2) => { const r = H("div", { style: "display:grid;grid-template-columns:150px auto;align-items:center;gap:10px" }); r.append(H("div", { style: "font-size:14.5px;color:var(--ink-2)" }, label), el2); return r; };
      area.append(
        row("<b>เลขตั้งต้น</b>", U.bitRow(b, { onToggle: (i) => { st.bits[i] ^= 1; draw(); } })),
        row("1’s complement<br><small>(กลับทุกบิต · เกท NOT)</small>", U.bitRow(one, { cls: () => "hl" })),
        row("+ 1", U.bitRow(b.map((_, i) => (i === 7 ? 1 : 0)), { small: true })),
        row("<b>2’s complement</b><br><small>(1’s + 1)</small>", U.bitRow(two, { cls: () => "ok" })),
        row("วิธีที่ 2<br><small>สีเทา = ลอก · สีส้ม = กลับบิต</small>", U.bitRow(two, { cls: (i) => (firstOne < 0 || i >= firstOne ? "" : "hl") })),
      );
      const v = N.fromBits(b);
      area.appendChild(H("div", { class: "callout tip", style: "margin:4px 0 0" },
        `${N.str(b)} → 1’s: <b class="mono">${N.str(one)}</b> → 2’s: <b class="mono">${N.str(two)}</b>` +
        `<br><small>ถ้ามองเป็นเลขติดเครื่องหมาย 2’s complement: ${N.signedVal(b, "twos")} ↔ ${N.signedVal(two, "twos")} (เครื่องหมายตรงข้ามกัน${v === 0 || v === 128 ? " — ยกเว้น 0 และ −128 ที่ได้ค่าเดิม" : ""})</small>`));
    }
    draw();
  };

  /* =====================================================
     5) ตัวเลขติดเครื่องหมาย 3 รูปแบบ + วงล้อ 4 บิต (2.6)
     ===================================================== */
  W.signed = function (el) {
    const body = U.shell(el, "INTERACTIVE", "บิตชุดเดียวกัน ตีความได้หลายแบบ: sign-magnitude · 1’s · 2’s complement",
      "คลิกบิตเพื่อเปลี่ยนค่า (บิตซ้ายสุดคือ sign bit) · วงล้อ 4 บิตด้านล่างแสดงค่าทั้ง 16 รูปแบบ — สังเกตว่า sign-magnitude และ 1’s complement มี “ศูนย์สองตัว” ส่วน 2’s complement มีศูนย์ตัวเดียวและได้ช่วง −8 ถึง +7");
    const st = { bits: N.bits(0b11101101, 8), mode: "twos" };
    const top = H("div", { style: "overflow-x:auto" });
    const tbl = H("div", { class: "table-wrap", style: "margin-top:10px" });
    const ctr = H("div", { class: "controls" });
    const dec = U.input("แปลงเลขฐานสิบ (−128…127) เป็น 3 รูปแบบ:", "-19", (s) => { const v = parseInt(s, 10); const ok = /^\s*[-−]?\d+\s*$/.test(s) && v >= -128 && v <= 127; dec.input.classList.toggle("bad", !ok); if (ok) { encOut.innerHTML = encodeAll(v); } }, { width: 90 });
    const encOut = H("div", { class: "kv", style: "margin-top:6px" });
    ctr.append(dec);
    const wheelWrap = H("div", { style: "display:grid;grid-template-columns:minmax(0,340px) 1fr;gap:18px;align-items:center;margin-top:14px" });
    const svg = S("svg", { viewBox: "0 0 340 340" });
    const side = H("div");
    const modeSeg = U.seg([["sm", "sign-magnitude"], ["ones", "1’s complement"], ["twos", "2’s complement"]], st.mode, (m) => { st.mode = m; wheel(); });
    side.append(modeSeg, H("div", { class: "callout tip", style: "margin:12px 0 0;font-size:15px" }, ""));
    wheelWrap.append(svg, side);
    body.append(top, tbl, ctr, encOut, wheelWrap);
    const view = el.dataset.view; // "table" | "wheel" | undefined (= ทั้งหมด) — ใช้แยกในสไลด์
    if (view === "table") wheelWrap.style.display = "none";
    if (view === "wheel") [top, tbl, ctr, encOut].forEach((x) => (x.style.display = "none"));
    const mq = matchMedia("(max-width:700px)"); const lay = () => (wheelWrap.style.gridTemplateColumns = mq.matches ? "1fr" : "minmax(0,340px) 1fr"); mq.addEventListener("change", lay); lay();
    function encodeAll(v) {
      const mag = Math.abs(v), pos = N.bits(mag, 8);
      const sm = v < 0 ? (mag > 127 ? null : [1].concat(N.bits(mag, 7))) : pos;
      const on = v < 0 ? (mag > 127 ? null : N.ones(pos)) : pos;
      const tw = N.fromSigned(v, 8);
      const f = (x) => (x ? `<span class="mono">${N.str(x)}</span>` : "แทนไม่ได้ (เกินช่วง)");
      return `<dt>sign-magnitude</dt><dd>${f(sm)}</dd><dt>1’s complement</dt><dd>${f(on)}</dd><dt>2’s complement</dt><dd>${f(tw)}</dd>`;
    }
    encOut.innerHTML = encodeAll(-19);
    function draw() {
      top.innerHTML = "";
      top.appendChild(U.bitRow(st.bits, { labels: ["S", "2⁶", "2⁵", "2⁴", "2³", "2²", "2¹", "2⁰"], onToggle: (i) => { st.bits[i] ^= 1; draw(); }, cls: (i) => (i === 0 ? "sign" : "") }));
      const b = st.bits, s = b[0];
      const terms = (w0) => b.map((x, i) => (x ? (i === 0 ? w0 : 2 ** (7 - i)) : null)).filter((x) => x !== null);
      const twT = terms(-128);
      const rows = [
        ["ไม่มีเครื่องหมาย (unsigned)", N.signedVal(b, "unsigned"), "ผลรวมค่าน้ำหนักทุกบิต (0 ถึง 255)"],
        ["sign-magnitude", N.signedVal(b, "sm"), `sign = ${s ? "−" : "+"}, magnitude 7 บิต = ${N.fromBits(b.slice(1))}`],
        ["1’s complement", N.signedVal(b, "ones"), s ? `−128 + ${N.fromBits(b.slice(1))} = ${-128 + N.fromBits(b.slice(1))} แล้ว +1 = ${-127 + N.fromBits(b.slice(1))}` : "เป็นจำนวนบวก อ่านค่าตรง ๆ"],
        ["2’s complement", N.signedVal(b, "twos"), (twT.length ? twT.join(" + ").replace(/\+ -/g, "− ") : "0") + ` = ${N.signedVal(b, "twos")} (sign bit มีค่า −2⁷)`],
      ];
      tbl.innerHTML = `<table class="data" style="width:100%"><tr><th style="text-align:left">ตีความแบบ</th><th>ค่าฐานสิบ</th><th style="text-align:left">วิธีคิด</th></tr>` +
        rows.map((r) => `<tr><td style="text-align:left;font-family:var(--font)">${r[0]}</td><td><b style="color:var(--accent)">${r[1] > 0 ? "+" : ""}${r[1]}</b></td><td style="text-align:left;font-size:13.5px">${r[2]}</td></tr>`).join("") + "</table>";
    }
    function wheel() {
      svg.innerHTML = "";
      const cx = 170, cy = 170, R = 128;
      S("circle", { cx, cy, r: R, fill: "none", stroke: "var(--line)", "stroke-width": 26 }, svg);
      const vals = [];
      for (let k = 0; k < 16; k++) {
        const bits = N.bits(k, 4), v = N.signedVal(bits, st.mode);
        vals.push(v);
        const ang = (k / 16) * 2 * Math.PI - Math.PI / 2;
        const x = cx + R * Math.cos(ang), y = cy + R * Math.sin(ang);
        const neg = v < 0 || (v === 0 && bits[0] === 1);
        S("circle", { cx: x, cy: y, r: 17, fill: neg ? "var(--accent-soft)" : "var(--brand-soft)", stroke: neg ? "var(--accent)" : "var(--brand)", "stroke-width": 1.5 }, svg);
        S("text", { x, y: y + 5, "text-anchor": "middle", class: "s-mono", style: `font-size:13px;font-weight:700;fill:${neg ? "var(--accent)" : "var(--brand)"}`, text: (v === 0 && bits[0] ? "−0" : (v > 0 ? "+" : "") + v) }, svg);
        const x2 = cx + (R - 42) * Math.cos(ang), y2 = cy + (R - 42) * Math.sin(ang);
        S("text", { x: x2, y: y2 + 4, "text-anchor": "middle", class: "s-mono", style: "font-size:11px", text: N.str(bits) }, svg);
      }
      S("text", { x: cx, y: cy - 4, "text-anchor": "middle", class: "s-text", style: "font-weight:700", text: "4 บิต" }, svg);
      S("text", { x: cx, y: cy + 16, "text-anchor": "middle", class: "s-text", style: "font-size:12px", text: { sm: "sign-magnitude", ones: "1’s complement", twos: "2’s complement" }[st.mode] }, svg);
      const lo = Math.min(...vals), hi = Math.max(...vals);
      const zeros = vals.filter((v) => v === 0).length;
      side.lastChild.innerHTML = `ช่วงค่า: <b>${lo} ถึง +${hi}</b><br>จำนวนรูปแบบของศูนย์: <b>${zeros}</b> (${zeros > 1 ? "+0 และ −0 — เปลืองไป 1 รูปแบบ" : "มีศูนย์เพียงตัวเดียว"})<br>` +
        (st.mode === "twos" ? "สูตรช่วงของ 2’s complement n บิต: −(2<sup>n−1</sup>) ถึง +(2<sup>n−1</sup> − 1) → n = 4 ได้ −8 ถึง +7<br><small>เดินตามเข็มนาฬิกา = บวก 1 · ข้ามจาก 0111 (+7) ไป 1000 (−8) คือการเกิด overflow</small>" : "ช่วงสมมาตร −(2<sup>n−1</sup> − 1) ถึง +(2<sup>n−1</sup> − 1)");
    }
    draw(); wheel();
  };

  /* =====================================================
     6) IEEE 754 single-precision (2.6.7)
     ===================================================== */
  W.float = function (el) {
    const body = U.shell(el, "INTERACTIVE", "Floating-point แบบ Single-precision (IEEE 754, 32 บิต)",
      "ป้อนเลขฐานสิบ หรือคลิกบิตแต่ละบิตโดยตรง — สีส้ม = sign (S) 1 บิต · สีฟ้า = biased exponent (E) 8 บิต · สีเขียว = fraction (F) 23 บิต");
    const st = { bits: Array(32).fill(0) };
    const f32 = new Float32Array(1), u32 = new Uint32Array(f32.buffer);
    const setFrom = (x) => { f32[0] = x; const u = u32[0]; st.bits = [...Array(32)].map((_, i) => (u >>> (31 - i)) & 1); };
    const ctr = H("div", { class: "controls" });
    const inp = U.input("ค่าฐานสิบ:", "361900", (s) => { const v = Number(s.replace(/[,\s]/g, "").replace("×10^", "e").replace("−", "-")); const ok = s.trim() !== "" && !isNaN(v); inp.input.classList.toggle("bad", !ok); if (ok) { setFrom(v); draw(true); } }, { width: 170 });
    ctr.append(inp);
    [["3.619×10⁵ (ตย. 2.17)", "361900"], ["−407680", "-407680"], ["5777 (1011010010001₂)", "5777"], ["0.15625", "0.15625"], ["0.1", "0.1"], ["−1", "-1"], ["0", "0"]].forEach(([t, v]) => {
      ctr.appendChild(U.btn(t, () => { inp.input.value = v; setFrom(Number(v)); draw(true); }));
    });
    ctr.appendChild(U.btn("∞", () => { inp.input.value = "Infinity"; setFrom(Infinity); draw(true); }));
    const bitsBox = H("div", { style: "overflow-x:auto;padding:4px 0" });
    const steps = H("div", { class: "wgrid", style: "margin-top:10px" });
    body.append(ctr, bitsBox, steps);
    function draw(fromInput) {
      const b = st.bits;
      const cls = (i) => (i === 0 ? "sign" : i <= 8 ? "e" : "f");
      bitsBox.innerHTML = "";
      const row = U.bitRow(b, { small: true, tiny: true, labels: b.map((_, i) => String(31 - i)), onToggle: (i) => { st.bits[i] ^= 1; draw(); }, cls: (i) => "fp-" + cls(i) + (i === 1 || i === 9 ? " gap" : "") });
      bitsBox.appendChild(row);
      const S_ = b[0], E = N.fromBits(b.slice(1, 9)), Fb = b.slice(9), F = Fb.reduce((a, x, i) => a + x * 2 ** -(i + 1), 0);
      let u = 0; b.forEach((x) => (u = u * 2 + x)); u32[0] = u >>> 0; const val = f32[0];
      if (!fromInput) inp.input.value = String(val);
      const fStr = N.str(Fb).replace(/0+$/, "") || "0";
      let kind = "ปกติ (normalized)";
      if (E === 0 && F === 0) kind = "ศูนย์ (ทุกบิตของ E และ F เป็น 0)";
      else if (E === 255 && F === 0) kind = "infinity (E เป็น 1 ทั้งหมด, F เป็น 0 ทั้งหมด)";
      else if (E === 255) kind = "NaN (ไม่ใช่ตัวเลข)";
      else if (E === 0) kind = "denormalized (นอกเหนือเนื้อหาในเล่ม)";
      const exp = E - 127;
      steps.innerHTML =
        `<div class="card"><dl class="kv">
          <dt>S (บิต 31)</dt><dd style="color:var(--accent)">${S_} → ${S_ ? "ลบ" : "บวก"}</dd>
          <dt>E (บิต 30–23)</dt><dd style="color:var(--brand)">${N.str(b.slice(1, 9))} = ${E}</dd>
          <dt>exponent จริง</dt><dd>${E} − 127 = ${exp}</dd>
          <dt>F (บิต 22–0)</dt><dd style="color:var(--hi)">.${fStr}</dd>
          <dt>ชนิด</dt><dd style="font-family:var(--font);font-weight:500">${kind}</dd></dl></div>` +
        `<div class="card"><div style="font-size:14px;color:var(--ink-3)">ค่าตัวเลข = (−1)<sup>S</sup> (1 + F) (2<sup>E − 127</sup>)</div>
          <div class="mono" style="font-size:16px;margin:6px 0">= (−1)<sup>${S_}</sup> (1.${fStr})<sub>2</sub> × 2<sup>${exp}</sup></div>
          <div style="font-size:24px;font-weight:700;color:var(--accent)" class="mono">${fmt(val)}</div>
          <div style="font-size:13.5px;color:var(--ink-2);margin-top:6px">ฐานสิบหก: <span class="mono">${(u >>> 0).toString(16).toUpperCase().padStart(8, "0")}</span>` +
        (isFinite(val) && val !== 0 && String(val) !== inp.input.value && fromInput ? `<br>⚠️ ค่าที่เก็บได้จริงคือ ${val} — ไม่ตรงกับค่าที่ป้อนพอดี เพราะ fraction มีเพียง 23 บิต` : "") + `</div></div>`;
    }
    const fmt = (v) => (Number.isInteger(v) && Math.abs(v) < 1e15 ? v.toLocaleString("en-US") : String(v));
    setFrom(361900); draw(true);
  };

  /* =====================================================
     7) บวก/ลบเลขติดเครื่องหมาย 2's complement + overflow (2.7)
     ===================================================== */
  W.signedadd = function (el) {
    const body = U.shell(el, "INTERACTIVE", "บวก/ลบเลขติดเครื่องหมาย 8 บิต (2’s complement) และการตรวจ overflow",
      "ป้อนเลขฐานสิบ −128 ถึง 127 — การลบ A − B ทำโดยหา 2’s complement ของ B แล้วบวก · ตัวทดจากบิตซ้ายสุดถูกละทิ้ง · overflow เกิดเมื่อบวกเลขเครื่องหมายเดียวกันแล้วได้ผลเครื่องหมายผิด");
    const st = { a: "125", b: "26", op: "+" };
    const ctr = H("div", { class: "controls" });
    const ia = U.input("A =", st.a, (s) => { st.a = s; draw(); }, { width: 80 });
    const ib = U.input("B =", st.b, (s) => { st.b = s; draw(); }, { width: 80 });
    ctr.append(ia, U.seg([["+", "A + B"], ["−", "A − B"]], st.op, (v) => { st.op = v; draw(); }), ib);
    const ex = H("div", { class: "controls" });
    ex.appendChild(H("span", { class: "w-hint", style: "margin:0" }, "กรณีในเล่ม:"));
    [["1: +7 + +4", 7, 4, "+"], ["2: +15 + −6", 15, -6, "+"], ["3: +16 + −24", 16, -24, "+"], ["4: −5 + −9", -5, -9, "+"], ["overflow: 125 + 58", 125, 58, "+"], ["ตย.2.18(IV): −120 − (−30)", -120, -30, "−"]].forEach(([t, a, b, o]) =>
      ex.appendChild(U.btn(t, () => { st.a = String(a); st.b = String(b); st.op = o; ia.input.value = a; ib.input.value = b; ctr.querySelector(".seg").set(o); draw(); })));
    const area = H("div", { style: "overflow-x:auto" });
    const msg = H("div", { class: "callout", style: "margin-bottom:0" });
    body.append(ctr, ex, area, msg);
    function draw() {
      const pa = parseInt(st.a.replace("−", "-"), 10), pb = parseInt(st.b.replace("−", "-"), 10);
      const okA = Number.isInteger(pa) && pa >= -128 && pa <= 127, okB = Number.isInteger(pb) && pb >= -128 && pb <= 127;
      ia.input.classList.toggle("bad", !okA); ib.input.classList.toggle("bad", !okB);
      area.innerHTML = ""; if (!okA || !okB) { msg.textContent = "ป้อนจำนวนเต็มในช่วง −128 ถึง 127"; return; }
      const A = N.fromSigned(pa, 8), B0 = N.fromSigned(pb, 8);
      const B = st.op === "−" ? N.twos(B0) : B0;
      const r = N.addBits(A, B, 0);
      const res = N.signedVal(r.sum, "twos"), truth = st.op === "+" ? pa + pb : pa - pb;
      const cIn7 = r.carry[1], cOut = r.cout, ovf = cIn7 !== cOut;
      const bLabel = st.op === "−" ? `+ (−B) 2’s ของ B` : `+ B (${pb})`;
      area.appendChild(colGrid(9, [
        { label: "ตัวทด", cells: ["" + (cOut ? "1" : "")].concat(r.carry.slice(1, 8).map((c) => (c ? "1" : ""))).concat([""]), cls: (i) => "carry" + (i === 0 && cOut ? " x" : "") },
        { label: `A (${pa})`, cells: [""].concat(A), cls: (i) => (i === 1 ? "res" : "") },
        { label: bLabel, cells: [""].concat(B), cls: (i) => (i === 1 ? "res" : "") },
        { label: "ผลลัพธ์", cells: [cOut ? "1" : ""].concat(r.sum), cls: (i) => "rule " + (i === 0 ? "x" : ovf && i === 1 ? "bad" : "res") },
      ]));
      if (st.op === "−") area.insertAdjacentHTML("afterbegin", `<p class="w-hint" style="margin:0 0 6px">B = ${pb} = <span class="mono">${N.str(B0)}</span> → 2’s complement = <span class="mono">${N.str(B)}</span> (${N.signedVal(B, "twos")}) แล้วนำไปบวกกับ A</p>`);
      const sa = Math.sign(pa), sb = Math.sign(st.op === "−" ? -pb : pb);
      const bb = st.op === "−" ? -pb : pb;
      let kase = "";
      if (pa >= 0 && bb >= 0) kase = "กรณีที่ 1: ทั้งสองจำนวนเป็นบวก";
      else if (pa < 0 && bb < 0) kase = "กรณีที่ 4: ทั้งสองจำนวนเป็นลบ";
      else if (Math.abs(pa >= 0 ? pa : bb) > Math.abs(pa < 0 ? pa : bb)) kase = "กรณีที่ 2: จำนวนบวกมีค่ามากกว่าจำนวนลบ";
      else kase = "กรณีที่ 3: จำนวนลบมีค่ามากกว่าจำนวนบวก";
      msg.className = "callout " + (ovf ? "warn" : "tip");
      msg.innerHTML = `<b>${kase}</b><br>ผลลัพธ์ 8 บิต: <b class="mono">${N.str(r.sum)}</b> = <b>${res}</b>` +
        (cOut ? " · ตัวทดตัวสุดท้าย (1) ถูกละทิ้ง" : "") +
        (ovf ? `<br>⚠️ <b>เกิด overflow</b> — ผลที่ถูกต้องคือ ${truth} ซึ่งเกินช่วง −128 ถึง +127 · สังเกต sign bit ผิด (ตัวทดเข้าบิต 7 = ${cIn7} ไม่เท่ากับตัวทดออก = ${cOut})`
             : `<br>✓ ไม่เกิด overflow (${pa} ${st.op} ${st.op === "−" && pb < 0 ? "(" + pb + ")" : pb} = ${truth}) · ${res < 0 ? "ผลเป็นลบ อยู่ในรูป 2’s complement" : "ผลเป็นบวก อยู่ในรูปไบนารีแท้จริง (true binary)"}`);
    }
    draw();
  };

  /* =====================================================
     8) แปลงฐาน 2 / 8 / 10 / 16 พร้อมการจับกลุ่มบิต (2.8–2.9)
     ===================================================== */
  W.baseconv = function (el) {
    const body = U.shell(el, "INTERACTIVE", "แปลงเลขฐาน 2 · 8 · 10 · 16",
      "พิมพ์ในช่องใดก็ได้ ช่องอื่นจะเปลี่ยนตาม — ด้านล่างแสดงการจับกลุ่มบิตจากขวาไปซ้าย (4 บิต → ฐานสิบหก, 3 บิต → ฐานแปด) และการหารด้วย 16 แบบวนซ้ำ");
    const st = { v: 420 };
    const box = H("div", { class: "wgrid" });
    const fields = {};
    [[2, "ไบนารี (ฐาน 2)"], [8, "ฐานแปด"], [10, "ฐานสิบ"], [16, "ฐานสิบหก"]].forEach(([b, t]) => {
      const f = U.input("", "", (s) => { const v = N.parse(s, b); const ok = Number.isFinite(v) && v < 2 ** 40; f.input.classList.toggle("bad", !ok); if (ok) { st.v = v; draw(b); } }, { width: 220 });
      const card = H("div", { class: "card", style: "padding:12px 14px" });
      card.append(H("div", { style: "font-size:13.5px;color:var(--ink-3);margin-bottom:4px" }, t), f);
      f.input.style.width = "100%";
      fields[b] = f; box.appendChild(card);
    });
    const ex = H("div", { class: "controls" });
    ex.appendChild(H("span", { class: "w-hint", style: "margin:0" }, "ตัวอย่างในเล่ม:"));
    [["D96F₁₆", 0xd96f], ["3DAEB₁₆", 0x3daeb], ["2A5C₁₆", 0x2a5c], ["F5E₁₆", 0xf5e], ["A25D₁₆", 0xa25d], ["420₁₀", 420], ["236₈", 0o236]].forEach(([t, v]) => ex.appendChild(U.btn(t, () => { st.v = v; draw(); })));
    const vis = H("div", { class: "wgrid", style: "margin-top:12px" });
    body.append(box, ex, vis);
    function groups(bin, k, base) {
      const gs = N.group(bin, k);
      const wrap = H("div", { class: "card" });
      wrap.appendChild(H("div", { style: "font-weight:600;margin-bottom:8px" }, `จับกลุ่มละ ${k} บิต → ฐาน${base === 16 ? "สิบหก" : "แปด"}`));
      const row = H("div", { style: "display:flex;flex-wrap:wrap;gap:8px" });
      const pad = gs.join("").length - bin.length;
      let used = 0;
      gs.forEach((g) => {
        const c = H("div", { style: "text-align:center;border:1px solid var(--line);border-radius:8px;padding:4px 8px;background:var(--surface-2)" });
        const shown = g.split("").map((ch) => { const isPad = used++ < pad; return isPad ? `<span style="color:var(--accent);opacity:.6">${ch}</span>` : ch; }).join("");
        c.innerHTML = `<div class="mono" style="font-size:16px;letter-spacing:.06em">${shown}</div><div class="mono" style="font-size:20px;font-weight:700;color:var(--brand)">${parseInt(g, 2).toString(base).toUpperCase()}</div>`;
        row.appendChild(c);
      });
      wrap.appendChild(row);
      if (pad) wrap.appendChild(H("div", { class: "w-hint", style: "margin:6px 0 0" }, `เติม 0 สีส้มด้านหน้า ${pad} ตัวให้ครบกลุ่ม`));
      return wrap;
    }
    function divSteps(v, base) {
      const wrap = H("div", { class: "card" });
      wrap.appendChild(H("div", { style: "font-weight:600;margin-bottom:6px" }, `ฐานสิบ → ฐาน${base === 16 ? "สิบหก" : "แปด"}: หารด้วย ${base} แบบวนซ้ำ`));
      const rows = []; let q = v;
      if (q === 0) rows.push([0, 0, 0]);
      while (q > 0) { rows.push([q, Math.floor(q / base), q % base]); q = Math.floor(q / base); }
      const t = H("table", { class: "data steps-tbl" });
      t.innerHTML = `<tr><th>ตัวตั้ง ÷ ${base}</th><th>ผลหาร</th><th>เศษ</th></tr>` + rows.map((r) => `<tr><td>${r[0]} ÷ ${base}</td><td>${r[1]}</td><td class="r">${r[2]}${r[2] > 9 ? " = " + N.DIG[r[2]] : ""}</td></tr>`).join("");
      wrap.appendChild(t);
      wrap.appendChild(H("div", { class: "w-hint", style: "margin:6px 0 0" }, `อ่านเศษจากล่างขึ้นบน → <b class="mono">${v.toString(base).toUpperCase()}</b>`));
      return wrap;
    }
    function draw(from) {
      [2, 8, 10, 16].forEach((b) => { if (b !== from) { fields[b].input.value = st.v.toString(b).toUpperCase(); fields[b].input.classList.remove("bad"); } });
      vis.innerHTML = "";
      const bin = st.v.toString(2);
      vis.append(groups(bin, 4, 16), groups(bin, 3, 8), divSteps(st.v, 16));
      const hexW = st.v.toString(16).toUpperCase().split("").reverse().map((d, i) => `(${d}${/[A-F]/.test(d) ? "=" + parseInt(d, 16) : ""} × 16<sup>${i}</sup>)`).reverse().join(" + ");
      vis.appendChild(H("div", { class: "card" }, `<div style="font-weight:600;margin-bottom:6px">ฐานสิบหก → ฐานสิบ (ถ่วงน้ำหนัก)</div><div style="font-size:15px">${hexW}<br>= <b class="mono" style="color:var(--accent)">${st.v}</b></div>`));
    }
    draw();
  };

  /* =====================================================
     9) การบวก BCD (2.10)
     ===================================================== */
  W.bcd = function (el) {
    const body = U.shell(el, "STEP-BY-STEP", "การบวก BCD (รหัส 8421) และการบวกแก้ด้วย 6 (0110)",
      "ป้อนเลขฐานสิบสองจำนวน (0–9999) — บวกทีละกลุ่ม 4 บิตจากขวาไปซ้าย ถ้าผลในกลุ่มมากกว่า 9 หรือเกิดตัวทด ให้บวก 0110 เพื่อข้าม invalid codes ทั้ง 6 ตัว");
    const st = { a: "67", b: "53" };
    const ctr = H("div", { class: "controls" });
    const ia = U.input("A =", st.a, (s) => { st.a = s; draw(); }, { width: 90 });
    const ib = U.input("B =", st.b, (s) => { st.b = s; draw(); }, { width: 90 });
    ctr.append(ia, ib);
    [["4+2", 4, 2], ["32+51", 32, 51], ["9+5", 9, 5], ["9+9", 9, 9], ["16+15", 16, 15], ["67+53", 67, 53], ["450+417", 450, 417]].forEach(([t, a, b]) => ctr.appendChild(U.btn(t, () => { ia.input.value = st.a = String(a); ib.input.value = st.b = String(b); draw(); })));
    const area = H("div", { style: "overflow-x:auto" });
    const msg = H("div", { class: "callout tip", style: "margin-bottom:0" });
    body.append(ctr, area, msg);
    function draw() {
      const okA = /^\d{1,4}$/.test(st.a.trim()), okB = /^\d{1,4}$/.test(st.b.trim());
      ia.input.classList.toggle("bad", !okA); ib.input.classList.toggle("bad", !okB);
      area.innerHTML = ""; if (!okA || !okB) { msg.textContent = "ป้อนจำนวนเต็ม 0–9999"; return; }
      const nd = Math.max(st.a.trim().length, st.b.trim().length);
      const da = st.a.trim().padStart(nd, "0").split("").map(Number), db = st.b.trim().padStart(nd, "0").split("").map(Number);
      const cols = []; let carry = 0;
      for (let i = nd - 1; i >= 0; i--) {
        const raw = da[i] + db[i] + carry;
        const fix = raw > 9;
        const out = fix ? raw + 6 : raw;
        cols[i] = { a: da[i], b: db[i], cin: carry, raw, fix, digit: out & 15, cout: out >> 4 };
        carry = out >> 4;
      }
      const t = H("table", { class: "data", style: "font-size:15px" });
      const nib = (x) => N.toBase(x, 2, 4);
      let h = `<tr><th>กลุ่ม (หลัก)</th>${carry ? "<th>ตัวทด</th>" : ""}${cols.map((_, i) => `<th>หลักที่ ${nd - i}</th>`).join("")}</tr>`;
      h += `<tr><td style="font-family:var(--font)">A</td>${carry ? "<td></td>" : ""}${cols.map((c) => `<td>${nib(c.a)} <small>${c.a}</small></td>`).join("")}</tr>`;
      h += `<tr><td style="font-family:var(--font)">+ B</td>${carry ? "<td></td>" : ""}${cols.map((c) => `<td>${nib(c.b)} <small>${c.b}</small></td>`).join("")}</tr>`;
      h += `<tr><td style="font-family:var(--font)">ตัวทดเข้า</td>${carry ? "<td></td>" : ""}${cols.map((c) => `<td>${c.cin || ""}</td>`).join("")}</tr>`;
      h += `<tr><td style="font-family:var(--font)">ผลบวกไบนารี</td>${carry ? "<td></td>" : ""}${cols.map((c) => `<td style="${c.fix ? "background:var(--warn-soft)" : ""}">${c.raw > 15 ? "1 " : ""}${nib(c.raw & 15)} <small>${c.raw}${c.fix ? " > 9 ✗" : " ✓"}</small></td>`).join("")}</tr>`;
      h += `<tr><td style="font-family:var(--font)">บวกแก้</td>${carry ? "<td></td>" : ""}${cols.map((c) => `<td style="color:var(--accent);font-weight:700">${c.fix ? "+0110" : ""}</td>`).join("")}</tr>`;
      h += `<tr><td style="font-family:var(--font);font-weight:700">ผล BCD</td>${carry ? `<td style="font-weight:700;color:var(--brand)">0001 <small>1</small></td>` : ""}${cols.map((c) => `<td style="font-weight:700;color:var(--brand)">${nib(c.digit)} <small>${c.digit}</small></td>`).join("")}</tr>`;
      t.innerHTML = h; area.appendChild(t);
      const sum = +st.a + +st.b;
      msg.innerHTML = `${+st.a} + ${+st.b} = <b>${sum}</b> → BCD <b class="mono">${String(sum).split("").map((d) => nib(+d)).join(" ")}</b>` +
        (cols.some((c) => c.fix) ? "<br><small>หลักที่ไฮไลต์ได้ผลเกิน 9 (หรือมีตัวทดออกจาก 4 บิต) จึงต้องบวก 0110 และส่งตัวทดไปหลักถัดไป</small>" : "<br><small>ทุกกลุ่มได้ผลไม่เกิน 9 → เป็น BCD ที่ถูกต้องทันที</small>");
    }
    draw();
  };

  /* =====================================================
     10) รหัสเกรย์ + จานเข้ารหัสเชิงมุม (2.11.1)
     ===================================================== */
  W.gray = function (el) {
    const body = U.shell(el, "INTERACTIVE", "รหัสเกรย์: แปลงไบนารี ⇄ เกรย์ และจานเข้ารหัสตำแหน่งเชิงมุม",
      "คลิกบิตไบนารีเพื่อดูการแปลง (บิตถัดไปของเกรย์ = บิตไบนารีคู่ติดกันบวกกันโดยไม่สนตัวทด = XOR) · เลื่อนตำแหน่งจานหมุนเพื่อเทียบว่าแต่ละครั้งมีกี่บิตเปลี่ยน");
    const st = { bits: [1, 0, 0, 1, 1], pos: 7, code: "gray" };
    const conv = H("div", { style: "overflow-x:auto" });
    const wrap = H("div", { style: "display:grid;grid-template-columns:minmax(0,300px) 1fr;gap:18px;align-items:center;margin-top:14px" });
    const svg = S("svg", { viewBox: "0 0 300 300" });
    const side = H("div");
    const ctr = H("div", { class: "controls" });
    const seg = U.seg([["gray", "จานรหัสเกรย์"], ["bin", "จานรหัสไบนารี"]], st.code, (v) => { st.code = v; disk(); });
    const sl = H("input", { type: "range", min: 0, max: 15, value: st.pos, style: "width:200px;accent-color:var(--brand)" });
    sl.addEventListener("input", () => { st.pos = +sl.value; disk(); });
    const lab = H("label"); lab.append("ตำแหน่ง ", sl);
    ctr.append(seg, lab);
    const info = H("div", { class: "callout tip" });
    side.append(ctr, info);
    wrap.append(svg, side);
    body.append(conv, wrap);
    const mq = matchMedia("(max-width:700px)"); const lay = () => (wrap.style.gridTemplateColumns = mq.matches ? "1fr" : "minmax(0,300px) 1fr"); mq.addEventListener("change", lay); lay();
    function drawConv() {
      conv.innerHTML = "";
      const b = st.bits, g = N.gray(b);
      const row = (label, el2) => { const r = H("div", { style: "display:grid;grid-template-columns:110px auto;align-items:center;gap:10px;margin:4px 0" }); r.append(H("div", { style: "font-size:14.5px;color:var(--ink-2)" }, label), el2); return r; };
      const ctrl = H("div", { class: "controls", style: "margin:0 0 6px" });
      ctrl.append(U.btn("+ บิต", () => { if (st.bits.length < 8) { st.bits.unshift(0); drawConv(); } }), U.btn("− บิต", () => { if (st.bits.length > 2) { st.bits.shift(); drawConv(); } }));
      const ops = H("div", { class: "w-hint", style: "margin:0;font-family:var(--mono)" }, b.map((x, i) => (i ? `${b[i - 1]}⊕${x}=${g[i]}` : `MSB ลงมา=${x}`)).join(" &nbsp;·&nbsp; "));
      conv.append(ctrl, row("<b>ไบนารี</b>", U.bitRow(b, { onToggle: (i) => { st.bits[i] ^= 1; drawConv(); } })), row("<b>รหัสเกรย์</b>", U.bitRow(g, { cls: (i) => (i === 0 ? "ok" : "hl") })), ops);
      conv.appendChild(H("p", { class: "w-hint", style: "margin:6px 0 0" }, `ย้อนกลับ (เกรย์ → ไบนารี): MSB เหมือนเดิม แล้วนำบิตไบนารีที่ได้ล่าสุดไปบวก (XOR) กับบิตเกรย์ถัดไป → <b class="mono">${N.str(N.ungray(g))}</b>`));
    }
    function disk() {
      svg.innerHTML = "";
      const cx = 150, cy = 150, rings = [[118, 140], [92, 114], [66, 88], [40, 62]]; // MSB outer
      const code = (k) => (st.code === "gray" ? N.gray(N.bits(k, 4)) : N.bits(k, 4));
      for (let k = 0; k < 16; k++) {
        const a0 = (k / 16) * 2 * Math.PI - Math.PI / 2, a1 = ((k + 1) / 16) * 2 * Math.PI - Math.PI / 2;
        const c = code(k);
        rings.forEach(([r0, r1], j) => {
          const p = (r, a) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
          S("path", { d: `M${p(r0, a0)} L${p(r1, a0)} A${r1},${r1} 0 0 1 ${p(r1, a1)} L${p(r0, a1)} A${r0},${r0} 0 0 0 ${p(r0, a0)} Z`, fill: c[j] ? "var(--ink)" : "var(--surface)", stroke: "var(--line)", "stroke-width": 0.8, opacity: k === st.pos ? 1 : 0.8 }, svg);
        });
        const am = ((k + 0.5) / 16) * 2 * Math.PI - Math.PI / 2;
        S("text", { x: cx + 148 * Math.cos(am) * 0.98, y: cy + 148 * Math.sin(am) * 0.98 + 4, "text-anchor": "middle", class: "s-mono", style: `font-size:10px;${k === st.pos ? "font-weight:700;fill:var(--accent)" : ""}`, text: k }, svg);
      }
      const am = ((st.pos + 0.5) / 16) * 2 * Math.PI - Math.PI / 2;
      S("line", { x1: cx, y1: cy, x2: cx + 142 * Math.cos(am), y2: cy + 142 * Math.sin(am), stroke: "var(--accent)", "stroke-width": 3 }, svg);
      S("circle", { cx, cy, r: 6, fill: "var(--accent)" }, svg);
      const cur = code(st.pos), prev = code((st.pos + 15) % 16), next = code((st.pos + 1) % 16);
      const diff = (x, y) => x.reduce((a, v, i) => a + (v !== y[i]), 0);
      let worst = 0; for (let k = 0; k < 16; k++) worst = Math.max(worst, diff(code(k), code((k + 1) % 16)));
      info.innerHTML = `ตำแหน่ง ${st.pos}: <b class="mono">${N.str(cur)}</b> (วงนอก = MSB)<br>` +
        `จาก ${(st.pos + 15) % 16} → ${st.pos}: เปลี่ยน <b>${diff(prev, cur)}</b> บิต · จาก ${st.pos} → ${(st.pos + 1) % 16}: เปลี่ยน <b>${diff(cur, next)}</b> บิต<br>` +
        `<small>${st.code === "gray" ? "รหัสเกรย์เปลี่ยนเพียง 1 บิตทุกตำแหน่ง (รวมถึง 15 → 0) จึงไม่เกิดการอ่านผิดขณะเซนเซอร์อยู่บนรอยต่อ" : `รหัสไบนารีบางตำแหน่งเปลี่ยนพร้อมกันถึง ${worst} บิต (เช่น 7 → 8: 0111 → 1000) ถ้าเซนเซอร์อ่านไม่พร้อมกันอาจได้ค่าผิดได้ทุกค่า`}</small>`;
    }
    drawConv(); disk();
  };

  /* =====================================================
     11) รหัสแอสกี้ (2.11.2)
     ===================================================== */
  const CTRL = ["NUL", "SOH", "STX", "ETX", "EOT", "ENQ", "ACK", "BEL", "BS", "TAB", "LF", "VT", "FF", "CR", "SO", "SI", "DLE", "DC1", "DC2", "DC3", "DC4", "NAK", "SYN", "ETB", "CAN", "EM", "SUB", "ESC", "FS", "GS", "RS", "US"];
  W.ascii = function (el) {
    const body = U.shell(el, "INTERACTIVE", "รหัสแอสกี้: ข้อความ ⇄ รหัส 7 บิต",
      "พิมพ์ข้อความภาษาอังกฤษเพื่อดูรหัสของแต่ละตัว หรือคลิกตัวอักษรในตาราง · สังเกต: ตัวพิมพ์ใหญ่กับตัวพิมพ์เล็กต่างกันที่บิต 5 (ห่างกัน 32 = 20₁₆) และตัวเลข '0'–'9' คือ 30₁₆–39₁₆");
    const st = { text: "Hi 517!", fmt: "hex" };
    const ctr = H("div", { class: "controls" });
    const inp = U.input("ข้อความ:", st.text, (s) => { st.text = s; draw(); }, { width: 220 });
    ctr.append(inp, U.seg([["hex", "Hex"], ["dec", "Dec"], ["bin", "Bin (7 บิต)"]], st.fmt, (v) => { st.fmt = v; draw(); }));
    const out = H("div", { style: "display:flex;flex-wrap:wrap;gap:6px;margin:10px 0" });
    const dec = U.input("ถอดรหัส (hex คั่นด้วยช่องว่าง):", "48 65 6C 6C 6F", (s) => {
      const parts = s.trim().split(/[\s,]+/).filter(Boolean);
      const codes = parts.map((p) => parseInt(p, 16));
      const ok = codes.every((c) => Number.isInteger(c) && c >= 0 && c < 128);
      dec.input.classList.toggle("bad", !ok);
      decOut.innerHTML = ok ? "→ " + codes.map((c) => (c < 32 ? `<span class="pill lo">${CTRL[c]}</span>` : c === 127 ? '<span class="pill lo">DEL</span>' : `<b class="mono">${c === 32 ? "␠" : esc(String.fromCharCode(c))}</b>`)).join(" ") : "ต้องเป็นเลขฐานสิบหก 00–7F";
    }, { width: 220 });
    const decOut = H("span", { style: "margin-left:8px" });
    const decRow = H("div", { class: "controls" }); decRow.append(dec, decOut);
    const grid = H("div", { style: "overflow-x:auto;margin-top:8px" });
    body.append(ctr, out, decRow, grid);
    const esc = (c) => c.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const f = (c) => (st.fmt === "hex" ? c.toString(16).toUpperCase().padStart(2, "0") : st.fmt === "dec" ? String(c) : c.toString(2).padStart(7, "0"));
    function draw() {
      out.innerHTML = "";
      [...st.text].slice(0, 40).forEach((ch) => {
        const c = ch.codePointAt(0);
        const ok = c < 128;
        out.appendChild(H("div", { style: `text-align:center;border:1px solid ${ok ? "var(--line)" : "var(--bad)"};border-radius:8px;padding:4px 8px;background:var(--surface);min-width:44px` },
          `<div class="mono" style="font-size:20px;font-weight:700">${ch === " " ? "␠" : esc(ch)}</div><div class="mono" style="font-size:12.5px;color:${ok ? "var(--brand)" : "var(--bad)"}">${ok ? f(c) : "ไม่ใช่ ASCII"}</div>`));
      });
      // 8 columns (high 3 bits) × 16 rows (low 4 bits)
      let h = '<table class="data" style="font-size:13px"><tr><th></th>' + [...Array(8)].map((_, i) => `<th>${i}x</th>`).join("") + "</tr>";
      for (let r = 0; r < 16; r++) {
        h += `<tr><th>x${r.toString(16).toUpperCase()}</th>`;
        for (let c8 = 0; c8 < 8; c8++) {
          const code = c8 * 16 + r;
          const lbl = code < 32 ? CTRL[code] : code === 127 ? "DEL" : code === 32 ? "␠" : esc(String.fromCharCode(code));
          const isCtl = code < 32 || code === 127;
          const inText = st.text.includes(String.fromCharCode(code));
          h += `<td data-c="${code}" title="${code} = ${code.toString(16).toUpperCase()}h = ${code.toString(2).padStart(7, "0")}" style="cursor:pointer;${isCtl ? "color:var(--brand);font-size:10.5px;" : "font-weight:700;"}${inText ? "background:var(--accent-soft);" : ""}">${lbl}</td>`;
        }
        h += "</tr>";
      }
      grid.innerHTML = h + "</table>";
      grid.querySelectorAll("td[data-c]").forEach((td) => td.addEventListener("click", () => {
        const c = +td.dataset.c; if (c < 32 || c === 127) return;
        st.text += String.fromCharCode(c); inp.input.value = st.text; draw();
      }));
    }
    draw(); dec.input.dispatchEvent(new Event("input"));
  };
})();
