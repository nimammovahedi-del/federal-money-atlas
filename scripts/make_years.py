"""Build design/rebuild3/years.js: money that reached each county, fiscal years 2019-2023.

Uses the same rules as build_phase0.py for every year: place of performance, old county codes
mapped to today's, statewide grants shared by need (Medicaid coverage, children, poverty, SNAP; 2023
measures), statewide Social Security by population (2023), and nationwide health-benefit contracts
taken out (data/reference/national_programs_fy{year}.csv; run national_programs.py --fy=YEAR first). Taxes are only available for 2023,
so this file covers money in, not dollars back per $1.

Usage: python make_years.py   (needs data/interim/usaspending_fy{year}_by_county.csv for each year)
"""
import json

import pandas as pd

from build_phase0 import load_counties, national_programs, pivot_county, remap_counties, statewide, statewide_grants_by_need
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
    con = get(pc, "contracts") - counties.fips.map(national_programs(fy)).fillna(0.0)
    gr = get(pc, "grants") + statewide_grants_by_need(counties, sw, fy)[0]
    ss = get(pc, "social_security_ssi") + sw_share("social_security_ssi")
    money = con + gr + ss
    for f, v in zip(counties.fips, money):
        series.setdefault(f, []).append(int(round(v / 1000)))
    us["ss"].append(float(ss.sum())); us["gr"].append(float(gr.sum())); us["con"].append(float(con.sum()))
    print(f"FY{fy}: money in ${money.sum() / 1e12:.2f}T (SS ${ss.sum() / 1e12:.2f}T, grants ${gr.sum() / 1e12:.2f}T, contracts ${con.sum() / 1e12:.2f}T)")

out = ROOT / "design" / "rebuild3" / "years.js"
out.write_text("window.YEARS = " + json.dumps({"years": YEARS, "us": us, "c": series}, separators=(",", ":")) + ";\n")
print(f"Wrote {out} ({out.stat().st_size / 1e3:.0f} KB)")
