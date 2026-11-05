/* Round 3 · page modules: Home (why it matters + analytics teasers), Analytics, How it works, About.
   All charts are plain SVG/HTML, each with a text summary and a data table for screen readers. Needs FM (core.js). */
(function () {
  const V3 = (window.V3 = {});
  const R = FM.r2, M = FM.money, ALL = FM.ALL, OK = ALL.filter(FM.hasRatio);
  const MOB = matchMedia("(max-width: 760px)").matches;   // phones get narrower charts so labels stay readable
  FM.VERSION = "1.0"; FM.DATA_NOTE = "USAspending bulk files of Oct 6, 2026 (FY2023); IRS SOI county data, tax year 2023; Census Vintage 2025 and ACS 2019–2023; Treasury MTS FY2023";
  const sum = (l, f) => l.reduce((a, c) => a + (f(c) || 0), 0);
  const esc = FM.esc;

  // ---------- facts computed once from Phase 0 data
  const T = { ss: sum(ALL, c => c.ss), gr: sum(ALL, c => c.gr), con: sum(ALL, c => c.con), tax: sum(ALL, c => c.taxes) };
  T.money = T.ss + T.gr + T.con;
  const BINS = [0, .5, .75, 1, 1.25, 1.5, 2, 3, Infinity];
  const binLab = i => BINS[i + 1] === Infinity ? "$3+" : `${R(BINS[i]).replace(".00", "")}–${R(BINS[i + 1]).replace(".00", "")}`;
  const hist = BINS.slice(0, -1).map((lo, i) => OK.filter(c => c.ratio >= lo && c.ratio < BINS[i + 1]).length);
  const above1 = OK.filter(c => c.ratio >= 1).length;
  const byCon = ALL.filter(c => c.con > 0).sort((a, b) => b.con - a.con);
  const conTot = sum(byCon, c => c.con);
  const nFor = share => { let acc = 0; for (let i = 0; i < byCon.length; i++) { acc += byCon[i].con; if (acc >= share * conTot) return i + 1; } return byCon.length; };
  const N50 = nFor(.5), N80 = nFor(.8);
  const states = Object.keys(FM.STATE_NAMES).map(st => { const l = ALL.filter(c => c.st === st);
    return { st, name: FM.stName(st), ratio: sum(l, c => c.money) / sum(l, c => c.taxes), money: sum(l, c => c.money), pop: sum(l, c => c.pop) }; }).sort((a, b) => b.ratio - a.ratio);
  const sizes = Object.entries(FM.SIZES).filter(([k]) => k !== "all").map(([k, d]) => { const l = ALL.filter(d.test), t = sum(l, c => c.taxes);
    return { k, label: d.label, n: l.length, ss: sum(l, c => c.ss) / t, gr: sum(l, c => c.gr) / t, con: sum(l, c => c.con) / t }; });
  const fair = OK.filter(c => c.pop >= 10000);
  const top = fair.slice().sort((a, b) => b.ratio - a.ratio).slice(0, 10), bottom = fair.slice().sort((a, b) => a.ratio - b.ratio).slice(0, 10);
  const big = ALL.filter(c => c.pop >= 1e6 && FM.hasRatio(c));
  V3.facts = { T, N50, N80, above1, hist, states, sizes, top, bottom };

  // ---------- chart helpers
  const table = (cap, head, rows) => `<details class="dt"><summary>Show the data</summary><table><caption class="sr">${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((v, i) => i ? `<td>${v}</td>` : `<th scope="row">${v}</th>`).join("")}</tr>`).join("")}</tbody></table></details>`;

  function histChart(h = 220) {
    const W = MOB ? 380 : 640; if (MOB) h = 240;
    const P = 28, max = Math.max(...hist), bw = (W - P * 2) / hist.length;
    const x = v => { let i = BINS.findIndex((b, j) => v >= b && v < BINS[j + 1]); const lo = BINS[i], hi = BINS[i + 1] === Infinity ? 4 : BINS[i + 1]; return P + bw * (i + (v - lo) / (hi - lo)); };
    const bars = hist.map((n, i) => { const bh = (h - 62) * n / max, X = P + i * bw;
      return `<rect x="${X + 3}" y="${h - 30 - bh}" width="${bw - 6}" height="${bh}" fill="${BINS[i] >= 1 ? "#51DA4C" : "#C9C9C9"}"/><text x="${X + bw / 2}" y="${h - 36 - bh}" text-anchor="middle" class="cv">${n}</text><text x="${X + bw / 2}" y="${h - 12}" text-anchor="middle" class="cl">${binLab(i)}</text>`; }).join("");
    const mark = (v, lab, left) => `<line x1="${x(v)}" x2="${x(v)}" y1="4" y2="${h - 30}" stroke="#0A0A0A" stroke-width="1.5" stroke-dasharray="${left ? "4 3" : "0"}"/><text x="${x(v) + (left ? -6 : 6)}" y="12" text-anchor="${left ? "end" : "start"}" class="cm">${lab}</text>`;
    return `<figure class="chart"><svg viewBox="0 0 ${W} ${h}" role="img" aria-label="Bar chart: number of counties by dollars back per $1. ${above1} of ${OK.length} counties get $1 or more back.">${bars}${mark(FM.MED, "typical county " + R(FM.MED), false)}${mark(FM.US, "U.S. overall " + R(FM.US), true)}</svg>
      <figcaption>Counties by dollars back per $1 of federal tax. Green bars: $1 or more.</figcaption>${table("Counties by dollars back per $1", ["Back per $1", "Counties"], hist.map((n, i) => [binLab(i), FM.int(n)]))}</figure>`;
  }
  function typeBar(parts, h = 46) {
    const tot = parts.reduce((a, p) => a + p[1], 0);
    return `<div class="stackbar" style="height:${h}px">${parts.map(([l, v, col]) => `<span style="flex:${v / tot};background:${col}" title="${l}: ${FM.pct(v / tot)}"></span>`).join("")}</div>
      <ul class="keys">${parts.map(([l, v, col]) => `<li><i style="background:${col}"></i>${l} <b>${M(v)}</b> <span>${FM.pct(v / tot)}</span></li>`).join("")}</ul>`;
  }
  const COL = { ss: "#1E6A1B", gr: "#51DA4C", con: "#A9E6A4" };
  function typeChart() {
    return `<figure class="chart">${typeBar([["Social Security & SSI", T.ss, COL.ss], ["Grants", T.gr, COL.gr], ["Contracts", T.con, COL.con]])}
      <figcaption>All ${M(T.money)} counted in fiscal year 2023, by type.</figcaption></figure>`;
  }
  function sizeChart() {
    const mx = Math.max(...sizes.map(s => s.ss + s.gr + s.con));
    return `<figure class="chart"><div class="hbars">${sizes.map(s => `<div class="hb"><span class="hl">${s.label}<small>${FM.int(s.n)} counties</small></span>
      <span class="hbar"><i style="width:${100 * s.ss / mx}%;background:${COL.ss}"></i><i style="width:${100 * s.gr / mx}%;background:${COL.gr}"></i><i style="width:${100 * s.con / mx}%;background:${COL.con}"></i></span><b>${R(s.ss + s.gr + s.con)}</b></div>`).join("")}</div>
      <figcaption>Dollars back per $1, by county size: Social Security (dark), grants (green), contracts (light).</figcaption>
      ${table("Dollars back per $1 by county size", ["County size", "Social Security", "Grants", "Contracts", "Total"], sizes.map(s => [s.label, R(s.ss), R(s.gr), R(s.con), R(s.ss + s.gr + s.con)]))}</figure>`;
  }
  function concChart(h = 220) {
    const W = MOB ? 380 : 640; if (MOB) h = 240;
    const P = 30, n = byCon.length; let acc = 0; const pts = [[P, h - P]];
    byCon.forEach((c, i) => { acc += c.con; if (i % 6 === 0 || i === n - 1) pts.push([P + (W - 2 * P) * (i + 1) / n, h - P - (h - 2 * P) * acc / conTot]); });
    const xi = i => P + (W - 2 * P) * i / n, yv = v => h - P - (h - 2 * P) * v;
    return `<figure class="chart"><svg viewBox="0 0 ${W} ${h}" role="img" aria-label="Cumulative share of contract dollars by number of counties. Half of all contract dollars went to ${N50} counties; 80% went to ${N80}.">
      <line x1="${P}" y1="${h - P}" x2="${W - P}" y2="${P}" stroke="#C9C9C9" stroke-dasharray="4 4"/>
      <polyline points="${pts.map(p => p.join(",")).join(" ")}" fill="none" stroke="#0A0A0A" stroke-width="2.5"/>
      <circle cx="${xi(N50)}" cy="${yv(.5)}" r="6" fill="#51DA4C" stroke="#0A0A0A" stroke-width="2"/><text x="${xi(N50) + 10}" y="${yv(.5) + 4}" class="cm">50% of dollars: ${N50} counties</text>
      <circle cx="${xi(N80)}" cy="${yv(.8)}" r="6" fill="#51DA4C" stroke="#0A0A0A" stroke-width="2"/><text x="${xi(N80) + 10}" y="${yv(.8) + 4}" class="cm">80%: ${N80} counties</text>
      <text x="${P}" y="${h - 8}" class="cl">1 county</text><text x="${W - P}" y="${h - 8}" text-anchor="end" class="cl">all ${FM.int(n)} counties with contracts</text></svg>
      <figcaption>How concentrated contract money is. The dashed line is what an even spread would look like.</figcaption></figure>`;
  }
  const tagOf = c => /contracts dominate/.test(c.flags) ? "contract-driven" : /negative/.test(c.flags) ? "money taken back" : "";
  const extremeList = (list, note) => `<ol class="ext">${list.map(c => { const t = tagOf(c); return `<li><a href="#/county/${c.fips}"><span class="n">${esc(c.name)}, ${c.st}<small>${FM.int(c.pop)} residents${t ? ` <span class="tag">${t}</span>` : ""}</small></span><span class="v">${R(c.ratio)}</span></a></li>`; }).join("")}</ol>
    ${list.some(tagOf) ? `<p class="small"><span class="tag">contract-driven</span> most of the money is one or a few large federal contracts (a base, lab, shipyard or agency office), not payments to residents.</p>` : ""}${note ? `<p class="small">${note}</p>` : ""}`;
  function stateChart() {
    const mx = states[0].ratio;
    return `<figure class="chart"><div class="states">${states.map(s => `<a class="srow" href="#/list?st=${s.st}&sort=hi"><span>${s.name}</span><span class="sb"><i style="width:${100 * s.ratio / mx}%"></i>${s.ratio < FM.US ? "" : ""}</span><b>${R(s.ratio)}</b></a>`).join("")}
      <span class="usline" style="left:calc(170px + (100% - 240px) * ${FM.US / mx})" aria-hidden="true"><em>U.S. ${R(FM.US)}</em></span></div>
      <figcaption>Dollars back per $1, all counties in each state added up. Click a state for its counties.</figcaption></figure>`;
  }
  function stripChart(h = 90) {   // every county as one thin bar, sorted: a barcode of disparity
    const l = OK.slice().sort((a, b) => a.ratio - b.ratio), W = 1000, cap = 4;
    return `<svg viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" class="strip" role="img" aria-label="Every county's dollars back per $1, sorted from lowest (${R(l[0].ratio)}) to highest (${R(l[l.length - 1].ratio)}).">${l.map((c, i) => { const v = Math.max(0, Math.min(cap, c.ratio)), bh = h * v / cap;
      return `<rect x="${W * i / l.length}" y="${h - bh}" width="${W / l.length + .3}" height="${bh}" fill="${c.ratio >= 1 ? "#51DA4C" : "#0A0A0A"}"/>`; }).join("")}<line x1="0" x2="${W}" y1="${h - h / cap}" y2="${h - h / cap}" stroke="#F6F6F6" stroke-width="1.5"/></svg>`;
  }
  // ---------- 5-year change (needs years.js)
  function changeChart(h = 230) {
    const Y = window.YEARS; if (!Y) return `<div class="pending-box"><b>5-year change is being prepared.</b> Fiscal years 2019–2022 are downloading now; these charts fill in when that finishes.</div>`;
    const W = 640, P = 34, yrs = Y.years, tot = yrs.map((_, i) => Y.us.ss[i] + Y.us.gr[i] + Y.us.con[i]), mx = Math.max(...tot), bw = (W - 2 * P) / yrs.length;
    const bars = yrs.map((y, i) => { let y0 = h - P; return ["ss", "gr", "con"].map(k => { const bh = (h - 2 * P - 14) * Y.us[k][i] / mx; y0 -= bh; return `<rect x="${P + i * bw + 8}" y="${y0}" width="${bw - 16}" height="${bh}" fill="${COL[k]}"/>`; }).join("") +
      `<text x="${P + i * bw + bw / 2}" y="${h - P + 16}" text-anchor="middle" class="cl">FY${y}</text><text x="${P + i * bw + bw / 2}" y="${h - P - (h - 2 * P - 14) * tot[i] / mx - 6}" text-anchor="middle" class="cv">${M(tot[i])}</text>`; }).join("");
    return `<figure class="chart"><svg viewBox="0 0 ${W} ${h}" role="img" aria-label="Federal money that reached counties each fiscal year from ${yrs[0]} to ${yrs[yrs.length - 1]}.">${bars}</svg>
      <figcaption>Money that reached counties each year: Social Security (dark), grants (green), contracts (light). Fiscal 2020–2021 include pandemic relief.</figcaption>
      ${table("Federal money to counties by year", ["Year", "Social Security", "Grants", "Contracts", "Total"], yrs.map((y, i) => ["FY" + y, M(Y.us.ss[i]), M(Y.us.gr[i]), M(Y.us.con[i]), M(tot[i])]))}</figure>`;
  }
  function movers(n = 8) {
    const Y = window.YEARS; if (!Y) return "";
    const last = Y.years.length - 1, rows = ALL.filter(c => c.pop >= 50000 && Y.c[c.fips]).map(c => { const s = Y.c[c.fips], a = s[0] * 1000 / c.pop, b = s[last] * 1000 / c.pop; return { c, a, b, d: b - a, p: a > 0 ? b / a - 1 : null }; }).filter(r => r.p != null);
    const up = rows.slice().sort((x, y) => y.p - x.p).slice(0, n), dn = rows.slice().sort((x, y) => x.p - y.p).slice(0, n);
    const li = r => `<li><a href="#/county/${r.c.fips}"><span class="n">${esc(r.c.name)}, ${r.c.st}<small>${FM.whole(r.a)} → ${FM.whole(r.b)} per person</small></span><span class="v">${r.p >= 0 ? "+" : ""}${Math.round(100 * r.p)}%</span></a></li>`;
    return `<div class="two"><div><h3 class="label">Biggest increases, FY${Y.years[0]}→FY${Y.years[last]}</h3><ol class="ext">${up.map(li).join("")}</ol></div><div><h3 class="label">Biggest decreases</h3><ol class="ext">${dn.map(li).join("")}</ol></div></div>
      <p class="small">Counties with 50,000+ residents. Money in per resident, in current dollars (not adjusted for inflation). One large contract can move a county a lot.</p>`;
  }
  // Per-person scatter: taxes paid per person (x) vs money in per person (y), log scales, $1-per-$1 line.
  function scatter(h = 380) {
    const W = MOB ? 380 : 640; if (MOB) h = 340;
    const P = 46, pts = OK.filter(c => c.money > 0 && c.taxes > 0).map(c => ({ c, x: c.taxes / c.pop, y: c.money / c.pop }));
    const lx = d3.scaleLog([1500, 150000], [P, W - 14]).clamp(true), ly = d3.scaleLog([1500, 150000], [h - P, 10]).clamp(true);
    const ticks = [2000, 5000, 10000, 20000, 50000, 100000], k = v => "$" + (v >= 1000 ? v / 1000 + "K" : v);
    const grid = ticks.map(t => `<line x1="${lx(t)}" x2="${lx(t)}" y1="10" y2="${h - P}" stroke="#E5E5E5"/><text x="${lx(t)}" y="${h - P + 16}" text-anchor="middle" class="cl">${k(t)}</text>
      <line x1="${P}" x2="${W - 14}" y1="${ly(t)}" y2="${ly(t)}" stroke="#E5E5E5"/><text x="${P - 6}" y="${ly(t) + 4}" text-anchor="end" class="cl">${k(t)}</text>`).join("");
    const dots = pts.map(p => `<circle cx="${lx(p.x).toFixed(1)}" cy="${ly(p.y).toFixed(1)}" r="${Math.max(1.6, Math.min(7, Math.sqrt(p.c.pop) / 160)).toFixed(1)}" fill="${p.c.ratio >= 1 ? "#51DA4C" : "#0A0A0A"}" fill-opacity="${p.c.ratio >= 1 ? .7 : .35}"/>`).join("");
    return `<figure class="chart"><svg viewBox="0 0 ${W} ${h}" role="img" aria-label="Scatter plot of ${pts.length} counties: federal taxes paid per person against federal money received per person. Counties above the diagonal get more than $1 back per $1.">
      ${grid}<line x1="${lx(1500)}" y1="${ly(1500)}" x2="${lx(150000)}" y2="${ly(150000)}" stroke="#0A0A0A" stroke-width="1.5" stroke-dasharray="5 4"/>
      <text x="${lx(60000)}" y="${ly(60000) - 8}" class="cm" text-anchor="end">$1 back per $1</text>${dots}
      <text x="${W - 14}" y="${h - 6}" text-anchor="end" class="cm">Taxes paid per person →</text><text x="12" y="${h / 2}" class="cm" transform="rotate(-90 12 ${h / 2})" text-anchor="middle">Money in per person →</text></svg>
      <figcaption>Each dot is a county, sized by population. Green: $1 or more back per $1. Above the dashed line, more came back than was paid.</figcaption></figure>`;
  }
  // Who pays vs who gets: counties grouped into tenths of the U.S. population by taxes paid per person.
  const tenths = (() => { const l = OK.slice().sort((a, b) => a.taxes / a.pop - b.taxes / b.pop), P = sum(l, c => c.pop), out = [];
    let g = [], acc = 0; l.forEach(c => { g.push(c); acc += c.pop; if (acc >= P * (out.length + 1) / 10 || c === l[l.length - 1]) { out.push(g); g = []; } });
    const tt = sum(OK, c => c.taxes), tm = sum(OK, c => c.money);
    return out.map((g, i) => ({ i, n: g.length, taxShare: sum(g, c => c.taxes) / tt, moneyShare: sum(g, c => c.money) / tm, lo: g[0].taxes / g[0].pop, hi: g[g.length - 1].taxes / g[g.length - 1].pop })); })();
  function whoChart(h = 250) {
    const W = MOB ? 380 : 1000; if (MOB) h = 240;
    const P = 34, mx = Math.max(...tenths.map(t => Math.max(t.taxShare, t.moneyShare))), bw = (W - 2 * P) / 10, y = v => (h - 2 * P) * v / mx;
    const bars = tenths.map((t, i) => { const X = P + i * bw;
      return `<rect x="${X + 6}" y="${h - P - y(t.taxShare)}" width="${bw / 2 - 7}" height="${y(t.taxShare)}" fill="#0A0A0A"/><rect x="${X + bw / 2 + 1}" y="${h - P - y(t.moneyShare)}" width="${bw / 2 - 7}" height="${y(t.moneyShare)}" fill="#51DA4C"/>
        <text x="${X + bw / 2}" y="${h - P + 16}" text-anchor="middle" class="cl">${i + 1}</text>`; }).join("");
    const top = tenths[9], bot = tenths[0];
    return `<figure class="chart"><svg viewBox="0 0 ${W} ${h}" role="img" aria-label="For each tenth of the population, from lowest to highest taxes per person: share of all taxes paid and share of money received. The top tenth pays ${FM.pct(top.taxShare)} of taxes and receives ${FM.pct(top.moneyShare)} of the money.">${bars}
      <text x="${P}" y="${h - 4}" class="cl">← lowest taxes per person</text><text x="${W - P}" y="${h - 4}" text-anchor="end" class="cl">highest →</text></svg>
      <ul class="keys"><li><i style="background:#0A0A0A"></i>share of all federal taxes paid</li><li><i style="background:#51DA4C"></i>share of federal money received</li></ul>
      <figcaption>Counties sorted by taxes paid per person and split into ten groups of equal population. The top tenth pays ${FM.pct(top.taxShare)} of all federal taxes counted here and receives ${FM.pct(top.moneyShare)} of the money; the bottom tenth pays ${FM.pct(bot.taxShare)} and receives ${FM.pct(bot.moneyShare)}.</figcaption>
      ${table("Share of taxes and money by tenth of population", ["Group", "Taxes per person", "Counties", "Share of taxes", "Share of money"], tenths.map(t => [`${t.i + 1}`, `${FM.whole(t.lo)}–${FM.whole(t.hi)}`, FM.int(t.n), FM.pct(t.taxShare), FM.pct(t.moneyShare)]))}</figure>`;
  }
  // Census regions
  const REG = { Northeast: "CT ME MA NH RI VT NJ NY PA", Midwest: "IL IN MI OH WI IA KS MN MO NE ND SD", South: "DE DC FL GA MD NC SC VA WV AL KY MS TN AR LA OK TX", West: "AZ CO ID MT NV NM UT WY AK CA HI OR WA" };
  const regions = Object.entries(REG).map(([r, l]) => { const st = l.split(" "), g = ALL.filter(c => st.includes(c.st)), pop = sum(g, c => c.pop);
    return { r, pop, ratio: sum(g, c => c.money) / sum(g, c => c.taxes), inpp: sum(g, c => c.money) / pop, taxpp: sum(g, c => c.taxes) / pop, ss: sum(g, c => c.ss) / pop, gr: sum(g, c => c.gr) / pop, con: sum(g, c => c.con) / pop }; });
  function regionChart() {
    const mx = Math.max(...regions.map(r => Math.max(r.inpp, r.taxpp)));
    return `<div class="regions">${regions.map(r => `<div class="reg"><p class="label">${r.r}</p><p class="big" style="margin-top:8px">${R(r.ratio)}</p><p class="small">back per $1 · ${FM.int(Math.round(r.pop / 1e6))}M people</p>
      <div class="rb"><span>In</span><i style="width:${100 * r.inpp / mx}%;background:#51DA4C"></i><b>${FM.whole(r.inpp)}</b></div>
      <div class="rb"><span>Paid</span><i style="width:${100 * r.taxpp / mx}%;background:#0A0A0A"></i><b>${FM.whole(r.taxpp)}</b></div>
      <p class="small" style="margin-top:8px">Per person: Social Security ${FM.whole(r.ss)} · grants ${FM.whole(r.gr)} · contracts ${FM.whole(r.con)}</p></div>`).join("")}</div>`;
  }
  // all counties as CSV
  V3.downloadAll = () => {
    const head = ["fips", "county", "state", "population", "money_in", "social_security_ssi", "grants", "grants_statewide_share_est", "contracts", "taxes_paid_est", "income_tax", "dollars_back_per_1"];
    const rows = ALL.map(c => [c.fips, `"${c.name}"`, c.st, c.pop, Math.round(c.money), Math.round(c.ss), Math.round(c.gr), Math.round(c.gs), Math.round(c.con), Math.round(c.taxes), Math.round(c.ti), c.ratio == null ? "" : c.ratio.toFixed(4)].join(","));
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([[head.join(","), ...rows].join("\n")], { type: "text/csv" })); a.download = `federal-money-atlas-counties-fy${FM.FY}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  // Who got the money: top recipients, agencies and programs for one county, live from the USAspending API (FY2023,
  // place of performance), cached for the visit. Connecticut planning regions aren't supported by the API yet.
  const WHO = {
    recipients: { cat: "recipient", codes: ["A", "B", "C", "D", "02", "03", "04", "05"], label: "Recipients", note: "Companies, universities, governments and nonprofits receiving contracts and grants. Social Security goes to individuals and isn't listed." },
    agencies: { cat: "awarding_agency", codes: ["A", "B", "C", "D", "02", "03", "04", "05", "06", "10"], label: "Agencies", note: "Federal agencies that awarded contracts, grants and direct payments here." },
    programs: { cat: "cfda", codes: ["02", "03", "04", "05", "06", "10"], label: "Programs", note: "Grant and payment programs (assistance listings). Contracts aren't programs, so they aren't included." },
  };
  const whoCache = {};
  const whoFetch = (c, key) => {
    const k = c.fips + key; if (whoCache[k]) return whoCache[k];
    const d = WHO[key], ctl = new AbortController(); setTimeout(() => ctl.abort(), 20000);
    return (whoCache[k] = fetch(`https://api.usaspending.gov/api/v2/search/spending_by_category/${d.cat}/`, { method: "POST", signal: ctl.signal, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filters: { time_period: [{ start_date: "2022-10-01", end_date: "2023-09-30" }], award_type_codes: d.codes,
        place_of_performance_locations: [{ country: "USA", state: c.st, county: c.fips.slice(2) }] }, limit: 10 }) })
      .then(r => r.ok ? r.json() : Promise.reject(r.status)).then(j => j.results).catch(e => { delete whoCache[k]; throw e; }));
  };
  V3.who = (el, c) => {
    const tabs = Object.entries(WHO);
    el.innerHTML = `<div class="whohead"><h2 class="label" id="who-h">Who got the money · fiscal year ${FM.FY}</h2>
      <div class="whotabs" role="tablist" aria-labelledby="who-h">${tabs.map(([k, d], i) => `<button role="tab" id="wt-${k}" aria-controls="who-body" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-k="${k}">${d.label}</button>`).join("")}</div></div>
      <div id="who-body" role="tabpanel" aria-live="polite"></div>
      <p class="small whosrc">Live from <a href="https://www.usaspending.gov/" target="_blank" rel="noopener">USAspending.gov</a>, by where the work or payment happens. Top 10 shown; amounts are FY${FM.FY} obligations.</p>`;
    const body = el.querySelector("#who-body");
    let cur = null;
    const show = key => { cur = key;
      el.querySelectorAll("[role=tab]").forEach(b => { const on = b.dataset.k === key; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; });
      body.setAttribute("aria-labelledby", "wt-" + key);
      if (c.st === "CT") { body.innerHTML = `<p class="small whomsg">USAspending still files Connecticut by its old counties, so this list isn't available for planning regions yet.</p>`; return; }
      body.innerHTML = `<p class="small whomsg">Loading from USAspending.gov…</p>`;
      whoFetch(c, key).then(rows => {
        if (key !== cur) return;   // another tab was chosen while this one loaded
        if (!rows.length) { body.innerHTML = `<p class="small whomsg">No ${WHO[key].label.toLowerCase()} reported for this county.</p>`; return; }
        const mx = Math.max(...rows.map(r => Math.abs(r.amount)), 1);
        body.innerHTML = `<p class="small">${WHO[key].note}</p><ol class="whol">${rows.map(r => {
          const name = esc((r.name || "Unnamed").replace(/\b([A-Z])([A-Z']+)\b/g, (m, a, b) => a + b.toLowerCase()).replace(/(?!^)\b(Of|And|The|For|In|On|At|To)\b/g, w => w.toLowerCase()).replace(/\b(Llc|Inc|Usa|Us|Nasa|Ii|Iii)\b/g, w => w.toUpperCase()).replace(/, the$/i, ""));
          const href = key === "recipients" && r.recipient_id ? `https://www.usaspending.gov/recipient/${r.recipient_id}/latest` : "";
          return `<li><span class="wn">${href ? `<a href="${href}" target="_blank" rel="noopener">${name}</a>` : name}${r.code && key !== "recipients" ? ` <small>${esc(r.code)}</small>` : ""}</span>
            <span class="wb" aria-hidden="true"><i style="width:${100 * Math.max(0, r.amount) / mx}%"></i></span><b>${M(r.amount)}</b></li>`; }).join("")}</ol>`;
      }).catch(() => { if (key !== cur) return; body.innerHTML = `<p class="small whomsg">USAspending.gov didn't answer in time. <button class="linkbtn" type="button" id="who-retry">Try again</button></p>`;
        body.querySelector("#who-retry").onclick = () => show(key); });
    };
    el.querySelectorAll("[role=tab]").forEach((b, i, all) => { b.onclick = () => show(b.dataset.k);
      b.onkeydown = e => { const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return; const n = all[(i + d + all.length) % all.length]; n.focus(); show(n.dataset.k); }; });
    show("recipients");
  };

  // ---------- Feature 5: cite this page
  V3.cite = (el, title) => {
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const text = `Federal Money Atlas (version ${FM.VERSION}). “${title}.” Data: ${FM.DATA_NOTE}. Accessed ${today}. ${location.href}`;
    el.innerHTML = `<h2 class="label">Cite this page</h2><p class="citet" id="cite-t">${esc(text)}</p>
      <div class="citeacts"><button class="btn sm" type="button" id="cite-copy">Copy citation</button><a class="textlink" href="${FM.MULTI ? "/how-it-works/#how-version" : "#/how"}" style="margin:0">Data version &amp; changes →</a></div>`;
    el.querySelector("#cite-copy").onclick = e => { const b = e.currentTarget;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => { b.textContent = "Copied"; setTimeout(() => b.textContent = "Copy citation", 1600); }, () => prompt("Copy this citation:", text)); };
  };
  V3.charts = { scatter, whoChart, regionChart, histChart, typeChart, sizeChart, concChart, stateChart, stripChart, changeChart, movers };

  // ---------- HOME
  V3.home = (el, pat) => {
    el.innerHTML = `
    <div class="grid">
      <div class="cell s8 white"><p class="label">Fiscal year 2023 · 3,144 counties</p>
        <h1 class="hero" id="h-home">What does $1 get you?</h1>
        <p class="lead">For every $1 a county's residents pay in federal taxes, see how much federal money comes back — Social Security, grants and contracts.</p>
        <div class="search"><label class="sr" for="q-home">Find your county</label><input id="q-home" placeholder="Find your county — e.g. Franklin, OH"></div>
        <div class="btnrow"><a class="btn primary" href="#/map"><span class="dot" aria-hidden="true"></span>Show the map</a><a class="btn" href="#/list">Browse counties</a></div></div>
      <div class="cell s4 green"><div class="stack"><p class="label" style="color:var(--ink)">The typical county gets back</p>
        <div><p class="giant">${R(FM.MED)}</p><p style="margin-top:12px;font-weight:600">for every $1 of federal tax. The U.S. overall is ${R(FM.US)}.</p></div></div></div>
    </div>
    <div class="grid">
      <div class="cell s12 white why-band"><p class="label">Why track it</p>
        <div class="why-row"><h2 class="statement">${FM.moneyWords(T.money)} reached America's counties in 2023. <span class="hl">It did not land evenly.</span></h2>
          <div><p class="small" style="font-size:15px;color:var(--ink)">This is public money. Where it goes — and how unevenly — should be easy for anyone to see, check and question. Same rules for every county, every number traced to a public source.</p>
          <a class="textlink" href="#/about">Why this matters →</a></div></div></div>
    </div>
    <div class="grid">
      <div class="cell s12 strip-cell"><div class="striphead"><h2 class="label">Every county, one line each</h2><span class="small">Sorted from least to most back per $1 · green = $1 or more · white line = $1</span></div>${stripChart(110)}
        ${(() => { const lo = OK.reduce((a, c) => c.ratio < a.ratio ? c : a), hi = OK.reduce((a, c) => c.ratio > a.ratio ? c : a);
          return `<div class="stripends"><span>Lowest: ${R(lo.ratio)} · ${esc(lo.name)}, ${lo.st}</span><span>${FM.int(above1)} of ${FM.int(OK.length)} counties with a figure get $1 or more back</span><span>Highest: ${R(hi.ratio)} · ${esc(hi.name)}, ${hi.st} (${FM.int(hi.pop)} residents)</span></div>`; })()}</div>
    </div>
    <div class="grid">
      <div class="cell s6"><p class="label">The spread</p><h2 class="t">Most counties get back more than $1. The places that pay the most get back far less.</h2>${histChart()}</div>
      <div class="cell s6"><p class="label">Where it goes</p><h2 class="t">Social Security is the biggest share — but contracts are the most concentrated.</h2>${typeChart()}
        <div class="bigfact"><span class="giant">${N50}</span><span>counties received <b>half of all federal contract dollars</b> (${M(T.con / 2)} of ${M(T.con)}). The other half was spread across ${FM.int(byCon.length - N50)}.</span></div></div>
    </div>
    <div class="grid phone-hide">
      <div class="cell s4"><p class="label">Change over time</p><h2 class="t">Five years of federal money</h2><div id="home-change">${changeChart(200)}</div></div>
      <div class="cell s4"><p class="label">Most back per $1 · 10,000+ residents</p><h2 class="t">Bases, labs and shipyards</h2>${extremeList(top.slice(0, 4))}</div>
      <div class="cell s4"><p class="label">Least back per $1 · 10,000+ residents</p><h2 class="t">High-income suburbs and resorts</h2>${extremeList(bottom.slice(0, 4))}</div>
    </div>
    <div class="grid">
      <a class="cell s4 cta green" href="#/analytics"><span class="label" style="color:var(--ink)">Analytics</span><span class="ctat">See every chart →</span></a>
      <a class="cell s4 cta" href="#/how"><span class="label">Method</span><span class="ctat">How it's calculated →</span></a>
      <a class="cell s4 cta" href="#/compare"><span class="label">Compare</span><span class="ctat">Your county vs. another →</span></a>
    </div>`;
  };

  // ---------- ANALYTICS
  V3.analytics = (el, pat) => {
    el.innerHTML = `
    <div class="grid"><div class="cell s8 white"><p class="label">Analytics · fiscal year 2023</p><h1 id="h-an">Where federal money lands</h1>
      <p class="lead">The patterns behind 3,144 county numbers: how they spread, what kind of money drives them, where it concentrates, and how it changed.</p>
      <nav class="toc" aria-label="On this page">${[["an-spread", "Spread"], ["an-pp", "Per person"], ["an-who", "Who pays, who gets"], ["an-type", "By type"], ["an-conc", "Concentration"], ["an-reg", "Regions & states"], ["an-ext", "Extremes"], ["an-change", "Change"], ["an-dl", "Download"]].map(([id, l]) => `<button type="button" data-jump="${id}">${l}</button>`).join("")}</nav></div>${pat("s4", 211)}</div>
    <div class="grid">
      <div class="cell s7" id="an-spread"><p class="label">1 · The spread</p><h2 class="t">${FM.int(above1)} of ${FM.int(OK.length)} counties with a figure get $1 or more back</h2>${histChart(240)}</div>
      <div class="cell s5 white"><p class="label">Reading it</p><p class="lead" style="margin-top:10px">The typical county gets <b>${R(FM.MED)}</b> back per $1, but the U.S. overall is only <b>${R(FM.US)}</b>. That gap is the story: a few high-income places pay a large share of federal taxes, so they get back much less per dollar — and pull the national figure down.</p>
        <p class="small" style="margin-top:14px">${big.length} counties have a million or more residents; together they get back ${R(sum(big, c => c.money) / sum(big, c => c.taxes))} per $1.</p></div>
    </div>
    <div class="grid">
      <div class="cell s7" id="an-pp"><p class="label">2 · Per person</p><h2 class="t">What residents paid vs. what came back, per person</h2>${scatter()}</div>
      <div class="cell s5 white"><p class="label">Reading it</p><p class="lead" style="margin-top:10px">Counties to the right pay more federal tax per person — mostly because their residents earn more. Counties higher up receive more per person — often because more residents are retired, or because federal work happens there.</p>
        <p class="small" style="margin-top:14px">The dashed line is $1 back for every $1 paid. Most green dots sit to the left: lower taxes per person, not unusually high spending.</p></div>
    </div>
    <div class="grid">
      <div class="cell s12" id="an-who"><p class="label">3 · Who pays, who gets</p><h2 class="t">The tenth of Americans in the highest-tax counties pays ${FM.pct(tenths[9].taxShare)} of federal taxes and receives ${FM.pct(tenths[9].moneyShare)} of the money</h2>${whoChart()}</div>
    </div>
    <div class="grid">
      <div class="cell s6" id="an-type"><p class="label">4 · By type</p><h2 class="t">What kind of money came back</h2>${typeChart()}</div>
      <div class="cell s6"><p class="label">By county size</p><h2 class="t">Smaller counties rely more on Social Security</h2>${sizeChart()}</div>
    </div>
    <div class="grid">
      <div class="cell s8" id="an-conc"><p class="label">5 · Concentration</p><h2 class="t">Half of all contract dollars went to ${N50} counties</h2>${concChart(240)}</div>
      <div class="cell s4 green"><div class="stack"><p class="label" style="color:var(--ink)">Contracts</p><div><p class="giant">${N50}</p><p style="margin-top:10px;font-weight:600">counties got half of ${M(T.con)} in federal contracts — often defense work, national labs and agency offices.</p></div></div></div>
    </div>
    <div class="grid">
      <div class="cell s12" id="an-reg"><p class="label">6 · Regions &amp; states</p><h2 class="t">The four census regions</h2>${regionChart()}</div>
    </div>
    <div class="grid">
      <div class="cell s12"><h2 class="t">Every state, dollars back per $1</h2>${stateChart()}</div>
    </div>
    <div class="grid">
      <div class="cell s6" id="an-ext"><p class="label">7 · Extremes</p><h2 class="t">Most back per $1 · 10,000+ residents</h2>${extremeList(top, "Notes explain unusual cases. Smaller counties are left out because one award can swing them wildly.")}</div>
      <div class="cell s6"><p class="label">&nbsp;</p><h2 class="t">Least back per $1 · 10,000+ residents</h2>${extremeList(bottom, "Mostly high-income places, where residents pay a lot of federal tax.")}</div>
    </div>
    <div class="grid">
      <div class="cell s12 ${window.YEARS ? "" : "phone-hide"}" id="an-change"><p class="label">8 · Change</p><h2 class="t">Five years of federal money to counties</h2><div id="an-change-body">${changeChart(260)}${movers()}</div></div>
    </div>
    <div class="grid"><div class="cell s8 white" id="an-dl"><p class="label">9 · Download</p><h2 class="t">Every county's numbers in one file</h2><p class="small" style="margin-top:8px">${FM.int(ALL.length)} counties: population, money in by type, estimated taxes and dollars back per $1. Free to use; please cite the sources on <a href="#/how">Method</a>.</p></div>
      <div class="cell s4 green cta" style="cursor:pointer" role="button" tabindex="0" id="dl-all"><span class="label" style="color:var(--ink)">CSV · ${FM.int(ALL.length)} rows</span><span class="ctat">Download all counties ↓</span></div></div>
    <p class="foot">Money in: USAspending.gov obligations by place of performance. Taxes: IRS county data plus estimates scaled to Treasury totals. See <a href="#/how">how it works</a>.</p>`;
    V3.wireAnalytics(el);
  };

  V3.wireAnalytics = el => {
    el.querySelectorAll("[data-jump]").forEach(b => b.onclick = () => { const t = document.getElementById(b.dataset.jump); if (t) { t.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); } });
    const dl = el.querySelector("#dl-all"); if (dl) { dl.onclick = V3.downloadAll; dl.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); V3.downloadAll(); } }; }
  };
  // ---------- HOW IT WORKS
  V3.how = (el, pat) => {
    const c = FM.C["39049"], sources = [
      ["USAspending.gov bulk award files", "U.S. Treasury", "Every federal contract, grant, loan and direct payment, with the county where the work or payment happens", "FY2019–2023", "https://files.usaspending.gov/award_data_archive/"],
      ["IRS Statistics of Income, county data", "IRS", "Income tax, wages, self-employment tax and investment income by county", "Tax year 2023", "https://www.irs.gov/statistics/soi-tax-stats-county-data"],
      ["Monthly Treasury Statement", "U.S. Treasury", "National tax totals by type; Social Security and SSI payments (for checks)", "FY2023", "https://fiscaldata.treasury.gov/datasets/monthly-treasury-statement/"],
      ["County population estimates", "Census Bureau", "Residents per county (July 1, 2023)", "2023", "https://www.census.gov/programs-surveys/popest.html"],
      ["Medicare Geographic Variation", "CMS", "Medicare spending by county (shown for context, not counted)", "2023", "https://data.cms.gov/"],
      ["“Giving or Getting?” (2025)", "Rockefeller Institute", "State-level estimates used to check our totals", "FFY2023", "https://rockinst.org/"]];
    el.innerHTML = `
    <div class="grid"><div class="cell s8 white"><p class="label">Method</p><h1 id="h-how">How the numbers are calculated</h1>
      <p class="lead">One division, done the same way for every county. Here is each step, where the data comes from, what is estimated, and how we checked it.</p></div>${pat("s4", 307)}</div>
    <div class="grid"><div class="cell s12 formula" aria-label="Money in divided by taxes paid equals dollars back per $1">
      <div><span class="label">Money in</span><b style="color:var(--ink)">${M(T.money)}</b></div><span class="op">÷</span><div><span class="label">Taxes paid</span><b>${M(T.tax)}</b></div><span class="op">=</span><div class="res"><span class="label">Back per $1 · U.S.</span><b>${R(FM.US)}</b></div></div></div>
    <div class="grid">
      <div class="cell s4"><p class="step">1</p><h2 class="t">Money in</h2><p class="small" style="margin-top:8px">Every federal <b>contract, grant and Social Security &amp; SSI payment</b> committed in fiscal year 2023 (Oct 2022–Sep 2023), credited to the county <b>where the work or payment happens</b> — not where the company or agency is based. We count the main award only, never the sub-awards inside it, so nothing is counted twice.</p>
        <p class="small" style="margin-top:8px">About three-quarters of grant dollars (mostly Medicaid) go to states with no county attached. Each county gets a share <b>based on the people each program serves</b>: Medicaid by residents with Medicaid coverage, school and child programs by children, TANF and child care by people in poverty, food programs by households on SNAP, the rest by population (Census Bureau). These are marked “est.”</p>
        <p class="small" style="margin-top:8px">Four nationwide health-benefit contracts — veterans' community care and TRICARE, ${M(sum(ALL, c => c.national))} in all — are booked to the contractor's office county. They're shown separately as “national programs” and not counted for that county.</p></div>
      <div class="cell s4"><p class="step">2</p><h2 class="t">Taxes paid</h2><p class="small" style="margin-top:8px">We start from the U.S. Treasury's fiscal 2023 total ($4.44 trillion) and share 97% of it out to counties:</p>
        <ul class="small bul"><li><b>Income tax</b> — by each county's share in IRS county data (measured).</li><li><b>Payroll taxes</b> — by an estimate of each county's taxable wages, with the Social Security wage cap applied.</li><li><b>Corporate tax</b> — 75% by investment income, 25% by wages.</li><li><b>Estate tax</b> by investment income; <b>excise taxes</b> by population.</li><li><b>Customs and other receipts</b> (2.7%) aren't assigned to any county.</li></ul></div>
      <div class="cell s4"><p class="step">3</p><h2 class="t">Divide</h2><p class="small" style="margin-top:8px">Money in ÷ taxes paid = <b>dollars back per $1</b>. We compare each county with the <b>typical county</b> (${R(FM.MED)}), the one in the middle. The <b>U.S. overall</b> figure (${R(FM.US)}) adds everything up, so a few high-tax places weigh heavily on it.</p>
        <p class="small" style="margin-top:8px">It is under $1 nationally because Medicare, federal salaries, defense overhead and interest on the debt aren't tied to a county here.</p></div>
    </div>
    <div class="grid"><div class="cell s12 white"><p class="label">Worked example</p><h2 class="t">Franklin County, Ohio</h2>
      <div class="worked">
        <div><span class="label">Social Security & SSI</span><b>${M(c.ss)}</b></div><span class="op">+</span><div><span class="label">Grants (incl. ${M(c.gs)} est.)</span><b>${M(c.gr)}</b></div><span class="op">+</span><div><span class="label">Contracts</span><b>${M(c.con)}</b></div><span class="op">=</span><div><span class="label">Money in</span><b>${M(c.money)}</b></div>
      </div>
      <div class="worked">
        <div><span class="label">Income tax</span><b>${M(c.ti)}</b></div><span class="op">+</span><div><span class="label">Payroll (est.)</span><b>${M(c.tp)}</b></div><span class="op">+</span><div><span class="label">Other (est.)</span><b>${M(c.to)}</b></div><span class="op">=</span><div><span class="label">Taxes paid</span><b>${M(c.taxes)}</b></div>
      </div>
      <p class="lead" style="margin-top:16px">${M(c.money)} ÷ ${M(c.taxes)} = <b>${R(c.ratio)}</b> back for every $1.</p></div></div>
    <div class="grid"><div class="cell s12"><p class="label">Sources</p><h2 class="t">Every number comes from public data</h2>
      <ul class="srcs">${sources.map(([n, p, w, y, u]) => `<li><span class="n"><a href="${u}" target="_blank" rel="noopener">${n}</a><small>${p}</small></span><span>${w}</span><span class="y">${y}</span></li>`).join("")}</ul></div></div>
    <div class="grid">
      <div class="cell s6"><p class="label">How we checked it</p><ul class="checks">
        <li><b>±0.3%</b>Social Security &amp; SSI in our data vs. Treasury's payments</li><li><b>$760B</b>Contracts, matching USAspending's published FY2023 total</li>
        <li><b>±8%</b>Every state's taxes vs. the Rockefeller Institute's estimates (0.6% overall)</li><li><b>0.97</b>Correlation of our state results with Rockefeller's</li></ul></div>
      <div class="cell s6"><p class="label">Limits to keep in mind</p><ul class="small bul">
        <li>Money is what agencies <b>committed</b> that year; large contracts can land in one year for several years of work.</li>
        <li>Statewide grants are shared by the people each program serves, measured by the Census Bureau — an estimate, not actual payments per county.</li>
        <li>Other nationally run contracts may still be booked at one office; counties where contracts dominate are flagged.</li>
        <li>Taxes other than income tax are estimates. Connecticut reports 9 planning regions instead of counties.</li></ul></div>
    </div>
    <div class="grid"><div class="cell s6 white" id="how-version"><p class="label">Data version</p><h2 class="t">Version ${FM.VERSION}</h2>
        <p class="small" style="margin-top:8px">${FM.DATA_NOTE}. Agencies correct past spending every month, so each release keeps its version number and date; cite the version you used.</p>
        <p class="small" style="margin-top:8px">${FM.int(FM.ALL.length)} counties and county-equivalents; ${FM.int(FM.N)} have a dollars-back figure (Kalawao, HI is reported by the IRS together with Maui).</p></div>
      <div class="cell s6"><p class="label">Changes</p><ul class="checks changes">
        <li><b>0.5</b>Statewide grants shared by need (Medicaid coverage, children, poverty, SNAP); nationwide health-benefit contracts moved to their own line · Nov 5, 2026</li>
        <li><b>0.4</b>Who got the money (live from USAspending), citations, footer, phone layout · Nov 5, 2026</li>
        <li><b>0.3</b>Analytics page, method page, map filters by population and dollars back · Nov 5, 2026</li>
        <li><b>0.2</b>Plain notes for outlier counties; one number format; search by state · Nov 4, 2026</li>
        <li><b>0.1</b>First county totals and checks against Treasury and the Rockefeller Institute · Nov 4, 2026</li></ul></div></div>`;
  };

  // ---------- ABOUT
  V3.about = (el, pat) => {
    const hiBig = big.slice().sort((a, b) => b.ratio - a.ratio)[0], loBig = big.slice().sort((a, b) => a.ratio - b.ratio)[0];
    el.innerHTML = `
    <div class="grid">
      <div class="cell s8 white"><p class="label">About</p><h1 class="hero" id="h-about">Public money should be easy to follow.</h1>
        <p class="lead">Every year, trillions of federal dollars flow back to American communities — as Social Security checks, grants for schools and hospitals, and contracts for work done nearby. That money belongs to the public, yet where it lands, and how unevenly, is hard for most people to see.</p>
        <p class="lead">This site makes it visible: one county at a time, one clear number, with every source shown. Not to say what should change — but so anyone can see what is happening and ask good questions.</p></div>
      <div class="cell s4 green"><div class="stack"><p class="label" style="color:var(--ink)">Counted in 2023</p><div><p class="giant">${M(T.money)}</p><p style="margin-top:10px;font-weight:600">in federal money tied to 3,144 counties.</p></div></div></div>
    </div>
    <div class="grid"><div class="cell s12 strip-cell"><div class="striphead"><h2 class="label">The disparity, in one picture</h2><span class="small">Every county's dollars back per $1, lowest to highest</span></div>${stripChart(130)}</div></div>
    <div class="grid">
      <div class="cell s6"><p class="label">Same country, different returns</p><h2 class="statement" style="font-size:clamp(26px,3vw,40px)">${esc(hiBig.name)} gets back <span class="hl">${R(hiBig.ratio)}</span> per $1. ${esc(loBig.name)} gets back <span class="hl">${R(loBig.ratio)}</span>.</h2>
        <p class="small" style="margin-top:12px">Both are counties of a million or more people. The difference comes from income, age, and where federal work is done — not from any single decision.</p></div>
      <div class="cell s6"><p class="label">Concentration</p><h2 class="statement" style="font-size:clamp(26px,3vw,40px)"><span class="hl">${N50}</span> counties received half of all federal contract dollars.</h2>
        <p class="small" style="margin-top:12px">Knowing where that work happens is part of understanding what federal spending does.</p></div>
    </div>
    <div class="grid"><div class="cell s12" style="padding-bottom:14px"><h2 class="label">Our principles</h2></div></div>
    <div class="grid principles">
      <div class="cell s4"><p class="step">01</p><h3>Same rules for every county</h3><p class="small">One method, applied identically everywhere. No county is singled out.</p></div>
      <div class="cell s4"><p class="step">02</p><h3>Every number has a source</h3><p class="small">Public federal data only — USAspending, IRS, Treasury, Census — linked on every page.</p></div>
      <div class="cell s4"><p class="step">03</p><h3>Estimates are labeled</h3><p class="small">Where we share out statewide money or estimate taxes, it says “est.” right next to the number.</p></div>
      <div class="cell s4"><p class="step">04</p><h3>No sides, no blame</h3><p class="small">No party colors, no “winners” or “losers.” We show what happened, not what should change.</p></div>
      <div class="cell s4"><p class="step">05</p><h3>Free and open</h3><p class="small">No ads, no accounts. Every county's numbers can be downloaded.</p></div>
      ${pat("s4", 401)}
    </div>
    <div class="grid"><div class="cell s8 white"><p class="label">Status</p><h2 class="t">Fiscal year 2023 data</h2><p class="small" style="margin-top:8px">Numbers come from public data for fiscal year 2023; five-year change (2019–2023) is being added. See <a href="#/how">how it works</a> for the full method and its limits.</p></div>
      <a class="cell s4 cta green" href="#/"><span class="label" style="color:var(--ink)">Start</span><span class="ctat">Find your county →</span></a></div>`;
  };

  // re-render change charts once years.js arrives (or on show)
  V3.onShow = view => {
    if (!window.YEARS) return;
    const h = document.getElementById("home-change"); if (h && !h.dataset.done) { h.innerHTML = changeChart(200); h.dataset.done = 1; }
    const a = document.getElementById("an-change-body"); if (a && !a.dataset.done) { a.innerHTML = changeChart(260) + movers(); a.dataset.done = 1; }
  };
})();
