/* =========================================================
   บทที่ 1 — interactive widgets
   Each widget: DLD.widgets.<name> = (el) => { ... }
   Used by both lesson page (index.html) and slides (slides.html)
   ========================================================= */
(function () {
  const DLD = window.DLD;
  const S = (...a) => DLD.svg(...a);
  const H = (...a) => DLD.h(...a);
  const W = DLD.widgets;

  function shell(el, badge, title, hint) {
    el.classList.add("widget");
    el.innerHTML = "";
    const hd = H("header", null, `<span class="badge">${badge}</span><h4>${title}</h4>`);
    const body = H("div", { class: "w-body" });
    if (hint) body.appendChild(H("p", { class: "w-hint" }, hint));
    el.appendChild(hd); el.appendChild(body);
    return body;
  }
  function svgBox(parent, w, h) {
    const s = S("svg", { viewBox: `0 0 ${w} ${h}`, role: "img" });
    parent.appendChild(s);
    return s;
  }
  function slider(label, min, max, step, val, onInput, unit) {
    const lab = H("label");
    const out = H("b", { class: "mono" });
    const inp = H("input", { type: "range", min, max, step, value: val });
    const show = () => (out.textContent = (unit ? unit(+inp.value) : inp.value));
    inp.addEventListener("input", () => { show(); onInput(+inp.value); });
    lab.append(label + " ", inp, out); show();
    lab.input = inp; lab.refresh = show;
    return lab;
  }
  function seg(options, val, onPick) {
    const box = H("div", { class: "seg", role: "group" });
    options.forEach(([v, text]) => {
      const b = H("button", { type: "button", class: v === val ? "on" : "" }, text);
      b.addEventListener("click", () => { [...box.children].forEach((c) => c.classList.remove("on")); b.classList.add("on"); onPick(v); });
      box.appendChild(b);
    });
    box.set = (v) => [...box.children].forEach((c, i) => c.classList.toggle("on", options[i][0] === v));
    return box;
  }
  function readout(items) {
    const box = H("div", { class: "readout" });
    const refs = {};
    items.forEach(([k, label]) => {
      const r = H("div", { class: "r" }, `<small>${label}</small><b>—</b>`);
      refs[k] = r.querySelector("b"); box.appendChild(r);
    });
    box.refs = refs; return box;
  }

  /* =====================================================
     1) ไทม์ไลน์ประวัติศาสตร์อิเล็กทรอนิกส์ (ตารางที่ 1.1)
     ===================================================== */
  const EVENTS = [
    [1864, "แมกซ์เวลล์", "James Clerk Maxwell", "ประกาศสมการของคลื่น เป็นการปูทางไปสู่การโทรคมนาคมโดยใช้คลื่นวิทยุ"],
    [1869, "ครุกส์ และฮิตทอร์ฟ", "Crookes, Hittorf", "พบปรากฏการณ์รังสีแคโทด เป็นการปูทางไปสู่การประดิษฐ์หลอดภาพโทรทัศน์"],
    [1883, "เอดิสัน", "Thomas Edison", "พบปรากฏการณ์การนำกระแสอิเล็กตรอนผ่านสุญญากาศ เป็นการปูทางไปสู่การประดิษฐ์หลอดสุญญากาศ"],
    [1888, "เฮิรตซ์", "Heinrich Hertz", "สาธิตการรับส่งคลื่นวิทยุเป็นครั้งแรก เป็นจุดเริ่มต้นของวิวัฒนาการด้านโทรคมนาคม"],
    [1897, "ทอมสัน", "J.J. Thomson", "วัดค่า e/m ได้ ยืนยันว่าอิเล็กตรอนมีตัวตนจริง และวางพื้นฐานทางทฤษฎีการคำนวณของวิชาอิเล็กทรอนิกส์"],
    [1901, "มาร์โคนี", "Guglielmo Marconi", "ส่งวิทยุข้ามมหาสมุทรแอตแลนติกได้สำเร็จ ยุคของการโทรคมนาคมทางวิทยุได้เริ่มขึ้นแล้ว"],
    [1904, "ไอน์สไตน์", "Albert Einstein", "ค้นพบปรากฏการณ์โฟโตอิเล็กทริก ปูทางไปสู่อุปกรณ์อิเล็กทรอนิกส์ทางแสง และทำให้เกิดทฤษฎีควอนตัม ซึ่งเป็นพื้นฐานทางทฤษฎีของเทคโนโลยีสารกึ่งตัวนำ"],
    [1904, "เฟลมมิง", "John Ambrose Fleming", "ประดิษฐ์หลอดสุญญากาศไดโอด"],
    [1906, "เดอ ฟอเรสต์", "Lee De Forest", "ประดิษฐ์หลอดสุญญากาศไทรโอด ยุคของเทคโนโลยีหลอดสุญญากาศได้เริ่มขึ้นแล้ว"],
    [1912, "อาร์มสตรอง", "Edwin Armstrong", "ประดิษฐ์วงจรขยายแบบรีเจนเนอเรทีฟ นับเป็นก้าวสำคัญในวงการอิเล็กทรอนิกส์และวิทยุ"],
    [1917, "ไอน์สไตน์", "Albert Einstein", "ค้นพบทฤษฎีการแผ่รังสีเมื่อถูกกระตุ้น (stimulated emission) ซึ่งเป็นหลักการของเลเซอร์"],
    [1924, "สวอริคิน", "Vladimir Zworykin", "ประดิษฐ์หลอดภาพ เป็นจุดเริ่มต้นของเทคโนโลยีโทรทัศน์"],
    [1927, "แบล็ก", "Harold Black", "ประดิษฐ์วงจรขยายที่ใช้การป้อนกลับแบบลบ (negative feedback amplifier) ทำให้วงจรแอนะล็อกรักษาคุณภาพของสัญญาณได้"],
    [1937, "แชนนอน", "Claude Shannon", "เสนอ Switching Algebra ซึ่งเป็นทฤษฎีพื้นฐานของระบบดิจิทัลที่เกิดขึ้นในเวลาต่อมา", true],
    [1940, "วัตสัน-วัตต์", "Robert Watson-Watt", "ประดิษฐ์เรดาร์ เป็นจุดเริ่มต้นของเทคโนโลยีการนำร่องและนำวิถี"],
    [1946, "เอกเคิร์ต และมอคลี", "J. Presper Eckert, John Mauchly", "ประดิษฐ์คอมพิวเตอร์อิเล็กทรอนิกส์แบบดิจิทัลเครื่องแรก ยุคของระบบดิจิทัลได้เริ่มขึ้นแล้ว", true],
    [1947, "ชอกลีย์, บาร์ดีน, แบรตเทน", "Shockley, Bardeen, Brattain", "ประดิษฐ์ทรานซิสเตอร์ ยุคของสารกึ่งตัวนำได้เริ่มขึ้นแล้ว", true],
    [1953, "ทาวน์ส", "Charles Townes", "ประดิษฐ์เมเซอร์ เป็นการนำทางไปสู่การประดิษฐ์เลเซอร์"],
    [1954, "เพียร์สัน", "Gerald Pearson", "ประดิษฐ์เซลล์แสงอาทิตย์ ขยายขอบเขตของอิเล็กทรอนิกส์ไปสู่โลกของไฟฟ้ากำลัง"],
    [1958, "คิลบี และนอยส์", "Jack Kilby, Robert Noyce", "ประดิษฐ์วงจรรวมหรือไอซี (Integrated Circuit: IC) ยุคของไมโครอิเล็กทรอนิกส์ได้เริ่มต้นแล้ว", true],
    [1960, "ไมแมน", "Theodore Maiman", "ประดิษฐ์ Ruby Laser ขยายขอบเขตของอิเล็กทรอนิกส์ไปสู่อุปกรณ์ทางแสงและการสื่อสารด้วยลำแสง"],
    [1963, "ฮอฟสไตน์, ไฮแมน", "Hofstein, Heiman", "ประดิษฐ์ MOS Transistor อุปกรณ์ที่ถูกนำไปใช้ในวงจรไอซีแบบดิจิทัล", true],
    [1969, "ฮอฟฟ์", "Ted Hoff", "ประดิษฐ์ไมโครโพรเซสเซอร์ พลิกโฉมระบบคอมพิวเตอร์ให้เข้าสู่ยุคไมโครคอมพิวเตอร์", true],
  ];
  const ERAS = [
    [1920, 1950, "หลอดสุญญากาศ", "#7c3aed"],
    [1950, 1970, "ทรานซิสเตอร์", "#0ea5e9"],
    [1970, 1980, "ไอซี", "#12b886"],
    [1980, 1995, "VLSI →", "#e8590c"],
  ];
  W.timeline = function (el) {
    const body = shell(el, "INTERACTIVE", "ไทม์ไลน์การค้นพบและการประดิษฐ์ทางอิเล็กทรอนิกส์",
      "คลิกที่จุดบนเส้นเวลา หรือใช้ปุ่ม ◀ ▶ เพื่อดูรายละเอียดแต่ละเหตุการณ์ (จุดสีส้ม = เหตุการณ์สำคัญต่อระบบดิจิทัล)");
    const Wd = 940, Ht = 230, x0 = 30, x1 = 910, y0 = 1860, y1 = 1995;
    const X = (y) => x0 + ((y - y0) / (y1 - y0)) * (x1 - x0);
    const svg = svgBox(body, Wd, Ht);
    let idx = 15, showLag = false;
    const lagG = S("g", null, svg);
    ERAS.forEach(([a, b, name, c]) => {
      S("rect", { x: X(a), y: 150, width: X(b) - X(a), height: 26, fill: c, opacity: 0.18, rx: 4 }, svg);
      S("text", { x: (X(a) + X(b)) / 2, y: 168, "text-anchor": "middle", class: "s-text", style: "font-size:12px;font-weight:600", fill: c, text: name }, svg);
    });
    S("line", { x1: x0, x2: x1, y1: 150, y2: 150, class: "s-axis" }, svg);
    for (let y = 1860; y <= 1990; y += 10) {
      S("line", { x1: X(y), x2: X(y), y1: 150, y2: 155, class: "s-axis" }, svg);
      S("text", { x: X(y), y: 195, "text-anchor": "middle", class: "s-mono", text: y }, svg);
    }
    const dots = EVENTS.map((e, i) => {
      const g = S("g", { style: "cursor:pointer", tabindex: 0 }, svg);
      const lane = i % 4;
      const ty = 130 - lane * 26;
      S("line", { x1: X(e[0]), x2: X(e[0]), y1: 150, y2: ty + 6, class: "s-dim" }, g);
      const c = S("circle", { cx: X(e[0]), cy: ty, r: 7, fill: e[4] ? "var(--accent)" : "var(--brand)", stroke: "var(--surface)", "stroke-width": 2 }, g);
      S("text", { x: X(e[0]) + 10, y: ty + 4, class: "s-mono", style: "font-size:11px", text: e[0] }, g);
      g.addEventListener("click", () => { idx = i; draw(); });
      g.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { idx = i; draw(); } });
      return c;
    });
    const card = H("div", { class: "callout note", style: "min-height:96px" });
    const nav = H("div", { class: "controls" });
    const prev = H("button", { class: "btn sm", type: "button" }, "◀ ก่อนหน้า");
    const next = H("button", { class: "btn sm", type: "button" }, "ถัดไป ▶");
    const lag = H("button", { class: "btn sm", type: "button", "aria-pressed": "false" }, "แสดงช่วงเวลากว่าจะแพร่หลาย");
    prev.onclick = () => { idx = (idx + EVENTS.length - 1) % EVENTS.length; draw(); };
    next.onclick = () => { idx = (idx + 1) % EVENTS.length; draw(); };
    lag.onclick = () => { showLag = !showLag; lag.setAttribute("aria-pressed", showLag); drawLag(); };
    nav.append(prev, next, lag);
    body.append(nav, card);
    function drawLag() {
      lagG.innerHTML = "";
      if (!showLag) return;
      [[1947, 1960, "ทรานซิสเตอร์"], [1958, 1970, "ไอซี"], [1969, 1980, "ไมโครโพรเซสเซอร์"]].forEach(([a, b, n], k) => {
        const y = 212 + 0 * k;
        const yy = 206 + k * 8;
        S("line", { x1: X(a), x2: X(b), y1: yy, y2: yy, stroke: "var(--accent)", "stroke-width": 3, "stroke-linecap": "round" }, lagG);
        S("circle", { cx: X(b), cy: yy, r: 4, fill: "var(--accent)" }, lagG);
      });
      card.insertAdjacentHTML("beforeend", "");
    }
    function draw() {
      dots.forEach((c, i) => { c.setAttribute("r", i === idx ? 11 : 7); c.setAttribute("stroke-width", i === idx ? 3 : 2); });
      const e = EVENTS[idx];
      card.innerHTML = `<div class="tag">ค.ศ. ${e[0]} · เหตุการณ์ที่ ${idx + 1}/${EVENTS.length}</div>
        <div><b>${e[1]}</b> <em class="en">(${e[2]})</em></div><div>${e[3]}</div>` +
        (showLag ? `<p style="margin:.6em 0 0;font-size:14px;color:var(--ink-2)">แถบสีส้มด้านล่าง: ทรานซิสเตอร์ 1947 → แพร่หลาย 1960s · ไอซี 1958 → 1970s · ไมโครโพรเซสเซอร์ 1969 → 1980s</p>` : "");
      drawLag();
    }
    draw();
  };

  /* =====================================================
     2) แอนะล็อก → ค่าตัวอย่าง → รหัสดิจิทัล (รูปที่ 1.1–1.2)
     ===================================================== */
  const TEMP = [74, 73.5, 73, 72.2, 71.2, 70.3, 70.7, 72.6, 78, 83.5, 88, 91.6, 94.2, 95.5, 95.6, 95.1, 94, 92.3, 89.8, 86, 81.8, 77.8, 74.6, 72.6, 71.2];
  function tempAt(t) { // Catmull-Rom through hourly points
    const i = Math.min(23, Math.max(0, Math.floor(t))), u = t - i;
    const p0 = TEMP[Math.max(0, i - 1)], p1 = TEMP[i], p2 = TEMP[i + 1], p3 = TEMP[Math.min(24, i + 2)];
    return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
  }
  W.sampling = function (el) {
    const body = shell(el, "INTERACTIVE", "จากปริมาณแอนะล็อกสู่ตัวแทนข้อมูลดิจิทัล",
      "เส้นสีฟ้าคืออุณหภูมิที่เปลี่ยนแปลงต่อเนื่อง (แอนะล็อก) ปรับระยะห่างการสุ่มค่าตัวอย่าง (sampling) และจำนวนบิต แล้วสังเกตว่าข้อมูลดิจิทัลแทนกราฟเดิมได้ใกล้เคียงแค่ไหน");
    const st = { dt: 1, bits: 4, analog: true, samples: true, stairs: false };
    const Wd = 940, Ht = 330, L = 56, R = 920, T = 20, B = 280, vmin = 68, vmax = 100;
    const X = (t) => L + (t / 24) * (R - L), Y = (v) => B - ((v - vmin) / (vmax - vmin)) * (B - T);
    const svg = svgBox(body, Wd, Ht);
    const g = S("g", null, svg);
    const ctr = H("div", { class: "controls" });
    ctr.append(
      slider("สุ่มทุก ๆ", 1, 4, 1, st.dt, (v) => { st.dt = v; draw(); }, (v) => v + " ชม."),
      slider("จำนวนบิต", 2, 8, 1, st.bits, (v) => { st.bits = v; draw(); }, (v) => v + " บิต (" + (1 << v) + " ระดับ)"),
    );
    const tg = (k, label) => {
      const b = H("button", { class: "btn sm", type: "button", "aria-pressed": String(st[k]) }, label);
      b.onclick = () => { st[k] = !st[k]; b.setAttribute("aria-pressed", st[k]); draw(); };
      return b;
    };
    ctr.append(tg("analog", "สัญญาณแอนะล็อก"), tg("samples", "ค่าตัวอย่าง"), tg("stairs", "สร้างกลับจากรหัส"));
    const ro = readout([["n", "จำนวนค่าตัวอย่าง"], ["bits", "ข้อมูลทั้งหมด"], ["step", "ความละเอียด 1 ระดับ"], ["err", "ความคลาดเคลื่อนสูงสุด"]]);
    const codes = H("div", { class: "table-wrap", style: "margin-top:12px;max-height:220px;overflow:auto" });
    body.append(ctr, ro, codes);

    function draw() {
      g.innerHTML = "";
      for (let v = 70; v <= 100; v += 5) {
        S("line", { x1: L, x2: R, y1: Y(v), y2: Y(v), class: "s-grid" }, g);
        S("text", { x: L - 8, y: Y(v) + 4, "text-anchor": "end", class: "s-mono", text: v }, g);
      }
      for (let t = 0; t <= 24; t += 2) {
        S("line", { x1: X(t), x2: X(t), y1: T, y2: B, class: "s-grid" }, g);
        S("text", { x: X(t), y: B + 18, "text-anchor": "middle", class: "s-mono", text: t + ":00" }, g);
      }
      S("text", { x: L, y: 12, class: "s-text", text: "อุณหภูมิ (°F)" }, g);
      S("text", { x: R, y: B + 40, "text-anchor": "end", class: "s-text", text: "เวลา (ชั่วโมง)" }, g);
      S("path", { d: `M${L},${T} V${B} H${R}`, class: "s-axis" }, g);
      const levels = 1 << st.bits, step = (vmax - vmin) / (levels - 1);
      const q = (v) => Math.round((v - vmin) / step);
      if (st.analog) {
        let d = "";
        for (let t = 0; t <= 24.001; t += 0.1) d += (t ? " L" : "M") + X(t).toFixed(1) + "," + Y(tempAt(t)).toFixed(1);
        S("path", { d, class: "s-wave" }, g);
      }
      const pts = [];
      for (let t = 0; t <= 24; t += st.dt) pts.push(t);
      if (st.stairs) {
        let d = "";
        pts.forEach((t, i) => {
          const y = Y(vmin + q(tempAt(t)) * step), xa = X(t), xb = X(Math.min(24, t + st.dt));
          d += (i ? ` V${y}` : `M${xa},${y}`) + ` H${xb}`;
        });
        S("path", { d, class: "s-wave2" }, g);
      }
      let maxErr = 0;
      pts.forEach((t) => {
        const v = tempAt(t), qv = vmin + q(v) * step;
        maxErr = Math.max(maxErr, Math.abs(v - qv));
        if (st.samples) {
          S("line", { x1: X(t), x2: X(t), y1: B, y2: Y(v), stroke: "var(--accent)", "stroke-width": 2, opacity: 0.55 }, g);
          S("circle", { cx: X(t), cy: Y(v), r: 4.5, fill: "var(--accent)" }, g);
        }
      });
      ro.refs.n.textContent = pts.length + " ค่า";
      ro.refs.bits.textContent = pts.length * st.bits + " บิต";
      ro.refs.step.textContent = DLD.fmt(step, 2) + " °F";
      ro.refs.err.textContent = "±" + DLD.fmt(maxErr, 2) + " °F";
      codes.innerHTML = `<table class="data"><thead><tr><th>เวลา</th><th>ค่าที่วัดได้ (°F)</th><th>ระดับที่ (0–${levels - 1})</th><th>รหัสดิจิทัล ${st.bits} บิต</th></tr></thead><tbody>` +
        pts.map((t) => { const v = tempAt(t), k = q(v); return `<tr><td class="num">${String(t).padStart(2, "0")}:00</td><td class="num">${v.toFixed(1)}</td><td class="num">${k}</td><td class="num" style="color:var(--brand);font-weight:700;letter-spacing:.08em">${k.toString(2).padStart(st.bits, "0")}</td></tr>`; }).join("") +
        "</tbody></table>";
    }
    draw();
  };

  /* =====================================================
     3) สัญญาณรบกวน: แอนะล็อก vs ดิจิทัล (หัวข้อ 1.4)
     ===================================================== */
  W.noise = function (el) {
    const body = shell(el, "INTERACTIVE", "ทำไมดิจิทัลจึงทนต่อสัญญาณรบกวน (noise)",
      "ส่งสัญญาณผ่านสายส่ง/ตัวทวนสัญญาณ (repeater) หลายช่วง แต่ละช่วงมี noise ปนเข้ามา — แอนะล็อกสะสม noise ไปเรื่อย ๆ ส่วนดิจิทัลแค่ตัดสินว่าเป็น 0 หรือ 1 แล้วสร้างสัญญาณใหม่ที่สะอาด");
    const BITS = [1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1]; // 10110011101 (รูปที่ 1.4)
    const st = { amp: 0.12, stages: 3, seed: 7 };
    const Wd = 940, Ht = 360;
    const svg = svgBox(body, Wd, Ht);
    const g = S("g", null, svg);
    const ctr = H("div", { class: "controls" });
    const reseed = H("button", { class: "btn sm", type: "button" }, "🎲 สุ่ม noise ใหม่");
    reseed.onclick = () => { st.seed = (Math.random() * 1e9) | 0; draw(); };
    ctr.append(
      slider("ความแรงของ noise", 0, 0.4, 0.01, st.amp, (v) => { st.amp = v; draw(); }, (v) => Math.round(v * 100) + "%"),
      slider("จำนวนช่วงส่งต่อ", 1, 8, 1, st.stages, (v) => { st.stages = v; draw(); }, (v) => v + " ช่วง"),
      reseed,
    );
    const ro = readout([["aerr", "แอนะล็อก: ความผิดเพี้ยนเฉลี่ย"], ["derr", "ดิจิทัล: บิตที่ผิด"]]);
    body.append(ctr, ro);
    const N = 440, x0 = 110, x1 = 920;
    const X = (i) => x0 + (i / (N - 1)) * (x1 - x0);
    const music = (i) => { const t = i / N; return 0.5 + 0.28 * Math.sin(2 * Math.PI * 3 * t) + 0.14 * Math.sin(2 * Math.PI * 7.3 * t + 1) + 0.06 * Math.sin(2 * Math.PI * 13 * t); };
    function lane(y0, hgt, arr, cls, extra) {
      let d = "";
      arr.forEach((v, i) => (d += (i ? " L" : "M") + X(i).toFixed(1) + "," + (y0 + hgt - v * hgt).toFixed(1)));
      return S("path", Object.assign({ d, class: cls }, extra || {}), g);
    }
    function draw() {
      g.innerHTML = "";
      const r = DLD.rng(st.seed);
      // analog: noise adds up each stage
      const clean = [...Array(N)].map((_, i) => music(i));
      const noisy = clean.map((v) => { let s = v; for (let k = 0; k < st.stages; k++) s += st.amp * 0.5 * r.gauss(); return s; });
      // digital: regenerate at each stage
      const per = N / BITS.length;
      const dClean = [...Array(N)].map((_, i) => BITS[Math.min(BITS.length - 1, Math.floor(i / per))]);
      let bits = BITS.slice(), lastRx = null;
      for (let k = 0; k < st.stages; k++) {
        const noiseBit = BITS.map(() => st.amp * 1.6 * r.gauss()); // noise at decision point
        const rx = [...Array(N)].map((_, i) => { const b = Math.min(BITS.length - 1, Math.floor(i / per)); return bits[b] + (k === st.stages - 1 ? 0.35 * noiseBit[b] + st.amp * 0.9 * r.gauss() : 0); });
        bits = bits.map((b, j) => (b + noiseBit[j] > 0.5 ? 1 : 0));
        lastRx = rx;
      }
      const dOut = [...Array(N)].map((_, i) => bits[Math.min(BITS.length - 1, Math.floor(i / per))]);
      const errs = bits.reduce((a, b, j) => a + (b !== BITS[j] ? 1 : 0), 0);
      const aerr = clean.reduce((a, v, i) => a + Math.abs(v - noisy[i]), 0) / N;
      // labels
      const rows = [[20, "แอนะล็อก", "ต้นทาง"], [100, "", "ปลายทาง"], [200, "ดิจิทัล", "ปลายทาง (ก่อนตัดสิน)"], [280, "", "หลังสร้างใหม่"]];
      rows.forEach(([y, a, b]) => {
        if (a) S("text", { x: 4, y: y + 14, class: "s-text", style: "font-weight:700", text: a }, g);
        S("text", { x: 4, y: y + 34, class: "s-text", style: "font-size:12px", text: b }, g);
        S("line", { x1: x0, x2: x1, y1: y + 60, y2: y + 60, class: "s-grid" }, g);
      });
      lane(20, 60, clean, "s-wave");
      lane(100, 60, noisy.map((v) => Math.max(-0.3, Math.min(1.3, v))), "s-wave2");
      S("line", { x1: x0, x2: x1, y1: 200 + 60 - 0.5 * 60, y2: 200 + 60 - 0.5 * 60, class: "s-dim" }, g);
      S("text", { x: x1, y: 200 + 26, "text-anchor": "end", class: "s-mono", style: "font-size:10px", text: "threshold" }, g);
      lane(200, 60, lastRx.map((v) => Math.max(-0.4, Math.min(1.4, v))), "s-wave2", { "stroke-width": 1.4 });
      lane(280, 60, dOut, "s-hi");
      BITS.forEach((b, j) => {
        const xm = X((j + 0.5) * per);
        const bad = bits[j] !== b;
        if (bad) S("rect", { x: X(j * per), y: 276, width: X(per) - X(0), height: 72, fill: "var(--bad)", opacity: 0.15 }, g);
        S("text", { x: xm, y: 356, "text-anchor": "middle", class: "s-mono", style: `font-weight:700;fill:${bad ? "var(--bad)" : "var(--ink-2)"}`, text: bits[j] }, g);
        S("text", { x: xm, y: 196, "text-anchor": "middle", class: "s-mono", style: "font-size:11px;fill:var(--ink-3)", text: b }, g);
      });
      ro.refs.aerr.textContent = Math.round(aerr * 100) + "%";
      ro.refs.derr.textContent = errs + " / " + BITS.length + " บิต";
      ro.refs.derr.style.color = errs ? "var(--bad)" : "var(--hi)";
    }
    draw();
  };

  /* =====================================================
     4) ระดับลอจิก (รูปที่ 1.5)
     ===================================================== */
  const FAMILIES = {
    book: { name: "ตัวอย่างในเอกสาร (TTL 5 V)", vdd: 5, vlmax: 0.8, vhmin: 2.0 },
    cmos: { name: "CMOS ซีรีส์ 4000 @ 5 V", vdd: 5, vlmax: 1.5, vhmin: 3.5 },
  };
  W.logiclevel = function (el) {
    const body = shell(el, "INTERACTIVE", "ระดับลอจิก: แรงดันเท่าไรจึงเป็น 0 หรือ 1",
      "เลื่อนแรงดันอินพุต แล้วดูว่าระบบตีความเป็น LOW, HIGH หรืออยู่ในช่วงที่ไม่สามารถตีความได้ — ลองเปลี่ยนชนิดของอุปกรณ์เพื่อดูว่าช่วงแรงดันไม่เท่ากัน");
    const st = { fam: "book", v: 3.5, quiz: null };
    const svg = svgBox(body, 940, 250);
    const g = S("g", null, svg);
    const ctr = H("div", { class: "controls" });
    const famSeg = seg(Object.entries(FAMILIES).map(([k, f]) => [k, f.name]), st.fam, (k) => { st.fam = k; st.v = Math.min(st.v, FAMILIES[k].vdd); sl.input.max = FAMILIES[k].vdd; draw(); });
    const sl = slider("แรงดันอินพุต", 0, 5, 0.05, st.v, (v) => { st.v = v; st.quiz = null; qbox.innerHTML = ""; draw(); }, (v) => v.toFixed(2) + " V");
    ctr.append(famSeg, sl);
    const qrow = H("div", { class: "controls" });
    const qbtn = H("button", { class: "btn sm", type: "button" }, "🎯 ทายผล: สุ่มแรงดัน");
    const qbox = H("span");
    qrow.append(qbtn, qbox);
    body.append(ctr, qrow);
    qbtn.onclick = () => {
      const f = FAMILIES[st.fam];
      st.v = Math.round(Math.random() * f.vdd * 20) / 20;
      st.quiz = true; sl.input.value = st.v; sl.refresh(); draw();
      qbox.innerHTML = "";
      [["LOW", "ลอจิก 0"], ["X", "ตีความไม่ได้"], ["HIGH", "ลอจิก 1"]].forEach(([k, t]) => {
        const b = H("button", { class: "btn sm", type: "button" }, t);
        b.onclick = () => {
          const ans = classify(st.v, f);
          st.quiz = null; draw();
          qbox.innerHTML = ans === k ? `<span class="pill hi">ถูกต้อง ✓</span>` : `<span class="pill bad">ยังไม่ถูก — ${st.v.toFixed(2)} V คือ ${label(ans)}</span>`;
        };
        qbox.appendChild(b);
      });
    };
    const classify = (v, f) => (v <= f.vlmax ? "LOW" : v >= f.vhmin ? "HIGH" : "X");
    const label = (c) => ({ LOW: "LOW (ลอจิก 0)", HIGH: "HIGH (ลอจิก 1)", X: "ช่วงที่ตีความไม่ได้" }[c]);
    function draw() {
      g.innerHTML = "";
      const f = FAMILIES[st.fam];
      const L = 70, R = 640, Y0 = 120, Hh = 50;
      const X = (v) => L + (v / f.vdd) * (R - L);
      S("rect", { x: X(0), y: Y0, width: X(f.vlmax) - X(0), height: Hh, fill: "var(--lo)", opacity: 0.35, rx: 6 }, g);
      S("rect", { x: X(f.vlmax), y: Y0, width: X(f.vhmin) - X(f.vlmax), height: Hh, fill: "var(--bad)", opacity: 0.18 }, g);
      S("rect", { x: X(f.vhmin), y: Y0, width: X(f.vdd) - X(f.vhmin), height: Hh, fill: "var(--hi)", opacity: 0.35, rx: 6 }, g);
      S("text", { x: (X(0) + X(f.vlmax)) / 2, y: Y0 + 30, "text-anchor": "middle", class: "s-text", style: "font-weight:700", text: "LOW" }, g);
      S("text", { x: (X(f.vlmax) + X(f.vhmin)) / 2, y: Y0 + 30, "text-anchor": "middle", class: "s-text", style: "font-weight:700;fill:var(--bad)", text: "ตีความไม่ได้" }, g);
      S("text", { x: (X(f.vhmin) + X(f.vdd)) / 2, y: Y0 + 30, "text-anchor": "middle", class: "s-text", style: "font-weight:700", text: "HIGH" }, g);
      [[0, "VL(min)"], [f.vlmax, "VL(max)"], [f.vhmin, "VH(min)"], [f.vdd, "VH(max)"]].forEach(([v, n], i) => {
        S("line", { x1: X(v), x2: X(v), y1: Y0 - 8, y2: Y0 + Hh + 8, class: "s-axis" }, g);
        S("text", { x: X(v), y: Y0 + Hh + 26, "text-anchor": "middle", class: "s-mono", text: v.toFixed(1) + " V" }, g);
        S("text", { x: X(v), y: Y0 - 14, "text-anchor": "middle", class: "s-mono", style: "font-size:11px;fill:var(--brand)", text: n }, g);
      });
      if (!st.quiz) {
        const x = X(st.v);
        S("path", { d: `M${x},${Y0 - 34} l-8,-14 h16 z`, fill: "var(--accent)" }, g);
        S("line", { x1: x, x2: x, y1: Y0 - 34, y2: Y0 + Hh, stroke: "var(--accent)", "stroke-width": 2.5 }, g);
        S("text", { x, y: Y0 - 54, "text-anchor": "middle", class: "s-mono", style: "font-weight:700;fill:var(--accent);font-size:13px", text: st.v.toFixed(2) + " V" }, g);
      } else {
        S("text", { x: (L + R) / 2, y: 50, "text-anchor": "middle", class: "s-text", style: "font-size:22px;font-weight:700;fill:var(--accent)", text: `แรงดัน ${st.v.toFixed(2)} V  ตีความเป็นอะไร?` }, g);
      }
      // indicator panel
      const c = classify(st.v, f);
      const px = 700;
      S("rect", { x: px, y: 60, width: 220, height: 150, rx: 14, fill: "var(--surface-2)", stroke: "var(--line)" }, g);
      S("text", { x: px + 110, y: 86, "text-anchor": "middle", class: "s-text", text: "ระบบอ่านค่าได้เป็น" }, g);
      if (st.quiz) {
        S("text", { x: px + 110, y: 150, "text-anchor": "middle", class: "s-mono", style: "font-size:40px;font-weight:700", text: "?" }, g);
      } else {
        const col = c === "HIGH" ? "var(--hi)" : c === "LOW" ? "var(--lo)" : "var(--bad)";
        S("circle", { cx: px + 50, cy: 140, r: 22, fill: col, opacity: c === "LOW" ? 0.5 : 1 }, g);
        S("text", { x: px + 85, y: 135, class: "s-mono", style: `font-size:24px;font-weight:700;fill:${col}`, text: c === "X" ? "???" : c }, g);
        S("text", { x: px + 85, y: 160, class: "s-text", style: "font-size:13px", text: c === "HIGH" ? "ลอจิก 1" : c === "LOW" ? "ลอจิก 0" : "ไม่รับรู้/ไม่แน่นอน" }, g);
      }
    }
    draw();
  };

  /* =====================================================
     5) สัญญาณนาฬิกาและพัลส์ (หัวข้อ 1.6, รูปที่ 1.7–1.9)
     ===================================================== */
  W.pulse = function (el) {
    const body = shell(el, "INTERACTIVE", "เครื่องกำเนิดพัลส์: คาบเวลา ความถี่ และดิวตี้ไซเคิล",
      "ปรับคาบเวลา T และความกว้างพัลส์ tw แล้วดูค่า f = 1/T และดิวตี้ไซเคิล — เปิดโหมด “พัลส์ไม่เป็นอุดมคติ” เพื่อดู rise time, fall time และจุดวัด 10%/50%/90%");
    const st = { T: 10, tw: 1, pol: "pos", ideal: true, tr: 8 };
    const svg = svgBox(body, 940, 300);
    const g = S("g", null, svg);
    const ctr = H("div", { class: "controls" });
    const sT = slider("คาบเวลา T", 2, 20, 1, st.T, (v) => { st.T = v; if (st.tw >= v) { st.tw = v - 0.5; sW.input.value = st.tw; sW.refresh(); } sW.input.max = v - 0.5; draw(); }, (v) => v + " ms");
    const sW = slider("ความกว้าง tw", 0.5, 9.5, 0.5, st.tw, (v) => { st.tw = v; draw(); }, (v) => v + " ms");
    sW.input.max = st.T - 0.5;
    const pol = seg([["pos", "พัลส์แบบบวก"], ["neg", "พัลส์แบบลบ"]], st.pol, (v) => { st.pol = v; draw(); });
    const mode = seg([[true, "พัลส์ในอุดมคติ"], [false, "พัลส์ไม่เป็นอุดมคติ"]], st.ideal, (v) => { st.ideal = v; trl.style.display = v ? "none" : ""; draw(); });
    const trl = slider("tr = tf", 2, 20, 1, st.tr, (v) => { st.tr = v; draw(); }, (v) => v + "% ของ T");
    trl.style.display = "none";
    const preset = H("button", { class: "btn sm", type: "button" }, "ตั้งค่าตามตัวอย่างที่ 1.1");
    preset.onclick = () => {
      Object.assign(st, { T: 10, tw: 1, pol: "pos", ideal: true });
      sT.input.value = 10; sT.refresh(); sW.input.max = 9.5; sW.input.value = 1; sW.refresh(); pol.set("pos"); mode.set(true); trl.style.display = "none"; draw();
    };
    ctr.append(sT, sW, pol, mode, trl, preset);
    const ro = readout([["T", "คาบเวลา T"], ["f", "ความถี่ f = 1/T"], ["d", "ดิวตี้ไซเคิล (tw/T)×100%"]]);
    body.append(ctr, ro);
    function draw() {
      g.innerHTML = "";
      const tr = st.ideal ? 0 : (st.tr / 100) * st.T;
      const L = 60, R = 920, yH = 70, yL = 220, pad = 1 + tr / 2, span = 2.4 * st.T + 2 * pad;
      const X = (t) => L + ((t + pad) / span) * (R - L);
      const pos = st.pol === "pos";
      const base = pos ? yL : yH, act = pos ? yH : yL;
      // waveform: pulses start at t=0, T, 2T
      let d = `M${L},${base}`;
      for (let k = 0; k < 3; k++) {
        const t0 = k * st.T;
        if (X(t0) > R) break;
        d += ` L${X(t0 - tr / 2)},${base} L${X(t0 + tr / 2)},${act} L${X(t0 + st.tw - tr / 2)},${act} L${X(t0 + st.tw + tr / 2)},${base}`;
      }
      d += ` L${R},${base}`;
      // axis
      S("line", { x1: L, x2: R, y1: 252, y2: 252, class: "s-axis" }, g);
      S("text", { x: R, y: 272, "text-anchor": "end", class: "s-mono", text: "t (ms)" }, g);
      for (let t = 0; t <= span; t += st.T > 10 ? 5 : st.T > 5 ? 2 : 1) {
        if (X(t) > R - 56) break;
        S("line", { x1: X(t), x2: X(t), y1: 248, y2: 256, class: "s-axis" }, g);
        S("text", { x: X(t), y: 272, "text-anchor": "middle", class: "s-mono", text: t }, g);
      }
      S("text", { x: 8, y: yH + 4, class: "s-mono", text: "HIGH" }, g);
      S("text", { x: 8, y: yL + 4, class: "s-mono", text: "LOW" }, g);
      if (!st.ideal) {
        [[0.1, "10%"], [0.5, "50%"], [0.9, "90%"]].forEach(([p, n]) => {
          const y = yL - p * (yL - yH);
          S("line", { x1: L, x2: R, y1: y, y2: y, class: "s-dim" }, g);
          S("text", { x: R - 2, y: y - 4, "text-anchor": "end", class: "s-mono", style: "font-size:11px", text: n }, g);
        });
        // tr / tf annotations on first pulse (10%..90%)
        const rise = (p) => X(-tr / 2 + p * tr), fall = (p) => X(st.tw + tr / 2 - p * tr);
        const yy = 238;
        const lead = pos ? "tr" : "tf", trail = pos ? "tf" : "tr";
        S("path", { d: `M${rise(0.1)},${yy} H${rise(0.9)}`, stroke: "var(--accent)", "stroke-width": 2 }, g);
        S("text", { x: rise(0.5), y: yy - 4, "text-anchor": "middle", class: "s-mono", style: "fill:var(--accent);font-size:11px", text: lead }, g);
        S("path", { d: `M${fall(0.9)},${yy} H${fall(0.1)}`, stroke: "var(--accent)", "stroke-width": 2 }, g);
        S("text", { x: fall(0.5), y: yy - 4, "text-anchor": "middle", class: "s-mono", style: "fill:var(--accent);font-size:11px", text: trail }, g);
      }
      S("path", { d, class: "s-wave", "stroke-width": 3 }, g);
      // T and tw dimension arrows
      const yT = 26, yW = 48;
      const arrow = (xa, xb, y, txt) => {
        S("line", { x1: xa, x2: xb, y1: y, y2: y, stroke: "var(--accent)", "stroke-width": 1.6, "marker-start": "", }, g);
        S("path", { d: `M${xa},${y} l7,-4 v8 z M${xb},${y} l-7,-4 v8 z`, fill: "var(--accent)" }, g);
        S("line", { x1: xa, x2: xa, y1: y - 8, y2: y + 8, stroke: "var(--accent)" }, g);
        S("line", { x1: xb, x2: xb, y1: y - 8, y2: y + 8, stroke: "var(--accent)" }, g);
        const tx = S("text", { x: (xa + xb) / 2, y: y - 6, "text-anchor": "middle", class: "s-mono", style: "fill:var(--accent);font-weight:700", text: txt }, g);
      };
      arrow(X(0), X(st.T), yT, "T = " + st.T + " ms");
      if (X(st.tw) - X(0) > 26) arrow(X(0), X(st.tw), yW, "tw");
      // edge labels
      const lead = pos ? "rising edge" : "falling edge", trail = pos ? "falling edge" : "rising edge";
      S("text", { x: X(st.T) - 6, y: (yH + yL) / 2, "text-anchor": "end", class: "s-text", style: "font-size:12px", text: "leading edge (" + lead + ") →" }, g);
      if (X(st.T + st.tw) + 6 < R - 140) S("text", { x: X(st.T + st.tw) + 8, y: (yH + yL) / 2 + 18, class: "s-text", style: "font-size:12px", text: "← trailing edge (" + trail + ")" }, g);
      ro.refs.T.textContent = st.T + " ms";
      ro.refs.f.textContent = DLD.eng(1 / (st.T / 1000), "Hz");
      ro.refs.d.textContent = DLD.fmt((st.tw / st.T) * 100, 1) + "%";
    }
    draw();
  };

  /* =====================================================
     6) ไดอะแกรมเวลา (รูปที่ 1.10) + ตัวปฏิบัติการ
     ===================================================== */
  W.timing = function (el) {
    const body = shell(el, "INTERACTIVE", "ไดอะแกรมเวลา: อ่านและสร้างรูปคลื่น",
      "ค่าเริ่มต้นตรงกับรูปที่ 1.10 · คลิกช่องของสัญญาณ A, B, C เพื่อสลับ 0/1 · เลือกปฏิบัติการเพื่อดูเอาต์พุต X และช่วงเวลาที่ X เป็น HIGH (แถบแรเงา)");
    const st = { A: [1, 0, 1, 0, 1, 0, 1, 0], B: [0, 1, 1, 0, 0, 1, 1, 0], C: [0, 0, 0, 1, 1, 1, 1, 0], op: "AND3" };
    const OPS = {
      AND3: ["X = A·B·C (AND)", (a, b, c) => a & b & c],
      OR3: ["X = A+B+C (OR)", (a, b, c) => a | b | c],
      AND2: ["X = A·B", (a, b) => a & b],
      NOTA: ["X = A' (NOT A)", (a) => 1 - a],
    };
    const svg = svgBox(body, 940, 360);
    const g = S("g", null, svg);
    const ctr = H("div", { class: "controls" });
    ctr.append(seg(Object.entries(OPS).map(([k, v]) => [k, v[0]]), st.op, (k) => { st.op = k; draw(); }));
    const rst = H("button", { class: "btn sm", type: "button" }, "คืนค่าตามรูปที่ 1.10");
    rst.onclick = () => { st.A = [1, 0, 1, 0, 1, 0, 1, 0]; st.B = [0, 1, 1, 0, 0, 1, 1, 0]; st.C = [0, 0, 0, 1, 1, 1, 1, 0]; draw(); };
    ctr.append(rst);
    const msg = H("div", { class: "callout tip" });
    body.append(ctr, msg);
    const L = 90, step = 100, yClk = 20, rowH = 64;
    function draw() {
      g.innerHTML = "";
      const out = st.A.map((_, i) => OPS[st.op][1](st.A[i], st.B[i], st.C[i]));
      out.forEach((v, i) => { if (v) S("rect", { x: L + i * step, y: 10, width: step, height: 340, fill: "var(--hi)", opacity: 0.12 }, g); });
      // clock (one pulse per period, rising at start)
      let d = `M${L - 20},${yClk + 30}`;
      for (let i = 0; i < 8; i++) { const x = L + i * step; d += ` H${x} V${yClk} H${x + step / 2} V${yClk + 30}`; }
      d += ` H${L + 8 * step}`;
      S("path", { d, class: "s-wave" }, g);
      S("text", { x: 10, y: yClk + 22, class: "s-text", style: "font-weight:600", text: "Clock" }, g);
      for (let i = 0; i <= 8; i++) S("line", { x1: L + i * step, x2: L + i * step, y1: yClk, y2: 350, class: "s-dim" }, g);
      for (let i = 0; i < 8; i++) S("text", { x: L + i * step + step * 0.75, y: yClk + 46, "text-anchor": "middle", class: "s-mono", style: "fill:var(--accent);font-weight:700", text: i + 1 }, g);
      ["A", "B", "C"].forEach((k, r) => {
        const yH = 84 + r * rowH, yL = yH + 34;
        S("text", { x: 10, y: yL - 8, class: "s-text", style: "font-weight:700;font-style:italic", text: k }, g);
        S("path", { d: DLD.wavePath(st[k], L, step, yH, yL), class: "s-wave" }, g);
        st[k].forEach((b, i) => {
          const hit = S("rect", { x: L + i * step, y: yH - 8, width: step, height: 50, fill: "transparent", style: "cursor:pointer" }, g);
          S("text", { x: L + i * step + step / 2, y: (b ? yH : yL) + (b ? 18 : -8), "text-anchor": "middle", class: "s-mono", style: "font-size:11px;fill:var(--ink-3);pointer-events:none", text: b }, g);
          hit.addEventListener("click", () => { st[k][i] ^= 1; draw(); });
        });
      });
      const yH = 84 + 3 * rowH + 6, yL = yH + 34;
      S("text", { x: 10, y: yL - 8, class: "s-text", style: "font-weight:700;fill:var(--hi)", text: "X" }, g);
      S("path", { d: DLD.wavePath(out, L, step, yH, yL), class: "s-hi" }, g);
      const highs = out.map((v, i) => (v ? i + 1 : 0)).filter(Boolean);
      msg.innerHTML = `<b>${OPS[st.op][0]}</b> เป็น HIGH ในช่วงพัลส์ที่: <b class="mono">${highs.length ? highs.join(", ") : "ไม่มี"}</b>` +
        (st.op === "AND3" ? " — ช่วงที่ A, B และ C เป็น HIGH พร้อมกัน" : st.op === "OR3" ? " — ทุกช่วงที่มีสัญญาณอย่างน้อยหนึ่งตัวเป็น HIGH" : "");
    }
    draw();
  };

  /* =====================================================
     7) สนามทดลองลอจิกเกต NOT / AND / OR (หัวข้อ 1.7)
     ===================================================== */
  W.gates = function (el) {
    const body = shell(el, "INTERACTIVE", "ทดลองตัวปฏิบัติการทางตรรกะ NOT · AND · OR",
      "คลิกสวิตช์อินพุต (หรือคลิกแถวในตารางค่าความจริง) แล้วสังเกตหลอดไฟที่เอาต์พุต · เกต AND และ OR เพิ่มจำนวนอินพุตได้ ส่วนเกต NOT มีอินพุตเดียว");
    const allowed = (el.dataset.gates || "NOT,AND,OR").split(",");
    const st = { type: el.dataset.start || "AND", n: 2, v: [0, 0, 0, 0] };
    const wrap = H("div", { style: "display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:18px;align-items:start" });
    wrap.className = "gate-wrap";
    const left = H("div"), right = H("div");
    wrap.append(left, right);
    const svg = svgBox(left, 520, 260);
    const g = S("g", null, svg);
    const ctr = H("div", { class: "controls" });
    const typeSeg = seg(allowed.map((t) => [t, t]), st.type, (t) => { st.type = t; if (t === "NOT") st.n = 1; else if (st.n < 2) st.n = 2; nSeg.style.display = t === "NOT" ? "none" : ""; draw(); });
    const nSeg = seg([[2, "2 อินพุต"], [3, "3 อินพุต"], [4, "4 อินพุต"]], 2, (n) => { st.n = n; draw(); });
    if (st.type === "NOT") { st.n = 1; nSeg.style.display = "none"; }
    ctr.append(typeSeg, nSeg);
    const info = H("div", { class: "callout note", style: "margin:12px 0 0" });
    body.append(ctr, wrap);
    left.append(info);
    const mq = matchMedia("(max-width: 700px)");
    const lay = () => (wrap.style.gridTemplateColumns = mq.matches ? "1fr" : "minmax(0,1.4fr) minmax(0,1fr)");
    mq.addEventListener("change", lay); lay();

    function draw() {
      g.innerHTML = "";
      const n = st.n, vals = st.v.slice(0, n);
      const out = DLD.evalGate(st.type, vals);
      const gx = 220, cy = 130;
      const tmp = S("g", null, g);
      const geo = DLD.drawGate(tmp, st.type, gx, cy, n);
      // wires behind the gate
      const wires = S("g", null, g);
      g.insertBefore(wires, tmp);
      geo.inputs.forEach((p, i) => {
        const sy = n === 1 ? cy : 40 + (i * 180) / Math.max(1, n - 1);
        const yy = n === 1 ? cy : sy;
        S("path", { d: `M90,${yy} H150 L${gx - 20},${p.y} H${p.x}`, class: vals[i] ? "s-wire1" : "s-wire0" }, wires);
        // switch
        const sw = S("g", { style: "cursor:pointer", tabindex: 0, role: "button", "aria-label": "สลับอินพุต " + DLD.letters(n)[i] }, g);
        S("rect", { x: 28, y: yy - 15, width: 56, height: 30, rx: 15, fill: vals[i] ? "var(--hi)" : "var(--surface-2)", stroke: "var(--line)" }, sw);
        S("circle", { cx: vals[i] ? 69 : 43, cy: yy, r: 11, fill: "#fff", stroke: "var(--line)" }, sw);
        S("text", { x: 12, y: yy + 5, class: "s-mono", style: "font-size:15px;font-weight:700;fill:var(--ink)", text: DLD.letters(n)[i] }, g);
        S("text", { x: 120, y: yy - 6, class: "s-mono", style: `font-size:13px;font-weight:700;fill:${vals[i] ? "var(--hi)" : "var(--lo)"}`, text: vals[i] }, g);
        const tog = () => { st.v[i] ^= 1; draw(); };
        sw.addEventListener("click", tog);
        sw.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tog(); } });
      });
      S("path", { d: `M${geo.output.x},${cy} H440`, class: out ? "s-wire1" : "s-wire0" }, g);
      S("text", { x: geo.output.x + 14, y: cy - 8, class: "s-mono", style: `font-size:13px;font-weight:700;fill:${out ? "var(--hi)" : "var(--lo)"}`, text: out }, g);
      if (out) S("circle", { cx: 468, cy, r: 30, fill: "var(--hi)", opacity: 0.25 }, g);
      S("circle", { cx: 468, cy, r: 20, fill: out ? "var(--hi)" : "var(--surface-2)", stroke: "var(--ink-3)", "stroke-width": 2 }, g);
      S("text", { x: 468, y: cy + 46, "text-anchor": "middle", class: "s-mono", style: "font-weight:700", text: "X = " + out }, g);
      S("text", { x: gx + geo.width / 2, y: cy + geo.height / 2 + 26, "text-anchor": "middle", class: "s-mono", style: "font-size:13px;fill:var(--ink-3)", text: st.type }, g);
      const G = DLD.GATES[st.type];
      info.innerHTML = `<b class="mono">${G.expr(n)}</b><br>${G.rule}` + (st.type === "NOT" ? " — เรียกวงจรนี้ว่า <b>อินเวอร์เตอร์ (inverter)</b>" : "");
      // truth table
      const L = DLD.letters(n);
      const rows = DLD.combos(n);
      right.innerHTML = `<div class="table-wrap"><table class="data" style="text-align:center"><thead><tr>${L.map((l) => `<th style="text-align:center">${l}</th>`).join("")}<th style="text-align:center;color:var(--hi)">X</th></tr></thead><tbody>` +
        rows.map((r, ri) => {
          const cur = r.every((b, k) => b === vals[k]);
          const o = DLD.evalGate(st.type, r);
          return `<tr data-r="${ri}" style="cursor:pointer;${cur ? "background:var(--brand-soft);font-weight:700" : ""}">${r.map((b) => `<td class="num" style="text-align:center">${b}</td>`).join("")}<td class="num" style="text-align:center;color:${o ? "var(--hi)" : "var(--lo)"};font-weight:700">${o}</td></tr>`;
        }).join("") + `</tbody></table></div><p class="w-hint" style="margin-top:8px">${n} อินพุต → ${1 << n} กรณี (2<sup>${n}</sup>)</p>`;
      right.querySelectorAll("tr[data-r]").forEach((tr) => tr.addEventListener("click", () => { rows[+tr.dataset.r].forEach((b, k) => (st.v[k] = b)); draw(); }));
    }
    draw();
  };

  /* =====================================================
     8) แผงทดลอง (breadboard) — ปฏิบัติการสัปดาห์ที่ 1
     ===================================================== */
  W.breadboard = function (el) {
    const body = shell(el, "LAB", "รู้จักแผงทดลอง (breadboard): รูไหนเชื่อมถึงกัน",
      "ชี้หรือแตะที่รูใดก็ได้ — รูที่เชื่อมต่อทางไฟฟ้าถึงกันจะเรืองแสง · เปิด “วางไอซี 14 ขา” เพื่อดูการวางไอซีคร่อมร่องกลางและการนับขา");
    const st = { ic: false, sel: null };
    const COLS = 30, P = 26, ox = 50, oy = 20;
    const Wd = ox * 2 + (COLS - 1) * P + 20;
    const svg = svgBox(body, Wd, 420);
    const g = S("g", null, svg);
    const ctr = H("div", { class: "controls" });
    const icBtn = H("button", { class: "btn sm", type: "button", "aria-pressed": "false" }, "วางไอซี 14 ขา (เช่น 74LS08)");
    icBtn.onclick = () => { st.ic = !st.ic; icBtn.setAttribute("aria-pressed", st.ic); draw(); };
    const info = H("div", { class: "callout note" }, "ชี้ที่รูเพื่อดูกลุ่มที่เชื่อมต่อกัน");
    ctr.append(icBtn);
    body.append(ctr, info);
    // hole model
    const holes = [];
    const railY = { t1: oy, t2: oy + P, b1: oy + 13 * P + 10, b2: oy + 14 * P + 10 };
    const railName = { t1: "รางไฟบน (−)", t2: "รางไฟบน (+)", b1: "รางไฟล่าง (+)", b2: "รางไฟล่าง (−)" };
    Object.entries(railY).forEach(([k, y]) => {
      for (let c = 0; c < COLS; c++) { if (c % 6 === 5) continue; holes.push({ x: ox + c * P, y, net: "rail-" + k, label: railName[k] + " — ทุกรูในแนวนอนเชื่อมถึงกัน" }); }
    });
    const rowsTop = "jihgf", rowsBot = "edcba";
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < 5; r++) {
        holes.push({ x: ox + c * P, y: oy + (3 + r) * P - 6, net: `T${c}`, label: `คอลัมน์ ${c + 1} แถว f–j เชื่อมถึงกัน (5 รูในแนวตั้ง)`, name: rowsTop[r] + (c + 1) });
        holes.push({ x: ox + c * P, y: oy + (8 + r) * P + 6, net: `B${c}`, label: `คอลัมน์ ${c + 1} แถว a–e เชื่อมถึงกัน (5 รูในแนวตั้ง)`, name: rowsBot[r] + (c + 1) });
      }
    }
    function draw() {
      g.innerHTML = "";
      S("rect", { x: 10, y: 2, width: Wd - 20, height: 412, rx: 14, fill: "#f3f1ea", stroke: "#d6d2c4" }, g);
      S("rect", { x: 20, y: oy + 7.5 * P - 6, width: Wd - 40, height: 12, rx: 3, fill: "#e2ddcf" }, g);
      // rail lines
      [["t1", "#3b82f6"], ["t2", "#e03131"], ["b1", "#e03131"], ["b2", "#3b82f6"]].forEach(([k, c]) => {
        const y = railY[k] + (k.endsWith("1") ? (k[0] === "t" ? -12 : -12) : 12);
        S("line", { x1: ox - 10, x2: ox + (COLS - 1) * P + 10, y1: y, y2: y, stroke: c, "stroke-width": 2 }, g);
        S("text", { x: 24, y: railY[k] + 4, style: `font:700 13px var(--mono);fill:${c}`, text: k === "t2" || k === "b1" ? "+" : "−" }, g);
      });
      for (let c = 0; c < COLS; c += 5) {
        S("text", { x: ox + c * P, y: oy + 2 * P + 6, "text-anchor": "middle", style: "font:10px var(--mono);fill:#8a8370", text: c + 1 }, g);
      }
      "jihgf".split("").forEach((r, i) => S("text", { x: 30, y: oy + (3 + i) * P - 2, "text-anchor": "middle", style: "font:10px var(--mono);fill:#8a8370", text: r }, g));
      "edcba".split("").forEach((r, i) => S("text", { x: 30, y: oy + (8 + i) * P + 10, "text-anchor": "middle", style: "font:10px var(--mono);fill:#8a8370", text: r }, g));
      const rects = holes.map((h) => {
        const c = S("rect", { x: h.x - 6, y: h.y - 6, width: 12, height: 12, rx: 2, fill: "#3a3a3a", opacity: 0.75 }, g);
        const hit = S("rect", { x: h.x - 12, y: h.y - 12, width: 24, height: 24, fill: "transparent", style: "cursor:pointer" }, g);
        const pick = () => { st.sel = h.net; info.innerHTML = (h.name ? `<b class="mono">${h.name}</b> · ` : "") + h.label; paint(); };
        hit.addEventListener("mouseenter", pick);
        hit.addEventListener("click", pick);
        return c;
      });
      function paint() {
        holes.forEach((h, i) => {
          const on = st.sel && h.net === st.sel;
          rects[i].setAttribute("fill", on ? "var(--accent)" : "#3a3a3a");
          rects[i].setAttribute("opacity", on ? 1 : 0.75);
        });
      }
      paint();
      if (st.ic) {
        const c0 = 10, w = 6 * P + 16;
        const x = ox + c0 * P - 8, y = oy + 7 * P;
        const icG = S("g", { style: "pointer-events:none" }, g);
        g.appendChild(icG);
        S("rect", { x, y: y - 4, width: w, height: P + 20, rx: 4, fill: "#222", stroke: "#000" }, icG);
        S("path", { d: `M${x},${y + P / 2 - 6} a8,8 0 0 1 0,16 z`, fill: "#555" }, icG);
        S("text", { x: x + w / 2, y: y + P / 2 + 7, "text-anchor": "middle", style: "font:700 12px var(--mono);fill:#ddd", text: "74LS08" }, icG);
        for (let k = 0; k < 7; k++) {
          const px = ox + (c0 + k) * P;
          // bottom row pins 1..7 (left->right), top row pins 14..8
          // pins sit in row e (pins 1–7) and row f (pins 14–8)
          S("rect", { x: px - 4, y: y + P + 14, width: 8, height: 6, fill: "#bbb" }, icG);
          S("rect", { x: px - 4, y: y - 8, width: 8, height: 6, fill: "#bbb" }, icG);
          S("text", { x: px, y: y + P + 12, "text-anchor": "middle", style: "font:700 10px var(--mono);fill:#ffd8a8", text: k + 1 }, icG);
          S("text", { x: px, y: y + 9, "text-anchor": "middle", style: "font:700 10px var(--mono);fill:#ffd8a8", text: 14 - k }, icG);
        }
        S("circle", { cx: x + 10, cy: y + P + 6, r: 3, fill: "#bbb" }, icG);
        S("text", { x: ox + (c0 + 7) * P + 6, y: y + P + 34, style: "font:600 13px var(--font);fill:#5c5640", text: "ขา 7 = GND" }, icG);
        S("text", { x: ox + (c0 + 7) * P + 6, y: y - 12, style: "font:600 13px var(--font);fill:#5c5640", text: "ขา 14 = VCC (+5 V)" }, icG);
      }
    }
    draw();
    body.appendChild(H("p", { class: "w-hint", style: "margin:10px 0 0" },
      "เมื่อวางไอซีคร่อมร่องกลาง ขาแต่ละขาจะอยู่คนละคอลัมน์ จึงไม่ลัดวงจรถึงกัน · ขา 1 อยู่ใกล้รอยบาก/จุด แล้วนับทวนเข็มนาฬิกา · ไอซีตระกูล 74 แบบ 14 ขาส่วนใหญ่ (เช่น 7400, 7404, 7408, 7432) ใช้ขา 14 = V<sub>CC</sub> และขา 7 = GND — ตรวจสอบจาก datasheet ทุกครั้ง"));
  };
})();
