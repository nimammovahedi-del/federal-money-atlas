// Federal Money Atlas · static site (one HTML page per URL, including 3,144 county pages).
// SITE_URL is the final public address; it's only used for link previews and canonical links.
import { defineConfig } from "astro/config";

export default defineConfig({
  site: process.env.SITE_URL || "https://federal-money-atlas.example",
  trailingSlash: "always",
  build: { format: "directory" },
  output: "static",
});
