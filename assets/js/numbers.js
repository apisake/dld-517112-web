/* =========================================================
   numbers.js — shared number-system helpers + widget UI kit
   (used from Chapter 2 onward)
   ========================================================= */
(function () {
  const DLD = (window.DLD = window.DLD || {});

  /* ---------------- number helpers ---------------- */
  const N = (DLD.num = {});
  N.DIG = "0123456789ABCDEF";
  N.toBase = (n, b, width) => {
    let s = Math.abs(Math.trunc(n)).toString(b).toUpperCase();
    if (width) s = s.padStart(width, "0");
    return (n < 0 ? "−" : "") + s;
  };
  N.parse = (str, b) => {
    str = String(str).trim().toUpperCase().replace(/[\s_]/g, "");
    if (!str) return NaN;
    const re = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^\d+$/, 16: /^[0-9A-F]+$/ }[b];
    if (!re.test(str)) return NaN;
    return parseInt(str, b);
  };
  N.bits = (n, w) => [...Array(w)].map((_, i) => (n >> (w - 1 - i)) & 1); // MSB first
  N.fromBits = (bits) => bits.reduce((a, b) => a * 2 + b, 0);
  N.str = (bits) => bits.join("");
  N.ones = (bits) => bits.map((b) => 1 - b);
  N.addBits = (a, b, cin) => { // equal length arrays MSB first → {sum, carries(index i = carry INTO column i from right), cout}
    const w = a.length, sum = Array(w).fill(0), carry = Array(w + 1).fill(0);
    carry[w] = cin || 0;
    for (let i = w - 1; i >= 0; i--) {
      const t = a[i] + b[i] + carry[i + 1];
      sum[i] = t & 1; carry[i] = t >> 1;
    }
    return { sum, carry, cout: carry[0] };
  };
  N.twos = (bits) => N.addBits(N.ones(bits), bits.map(() => 0), 1).sum;
  N.signedVal = (bits, mode) => {
    const w = bits.length, s = bits[0], mag = N.fromBits(bits.slice(1));
    if (mode === "unsigned") return N.fromBits(bits);
    if (mode === "sm") return s ? -mag : mag;
    if (mode === "ones") return s ? -N.fromBits(N.ones(bits)) : N.fromBits(bits);
    return N.fromBits(bits) - (s ? 2 ** w : 0); // twos
  };
  N.fromSigned = (v, w) => N.bits(((v % 2 ** w) + 2 ** w) % 2 ** w, w); // 2's complement encode
  N.group = (str, k) => { // split from the right into groups of k (pads left with 0)
    const pad = (k - (str.length % k)) % k;
    str = "0".repeat(pad) + str;
    return str.match(new RegExp(`.{${k}}`, "g"));
  };
  N.gray = (bits) => bits.map((b, i) => (i ? b ^ bits[i - 1] : b));
  N.ungray = (g) => { const out = []; g.forEach((b, i) => out.push(i ? b ^ out[i - 1] : b)); return out; };
  N.sup = (e) => String(e).replace(/-/g, "−");

  /* ---------------- UI kit ---------------- */
  const H = (...a) => DLD.h(...a);
  const U = (DLD.ui = {});
  U.shell = function (el, badge, title, hint) {
    el.classList.add("widget");
    el.innerHTML = "";
    el.appendChild(H("header", null, `<span class="badge">${badge}</span><h4>${title}</h4>`));
    const body = H("div", { class: "w-body" });
    if (hint) body.appendChild(H("p", { class: "w-hint" }, hint));
    el.appendChild(body);
    return body;
  };
  U.seg = function (options, val, onPick) {
    const box = H("div", { class: "seg", role: "group" });
    options.forEach(([v, text]) => {
      const b = H("button", { type: "button", class: v === val ? "on" : "" }, text);
      b.addEventListener("click", () => { box.set(v); onPick(v); });
      box.appendChild(b);
    });
    box.set = (v) => [...box.children].forEach((c, i) => c.classList.toggle("on", options[i][0] === v));
    return box;
  };
  U.btn = (text, onClick, cls) => { const b = H("button", { type: "button", class: "btn sm " + (cls || "") }, text); b.addEventListener("click", onClick); return b; };
  U.input = function (label, value, onInput, opts) {
    opts = opts || {};
    const lab = H("label");
    const inp = H("input", { type: "text", value, spellcheck: "false", autocomplete: "off", class: "num-in", style: `width:${opts.width || 140}px` });
    inp.addEventListener("input", () => onInput(inp.value));
    if (label) lab.append(label + " ");
    lab.append(inp);
    lab.input = inp;
    return lab;
  };
  U.readout = function (items) {
    const box = H("div", { class: "readout" });
    box.refs = {};
    items.forEach(([k, label]) => {
      const r = H("div", { class: "r" }, `<small>${label}</small><b>—</b>`);
      box.refs[k] = r.querySelector("b"); box.appendChild(r);
    });
    return box;
  };
  /* row of toggleable bit cells. opts: {labels:[], cls:(i)=>string, onToggle:(i)=>void} */
  U.bitRow = function (bits, opts) {
    opts = opts || {};
    const row = H("div", { class: "bitrow" + (opts.small ? " small" : "") + (opts.tiny ? " tiny" : "") });
    bits.forEach((b, i) => {
      const cell = H(opts.onToggle ? "button" : "span", { class: "bit " + (b ? "one " : "zero ") + (opts.cls ? opts.cls(i) : ""), type: "button" });
      if (opts.labels) cell.appendChild(H("small", null, opts.labels[i]));
      cell.appendChild(H("b", null, String(b)));
      if (opts.sub) cell.appendChild(H("small", { class: "sub" }, opts.sub[i]));
      if (opts.onToggle) cell.addEventListener("click", () => opts.onToggle(i));
      row.appendChild(cell);
    });
    return row;
  };
})();
