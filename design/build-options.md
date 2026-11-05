# What to build v1 on (checked 2026-11-04)

What the site needs:
- 3,144 county pages that load fast and show up in search engines;
- one or two interactive maps (Land / People switch);
- an Explore page that compares counties;
- a data rebuild every month;
- $0 to run, with Claude writing the code.

## 1. Site frameworks (the engine that turns data into pages)

| Option | What it's best at | Fit for this site | Notes |
|---|---|---|---|
| **Astro** (current plan) | Content sites with thousands of pre-built pages, plus small interactive "islands" (a map, a picker) only where needed | ★★★★★ | Makes one plain, fast HTML page per county from one template. The map and Explore can be written in plain JS/D3 or Svelte inside Astro. You already use it for other projects. |
| **Observable Framework** | Data apps and dashboards; Python "data loaders" run at build time; Observable Plot and D3 built in | ★★★★☆ | Purpose-built for data sites and very good-looking by default; open source, actively updated (repo updated April 2026). Less flexible for a fully custom look and a page-per-county site; would need a test. [observablehq.com/framework](https://observablehq.com/framework) |
| **SvelteKit** (static export) | Highly interactive apps; used by The Pudding and many newsrooms | ★★★★☆ | Best if Explore becomes the star. More moving parts than Astro for plain pages. |
| **Eleventy (11ty)** | The simplest static generator; no JavaScript unless you add it | ★★★☆☆ | Very fast and simple for pages; the interactive parts would be hand-built. |
| **Hugo** | Building tens of thousands of pages in seconds | ★★★☆☆ | Fastest builds, but its template language is harder to work with and to debug. |
| **Evidence.dev** | Reports written in SQL + Markdown | ★★☆☆☆ | Great for internal dashboards; hard to give it a distinctive public design. |
| Next.js (static export) | Big web apps | ★★☆☆☆ | More than this site needs. |
| Webflow / Framer / Squarespace (no-code) | Marketing sites | ★☆☆☆☆ | Paid plans and limits on how many items the built-in content database holds make 3,144 data-driven pages impractical; maps and monthly data updates would be awkward; you'd be locked into their platform. |

## 2. Maps, charts and interaction (the visual design layer)

| Tool | Use it for | Notes |
|---|---|---|
| **D3 + TopoJSON** (used in the prototypes) | County maps, the Land / People circle map, number lines, dollar bills | Full control over the look; the "people" circle positions can be computed once at build time so pages load fast. |
| **Observable Plot** | Quick, clean charts (trends, bars, small multiples) | Made by D3's creator; much less code; looks good by default. |
| **MapLibre GL + PMTiles (Protomaps)** | A zoomable, pannable map down to roads and towns | Free and open source; the map files are hosted as ordinary static files, so no map-service account is needed. Only needed if Explore gets street-level zoom. |
| **DuckDB-WASM** | Letting Explore sort, filter and rank all counties in the browser | Reads a small Parquet file; lets journalists filter and sort without a server. Optional. |
| **Pagefind** | Instant "find your county / ZIP" search | Free, static, works with Astro; builds its search index at build time. |
| **U.S. Web Design System components** | Accessible search box, fold-out sections (accordions), forms | Use the patterns and accessibility rules, restyled to the atlas look. |
| **Census cartographic boundary files (2023+)** | The base map | Fixes Connecticut, which the current sketch base map draws with its old counties. |

## 3. Free hosting

| Host | Free limits (checked 2026-11-04) | Fit | Notes |
|---|---|---|---|
| **Cloudflare Pages** (new account) | Unlimited bandwidth and static requests; 500 builds/month; **20,000 files per site**; 25 MiB per file ([limits](https://developers.cloudflare.com/pages/platform/limits)) | ★★★★★ | Best free option. 3,144 county pages plus data files and share images fits under 20,000 files if data is bundled sensibly. Needs the **new** account you'll create when asked. |
| **GitHub Pages** | 1 GB site, about 100 GB/month bandwidth (a "soft" limit), deploys time out at 10 minutes ([limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)) | ★★★★☆ | No new account needed beyond GitHub. A good backup, or for launch while traffic is small. Repository must be public on the free plan. |
| Netlify | Free plan is now 300 "credits"/month, roughly 15 GB of traffic; the site pauses when credits run out ([summary](https://netli.fyi/blog/netlify-free-plan-limits-2026)) | ★★☆☆☆ | A news story mentioning the site could pause it. |
| Vercel Hobby | Free, but **non-commercial use only** | ★★☆☆☆ | Rules out donations or ads later. |

For the data: rebuild monthly with GitHub Actions (free), reading the USAspending files one at a time. If the data files outgrow the site, they can go to Cloudflare R2 (10 GB free) on the same new account.

## Recommendation

**Astro + D3/TopoJSON (maps) + Observable Plot (charts) + Pagefind (search), hosted on Cloudflare Pages on a new account, with GitHub Pages as the fallback.**
- It matches the chosen design: one plain, fast page per county (Iteration 1), a few interactive pieces (the dollar bills, the number line, Land / People), and a separate Explore page.
- Everything is free and open source, and you already know Astro from other projects.
- Worth a one-day test before committing: **Observable Framework**. If its default look and data loaders fit, it could save time on the Explore page.
