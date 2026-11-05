"""Build design/rebuild3/years.js: money that reached each county, fiscal years 2019-2023.

Uses the same rules as build_phase0.py for every year: place of performance, old county codes
mapped to today's, and statewide grants / Social Security shared out by population (2023 population,
so year-to-year change reflects money, not population estimates). Taxes are only available for 2023,
so this file covers money in, not dollars back per $1.

Usage: python make_years.py   (needs data/interim/usaspending_fy{year}_by_county.csv for each year)
"""
import json

import pandas as pd

from build_phase0 import load_counties, pivot_county, remap_counties, statewide
from config import INTERIM, ROOT

YEARS = [2019, 2020, 2021, 2022, 2023]
counties, _ = load_counties()
pop_share = counties.population / counties.groupby("state").population.transform("sum")

series, us = {}, {"ss": [], "gr": [], "con": []}
for fy in YEARS:
    path = INTERIM / f"usaspending_fy{fy}_by_county.csv"
    sp = pd.read_csv(path, dtype={"county": str, "state": str}, keep_default_na=False)
    for c in ["obligation", "loan_face_value", "loan_subsidy"]:
        sp[c] = sp[c].astype(float)
    sp["medicaid"] = sp.medicaid.astype(str) == "True"
    sp["state_gov"] = sp.state_gov.astype(str) == "True"
    sp, _, _ = remap_counties(sp, counties)
    pc, sw = pivot_county(sp, "pop"), statewide(sp, "pop")
    get = (lambda frame, name: counties.fips.map(frame[name] if name in frame else {}).fillna(0))
    sw_share = lambda name: counties.state.map(sw[name] if name in sw else {}).fillna(0) * pop_share
    con = get(pc, "contracts")
    gr = get(pc, "grants") + sw_share("grants")
    ss = get(pc, "social_security_ssi") + sw_share("social_security_ssi")
    money = con + gr + ss
    for f, v in zip(counties.fips, money):
        series.setdefault(f, []).append(int(round(v / 1000)))
    us["ss"].append(float(ss.sum())); us["gr"].append(float(gr.sum())); us["con"].append(float(con.sum()))
    print(f"FY{fy}: money in ${money.sum() / 1e12:.2f}T (SS ${ss.sum() / 1e12:.2f}T, grants ${gr.sum() / 1e12:.2f}T, contracts ${con.sum() / 1e12:.2f}T)")

out = ROOT / "design" / "rebuild3" / "years.js"
out.write_text("window.YEARS = " + json.dumps({"years": YEARS, "us": us, "c": series}, separators=(",", ":")) + ";\n")
print(f"Wrote {out} ({out.stat().st_size / 1e3:.0f} KB)")
