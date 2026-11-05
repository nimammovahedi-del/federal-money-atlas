"""Fill design/template.html with real Phase 0 numbers -> design/directions.html.

Usage: python make_design_preview.py [FIPS of the sample county]
"""
import json
import sys

import pandas as pd

from config import FISCAL_YEAR, OUTPUT, ROOT

SAMPLE = sys.argv[1] if len(sys.argv) > 1 else "39049"  # Franklin County, Ohio (Columbus)
CARD_FIPS = [SAMPLE, "13053", "06081"]  # plus Chattahoochee GA and San Mateo CA, for contrast

df = pd.read_csv(OUTPUT / f"phase0_counties_fy{FISCAL_YEAR}.csv", dtype={"FIPS": str})
M, T, R = "MONEY IN (counted) $", "TAXES PAID (est.) $", "DOLLARS BACK per $1"
us_ratio = df[M].sum() / df[T].sum()

# Every county: [dollars back, population, name, state]
counties = {r.FIPS: [round(r[R], 3) if pd.notna(r[R]) else None, int(r["Population (2023)"]),
                     r.County, r.State] for _, r in df.iterrows()}

st = df.groupby("State")[[M, T, "Population (2023)"]].sum()
states = sorted(([s, round(v[M] / v[T], 3), int(v["Population (2023)"])] for s, v in st.iterrows()),
                key=lambda x: -x[1])


def detail(fips):
    r = df[df.FIPS == fips].iloc[0]
    ss = r["Social Security & SSI $"] + r["Social Security & SSI: statewide share $"]
    grants = r["Grants: tagged to county $"] + r["Grants: statewide, shared by need (est.) $"]
    return {
        "fips": fips, "county": r.County, "state": r.State, "population": int(r["Population (2023)"]),
        "contracts": r["Contracts $"], "grants_county": r["Grants: tagged to county $"],
        "grants_statewide": r["Grants: statewide, shared by need (est.) $"], "grants": grants,
        "ss_ssi": ss, "money_in": r[M], "money_in_pp": r["Money in per person $"],
        "tax_income": r["Income tax $"], "tax_payroll": r["Payroll taxes (SS, Medicare, UI) $"],
        "tax_other": r["Corporate tax (est.) $"] + r["Estate & excise taxes (est.) $"],
        "taxes_total": r[T], "taxes_pp": r["Taxes per person $"], "ratio": r[R],
        "rank": int(r["Rank (1 = most back)"]),
        "loans_face": r["Loans: face value $"], "other_direct": r[
            "Not counted: other direct payments (VA, farm, Pell, housing) $"],
        "medicare_est": None if pd.isna(r["Not counted: Medicare Parts A&B (est.) $"])
        else r["Not counted: Medicare Parts A&B (est.) $"],
    }


data = {
    "us_ratio": us_ratio,
    "median_ratio": float(df[R].median()),
    "n": len(df),
    "counties": counties,
    "states": states,
    "sample": detail(SAMPLE),
    "cards": [detail(f) for f in CARD_FIPS],
}
html = (ROOT / "design" / "template.html").read_text().replace("__DATA__", json.dumps(data))
out = ROOT / "design" / "directions.html"
out.write_text(html)
print(f"Wrote {out} (sample: {data['sample']['county']}, {data['sample']['state']}; "
      f"{len(html) / 1e3:.0f} KB)")
