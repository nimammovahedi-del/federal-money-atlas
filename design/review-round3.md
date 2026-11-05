# Round 3 review: features and design (2026-11-05)

Two independent reviewers looked at `design/rebuild3/type.html`: one for **missing features** (thinking as residents, reporters, officials and teachers) and one for **design gaps**. Nothing below is built yet unless marked **Fixed**. Pick what to build.

## Already fixed (these were bugs)
- Kalawao, HI showed the wrong note ("base, lab or shipyard"); it now says its taxes are reported with a neighboring county.
- The Grants tile now shows its "% of money in"; tiny shares show "<1%" instead of "0%".
- The rank now reads "of 3,143 counties with a figure" (one county has no tax data).
- Count-up numbers ran off-screen and showed partial values to screen readers and copy/paste. They now run only when visible, and the real value is always in the label.
- Entrance animations could leave tiles invisible if animations didn't run. They now only switch on once the page is running.
- The big focus box no longer appears around headings after a page change (keyboard focus rings stay).
- Page changes could stall in windows that don't draw (hidden tabs); there's now a fallback.

## Features (ranked; ★ = reviewer's top 5)
| # | Feature | Who it helps | Effort | Data ready? |
|---|---|---|---|---|
| ★1 | **Who got the money:** top recipients, agencies and programs per county, linking to USAspending | Reporters, officials, residents | M–L | Needs a new summary pass over the bulk files |
| ★2 | **New awards and cancellations** per county (last 30/90 days) | Reporters, officials | L | Needs the monthly change files |
| ★3 | County pages compare with **U.S. overall and the state**, not only the typical county | Everyone | S | Yes |
| ★4 | **One real web address per county** (3,144 pages) with link previews for social media and search | Residents, search engines | M | Yes |
| ★5 | **"Cite this page"**, data version and changelog | Reporters, researchers | S | Yes |
| 6 | State pages (state total, county table, statewide programs) | Officials, teachers | S–M | Yes |
| 7 | County 5-year trend and 5-year average | Officials, reporters | M | After the downloads |
| 8 | Data notes per county (share estimated, flags, code changes, what's left out) | Reporters, researchers | S | Yes |
| 9 | Show what's not counted (Medicare, loans, other payments) and the broad ratio | Officials, researchers | S | Yes |
| 10 | Congressional district view (estimated from counties) | Residents, reporters | M | Needs a free Census crosswalk |
| 11 | ZIP and town search | Residents | S–M | Needs a free ZIP-to-county file |
| 12 | One-page printable county brief | Officials, teachers | S | Yes |
| 13 | Downloads: per-county files, column guide, license | Researchers | S | Yes |
| 14 | Embeddable county card for news sites | Reporters | M | Yes |
| 15 | Glossary with hover definitions | Residents, teachers | S | — |
| 16 | Teacher kit (lesson, questions, worksheet) | Teachers | S | Yes |
| 17 | Updates feed (RSS) for states and cancellations | Reporters | S (after #2) | After #2 |
| 18 | Accessibility statement and "Report an error" | Everyone | S | — |
| 19 | Proper "page not found" | Everyone | S | — |

## Design (ranked; ★ = reviewer's top 5)
| # | Issue → fix | Impact | Effort |
|---|---|---|---|
| ★1 | Numbers disagree across pages (3,143 vs 3,144 counties; strip "highest $16.98" vs list "$14.85" because of the 10,000+ filter; $699.6B vs $699.8B) → one count, one total, label every filter | High | S |
| ★2 | **No footer** → hairline-grid footer: data date, links, sources, download, "Report an error", version | High | S |
| ★3 | **Phone nav takes 130px** (7 items on two rows) → keep Map · Analytics · Counties, put the rest under "More" or in the footer | High | M |
| ★4 | **Chart labels too small on phones** (about 6px) → phone-sized chart layouts or HTML labels; 11px minimum | High | M |
| 5 | Green means different things in different charts → one rule (green = money back) plus a "$1" tick on bars | Med | S |
| 6 | Type tiles can be misread as data (e.g. "→0" next to Contracts) → only "$" and "¢", centered, never beside a number; add one to the home hero | Med | S |
| 7 | Extremes lists repeat the same sentence on every row → a small "contract-driven" tag plus one footnote | Med | S |
| 8 | "Who pays, who gets" has no value axis → % labels and gridlines | Med | S |
| 9 | The "5-year change is being prepared" box looks unfinished → hide the section until the data exists | Med | S |
| 10 | Home repeats Analytics (spread, types, extremes) → keep hero, strip, one chart and a link | Med | M |
| 11 | No favicon or social share image | Med | S |
| 12 | Map shows nothing while loading → "Loading 3,144 counties…" skeleton | Low | S |
| 13 | Print styles and "Copy link" on county pages | Low | S |
| 14 | Analytics jump links scroll away → sticky bar and back-to-top | Low | S |
| 15 | Six different button/link styles → reduce to three | Low | M |
| 16 | Load the map file from the site itself, not an outside CDN, before launch | Med | S |

## Keep (reviewers liked these)
- The white hero panel paired with the green $1.09 tile.
- The one-line-per-county strip ("the best single chart on the site").
- The black/green paid-vs-came-back bars on county pages, and the neighbor map.
- The "Reading it" explanation panels on Analytics.
- Hairline grids, mono numbers, and reduced-motion support.
- Compare's shareable link.
