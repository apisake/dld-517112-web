/* =========================================================
   slides.js — tiny dependency-free slide engine
   Markup:  <div class="stage"><div class="canvas">
              <section class="slide">… <aside class="notes">…</aside></section> …
   Keys:    → ↓ Space PgDn next · ← ↑ PgUp prev · Home/End
            F fullscreen · N notes · O overview · T theme · ? help
   Fragments: elements with class="frag" appear one by one.
   ========================================================= */
(function () {
  const DLD = window.DLD;
  document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.querySelector(".canvas");
    const slides = [...canvas.querySelectorAll(".slide")];
    const total = slides.length;
    let cur = 0;

    // auto footer
    const deckTitle = document.body.dataset.footer || document.title;
    slides.forEach((s, i) => {
      if (!s.querySelector("footer.sf")) s.insertAdjacentHTML("beforeend", `<footer class="sf"><span>${deckTitle}</span><span>${i + 1} / ${total}</span></footer>`);
    });

    // chrome
    const prog = DLD.h("div", { class: "progress" });
    const notes = DLD.h("div", { class: "notes-panel" });
    const ov = DLD.h("div", { class: "overview" });
    const help = DLD.h("div", { class: "help" }, `<div class="box"><h3 style="margin-top:0">คีย์ลัด</h3>
      <kbd>→</kbd> <kbd>Space</kbd> ถัดไป · <kbd>←</kbd> ก่อนหน้า<br><kbd>Home</kbd>/<kbd>End</kbd> สไลด์แรก/สุดท้าย<br>
      <kbd>F</kbd> เต็มจอ · <kbd>N</kbd> บันทึกผู้สอน · <kbd>O</kbd> ภาพรวมสไลด์<br><kbd>T</kbd> สลับธีมสว่าง/มืด · <kbd>?</kbd> ปิด/เปิดหน้านี้</div>`);
    const ui = DLD.h("div", { class: "deck-ui" });
    const count = DLD.h("span", { class: "count" });
    const mk = (txt, title, fn) => { const b = DLD.h("button", { type: "button", title }, txt); b.onclick = fn; return b; };
    const lessonHref = document.body.dataset.lesson || "index.html";
    ui.append(
      mk("◀", "ก่อนหน้า", () => step(-1)), count, mk("▶", "ถัดไป", () => step(1)),
      mk("▦", "ภาพรวม (O)", toggleOv), mk("✎", "บันทึกผู้สอน (N)", () => notes.classList.toggle("on")),
      mk("◐", "ธีม (T)", DLD.toggleTheme), mk("⛶", "เต็มจอ (F)", fs),
      DLD.h("a", { href: lessonHref, title: "กลับไปหน้าเนื้อหา" }, "📖 เนื้อหา"),
    );
    document.body.append(prog, notes, ov, help, ui);

    function fit() {
      const s = Math.min(innerWidth / 1280, innerHeight / 720);
      canvas.style.transform = `scale(${s})`;
    }
    addEventListener("resize", fit); fit();

    /* autoFit: ถ้าเนื้อหาของสไลด์ (รวม frag ที่ยังไม่แสดง และสถานะของ widget) สูงเกินพื้นที่
       ให้ย่อด้วย CSS zoom ทีละสไลด์ (ไม่ต่ำกว่า 0.6) — ทำใหม่เมื่อ widget เปลี่ยน */
    const LIMIT = 692, TOP = 56;
    function autoFit(s) {
      if (!s || s.classList.contains("title") || s.classList.contains("section")) return;
      const kids = [...s.children].filter((c) => !c.matches("footer.sf, aside.notes"));
      kids.forEach((c) => (c.style.zoom = ""));
      const scale = s.getBoundingClientRect().height / 720 || 1;
      for (let pass = 0; pass < 3; pass++) {
        const top = s.getBoundingClientRect().top;
        let bottom = 0; // วัดทุกองค์ประกอบ (ยกเว้นในกล่องที่เลื่อนได้และใน SVG) เพราะเนื้อหาอาจล้นออกนอกกล่องแม่
        kids.forEach((c) => [c, ...c.querySelectorAll("*")].forEach((e) => {
          if (e.closest("svg") && e.tagName !== "svg") return;
          if (e.parentElement && e.parentElement.closest('[style*="overflow"]') && e.parentElement.closest('[style*="overflow"]') !== s) return;
          const r = e.getBoundingClientRect(); if (r.height) bottom = Math.max(bottom, (r.bottom - top) / scale);
        }));
        if (bottom <= LIMIT) break;
        const cur = parseFloat(kids[0] && kids[0].style.zoom) || 1;
        const z = Math.max(0.6, cur * (LIMIT - TOP) / (bottom - TOP));
        kids.forEach((c) => (c.style.zoom = z.toFixed(3)));
        if (z === 0.6) break;
      }
    }
    let fitT;
    const mo = new MutationObserver(() => { clearTimeout(fitT); fitT = setTimeout(() => autoFit(slides[cur]), 60); });
    DLD.autoFit = () => autoFit(slides[cur]);
    addEventListener("resize", () => autoFit(slides[cur]));

    function frags(s) { return [...s.querySelectorAll(".frag")]; }
    function show(i, fromBack) {
      cur = Math.max(0, Math.min(total - 1, i));
      slides.forEach((s, k) => s.classList.toggle("active", k === cur));
      const s = slides[cur];
      frags(s).forEach((f) => f.classList.toggle("shown", !!fromBack));
      DLD.mountAll(s);
      prog.style.width = ((cur + 1) / total) * 100 + "%";
      count.textContent = `${cur + 1} / ${total}`;
      const n = s.querySelector("aside.notes");
      notes.innerHTML = `<b class="hd">บันทึกผู้สอน · สไลด์ ${cur + 1}</b><div>${n ? n.innerHTML : "<i>—</i>"}</div>`;
      history.replaceState(null, "", "#" + (cur + 1));
      [...ov.children].forEach((t, k) => t.classList.toggle("cur", k === cur));
      mo.disconnect();
      requestAnimationFrame(() => { autoFit(s); mo.observe(s, { childList: true, subtree: true, characterData: true }); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => autoFit(slides[cur]));
    }
    function step(d) {
      const s = slides[cur], fs = frags(s);
      if (d > 0) {
        const nxt = fs.find((f) => !f.classList.contains("shown"));
        if (nxt) { nxt.classList.add("shown"); return; }
        if (cur < total - 1) show(cur + 1);
      } else {
        const shown = fs.filter((f) => f.classList.contains("shown"));
        if (shown.length && !s.dataset.noBackFrag) { shown[shown.length - 1].classList.remove("shown"); return; }
        if (cur > 0) show(cur - 1, true);
      }
    }
    function fs() {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    }
    slides.forEach((s, i) => {
      const t = s.querySelector("h1,h2")?.textContent.trim() || "สไลด์";
      const th = DLD.h("div", { class: "thumb" }, `<b>${i + 1}</b>${t}`);
      th.onclick = () => { show(i); toggleOv(); };
      ov.appendChild(th);
    });
    function toggleOv() { ov.classList.toggle("on"); }

    document.addEventListener("keydown", (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "select" || tag === "textarea") return;
      const k = e.key;
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(k)) { e.preventDefault(); step(1); }
      else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(k)) { e.preventDefault(); step(-1); }
      else if (k === "Home") show(0);
      else if (k === "End") show(total - 1);
      else if (k === "f" || k === "F") fs();
      else if (k === "n" || k === "N") notes.classList.toggle("on");
      else if (k === "o" || k === "O" || k === "Escape") { if (k === "Escape") { ov.classList.remove("on"); help.classList.remove("on"); } else toggleOv(); }
      else if (k === "t" || k === "T") DLD.toggleTheme();
      else if (k === "?") help.classList.toggle("on");
    });
    // swipe
    let sx = null;
    addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
    addEventListener("touchend", (e) => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1); sx = null; });

    const fromHash = () => { const n = parseInt(location.hash.slice(1), 10); return isFinite(n) ? n - 1 : 0; };
    addEventListener("hashchange", () => { if (fromHash() !== cur) show(fromHash()); });
    show(fromHash());
  });
})();
