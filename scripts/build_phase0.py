"""Phase 0: county totals, per-person amounts and the dollars-back ratio.

Reads the files fetched by fetch_sources.py and the county totals made by
aggregate_usaspending.py, then writes:
  output/phase0_counties_fy2023.xlsx  (the review spreadsheet)
  output/phase0_counties_fy2023.csv   (same county table, plain CSV)

Plain-language summary of the method (also written into the spreadsheet):
  Money in (counted)  = contracts + grants + Social Security & SSI, by where
                        the work or payment happens (place of performance),
                        federal fiscal year 2023.
                        Grants with no county (mostly statewide programs such
                        as Medicaid) are shared among the state's counties by
                        population, and marked as an estimate.
  Taxes paid (est.)   = all federal taxes that can be tied to residents
                        (97% of FY2023 receipts): income tax and payroll taxes
                        from IRS county data, plus corporate, estate and excise
                        taxes spread by proxies. Controlled to Treasury totals.
  Dollars back per $1 = money in / taxes paid.
"""
import csv
import io
import json
import zipfile

import numpy as np
import pandas as pd

from config import (ABBR_TO_FIPS, CT_OLD_COUNTIES, FISCAL_YEAR, INTERIM, LEGACY_FIPS,
                    OUTPUT, POP_YEAR, RAW, REFERENCE, SOURCES, SS_TAXABLE_SHARE,
                    SS_WAGE_CAP_2023, STATE_FIPS, TAX_YEAR)

FIPS_TO_ABBR = STATE_FIPS
src = {k: v[1] for k, v in SOURCES.items()}


# ---------------------------------------------------------------- counties
def load_counties():
    df = pd.read_csv(src["census_pop"], dtype=str, encoding="latin-1")
    states = df[df.SUMLEV == "040"].copy()
    df = df[(df.SUMLEV == "050") & df.STATE.isin(STATE_FIPS)].copy()
    df["fips"] = df.STATE + df.COUNTY
    df["state"] = df.STATE.map(FIPS_TO_ABBR)
    df["population"] = df[f"POPESTIMATE{POP_YEAR}"].astype(int)
    states["state"] = states.STATE.map(FIPS_TO_ABBR)
    states["population"] = states[f"POPESTIMATE{POP_YEAR}"].astype(int)
    return (df[["fips", "state", "CTYNAME", "population"]].rename(columns={"CTYNAME": "county"}),
            states.dropna(subset=["state"])[["state", "STNAME", "population"]])


# ---------------------------------------------------------------- treasury
def treasury_receipts():
    data = json.load(open(src["treasury_receipts"]))["data"]
    by_line = {r["line_code_nbr"]: float(r["current_fytd_net_rcpt_amt"])
               for r in data if r["current_fytd_net_rcpt_amt"] not in (None, "null")}
    return {
        "individual_income": by_line["120"],
        "social_insurance": by_line["286"],
        "corporate": by_line["130"],
        "excise": by_line["314"],
        "estate_gift": by_line["350"],
        "customs": by_line["405"],
        "miscellaneous": by_line["820"],
        "total": by_line["830"],
    }


def treasury_ss_benefits():
    data = json.load(open(src["treasury_outlays"]))["data"]
    want = {"4515": "SSI", "4525": "Retirement & survivors benefits", "4560": "Disability benefits"}
    return {name: float(r["current_fytd_net_outly_amt"]) for r in data
            for code, name in want.items() if r["line_code_nbr"] == code}


# ---------------------------------------------------------------- IRS
def load_irs():
    cols = ["STATEFIPS", "COUNTYFIPS", "N1", "A00200", "A06500", "A85300", "A85530", "A09400",
            "A00300", "A00600", "A01000", "A59660", "A11070", "A10960"]
    d = pd.read_csv(src["irs_county_noagi"], dtype=str, encoding="latin-1", usecols=cols)
    d["fips"] = d.STATEFIPS.str.zfill(2) + d.COUNTYFIPS.str.zfill(3)
    for c in cols[2:]:
        d[c] = d[c].astype(float) * (1 if c.startswith("N") else 1000)  # amounts are in $1,000s
    state_rows = d[d.COUNTYFIPS == "000"].copy()
    county = d[d.COUNTYFIPS != "000"].copy()

    a = pd.read_csv(src["irs_county_agi"], dtype=str, encoding="latin-1",
                    usecols=["STATEFIPS", "COUNTYFIPS", "agi_stub", "N00200", "A00200"])
    a = a[(a.agi_stub == "8") & (a.COUNTYFIPS != "000")]
    a["fips"] = a.STATEFIPS.str.zfill(2) + a.COUNTYFIPS.str.zfill(3)
    a["top_wages"] = a.A00200.astype(float) * 1000
    a["top_wage_returns"] = a.N00200.astype(float)
    county = county.merge(a[["fips", "top_wages", "top_wage_returns"]], on="fips", how="left")
    county[["top_wages", "top_wage_returns"]] = county[["top_wages", "top_wage_returns"]].fillna(0)
    return county, state_rows


def ss_taxable_wages(irs):
    """Wages under the Social Security cap, by county.

    Wages on returns under $200k AGI are treated as fully under the cap. For
    returns over $200k we cap the average wage per return at C, choosing C so
    that the national share of wages under the cap matches SS_TAXABLE_SHARE.
    """
    total = irs.A00200.sum()
    below = irs.A00200 - irs.top_wages
    target = SS_TAXABLE_SHARE * total
    lo, hi = SS_WAGE_CAP_2023 * 0.5, SS_WAGE_CAP_2023 * 4
    for _ in range(60):
        c = (lo + hi) / 2
        est = (below + np.minimum(irs.top_wages, irs.top_wage_returns * c)).sum()
        lo, hi = (c, hi) if est < target else (lo, c)
    return below + np.minimum(irs.top_wages, irs.top_wage_returns * c), c


def allocate_taxes(irs, counties, rec):
    t = irs[["fips"]].copy()
    t["irs_income_tax"] = irs.A06500 + irs.A85300
    taxable, cap_c = ss_taxable_wages(irs)
    t["payroll_base"] = 0.124 * taxable + 0.029 * irs.A00200 + irs.A09400 + irs.A85530
    capital = irs.A00300 + irs.A00600 + irs.A01000.clip(lower=0)
    t = t.merge(counties[["fips", "population"]], on="fips", how="left")
    share = lambda s: s / s.sum()
    t["tax_income"] = rec["individual_income"] * share(t.irs_income_tax)
    t["tax_payroll"] = rec["social_insurance"] * share(t.payroll_base)
    t["tax_corporate"] = rec["corporate"] * (0.75 * share(capital) + 0.25 * share(irs.A00200))
    t["tax_estate_excise"] = (rec["estate_gift"] * share(capital)
                              + rec["excise"] * share(t.population.fillna(0)))
    t["taxes_total"] = t[["tax_income", "tax_payroll", "tax_corporate", "tax_estate_excise"]].sum(axis=1)
    t["refundable_credits"] = irs.A59660 + irs.A11070 + irs.A10960
    t["irs_wages"] = irs.A00200
    return t, cap_c


# ---------------------------------------------------------------- spending
def ct_weights():
    """Share of each old CT county's population living in each planning region."""
    rows = list(csv.reader(open(src["census_ct_crosswalk"], encoding="utf-8-sig"), delimiter="|"))
    town_old_new = {r[5]: (r[1], r[3]) for r in rows[1:] if len(r) > 5}
    towns = pd.read_csv(src["census_ct_towns"], dtype=str, encoding="latin-1")
    towns = towns[towns.SUMLEV == "061"]
    pop = dict(zip(towns.COUSUB, towns[f"POPESTIMATE{POP_YEAR}"].astype(int)))
    w = {}
    for town, (old, new) in town_old_new.items():
        w.setdefault("09" + old, {}).setdefault("09" + new, 0)
        w["09" + old]["09" + new] += pop.get(town, 0)
    return {old: {new: p / sum(d.values()) for new, p in d.items()} for old, d in w.items()}


def remap_counties(sp, counties):
    """Move spending on old county codes to today's codes. Returns (data, notes)."""
    valid = set(counties.fips)
    pop = dict(zip(counties.fips, counties.population))
    split = {old: {n: pop[n] / sum(pop[x] for x in new) for n in new}
             for old, new in LEGACY_FIPS.items()}
    split.update(ct_weights())
    notes, out = {}, []
    for old, targets in split.items():
        part = sp[sp.county == old]
        if part.empty:
            continue
        for new, w in targets.items():
            p = part.copy()
            p["county"] = new
            p[["obligation", "loan_face_value", "loan_subsidy"]] *= w
            out.append(p)
            notes.setdefault(new, set()).add(
                "includes spending recorded under old CT county codes, split by town population"
                if old.startswith("09") else f"includes spending recorded under old code {old}")
    sp = pd.concat([sp[~sp.county.isin(split)], *out])
    bad = sp[(sp.county != "") & ~sp.county.isin(valid)]
    sp.loc[bad.index, "county"] = ""  # unknown codes join the state's no-county bucket
    return sp, notes, bad


def load_spending(counties):
    sp = pd.read_csv(INTERIM / f"usaspending_fy{FISCAL_YEAR}_by_county.csv",
                     dtype={"county": str, "state": str}, keep_default_na=False)
    for c in ["obligation", "loan_face_value", "loan_subsidy"]:
        sp[c] = sp[c].astype(float)
    sp["medicaid"] = sp.medicaid.astype(str) == "True"
    sp["state_gov"] = sp.state_gov.astype(str) == "True"
    sp, notes, bad = remap_counties(sp, counties)
    return sp, notes, bad


def pivot_county(sp, scope):
    s = sp[(sp.scope == scope) & (sp.county != "")]
    p = s.pivot_table(index="county", columns="category", values="obligation", aggfunc="sum").fillna(0)
    loans = s[s.category == "loans"].groupby("county")[["loan_face_value", "loan_subsidy"]].sum()
    return p.join(loans, how="left").fillna(0)


def statewide(sp, scope="pop"):
    """Money with a state but no county, by state and category."""
    s = sp[(sp.scope == scope) & (sp.county == "") & sp.state.isin(ABBR_TO_FIPS)]
    return s.pivot_table(index="state", columns="category", values="obligation",
                         aggfunc="sum").fillna(0)


# ---------------------------------------------------------------- statewide grants by need (Phase 1)
# Statewide grants (mostly Medicaid) have no county in USAspending. Instead of sharing them by population,
# each program is shared by the people it serves, measured by the Census Bureau for every county.
PROGRAM_NEED = {
    "medicaid": ["93.778", "93.767"],                                   # Medicaid, CHIP -> people with Medicaid coverage
    "children": ["10.555", "10.553", "10.558", "10.559", "84.010", "84.027", "84.173", "93.658", "93.659", "93.563", "93.600"],  # school meals, Title I, special ed, foster care, adoption, child support, Head Start -> children
    "poverty": ["93.558", "93.575", "93.596", "93.568", "93.569", "93.667"],  # TANF, child care, LIHEAP, CSBG, SSBG -> people in poverty
    "food": ["10.557", "10.561", "10.568", "10.569"],                  # WIC, SNAP administration, TEFAP -> households receiving SNAP
}
NEED_LABEL = {"medicaid": "people with Medicaid coverage", "children": "children under 18", "poverty": "people in poverty",
              "food": "households receiving SNAP", "population": "population"}


def need_measures(counties):
    """Per-county counts used to share statewide grants: Medicaid coverage, SNAP households, children, poverty."""
    def acs(path, cols):
        d = pd.read_csv(path, sep="|", dtype=str, usecols=["GEO_ID", *cols])
        d = d[d.GEO_ID.str.startswith("0500000US")]
        d["fips"] = d.GEO_ID.str[-5:]
        return d.set_index("fips")[cols].astype(float).sum(axis=1)
    med = acs(src["acs_medicaid"], [f"C27007_E{n:03d}" for n in (4, 7, 10, 14, 17, 20)])
    snap = acs(src["acs_snap"], ["B22001_E002"])
    kids = acs(src["acs_children"], ["B09001_E001"])
    pov = {}
    for line in open(src["saipe_poverty"], encoding="latin-1"):
        f = line.split()
        if len(f) > 3 and f[1] != "0" and f[2].isdigit():
            pov[f[0].zfill(2) + f[1].zfill(3)] = float(f[2])
    m = counties[["fips", "state", "population"]].copy()
    m["medicaid"], m["food"], m["children"], m["poverty"] = (m.fips.map(med), m.fips.map(snap), m.fips.map(kids), m.fips.map(pov))
    for k in ("medicaid", "food", "children", "poverty"):   # rare gaps: fall back to population share of the state average
        rate = m[k].sum() / m.population.sum()
        m[k] = m[k].fillna(m.population * rate)
    return m


def statewide_grants_by_need(counties, sw, fy=FISCAL_YEAR):
    """Share each state's no-county grants among its counties, program by program."""
    m = need_measures(counties)
    progs = pd.read_csv(INTERIM / f"usaspending_fy{fy}_no_county_programs.csv", dtype=str, keep_default_na=False)
    progs["obligation"] = progs.obligation.astype(float)
    progs = progs[(progs.category == "grants") & progs.state.isin(ABBR_TO_FIPS)]
    code_to_group = {code: g for g, codes in PROGRAM_NEED.items() for code in codes}
    progs["group"] = progs.program.str[:6].map(code_to_group).fillna("population")
    by = progs.groupby(["state", "group"]).obligation.sum().unstack(fill_value=0)
    # Match each state's total to the statewide grant total used elsewhere; any difference goes by population.
    total = by.sum(axis=1)
    target = pd.Series({st: (sw.loc[st, "grants"] if st in sw.index and "grants" in sw else 0) for st in m.state.unique()})
    by = by.reindex(target.index, fill_value=0)
    by["population"] = by.get("population", 0) + (target - total.reindex(target.index, fill_value=0))
    out = pd.Series(0.0, index=m.index)
    for g in by.columns:
        measure = m[g] if g in m else m.population
        share = measure / measure.groupby(m.state).transform("sum")
        out += m.state.map(by[g]).fillna(0) * share
    mix = (by.div(by.sum(axis=1), axis=0)).fillna(0)
    return out.values, mix


def national_programs(fy=FISCAL_YEAR):
    path = REFERENCE / f"national_programs_fy{fy}.csv"
    if not path.exists():
        return {}
    d = pd.read_csv(path, dtype={"fips": str})
    return d.groupby("fips").amount.sum().to_dict()


# ---------------------------------------------------------------- medicare
def medicare_estimate():
    d = pd.DataFrame(json.load(open(src["cms_medicare_county"])))
    d = d[d.BENE_GEO_CD.str.len() == 5]
    pc = pd.to_numeric(d.TOT_MDCR_PYMT_PC, errors="coerce")
    benes = pd.to_numeric(d.BENES_TOTAL_CNT, errors="coerce")
    return pd.Series((pc * benes).values, index=d.BENE_GEO_CD.values, name="medicare_est")


# ---------------------------------------------------------------- checks
def bea_state_contributions():
    z = zipfile.ZipFile(src["bea_cainc4"])
    name = [n for n in z.namelist() if n.startswith("CAINC4__ALL_AREAS")][0]
    df = pd.read_csv(io.TextIOWrapper(z.open(name), encoding="latin-1"), dtype=str)
    df["GeoFIPS"] = df.GeoFIPS.str.strip().str.strip('"')
    df = df[(df.LineCode.str.strip() == "36") & df.GeoFIPS.str.endswith("000")]
    df = df[df.GeoFIPS.str[:2].isin(STATE_FIPS)]
    return pd.Series(pd.to_numeric(df[str(TAX_YEAR)], errors="coerce").values * 1000,
                     index=df.GeoFIPS.str[:2].map(FIPS_TO_ABBR).values)


def main():
    OUTPUT.mkdir(exist_ok=True)
    counties, state_pop = load_counties()
    rec = treasury_receipts()
    irs, irs_state_rows = load_irs()
    taxes, cap_c = allocate_taxes(irs, counties, rec)
    sp, remap_notes, bad_codes = load_spending(counties)

    pop_cty = pivot_county(sp, "pop")
    rcp_cty = pivot_county(sp, "recipient")
    sw = statewide(sp, "pop")
    medicare = medicare_estimate()

    c = counties.copy()
    cat = lambda name, frame=pop_cty: c.fips.map(frame[name] if name in frame else {}).fillna(0)
    c["contracts"] = cat("contracts")
    natl = national_programs()   # nationwide health-benefit contracts booked at one office (not counted here)
    c["national_programs"] = c.fips.map(natl).fillna(0.0)
    c["contracts"] = c.contracts - c.national_programs
    c["grants_county"] = cat("grants")
    c["ss_ssi"] = cat("social_security_ssi")
    c["other_direct"] = cat("other_direct_payments")
    c["insurance_other"] = cat("insurance") + cat("other_assistance")
    c["medicare_usaspending"] = cat("medicare")
    c["loan_face_value"] = cat("loan_face_value")
    c["loan_subsidy"] = cat("loan_subsidy")
    c["contracts_recipient"] = cat("contracts", rcp_cty)
    c["grants_recipient"] = cat("grants", rcp_cty)

    # Share statewide (no-county) grants and Social Security by population.
    state_pop_sum = c.groupby("state").population.transform("sum")
    pop_share = c.population / state_pop_sum
    c["grants_statewide"], need_mix = statewide_grants_by_need(c, sw)
    amt = c.state.map(sw["social_security_ssi"] if "social_security_ssi" in sw else {}).fillna(0)
    c["ss_ssi_statewide"] = amt * pop_share

    c = c.merge(taxes.drop(columns=["population"]), on="fips", how="left")
    c["medicare_est"] = c.fips.map(medicare)

    c["money_in"] = c[["contracts", "grants_county", "grants_statewide", "ss_ssi", "ss_ssi_statewide"]].sum(axis=1)
    c["money_in_per_person"] = c.money_in / c.population
    c["taxes_per_person"] = c.taxes_total / c.population
    c["dollars_back"] = c.money_in / c.taxes_total
    us_ratio = c.money_in.sum() / c.taxes_total.sum()
    c["vs_us_average"] = c.dollars_back / us_ratio
    c["dollars_back_income_payroll_only"] = c.money_in / (c.tax_income + c.tax_payroll)
    c["broad_money_in"] = (c.money_in + c.other_direct + c.insurance_other
                           + c.medicare_est.fillna(0) + c.refundable_credits)
    c["dollars_back_broad"] = c.broad_money_in / c.taxes_total
    us_broad = c.broad_money_in.sum() / c.taxes_total.sum()
    c["rank_dollars_back"] = c.dollars_back.rank(ascending=False, method="min").astype("Int64")

    # Flags a reviewer should see.
    def flags(r):
        f = []
        if r.national_programs > 0:
            f.append(f"national program contracts booked here moved out of contracts (${r.national_programs / 1e9:,.1f}B)")
        if r.fips in remap_notes:
            f += sorted(remap_notes[r.fips])
        if r.population < 5000:
            f.append("small population: per-person figures swing a lot")
        if r.contracts > 0.5 * r.money_in and r.contracts > 20000 * r.population:
            f.append("contracts dominate (check for headquarters or one big project)")
        if min(r.contracts, r.grants_county, r.ss_ssi) < 0:
            f.append("a category is negative (more money taken back than awarded)")
        if pd.isna(r.medicare_est):
            f.append("Medicare figure suppressed by CMS")
        if pd.isna(r.taxes_total):
            f.append("no IRS data for this county (IRS counts it inside a neighbor), so no ratio")
        return "; ".join(f)
    c["flags"] = c.apply(flags, axis=1)

    # ---------------- state roll-up and checks
    st = c.groupby("state").agg(
        population=("population", "sum"), contracts=("contracts", "sum"),
        grants_county=("grants_county", "sum"), grants_statewide=("grants_statewide", "sum"),
        ss_ssi=("ss_ssi", "sum"), ss_ssi_statewide=("ss_ssi_statewide", "sum"),
        money_in=("money_in", "sum"), taxes_total=("taxes_total", "sum"),
        tax_income=("tax_income", "sum"), tax_payroll=("tax_payroll", "sum"),
        irs_income_tax=("irs_income_tax", "sum"), other_direct=("other_direct", "sum"),
        broad_money_in=("broad_money_in", "sum"),
    )
    st["contracts_no_county"] = st.index.map(sw["contracts"] if "contracts" in sw else {}).fillna(0)
    st["grants_share_no_county"] = st.grants_statewide / (st.grants_county + st.grants_statewide)
    med_sw = sp[(sp.scope == "pop") & (sp.county == "") & sp.medicaid & (sp.category == "grants")]
    st["medicaid_share_of_no_county_grants"] = (
        st.index.map(med_sw.groupby("state").obligation.sum()).fillna(0) / st.grants_statewide)
    st["dollars_back"] = st.money_in / st.taxes_total
    st["dollars_back_broad"] = st.broad_money_in / st.taxes_total

    irs_st = irs_state_rows.assign(state=irs_state_rows.STATEFIPS.str.zfill(2).map(FIPS_TO_ABBR)
                                   ).set_index("state")
    st["irs_state_row_income_tax"] = irs_st.A06500 + irs_st.A85300
    st["check_irs_counties_match_state"] = (st.irs_income_tax / st.irs_state_row_income_tax - 1).abs() < 0.001
    sp_st = state_pop.set_index("state")
    st["census_state_population"] = sp_st.population
    st["check_census_counties_match_state"] = st.population == st.census_state_population

    rock = pd.read_csv(REFERENCE / "rockefeller_ffy2023_states.csv")
    name_to_abbr = dict(zip(state_pop.STNAME, state_pop.state))
    rock["state"] = rock.state_name.map(name_to_abbr)
    rock = rock.set_index("state")
    st["rockefeller_receipts"] = rock.receipts_musd * 1e6
    st["taxes_vs_rockefeller_pct"] = st.taxes_total / st.rockefeller_receipts - 1
    st["rockefeller_expenditures"] = rock.expenditures_musd * 1e6
    st["rockefeller_dollars_back"] = rock.expenditures_per_dollar_receipts
    st["our_spending_as_share_of_rockefeller"] = st.money_in / st.rockefeller_expenditures
    bea = bea_state_contributions()
    st["bea_social_insurance_by_workplace"] = bea
    st["payroll_vs_bea_pct"] = st.tax_payroll / st.bea_social_insurance_by_workplace - 1

    # ---------------- national checks
    ss_truth = treasury_ss_benefits()
    us_sp = sp[sp.scope == "pop"]
    nat = lambda catname: us_sp[us_sp.category == catname].obligation.sum()
    in_states = us_sp[us_sp.state.isin(ABBR_TO_FIPS)]
    county_tagged = in_states[in_states.county != ""]
    checks = []

    def chk(name, value, expected, tol, note):
        diff = value / expected - 1 if expected else np.nan
        status = "PASS" if abs(diff) <= tol else "LOOK"
        checks.append((name, value, expected, diff, status, note))

    chk("Social Security + SSI in USAspending vs Treasury benefit outlays (US)",
        nat("social_security_ssi"), sum(ss_truth.values()), 0.05,
        "Treasury Monthly Treasury Statement, FY2023: retirement, survivors, disability and SSI benefits.")
    chk("IRS income tax (tax year 2023) vs Treasury individual income tax receipts (FY2023)",
        taxes.irs_income_tax.sum(), rec["individual_income"], 0.05,
        "Different years (calendar vs fiscal) and timing of payments; a few % gap is expected.")
    chk("Allocated taxes vs Rockefeller's allocated receipts (50 states)",
        st.taxes_total.drop("DC", errors="ignore").sum(), st.rockefeller_receipts.sum(), 0.03,
        "Both control to the same Treasury totals; differences come from DC and proxies.")
    chk("Sum of county populations vs U.S. population (50 states + DC)",
        c.population.sum(), state_pop.population.sum(), 0.0001, "Census Vintage 2025, July 1, 2023.")
    for catname in ["contracts", "grants", "social_security_ssi", "other_direct_payments", "medicare"]:
        inside = in_states[in_states.category == catname].obligation.sum()
        tagged = county_tagged[county_tagged.category == catname].obligation.sum()
        checks.append((f"Share of {catname} (in the 50 states + DC) with a county", tagged, inside,
                       tagged / inside if inside else np.nan, "INFO",
                       "Here 'difference' is the share with a county (value / expected). "
                       "Money with a state but no county is listed per state on the States sheet."))
    abroad = us_sp[~us_sp.state.isin(ABBR_TO_FIPS)].groupby("category").obligation.sum()
    for catname, v in abroad.items():
        checks.append((f"{catname}: performed abroad, in territories, or no state", v, np.nan,
                       np.nan, "INFO", "Not part of any county."))
    big_misses = st[st.taxes_vs_rockefeller_pct.abs() > 0.10].index.tolist()
    checks.append(("States where our taxes differ from Rockefeller by over 10%",
                   len(big_misses), 0, np.nan, "PASS" if not big_misses else "LOOK",
                   ", ".join(big_misses) or "none"))
    checks.append(("IRS: county sums equal the IRS state rows (all states)",
                   int(st.check_irs_counties_match_state.sum()), len(st), np.nan,
                   "PASS" if st.check_irs_counties_match_state.all() else "LOOK", ""))
    checks.append(("Unknown county codes in USAspending moved to 'no county'",
                   bad_codes.obligation.sum(), np.nan, np.nan, "INFO",
                   ", ".join(sorted(set(bad_codes.county)))[:300]))
    checks_df = pd.DataFrame(checks, columns=["check", "value", "expected", "difference", "status", "note"])

    national = {
        "US dollars back per $1 (counted money)": us_ratio,
        "US dollars back per $1 (broad: + other payments, Medicare est., refundable credits)": us_broad,
        "Taxes allocated to counties ($)": c.taxes_total.sum(),
        "Taxes not allocated: customs + misc ($)": rec["customs"] + rec["miscellaneous"],
        "Counted money in counties ($)": c.money_in.sum(),
        "Social Security wage cap used for $200k+ returns (avg wages per return)": cap_c,
    }
    write_outputs(c, st, checks_df, national, rec, ss_truth)


# ---------------------------------------------------------------- output
COUNTY_COLUMNS = [
    ("fips", "FIPS"), ("state", "State"), ("county", "County"), ("population", "Population (2023)"),
    ("contracts", "Contracts $"), ("grants_county", "Grants: tagged to county $"),
    ("grants_statewide", "Grants: statewide, shared by need (est.) $"),
    ("ss_ssi", "Social Security & SSI $"), ("ss_ssi_statewide", "Social Security & SSI: statewide share $"),
    ("money_in", "MONEY IN (counted) $"), ("money_in_per_person", "Money in per person $"),
    ("tax_income", "Income tax $"), ("tax_payroll", "Payroll taxes (SS, Medicare, UI) $"),
    ("tax_corporate", "Corporate tax (est.) $"), ("tax_estate_excise", "Estate & excise taxes (est.) $"),
    ("taxes_total", "TAXES PAID (est.) $"), ("taxes_per_person", "Taxes per person $"),
    ("dollars_back", "DOLLARS BACK per $1"), ("vs_us_average", "vs US average (1.00 = average)"),
    ("rank_dollars_back", "Rank (1 = most back)"),
    ("dollars_back_income_payroll_only", "Dollars back per $1 of income + payroll tax only"),
    ("other_direct", "Not counted: other direct payments (VA, farm, Pell, housing) $"),
    ("insurance_other", "Not counted: insurance & other assistance $"),
    ("medicare_est", "Not counted: Medicare Parts A&B (est.) $"),
    ("refundable_credits", "Not counted: refundable tax credits $"),
    ("medicare_usaspending", "Info: Medicare as booked in USAspending (often at insurer HQ) $"),
    ("loan_face_value", "Loans: face value $"), ("loan_subsidy", "Loans: expected cost to govt $"),
    ("dollars_back_broad", "Dollars back per $1 (broad, incl. not-counted items)"),
    ("contracts_recipient", "Contracts by recipient's location $"),
    ("grants_recipient", "Grants by recipient's location $"),
    ("national_programs", "Not counted: national programs booked here $"),
    ("flags", "Flags for review"),
]


def write_outputs(c, st, checks_df, national, rec, ss_truth):
    cols = [k for k, _ in COUNTY_COLUMNS]
    nice = dict(COUNTY_COLUMNS)
    county_out = c[cols].sort_values(["state", "county"]).rename(columns=nice)
    county_out.to_csv(OUTPUT / f"phase0_counties_fy{FISCAL_YEAR}.csv", index=False)

    state_out = st.reset_index()
    readme = pd.DataFrame({"About this spreadsheet": README_LINES + [
        "", "National figures:"] + [f"  {k}: {v:,.2f}" for k, v in national.items()]})
    sources = pd.DataFrame(SOURCE_ROWS, columns=["Source", "Publisher", "What we use", "Year used",
                                                  "Access", "Update schedule / lag", "Terms", "Pitfalls"])
    xlsx = OUTPUT / f"phase0_counties_fy{FISCAL_YEAR}.xlsx"
    with pd.ExcelWriter(xlsx, engine="openpyxl") as w:
        readme.to_excel(w, sheet_name="Read me", index=False)
        county_out.to_excel(w, sheet_name="Counties", index=False)
        state_out.to_excel(w, sheet_name="States", index=False)
        checks_df.to_excel(w, sheet_name="Checks", index=False)
        sources.to_excel(w, sheet_name="Sources", index=False)
        format_book(w.book)
    print(f"Wrote {xlsx}")
    print(checks_df[["check", "status", "difference"]].to_string(index=False))
    for k, v in national.items():
        print(f"{k}: {v:,.3f}")


def format_book(book):
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.utils import get_column_letter
    head = PatternFill("solid", fgColor="E8E4DA")
    for ws in book.worksheets:
        ws.freeze_panes = "A2" if ws.title != "Counties" else "D2"
        for cell in ws[1]:
            cell.font = Font(bold=True)
            cell.fill = head
            cell.alignment = Alignment(wrap_text=True, vertical="top")
        for i, col in enumerate(ws.iter_cols(min_row=1, max_row=1), start=1):
            title = str(col[0].value or "")
            width = 14 if ws.title in ("Counties", "States", "Checks") else 40
            if title in ("County", "check", "note", "Flags for review", "About this spreadsheet"):
                width = 60 if title != "County" else 26
            ws.column_dimensions[get_column_letter(i)].width = width
            fmt = None
            if "$" in title or title.startswith(("contracts", "grants_", "ss_", "money", "tax",
                                                 "rockefeller_rec", "rockefeller_exp", "bea", "irs",
                                                 "other", "broad", "value", "expected")):
                fmt = "#,##0"
            if ("per $1" in title or "average" in title or title.startswith("dollars_back")
                    or title == "rockefeller_dollars_back"):
                fmt = "0.00"
            if title.endswith(("_pct", "_share", "share_of_rockefeller")) or "share_" in title \
                    or title == "difference":
                fmt = "0.0%"
            if title == "Population (2023)" or title == "population":
                fmt = "#,##0"
            if fmt:
                for cell in col[0].parent.iter_rows(min_col=i, max_col=i, min_row=2):
                    cell[0].number_format = fmt
        if ws.title == "Read me":
            ws.column_dimensions["A"].width = 120
        if ws.title == "Sources":
            for row in ws.iter_rows(min_row=2):
                for cell in row:
                    cell.alignment = Alignment(wrap_text=True, vertical="top")
    ws = book["Counties"]
    ws.row_dimensions[1].height = 75


README_LINES = [
    "Federal money map, Phase 0 review spreadsheet (draft, not for publication).",
    "",
    "One row per county (3,144 counties and county-equivalents in the 50 states and DC).",
    "Spending year: federal fiscal year 2023 (Oct 2022 - Sep 2023). Tax year: 2023. Population: July 1, 2023.",
    "",
    "MONEY IN (counted) = contracts + grants + Social Security & SSI, by where the work or payment happens.",
    "  Grants with no county (mostly statewide programs such as Medicaid) are shared among a state's",
    "  counties by need: Medicaid by people with Medicaid coverage, school and child programs by children,",
    "  TANF/child care/energy aid by people in poverty, WIC and SNAP administration by SNAP households,",
    "  everything else by population (Census ACS 2019-2023 and SAIPE 2023). Those columns say 'est.'.",
    "  Nationwide health-benefit contracts (VA community care, TRICARE) are moved out of the county",
    "  where they're booked into a 'national programs' column that is not counted.",
    "  These are obligations: money agencies committed that year (USAspending's standard measure).",
    "TAXES PAID (est.) = federal taxes tied to residents: income tax and payroll taxes from IRS county",
    "  data, plus corporate tax (75% by investment income, 25% by wages), estate tax (by investment",
    "  income) and excise taxes (by population). All are scaled to Treasury's FY2023 totals.",
    "  Customs duties and miscellaneous receipts (2.7%) are not allocated, as in the Rockefeller study.",
    "DOLLARS BACK per $1 = MONEY IN / TAXES PAID.",
    "  The US average is well under $1 because the counted money leaves out Medicare, federal pay,",
    "  defense overhead, interest on the debt and more. Compare counties with the 'vs US average' column.",
    "",
    "'Not counted' columns are there so you can see what adding them would change.",
    "The 'broad' ratio adds them (except loans, which are repaid).",
    "",
    "Sheets: Counties (main table), States (roll-up + checks against published state figures),",
    "Checks (pass / look), Sources (where each number comes from).",
]

SOURCE_ROWS = [
    ("USAspending bulk award files (FY2023 contracts + assistance)", "U.S. Treasury (Bureau of the Fiscal Service)",
     "Contracts, grants, direct payments (incl. Social Security & SSI), loans, by place of performance county",
     "FY2023 (file dated 2026-10-06)", "files.usaspending.gov/award_data_archive, free, no key",
     "Monthly refresh; agencies report contracts within ~3 days (DoD 90-day delay), assistance twice a month",
     "Public domain U.S. government data",
     "Statewide grants have no county; recipient location puts them at the state capital; prime awards only (sub-awards would double count); obligations not outlays; DoD and big agencies can deobligate (negatives)"),
    ("IRS SOI county data", "IRS Statistics of Income",
     "Income tax, net investment income tax, additional Medicare tax, self-employment tax, wages, investment income, refundable credits",
     "Tax year 2023", "irs.gov/statistics/soi-tax-stats-county-data, free CSV",
     "Annual; about 2.5 years behind (TY2023 posted 2026)", "Public domain",
     "Counts by residence of filer; non-filers missing; small cells suppressed; CT uses planning regions"),
    ("Census county population estimates (Vintage 2025)", "U.S. Census Bureau",
     "Population July 1, 2023", "2023", "www2.census.gov, free CSV", "Annual (March)", "Public domain",
     "Each vintage revises past years; CT planning regions from 2022"),
    ("Monthly Treasury Statement (tables 4 and 5)", "U.S. Treasury, Fiscal Data API",
     "National tax receipts by type; Social Security and SSI benefit outlays", "FY2023",
     "api.fiscaldata.treasury.gov, free, no key", "Monthly, ~8 business days after month end",
     "Public domain", "Fiscal year, not calendar year"),
    ("Rockefeller Institute 'Giving or Getting?' 2025", "Rockefeller Institute of Government",
     "State receipts and spending FFY2023, used only as a check", "FFY2023",
     "rockinst.org PDF; table typed into data/reference", "Roughly annual",
     "Copyrighted report: cite, don't republish tables wholesale", "Covers more spending categories than this site counts"),
    ("BEA CAINC4 county personal income", "Bureau of Economic Analysis",
     "State contributions for government social insurance (check on payroll estimate)", "2023",
     "apps.bea.gov/regional/zip, free", "Annual (November)", "Public domain",
     "Measured where people work, not where they live; includes state unemployment insurance"),
    ("Medicare Geographic Variation, county", "CMS (data.cms.gov)",
     "Original Medicare spending per beneficiary x all beneficiaries = rough Parts A&B estimate (not counted)", "2023",
     "data.cms.gov API, free, no key", "Annual, ~1.5 years behind", "Public domain",
     "Covers Original Medicare only; Medicare Advantage assumed to cost the same per person; small counties suppressed"),
    ("SSA OASDI and SSI beneficiaries by county", "Social Security Administration",
     "Not used yet: planned cross-check of Social Security by county", "2024 available",
     "ssa.gov blocks automated downloads; files can be saved by hand in a browser", "Annual",
     "Public domain", "December monthly benefits, not annual totals"),
]


if __name__ == "__main__":
    main()
