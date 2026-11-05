/* Round 3 · motion helpers.
   - Big numbers count up only when they scroll into view; the real value stays in aria-label,
     so screen readers and copy/paste never see a half-counted number.
   - Turns on the CSS entrance animations only after the page is running (class "anim" on <html>),
     so content can never get stuck invisible if animations don't run.
   Everything is skipped when the user prefers reduced motion. */
(function () {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  requestAnimationFrame(() => document.documentElement.classList.add("anim"));
  const parse = txt => { const m = txt.match(/^([−-]?\$?)([\d,]+(?:\.\d+)?)(.*)$/); return m && { pre: m[1], num: parseFloat(m[2].replace(/,/g, "")), dec: (m[2].split(".")[1] || "").length, post: m[3], comma: m[2].includes(",") }; };
  const count = el => {
    const txt = el.dataset.final || el.textContent.trim(), p = parse(txt); if (!p) return;
    el.dataset.final = txt; el.setAttribute("aria-label", txt);
    const fmt = v => p.comma ? Number(v.toFixed(p.dec)).toLocaleString(undefined, { minimumFractionDigits: p.dec, maximumFractionDigits: p.dec }) : v.toFixed(p.dec);
    const t0 = performance.now(), dur = 800;
    const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = k < 1 ? p.pre + fmt(p.num * e) + p.post : txt; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); count(e.target); } }), { threshold: .6 });
  const arm = () => setTimeout(() => {
    const v = document.querySelector("[data-view]:not([hidden])"); if (!v) return;
    v.querySelectorAll(".giant").forEach(el => { if (el.dataset.final) el.textContent = el.dataset.final; io.observe(el); });
  }, 140);
  addEventListener("hashchange", arm); document.addEventListener("fm:route", arm); arm();
})();
