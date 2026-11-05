// Federal Money Atlas · static site (one HTML page per URL, including 3,144 county pages).
// SITE_URL is the final public address; it's only used for link previews and canonical links.
import { defineConfig } from "astro/config";

export default defineConfig({
  // Live address on Cloudflare Pages (project "fedmoney"; auto-deploys on push to main).
  site: process.env.SITE_URL || "https://fedmoney.pages.dev",
  trailingSlash: "always",
  build: { format: "directory" },
  output: "static",
});
