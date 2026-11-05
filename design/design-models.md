# Sites to model our design on (checked 2026-11-04)

These are UI/UX patterns to copy: layout, flow, how numbers and comparisons are shown. We copy the decisions, never the branding, logos or artwork. Every site was opened on 2026-11-04. Where a pattern couldn't be seen live, the entry says so. The earlier, shorter list is in `inspiration.md`.

## Top 10 to open first
1. [Census Reporter: LA County](https://censusreporter.org/profiles/05000US06037-los-angeles-county-ca/): the closest overall template for our county page.
2. [UK Local Deprivation Explorer](https://deprivation.communities.gov.uk/about-your-neighbourhood/E01027770): question as the page title, sentence answers as headings.
3. [OECD Regional Well-Being: California](https://www.oecdregionalwellbeing.org/US06.html): a ready-made version of our comparison number line.
4. [Redfin: Seattle housing market](https://www.redfin.com/city/16163/WA/Seattle/housing-market): answer paragraph, then 1y/3y/5y trend, then "X% higher than the national average".
5. [Atlas of Economic Complexity: USA](https://atlas.hks.harvard.edu/countries/840): an opening paragraph generated from the data, then KPI tiles showing "Nth of 145".
6. [Stats NZ: Dunedin](https://tools.summaries.stats.govt.nz/places/TA/dunedin-city): "Quick stats" cards showing the local value next to the national value.
7. [Wise send-money calculator](https://wise.com/us/send-money/): a vertical equation, "you send → fees → they receive". Use it as "paid → came back".
8. [Child Opportunity Index map](https://www.diversitydatakids.org/maps/): a switch to compare against the nation, the state or the metro area.
9. [Census QuickFacts multi-county table](https://www.census.gov/quickfacts/fact/table/losangelescountycalifornia,cookcountyillinois,US/PST045224): the counties being compared are listed in the address, so a comparison is a shareable link.
10. [Measure of America map](https://measureofamerica.org/maps/): Explore controls read as a sentence: WHERE / WHAT / WHO.

## A. Whole-site models to copy most closely
- **[Census Reporter](https://censusreporter.org/profiles/05000US06037-los-angeles-county-ca/)** (County, Overall)
  - One centered column; a big headline figure with a source tag.
  - Every number carries an inline comparison ("about 90 percent of the figure in California").
  - Calm topic blocks.
- **[UK Local Deprivation Explorer](https://deprivation.communities.gov.uk/about-your-neighbourhood/E01027770)** (County, Home)
  - The page title is a question; each heading answers it in a sentence; the supporting fact sits underneath.
  - Moves from nation to local area to details. "What is this?" is folded away, with a glossary.
- **[OECD Regional Well-Being](https://www.oecdregionalwellbeing.org/US06.html)** (County, Home)
  - A sentence, then a dot on a scale, then the rank within the country, then a band against median and top/bottom 20%.
  - "Similar regions elsewhere".
  - Detects your location, with a clear "don't detect" option. (Copy the structure, not its colorful palette.)
- **[Stats NZ place summaries](https://tools.summaries.stats.govt.nz/places/TA/dunedin-city)** (County)
  - Local-vs-national stat cards with an as-of date.
  - A legend saying whether each number is final, revised or provisional.
  - Folded definitions.
- **[Atlas of Economic Complexity](https://atlas.hks.harvard.edu/countries/840)** (County, Explore)
  - An opening paragraph written automatically from the data, then rank tiles.
  - A "jump to section" menu; a separate explore app. (Slow first load.)
- **[GC InfoBase (Canada)](https://www.tbs-sct.canada.ca/ems-sgd/edb-bdd/index-eng.html)** (Overall, Explore, Methods)
  - A federal-money site built around one search, topic tabs, and an "infographic" page per organisation.
  - A text-only version for screen readers; the version and build date in the footer.

## B. Lookup and answer-first flows (Home)
- [Blacklight (The Markup)](https://themarkup.org/blacklight): one input under a question-led intro, a shareable result link, and a methods link. (Results didn't load in our check; the pattern is described from prior knowledge.)
- [Texas Tribune salaries explorer](https://salaries.texastribune.org/): a worked example ("Jane, a park ranger") that teaches you to read the chart before you search; a CSV link.
- [Wolfram|Alpha](https://www.wolframalpha.com/input?i=area+of+Texas+vs+France): "Assuming X | use Y instead". Ideal for the 30 counties named Washington.
- [Grist: climate spending near you](https://grist.org/project/updates/interactive-ira-bil-project-map): ZIP lookup, a running "$ total, N projects" summary, filters, a table under the map, and a frank note on how accurate the locations are. ⚠ Frames the programs favourably; data last updated July 2025.
- [OpenTheBooks](https://www.openthebooks.com/): the home page is one box. ⚠ A watchdog advocacy group; copy only the interaction.

## C. Local profile pages (County, Methods)
- [ABS Data by region](https://dbr.abs.gov.au/region.html?lyr=lga&rgn=24600): a region summary with an outline map, "search other locations", and XLSX/CSV downloads.
- [MIT Living Wage: LA County](https://livingwage.mit.edu/counties/06037): reference rows (poverty and minimum wage) next to the answer; a breakdown that adds up to it; a "last updated" date.
- [Metroverse](https://metroverse.hks.harvard.edu/city/1022/overview): "similar cities", and definitions shown on the page next to the terms they explain.
- [Urban Institute Upward Mobility dashboard](https://upward-mobility.urban.org/dashboard): "Tour this page", "see what changed", and a suggested citation with a version number. (The institute is seen as left of centre; the dashboard itself is neutral.)
- [Eurostat Regions in Europe 2025](https://ec.europa.eu/eurostat/web/interactive-publications/regions-2025): "find your region" comes first, then short fact cards.

## D. Map and Explore
- [Measure of America maps](https://measureofamerica.org/maps/): controls phrased as a sentence; share and reset buttons.
- [Child Opportunity Index](https://www.diversitydatakids.org/maps/): compare against nation / state / metro, plus geography and year switches.
- [EIG Distressed Communities](https://eig.org/distressed-communities-interactive/): the headline sentence rewrites itself for the chosen place; the geography choice is saved in the link. (Bipartisan think tank with a policy agenda.)
- [Zensusatlas 2022](https://atlas.zensus2022.de/): a collapsible topic tree; side-by-side map comparison. (German only.)
- [Eurostat Regions & Cities Illustrated](https://ec.europa.eu/eurostat/cache/RCI/): population-sized city circles over regional colors, close to our People view.
- [Gapminder Tools](https://www.gapminder.org/tools/): the whole view lives in the link; share, download and embed in the top bar.
- [CDC PLACES county comparison](https://www.cdc.gov/places/tools/county-comparison-tool.html): up to 3 counties side by side, with separate pages for definitions and methods.

## E. Money and per-dollar breakdowns
- [Canada Spends tax visualizer](https://canadaspends.com/en/tax-visualizer): four result tiles, then "where your tax dollars go" in dollars and %. (Check who runs it.)
- [Australian Budget](https://budget.gov.au/): three entry cards and an audience filter.
- [Ohio Checkbook](https://checkbook.ohio.gov/): state spending by county, in expandable chart tiles. (Run by an elected official.)
- [Seattle Open Budget](https://openbudget.seattle.gov/): a summary card that leads into a drill-down.
- [Grant Witness](https://grantwitness.org/): grant-by-grant cancellation cards, CSV, "share and cite". ⚠ Advocacy framing; copy the layout only.
- [National Priorities Project tax receipt](https://www.nationalpriorities.org/interactive-data/taxday/): a receipt layout with a year picker. ⚠ Progressive advocacy group.

## F. Product UX from everyday apps
- [Redfin housing market](https://www.redfin.com/city/16163/WA/Seattle/housing-market): answer paragraph, a 1y/3y/5y switch, a local-vs-U.S. table, and a "compare" search.
- [Wise calculator](https://wise.com/us/send-money/): the vertical money equation.
- [Google Flights](https://www.google.com/travel/flights): a low / typical / high price range bar. (The bar itself is described from prior knowledge.)
- [Stripe Docs](https://docs.stripe.com/payments/accept-a-payment): a "not a developer?" callout and tabbed variants. A model for the methods page.
- [Linear changelog](https://linear.app/changelog): dated entries with a bold title and one paragraph. A model for "what changed in the data".

## G. Studios for visual polish
- [Interactive Things](https://www.interactivethings.com/): restrained Swiss typography; government and OECD clients.
- [Truth & Beauty](https://truth-and-beauty.net/): made the OECD Better Life Index.
- [Fathom](https://fathom.info/): ProPublica and poverty-tracker work.
- [Small Multiples](https://www.smallmultiples.com.au/)
- [Kontinentalist](https://kontinentalist.com/): editorial scrolling stories.
- [Periscopic](https://periscopic.com/)
- [FlowingData](https://flowingdata.com/): ⚠ many recent posts are red/blue election maps.
- [Stamen](https://stamen.com/work/): atlas-quality map design.
- [Axis Maps](https://www.axismaps.com/): the closest fit to a paper-and-charcoal atlas look, plus a cartography guide.

## Could not verify
- **Retired:** FEMA National Risk Index (redirects).
- **Blocked or broken:** ProPublica bailouts (CAPTCHA), Statistics Canada profiles (bot check), INSEE (error), Netherlands "Waar staat je gemeente" (refused), CBS Brede welvaart (empty page), the Swiss FSO atlas (moved and wouldn't load), Census Business Builder (errors), First Street (SSL error), NYC Checkbook (403), California eBudget.
- **Paywalled or blocked:** NYT Upshot.
- **Needs an account:** Neighborhood Atlas.
- **Moved:** the OECD Better Life Index now redirects to oecd.org.
