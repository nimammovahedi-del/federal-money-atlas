"""Build design/prototype.html: the combined Atlas + Ledger + Statement + Explorer prototype.

Packs every county's Phase 0 numbers into the page so the prototype works for any county.
Usage: python make_prototype.py [template name] [output name]
       python make_prototype.py --js   (writes design/rebuild/data.js)
  default: prototype_template.html -> prototype.html
"""
import json
import sys

import pandas as pd

from config import FISCAL_YEAR, OUTPUT, ROOT

df = pd.read_csv(OUTPUT / f"phase0_counties_fy{FISCAL_YEAR}.csv", dtype={"FIPS": str})
M, T, R = "MONEY IN (counted) $", "TAXES PAID (est.) $", "DOLLARS BACK per $1"


def k(v):
    """Dollars -> whole thousands (keeps the page small)."""
    return None if pd.isna(v) else int(round(v / 1000))


FIELDS = ["ratio", "pop", "name", "st", "contracts", "grants_county", "grants_statewide", "ss",
          "tax_income", "tax_payroll", "tax_other", "other_direct", "medicare_est", "loans_face", "flags"]
rows = {}
for _, r in df.iterrows():
    rows[r.FIPS] = [
        None if pd.isna(r[R]) else round(float(r[R]), 4), int(r["Population (2023)"]), r.County, r.State,
        k(r["Contracts $"]), k(r["Grants: tagged to county $"]),
        k(r["Grants: statewide, shared by population (est.) $"]),
        k(r["Social Security & SSI $"] + r["Social Security & SSI: statewide share $"]),
        k(r["Income tax $"]), k(r["Payroll taxes (SS, Medicare, UI) $"]),
        k((r["Corporate tax (est.) $"] or 0) + (r["Estate & excise taxes (est.) $"] or 0)),
        k(r["Not counted: other direct payments (VA, farm, Pell, housing) $"]),
        k(r["Not counted: Medicare Parts A&B (est.) $"]), k(r["Loans: face value $"]),
        "" if pd.isna(r["Flags for review"]) else r["Flags for review"],
    ]

data = {
    "fields": FIELDS,
    "counties": rows,
    "us_ratio": float(df[M].sum() / df[T].sum()),
    "median_ratio": float(df[R].median()),
    "data_as_of": "Oct 6, 2026",
    "fiscal_year": FISCAL_YEAR,
}
if len(sys.argv) > 1 and sys.argv[1] == "--js":
    # Data only, as a script file the rebuilt prototypes share: design/rebuild/data.js
    out = ROOT / "design" / "rebuild" / "data.js"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("window.DATA = " + json.dumps(data, separators=(",", ":")) + ";\n")
    print(f"Wrote {out} ({out.stat().st_size / 1e3:.0f} KB)")
    sys.exit(0)
TEMPLATE = sys.argv[1] if len(sys.argv) > 1 else "prototype_template.html"
OUT = sys.argv[2] if len(sys.argv) > 2 else "prototype.html"
html = (ROOT / "design" / TEMPLATE).read_text().replace("__DATA__", json.dumps(data, separators=(",", ":")))
out = ROOT / "design" / OUT
out.write_text(html)
print(f"Wrote {out} ({len(html) / 1e3:.0f} KB, {len(rows):,} counties)")
