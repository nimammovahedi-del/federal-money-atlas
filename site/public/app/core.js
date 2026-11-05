/* Shared core for the three rebuilt prototypes (Bento, Editorial, Search-first).
   Data, formatting, search, the Land / People / Grid map, routing and CSV download.
   Each iteration only supplies its own markup and styles. Needs d3, topojson and data.js. */
(function () {
  const D = window.DATA, F = Object.fromEntries(D.fields.map((f, i) => [f, i]));
  const FM = (window.FM = {});
  // Multi-page mode (the real site): each page is its own URL and <body data-page="..."> says which view to show.
  // The app code still writes prototype-style "#/..." links; FM.path turns them into real addresses.
  FM.MULTI = !!document.body.dataset.page;
  const PATHS = { "": "/", map: "/map/", analytics: "/analytics/", list: "/counties/", compare: "/compare/", how: "/how-it-works/", about: "/about/" };
  FM.path = h => { if (!FM.MULTI || !h || !h.startsWith("#/")) return h;
    const [p, q] = h.slice(2).split("?"), parts = p.split("/").filter(Boolean);
    if (parts[0] === "county" && parts[1]) return `/county/${parts[1]}/`;
    if (!parts[0] && q && /mode=map/.test(q)) return "/map/";
    return (PATHS[parts[0] || ""] || "/") + (q ? "?" + q : ""); };
  if (FM.MULTI) {
    // Rewrite "#/..." links as they appear, and turn "#/..." navigations into real page loads.
    const fix = root => (root.querySelectorAll ? root.querySelectorAll('a[href^="#/"]') : []).forEach(a => a.setAttribute("href", FM.path(a.getAttribute("href"))));
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) { if (n.matches && n.matches('a[href^="#/"]')) n.setAttribute("href", FM.path(n.getAttribute("href"))); fix(n); } })))
      .observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["href"] });
    addEventListener("DOMContentLoaded", () => fix(document));
    addEventListener("hashchange", () => { if (location.hash.startsWith("#/")) location.replace(FM.path(location.hash)); });
    if (location.hash.startsWith("#/")) location.replace(FM.path(location.hash));   // old shared links like /#/county/39049
    FM.go = h => location.assign(FM.path(h));
  }
  FM.STATE_NAMES = {AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",DC:"District of Columbia",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming"};
  FM.stName = s => FM.STATE_NAMES[s] || s;
  FM.US = D.us_ratio; FM.MED = D.median_ratio; FM.ASOF = D.data_as_of; FM.FY = D.fiscal_year;

  // ---------- county records
  FM.C = {};
  for (const [fips, r] of Object.entries(D.counties)) {
    const g = f => (r[F[f]] ?? 0) * 1000;
    const c = { fips, ratio: r[F.ratio], pop: r[F.pop], name: r[F.name], st: r[F.st],
      con: g("contracts"), gc: g("grants_county"), gs: g("grants_statewide"), ss: g("ss"),
      ti: g("tax_income"), tp: g("tax_payroll"), to: g("tax_other"), other: g("other_direct"),
      medicare: r[F.medicare_est] == null ? null : r[F.medicare_est] * 1000, loans: g("loans_face"), flags: r[F.flags] || "", national: F.national == null ? 0 : g("national") };
    c.gr = c.gc + c.gs; c.money = c.con + c.gr + c.ss; c.taxes = c.ti + c.tp + c.to;
    c.short = c.name.replace(/ (County|Parish|Borough|Census Area|City and Borough|Municipality|Planning Region)$/, "");
    FM.C[fips] = c;
  }
  FM.ALL = Object.values(FM.C);

  // ---------- formatting
  const isNum = v => v != null && isFinite(v);
  FM.money = v => { if (!isNum(v)) return "—"; const a = Math.abs(v), s = v < 0 ? "−$" : "$";
    return a >= 1e12 ? s + (a / 1e12).toFixed(2) + "T" : a >= 1e9 ? s + (a / 1e9).toFixed(1) + "B" : a >= 1e6 ? s + (a / 1e6).toFixed(1) + "M" : a >= 1e3 ? s + Math.round(a / 1e3) + "K" : s + Math.round(a); };
  FM.moneyWords = v => { if (!isNum(v)) return "—"; const a = Math.abs(v), s = v < 0 ? "−$" : "$";
    return a >= 1e12 ? s + (a / 1e12).toFixed(1) + " trillion" : a >= 1e9 ? s + (a / 1e9).toFixed(1) + " billion" : a >= 1e6 ? s + (a / 1e6).toFixed(1) + " million" : s + Math.round(a).toLocaleString(); };
  FM.whole = v => isNum(v) ? (v < 0 ? "−$" : "$") + Math.round(Math.abs(v)).toLocaleString() : "—";
  FM.r2 = v => isNum(v) ? (v < 0 ? "−$" : "$") + Math.abs(v).toFixed(2) : "—";
  FM.cents = v => FM.r2(v);  // reviewers: use one format everywhere ($0.74, not 74¢)
  FM.pct = v => isNum(v) ? Math.round(100 * v) + "%" : "—";
  FM.int = v => isNum(v) ? Math.round(v).toLocaleString() : "—";
  FM.esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

  // ---------- kinds of money ("What came back?") and size groups ("Which counties?")
  FM.KINDS = {
    all: { label: "All federal money", short: "Federal money", part: c => c.money },
    ss:  { label: "Social Security & SSI", short: "Social Security", part: c => c.ss },
    gr:  { label: "Grants", short: "Grants", part: c => c.gr, note: "partly estimated" },
    con: { label: "Contracts", short: "Contracts", part: c => c.con },
  };
  FM.SIZES = {
    all: { label: "All counties", test: () => true },
    big: { label: "250,000+ people", test: c => c.pop >= 250000 },
    mid: { label: "50,000–250,000", test: c => c.pop >= 50000 && c.pop < 250000 },
    small: { label: "Under 50,000", test: c => c.pop < 50000 },
  };
  for (const s of Object.values(FM.SIZES)) s.count = FM.ALL.filter(s.test).length;
  FM.perDollar = (k, c) => c && c.taxes > 0 ? FM.KINDS[k].part(c) / c.taxes : null;
  FM.usPer = k => d3.sum(FM.ALL, c => FM.KINDS[k].part(c)) / d3.sum(FM.ALL, c => c.taxes);

  // Map colors: five greens (no near-black, which means "taxes"), five equal-sized groups of counties.
  FM.RAMP = ["#DDF5DA", "#A9E6A4", "#6FD068", "#3A9E35", "#1E6A1B"];
  FM.EXCLUDED = "#FFFFFF"; FM.NODATA = "url(#fm-hatch)";
  FM.scale = {};
  for (const k of Object.keys(FM.KINDS)) {
    const v = FM.ALL.map(c => FM.perDollar(k, c)).filter(isNum).sort(d3.ascending);
    FM.scale[k] = d3.scaleThreshold().domain(d3.range(1, 5).map(i => d3.quantileSorted(v, i / 5))).range(FM.RAMP);
  }
  FM.testOf = size => typeof size === "function" ? size : FM.SIZES[size].test;
  FM.groupValue = (list, kind, size) => {
    const l = list.filter(c => c && FM.testOf(size)(c)), t = d3.sum(l, c => c.taxes);
    return l.length && t > 0 ? d3.sum(l, c => FM.KINDS[kind].part(c)) / t : null;
  };
  FM.colorOf = (list, kind, size) => {
    if (!list.some(c => c && FM.testOf(size)(c))) return FM.EXCLUDED;
    const v = FM.groupValue(list, kind, size); return isNum(v) ? FM.scale[kind](v) : FM.NODATA; };
  FM.legendStops = kind => FM.scale[kind].domain().map(FM.cents);
  // Legend with each swatch labeled by its range (so color is never the only cue).
  FM.legendHTML = (kind, size) => { const d = FM.scale[kind].domain().map(FM.r2);
    const lab = ["under " + d[0], d[0] + "–" + d[1], d[1] + "–" + d[2], d[2] + "–" + d[3], d[3] + "+"];
    return `<ul class="fm-legend" aria-label="Map key, ${FM.KINDS[kind].short} back per $1 of tax">` + FM.RAMP.map((c, i) => `<li><i style="background:${c}"></i>${lab[i]}</li>`).join("") +
      `<li><i class="fm-hatch"></i>no data</li>${size !== "all" ? '<li><i style="background:#fff;border:1px solid #8A8A8A"></i>outside your filters</li>' : ""}</ul>`; };

  // ---------- ranks, comparisons, sentences
  const ranked = FM.ALL.filter(c => isNum(c.ratio)).sort((a, b) => b.ratio - a.ratio);
  FM.N = ranked.length;
  FM.rank = c => { const i = ranked.indexOf(c); return i < 0 ? null : i + 1; };
  FM.stateRank = c => { const l = ranked.filter(x => x.st === c.st); const i = l.indexOf(c); return i < 0 ? null : { r: i + 1, n: l.length }; };
  FM.vsTypical = c => !isNum(c.ratio) ? null : c.ratio >= FM.MED * 2 ? `${(c.ratio / FM.MED).toFixed(1)}× as much as` : c.ratio > FM.MED * 1.1 ? "more than" : c.ratio < FM.MED * 0.9 ? "less than" : "about the same as";
  // Plain-language warning for counties whose number is driven by something unusual.
  FM.caution = c => { const f = c.flags || "";
    if (/no IRS data/.test(f)) return "The IRS reports this county's taxes together with a neighboring county, so there's no dollars-back figure.";
    if (c.national > 0) return `${FM.money(c.national)} in nationwide health-benefit contracts (veterans' community care or TRICARE) is booked to an office here. It pays for care across the country, so it's shown separately and not counted for this county.`;
    if (/contracts dominate/.test(f)) return "Most of this is one or a few large federal contracts (for example a base, lab or shipyard) — not money paid to residents.";
    if (/negative/.test(f)) return "Some federal money was taken back this year, which pulls the number down.";
    if (/small population/.test(f)) return "Very few people live here, so one award can swing the number a lot.";
    if (/no IRS data/.test(f)) return "The IRS reports this county's taxes together with a neighboring county.";
    if (c.st === "CT") return "Connecticut reports by 9 planning regions instead of counties.";
    return ""; };
  FM.largest = c => [["Social Security", c.ss], ["grants", c.gr], ["contracts", c.con]].sort((a, b) => b[1] - a[1])[0][0];
  FM.sentence = c => !isNum(c.ratio)
    ? `The IRS reports ${c.name}'s taxes together with a neighboring county, so there is no figure for it.`
    : `For every $1 its residents paid in federal taxes, ${c.name} got ${FM.r2(c.ratio)} back in federal money — ${FM.vsTypical(c)} the typical county (${FM.r2(FM.MED)}).`;
  FM.hasRatio = c => isNum(c.ratio) && c.taxes > 0;

  // ---------- search (name starts-with first, then contains; bigger counties first)
  const ST_BY_NAME = Object.fromEntries(Object.entries(FM.STATE_NAMES).map(([a, n]) => [n.toLowerCase(), a]));
  const lev = (a, b) => { const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9; let p = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) { const q = [i]; for (let j = 1; j <= n; j++) q[j] = Math.min(p[j] + 1, q[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = q; } return p[n]; };
  FM.parseQuery = raw => {
    let q = raw.trim().toLowerCase().replace(/\s+/g, " "), st = null;
    const comma = q.split(","); if (comma.length > 1) { const t = comma.slice(1).join(",").trim(); st = ST_BY_NAME[t] || (t.length === 2 && FM.STATE_NAMES[t.toUpperCase()] ? t.toUpperCase() : null); q = comma[0].trim(); }
    if (!st) { for (const [n, a] of Object.entries(ST_BY_NAME)) if (q.endsWith(" " + n) && q.length > n.length + 1) { st = a; q = q.slice(0, -n.length - 1).trim(); break; }
      const m = q.match(/ ([a-z]{2})$/); if (!st && m && FM.STATE_NAMES[m[1].toUpperCase()]) { st = m[1].toUpperCase(); q = q.slice(0, -3).trim(); } }
    q = q.replace(/\b(county|parish|borough|census area|planning region)\b/g, "").replace(/\bst\.? /g, "st. ").replace(/\bsaint /g, "st. ").trim();
    return { q, st };
  };
  FM.search = (raw, n = 10) => {
    const { q, st } = FM.parseQuery(raw); if (!q && !st) return [];
    const pool = st ? FM.ALL.filter(c => c.st === st) : FM.ALL, by = (a, b) => b.pop - a.pop;
    const starts = [], has = [];
    for (const c of pool) { const nm = c.short.toLowerCase(); if (!q || nm.startsWith(q)) starts.push(c); else if (nm.includes(q)) has.push(c); }
    let out = [...starts.sort(by), ...has.sort(by)];
    if (!out.length && q.length >= 3) // typo tolerance: compare against the start of each name
      out = pool.map(c => [c, lev(q, c.short.toLowerCase().slice(0, q.length))]).filter(x => x[1] <= (q.length > 5 ? 2 : 1)).sort((a, b) => a[1] - b[1] || b[0].pop - a[0].pop).map(x => x[0]);
    return out.slice(0, n);
  };

  // ---------- accessible search box (ARIA combobox): FM.combobox(inputEl, onChoose)
  let cbN = 0; FM._inputs = [];
  FM.combobox = (input, onChoose, opts = {}) => {
    const id = "cb" + (++cbN), list = document.createElement("ul");
    list.id = id + "-list"; list.className = "fm-options " + (opts.cls || ""); list.setAttribute("role", "listbox"); list.setAttribute("aria-label", "Matching counties"); list.hidden = true;
    const live = document.createElement("div"); live.className = "sr"; live.setAttribute("aria-live", "polite");
    input.parentNode.style.position = "relative"; input.parentNode.appendChild(list); input.parentNode.appendChild(live);
    FM._inputs.push(input);
    Object.entries({ role: "combobox", "aria-autocomplete": "list", "aria-expanded": "false", "aria-controls": list.id, autocomplete: "off", spellcheck: "false" })
      .forEach(([k, v]) => input.setAttribute(k, v));
    let items = [], active = -1;
    const close = () => { list.hidden = true; input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); active = -1; };
    const paint = () => list.querySelectorAll("li").forEach((li, i) => { li.setAttribute("aria-selected", i === active); if (i === active) { input.setAttribute("aria-activedescendant", li.id); li.scrollIntoView({ block: "nearest" }); } });
    const choose = c => { close(); input.value = ""; onChoose(c); };
    const run = () => {
      items = FM.search(input.value, opts.n || 10); active = items.length ? 0 : -1;
      live.textContent = input.value.trim() ? (items.length ? `${items.length} matching ${items.length === 1 ? "county" : "counties"}` : "No matching counties") : "";
      list.innerHTML = items.length ? items.map((c, i) => `<li id="${id}-o${i}" role="option"><span>${FM.esc(c.name)}, ${c.st}</span><span class="fm-opt-v">${FM.r2(c.ratio)}</span></li>`).join("")
        : input.value.trim() ? `<li class="fm-none" role="option" aria-disabled="true">No county matches “${FM.esc(input.value.trim())}”. Try a state, like “Washington, OH”, or <a href="#/list">browse the list</a>.</li>` : "";
      list.hidden = !input.value.trim(); input.setAttribute("aria-expanded", String(!list.hidden)); paint();
      list.querySelectorAll("li[id]").forEach((li, i) => li.addEventListener("mousedown", e => { e.preventDefault(); choose(items[i]); }));
    };
    input.addEventListener("input", run);
    input.addEventListener("keydown", e => {
      if (e.key === "ArrowDown" && list.hidden && input.value.trim()) { run(); e.preventDefault(); return; }
      if (list.hidden || !items.length) { if (e.key === "Escape") input.value = ""; return; }
      if (e.key === "ArrowDown") { active = (active + 1) % items.length; paint(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { active = (active - 1 + items.length) % items.length; paint(); e.preventDefault(); }
      else if (e.key === "Enter" && active >= 0) { choose(items[active]); e.preventDefault(); }
      else if (e.key === "Escape") close();
    });
    input.addEventListener("blur", () => setTimeout(close, 120));
  };

  // ---------- CSV download (replaces the itemized table)
  FM.downloadCSV = c => {
    const rows = [["item", "dollars", "per_resident", "note"],
      ["Social Security and SSI", c.ss, c.ss / c.pop, ""], ["Grants to places in the county", c.gc, c.gc / c.pop, ""],
      ["Grants: population share of statewide programs", c.gs, c.gs / c.pop, "estimate"], ["Contracts", c.con, c.con / c.pop, ""],
      ["Money in (total)", c.money, c.money / c.pop, ""], ["Income tax", c.ti, c.ti / c.pop, "IRS county data"],
      ["Payroll taxes", c.tp, c.tp / c.pop, "estimate"], ["Corporate, estate and excise taxes", c.to, c.to / c.pop, "estimate"],
      ["Taxes paid (total)", c.taxes, c.taxes / c.pop, ""], ["Dollars back per $1 of tax", c.ratio, "", "fiscal year " + FM.FY]];
    const csv = rows.map(r => r.map(v => typeof v === "number" ? (Math.abs(v) < 100 ? v.toFixed(4) : Math.round(v)) : `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${c.fips}-${c.short.toLowerCase().replace(/\W+/g, "-")}-fy${FM.FY}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  // ---------- geometry (loaded once)
  const proj = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
  const CITIES = [["Seattle",-122.33,47.61],["Portland",-122.68,45.52],["San Francisco",-122.42,37.77],["Los Angeles",-118.24,34.05],["Phoenix",-112.07,33.45],["Las Vegas",-115.14,36.17],["Salt Lake City",-111.89,40.76],["Denver",-104.99,39.74],["Dallas",-96.8,32.78],["Houston",-95.37,29.76],["Kansas City",-94.58,39.1],["Minneapolis",-93.27,44.98],["Chicago",-87.63,41.88],["Nashville",-86.78,36.16],["New Orleans",-90.07,29.95],["Atlanta",-84.39,33.75],["Miami",-80.19,25.76],["Washington",-77.04,38.91],["New York",-74.01,40.71],["Boston",-71.06,42.36],["Detroit",-83.05,42.33],["Boise",-116.2,43.62],["Anchorage",-149.9,61.22],["Honolulu",-157.86,21.31]];
  FM.geo = null;
  FM.loadGeometry = () => FM._geoP || (FM._geoP = fetch(FM.MULTI ? "/vendor/counties-albers-10m.json" : "https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/counties-albers-10m.json").then(r => r.json()).then(us => {
    const feats = topojson.feature(us, us.objects.counties).features, path = d3.geoPath();
    const byId = Object.fromEntries(feats.map(f => [f.id, f])), byIndex = {}; feats.forEach((f, i) => byIndex[f.id] = i);
    const neigh = topojson.neighbors(us.objects.counties.geometries);
    const dots = feats.filter(f => FM.C[f.id]).map(f => { const [x, y] = path.centroid(f); return { id: f.id, x0: x, y0: y, x, y, r: Math.max(.7, .0128 * Math.sqrt(FM.C[f.id].pop)) }; }).filter(n => isFinite(n.x0));
    const sim = d3.forceSimulation(dots).force("x", d3.forceX(d => d.x0).strength(.12)).force("y", d3.forceY(d => d.y0).strength(.12)).force("c", d3.forceCollide(d => d.r + .35).iterations(2)).stop();
    for (let i = 0; i < 160; i++) sim.tick();
    const S = 15, cells = {};
    for (const n of dots) { const k = Math.floor(n.x0 / S) + "," + Math.floor(n.y0 / S); (cells[k] ||= { x: Math.floor(n.x0 / S) * S, y: Math.floor(n.y0 / S) * S, s: S, ids: [] }).ids.push(n.id); }
    const boxes = feats.filter(f => FM.C[f.id]).map(f => ({ f, b: path.bounds(f) }));
    const rings = f => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates).map(p => p[0]);
    for (let gx = 0; gx * S < 975; gx++) for (let gy = 0; gy * S < 610; gy++) {
      const k = gx + "," + gy; if (cells[k]) continue; const cx = gx * S + S / 2, cy = gy * S + S / 2;
      const hit = boxes.find(({ f, b }) => cx >= b[0][0] && cx <= b[1][0] && cy >= b[0][1] && cy <= b[1][1] && rings(f).some(r => d3.polygonContains(r, [cx, cy])));
      if (hit) cells[k] = { x: gx * S, y: gy * S, s: S, ids: [hit.f.id] };
    }
    FM.geo = { us, feats, byId, byIndex, neigh, dots, cells: Object.values(cells), path,
      states: topojson.mesh(us, us.objects.states, (a, b) => a !== b), nation: topojson.mesh(us, us.objects.nation),
      nationFill: topojson.feature(us, us.objects.nation) };
    return FM.geo;
  }));
  FM.neighbors = c => { const g = FM.geo, i = g && g.byIndex[c.fips]; return i == null ? [] : g.neigh[i].map(j => FM.C[g.feats[j].id]).filter(Boolean); };

  // ---------- tooltip (one per page)
  const tip = document.createElement("div"); tip.className = "fm-tip"; tip.setAttribute("aria-hidden", "true"); document.body.appendChild(tip);
  addEventListener("keydown", e => { if (e.key === "Escape") FM.tip(null); });
  FM.tip = (ev, html) => { if (!html) { tip.style.display = "none"; return; } tip.innerHTML = html; tip.style.display = "block";
    tip.style.left = Math.min(ev.clientX + 14, innerWidth - 250) + "px"; tip.style.top = Math.min(ev.clientY + 14, innerHeight - 90) + "px"; };

  // ---------- map: Land / People / Grid, colored by kind + size, click to pick
  FM.makeMap = (el, opt) => {
    const g = FM.geo, st = { view: "land", kind: "all", size: "all", sel: null, ink: opt.ink || "#0A0A0A", bg: opt.bg || "#F6F6F6" };
    const svg = d3.select(el).append("svg").attr("viewBox", "0 0 975 610").attr("class", "fm-map").attr("role", "img")
      .attr("aria-label", opt.label || "Map of U.S. counties. Use the search or the county list for a text version.");
    const defs = svg.append("defs"), pat = defs.append("pattern").attr("id", "fm-hatch").attr("width", 6).attr("height", 6).attr("patternUnits", "userSpaceOnUse").attr("patternTransform", "rotate(45)");
    pat.append("rect").attr("width", 6).attr("height", 6).attr("fill", "#F1F1F1"); pat.append("line").attr("y2", 6).attr("stroke", "#A8A8A8").attr("stroke-width", 1.5);
    svg.append("path").attr("d", g.path(g.nationFill)).attr("fill", "#ECECEC");
    const tipFor = ids => { const l = ids.map(i => FM.C[i]).filter(Boolean), v = FM.groupValue(l, st.kind, st.size);
      if (l.length === 1) return `<b>${FM.esc(l[0].name)}, ${l[0].st}</b><br>${FM.KINDS[st.kind].short}: ${FM.cents(v)} per $1`;
      return `<b>${l.length} counties</b><br>${FM.KINDS[st.kind].short}: ${FM.cents(v)} per $1 combined`; };
    const on = sel => sel.on("mousemove", (ev, d) => FM.tip(ev, tipFor(d.ids || [d.id]))).on("mouseleave", () => FM.tip(null))
      .on("click", (ev, d) => { const ids = d.ids || [d.id]; if (FM.C[ids[0]]) api.pick(ids); });
    const land = svg.append("g"), paths = on(land.selectAll("path").data(g.feats.filter(f => FM.C[f.id])).join("path").attr("d", g.path).attr("stroke", st.bg).attr("stroke-width", .15).attr("class", "fm-hit"));
    const people = svg.append("g").style("display", "none"), dots = on(people.selectAll("circle").data(g.dots).join("circle").attr("cx", d => d.x).attr("cy", d => d.y).attr("r", d => d.r).attr("stroke", st.bg).attr("stroke-width", .3).attr("class", "fm-hit"));
    const grid = svg.append("g").style("display", "none"), rects = on(grid.selectAll("rect").data(g.cells).join("rect").attr("x", d => d.x + .7).attr("y", d => d.y + .7).attr("width", d => d.s - 1.4).attr("height", d => d.s - 1.4).attr("class", "fm-hit"));
    const borders = svg.append("path").attr("d", g.path(g.states)).attr("fill", "none").attr("stroke", st.bg).attr("stroke-width", 1.1).style("pointer-events", "none");
    const labels = svg.append("g").style("display", "none").style("pointer-events", "none");
    for (const [n, lon, lat] of CITIES) { const p = proj([lon, lat]); if (!p) continue; const t = labels.append("g").attr("transform", `translate(${p[0]},${p[1]})`);
      t.append("circle").attr("r", 2.2).attr("fill", st.ink);
      t.append("text").attr("x", 5).attr("y", 3.5).text(n).attr("font-size", 10.5).attr("font-family", "Inter, sans-serif").attr("font-weight", 600).attr("fill", st.ink).attr("stroke", st.bg).attr("stroke-width", 3).attr("paint-order", "stroke"); }
    const selG = svg.append("g").style("pointer-events", "none");
    const ring = (sel) => { sel.clone().attr("stroke", "#FFFFFF").attr("stroke-width", 5).lower(); };
    // Result sheet next to the map (with a close button), shared by all three iterations.
    el.style.position = "relative";
    const sheet = document.createElement("div"); sheet.className = "fm-sheet"; sheet.hidden = true; sheet.setAttribute("role", "region"); sheet.setAttribute("aria-label", "Selected on the map");
    el.appendChild(sheet);
    const sheetHTML = ids => {
      const all = ids.map(i => FM.C[i]).filter(Boolean), l = all.filter(c => FM.testOf(st.size)(c)), k = FM.KINDS[st.kind];
      const close = `<button class="fm-close" aria-label="Close">×</button>`;
      if (all.length === 1) { const c = all[0];
        return `${close}<p class="fm-sheet-k">${FM.esc(FM.stName(c.st))}</p><p class="fm-sheet-n">${FM.esc(c.name)}</p>
          <p class="fm-sheet-v">${FM.hasRatio(c) ? FM.r2(FM.perDollar(st.kind, c)) : "—"}</p><p class="fm-sheet-s">${k.short} back per $1 of tax${l.length ? "" : " · outside your filters"}</p>
          <a class="fm-sheet-go" href="#/county/${c.fips}">Open ${FM.esc(c.short)} →</a>`; }
      return `${close}<p class="fm-sheet-k">${l.length === all.length ? all.length + " counties in this square" : `${l.length} of ${all.length} counties in this square match your filters`}</p>
        <p class="fm-sheet-v">${l.length ? FM.r2(FM.groupValue(l, st.kind, st.size)) : "—"}</p><p class="fm-sheet-s">${k.short} back per $1, combined</p>
        <ul class="fm-sheet-l">${(l.length ? l : all).sort((a, b) => b.pop - a.pop).map(c => `<li><a href="#/county/${c.fips}"><span>${FM.esc(c.name)}, ${c.st}</span><span>${FM.r2(FM.perDollar(st.kind, c))}</span></a></li>`).join("")}</ul>`; };
    const api = {
      pick(ids) { api.select(ids[0]); if (opt.sheet === false) { opt.onPick && opt.onPick(ids); return; } st.picked = ids; sheet.innerHTML = sheetHTML(ids); sheet.hidden = false;
        sheet.querySelector(".fm-close").onclick = () => { sheet.hidden = true; st.picked = null; api.select(null); };
        opt.onPick && opt.onPick(ids); },
      state: st,
      recolor() { paths.attr("fill", d => FM.colorOf([FM.C[d.id]], st.kind, st.size)); dots.attr("fill", d => FM.colorOf([FM.C[d.id]], st.kind, st.size));
        rects.attr("fill", d => FM.colorOf(d.ids.map(i => FM.C[i]), st.kind, st.size)); return api; },
      set(o) { Object.assign(st, o); land.style("display", st.view === "land" ? null : "none"); people.style("display", st.view === "people" ? null : "none");
        grid.style("display", st.view === "grid" ? null : "none"); labels.style("display", st.view === "land" ? "none" : null);
        borders.style("display", st.view === "people" ? "none" : null); api.recolor(); api.select(st.sel);
        if (st.picked && !sheet.hidden) { sheet.innerHTML = sheetHTML(st.picked); sheet.querySelector(".fm-close").onclick = () => { sheet.hidden = true; st.picked = null; api.select(null); }; }
        return api; },
      select(fips) { st.sel = fips; selG.selectAll("*").remove(); if (!fips) return api;
        let s = null;
        if (st.view === "people") { const d = g.dots.find(n => n.id === fips); if (d) s = selG.append("circle").attr("cx", d.x).attr("cy", d.y).attr("r", d.r + 2); }
        else if (st.view === "grid") { const c = g.cells.find(c => c.ids.includes(fips)); if (c) s = selG.append("rect").attr("x", c.x).attr("y", c.y).attr("width", c.s).attr("height", c.s); }
        else if (g.byId[fips]) s = selG.append("path").attr("d", g.path(g.byId[fips]));
        if (s) { s.attr("fill", "none").attr("stroke", st.ink).attr("stroke-width", 2.4); ring(s); }
        return api; },
    };
    return api.set({});
  };

  // Small map of a county and its neighbors.
  FM.neighborMap = (svgEl, c, onPick) => {
    const g = FM.geo, list = [c, ...FM.neighbors(c)], feats = list.map(x => g.byId[x.fips]).filter(Boolean); if (!feats.length) return;
    const W = 320, H = 220, p = d3.geoPath(d3.geoIdentity().fitExtent([[8, 8], [W - 8, H - 8]], { type: "FeatureCollection", features: feats }));
    const svg = d3.select(svgEl).attr("viewBox", `0 0 ${W} ${H}`);
    const s = svg.selectAll("path").data(feats).join("path").attr("d", p).attr("fill", d => FM.colorOf([FM.C[d.id]], "all", "all"))
      .attr("stroke", d => d.id === c.fips ? "#0A0A0A" : "#FFFFFF").attr("stroke-width", d => d.id === c.fips ? 3 : 1.5).style("cursor", "pointer").on("click", (ev, d) => onPick(d.id));
    s.append("title").text(d => `${FM.C[d.id].name}: ${FM.r2(FM.C[d.id].ratio)}`); s.filter(d => d.id === c.fips).raise();
  };

  // ---------- router: #/  #/county/FIPS  #/list  #/compare?pins=a,b  #/about
  FM.route = handlers => {
    let last = null, moved = false;
    const go = () => {
      if (FM.MULTI && document.body.dataset.page === "notfound") { document.querySelectorAll("[data-view]").forEach(v => v.hidden = true); return; }
      const [p, q] = FM.MULTI ? ["/" + document.body.dataset.page + "/" + (document.body.dataset.fips || ""), location.search.slice(1)] : (location.hash || "#/").slice(1).split("?"), parts = p.split("/").filter(Boolean);
      const view = ["county", "list", "compare", "about", "map", "analytics", "how"].includes(parts[0]) ? parts[0] : "home";
      document.querySelectorAll("[data-view]").forEach(v => v.hidden = v.dataset.view !== view);
      document.querySelectorAll("[data-nav]").forEach(a => a.setAttribute("aria-current", a.dataset.nav === view ? "page" : "false"));
      FM.tip(null);
      if (view !== last) { if (!(FM.MULTI && last === null)) window.scrollTo({ top: 0, behavior: "instant" }); last = view; }
      const pre = document.getElementById("static"); if (pre) pre.remove();   // static (no-JS / search engine) version gives way to the interactive one
      handlers[view] && handlers[view](parts[1], new URLSearchParams(q || ""));
      const c = view === "county" && FM.C[parts[1]];
      document.title = (c ? `${c.name}, ${c.st}` : { list: "Every county", compare: "Compare counties", about: "About", map: "Map", analytics: "Analytics", how: "How it works", home: "" }[view] || "") .replace(/^(.+)$/, "$1 · ") + "Federal Money Atlas";
      FM._inputs.forEach(i => { if (document.activeElement !== i) i.value = ""; });
      if (view !== "home" && moved) { const h = document.querySelector(`[data-view="${view}"] h1`); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); } }
      moved = true;
      document.dispatchEvent(new CustomEvent("fm:route", { detail: view }));
    };
    // Optional smooth page changes (view transitions); off when the user prefers reduced motion.
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    if (!FM.MULTI) addEventListener("hashchange", () => {
      if (!(FM.transitions && document.startViewTransition && !still.matches && !document.hidden)) return go();
      // Safety net: if the browser can't paint (e.g. a hidden window), change the page anyway after 300 ms.
      let done = false; const run = () => { if (!done) { done = true; go(); } };
      const vt = document.startViewTransition(run);
      setTimeout(() => { if (!done) { try { vt.skipTransition(); } catch (e) {} run(); } }, 300);
    });
    go(); return go;
  };

  // ---------- small shared helpers
  FM.copyLink = btn => { const done = () => { const t = btn.textContent; btn.textContent = "Link copied"; setTimeout(() => btn.textContent = t, 1800); };
    (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(done, () => { prompt("Copy this link:", location.href); }); };
  // List filters live in the address so the list can act as the map's text version: #/list?kind=ss&size=big&sort=hi
  FM.listParams = p => ({ kind: FM.KINDS[p.get("kind")] ? p.get("kind") : "all", size: FM.SIZES[p.get("size")] ? p.get("size") : "all",
    sort: ["pop", "hi", "lo", "name"].includes(p.get("sort")) ? p.get("sort") : "pop", st: FM.STATE_NAMES[p.get("st")] ? p.get("st") : "", q: p.get("q") || "" });
  FM.listRows = o => { const v = c => FM.hasRatio(c) ? FM.perDollar(o.kind, c) : null;
    const sorters = { pop: (a, b) => b.pop - a.pop, hi: (a, b) => (v(b) ?? -1e9) - (v(a) ?? -1e9), lo: (a, b) => (v(a) ?? 1e9) - (v(b) ?? 1e9), name: (a, b) => a.name.localeCompare(b.name) };
    const q = o.q.trim().toLowerCase();
    return FM.ALL.filter(c => (!q || c.name.toLowerCase().includes(q)) && (!o.st || c.st === o.st) && FM.SIZES[o.size].test(c)).sort(sorters[o.sort]).map(c => ({ c, v: v(c) })); };
  FM.listURL = o => (FM.MULTI ? "/counties/?" : "#/list?") + new URLSearchParams(Object.entries(o).filter(([k, v]) => v && !(k === "kind" && v === "all") && !(k === "size" && v === "all") && !(k === "sort" && v === "pop"))).toString();
  FM.stateOptions = () => Object.keys(FM.STATE_NAMES).sort((a, b) => FM.stName(a).localeCompare(FM.stName(b))).map(s => `<option value="${s}">${FM.stName(s)}</option>`).join("");
})();
