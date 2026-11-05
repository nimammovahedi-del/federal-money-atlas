"""Write the website's data from the Phase 0/1 results.

  site/src/data/counties.json  - read by Astro at build time to create one page per county
  site/public/app/data.js      - loaded by the interactive pages in the browser (same as the prototype's)

Usage: python make_site_data.py   (run build_phase0.py first)
"""
import json
import subprocess
import sys

import pandas as pd

from config import FISCAL_YEAR, OUTPUT, ROOT

SITE = ROOT / "site"
df = pd.read_csv(OUTPUT / f"phase0_counties_fy{FISCAL_YEAR}.csv", dtype={"FIPS": str})
R, M, T = "DOLLARS BACK per $1", "MONEY IN (counted) $", "TAXES PAID (est.) $"
num = lambda v: None if pd.isna(v) else float(v)

# ranks (1 = most back per $1) nationally and within the state
ok = df[df[R].notna()].copy()
ok["rank"] = ok[R].rank(ascending=False, method="min").astype(int)
ok["st_rank"] = ok.groupby("State")[R].rank(ascending=False, method="min").astype(int)
st_n = ok.groupby("State").size()
df = df.merge(ok[["FIPS", "rank", "st_rank"]], on="FIPS", how="left")

counties = []
for _, r in df.iterrows():
    counties.append({
        "fips": r.FIPS, "name": r.County, "st": r.State, "pop": int(r["Population (2023)"]),
        "ratio": num(r[R]), "rank": None if pd.isna(r["rank"]) else int(r["rank"]),
        "st_rank": None if pd.isna(r["st_rank"]) else int(r["st_rank"]), "st_n": int(st_n.get(r.State, 0)),
        "money": num(r[M]), "taxes": num(r[T]),
        "ss": num(r["Social Security & SSI $"] + r["Social Security & SSI: statewide share $"]),
        "grants": num(r["Grants: tagged to county $"] + r["Grants: statewide, shared by need (est.) $"]),
        "grants_statewide": num(r["Grants: statewide, shared by need (est.) $"]),
        "contracts": num(r["Contracts $"]),
        "tax_income": num(r["Income tax $"]), "tax_payroll": num(r["Payroll taxes (SS, Medicare, UI) $"]),
        "tax_other": num(r["Corporate tax (est.) $"] + r["Estate & excise taxes (est.) $"]),
        "national": num(r["Not counted: national programs booked here $"]),
        "flags": "" if pd.isna(r["Flags for review"]) else r["Flags for review"],
    })
meta = {"fiscal_year": FISCAL_YEAR, "data_as_of": "Oct 6, 2026", "n": len(counties), "n_ratio": int(len(ok)),
        "us_ratio": float(df[M].sum() / df[T].sum()), "median_ratio": float(df[R].median())}
(SITE / "src" / "data").mkdir(parents=True, exist_ok=True)
(SITE / "src" / "data" / "counties.json").write_text(json.dumps({"meta": meta, "counties": counties}, separators=(",", ":")))
print(f"Wrote site/src/data/counties.json ({len(counties):,} counties)")

# browser data: reuse the prototype's packer, then copy it next to the site's scripts
subprocess.run([sys.executable, str(ROOT / "scripts" / "make_prototype.py"), "--js"], check=True)
(SITE / "public" / "app" / "data.js").write_bytes((ROOT / "design" / "rebuild" / "data.js").read_bytes())
print("Copied data.js to site/public/app/")
