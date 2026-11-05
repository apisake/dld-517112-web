/* =========================================================
   site.js — shared helpers for every page
   (classic script: works from file:// and from any static host)
   ========================================================= */
(function () {
  const DLD = (window.DLD = window.DLD || {});

  /* ---------- theme ---------- */
  const THEME_KEY = "dld-theme";
  function applyTheme(t) {
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  }
  try { applyTheme(localStorage.getItem(THEME_KEY)); } catch (e) {}
  DLD.toggleTheme = function () {
    const cur = document.documentElement.getAttribute("data-theme") ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  };

  /* ---------- tiny SVG builder ---------- */
  const NS = "http://www.w3.org/2000/svg";
  DLD.svg = function (tag, attrs, parent) {
    const el = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) {
      if (k === "text") el.textContent = attrs[k];
      else el.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(el);
    return el;
  };
  DLD.h = function (tag, attrs, html) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "class") el.className = attrs[k];
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), attrs[k]);
      else el.setAttribute(k, attrs[k]);
    }
    if (html != null) el.innerHTML = html;
    return el;
  };
  DLD.fmt = function (x, d) {
    if (!isFinite(x)) return "—";
    const s = Number(x).toFixed(d == null ? 2 : d);
    return s.replace(/\.?0+$/, "") || "0";
  };
  /* engineering format: 0.01 s -> "10 ms" */
  DLD.eng = function (v, unit) {
    const P = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"]];
    const a = Math.abs(v);
    for (const [m, p] of P) if (a >= m * 0.9999) return DLD.fmt(v / m, 3) + " " + p + unit;
    return DLD.fmt(v / 1e-9, 3) + " n" + unit;
  };

  /* ---------- widget registry: <div data-widget="name"> ---------- */
  DLD.widgets = DLD.widgets || {};
  DLD.mountAll = function (root) {
    (root || document).querySelectorAll("[data-widget]").forEach((el) => {
      if (el.__mounted) return;
      const fn = DLD.widgets[el.dataset.widget];
      if (fn) { el.__mounted = true; fn(el); }
      else console.warn("unknown widget", el.dataset.widget);
    });
  };

  /* ---------- table-of-contents scroll spy ---------- */
  function scrollSpy() {
    const links = [...document.querySelectorAll(".toc-side a[href^='#']")];
    if (!links.length) return;
    const pairs = links.map((a) => [a, document.querySelector(a.getAttribute("href"))]).filter((p) => p[1]);
    const side = document.querySelector(".toc-side");
    let cur = null, queued = false;
    const update = () => {
      queued = false;
      let best = pairs[0];
      for (const p of pairs) { if (p[1].getBoundingClientRect().top <= 120) best = p; else break; }
      if (best && best[0] !== cur) {
        if (cur) cur.classList.remove("active");
        cur = best[0]; cur.classList.add("active");
        // keep the active entry visible inside the sidebar
        const r = cur.getBoundingClientRect(), sr = side.getBoundingClientRect();
        if (r.top < sr.top + 30 || r.bottom > sr.bottom - 30) side.scrollTop += r.top - sr.top - sr.height / 3;
      }
    };
    addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- quiz: <div class="quiz" data-quiz> with JSON in <script type="application/json"> ---------- */
  DLD.quiz = function (el, items) {
    el.innerHTML = "";
    let answered = 0, right = 0;
    const score = DLD.h("p", { class: "score" });
    const upd = () => (score.textContent = `คะแนน ${right} / ${items.length}` + (answered === items.length ? (right === items.length ? "  — ยอดเยี่ยม!" : "  — ทบทวนข้อที่ผิดอีกครั้ง") : ""));
    items.forEach((it, qi) => {
      const q = DLD.h("div", { class: "q" });
      q.appendChild(DLD.h("div", { class: "qt" }, `${qi + 1}. ${it.q}`));
      const opts = DLD.h("div", { class: "opts" });
      it.options.forEach((o, oi) => {
        const b = DLD.h("button", { class: "opt", type: "button" }, `${"กขคง"[oi]}. ${o}`);
        b.addEventListener("click", () => {
          if (q.classList.contains("done")) return;
          q.classList.add("done"); answered++;
          if (oi === it.answer) { b.classList.add("right"); right++; }
          else { b.classList.add("wrong"); opts.children[it.answer].classList.add("right"); }
          [...opts.children].forEach((x) => (x.disabled = true));
          upd();
        });
        opts.appendChild(b);
      });
      q.appendChild(opts);
      q.appendChild(DLD.h("div", { class: "why" }, "💡 " + it.why));
      el.appendChild(q);
    });
    const reset = DLD.h("button", { class: "btn sm", type: "button" }, "ทำใหม่");
    reset.addEventListener("click", () => DLD.quiz(el, items));
    const foot = DLD.h("div", { class: "controls" });
    foot.appendChild(score); foot.appendChild(reset);
    el.appendChild(foot); upd();
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-theme-toggle]").forEach((b) => b.addEventListener("click", DLD.toggleTheme));
    scrollSpy();
    DLD.mountAll();
  });
})();
