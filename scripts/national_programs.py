"""Find federal contracts that pay for nationwide programs but are booked to one county.

These contractors administer health benefits for veterans and military families across the whole
country, yet USAspending records each contract's place of performance as the contractor's office
county. Counting them there would make, say, Spotsylvania County, VA look like it received $24B.
build_phase0.py moves these amounts out of the county's contracts into a separate
"national programs booked here" figure, which is shown but not counted.

Writes data/reference/national_programs_fy{FY}.csv (fips, program, recipient, amount).
Usage: python national_programs.py
"""
import csv
import json
import urllib.request

from config import FISCAL_YEAR, REFERENCE

PROGRAMS = [
    # (program, recipient search text as USAspending names it)
    ("VA Community Care Network", "OPTUM PUBLIC SECTOR SOLUTIONS"),
    ("VA Community Care Network", "TRIWEST HEALTHCARE ALLIANCE"),
    ("TRICARE (military health) East", "HUMANA GOVERNMENT"),
    ("TRICARE (military health) West", "HEALTH NET FEDERAL SERVICES"),
]
URL = "https://api.usaspending.gov/api/v2/search/spending_by_geography/"


def query(recipient):
    body = {"scope": "place_of_performance", "geo_layer": "county",
            "filters": {"time_period": [{"start_date": f"{FISCAL_YEAR - 1}-10-01", "end_date": f"{FISCAL_YEAR}-09-30"}],
                        "award_type_codes": ["A", "B", "C", "D"], "recipient_search_text": [recipient]}}
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)["results"]


rows = []
for program, recipient in PROGRAMS:
    for r in query(recipient):
        amt = r.get("aggregated_amount") or 0
        if abs(amt) >= 1e6:  # ignore small local pieces of these contractors' work
            rows.append([r["shape_code"], program, recipient, round(amt, 2)])
            print(f"{program:32} {recipient:32} {r['shape_code']} {r['display_name']:24} ${amt / 1e9:,.2f}B")
out = REFERENCE / f"national_programs_fy{FISCAL_YEAR}.csv"
with open(out, "w", newline="") as f:
    csv.writer(f).writerows([["fips", "program", "recipient", "amount"], *rows])
print(f"Wrote {out} ({len(rows)} rows, ${sum(r[3] for r in rows) / 1e9:,.1f}B)")
