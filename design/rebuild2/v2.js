/* Round 2 · one shared app for the three pattern styles. Needs ../rebuild/core.js (FM). */
(function () {
  const STYLE = document.body.dataset.style || "pixel";
  const $ = s => document.querySelector(s), go = f => location.hash = "#/county/" + f;

  // ---------- patterns that fill empty tiles (deterministic per seed)
  const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  function pattern(seed, w = 400, h = 300) {
    const r = rng(seed * 7919 + 13), G = "#51DA4C", K = "#0A0A0A", L = "#E2E2E2", M = "#BDBDBD";
    let s = "";
    if (STYLE === "pixel") {            // nader-style pixel blocks with fine line textures
      const n = 20, cols = Math.ceil(w / n), rows = Math.ceil(h / n);
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const v = r(), X = x * n, Y = y * n;
        if (v < .07) s += `<rect x="${X}" y="${Y}" width="${n}" height="${n}" fill="${G}"/>`;
        else if (v < .1) s += `<rect x="${X}" y="${Y}" width="${n}" height="${n}" fill="${K}"/>`;
        else if (v < .22) for (let i = 2; i < n; i += 3) s += `<line x1="${X + i}" y1="${Y + 2}" x2="${X + i}" y2="${Y + n - 2}" stroke="${M}" stroke-width=".8"/>`;
        else if (v < .3) for (let i = 2; i < n; i += 3) s += `<line x1="${X + 2}" y1="${Y + i}" x2="${X + n - 2}" y2="${Y + i}" stroke="${M}" stroke-width=".8"/>`;
        else if (v < .36) s += `<rect x="${X + .5}" y="${Y + .5}" width="${n - 1}" height="${n - 1}" fill="none" stroke="${L}"/>`; }
    } else if (STYLE === "lines") {     // barcode and hatching bands
      let x = 0;
      while (x < w) { const bw = 1 + Math.floor(r() * 4), gap = 2 + Math.floor(r() * 7), v = r();
        const col = v < .12 ? G : v < .3 ? K : M; const y0 = r() < .5 ? 0 : Math.floor(r() * h * .5), y1 = r() < .6 ? h : y0 + h * (.3 + r() * .5);
        s += `<rect x="${x}" y="${y0}" width="${bw}" height="${y1 - y0}" fill="${col}"/>`; x += bw + gap; }
      for (let i = 0; i < 3; i++) { const y = Math.floor(r() * h), hh = 10 + r() * 30; s += `<rect x="0" y="${y}" width="${w}" height="${hh}" fill="#F6F6F6"/>`;
        for (let k = 0; k < hh; k += 3) s += `<line x1="0" y1="${y + k}" x2="${w}" y2="${y + k}" stroke="${r() < .2 ? G : L}" stroke-width="1"/>`; }
    } else {                            // giant type as texture
      const glyphs = ["$", "1", "¢", "→", "%", "0", "+", "="], g = glyphs[Math.floor(r() * glyphs.length)], g2 = glyphs[Math.floor(r() * glyphs.length)];
      const bg = r() < .35 ? G : "#F6F6F6";
      s += `<rect width="${w}" height="${h}" fill="${bg}"/>`;
      s += `<text x="${w * .06}" y="${h * .93}" font-family="Inter" font-weight="800" font-size="${h * 1.08}" letter-spacing="-12" fill="${bg === G ? K : K}">${g}</text>`;
      s += `<text x="${w * .62}" y="${h * .42}" font-family="Inter" font-weight="800" font-size="${h * .42}" fill="${bg === G ? "#F6F6F6" : G}">${g2}</text>`;
      for (let i = 0; i < 6; i++) s += `<line x1="${w * .62}" y1="${h * (.55 + i * .06)}" x2="${w * .95}" y2="${h * (.55 + i * .06)}" stroke="${M}"/>`;
    }
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${s}</svg>`;
  }
  const pat = (span, seed, extra = "") => `<div class="cell pat ${span}" ${extra}>${pattern(seed)}</div>`;

  // ---------- shell
  document.body.insertAdjacentHTML("afterbegin", `
  <a class="skip" href="#main">Skip to content</a>
  <header class="top no-print"><a class="brand" href="#/"><i aria-hidden="true"><b></b><b></b><b></b><b></b></i>Federal Money Atlas</a>
    <nav class="main" aria-label="Main"><a href="#/" data-nav="home">Home</a><a href="#/map" data-nav="map">Map</a><a href="#/list" data-nav="list">Counties</a><a href="#/compare" data-nav="compare">Compare</a><a href="#/about" data-nav="about">About</a></nav></header>
  <main id="main" tabindex="-1">
    <section data-view="home" id="v-home" aria-labelledby="h-home"></section>
    <section data-view="map" hidden class="mapview" aria-labelledby="map-title"></section>
    <section data-view="county" hidden id="v-county"></section>
    <section data-view="list" hidden id="v-list" aria-labelledby="h-list"></section>
    <section data-view="compare" hidden id="v-compare" aria-labelledby="h-cmp"></section>
    <section data-view="about" hidden id="v-about" aria-labelledby="h-about"></section>
  </main>
  <div class="scrim" id="scrim"></div>
  <aside class="picker" id="picker" aria-labelledby="pk-h" aria-hidden="true">
    <header><h2 id="pk-h">Pick counties on the map</h2><button class="closebtn" id="pk-close" aria-label="Close map picker">×</button></header>
    <div class="body"><p class="small" style="margin-bottom:10px">Click a county to add it (up to three). Search and the dropdowns work too.</p><div id="pk-map"></div><div id="pk-legend"></div></div>
    <div class="chosen" id="pk-chosen"></div>
  </aside>`);

  // ---------- HOME
  const ex = ["39049", "54047", "06081", "48201"].map(f => FM.C[f]);
  $("#v-home").innerHTML = `
  <div class="grid">
    <div class="cell s8 white"><p class="label">Fiscal year 2023 · 3,144 counties</p>
      <h1 class="hero" id="h-home">What does $1 get you?</h1>
      <p class="lead">For every $1 a county's residents pay in federal taxes, see how much federal money comes back — Social Security, grants and contracts.</p>
      <div class="search"><label class="sr" for="q-home">Find your county</label><input id="q-home" placeholder="Find your county — e.g. Franklin, OH"></div>
      <div class="btnrow"><a class="btn primary" href="#/map"><span class="dot" aria-hidden="true"></span>Show the map</a><a class="btn" href="#/list">Browse counties</a></div></div>
    <div class="cell s4 green"><div class="stack"><p class="label" style="color:var(--ink)">The typical county gets back</p>
      <div><p class="giant">${FM.r2(FM.MED)}</p><p style="margin-top:12px;font-weight:600">for every $1 of federal tax. The U.S. overall is ${FM.r2(FM.US)} — a few high-income places pay much of the tax.</p></div></div></div>
  </div>
  <div class="grid">
    ${pat("s3", 11)}
    <div class="cell s3"><p class="label">U.S. overall</p><p class="big" style="margin-top:14px">${FM.r2(FM.US)}</p><p class="small" style="margin-top:6px">back per $1, all counties added up</p></div>
    ${pat("s3", 23)}
    <div class="cell s3"><p class="label">Counted</p><p class="big" style="margin-top:14px">3 kinds</p><p class="small" style="margin-top:6px">Social Security &amp; SSI · grants · contracts</p></div>
  </div>
  <div class="grid"><div class="cell s12" style="padding-bottom:14px"><h2 class="label">Start with a county</h2></div></div>
  <div class="grid">${ex.map(c => `<div class="cell s3"><a class="ex" href="#/county/${c.fips}"><p class="label">${FM.esc(FM.stName(c.st))}</p><h2 class="t">${FM.esc(c.name)}</h2>
    <p class="big" style="margin-top:20px">${FM.r2(c.ratio)}</p><p class="small" style="margin-top:6px">back per $1 · ${FM.vsTypical(c)} typical</p>
    <div class="bar" aria-hidden="true"><i style="width:${Math.min(100, 100 * c.ratio / 4)}%"></i></div></a></div>`).join("")}</div>
  <div class="grid"><div class="cell s12" style="padding-bottom:14px"><h2 class="label">How it works</h2></div></div>
  <div class="grid">
    <div class="cell s3"><p class="step">1</p><h2 class="t">Money in</h2><p class="small" style="margin-top:6px">Federal Social Security, grants and contracts that reached the county.</p><div class="mini" style="background:var(--green)"></div></div>
    <div class="cell s3"><p class="step">2</p><h2 class="t">Taxes out</h2><p class="small" style="margin-top:6px">Federal taxes its residents paid: income tax from the IRS, the rest estimated.</p><div class="mini" style="background:var(--ink)"></div></div>
    <div class="cell s3"><p class="step">3</p><h2 class="t">Divide</h2><p class="small" style="margin-top:6px">Money in ÷ taxes out = dollars back for every $1.</p><div class="mini" style="background:repeating-linear-gradient(90deg,var(--green) 0 12px,var(--ink) 12px 14px)"></div></div>
    ${pat("s3", 37)}
  </div>`;
  FM.combobox($("#q-home"), c => go(c.fips));

  // ---------- MAP page: key above, slide-out options on the left, result card top-right
  const MP = { kind: "all", view: "land", pop: [0, 100], rat: [0, 60] };
  const popAt = p => p <= 0 ? 0 : p >= 100 ? Infinity : Math.round(Math.pow(10, 2 + p * 5 / 100));
  const ratAt = p => p >= 60 ? Infinity : p * 0.05;
  const fmtPop = v => v === Infinity ? "any" : v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : v >= 1e3 ? Math.round(v / 1e3) + "K" : String(v);
  const filterFn = () => { const [a, b] = MP.pop.map(popAt), [c, d] = MP.rat.map(ratAt), popOn = MP.pop[0] > 0 || MP.pop[1] < 100, ratOn = MP.rat[0] > 0 || MP.rat[1] < 60;
    if (!popOn && !ratOn) return "all";
    return x => x.pop >= a && x.pop <= b && (!ratOn || (FM.hasRatio(x) && x.ratio >= c && x.ratio <= d)); };
  $('[data-view="map"]').innerHTML = `
    <div class="keybar"><h1 id="map-title" tabindex="-1"></h1><div id="map-key"></div><a id="map-list" href="#/list">View as a list →</a></div>
    <div class="stage" id="stage">
      <aside class="drawer" id="drawer" aria-label="Map options">
        <fieldset><legend><span class="n">1</span>What came back?</legend>
          ${Object.entries(FM.KINDS).map(([k, d]) => `<label class="radio"><input type="radio" name="kind" value="${k}" ${k === "all" ? "checked" : ""}>${d.label}<span class="v">${FM.r2(FM.usPer(k))}</span></label>`).join("")}</fieldset>
        <fieldset><legend><span class="n">2</span>Filter counties</legend>
          <div class="range"><div class="hd"><span id="pop-l">Population</span><output id="pop-o"></output></div>
            <div class="dual" id="pop"><div class="track"></div><div class="fill"></div>
              <input type="range" min="0" max="100" value="0" aria-labelledby="pop-l" aria-label="Minimum population"><input type="range" min="0" max="100" value="100" aria-label="Maximum population"></div></div>
          <div class="range"><div class="hd"><span id="rat-l">Dollars back per $1</span><output id="rat-o"></output></div>
            <div class="dual" id="rat"><div class="track"></div><div class="fill"></div>
              <input type="range" min="0" max="60" value="0" aria-label="Minimum dollars back per $1"><input type="range" min="0" max="60" value="60" aria-label="Maximum dollars back per $1"></div></div>
          <p class="count" id="m-count" aria-live="polite"></p><button class="reset" id="m-reset">Reset filters</button></fieldset>
        <fieldset><legend><span class="n">3</span>View</legend>
          <div class="seg" role="radiogroup" aria-label="Map view">${[["land", "Land"], ["people", "People"], ["grid", "Grid"]].map(([v, l]) => `<label><input type="radio" name="view" value="${v}" ${v === "land" ? "checked" : ""}>${l}</label>`).join("")}</div>
          <p class="small" id="m-viewnote" style="margin-top:10px"></p></fieldset>
      </aside>
      <button class="drawer-tab" id="drawer-tab" aria-controls="drawer" aria-expanded="true"><span aria-hidden="true" id="tab-arrow">‹</span><span id="tab-text">Hide options</span></button>
      <div class="mapholder" id="map2"></div>
    </div>`;
  const setDrawer = open => { $("#stage").classList.toggle("closed", !open); $("#drawer-tab").setAttribute("aria-expanded", open);
    $("#tab-arrow").textContent = open ? "‹" : "›"; $("#tab-text").textContent = open ? "Hide options" : "Options"; $("#drawer").inert = !open; };
  $("#drawer-tab").onclick = () => setDrawer($("#stage").classList.contains("closed"));
  setDrawer(!matchMedia("(max-width: 760px)").matches);   // open on desktop, closed on phones
  const dual = (id, key, fmt, max) => {
    const box = $("#" + id), [lo, hi] = box.querySelectorAll("input"), fill = box.querySelector(".fill");
    const sync = src => { let a = +lo.value, b = +hi.value; if (a > b) { if (src === lo) lo.value = a = b; else hi.value = b = a; }
      MP[key] = [a, b]; fill.style.left = (100 * a / max) + "%"; fill.style.width = (100 * (b - a) / max) + "%";
      $("#" + id + "-o").textContent = fmt(a, b); lo.setAttribute("aria-valuetext", fmt(a, b).split("–")[0]); hi.setAttribute("aria-valuetext", fmt(a, b).split("–")[1] || ""); };
    lo.oninput = () => { sync(lo); mapUpdate(); }; hi.oninput = () => { sync(hi); mapUpdate(); }; sync();
    return v => { lo.value = v[0]; hi.value = v[1]; sync(); };
  };
  const setPop = dual("pop", "pop", (a, b) => `${a === 0 ? "any" : fmtPop(popAt(a))}–${fmtPop(popAt(b))}`, 100);
  const setRat = dual("rat", "rat", (a, b) => `${FM.r2(ratAt(a))}–${b >= 60 ? "$3.00+" : FM.r2(ratAt(b))}`, 60);
  document.querySelectorAll('#drawer input[name="kind"]').forEach(i => i.onchange = () => { MP.kind = i.value; mapUpdate(); });
  document.querySelectorAll('#drawer input[name="view"]').forEach(i => i.onchange = () => { MP.view = i.value; mapUpdate(); });
  $("#m-reset").onclick = () => { MP.pop = [0, 100]; MP.rat = [0, 60]; setPop(MP.pop); setRat(MP.rat); mapUpdate(); };
  let bigMap;
  function mapUpdate() {
    const f = filterFn(), n = f === "all" ? FM.ALL.length : FM.ALL.filter(f).length;
    $("#map-title").textContent = `${FM.KINDS[MP.kind].short} back per $1 of tax`;
    $("#map-key").innerHTML = FM.legendHTML(MP.kind, f);
    $("#m-count").textContent = `${FM.int(n)} of ${FM.int(FM.ALL.length)} counties shown`;
    $("#m-viewnote").textContent = { land: "Every county at its real size.", people: "Each county is a circle sized by its residents.", grid: "Nearby counties combined into equal squares." }[MP.view];
    $("#map-list").href = FM.listURL({ kind: MP.kind, sort: "hi" });
    if (bigMap) bigMap.set({ kind: MP.kind, size: f, view: MP.view });
  }
  mapUpdate();

  // ---------- COUNTY (A-style tiles, more pattern)
  function county(fips) {
    const c = FM.C[fips], el = $("#v-county");
    if (!c) { el.innerHTML = `<div class="grid"><div class="cell s12"><h1>County not found</h1><p class="lead">Try the search on the <a href="#/">home page</a> or browse <a href="#/list">every county</a>.</p></div></div>`; return; }
    const ok = FM.hasRatio(c), sr = FM.stateRank(c), max = Math.max(c.money, c.taxes, 1), pp = v => FM.whole(v / c.pop), caution = FM.caution(c);
    const nbs = [c, ...FM.neighbors(c)].filter(x => FM.hasRatio(x)).sort((a, b) => b.ratio - a.ratio), nmax = Math.max(...nbs.map(x => x.ratio), .01);
    const share = v => c.money > 0 ? Math.max(0, v) / c.money : 0;
    const tile = (lab, v, sub, est) => `<div class="cell s3"><h2 class="label">${lab}${est ? '<span class="est">est.</span>' : ""}</h2><p class="big" style="margin-top:16px">${FM.money(v)}</p><p class="small" style="margin-top:8px">${sub}</p>
      <div class="mini" style="background:#E5E5E5" aria-hidden="true"><div style="height:100%;width:${100 * share(v)}%;background:var(--green)"></div></div></div>`;
    el.innerHTML = `
    <div class="grid">
      <div class="cell s8 white"><p class="crumb"><a href="#/">Home</a> / <a href="#/list">Counties</a> / ${FM.esc(FM.stName(c.st))}</p>
        <h1>${FM.esc(c.name)}, ${FM.esc(FM.stName(c.st))}</h1><p class="lead">${FM.esc(FM.sentence(c))}</p>
        ${caution ? `<p class="fm-caution"><b>Note</b><span>${FM.esc(caution)}</span></p>` : ""}
        <p class="small" style="margin-top:16px">Fiscal year ${FM.FY} · ${FM.int(c.pop)} residents · data as of ${FM.ASOF}</p></div>
      <div class="cell s4 green"><div class="stack"><h2 class="label" style="color:var(--ink)">Back per $1 of federal tax</h2>
        <div><p class="giant">${ok ? FM.r2(c.ratio) : "—"}</p><p style="margin-top:12px;font-weight:600">${ok ? `Typical county: ${FM.r2(FM.MED)}` : "Not reported (counted with a neighboring county)"}</p></div></div></div>
    </div>
    ${ok ? `<div class="grid">
      <div class="cell s7 bars"><h2 class="label">Paid vs. came back</h2>
        <div class="row"><div class="t2"><span>Federal money that came back</span><b>${FM.money(c.money)}</b></div><div class="track"><div class="fill" style="width:${100 * Math.max(0, c.money) / max}%;background:var(--green)"></div></div></div>
        <div class="row"><div class="t2"><span>Federal taxes residents paid</span><b>${FM.money(c.taxes)}</b></div><div class="track"><div class="fill" style="width:${100 * c.taxes / max}%;background:var(--ink)"></div></div></div>
        <p class="small" style="margin-top:16px">Per resident: ${pp(c.money)} came back, ${pp(c.taxes)} paid. Taxes other than income tax are estimated.</p></div>
      <div class="cell s3 gray"><div class="stack"><h2 class="label">Rank · 1 = most back</h2><div><p class="big">#${FM.int(FM.rank(c))}</p><p class="small" style="margin-top:6px">of ${FM.int(FM.N)} counties${sr ? ` · ${sr.r} of ${sr.n} in ${FM.esc(FM.stName(c.st))}` : ""}</p></div></div></div>
      ${pat("s2", +c.fips)}
    </div>` : ""}
    <div class="grid">
      ${tile("Social Security & SSI", c.ss, `${pp(c.ss)} per resident · ${Math.round(100 * share(c.ss))}% of money in`)}
      ${tile("Grants", c.gr, `${pp(c.gr)} per resident · includes ${FM.money(c.gs)} statewide share`, true)}
      ${tile("Contracts", c.con, `${pp(c.con)} per resident · ${Math.round(100 * share(c.con))}% of money in`)}
      ${pat("s3", +c.fips + 5)}
    </div>
    <div class="grid">
      <div class="cell s5"><h2 class="label">Next door</h2><svg id="nbmap" style="width:100%;height:auto;display:block;margin-top:12px" role="img" aria-label="Map of ${FM.esc(c.name)} and neighboring counties"></svg></div>
      <div class="cell s4"><h2 class="label">Back per $1, with neighbors</h2><ul class="nb">${nbs.map(x => `<li class="${x === c ? "me" : ""}"><a href="#/county/${x.fips}">${FM.esc(x.short)}${x === c ? " (this county)" : x.st !== c.st ? ", " + x.st : ""}</a><i style="width:${100 * Math.max(0, x.ratio) / nmax}%" aria-hidden="true"></i><span>${FM.r2(x.ratio)}</span></li>`).join("")}</ul></div>
      <div class="cell s3"><h2 class="label">More</h2><div class="act">
        <button id="csv">Download the numbers <span class="tag">CSV</span></button>
        <a href="#/compare?pins=${c.fips}">Compare with others <span aria-hidden="true">→</span></a>
        <a href="#/map">Open the map <span aria-hidden="true">→</span></a></div></div>
    </div>
    <p class="foot">Sources: USAspending.gov, IRS Statistics of Income, U.S. Treasury, Census Bureau. “est.” marks figures shared out by formula.</p>`;
    $("#csv").onclick = () => FM.downloadCSV(c);
    FM.neighborMap($("#nbmap"), c, go);
  }

  // ---------- LIST (Option B style)
  $("#v-list").innerHTML = `
    <div class="grid"><div class="cell s9 white"><p class="label">All counties</p><h1 id="h-list">Every county</h1><p class="lead">Filter, sort, and open any county. The address saves your filters.</p></div>${pat("s3", 51)}</div>
    <div class="col" style="margin-top:8px">
      <div class="filters">
        <label class="sr" for="l-q">Filter by name</label><input id="l-q" placeholder="Filter by name">
        <label class="sr" for="l-st">State</label><select id="l-st"><option value="">All states</option>${FM.stateOptions()}</select>
        <label class="sr" for="l-sz">Size</label><select id="l-sz">${Object.entries(FM.SIZES).map(([k, d]) => `<option value="${k}">${d.label}</option>`).join("")}</select>
        <label class="sr" for="l-k">Money shown</label><select id="l-k">${Object.entries(FM.KINDS).map(([k, d]) => `<option value="${k}">${d.label}</option>`).join("")}</select>
        <label class="sr" for="l-sort">Sort</label><select id="l-sort"><option value="pop">Most residents</option><option value="hi">Most back per $1</option><option value="lo">Least back per $1</option><option value="name">A–Z</option></select>
      </div>
      <p class="small" id="l-n" aria-live="polite" style="margin-bottom:12px"></p>
      <ul class="rows" id="l-rows"></ul><button class="linkbtn" id="l-more">Show 50 more</button></div>`;
  let LP, LN = 50;
  const row = (c, sub, v) => `<li><a class="r" href="#/county/${c.fips}"><span class="n">${FM.esc(c.name)}, ${c.st}<small>${sub}</small></span><span class="v">${FM.r2(v === undefined ? c.ratio : v)}</span></a></li>`;
  ["#l-q", "#l-st", "#l-sz", "#l-k", "#l-sort"].forEach(s => $(s).addEventListener("input", () => { LN = 50;
    LP = { q: $("#l-q").value, st: $("#l-st").value, size: $("#l-sz").value, kind: $("#l-k").value, sort: $("#l-sort").value };
    history.replaceState(null, "", FM.listURL(LP)); drawList(); }));
  $("#l-more").onclick = () => { LN += 50; drawList(); };
  function list(_, p) { LP = FM.listParams(p); $("#l-q").value = LP.q; $("#l-st").value = LP.st; $("#l-sz").value = LP.size; $("#l-k").value = LP.kind; $("#l-sort").value = LP.sort; LN = 50; drawList(); }
  function drawList() { const rows = FM.listRows(LP);
    $("#l-n").textContent = `${FM.int(rows.length)} counties · ${FM.KINDS[LP.kind].short} back per $1`;
    $("#l-rows").innerHTML = rows.slice(0, LN).map(({ c, v }) => row(c, `${FM.esc(FM.stName(c.st))} · ${FM.int(c.pop)} residents`, v)).join("");
    $("#l-more").hidden = rows.length <= LN; }

  // ---------- COMPARE (Option B style + state/county dropdowns + slide-out map picker)
  $("#v-compare").innerHTML = `
    <div class="grid"><div class="cell s9 white"><p class="label">Compare</p><h1 id="h-cmp">Side by side</h1><p class="lead">Up to three counties. Choose from the dropdowns, search, or pick them on a map.</p></div>${pat("s3", 63)}</div>
    <div class="col" style="margin-top:8px">
      <div class="pins" id="pins" aria-live="polite"></div>
      <div id="adder-wrap">
        <div class="adder"><label>State<select id="c-st"><option value="">Choose a state</option>${FM.stateOptions()}</select></label>
          <label>County<select id="c-co" disabled><option>Choose a state first</option></select></label>
          <button class="btn primary sm" id="c-add" disabled style="height:46px">Add</button></div>
        <p class="or">or</p>
        <div class="btnrow" style="margin-top:12px"><div class="search" style="margin:0;flex:1 1 260px"><label class="sr" for="c-q">Search for a county</label><input id="c-q" placeholder="Search for a county" style="font-size:16px;padding:12px 14px"></div>
          <button class="btn green" id="c-pick">Pick on a map →</button></div>
      </div>
      <div style="margin-top:32px" id="cmp"></div>
      <button class="linkbtn" id="copy">Copy link to this comparison</button></div>`;
  let PINS = [], pkMap;
  const setPins = l => location.hash = "#/compare?pins=" + l.join(",");
  const addPin = f => { if (PINS.includes(f) || PINS.length >= 3) return; setPins([...PINS, f]); };
  $("#c-st").onchange = e => { const st = e.target.value, sel = $("#c-co");
    sel.innerHTML = st ? FM.ALL.filter(c => c.st === st).sort((a, b) => a.name.localeCompare(b.name)).map(c => `<option value="${c.fips}">${FM.esc(c.name)} (${FM.r2(c.ratio)})</option>`).join("") : "<option>Choose a state first</option>";
    sel.disabled = !st; $("#c-add").disabled = !st; };
  $("#c-add").onclick = () => { const f = $("#c-co").value; if (FM.C[f]) addPin(f); };
  FM.combobox($("#c-q"), c => addPin(c.fips));
  $("#copy").onclick = e => FM.copyLink(e.currentTarget);
  const openPicker = open => { $("#picker").classList.toggle("open", open); $("#scrim").classList.toggle("on", open); $("#picker").setAttribute("aria-hidden", !open); $("#picker").inert = !open;
    if (open) { if (!pkMap && FM.geo) { pkMap = FM.makeMap($("#pk-map"), { bg: "#FFFFFF", sheet: false, onPick: ids => addPin(ids[0]), label: "Map of counties. Click a county to add it to the comparison." }); }
      if (pkMap) { pkMap.set({ kind: "all", size: "all", view: "land" }); pkMap.select(PINS[PINS.length - 1] || null); }
      $("#pk-legend").innerHTML = FM.legendHTML("all", "all"); drawChosen(); $("#pk-close").focus(); }
    else $("#c-pick").focus(); };
  $("#c-pick").onclick = () => openPicker(true); $("#pk-close").onclick = () => openPicker(false); $("#scrim").onclick = () => openPicker(false);
  addEventListener("keydown", e => { if (e.key === "Escape" && $("#picker").classList.contains("open")) openPicker(false); });
  $("#picker").inert = true;
  function drawChosen() { $("#pk-chosen").innerHTML = (PINS.length ? PINS.map(f => `<span class="pin">${FM.esc(FM.C[f].short)}, ${FM.C[f].st}</span>`).join("") : '<span class="small">No counties chosen yet.</span>') + (PINS.length ? `<button class="btn primary sm" id="pk-done" style="margin-left:auto">Done — compare ${PINS.length}</button>` : "");
    const d = $("#pk-done"); if (d) d.onclick = () => openPicker(false); }
  function compare(_, p) {
    PINS = (p.get("pins") || "").split(",").filter(f => FM.C[f]).slice(0, 3);
    $("#pins").innerHTML = PINS.length ? PINS.map((f, i) => `<span class="pin">${FM.esc(FM.C[f].short)}, ${FM.C[f].st}<button data-i="${i}" aria-label="Remove ${FM.esc(FM.C[f].name)}">×</button></span>`).join("") : '<span class="small">No counties yet.</span>';
    document.querySelectorAll("#pins button").forEach(b => b.onclick = () => setPins(PINS.filter((_, i) => i !== +b.dataset.i)));
    $("#adder-wrap").hidden = PINS.length >= 3;
    const cs = PINS.map(f => FM.C[f]);
    const metric = (label, get, fmt, color) => { const vals = cs.map(get), mx = Math.max(...vals.map(v => Math.abs(v || 0)), 1e-9);
      return `<div class="row"><span class="k">${label}</span><div class="vals">${cs.map((c, i) => `<div><span>${FM.esc(c.short)}</span><i style="width:${100 * Math.max(0, vals[i] || 0) / mx}%;${color ? "background:" + color : ""}" aria-hidden="true"></i><b>${fmt(vals[i])}</b></div>`).join("")}</div></div>`; };
    $("#cmp").innerHTML = cs.length ? `<div class="cmp">${metric("Back per $1 of tax", c => c.ratio, FM.r2, "var(--green)")}${metric("Money in per person", c => c.money / c.pop, FM.whole, "var(--green)")}${metric("Taxes per person", c => c.taxes / c.pop, FM.whole, "var(--ink)")}${metric("Social Security per $1", c => FM.perDollar("ss", c), FM.r2)}${metric("Residents", c => c.pop, FM.int)}</div>` : "";
    $("#copy").hidden = !cs.length;
    if ($("#picker").classList.contains("open")) { drawChosen(); if (pkMap) pkMap.select(PINS[PINS.length - 1] || null); }
  }

  // ---------- ABOUT
  $("#v-about").innerHTML = `
  <div class="grid">
    <div class="cell s8 white"><p class="label">About</p><h1 id="h-about">What this site measures</h1>
      <p class="lead">Federal money that reached each county in fiscal year 2023 — Social Security, grants and contracts — compared with the federal taxes its residents paid.</p></div>
    <div class="cell s4 green"><p class="label" style="color:var(--ink)">Status</p><p class="big" style="margin-top:12px">Prototype</p><p style="margin-top:8px;font-weight:600">Not published. Numbers from Phase 0.</p></div>
    ${[["Counted", "Money in", "Contracts, grants and Social Security & SSI committed in FY2023 for work or payments in the county (USAspending.gov)."],
      ["Counted", "Taxes paid", "Income tax from IRS county data, plus payroll, corporate, estate and excise taxes estimated from wages, investment income and population, scaled to Treasury totals."],
      ["Two benchmarks", "Typical county vs. U.S. overall", "The typical county ($1.09) is the one in the middle. The U.S. overall figure ($0.74) adds up every county. County pages compare with the typical county."],
      ["Estimated", "Statewide grants", "Medicaid and other statewide grants have no county, so each county gets a population share. They're marked “est.”"],
      ["Not counted", "Why the U.S. figure is under $1", "Medicare, veterans' payments, federal salaries, defense overhead and interest on the debt aren't tied to a county here."],
      ["Map", "Land, People, Grid", "Land shows real county sizes. People sizes each county by its residents. Grid combines nearby counties into equal squares. Connecticut isn't drawn yet."]]
      .map(([l, h, t]) => `<div class="cell s4"><h2 class="label">${l}</h2><h3 style="font:600 18px var(--sans);margin:6px 0 8px">${h}</h3><p class="small">${t}</p></div>`).join("")}
    ${pat("s6", 71)}${pat("s6", 79)}
  </div>`;

  // ---------- start
  FM.loadGeometry().then(() => {
    bigMap = FM.makeMap($("#map2"), { label: "Map of U.S. counties. Use the options panel to filter; use the county list for a text version." });
    mapUpdate();
    FM.route({ county, list, compare, map: () => { mapUpdate(); setTimeout(() => $("#map-title").focus({ preventScroll: true }), 0); } });
  });
})();
