/* =========================================================
   logic.js — reusable logic helpers for all chapters
   - gate symbols (ANSI distinctive shape) drawn as SVG
   - gate evaluation, truth-table generation
   - waveform path helpers
   ========================================================= */
(function () {
  const DLD = (window.DLD = window.DLD || {});
  const S = (...a) => DLD.svg(...a);

  const GATES = {
    NOT:  { arity: [1, 1], fn: (v) => (v[0] ? 0 : 1), expr: (n) => "X = A'", rule: "เอาต์พุตเป็นค่าตรงข้ามกับอินพุต" },
    AND:  { arity: [2, 4], fn: (v) => (v.every(Boolean) ? 1 : 0), expr: (n) => "X = " + letters(n).join("·"), rule: "เอาต์พุตเป็น 1 เฉพาะเมื่อทุกอินพุตเป็น 1" },
    OR:   { arity: [2, 4], fn: (v) => (v.some(Boolean) ? 1 : 0), expr: (n) => "X = " + letters(n).join(" + "), rule: "เอาต์พุตเป็น 1 เมื่อมีอินพุตใดอินพุตหนึ่งเป็น 1" },
    NAND: { arity: [2, 4], fn: (v) => (v.every(Boolean) ? 0 : 1), expr: (n) => "X = (" + letters(n).join("·") + ")'", rule: "ค่าตรงข้ามของ AND" },
    NOR:  { arity: [2, 4], fn: (v) => (v.some(Boolean) ? 0 : 1), expr: (n) => "X = (" + letters(n).join(" + ") + ")'", rule: "ค่าตรงข้ามของ OR" },
    XOR:  { arity: [2, 4], fn: (v) => v.reduce((a, b) => a ^ b, 0), expr: (n) => "X = " + letters(n).join(" ⊕ "), rule: "เอาต์พุตเป็น 1 เมื่อจำนวนอินพุตที่เป็น 1 เป็นเลขคี่" },
    XNOR: { arity: [2, 4], fn: (v) => 1 - v.reduce((a, b) => a ^ b, 0), expr: (n) => "X = (" + letters(n).join(" ⊕ ") + ")'", rule: "ค่าตรงข้ามของ XOR" },
  };
  function letters(n) { return "ABCDEFGH".slice(0, n).split(""); }
  DLD.GATES = GATES;
  DLD.letters = letters;
  DLD.evalGate = (type, inputs) => GATES[type].fn(inputs);

  /* all input combinations, MSB first: n=2 -> [[0,0],[0,1],[1,0],[1,1]] */
  DLD.combos = function (n) {
    const out = [];
    for (let i = 0; i < 1 << n; i++) out.push([...Array(n)].map((_, k) => (i >> (n - 1 - k)) & 1));
    return out;
  };

  /**
   * Draw a gate into SVG group `g`. (x, cy) = left edge / vertical centre.
   * returns { inputs:[{x,y}], output:{x,y}, width }
   */
  DLD.drawGate = function (g, type, x, cy, n, opt) {
    opt = opt || {};
    const cls = opt.cls || "s-gate";
    const h = Math.max(56, n * 22);
    const top = cy - h / 2, bot = cy + h / 2;
    const ins = [];
    const inY = (i) => (n === 1 ? cy : top + (h * (i + 1)) / (n + 1));
    let outX;
    const base = type.replace(/^N(?=AND|OR)/, "").replace(/^XN/, "X");
    const bubble = /^(NOT|NAND|NOR|XNOR)$/.test(type);

    if (type === "NOT") {
      S("path", { d: `M${x},${cy - 24} L${x + 50},${cy} L${x},${cy + 24} Z`, class: cls }, g);
      outX = x + 50;
      ins.push({ x, y: cy });
    } else if (base === "AND") {
      const r = h / 2;
      S("path", { d: `M${x},${top} H${x + 36} A${r},${r} 0 0 1 ${x + 36},${bot} H${x} Z`, class: cls }, g);
      outX = x + 36 + r;
      for (let i = 0; i < n; i++) ins.push({ x, y: inY(i) });
    } else { // OR / XOR
      const k = 16, L = 78;
      const ox = base === "XOR" ? 9 : 0;
      S("path", { d: `M${x + ox},${top} Q${x + ox + L * 0.6},${top} ${x + ox + L},${cy} Q${x + ox + L * 0.6},${bot} ${x + ox},${bot} Q${x + ox + k},${cy} ${x + ox},${top} Z`, class: cls }, g);
      if (base === "XOR") S("path", { d: `M${x},${top} Q${x + k},${cy} ${x},${bot}`, class: cls, fill: "none", style: "fill:none" }, g);
      outX = x + ox + L;
      for (let i = 0; i < n; i++) {
        const y = inY(i), s = (y - top) / h;
        ins.push({ x: x + 2 * s * (1 - s) * k, y }); // ends on the curved back edge
      }
    }
    if (bubble) { S("circle", { cx: outX + 6, cy, r: 6, class: cls }, g); outX += 12; }
    return { inputs: ins, output: { x: outX, y: cy }, width: outX - x, height: h };
  };

  /**
   * Digital waveform path from a bit array.
   * bits: [0,1,1,...], x0, step (px per bit), yHi, yLo
   */
  DLD.wavePath = function (bits, x0, step, yHi, yLo) {
    let d = "";
    bits.forEach((b, i) => {
      const y = b ? yHi : yLo, x = x0 + i * step;
      if (i === 0) d += `M${x},${y}`;
      else d += ` V${y}`;
      d += ` H${x + step}`;
    });
    return d;
  };

  /* seeded PRNG + gaussian (for stable demos) */
  DLD.rng = function (seed) {
    let s = seed >>> 0 || 1;
    const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    r.gauss = () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    return r;
  };
})();
