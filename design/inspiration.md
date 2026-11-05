# Design inspiration for v1 (checked 2026-11-04)

Every link was requested on 2026-11-04 and returned OK unless noted. Many of these sites draw their content with JavaScript, so a few "what to borrow" notes come from what the site is known for, not from a full read today.

## Top 8 to look at first
1. [Eviction Lab map](https://evictionlab.org/map/): a measure dropdown, and a compare mode that pins up to 3 places as cards with a trend line. Closest match to our Explore page.
2. [Data USA county profile](https://datausa.io/profile/geo/cook-county-il): a lead sentence, stat tiles, "Add Comparison", and View Data / Save Image / Share under every chart. For the county page.
3. [GOV.UK Annual Tax Summary](https://www.gov.uk/annual-tax-summary) and its [methods page](https://www.gov.uk/government/publications/how-public-spending-was-calculated-in-your-tax-summary): a short answer page paired with a full methods page.
4. [USAspending state profiles](https://www.usaspending.gov/state): award types, per-person amounts and top recipients, from our own data source.
5. [Engaging Data: land vs. population map](https://engaging-data.com/county-electoral-map-land-vs-population/): how to animate a Land / People switch, with circle positions worked out in advance. ⚠ It shows election results in red and blue; borrow only the mechanics.
6. [Our World in Data Grapher](https://ourworldindata.org/grapher/life-expectancy?tab=map): Chart / Map / Table tabs saved in the link, a Sources tab, and data downloads.
7. GOV.UK Design System [question pages](https://design-system.service.gov.uk/patterns/question-pages/) and [Details component](https://design-system.service.gov.uk/components/details/): for a question-led home page and accessible folded sections.
8. [FT Interactive Graphics](https://ig.ft.com/) and [Reuters Graphics](https://www.reuters.com/graphics/): a restrained paper-and-ink editorial style, with labels on the data instead of in legends.

## Answer-first lookups (Home)
- [GOV.UK Find your local council](https://www.gov.uk/find-local-council): one question, one box, one answer.
- [GOV.UK Check your State Pension](https://www.gov.uk/check-state-pension): a start page that tells you in plain words what you'll get.
- [ProPublica Nonprofit Explorer](https://projects.propublica.org/nonprofits/): a big search box, then headline money figures, then filings by year.
- [Opportunity Atlas](https://www.opportunityatlas.org/): an address search flies the map to your area; a side panel gives one plain number.
- [Data Commons place page](https://datacommons.org/place/geoId/17031): clean place URLs and a one-line summary at the top.
- [ONS Explore local statistics](https://www.ons.gov.uk/explore-local-statistics/): one "find an area" box, plus a "get the data" block.

## Calm county profiles (County page)
- [County Health Rankings county page](https://www.countyhealthrankings.org/health-data/illinois/cook): each measure shows the county, its state and the top U.S. counties side by side.
- [data.census.gov profile](https://data.census.gov/profile/Cook_County,_Illinois?g=050XX00US17031): topic cards with one big number each, linked to source tables.
- [NACo County Explorer](https://ce.naco.org/): "similar-size counties" and quick compare.
- [Headwaters Economics EPS](https://apps.headwaterseconomics.org/economic-profile-system/): even-toned comparison reports over time, with a methods note on each measure.
- [Climate Central](https://www.climatecentral.org/): local lookups that end in one bold sentence.

## Map explorers (Explore)
- [ONS Census Maps](https://www.ons.gov.uk/census/maps/): topic picker, postcode search, change over time, choices saved in the link.
- [USDA ERS Atlas of Rural and Small-Town America](https://www.ers.usda.gov/data-products/atlas-of-rural-and-small-town-america/go-to-the-atlas): a plain government county map with indicator tabs.
- [Datawrapper maps](https://www.datawrapper.de/maps): rules for county maps (stepped colors, legends, color-blind safety).

## Tax-dollar explainers
- [Treasury: Your Guide to America's Finances](https://fiscaldata.treasury.gov/americas-finance-guide/): sections that each open with one plain sentence, and a folded methods section.
- [USAFacts government spending](https://usafacts.org/government-spending/): a neutral tone and a source line under every chart.
- [Rockefeller Institute balance of payments](https://www.rockinst.org/issue-area/balance-of-payments-2020/): the closest precedent for "paid vs. came back", by state. Useful for framing.
- [Federal Taxpayer Receipt (Bipartisan Policy Center / Intuit / Polco)](https://us.abalancingact.com/federal-taxpayer-receipt): a receipt with line items. ⚠ The page showed a setup error on 2026-11-04.

## Methods pages
- [Eviction Lab methods](https://evictionlab.org/methods/): long-form methods, FAQs, caveats and downloads.
- [Pew Research methods](https://www.pewresearch.org/our-methods/): a library of plain-language explainers.

## Editorial style and awards
- [The Pudding](https://pudding.cool/): one idea per piece, patient explanation.
- [Information is Beautiful Awards showcase](https://www.informationisbeautifulawards.com/showcase), [Malofiej](https://www.malofiejgraphics.com/), [SND](https://snd.org/): award shortlists to browse.
- [Flourish examples](https://flourish.studio/examples/): weaker on restraint, but a good range of chart types.

## Design systems and writing
- [U.S. Web Design System](https://designsystem.digital.gov/) and its [Search component](https://designsystem.digital.gov/components/search/).
- [GOV.UK Design System](https://design-system.service.gov.uk/).
- [GOV.UK style guides](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/): plain, neutral sentences.

## Couldn't verify (blocked automated checks; probably fine in a browser)
Census QuickFacts, NYT Upshot, Bloomberg Graphics / CityLab, Axios Local, Pew Fiscal 50, CBO, the Australian tax receipt (ato.gov.au), Washington Post Graphics and FRED Maps.

Skipped on purpose: advocacy or partisan tax-receipt sites (National Priorities Project, Third Way).
