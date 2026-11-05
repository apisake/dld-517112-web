/* =========================================================
   บทที่ 12 — interactive widgets (Verilog เบื้องต้น)
   vlive · latchdemo · nbsim · vseq
   vlive มีตัวจำลอง Verilog ขนาดเล็ก (เฉพาะ assign และ gate primitive) — ไม่ได้แทนเครื่องมือจริง
   ขีดบน: HTML ใช้ <span class="ov"> · SVG ใช้ {X} ใน txt() — ไม่ใช้อักขระผสม
   ========================================================= */
(function () {
  const DLD = window.DLD, U = DLD.ui, W = DLD.widgets;
  const H = (...a) => DLD.h(...a);
  const S = (...a) => DLD.svg(...a);
  const hl = (on) => (on ? ' style="background:var(--brand-soft);font-weight:700"' : "");
  const bin = (v, n) => (v >>> 0).toString(2).padStart(n, "0").slice(-n);
  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const txt = (g, x, y, t, o) => {
    o = o || {};
    const el = S("text", { x, y, "text-anchor": o.a || "start", class: "s-mono", style: `font-size:${o.size || 14}px;font-weight:${o.w || 700};fill:${o.c || "var(--ink)"}` }, g);
    String(t).split(/(\{[^}]*\})/).forEach((p) => { if (!p) return; S("tspan", p[0] === "{" ? { text: p.slice(1, -1), style: "text-decoration:overline" } : { text: p }, el); });
    return el;
  };
  /* ไฮไลต์ไวยากรณ์อย่างง่าย */
  const KW = /\b(module|endmodule|input|output|inout|wire|reg|assign|always|begin|end|if|else|case|endcase|default|posedge|negedge|or|and|xor|nand|nor|xnor|not|buf|localparam|parameter|initial|integer|for)\b/g;
  function hiCode(src) {
    return src.split("\n").map((line) => {
      const i = line.indexOf("//"); let code = i >= 0 ? line.slice(0, i) : line, cm = i >= 0 ? line.slice(i) : "";
      code = esc(code).replace(/(\d+'[bdhBDH][0-9a-fA-F_]+|\b\d+\b)/g, '<span style="color:#c2410c">$1</span>').replace(KW, '<b style="color:#1d5fa8">$1</b>');
      return code + (cm ? `<span style="color:#5c7f58">${esc(cm)}</span>` : "");
    });
  }
  const codeBox = (lines, hiSet) => `<pre class="mono" style="font-size:13px;line-height:1.5;background:var(--surface-2);padding:10px 12px;border-radius:8px;overflow:auto;margin:0">` +
    lines.map((l, i) => `<span style="display:block;${hiSet && hiSet.has(i) ? "background:#ffe066;color:#111;border-radius:3px" : ""}"><span style="color:var(--ink-3);display:inline-block;width:24px">${i + 1}</span>${l || " "}</span>`).join("") + "</pre>";

  /* =====================================================
     ตัวจำลอง Verilog ขนาดเล็ก: นิพจน์ + โมดูล (assign, gate primitive)
     ===================================================== */
  const TOK = /\s*(\d+'[sS]?[bBdDhHoO][0-9a-fA-F_]+|\d+|[A-Za-z_][A-Za-z0-9_$]*|~\^|\^~|===|!==|==|!=|<=|>=|&&|\|\||<<|>>|[~!&|^?:()\[\]{},+\-*<>])/y;
  function tokenize(s) {
    const out = []; TOK.lastIndex = 0; let m;
    while (TOK.lastIndex < s.length) {
      const pos = TOK.lastIndex; m = TOK.exec(s);
      if (!m) { if (/^\s*$/.test(s.slice(pos))) break; throw new Error(`อ่านไม่ออกที่ “${s.slice(pos, pos + 8).trim()}”`); }
      out.push(m[1]);
    }
    return out;
  }
  const M = (w) => (w >= 32 ? 0xffffffff : 2 ** w - 1);
  const fit = (v, w) => { const m = 2 ** Math.min(w, 32); return (((v % m) + m) % m) >>> 0; };
  function parseNum(t) {
    const m = t.match(/^(\d+)'[sS]?([bBdDhHoO])([0-9a-fA-F_]+)$/);
    if (!m) return { v: +t, w: 32, lit: true };
    const base = { b: 2, d: 10, h: 16, o: 8 }[m[2].toLowerCase()];
    return { v: fit(parseInt(m[3].replace(/_/g, ""), base), +m[1]), w: +m[1] };
  }
  /* คืนฟังก์ชัน (env) => {v, w} */
  function compileExpr(tokens, widths) {
    let i = 0;
    const peek = () => tokens[i], eat = (t) => { if (tokens[i] !== t) throw new Error(`ต้องการ “${t}” แต่พบ “${tokens[i] || "จบบรรทัด"}”`); i++; };
    const bw = (a, b) => Math.max(a.lit ? 1 : a.w, b.lit ? 1 : b.w);
    const bin2 = (f, op, g, wf) => (e) => { const a = f(e), b = g(e); const w = wf ? wf(a, b) : bw(a, b); return { v: fit(op(a.v, b.v), w), w }; };
    function cond() { const c = lor(); if (peek() === "?") { i++; const a = cond(); eat(":"); const b = cond(); return (e) => { const x = c(e); const r = x.v ? a(e) : b(e); return { v: r.v, w: Math.max(a(e).w, b(e).w) }; }; } return c; }
    function lor() { let f = land(); while (peek() === "||") { i++; const g = land(), p = f; f = (e) => ({ v: p(e).v || g(e).v ? 1 : 0, w: 1 }); } return f; }
    function land() { let f = bor(); while (peek() === "&&") { i++; const g = bor(), p = f; f = (e) => ({ v: p(e).v && g(e).v ? 1 : 0, w: 1 }); } return f; }
    function bor() { let f = bxor(); while (peek() === "|") { i++; f = bin2(f, (a, b) => a | b, bxor()); } return f; }
    function bxor() { let f = band(); while (["^", "~^", "^~"].includes(peek())) { const o = tokens[i++]; const g = band(), p = f; f = o === "^" ? bin2(p, (a, b) => a ^ b, g) : (e) => { const a = p(e), b = g(e), w = bw(a, b); return { v: fit(~(a.v ^ b.v), w), w }; }; } return f; }
    function band() { let f = eq(); while (peek() === "&") { i++; f = bin2(f, (a, b) => a & b, eq()); } return f; }
    function eq() { let f = rel(); while (["==", "!=", "===", "!=="].includes(peek())) { const o = tokens[i++], g = rel(), p = f; f = (e) => ({ v: (p(e).v === g(e).v) === (o[0] === "=") ? 1 : 0, w: 1 }); } return f; }
    function rel() { let f = shift(); while (["<", ">", "<=", ">="].includes(peek())) { const o = tokens[i++], g = shift(), p = f; f = (e) => { const a = p(e).v, b = g(e).v; return { v: (o === "<" ? a < b : o === ">" ? a > b : o === "<=" ? a <= b : a >= b) ? 1 : 0, w: 1 }; }; } return f; }
    function shift() { let f = add(); while (["<<", ">>"].includes(peek())) { const o = tokens[i++], g = add(), p = f; f = (e) => { const a = p(e), n = g(e).v; return { v: fit(o === "<<" ? a.v * 2 ** n : Math.floor(a.v / 2 ** n), a.w), w: a.w }; }; } return f; }
    function add() { let f = mul(); while (["+", "-"].includes(peek())) { const o = tokens[i++], g = mul(), p = f; f = (e) => { const a = p(e), b = g(e), w = bw(a, b) + 1; return { v: fit(o === "+" ? a.v + b.v : a.v - b.v, w), w, arith: true }; }; } return f; }
    function mul() { let f = unary(); while (peek() === "*") { i++; const g = unary(), p = f; f = (e) => { const a = p(e), b = g(e), w = (a.lit ? 1 : a.w) + (b.lit ? 1 : b.w); return { v: fit(a.v * b.v, w), w }; }; } return f; }
    function unary() {
      const t = peek();
      if (t === "~") { i++; const f = unary(); return (e) => { const a = f(e); return { v: fit(~a.v, a.w), w: a.w }; }; }
      if (t === "!") { i++; const f = unary(); return (e) => ({ v: f(e).v ? 0 : 1, w: 1 }); }
      if (t === "-") { i++; const f = unary(); return (e) => { const a = f(e); return { v: fit(-a.v, a.w), w: a.w }; }; }
      if (["&", "|", "^"].includes(t)) { i++; const f = unary(); return (e) => { const a = f(e), bits = [...bin(a.v, a.w)].map(Number); const v = t === "&" ? bits.every(Boolean) : t === "|" ? bits.some(Boolean) : bits.reduce((x, y) => x ^ y, 0); return { v: v ? 1 : 0, w: 1 }; }; }
      return primary();
    }
    function primary() {
      const t = tokens[i++];
      if (t === undefined) throw new Error("นิพจน์ไม่ครบ");
      if (t === "(") { const f = cond(); eat(")"); return f; }
      if (t === "{") { const parts = [cond()]; while (peek() === ",") { i++; parts.push(cond()); } eat("}"); return (e) => { let v = 0, w = 0; parts.forEach((p) => { const r = p(e); const rw = r.lit ? 32 : r.w; v = v * 2 ** rw + r.v; w += rw; }); return { v: fit(v, w), w }; }; }
      if (/^\d/.test(t)) { const n = parseNum(t); return () => n; }
      if (/^[A-Za-z_]/.test(t)) {
        if (!(t in widths)) throw new Error(`ไม่รู้จักสัญญาณ “${t}”`);
        if (peek() === "[") {
          i++; const hi = cond(); let lo = null; if (peek() === ":") { i++; lo = cond(); } eat("]");
          return (e) => { const a = e[t] || 0, h = hi(e).v, l = lo ? lo(e).v : h; return { v: fit(Math.floor(a / 2 ** l), h - l + 1), w: h - l + 1 }; };
        }
        return (e) => ({ v: e[t] || 0, w: widths[t] });
      }
      throw new Error(`ไม่คาดว่าจะพบ “${t}”`);
    }
    const f = cond();
    if (i < tokens.length) throw new Error(`มีส่วนเกิน “${tokens[i]}”`);
    return f;
  }
  const PRIM = { and: (a) => a.every(Boolean), or: (a) => a.some(Boolean), xor: (a) => a.reduce((x, y) => x ^ y, 0), nand: (a) => !a.every(Boolean), nor: (a) => !a.some(Boolean), xnor: (a) => !a.reduce((x, y) => x ^ y, 0), not: (a) => !a[0], buf: (a) => !!a[0] };
  function compileModule(src) {
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const m = code.match(/module\s+(\w+)\s*\(([\s\S]*?)\)\s*;([\s\S]*?)endmodule/);
    if (!m) throw new Error("ไม่พบโครงสร้าง module … ( พอร์ต ); … endmodule");
    const name = m[1], ins = [], outs = [], widths = {};
    let dir = null, w = 1;
    m[2].split(",").forEach((raw) => {
      let p = raw.trim(); if (!p) return;
      const d = p.match(/^(input|output)\b\s*(?:(?:reg|wire)\b\s*)?/); if (d) { dir = d[1]; p = p.slice(d[0].length); w = 1; }
      const r = p.match(/^\[\s*(\d+)\s*:\s*(\d+)\s*\]\s*/); if (r) { w = Math.abs(+r[1] - +r[2]) + 1; p = p.slice(r[0].length); }
      if (!/^\w+$/.test(p)) throw new Error(`พอร์ต “${raw.trim()}” ไม่ถูกต้อง (ใช้รูปแบบ input [3:0] a, b)`);
      if (!dir) throw new Error("ต้องระบุ input หรือ output");
      widths[p] = w; (dir === "input" ? ins : outs).push(p);
    });
    const stmts = [];
    m[3].split(";").map((s) => s.trim()).filter(Boolean).forEach((s) => {
      let k;
      if ((k = s.match(/^wire\b\s*(?:\[\s*(\d+)\s*:\s*(\d+)\s*\])?\s*([\w\s,]+)$/))) { const ww = k[1] ? Math.abs(+k[1] - +k[2]) + 1 : 1; k[3].split(",").forEach((n) => (widths[n.trim()] = ww)); return; }
      if ((k = s.match(/^assign\s+(\w+)\s*=\s*([\s\S]+)$/))) { stmts.push({ lhs: k[1], expr: k[2] }); return; }
      if ((k = s.match(/^(and|or|xor|nand|nor|xnor|not|buf)\s*(\w+)?\s*\(([^)]*)\)$/))) { const a = k[3].split(",").map((x) => x.trim()); stmts.push({ prim: k[1], out: a[0], ins: a.slice(1) }); return; }
      if (/^always|^reg\b|^initial/.test(s)) throw new Error("ตัวจำลองนี้รองรับเฉพาะ assign และ gate primitive (always ดูในแบบจำลองหัวข้อ 12.3.5–12.4)");
      throw new Error(`ไม่รู้จักคำสั่ง “${s.slice(0, 30)}”`);
    });
    stmts.forEach((st) => {
      if (st.lhs !== undefined) { if (!(st.lhs in widths)) throw new Error(`ไม่ได้ประกาศ “${st.lhs}”`); st.f = compileExpr(tokenize(st.expr), widths); }
      else [st.out, ...st.ins].forEach((n) => { if (!(n in widths)) throw new Error(`ไม่ได้ประกาศ “${n}”`); });
    });
    const run = (inEnv) => {
      const e = { ...inEnv };
      for (let pass = 0; pass < 20; pass++) {
        let ch = false;
        stmts.forEach((st) => {
          const v = st.lhs !== undefined ? fit(st.f(e).v, widths[st.lhs]) : PRIM[st.prim](st.ins.map((n) => e[n] || 0)) ? 1 : 0;
          const key = st.lhs !== undefined ? st.lhs : st.out;
          if (e[key] !== v) { e[key] = v; ch = true; }
        });
        if (!ch) break;
      }
      return e;
    };
    return { name, ins, outs, widths, run };
  }
  DLD.verilog = { compileModule, compileExpr, tokenize };

  /* =====================================================
     1) vlive — เขียน Verilog แล้วเห็นผลทันที
     ===================================================== */
  const VPRE = {
    half_adder: { t: "half_adder (โปรแกรมที่ 12.1)", ref: (e) => ({ s: e.a ^ e.b, c: e.a & e.b }),
      src: "// half adder แบบโครงสร้าง (structural) ด้วย gate primitive\nmodule half_adder (\n  input  a, b,\n  output s, c\n);\n  xor g1 (s, a, b);   // s = a XOR b\n  and g2 (c, a, b);   // c = a AND b\nendmodule" },
    fa_struct: { t: "fa_struct (12.2)", ref: (e) => ({ s: e.a ^ e.b ^ e.cin, cout: (e.a & e.b) | (e.cin & (e.a ^ e.b)) }),
      src: "// full adder แบบโครงสร้าง (เทียบรูปที่ 7.5)\nmodule fa_struct (\n  input  a, b, cin,\n  output s, cout\n);\n  wire p, g, t;          // สายสัญญาณภายใน\n  xor u1 (p, a, b);\n  xor u2 (s, p, cin);\n  and u3 (g, a, b);\n  and u4 (t, p, cin);\n  or  u5 (cout, g, t);\nendmodule" },
    fa_bug: { t: "fa_struct มีบั๊ก", ref: (e) => ({ s: e.a ^ e.b ^ e.cin, cout: (e.a & e.b) | (e.cin & (e.a ^ e.b)) }),
      src: "// full adder ที่ต่อสายผิด 1 จุด — ให้ testbench หาให้เจอ\nmodule fa_struct (\n  input  a, b, cin,\n  output s, cout\n);\n  wire p, g, t;\n  xor u1 (p, a, b);\n  xor u2 (s, p, cin);\n  and u3 (g, a, b);\n  and u4 (t, a, cin);    // ควรเป็น p\n  or  u5 (cout, g, t);\nendmodule" },
    fa_dataflow: { t: "fa_dataflow (12.3)", ref: (e) => ({ s: e.a ^ e.b ^ e.cin, cout: (e.a & e.b) | (e.cin & (e.a ^ e.b)) }),
      src: "// full adder แบบ dataflow ด้วย assign\nmodule fa_dataflow (\n  input  a, b, cin,\n  output s, cout\n);\n  assign s    = a ^ b ^ cin;\n  assign cout = (a & b) | (cin & (a ^ b));\nendmodule" },
    mux2: { t: "mux2 4 บิต (12.4)", ref: (e) => ({ y: e.s ? e.d1 : e.d0 }),
      src: "// 2-to-1 MUX ขนาด 4 บิต ด้วยตัวดำเนินการเงื่อนไข ?:\nmodule mux2 (\n  input  [3:0] d0, d1,\n  input        s,\n  output [3:0] y\n);\n  assign y = s ? d1 : d0;\nendmodule" },
    gray4: { t: "gray4 (12.11)", ref: (e) => ({ g: e.b ^ (e.b >> 1) }),
      src: "// วงจรแปลงไบนารีเป็นรหัสเกรย์ขนาด 4 บิต (เทียบรูปที่ 7.24)\nmodule gray4 (\n  input  [3:0] b,\n  output [3:0] g\n);\n  assign g = b ^ (b >> 1);   // g3 = b3, gi = b(i+1) XOR bi\nendmodule" },
    ops: { t: "ตัวดำเนินการ (12.2.4)",
      src: "// ทดลองตัวดำเนินการกับเวกเตอร์ 4 บิต\nmodule ops (\n  input  [3:0] a, b,\n  output [3:0] y_and, y_or, y_xor, y_not,\n  output [4:0] sum,\n  output       eq, gt, r_and,\n  output [3:0] shl\n);\n  assign y_and = a & b;\n  assign y_or  = a | b;\n  assign y_xor = a ^ b;\n  assign y_not = ~a;\n  assign sum   = a + b;      // 5 บิต เก็บตัวทดได้\n  assign eq    = (a == b);\n  assign gt    = (a > b);\n  assign r_and = &a;         // reduction AND: 1 เมื่อทุกบิตเป็น 1\n  assign shl   = a << 1;\nendmodule" },
  };
  W.vlive = function (el) {
    const st = { key: el.dataset.preset || "fa_dataflow", env: {}, tb: el.dataset.tb === "1", out: "" };
    const body = U.shell(el, "INTERACTIVE", "เขียน Verilog แล้วเห็นผลทันที (ตัวจำลองขนาดเล็กบนเว็บ)",
      "แก้โค้ดในกล่องได้เลย — รองรับ <span class=\"mono\">assign</span>, gate primitive (and, or, xor, nand, nor, xnor, not), เวกเตอร์ [n:0], ตัวดำเนินการ ~ & | ^ + - &lt;&lt; &gt;&gt; == ?: {} · คลิกอินพุตเพื่อเปลี่ยนค่า" + (st.tb ? " · กด “รัน testbench” เพื่อทดสอบครบทุกกรณีแบบโปรแกรมที่ 12.17" : ""));
    const ctr = H("div", { class: "controls" });
    const keys = st.tb ? ["fa_struct", "fa_bug", "half_adder", "fa_dataflow"] : ["half_adder", "fa_struct", "fa_dataflow", "mux2", "gray4", "ops"];
    keys.forEach((k) => ctr.append(U.btn(VPRE[k].t, () => { st.key = k; ta.value = VPRE[k].src; st.out = ""; st.env = {}; draw(); })));
    const ta = H("textarea", { spellcheck: "false", class: "mono", style: "width:100%;box-sizing:border-box;min-height:270px;font-size:13px;line-height:1.45;padding:8px 10px;border-radius:8px;border:1px solid var(--line);background:var(--surface-2);color:var(--ink);resize:vertical" });
    ta.value = VPRE[st.key].src;
    let tmr; ta.addEventListener("input", () => { clearTimeout(tmr); tmr = setTimeout(() => { st.out = ""; draw(); }, 250); });
    const left = H("div", { style: "flex:1 1 360px;min-width:0" }); left.append(ta);
    const right = H("div", { style: "flex:1 1 260px;min-width:0" });
    const row = H("div", { style: "display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start" }); row.append(left, right);
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, row, msg);
    function runTB(mod) {
      const ref = VPRE[st.key].ref; if (!ref) return "โมดูลนี้ไม่มีค่าอ้างอิงสำหรับ testbench";
      const nbits = mod.ins.reduce((a, n) => a + mod.widths[n], 0); if (nbits > 8) return "อินพุตมากเกินไปสำหรับ testbench แบบครบทุกกรณี";
      const lines = [` ${mod.ins.join(" ")} | ${mod.outs.join(" ")}`]; let err = 0;
      for (let i = 0; i < 1 << nbits; i++) {
        const env = {}; let sh = nbits; mod.ins.forEach((n) => { sh -= mod.widths[n]; env[n] = (i >> sh) & M(mod.widths[n]); });
        const r = mod.run(env), exp = ref(env);
        lines.push(` ${mod.ins.map((n) => bin(env[n], mod.widths[n])).join(" ")} | ${mod.outs.map((n) => bin(r[n], mod.widths[n])).join(" ")}`);
        const bad = mod.outs.filter((n) => n in exp && fit(exp[n], mod.widths[n]) !== r[n]);
        if (bad.length) { lines.push(`ERROR at ${mod.ins.map((n) => `${n}=${bin(env[n], mod.widths[n])}`).join(" ")} (${bad.join(", ")})`); err++; }
      }
      lines.push(err ? `FAIL: ${err} case(s) wrong` : `PASS: all ${1 << nbits} cases correct`);
      return lines.join("\n");
    }
    function draw() {
      right.innerHTML = "";
      let mod;
      try { mod = compileModule(ta.value); ta.style.borderColor = "var(--line)"; }
      catch (e) { ta.style.borderColor = "#e03131"; right.append(H("div", { class: "callout warn", style: "margin:0" }, `⚠ ${esc(e.message)}`)); msg.innerHTML = "แก้โค้ดให้ถูกไวยากรณ์ — ตัวจำลองจะคำนวณใหม่ทันที"; return; }
      mod.ins.forEach((n) => { if (!(n in st.env)) st.env[n] = n === "b" && mod.widths[n] > 1 ? 6 : n === "a" && mod.widths[n] > 1 ? 11 : n === "d1" ? 12 : n === "d0" ? 5 : 0; st.env[n] &= M(mod.widths[n]); });
      const r = mod.run(st.env);
      const io = H("div");
      io.append(H("div", { class: "tiny muted" }, `module <b class="mono">${mod.name}</b> · อินพุต`));
      mod.ins.forEach((n) => {
        const w = mod.widths[n], line = H("div", { class: "controls", style: "align-items:center;margin:2px 0" });
        line.append(H("b", { class: "mono", style: "min-width:34px" }, n));
        if (w === 1) { const b = U.btn(`${st.env[n]}`, () => { st.env[n] ^= 1; draw(); }); b.setAttribute("aria-pressed", String(!!st.env[n])); line.append(b); }
        else { const bits = [...bin(st.env[n], w)].map(Number); line.append(U.bitRow(bits, { small: true, onToggle: (i) => { st.env[n] ^= 1 << (w - 1 - i); draw(); } }), H("span", { class: "mono tiny" }, `= ${st.env[n]}`)); }
        io.append(line);
      });
      io.append(H("div", { class: "tiny muted", style: "margin-top:6px" }, "เอาต์พุต"));
      io.append(H("div", { class: "mono", style: "font-size:15px;line-height:1.6" }, mod.outs.map((n) => `${n} = <b style="color:${r[n] ? "var(--hi)" : "var(--ink-3)"}">${mod.widths[n] > 1 ? `${mod.widths[n]}'b${bin(r[n], mod.widths[n])}</b> <span class="muted">(${r[n]})</span>` : `${r[n]}</b>`}`).join("<br>")));
      right.append(io);
      const nb = mod.ins.reduce((a, n) => a + mod.widths[n], 0);
      if (st.tb) {
        right.append(U.btn("▶ รัน testbench", () => { st.out = runTB(mod); draw(); }, "primary"));
        if (st.out) right.append(H("pre", { class: "mono", style: `font-size:12.5px;background:#1b1e27;color:${/FAIL/.test(st.out) ? "#ff8787" : "#7ee787"};padding:8px 10px;border-radius:8px;overflow:auto;max-height:260px;margin:6px 0 0` }, esc(`$ vvp tb_${mod.name}.vvp\n` + st.out)));
      } else if (nb <= 5) {
        const cur = mod.ins.reduce((a, n) => a * 2 ** mod.widths[n] + st.env[n], 0);
        let t = `<table class="data" style="text-align:center;width:auto;font-size:12.5px;margin-top:8px"><tr>${mod.ins.map((n) => `<th>${n}</th>`).join("")}${mod.outs.map((n) => `<th style="color:var(--hi)">${n}</th>`).join("")}</tr>`;
        for (let i = 0; i < 1 << nb; i++) { const env = {}; let sh = nb; mod.ins.forEach((n) => { sh -= mod.widths[n]; env[n] = (i >> sh) & M(mod.widths[n]); }); const rr = mod.run(env); t += `<tr${hl(i === cur)}>${mod.ins.map((n) => `<td>${bin(env[n], mod.widths[n])}</td>`).join("")}${mod.outs.map((n) => `<td>${bin(rr[n], mod.widths[n])}</td>`).join("")}</tr>`; }
        const box = H("div", { style: "max-height:250px;overflow:auto" }); box.innerHTML = t + "</table>"; right.append(box);
      }
      msg.innerHTML = st.tb
        ? "testbench วนป้อนอินพุตทุกรูปแบบ แล้วเทียบเอาต์พุตกับค่าที่ควรได้ (<span class=\"mono\">{cout, s} !== a + b + cin</span>) — พิมพ์ ERROR เมื่อไม่ตรง และ PASS เมื่อถูกทุกกรณี · ลองเลือก “fa_struct มีบั๊ก”"
        : "โค้ด Verilog อธิบาย<b>ฮาร์ดแวร์</b> ไม่ใช่ลำดับคำสั่ง — assign ทุกบรรทัดทำงานพร้อมกันตลอดเวลา ลำดับบรรทัดไม่มีผล" + (st.key === "ops" ? " · สังเกตว่า sum เป็น 5 บิตจึงเก็บตัวทดได้ ส่วน shl 4 บิตทำให้บิตบนหลุดออก" : "");
    }
    draw();
  };

  /* =====================================================
     2) latch ที่เกิดโดยไม่ตั้งใจ (12.3.5)
     ===================================================== */
  const LATCH_BAD = "always @* begin\n  if (en)\n    y = d;      // ไม่มี else\nend";
  const LATCH_OK = "always @* begin\n  if (en)\n    y = d;\n  else\n    y = 1'b0;   // กำหนดค่าทุกกรณี\nend";
  W.latchdemo = function (el) {
    const st = { en: 1, d: 1, yb: 1, hist: [] };
    const body = U.shell(el, "INTERACTIVE", "การเกิด latch โดยไม่ตั้งใจ (โปรแกรมที่ 12.10)",
      "สลับ en และ d แล้วเทียบเอาต์พุตของสองโค้ด — เมื่อ en = 0 โค้ดซ้ายไม่ได้บอกว่า y เป็นเท่าใด เครื่องมือสังเคราะห์จึงต้องสร้างหน่วยความจำ (latch) ให้ y “จำ” ค่าเดิม");
    const ctr = H("div", { class: "controls" });
    const bE = U.btn("", () => { st.en ^= 1; step(); }), bD = U.btn("", () => { st.d ^= 1; step(); });
    ctr.append(bE, bD);
    const grid = H("div", { style: "display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px" });
    const wave = S("svg", { style: "max-width:720px" });
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, grid, wave, msg);
    function step() { if (st.en) st.yb = st.d; st.hist.push({ en: st.en, d: st.d, yb: st.yb, yg: st.en ? st.d : 0 }); if (st.hist.length > 16) st.hist.shift(); draw(); }
    function draw() {
      bE.textContent = `en = ${st.en}`; bD.textContent = `d = ${st.d}`; bE.setAttribute("aria-pressed", String(!!st.en)); bD.setAttribute("aria-pressed", String(!!st.d));
      const yg = st.en ? st.d : 0;
      grid.innerHTML = "";
      [[LATCH_BAD, st.yb, "latch_bad → สังเคราะห์ได้ <b>D latch</b> (มีหน่วยความจำ)", "#e03131"], [LATCH_OK, yg, "มี else → สังเคราะห์ได้ <b>AND gate</b> (y = en·d)", "var(--hi)"]].forEach(([code, y, cap, c]) => {
        const card = H("div", { class: "card", style: "padding:10px" });
        card.innerHTML = codeBox(hiCode(code)) + `<div class="mono" style="font-size:18px;margin-top:8px">y = <b style="color:${y ? "var(--hi)" : "var(--ink-3)"}">${y}</b></div><div class="small" style="color:${c}">${cap}</div>`;
        grid.append(card);
      });
      const hs = st.hist, stp = 40, X0 = 70;
      wave.setAttribute("viewBox", `0 0 ${X0 + 16 * stp + 10} 150`); wave.innerHTML = "";
      [["en", "en"], ["d", "d"], ["yb", "y (latch)"], ["yg", "y (มี else)"]].forEach(([k, n], i) => {
        const y = 6 + i * 36; txt(wave, 6, y + 16, n, { size: 11.5, c: i === 2 ? "#e03131" : i === 3 ? "var(--hi)" : "var(--ink)" });
        if (hs.length) S("path", { d: DLD.wavePath(hs.map((h) => h[k]), X0, stp, y, y + 20), class: i > 1 ? "s-hi" : "s-wave", "stroke-width": 2.2, style: i === 2 ? "stroke:#e03131" : "" }, wave);
      });
      msg.innerHTML = st.en ? "en = 1: ทั้งสองแบบให้ y = d" : `en = 0: โค้ดซ้าย <b>จำ</b> y = ${st.yb} ไว้ (latch) · โค้ดขวาให้ y = 0` +
        "<br>วิธีป้องกัน: ใส่ else ทุก if, ใส่ default ทุก case หรือกำหนดค่าตั้งต้นให้ทุกเอาต์พุตที่บรรทัดแรกของ always @*";
    }
    step();
  };

  /* =====================================================
     3) non-blocking (<=) กับ blocking (=) (12.4.2)
     ===================================================== */
  W.nbsim = function (el) {
    const st = { d: 1, nb: [0, 0], b: [0, 0], sw: { nb: [1, 0], b: [1, 0] }, hist: [], last: null };
    const body = U.shell(el, "INTERACTIVE", "Non-blocking (<=) กับ blocking (=) ใน always @(posedge clk) (โปรแกรมที่ 12.13)",
      "ตั้งค่า d แล้วกด “ขอบนาฬิกา ↑” — non-blocking: <b>คำนวณด้านขวาทุกบรรทัดก่อน</b> แล้วอัปเดตพร้อมกัน (ฟลิปฟลอปต่อกัน) · blocking: แต่ละบรรทัดอัปเดตทันที บรรทัดถัดไปจึงเห็นค่าใหม่");
    const ctr = H("div", { class: "controls" });
    const bD = U.btn("", () => { st.d ^= 1; draw(); });
    ctr.append(bD, U.btn("ขอบนาฬิกา ↑", () => clock(), "primary"), U.btn("รีเซ็ต", () => { st.nb = [0, 0]; st.b = [0, 0]; st.sw = { nb: [1, 0], b: [1, 0] }; st.hist = []; st.last = null; draw(); }));
    const grid = H("div", { style: "display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px" });
    const wave = S("svg", { style: "max-width:720px" });
    const msg = H("div", { class: "callout note", style: "margin-bottom:0" });
    body.append(ctr, grid, wave, msg);
    function clock() {
      const d = st.d, [q1, q2] = st.nb;
      st.last = { d, nbR: [d, q1], bQ1: d };
      st.nb = [d, q1];                 // RHS ก่อน แล้วอัปเดตพร้อมกัน
      st.b = [d, d];                   // q1 = d; q2 = q1 (ค่าใหม่)
      const [a, b] = st.sw.nb; st.sw.nb = [b, a];
      st.sw.b = [st.sw.b[1], st.sw.b[1]];   // a = b; b = a (ค่าใหม่)
      st.hist.push({ d, n1: st.nb[0], n2: st.nb[1], b1: st.b[0], b2: st.b[1] }); if (st.hist.length > 14) st.hist.shift();
      draw();
    }
    function draw() {
      bD.textContent = `d = ${st.d}`; bD.setAttribute("aria-pressed", String(!!st.d));
      grid.innerHTML = "";
      const L = st.last;
      const card = (title, code, q, note, ok) => { const c = H("div", { class: "card", style: "padding:10px" }); c.innerHTML = `<b>${title}</b>` + codeBox(hiCode(code)) + `<div class="mono" style="font-size:16px;margin-top:6px">q1 = <b>${q[0]}</b> · q2 = <b>${q[1]}</b></div><div class="small" style="color:${ok ? "var(--hi)" : "#e03131"}">${note}</div>`; return c; };
      grid.append(
        card("pipe_nb (non-blocking)", "always @(posedge clk) begin\n  q1 <= d;\n  q2 <= q1;\nend", st.nb, L ? `ขั้น 1 คำนวณ: q1 ← d = ${L.d}, q2 ← q1 (เดิม) = ${L.nbR[1]} · ขั้น 2 อัปเดตพร้อมกัน → FF 2 ตัวต่อกัน` : "FF 2 ตัวต่อกัน (q2 ช้ากว่า q1 หนึ่งคาบ)", true),
        card("pipe_b (blocking)", "always @(posedge clk) begin\n  q1 = d;\n  q2 = q1;\nend", st.b, L ? `q1 = d = ${L.d} ทันที → q2 = q1 (ค่าใหม่) = ${L.bQ1} · เหลือ FF ตัวเดียว` : "q2 = q1 เสมอ — วงจรไม่ใช่ที่ตั้งใจ", false),
        card("ex_swap (non-blocking)", "always @(posedge clk) begin\n  a <= b;\n  b <= a;\nend", st.sw.nb, "a, b <b>สลับค่ากัน</b>ทุกขอบนาฬิกา (q1 = a, q2 = b)", true),
        card("swap แบบ blocking", "always @(posedge clk) begin\n  a = b;\n  b = a;\nend", st.sw.b, "a = b แล้ว b = a (ค่าใหม่) → ทั้งคู่เท่ากัน ไม่สลับ", false));
      const hs = st.hist, stp = 44, X0 = 96;
      wave.setAttribute("viewBox", `0 0 ${X0 + 14 * stp + 10} 186`); wave.innerHTML = "";
      [["d", "d"], ["n1", "nb q1"], ["n2", "nb q2"], ["b1", "b q1"], ["b2", "b q2"]].forEach(([k, n], i) => {
        const y = 6 + i * 36; txt(wave, 6, y + 16, n, { size: 11.5, c: i ? (i < 3 ? "var(--hi)" : "#e03131") : "var(--ink)" });
        if (hs.length) S("path", { d: DLD.wavePath(hs.map((h) => h[k]), X0, stp, y, y + 20), class: i ? "s-hi" : "s-wave", "stroke-width": 2.2, style: i >= 3 ? "stroke:#e03131" : "" }, wave);
      });
      msg.innerHTML = "กฎใช้งาน: <b>วงจรเชิงลำดับ</b> (always @(posedge clk)) ใช้ <span class=\"mono\">&lt;=</span> · <b>วงจรคอมไบเนชัน</b> (always @*) ใช้ <span class=\"mono\">=</span> · ห้ามผสมสองแบบในบล็อกเดียว";
    }
    draw();
  };

  /* =====================================================
     4) vseq — จำลองโค้ดวงจรเชิงลำดับทีละขอบนาฬิกา (12.4.3–12.4.5)
     ===================================================== */
  const SEQ = {
    counter4: { title: "วงจรนับขึ้น/ลง 4 บิต (โปรแกรมที่ 12.14)", ins: { en: 1, up: 1 }, init: { q: 0 }, rst: [7, 8],
      src: "module counter4 (\n  input            clk, rst_n,\n  input            en,      // 1 = นับ, 0 = หยุด\n  input            up,      // 1 = นับขึ้น, 0 = นับลง\n  output reg [3:0] q\n);\n  always @(posedge clk or negedge rst_n) begin\n    if (!rst_n)\n      q <= 4'd0;\n    else if (en) begin\n      if (up) q <= q + 4'd1;   // 15 -> 0\n      else    q <= q - 4'd1;   //  0 -> 15\n    end\n  end\nendmodule",
      step: (s, i) => (!i.en ? [s, [9]] : i.up ? [{ q: (s.q + 1) & 15 }, [9, 10]] : [{ q: (s.q + 15) & 15 }, [9, 11]]),
      rows: (s) => [["q[3:0]", s.q, 4]], show: (s) => `q = 4'b${bin(s.q, 4)} (${s.q})` },
    shift4: { title: "ชิฟต์รีจิสเตอร์ SIPO 4 บิต (โปรแกรมที่ 12.15)", ins: { din: 1 }, init: { q: 0 }, rst: [6, 7],
      src: "module shift4 (\n  input            clk, rst_n,\n  input            din,           // ข้อมูลอนุกรมเข้า\n  output reg [3:0] q              // q[3] = FF0 ... q[0] = FF3\n);\n  always @(posedge clk or negedge rst_n) begin\n    if (!rst_n)\n      q <= 4'b0000;\n    else\n      q <= {din, q[3:1]};          // เลื่อนไปทางขวา 1 ตำแหน่ง\n  end\nendmodule",
      step: (s, i) => [{ q: (i.din << 3) | (s.q >> 1) }, [8, 9]],
      rows: (s) => [["q[3:0]", s.q, 4]], show: (s) => `q = {din, q[3:1]} = 4'b${bin(s.q, 4)}` },
    det101: { title: "วงจรตรวจจับลำดับ 101 แบบ Moore (โปรแกรมที่ 12.16)", ins: { x: 1 }, init: { state: 0 }, rst: [9],
      src: "module det101 (\n  input      clk, rst_n, x,\n  output reg z\n);\n  localparam S0 = 2'd0, S1 = 2'd1, S2 = 2'd2, S3 = 2'd3;\n  reg [1:0] state, next;\n\n  // (1) รีจิสเตอร์สถานะ\n  always @(posedge clk or negedge rst_n)\n    if (!rst_n) state <= S0;\n    else        state <= next;\n\n  // (2) วงจรคอมไบเนชัน: สถานะถัดไปและเอาต์พุต\n  always @* begin\n    next = state;  z = 1'b0;          // ค่าตั้งต้น\n    case (state)\n      S0: next = x ? S1 : S0;\n      S1: next = x ? S1 : S2;\n      S2: next = x ? S3 : S0;\n      S3: begin z = 1'b1; next = x ? S1 : S2; end\n    endcase\n  end\nendmodule",
      next: (st, x) => [[0, 1], [2, 1], [0, 3], [2, 1]][st][x],
      step(s, i) { return [{ state: this.next(s.state, i.x) }, [10]]; },
      comb: (s) => new Set([14, 16 + s.state]),
      rows: (s) => [["state", s.state, 2], ["z", s.state === 3 ? 1 : 0, 1]], show: (s) => `state = S${s.state} · next = S${SEQ.det101.next(s.state, 0)} (x=0) / S${SEQ.det101.next(s.state, 1)} (x=1) · z = ${s.state === 3 ? 1 : 0}` },
  };
  W.vseq = function (el) {
    const P = SEQ[el.dataset.preset || "counter4"];
    const st = { s: { ...P.init }, i: { ...P.ins }, rst: 1, hist: [], hi: new Set() };
    const body = U.shell(el, "INTERACTIVE", P.title,
      "ตั้งค่าอินพุตแล้วกด “ขอบนาฬิกา ↑” — บรรทัดสีเหลืองคือบรรทัดที่ทำงานในขอบนาฬิกานั้น · rst_n = 0 ทำงานทันทีเพราะอยู่ในรายการ sensitivity (negedge rst_n) จึงเป็น reset แบบ asynchronous");
    const ctr = H("div", { class: "controls" });
    const ib = {};
    Object.keys(P.ins).forEach((k) => { ib[k] = U.btn("", () => { st.i[k] ^= 1; draw(); }); ctr.append(ib[k]); });
    const rb = U.btn("", () => { st.rst ^= 1; if (!st.rst) { st.s = { ...P.init }; st.hi = new Set(P.rst); push(); } draw(); });
    ctr.append(rb, U.btn("ขอบนาฬิกา ↑", () => { if (st.rst) { const [ns, lines] = P.step(st.s, st.i); st.s = ns; st.hi = new Set(lines); } push(); draw(); }, "primary"));
    const grid = H("div", { style: "display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start" });
    const codeDiv = H("div", { style: "flex:1 1 380px;min-width:0" }), side = H("div", { style: "flex:1 1 240px;min-width:0" });
    grid.append(codeDiv, side);
    const wave = S("svg", { style: "max-width:720px" });
    body.append(ctr, grid, wave);
    const lines = hiCode(P.src);
    function push() { st.hist.push({ s: { ...st.s }, i: { ...st.i }, rst: st.rst }); if (st.hist.length > 16) st.hist.shift(); }
    function draw() {
      Object.keys(P.ins).forEach((k) => { ib[k].textContent = `${k} = ${st.i[k]}`; ib[k].setAttribute("aria-pressed", String(!!st.i[k])); });
      rb.textContent = `rst_n = ${st.rst}`; rb.setAttribute("aria-pressed", String(!!st.rst));
      const hiSet = new Set([...st.hi, ...(P.comb ? P.comb(st.s) : [])]);
      codeDiv.innerHTML = codeBox(lines, hiSet);
      side.innerHTML = `<div class="mono" style="font-size:15px;line-height:1.7">${P.rows(st.s).map(([n, v, w]) => `${n} = <b style="color:var(--hi)">${w > 1 ? `${w}'b${bin(v, w)}` : v}</b>${w > 1 ? ` <span class="muted">(${v})</span>` : ""}`).join("<br>")}</div>` +
        `<div class="callout note small" style="margin:8px 0 0">${P.show(st.s)}</div>`;
      const hs = st.hist, stp = 40, X0 = 70, rows = [];
      Object.keys(P.ins).forEach((k) => rows.push({ n: k, b: hs.map((h) => h.i[k]) }));
      rows.push({ n: "rst_n", b: hs.map((h) => h.rst) });
      P.rows(st.s).forEach(([n, , w], ri) => { for (let k = w - 1; k >= 0; k--) rows.push({ n: w > 1 ? `${n.split("[")[0]}[${k}]` : n, b: hs.map((h) => (P.rows(h.s)[ri][1] >> k) & 1), o: true }); });
      wave.setAttribute("viewBox", `0 0 ${X0 + 16 * stp + 10} ${rows.length * 30 + 10}`); wave.innerHTML = "";
      rows.forEach((r, i) => { const y = 6 + i * 30; txt(wave, 6, y + 14, r.n, { size: 11, c: r.o ? "var(--hi)" : "var(--ink)" }); if (hs.length) S("path", { d: DLD.wavePath(r.b, X0, stp, y, y + 18), class: r.o ? "s-hi" : "s-wave", "stroke-width": 2 }, wave); });
    }
    push(); draw();
  };
})();
