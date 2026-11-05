# Federal money map — status

Working name: **federal-money-map** (final name not chosen yet).
A free public website: every federal dollar spent in your county, who got it, what for, the 5-year trend, new awards and cancellations, and a headline "dollars back per $1 of federal tax paid".

Last updated: 2026-11-04 (Phase 0).

## Decisions so far (2026-11-04)

| Topic | Decision |
|---|---|
| Geography | **Counties first** (3,144 in the 50 states + DC). Congressional districts later, as an estimated view built from counties. |
| Money counted in "dollars back" | **Contracts, grants, Social Security & SSI.** Loans shown separately (they are repaid), not counted. Medicare, veterans' and other direct payments, and refundable tax credits are in the spreadsheet as "not counted" columns, so you can decide later. |
| Tone | **Plain civic reference**: numbers, sources, caveats; no "giver/taker" labels. |
| Name | Decide later. |
| Hosting | Free only (Astro static site; Cloudflare or Vercel free plan; GitHub Actions for updates). **Don't use the CongressZ or any existing Cloudflare account.** You will make a new account when we get to deploying. |
| AI text | Only inside Claude Code sessions, never through the API. |
| Asking first | No deploying, accounts, payments or publishing without asking. |

## Data sources (checked 2026-11-04)

| Source | What we get | Access | Updates / how far behind | Terms | Verdict |
|---|---|---|---|---|---|
| **USAspending bulk files** ("award data archive") | Every contract, grant, loan and direct-payment transaction, with the county where the work or payment happens, recipient ID (UEI), program number, agency, and modification type (cancellations) | Free, no key. ~3.3 GB zipped per fiscal year, plus monthly "delta" files with only changes | Full files refreshed monthly (current: 2026-10-06). Contracts appear within days (Defense: 90-day delay); grants twice a month. Recent years keep getting corrected | Public domain | **Main source.** Holds Social Security by county too |
| USAspending API | Same data, pre-summed | Free, no key | Live | Public domain | Times out (60-second limit) on big states and nationwide county queries; small states work. Fine for one-county lookups, not for totals |
| **IRS SOI county data** | Income tax, net investment income tax, additional Medicare tax, self-employment tax, wages, investment income, refundable credits, by county and income bracket | Free CSV | Annual; tax year 2023 is latest (~2.5 years behind) | Public domain | **Tax side.** County sums match state rows exactly |
| SSA beneficiaries by county (OASDI, SSI) | Beneficiary counts, December monthly benefits | ssa.gov blocks automated downloads | Annual (2024 latest) | Public domain | **Not needed for totals.** USAspending already carries SSA payments by county (Vermont: $3.66B, all 14 counties). Adding SSA on top would double-count. Use a hand-downloaded copy as a cross-check |
| CMS Medicare Geographic Variation | Original Medicare spending per beneficiary + all beneficiaries, by county | Free API, no key | Annual; 2014–2024 | Public domain | Not counted (your choice); used for an "if Medicare were included" column |
| Census population estimates (Vintage 2025) | County population 2020–2025 | Free CSV | Annual (March) | Public domain | Denominator for per-person figures |
| Treasury Monthly Treasury Statement | National tax receipts by type; Social Security and SSI outlays | Free API, no key | Monthly | Public domain | National control totals and checks |
| BEA county income (CAINC4) | Social insurance contributions by county (where people work) | Free zip, no key | Annual (2024 latest) | Public domain | Check only. BEA stopped its by-program transfer table (CAINC35) after 2022 |
| Rockefeller Institute "Giving or Getting?" (Aug 2025) | State receipts and spending, FFY2023 | PDF | About yearly | Copyright: cite, don't republish | Outside check for state totals |

**Pitfalls, with measurements:**
- **State pass-through money lands at the capital.** Vermont grants, 2023: by recipient location, $2.74B of $3.30B (83%) sits in Washington County (Montpelier). By place of performance, about two-thirds has no county at all, mostly statewide programs such as Medicaid. **Fix:** use place of performance. Show no-county grants as a separate "statewide" line, shared by population and labeled an estimate. Later, share each big program by a better proxy (Medicaid by enrollment, SNAP by participants).
- **Where the work happens vs. where the recipient is based.** Place of performance is the default. Recipient-location totals stay in the spreadsheet for comparison. Counties where contracts dominate are flagged (headquarters, shipyards, one-off projects).
- **Sub-awards.** Not added: they are part of the prime award, so adding them would double-count. Reporting is also incomplete (only awards over $30k). Later they could be a separate "where sub-awards went" view.
- **Duplicate company names.** Group by the unique entity ID (UEI, which replaced DUNS in April 2022) and its parent UEI, never by name. Show one cleaned name per parent.
- **Obligations, not cash.** USAspending's standard measure is money committed. Multi-year contracts arrive in lumps, and money taken back shows as negatives. Use 5-year averages for the trend and headline later.
- **Loans:** the obligation is the expected cost to the government, not the face value. Both are kept; neither is counted in "dollars back".
- **Medicare at insurer headquarters:** Medicare program money in USAspending is split into its own column and not counted.
- **County changes:** Connecticut moved to 9 planning regions in 2022, while old spending records may still use the 8 old counties. These are split by town population. Alaska splits and other old codes are mapped too.
- **Different years:** taxes are tax year 2023 (calendar); spending is fiscal year 2023 (Oct 2022–Sep 2023), the same year Rockefeller uses.

## Method for "dollars back per $1" (recommended)

Modeled on the Rockefeller Institute's state method, adapted to counties:

1. **Taxes paid by a county's residents (denominator).** Start from Treasury's FY2023 receipts ($4,439B) and spread 97.3% of them to counties:
   - **Income tax** ($2,177B): by IRS county income tax after credits, plus net investment income tax. Measured.
   - **Payroll taxes** ($1,615B: Social Security, Medicare, unemployment, railroad): by an IRS-based estimate of each county's taxable wages and self-employment tax. Wages above the Social Security cap are trimmed using the $200k+ income bracket. Estimated from measured inputs.
   - **Corporate tax** ($420B): 75% by investment income (interest, dividends, capital gains) and 25% by wages. Same split as Rockefeller.
   - **Estate tax**: by investment income. **Excise taxes**: by population.
   - **Not allocated** (2.7%): customs duties and miscellaneous receipts, as Rockefeller does.
2. **Money in (numerator).** Contracts + grants + Social Security & SSI, by place of performance, FY2023 obligations from USAspending. Statewide grants with no county are shared by population (marked "est.").
3. **Dollars back per $1** = money in ÷ taxes paid. Always shown with the U.S. average next to it and as a multiple of that average. No deficit adjustment. Rockefeller also leaves it unadjusted, and a "balanced budget" version can be a footnote.
4. Because the counted money leaves out Medicare, federal pay, defense overhead and interest, **the U.S. average is below $1**. That is honest but needs a one-line explanation wherever the number appears. The "broad" ratio in the spreadsheet shows how adding Medicare, other direct payments and refundable credits changes it.

Why this is defensible: every tax dollar ties back to a Treasury total, and the measured part (income tax) comes straight from IRS county data. Our state totals can be compared line by line with an independent published study (see Phase 0 results). The proxies are standard and published.

## Prior work and competitors

**Main finding:** no current free site combines county spending, a county tax-paid figure and a published method.

- **USAspending.gov map and state profiles** (current). County, district and state layers, and a place-of-performance vs. recipient toggle. No tax side, no ratio, no Social Security context. Totals are obligations, and districts or counties with the state capital look inflated.
- **Census Consolidated Federal Funds Report** (county spending by program, FY1983–FY2010). Ended with the FY2012 budget. This is the gap.
- **Tax Foundation.** The state ratio study ended with FY2005 and used CFFR. The 2004 "Putting Taxes on the Map" county study estimated **tax burdens only**, not dollars back.
- **Rockefeller Institute "Giving or Getting?"** (Aug 2025, FFY2023). The best current method, state level only. The method above follows it.
- **NY State Comptroller** (state); **Pew Fiscal 50** (state-government budgets); **WalletHub** (opaque index, often framed red vs. blue).
- **NACo County Explorer** (selected programs only, no totals); **Headwaters EPS** (county reports from BEA data).
- **SmartAsset 2026 county study.** Uses place of performance but shows the Medicare-at-insurer-HQ artifact (Hennepin MN ~$286B).
- **Grant cancellation trackers** (Grant Witness, Lost Funds, Center for American Progress). State or district level, and run by advocacy groups.

**What makes this one better:**
1. A county tax side (IRS county data + payroll estimate), with a ratio next to the U.S. average.
2. Place of performance by default, statewide money shown openly instead of dumped on the capital, and headquarters artifacts flagged.
3. A 5-year trend with multi-year averages, so lumpy contracts don't swing the headline.
4. New awards and cancellations rebuilt from USAspending's own modification records at county level, not taken from advocacy trackers.
5. A full methods page, an "excluded" list, and downloadable CSVs where every number traces back to a source.

## Accuracy risks and staying non-partisan

**Accuracy risks and what we do about them**

| Risk | What could go wrong | Guard |
|---|---|---|
| Statewide money | Medicaid, highway and SNAP grants have no county; shared by population they hide real differences | Label "est."; later use per-program proxies; show the share that is estimated |
| Headquarters and big projects | A shipyard or contractor HQ makes a small county look like it "gets" billions | Place of performance; flag counties where contracts dominate; 5-year averages |
| Small counties | 1 big award in a county of 2,000 people produces absurd per-person numbers | Flag under 5,000 people; show ranges or bands on the map |
| Obligations vs. cash | Money committed in one year for five years of work; negatives from cancellations | Multi-year averages; explain on methods page |
| Tax estimates | Payroll and corporate taxes are estimated, not measured | Show measured vs. estimated parts on every county page; check states against Rockefeller |
| Year mismatch | Tax year vs. fiscal year; IRS runs ~2.5 years behind | State both years on every page; align on the latest IRS year |
| Double counting | Sub-awards, SSA data on top of USAspending, Medicare in two places | Prime awards only; SSA as a check only; Medicare split out |
| Data corrections | Agencies revise past years every month | Date-stamp every number; rebuild from fresh files monthly |

**Staying non-partisan**
- No red or blue, no "taker/giver/moocher/donor" words, no state-party coloring, no election data on the site.
- Lead with neutral explanations of *why* ratios differ: older residents (Social Security), lower incomes (progressive taxes), military bases and federal facilities, statewide programs.
- Social Security and Medicare are shown as earned benefits in their own section, not lumped in as "handouts".
- Same method for every county, published in full with code, and no commentary on individual places.
- Cancellations: report the facts from USAspending (what, when, amount), without loaded framing.
- Ratios always appear with the U.S. average and the full dollar amounts, never alone.
- Any AI-written text (written in Claude Code, never the API) only describes the numbers and cites them. No judgments.

## Phase 0 results

**Spreadsheet to review:** `output/phase0_counties_fy2023.xlsx`. It has 5 sheets: Read me, Counties (3,144 rows), States, Checks, Sources. The same county table is also in `output/phase0_counties_fy2023.csv`.

Inputs: 6.69M contract transactions and 6.18M grant/loan/payment transactions (USAspending FY2023), IRS tax year 2023, Census 2023 population.

**Checks against published figures**

| Check | Result |
|---|---|
| USAspending contracts total vs. USAspending's published FY2023 total (~$759B) | $760.4B ✔ |
| Social Security + SSI in USAspending vs. Treasury benefit outlays | −0.3% ✔ |
| IRS county income tax vs. Treasury income tax receipts | −1.6% (calendar vs. fiscal year) ✔ |
| Our 50-state tax total vs. Rockefeller's allocated receipts | +0.6% ✔; every state within ±8% |
| Our state "dollars back" vs. Rockefeller's state ratios | correlation 0.97 ✔ (ours is lower, since we count less spending) |
| Payroll estimate vs. BEA state social-insurance contributions | ~10% lower, as expected: BEA counts by workplace and includes state unemployment insurance. DC −62% because of commuters |
| IRS county sums = IRS state rows; county populations = state totals | exact ✔ |

**What the numbers say (FY2023)**
- **U.S. average: $0.74 back per $1** for the counted money. With Medicare, other direct payments and refundable credits added, $1.04.
- **The typical county gets more back than the average** (median $1.09; 82% of counties are above average). Those counties hold only about half the population. A few high-income metros pay a large share of taxes and pull the average down (San Mateo $0.19, Manhattan $0.25, Palm Beach $0.25). This needs one clear sentence on the site.
- **Highest ratios** are military posts, national labs, shipyards and depots: Chattahoochee GA (Fort Moore), Los Alamos NM, Anderson TN (Oak Ridge), Martin IN (Crane), Jackson MS (Pascagoula). Plus tiny counties (Loving TX, pop. 46).
- **Only 24% of grant dollars have a county.** About $1,015B of grants and payments is "statewide". The biggest pieces are Medicaid ($603B), SNAP ($118B; a direct payment, not counted), school meals ($27B), CHIP ($18B) and TANF ($17B). For now this is shared by population. **Fixing this is the top Phase 1 accuracy task.**
- **Misbooked national contracts:** $24B of VA Community Care Network contracts (Optum, TriWest) sit in Spotsylvania County, VA. Medicare in USAspending ($993B) sits at insurer and contractor headquarters (Hennepin MN $151B, Marion IN $119B, Jefferson KY $100B). Medicare is kept out; the VA contracts need a "national programs" line.
- **121 counties have a negative category** (more money taken back than awarded that year). Dimmit County, TX is negative overall. This is a strong argument for 5-year averages.
- **Kalawao County, HI** has no IRS data (the IRS counts it inside Maui), so it has no ratio.

**Fixed during Phase 0:** the grants file names states in words rather than codes. At first this left $849B of grants with no state. The script now maps the names to codes.

## Design directions

Preview: `design/directions.html`, built from real Phase 0 numbers (sample: Franklin County, OH). It has a comparison table, a page-by-page breakdown of each direction (home, county page, map, type and color, motion, phones, strengths, risks, effort) and a mockup of each. Rebuild it with `make_design_preview.py`. **Waiting for your choice.**

| | Direction | Idea | Inspirations | Strength | Main risk | Effort |
|---|---|---|---|---|---|---|
| A | **Receipt** | Map-first home; county page as an itemized receipt | UK Annual Tax Summary, Receiptify | Instant, shareable, great on phones | Implies "you paid, you got"; looks like Rx Receipt | Low–med |
| B | **Almanac** | Reference fact sheets with numbered sources and downloads | Our World in Data, Census QuickFacts, USAFacts | Most trusted and neutral; easiest to keep accurate | Dry; least shareable | Low |
| C | **Ledger** | Two-sided map centered on the typical county; in vs. out bars, later a flow | USAspending Spending Explorer, OKF Where Does My Money Go?, FT Visual Vocabulary | Both sides at a glance | "Winners and losers" reading, the most partisan-risky | Med |
| D | **Atlas** (new) | Printed-atlas look with a **Land / People** switch (people-sized county circles) | National Atlas of the U.S., swisstopo, Dorling cartograms / Worldmapper | Fixes "big empty counties dominate the map" | Unfamiliar map type; heavier page | Med–high |
| E | **County Card** (new) | Each county as a collectible card (shape, big number, stat-table back) | Topps card backs, NPS passport stamps, Wikipedia infoboxes | Most shareable; classrooms; compare two places | Playful tone; rank invites competition | Med |
| F | **Statement** (new) | Year-end statement: this year / 5-yr average / change, plus an "adjustments" list of cancellations | Bank statements, pay stubs, Social Security Statement layout | Built around trends and cancellations; printable | Must not look official; dense; document style like Rx Receipt | Low–med |
| G | **Explorer** (new) | Map app: switch the measure, side panel, compare up to 3, shareable links | Opportunity Atlas, Census My Community Explorer, map apps | Power users, journalists | Most work; can overwhelm casual visitors | High |

Suggested mixes: **Almanac + Atlas** (my pick: the most defensible look plus an honest map), **Almanac + Card** (trust plus share images), **Statement + Explorer** (for journalists and officials).

Design notes from the data:
- 82% of counties are above the U.S. average, so the maps now use equal-sized groups of counties (quantiles), and the two-sided map centers on the typical county ($1.09), not the average.
- Rx Receipt's own options are a lab report/receipt, a Drug Facts label and an editorial look. D, E and G don't overlap with any of them.

### Combined direction under consideration: Atlas + Ledger + Statement + Explorer (2026-11-04)

Prototype: `design/prototype.html` (rebuild with `scripts/make_prototype.py`). It works for all 3,144 counties: click the map, search, open county pages, switch Explore measures, pin and compare. Its "Notes" page has the full kept / merged / cut table.

- **Shared look (from Atlas):** paper and charcoal ink, Barlow / Barlow Condensed only, a sage-to-forest map in six equal-sized groups, and the Land / People switch on both maps.
- **Two fixed colors (from Ledger):** green = money in, umber = taxes paid, used in bars and table headings everywhere. Estimates get an "est." tag and striped bars.
- **Pages:**
  - **Map (home):** the Atlas map, search, and three ways in.
  - **County page:** Ledger summary on top (came in | $ back per $1 | paid in taxes, on one bar scale), then the Statement's itemized table (FY / per resident / 5-yr avg / change), "Adjustments" for cancellations, a "Next door" sidebar with a neighbor map, "shown for context, not counted", notes, sources, and print.
  - **Explore:** 5 measures, side panel with national and state rank, pin up to 3, and a comparison table. The view is saved in the link.
  - **Method:** not drawn yet.
- **Cut:**
  - Ledger's two-sided map, flow diagram and dollar "balance" line.
  - Statement's "statement" wording, mono fonts and state index page.
  - Explorer as the home page, plus its own font and palette.
  - Atlas plate numbers and decoration.
- **Placeholders until Phase 1:** 5-year columns, adjustments, top recipients, the method page, share images, Connecticut on the map (needs a newer base map), and ZIP search.

### Focus iterations on the combined design (2026-11-04)

The combined prototype felt overwhelming. Diagnosis:
- no single focal point;
- the answer was a number, not a sentence;
- every element had equal weight;
- comparisons were scattered across four places;
- the home page never asked the question.

`design/iterations.html` (rebuild: `make_prototype.py iterations_template.html iterations.html`) shows three fixes with real data for any county:

1. **Answer first:** the home page asks the question with a big search; the county page is one centered column. It holds a one-sentence answer, a "paid vs. came back" bar pair, one comparison number line (with the state's counties as dots), then folded details.
2. **Cents on the dollar:** everything is in cents per $1 of tax. The residents' $1 is drawn as a bill, and what came back as filled bills split into Social Security / grants / contracts. Small bills compare the county with the typical county, its state, the U.S. average and its neighbors.
3. **Step by step:** tapping the map opens a card with the answer. The county page is 5 short steps (answer, came in, paid, compares, all numbers) with Next / Back.

Recommendation: Iteration 1's structure + Iteration 2's dollar-bill hero and cents language + Iteration 3's tap-a-county card on the home map. **Waiting for your choice.**

### Prototype v1 (2026-11-04)

Built from the combined prototype, with patterns from Axis Maps' [California Birth Equity Connect](https://www.axismaps.com/projects/california-birth-equity-connect). Your choices: combined prototype as the base; borrow the question-titled filter panels, the grid-cell map and a list view; three shades of green; a prototype plus a case-study page.

- `design/v1.html` (rebuild: `make_prototype.py v1_template.html v1.html`):
  - **Home:** a dashboard. The "What came back?" panel (all / Social Security / grants / contracts, each with its national cents per $1) and the "Which counties?" panel (size groups with counts) recolor the map and rewrite its title. A "Selected" panel shows the clicked county, or lists every county in a grid cell.
  - **Map:** three views. Land; People (population-sized circles); Grid (1,539 equal cells over a muted basemap with city labels; empty western cells take the county that covers them).
  - **Pages:** Counties (sortable, filterable list) · County page (answer sentence, ledger, itemized table, next door, folded extras) · Compare (measures, pin up to 3, link reproduces the view) · About (method in plain words).
  - **Links:** `#/?view=grid` opens the map in a given view.
  - **Phones:** the map comes first, with the panels below it.
- `design/case-study.html`: a presentation page in the style of the Axis Maps project page. It has a live 5-screen carousel of the prototype, plus the question, audiences, design decisions, how the numbers were checked, what's next, and credits.

### Visual rebuild in the style of nader.io (2026-11-04)

The v1 prototype looked dated and confusing, so it was rebuilt from scratch in `design/rebuild/` in three iterations. **Start at `design/rebuild/index.html`**, the presentation page with live previews.

**Your choices:**
- Every page in all three iterations.
- Directions: Bento / Editorial / Search-first.
- Colors: green = money that came back, black = taxes paid, gray for everything else.
- Kept: Land/People/Grid, the filter panels and the next-door comparison.
- Replaced: the itemized table became three headline numbers plus a CSV download.

**Style (from nader.io):** #F6F6F6 page, #0A0A0A ink, #5E5E5E gray, #E5E5E5 hairlines, #51DA4C signal green (#1A7A26 for green text); Inter plus JetBrains Mono for figures.

**Files:**
- `core.js`: shared data, search, maps, routing, CSV and list helpers.
- `base.css`: shared tokens.
- `data.js`: built with `make_prototype.py --js`.
- The iterations: `a-bento.html`, `b-editorial.html`, `c-search.html`.

**Reviews** (three independent agents, before fixes):

| Reviewer | A | B | C | Pick |
|---|---|---|---|---|
| Usability | 5 | 7 | 7.5 | C (clearest place to start) |
| Visual design: clean / nader.io fidelity | 7 / 8 | 8 / 6 | 8 / 4 | A (looks like nader.io) |
| Accessibility | no blockers | | | |

**Fixed after review:**
- Search now handles a state ("Washington, OH" or "washington county ohio"), "saint" for "St.", and typos.
- County pages compare with the typical county only, and every figure uses one format ($0.74, not 74¢).
- Plain notes for outlier counties.
- Kalawao shows "not reported" instead of $0.
- Green is used only for money that came back.
- New map colors: five greens, a labeled key, hatching for no data, white for counties outside the size filter.
- A result panel with a close button next to the map.
- A "View this as a list" link to a list with the same filters, saved in the address.
- Keyboard focus kept after filter clicks, visible focus rings, section headings, page titles per view, and search results announced to screen readers.
- Copy-link on Compare.
- No sideways scrolling on any of the 15 pages at 375px.

**Recommendation:** A's grid and county page, opening with C's big search and "Try" examples, plus B's list rows. **Waiting for your choice.**

**Not yet verified:** testing with a real screen reader, and tests with real users.

### Round 2 iterations (2026-11-04)

**Start at `design/rebuild2/index.html`.**

**Your brief:**
- **Front page:** A's front page, reading "What does $1 get you?", with search, then "Show the map" + "Browse counties", and the green tile on the right.
- **Map page:** a separate full-screen page with a slide-out options panel, open on desktop and closed on phones. Its rows:
  1. Kind of money.
  2. Population and dollars-back range sliders.
  3. Land / People / Grid view.
- **Map details:** the key above the map; a result card always in view, with a bigger Open button.
- **Lists:** B-style list and compare pages. Compare adds state → county dropdowns and a slide-out map picker.
- **Style:** more nader.io grid, green and patterns.

**Three iterations** share one layout (`rebuild2/v2.js` and `v2.css`) and differ only in the pattern that fills empty tiles:
- `pixel.html`: green and black pixel blocks.
- `lines.html`: barcode stripes and hatching.
- `type.html`: giant $, ¢, % and arrow glyphs.

**Shared-core changes:**
- Filters can be any rule, not just fixed size groups.
- New `#/map` route.
- The map's result card can be turned off (used in the compare picker).

**Checked:** works on desktop; no sideways scrolling on any of the 18 pages at 375px; the options panel starts closed on phones.

**Not done:** no independent agent reviews this round.

**Waiting for your choice.**

### Round 3 · Type style (2026-11-05)

You chose round 2's Type style. **Start at `design/rebuild3/type.html`.**

**New in this round:**
- **Home:**
  - The hero stays.
  - A "Why track it" statement: $3.2 trillion reached counties and did not land evenly.
  - "Every county, one line each": a chart of all 3,143 counties, sorted.
  - The spread chart and the money-by-type bar.
  - "29 counties received half of all contract dollars".
  - Five-year change, plus the counties getting the most and least back.
  - Calls to action.
- **New pages:**
  - **Analytics:** spread, by type and by county size, contract concentration curve, top/bottom 10 with notes, all states, 5-year change and biggest movers.
  - **How it works:** the formula, steps 1–3 with the full method, a worked example for Franklin County, sources with links, the checks we ran, and limits.
- **About:** rewritten around accountability (firm but neutral), with a disparity chart, two contrast statements and five principles.
- **Map:** the options button is now a slim arrow on the panel's edge.
- **Motion:**
  - Page changes cross-fade with a slight slide (the browser's View Transitions).
  - Tiles rise in one after another.
  - Bars grow, the all-counties line chart wipes in, and big numbers count up.
  - All of it is off for people who prefer reduced motion.
- **Data:**
  - FY2019–2022 USAspending files are being downloaded and read one year at a time, each deleted after.
  - `scripts/make_years.py` then builds `design/rebuild3/years.js`, and the change charts fill in.
  - `aggregate_usaspending.py` now takes `--fy=YEAR`.

**Checked:** all 8 pages at 375px with no sideways scrolling, and no console errors.

**Not yet verified:** the change charts (waiting on the downloads).

### Round 3b (2026-11-05)

**Your changes:**
- Home: the giant ¢ tile is removed, and the "$3.2 trillion… did not land evenly" statement is now one wide, low band.
- Counties page: a ranked-list symbol replaces the pattern tile.
- Analytics: section buttons now jump within the page (they used to go home). New charts: per-person scatter, "who pays vs. who gets" (tenths of the population), regions, plus "Download all counties (CSV)".

**Reviews:** two agents' findings are in `design/review-round3.md`. Their clear bugs are fixed: the Kalawao note, the grants share, "<1%", the rank label, safe count-ups, safe entrance animations, heading focus boxes, and the page-change fallback. **Everything else waits for your choice.**

**Downloads:**
- FY2019–2022 slowed to about 0.3 MB/s on 2026-11-05.
- Then a network retry restarted the first file from zero.
- The downloads are **stopped**. The partial file is deleted, and FY2023 data is untouched.
- To retry later, run `aggregate_usaspending.py --fy=2019` (and 2020–2022), then `make_years.py`. The change charts stay hidden behind a "being prepared" note until then.

### Round 4 (2026-11-05): from the review lists

**Features (1, 5):**
- **Who got the money** on every county page: tabs for Recipients, Agencies and Programs. It shows the top 10 each, live from USAspending.gov's free public API (FY2023, by place of performance), cached per visit, with a retry if slow. Recipients link to their USAspending pages. Connecticut planning regions show a note, because the API still uses the old counties.
- **Cite this page:** a ready-made citation with the version and data date, and a copy button. How it works now has a "Data version" section and a changelog.

**Design:**
- **1, consistent numbers:** "with a figure" wherever 3,143 is used; extremes lists are labeled "10,000+ residents"; the strip names its lowest and highest county; one contracts total; a short "contract-driven" tag instead of a repeated sentence.
- **2, footer:** data date and version, links, sources, download all counties, data version. "Report an error" waits for a public issue tracker at launch.
- **3, phone menu:** one row without Home; "How it works" becomes "Method" on phones; the header shrinks from 130px to 74px.
- **4, phones:**
  - Decorative tiles, step numbers and the neighbor map are hidden.
  - Tighter spacing and phone-sized charts (text at least 11.3px).
  - The home page drops the repeated lists and the not-ready change box (Analytics keeps them).
  - Home is 22% shorter.
  - No sideways scrolling on any page.

**Note:** the who-got-the-money panel calls USAspending's API from the visitor's browser. For launch, consider pre-building these lists from the bulk files, so the site doesn't depend on the API being up.

### Phase 1 data fixes (2026-11-05)
- **Statewide grants are shared by need, not population:**
  - Medicaid/CHIP by people with Medicaid coverage.
  - School, child-welfare and Head Start programs by children.
  - TANF, child care and energy aid by people in poverty.
  - WIC and SNAP administration by SNAP households.
  - The rest by population.
  - Sources are keyless Census files: ACS 2019–2023 table-based summary files and SAIPE 2023. The Census API now requires a key, so it isn't used. State totals are unchanged.
- **Nationwide health-benefit contracts** ($35.6B: VA community care via Optum and TriWest; TRICARE via Humana Government Business and Health Net) move out of the county where they're booked into an uncounted "national programs" line. Spotsylvania, VA goes from $14.85 to $0.69 back per $1.
- **New results:** typical county $1.12, U.S. overall $0.73; states still match Rockefeller (correlation 0.965).
- **Downloader:** resumes after any failure. FY2019–2022 are downloading in the background; after they finish, run `make_years.py` and copy `design/rebuild3/years.js` to `site/public/app/`.

### The real site (2026-11-05) — `site/`
- **Astro 7** static site with real addresses: `/`, `/map/`, `/analytics/`, `/counties/`, `/compare/`, `/how-it-works/`, `/about/`, `/county/{FIPS}/` (3,144 pages), and a 404 page. 3,152 pages build in about 1 second; 3,164 files, 26 MB.
- **County pages** are built as plain HTML (answer, note, numbers, ranks), with title, description and link-preview tags (`public/og.png`). In a browser, the interactive version (from the prototype code in `public/app/`) replaces it.
- **Self-hosted:** map shapes and chart libraries are stored in `public/vendor/`; no outside CDN except Google Fonts. The who-got-the-money panel still calls USAspending's API.
- **Page changes** use the browser's cross-document view transitions (off for reduced motion).
- **Checked:** search, county pages, map, list filters saved in the address, compare (dropdowns, saved link), 404 status; all 8 pages at phone width.
- **Build and preview:**
  - Data: `cd scripts && ../.venv/bin/python build_phase0.py && ../.venv/bin/python make_site_data.py`
  - Site: `cd site && npm run build && npm run preview`
  - Or start the preview "federal-money-atlas-site" in Claude Code.
- **Not done yet:**
  - Deploy (needs your **new** Cloudflare account and a GitHub repo).
  - Final domain (`SITE_URL`).
  - Monthly data refresh with GitHub Actions.
  - Per-county share images.
  - An error-report channel.

## How to rerun Phase 0

```bash
cd ~/Projects/federal-money-map/scripts
../.venv/bin/python fetch_sources.py          # small files, ~75 MB
../.venv/bin/python aggregate_usaspending.py  # downloads ~3.3 GB, reads it (~20-40 min), deletes it
../.venv/bin/python build_phase0.py           # writes output/phase0_counties_fy2023.xlsx
../.venv/bin/python make_design_preview.py    # writes design/directions.html
../.venv/bin/python make_prototype.py         # writes design/prototype.html (combined prototype)
../.venv/bin/python make_prototype.py iterations_template.html iterations.html  # focus iterations
../.venv/bin/python make_prototype.py v1_template.html v1.html                  # prototype v1 (case-study.html shows it)
../.venv/bin/python make_prototype.py --js                                     # data for design/rebuild/ (the nader.io-style rebuild)
../.venv/bin/python aggregate_usaspending.py --fy=2019                          # any other fiscal year (repeat for 2020-2022)
../.venv/bin/python make_years.py                                              # 5-year change data for design/rebuild3/
```
First time only: `python3 -m venv .venv && .venv/bin/pip install pandas openpyxl pypdf` in the project folder.

## Next steps

1. **You:** review the spreadsheet and pick a design direction (A, B, C or a mix). Pick a name, or let me check a shortlist for conflicts.
2. **Phase 1 accuracy work (before any public page):**
   - Share statewide programs by a real measure instead of population: Medicaid and CHIP by county enrollment (Census ACS Medicaid coverage), SNAP by participating households (ACS), school meals by enrolled students. The data sources still need checking.
   - Add a "national programs" bucket for contracts booked at one place but spent nationwide (VA Community Care, TRICARE managed care, Medicare contractors). Detect them by program and contract type.
   - 5-year history (FY2019–FY2023) and 5-year averages. That's another 5 × ~3.3 GB of downloads, one year at a time, each deleted after reading. The script already supports this pattern; I'll ask before downloading.
   - Who got it: top recipients per county, grouped by parent UEI.
   - New awards and cancellations: from the monthly "delta" files, using modification type codes (terminations, deobligations).
   - Cross-check Social Security against SSA's county file. Save it by hand from ssa.gov, since the site blocks scripts.
   - Verify the 82.5% Social Security taxable-wage share against SSA's Annual Statistical Supplement.
3. **Phase 2 website:** Astro static site with county pages pre-built from the data. Free hosting on a **new** Cloudflare or Vercel account you'll create when we get there. A monthly GitHub Actions job rebuilds the data (fits the free runner's disk if files are processed one at a time).
4. Later: congressional districts, estimated by combining county pieces.

Not done yet: nothing is committed to git (the repo is initialized with a .gitignore that keeps the big raw files out), nothing is published, and no accounts were created.

## 2026-11-05 · Live + glitch fixes
- Live (unannounced): https://federal-money-atlas.federal-money-atlas2.workers.dev — Cloudflare Worker, auto-deploys on push to GitHub main (site/wrangler.jsonc).
- Two-tester review fixed: Home flashing over every page (caused jumps), Back/anchor scroll, compare reloads, slider lock, who-tab race, CT neighbor map, list "show more" on Back.
- Left for later: map options "hide" button sits below the tall panel on phones; map has no zoom/state view; the browser's own "Transition was skipped" console notice.
- years.js: Site.astro only loads it if site/public/app/years.js exists — after FY2019–2022 finish, run make_years.py and copy it there.
