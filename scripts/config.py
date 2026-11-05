"""Shared settings for the Phase 0 scripts.

Everything the scripts download goes in data/raw/ (not saved to git).
Small reference tables we typed in or extracted go in data/reference/ (saved to git).
Results go in output/.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
INTERIM = ROOT / "data" / "interim"
REFERENCE = ROOT / "data" / "reference"
OUTPUT = ROOT / "output"

# The year we compare. Taxes: IRS tax year 2023 (calendar 2023).
# Spending: federal fiscal year 2023 (Oct 1, 2022 - Sep 30, 2023), which is also
# the year the Rockefeller Institute's latest state report covers.
TAX_YEAR = 2023
FISCAL_YEAR = 2023
POP_YEAR = 2023  # Census July 1, 2023 estimate (Vintage 2025)

USASPENDING_FILES = {
    "contracts": f"FY{FISCAL_YEAR}_All_Contracts_Full_20261006.zip",
    "assistance": f"FY{FISCAL_YEAR}_All_Assistance_Full_20261006.zip",
}
USASPENDING_ARCHIVE = "https://files.usaspending.gov/award_data_archive/"

SOURCES = {
    # name: (url, local path)
    "irs_county_noagi": (
        "https://www.irs.gov/pub/irs-soi/23incyallnoagi.csv",
        RAW / "irs" / "23incyallnoagi.csv",
    ),
    "irs_county_agi": (
        "https://www.irs.gov/pub/irs-soi/23incyallagi.csv",
        RAW / "irs" / "23incyallagi.csv",
    ),
    "census_pop": (
        "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/counties/totals/co-est2025-alldata.csv",
        RAW / "census" / "co-est2025-alldata.csv",
    ),
    "census_ct_crosswalk": (
        "https://www2.census.gov/geo/docs/reference/ct_change/ct_cou_to_cousub_crosswalk.txt",
        RAW / "census" / "ct_cou_to_cousub_crosswalk.txt",
    ),
    "census_ct_towns": (
        "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025_9.csv",
        RAW / "census" / "sub-est2025_9.csv",
    ),
    # Need measures for sharing statewide grants (keyless Census files; the Census API now needs a key).
    "acs_medicaid": ("https://www2.census.gov/programs-surveys/acs/summary_file/2023/table-based-SF/data/5YRData/acsdt5y2023-c27007.dat", RAW / "census" / "acsdt5y2023-c27007.dat"),
    "acs_snap": ("https://www2.census.gov/programs-surveys/acs/summary_file/2023/table-based-SF/data/5YRData/acsdt5y2023-b22001.dat", RAW / "census" / "acsdt5y2023-b22001.dat"),
    "acs_children": ("https://www2.census.gov/programs-surveys/acs/summary_file/2023/table-based-SF/data/5YRData/acsdt5y2023-b09001.dat", RAW / "census" / "acsdt5y2023-b09001.dat"),
    "saipe_poverty": ("https://www2.census.gov/programs-surveys/saipe/datasets/2023/2023-state-and-county/est23all.txt", RAW / "census" / "saipe_est23all.txt"),
    "bea_cainc4": (
        "https://apps.bea.gov/regional/zip/CAINC4.zip",
        RAW / "bea" / "CAINC4.zip",
    ),
    "treasury_receipts": (
        "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/mts/mts_table_4"
        "?filter=record_date:eq:2023-09-30&page[size]=300",
        RAW / "omb" / "mts4_fy2023.json",
    ),
    "treasury_outlays": (
        "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/mts/mts_table_5"
        "?filter=record_date:eq:2023-09-30&page[size]=1000",
        RAW / "omb" / "mts5_fy2023.json",
    ),
    "cms_medicare_county": (
        "https://data.cms.gov/data-api/v1/dataset/6219697b-8f6c-4164-bed4-cd9317c58ebc/data"
        "?filter[YEAR]=2023&filter[BENE_GEO_LVL]=County&filter[BENE_AGE_LVL]=All&size=5000",
        RAW / "cms" / "gv_county_2023.json",
    ),
}

# Social Security wage cap for 2023 and the share of covered wages under the cap.
# The 82.5% share is an assumption to verify against SSA's Annual Statistical
# Supplement (Table 4.B1). It only affects how payroll tax is spread between
# high-wage and low-wage counties, not the national total.
SS_WAGE_CAP_2023 = 160_200
SS_TAXABLE_SHARE = 0.825

# Old county codes that USAspending may still use, mapped to today's codes.
# A list means "split between these by population".
LEGACY_FIPS = {
    "02261": ["02063", "02066"],  # Valdez-Cordova split in 2019
    "02270": ["02158"],           # Wade Hampton -> Kusilvak (2015)
    "46113": ["46102"],           # Shannon -> Oglala Lakota (2015)
    "51515": ["51019"],           # Bedford city merged into Bedford County (2013)
    "51560": ["51005"],           # Clifton Forge (2001)
    "12025": ["12086"],           # Dade -> Miami-Dade
    "02232": ["02105", "02230"],  # Skagway-Hoonah-Angoon split (2007)
    "02280": ["02195", "02275"],  # Wrangell-Petersburg split (2008/2013)
    "02201": ["02198"],           # Prince of Wales-Outer Ketchikan (2008)
}
# Connecticut's 8 old counties (09001-09015) were replaced by 9 planning regions
# (09110-09190) in 2022. Handled separately in build_phase0.py.
CT_OLD_COUNTIES = ["09001", "09003", "09005", "09007", "09009", "09011", "09013", "09015"]

STATE_FIPS = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT",
    "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL",
    "18": "IN", "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD",
    "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT", "31": "NE",
    "32": "NV", "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
    "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
    "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV",
    "55": "WI", "56": "WY",
}
ABBR_TO_FIPS = {v: k for k, v in STATE_FIPS.items()}
