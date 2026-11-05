"""Turn USAspending's fiscal-year bulk files into county totals.

What it does, step by step:
  1. Downloads the two FY2023 bulk files (contracts, and grants/loans/direct
     payments) if they aren't on disk yet (~3.3 GB in all).
  2. Reads every transaction, keeping only the few columns we need.
  3. Adds up money by county and category, twice: once by where the work
     happens ("place of performance") and once by where the recipient is based.
     Money with no county goes into a "statewide / no county" bucket for its state.
  4. Writes data/interim/usaspending_fy2023_by_county.csv.
  5. Deletes the bulk files unless you pass --keep.

Money is "obligations": what agencies committed during the year. For loans,
the obligation is the government's expected cost (subsidy), so we also keep
the loan's face value separately.
"""
import sys
import time
import subprocess
import zipfile
import pandas as pd

from config import FISCAL_YEAR as _DEFAULT_FY, INTERIM, RAW, USASPENDING_ARCHIVE, USASPENDING_FILES as _FILES, ABBR_TO_FIPS

# Optional --fy=2019 picks another fiscal year (same archive file naming, e.g. FY2019_All_Contracts_Full_20261006.zip).
FISCAL_YEAR = next((int(a.split("=")[1]) for a in sys.argv if a.startswith("--fy=")), _DEFAULT_FY)
USASPENDING_FILES = {k: v.replace(f"FY{_DEFAULT_FY}_", f"FY{FISCAL_YEAR}_") for k, v in _FILES.items()}

CHUNK = 250_000

# Each wanted field, with the column names it has had in different file versions.
CANDIDATES = {
    "obligation": ["federal_action_obligation"],
    "face_value": ["face_value_of_loan"],
    "subsidy": ["original_loan_subsidy_cost"],
    "agency": ["awarding_agency_name"],
    "award_type": ["award_type_code"],
    "assistance_type": ["assistance_type_code"],
    "program": ["assistance_listing_number", "cfda_number"],
    "pop_country": ["primary_place_of_performance_country_code"],
    "pop_state": ["primary_place_of_performance_state_code"],
    "pop_state_name": ["primary_place_of_performance_state_name"],
    "pop_county": ["prime_award_transaction_place_of_performance_county_fips_code",
                   "primary_place_of_performance_county_fips_code"],
    "pop_scope": ["primary_place_of_performance_scope"],
    "rcp_country": ["recipient_country_code"],
    "rcp_state": ["recipient_state_code"],
    "rcp_county": ["prime_award_transaction_recipient_county_fips_code",
                   "recipient_county_fips_code"],
    "business_types": ["business_types_code"],
    "record_type": ["record_type_code"],
}
NUMERIC = {"obligation", "face_value", "subsidy"}
FIPS_TO_ABBR = {v: k for k, v in ABBR_TO_FIPS.items()}
# The assistance file gives the place-of-performance state only as a name.
STATE_NAMES = {
    "ALABAMA": "AL", "ALASKA": "AK", "ARIZONA": "AZ", "ARKANSAS": "AR", "CALIFORNIA": "CA",
    "COLORADO": "CO", "CONNECTICUT": "CT", "DELAWARE": "DE", "DISTRICT OF COLUMBIA": "DC",
    "FLORIDA": "FL", "GEORGIA": "GA", "HAWAII": "HI", "IDAHO": "ID", "ILLINOIS": "IL",
    "INDIANA": "IN", "IOWA": "IA", "KANSAS": "KS", "KENTUCKY": "KY", "LOUISIANA": "LA",
    "MAINE": "ME", "MARYLAND": "MD", "MASSACHUSETTS": "MA", "MICHIGAN": "MI", "MINNESOTA": "MN",
    "MISSISSIPPI": "MS", "MISSOURI": "MO", "MONTANA": "MT", "NEBRASKA": "NE", "NEVADA": "NV",
    "NEW HAMPSHIRE": "NH", "NEW JERSEY": "NJ", "NEW MEXICO": "NM", "NEW YORK": "NY",
    "NORTH CAROLINA": "NC", "NORTH DAKOTA": "ND", "OHIO": "OH", "OKLAHOMA": "OK", "OREGON": "OR",
    "PENNSYLVANIA": "PA", "RHODE ISLAND": "RI", "SOUTH CAROLINA": "SC", "SOUTH DAKOTA": "SD",
    "TENNESSEE": "TN", "TEXAS": "TX", "UTAH": "UT", "VERMONT": "VT", "VIRGINIA": "VA",
    "WASHINGTON": "WA", "WEST VIRGINIA": "WV", "WISCONSIN": "WI", "WYOMING": "WY",
    "PUERTO RICO": "PR", "GUAM": "GU", "U.S. VIRGIN ISLANDS": "VI", "VIRGIN ISLANDS": "VI",
    "AMERICAN SAMOA": "AS", "NORTHERN MARIANA ISLANDS": "MP",
}
NO_COUNTY = []
KEYS = ["scope", "state", "county", "category", "medicaid", "state_gov"]


def download(name, attempts=40):
    """Download one archive file, resuming after any failure until it is complete.

    curl's own --retry can start over from zero, so each attempt is a fresh curl call that
    resumes (-C -) from the bytes already on disk, and gives up on a stalled connection
    (under 20 KB/s for 60 s) so the next attempt can reconnect.
    """
    path = RAW / "usaspending" / name
    path.parent.mkdir(parents=True, exist_ok=True)
    url = USASPENDING_ARCHIVE + name
    head = subprocess.run(["curl", "-sSIL", url], capture_output=True, text=True).stdout
    sizes = [int(l.split(":")[1]) for l in head.splitlines() if l.lower().startswith("content-length:")]
    total = sizes[-1] if sizes else None
    for i in range(attempts):
        have = path.stat().st_size if path.exists() else 0
        if total and have >= total:
            break
        print(f"  {name}: {have / 1e6:,.0f} of {total / 1e6 if total else 0:,.0f} MB (attempt {i + 1})", flush=True)
        subprocess.run(["curl", "-sS", "--fail", "-C", "-", "--speed-limit", "20000", "--speed-time", "60",
                        "-A", "federal-money-map Phase 1", "-o", str(path), url])
        time.sleep(5)
    zipfile.ZipFile(path).close()  # raises if the file is still incomplete
    return path


def pick_columns(header):
    found = {}
    for field, names in CANDIDATES.items():
        for n in names:
            if n in header:
                found[field] = n
                break
    return found


def clean_county(county, state_abbr):
    """Return a 5-digit county code, or '' if missing/unusable."""
    c = county.fillna("").astype(str).str.replace(r"\.0$", "", regex=True).str.strip()
    st = state_abbr.map(ABBR_TO_FIPS).fillna("")
    five = c.str.len() == 5
    three = (c.str.len().between(1, 3)) & (st != "")
    out = pd.Series("", index=c.index)
    out[five] = c[five]
    out[three] = st[three] + c[three].str.zfill(3)
    return out


def categorize(df, kind):
    if kind == "contracts":
        return pd.Series("contracts", index=df.index)
    t = df["assistance_type"].fillna("").astype(str).str.zfill(2)
    agency = df.get("agency", pd.Series("", index=df.index)).fillna("")
    cat = pd.Series("other_assistance", index=df.index)
    cat[t.isin(["02", "03", "04", "05"])] = "grants"
    direct = t.isin(["06", "10"])
    cat[direct] = "other_direct_payments"
    cat[direct & (agency == "Social Security Administration")] = "social_security_ssi"
    cat[t.isin(["07", "08"])] = "loans"
    cat[t == "09"] = "insurance"
    # Medicare (hospital insurance 93.773, medical insurance 93.774, drug coverage 93.770)
    # gets its own bucket: USAspending books much of it at insurers' headquarters.
    prog = df.get("program", pd.Series("", index=df.index)).fillna("").astype(str)
    cat[prog.str[:6].isin(["93.770", "93.773", "93.774"])] = "medicare"
    return cat


def process(kind, path, totals, log):
    z = zipfile.ZipFile(path)
    members = sorted(n for n in z.namelist() if n.endswith(".csv"))
    log.append(f"{kind}: {len(members)} CSV files in {path.name}")
    rows = 0
    t0 = time.time()
    for m in members:
        with z.open(m) as fh:
            header = pd.read_csv(fh, nrows=0).columns.tolist()
        cols = pick_columns(header)
        missing = [f for f in ("obligation", "pop_county") if f not in cols]
        if missing:
            raise SystemExit(f"{m}: can't find columns for {missing}. Header starts: {header[:40]}")
        if m == members[0]:
            log.append(f"  columns used: {cols}")
        with z.open(m) as fh:
            reader = pd.read_csv(fh, usecols=list(cols.values()), dtype=str,
                                 chunksize=CHUNK, low_memory=False)
            for chunk in reader:
                df = chunk.rename(columns={v: k for k, v in cols.items()})
                for f in NUMERIC:
                    df[f] = pd.to_numeric(df[f], errors="coerce").fillna(0.0) if f in df else 0.0
                df["category"] = categorize(df, kind)
                prog = df.get("program", pd.Series("", index=df.index)).fillna("").astype(str)
                df["is_medicaid"] = prog.str.startswith("93.778")
                bt = df.get("business_types", pd.Series("", index=df.index)).fillna("").astype(str)
                df["to_state_gov"] = bt.str.contains("A", regex=False) & (df["category"] == "grants")

                for scope, ctry, st, cty in (("pop", "pop_country", "pop_state", "pop_county"),
                                             ("recipient", "rcp_country", "rcp_state", "rcp_county")):
                    if cty not in df:
                        continue
                    state = df.get(st, pd.Series("", index=df.index)).fillna("").astype(str).str.strip()
                    if scope == "pop" and "pop_state_name" in df:
                        by_name = (df["pop_state_name"].fillna("").astype(str).str.strip().str.upper()
                                   .map(STATE_NAMES).fillna(""))
                        state = state.where(state != "", by_name)
                    country = df.get(ctry, pd.Series("USA", index=df.index)).fillna("USA").astype(str)
                    county = clean_county(df[cty], state)
                    # Fill a missing state from the county code.
                    fips_state = county.str[:2]
                    state = state.where(state != "", fips_state.map(FIPS_TO_ABBR).fillna(""))
                    state = state.where(country.isin(["USA", "UNITED STATES", ""]), "FOREIGN")
                    g = pd.DataFrame({
                        "scope": scope, "state": state.replace("", "UNKNOWN"), "county": county,
                        "category": df["category"],
                        "medicaid": df["is_medicaid"], "state_gov": df["to_state_gov"],
                        "obligation": df["obligation"], "face_value": df["face_value"],
                        "subsidy": df["subsidy"], "n": 1,
                    }).groupby(KEYS, as_index=False).sum()
                    totals.append(g)
                    if scope == "pop" and kind == "assistance":
                        # Which programs have no county? (for explaining "statewide" money)
                        nc = county == ""
                        NO_COUNTY.append(pd.DataFrame({
                            "state": state[nc].replace("", "UNKNOWN"), "category": df["category"][nc],
                            "program": prog[nc],
                            "scope_label": df.get("pop_scope", pd.Series("", index=df.index))[nc].fillna(""),
                            "obligation": df["obligation"][nc],
                        }).groupby(["state", "category", "program", "scope_label"], as_index=False).sum())
                        if len(NO_COUNTY) > 40:
                            NO_COUNTY[:] = [pd.concat(NO_COUNTY).groupby(
                                ["state", "category", "program", "scope_label"], as_index=False).sum()]
                # Keep memory small: combine the partial sums every so often.
                if len(totals) > 40:
                    totals[:] = [pd.concat(totals).groupby(KEYS, as_index=False).sum()]
                rows += len(df)
                rate = rows / max(time.time() - t0, 1)
                print(f"\r  {kind}: {rows:,} transactions ({rate:,.0f}/s)", end="", flush=True)
    print()
    log.append(f"  {rows:,} transactions read")


def main():
    """Usage: aggregate_usaspending.py [contracts|assistance ...] [--keep]

    Each kind is saved to its own file, so the two can run at different times.
    The combined file is rebuilt from whichever kinds are done.
    """
    keep = "--keep" in sys.argv
    kinds = [a for a in sys.argv[1:] if a in USASPENDING_FILES] or list(USASPENDING_FILES)
    INTERIM.mkdir(parents=True, exist_ok=True)
    for kind in kinds:
        totals, log = [], []
        path = download(USASPENDING_FILES[kind])
        process(kind, path, totals, log)
        out = (pd.concat(totals).groupby(KEYS, as_index=False).sum()
               .rename(columns={"face_value": "loan_face_value", "subsidy": "loan_subsidy",
                                "n": "transactions"}))
        out.to_csv(INTERIM / f"usaspending_fy{FISCAL_YEAR}_{kind}.csv", index=False)
        (INTERIM / f"usaspending_fy{FISCAL_YEAR}_{kind}_log.txt").write_text("\n".join(log) + "\n")
        if NO_COUNTY:
            (pd.concat(NO_COUNTY).groupby(["state", "category", "program", "scope_label"], as_index=False)
             .sum().sort_values("obligation", ascending=False)
             .to_csv(INTERIM / f"usaspending_fy{FISCAL_YEAR}_no_county_programs.csv", index=False))
        print(f"Saved {kind} ({len(out):,} rows)")
        if not keep:
            path.unlink()
            print(f"  deleted {path.name}")
    parts = [INTERIM / f"usaspending_fy{FISCAL_YEAR}_{k}.csv" for k in USASPENDING_FILES]
    done = [p for p in parts if p.exists()]
    combined = pd.concat([pd.read_csv(p, dtype={"county": str, "state": str}, keep_default_na=False)
                          for p in done])
    out_path = INTERIM / f"usaspending_fy{FISCAL_YEAR}_by_county.csv"
    combined.to_csv(out_path, index=False)
    print(f"Wrote {out_path} from {[p.stem.split('_')[-1] for p in done]}")
    if len(done) < len(parts):
        print("  (not all kinds done yet)")


if __name__ == "__main__":
    main()
