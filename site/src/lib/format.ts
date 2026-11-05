// Formatting and plain-language helpers used when building static pages (mirrors the browser code in public/app/core.js).
import raw from "../data/counties.json";

export type County = (typeof raw.counties)[number];
export const META = raw.meta;
export const COUNTIES: County[] = raw.counties;
export const BY_FIPS = Object.fromEntries(COUNTIES.map((c) => [c.fips, c]));

export const STATE_NAMES: Record<string, string> = { AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming" };

const ok = (v: number | null | undefined): v is number => v !== null && v !== undefined && isFinite(v);
export const r2 = (v: number | null) => (ok(v) ? (v < 0 ? "−$" : "$") + Math.abs(v).toFixed(2) : "—");
export const money = (v: number | null) => {
  if (!ok(v)) return "—";
  const a = Math.abs(v), s = v < 0 ? "−$" : "$";
  return a >= 1e12 ? s + (a / 1e12).toFixed(2) + "T" : a >= 1e9 ? s + (a / 1e9).toFixed(1) + "B" : a >= 1e6 ? s + (a / 1e6).toFixed(1) + "M" : a >= 1e3 ? s + Math.round(a / 1e3) + "K" : s + Math.round(a);
};
export const whole = (v: number | null) => (ok(v) ? (v < 0 ? "−$" : "$") + Math.round(Math.abs(v)).toLocaleString("en-US") : "—");
export const int = (v: number) => Math.round(v).toLocaleString("en-US");

export const vsTypical = (c: County) => {
  if (!ok(c.ratio)) return null;
  const m = META.median_ratio;
  return c.ratio >= m * 2 ? `${(c.ratio / m).toFixed(1)}× as much as` : c.ratio > m * 1.1 ? "more than" : c.ratio < m * 0.9 ? "less than" : "about the same as";
};
export const sentence = (c: County) =>
  ok(c.ratio)
    ? `For every $1 its residents paid in federal taxes, ${c.name} got ${r2(c.ratio)} back in federal money — ${vsTypical(c)} the typical county (${r2(META.median_ratio)}).`
    : `The IRS reports ${c.name}'s taxes together with a neighboring county, so there is no dollars-back figure.`;
export const caution = (c: County) => {
  const f = c.flags || "";
  if (/no IRS data/.test(f)) return "The IRS reports this county's taxes together with a neighboring county, so there's no dollars-back figure.";
  if ((c.national || 0) > 0) return `${money(c.national)} in nationwide health-benefit contracts (veterans' community care or TRICARE) is booked to an office here. It pays for care across the country, so it's shown separately and not counted for this county.`;
  if (/contracts dominate/.test(f)) return "Most of this is one or a few large federal contracts (for example a base, lab or shipyard) — not money paid to residents.";
  if (/negative/.test(f)) return "Some federal money was taken back this year, which pulls the number down.";
  if (/small population/.test(f)) return "Very few people live here, so one award can swing the number a lot.";
  if (c.st === "CT") return "Connecticut reports by 9 planning regions instead of counties.";
  return "";
};
