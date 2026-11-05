/* =========================================================
   boolean.js — Boolean expression engine (บทที่ 4 เป็นต้นไป)
   Syntax (พิมพ์ได้หลายแบบ):
     ตัวแปร  A–Z (ตัวอักษรเดียว) · ค่าคงที่ 0 1
     NOT    A'  ~A  !A  (A+B)'
     AND    AB  A·B  A*B  A.B  A&B
     OR     A+B  A|B
     XOR    A^B  A⊕B
   Precedence: NOT > AND > XOR > OR
   ========================================================= */
(function () {
  const DLD = (window.DLD = window.DLD || {});
  const B = (DLD.bool = {});

  function tokenize(src) {
    const t = [];
    for (const ch of src.replace(/\s+/g, "")) {
      if (/[A-Za-z]/.test(ch)) t.push({ k: "var", v: ch.toUpperCase() });
      else if (ch === "0" || ch === "1") t.push({ k: "const", v: +ch });
      else if ("+|".includes(ch)) t.push({ k: "or" });
      else if ("^⊕".includes(ch)) t.push({ k: "xor" });
      else if ("·*.&".includes(ch)) t.push({ k: "and" });
      else if ("'’′".includes(ch)) t.push({ k: "post" });
      else if ("~!¬".includes(ch)) t.push({ k: "pre" });
      else if (ch === "(" || ch === "[") t.push({ k: "(" });
      else if (ch === ")" || ch === "]") t.push({ k: ")" });
      else throw new Error(`ไม่รู้จักเครื่องหมาย “${ch}”`);
    }
    return t;
  }

  B.parse = function (src) {
    const t = tokenize(src);
    let i = 0;
    const peek = () => t[i];
    const startsPrimary = (x) => x && (x.k === "var" || x.k === "const" || x.k === "(" || x.k === "pre");
    function or() {
      const a = [xor()];
      while (peek() && peek().k === "or") { i++; a.push(xor()); }
      return a.length > 1 ? { t: "or", a } : a[0];
    }
    function xor() {
      const a = [and()];
      while (peek() && peek().k === "xor") { i++; a.push(and()); }
      return a.length > 1 ? { t: "xor", a } : a[0];
    }
    function and() {
      const a = [unary()];
      while (peek() && (peek().k === "and" || startsPrimary(peek()))) { if (peek().k === "and") i++; a.push(unary()); }
      return a.length > 1 ? { t: "and", a } : a[0];
    }
    function unary() {
      let n = 0;
      while (peek() && peek().k === "pre") { i++; n++; }
      let x = primary();
      while (peek() && peek().k === "post") { i++; x = { t: "not", a: x }; }
      for (let k = 0; k < n; k++) x = { t: "not", a: x };
      return x;
    }
    function primary() {
      const x = t[i++];
      if (!x) throw new Error("นิพจน์ไม่สมบูรณ์");
      if (x.k === "var") return { t: "var", n: x.v };
      if (x.k === "const") return { t: "const", v: x.v };
      if (x.k === "(") { const e = or(); if (!t[i] || t[i].k !== ")") throw new Error("วงเล็บไม่ครบ"); i++; return e; }
      throw new Error("ตำแหน่งของเครื่องหมายไม่ถูกต้อง");
    }
    if (!t.length) throw new Error("ยังไม่ได้พิมพ์นิพจน์");
    const e = or();
    if (i < t.length) throw new Error("มีวงเล็บปิดเกินหรือเครื่องหมายเกิน");
    return e;
  };

  B.vars = function (e, set) {
    set = set || new Set();
    if (e.t === "var") set.add(e.n);
    else if (e.a) [].concat(e.a).forEach((x) => B.vars(x, set));
    return [...set].sort();
  };
  B.eval = function (e, env) {
    switch (e.t) {
      case "var": return env[e.n] ? 1 : 0;
      case "const": return e.v;
      case "not": return 1 - B.eval(e.a, env);
      case "and": return e.a.every((x) => B.eval(x, env)) ? 1 : 0;
      case "or": return e.a.some((x) => B.eval(x, env)) ? 1 : 0;
      case "xor": return e.a.reduce((s, x) => s ^ B.eval(x, env), 0);
    }
  };

  /* HTML rendering in book notation (overline for complement) */
  B.html = function (e, parent) {
    let s;
    switch (e.t) {
      case "var": return e.n;
      case "const": return String(e.v);
      case "not": return `<span class="ov">${B.html(e.a, "not")}</span>`;
      case "and": s = e.a.map((x) => (x.t === "or" || x.t === "xor" ? `(${B.html(x, "and")})` : B.html(x, "and"))).join(e.a.some((x) => x.t === "const") ? " · " : ""); break;
      case "or": s = e.a.map((x) => B.html(x, "or")).join(" + "); break;
      case "xor": s = e.a.map((x) => (x.t === "or" ? `(${B.html(x, "xor")})` : B.html(x, "xor"))).join(" ⊕ "); break;
    }
    return parent === "and" && (e.t === "or" || e.t === "xor") ? s : s;
  };
  /* plain text using prime notation */
  B.text = function (e, parent) {
    switch (e.t) {
      case "var": return e.n;
      case "const": return String(e.v);
      case "not": return e.a.t === "var" || e.a.t === "const" ? B.text(e.a) + "'" : `(${B.text(e.a)})'`;
      case "and": return e.a.map((x) => (x.t === "or" || x.t === "xor" ? `(${B.text(x)})` : B.text(x, "and"))).join("");
      case "or": { const s = e.a.map((x) => B.text(x, "or")).join(" + "); return parent === "and" ? `(${s})` : s; }
      case "xor": return e.a.map((x) => (x.t === "or" ? `(${B.text(x)})` : B.text(x))).join(" ⊕ ");
    }
  };

  B.combos = (vars) => [...Array(1 << vars.length)].map((_, i) => Object.fromEntries(vars.map((v, k) => [v, (i >> (vars.length - 1 - k)) & 1])));
  B.table = function (e, vars) {
    vars = vars || B.vars(e);
    return B.combos(vars).map((env) => ({ env, out: B.eval(e, env) }));
  };
  B.equivalent = function (e1, e2) {
    const vars = [...new Set([...B.vars(e1), ...B.vars(e2)])].sort();
    return B.combos(vars).every((env) => B.eval(e1, env) === B.eval(e2, env));
  };
  /* sub-expressions (for intermediate truth-table columns), innermost first, without duplicates/vars */
  B.subterms = function (e) {
    const out = [], seen = new Set();
    (function walk(x) {
      if (x.a) [].concat(x.a).forEach(walk);
      if (x.t !== "var" && x.t !== "const") { const k = B.text(x); if (!seen.has(k)) { seen.add(k); out.push(x); } }
    })(e);
    return out;
  };

  /* ---------- rewriting (DeMorgan step by step) ---------- */
  const clone = (e) => JSON.parse(JSON.stringify(e));
  function flatten(e) {
    if (e.a && Array.isArray(e.a)) {
      e.a = e.a.map(flatten);
      if (e.t === "and" || e.t === "or") e.a = e.a.flatMap((x) => (x.t === e.t ? x.a : [x]));
    } else if (e.a) e.a = flatten(e.a);
    return e;
  }
  B.flatten = (e) => flatten(clone(e));
  /* one rewrite, outermost first. returns {e, rule} or null */
  B.step = function (e) {
    e = clone(e);
    let rule = null;
    function rw(x) {
      if (rule) return x;
      if (x.t === "not") {
        const y = x.a;
        if (y.t === "not") { rule = "หลักเกณฑ์ข้อที่ 9: complement ซ้อนสองชั้นหักล้างกัน"; return y.a; }
        if (y.t === "and") { rule = "DeMorgan ข้อ 1: complement ของผลคูณ = ผลบวกของ complement"; return { t: "or", a: y.a.map((z) => ({ t: "not", a: z })) }; }
        if (y.t === "or") { rule = "DeMorgan ข้อ 2: complement ของผลบวก = ผลคูณของ complement"; return { t: "and", a: y.a.map((z) => ({ t: "not", a: z })) }; }
        if (y.t === "const") { rule = "complement ของค่าคงที่"; return { t: "const", v: 1 - y.v }; }
        return x;
      }
      if (Array.isArray(x.a)) x.a = x.a.map(rw);
      return x;
    }
    const r = flatten(rw(e));
    return rule ? { e: r, rule } : null;
  };
  /* ---------- minimisation (Quine–McCluskey + exact cover; n ≤ 6) ----------
     ones, dcs: arrays of minterm indices (MSB = first variable)
     returns array of implicants: { pat: "1-0-", cells: [indices] } */
  B.minimize = function (n, ones, dcs) {
    dcs = dcs || [];
    const onesSet = new Set(ones);
    if (!ones.length) return [];
    const toPat = (m) => m.toString(2).padStart(n, "0");
    let cur = [...new Set([...ones, ...dcs])].map((m) => toPat(m));
    const primes = new Set();
    while (cur.length) {
      const used = new Set(), next = new Set();
      for (let i = 0; i < cur.length; i++) for (let j = i + 1; j < cur.length; j++) {
        const a = cur[i], b = cur[j];
        let diff = -1, ok = true;
        for (let k = 0; k < n; k++) if (a[k] !== b[k]) { if (a[k] === "-" || b[k] === "-" || diff >= 0) { ok = false; break; } diff = k; }
        if (ok && diff >= 0) { next.add(a.slice(0, diff) + "-" + a.slice(diff + 1)); used.add(a); used.add(b); }
      }
      cur.forEach((p) => { if (!used.has(p)) primes.add(p); });
      cur = [...next];
    }
    const cellsOf = (p) => { const out = []; for (let m = 0; m < 1 << n; m++) { const s = toPat(m); if ([...p].every((c, k) => c === "-" || c === s[k])) out.push(m); } return out; };
    const P = [...primes].map((p) => ({ pat: p, cells: cellsOf(p) })).filter((p) => p.cells.some((c) => onesSet.has(c)));
    // exact minimum cover (fewest implicants, then fewest literals) — small n so brute force with pruning
    const lits = (p) => [...p.pat].filter((c) => c !== "-").length;
    let best = null;
    const need = [...onesSet];
    (function search(chosen, covered, idx) {
      if (best && (chosen.length > best.length || (chosen.length === best.length))) {
        if (chosen.length > best.length) return;
      }
      const left = need.filter((m) => !covered.has(m));
      if (!left.length) {
        const cost = (s) => s.length * 100 + s.reduce((a, p) => a + lits(p), 0);
        if (!best || cost(chosen) < cost(best)) best = chosen.slice();
        return;
      }
      if (best && chosen.length >= best.length) return;
      const m = left[0];
      P.filter((p) => p.cells.includes(m)).sort((a, b) => b.cells.length - a.cells.length).forEach((p) => {
        const nc = new Set(covered); p.cells.forEach((c) => nc.add(c));
        chosen.push(p); search(chosen, nc, idx + 1); chosen.pop();
      });
    })([], new Set(), 0);
    return best || [];
  };
  /* implicant pattern → term html/text. mode "sop" (product) or "pos" (sum) */
  B.termOf = function (pat, vars, mode, html) {
    const ov = (v) => (html ? `<span class="ov">${v}</span>` : v + "'");
    const parts = [];
    [...pat].forEach((c, k) => {
      if (c === "-") return;
      if (mode === "sop") parts.push(c === "1" ? vars[k] : ov(vars[k]));
      else parts.push(c === "0" ? vars[k] : ov(vars[k]));
    });
    if (!parts.length) return mode === "sop" ? "1" : "0";
    return mode === "sop" ? parts.join("") : parts.length > 1 ? `(${parts.join(" + ")})` : parts[0];
  };

  B.steps = function (e, max) {
    const out = [];
    let cur = flatten(clone(e));
    for (let k = 0; k < (max || 20); k++) { const s = B.step(cur); if (!s) break; out.push(s); cur = s.e; }
    return out;
  };
})();
