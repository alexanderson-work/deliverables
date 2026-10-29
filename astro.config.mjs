// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";

// The site's address, for the absolute links AI tools need (llms.txt and friends).
// On Vercel it's the project's production domain, so it follows a custom domain
// once one is added; elsewhere, set SITE_URL or fall back to the planned subdomain.
const site =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://clients.alexanderson.work");

export default defineConfig({
  site,
  trailingSlash: "always",
  // Pages load ahead when a link is hovered, so changing pages is near instant.
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  integrations: [react(), mdx()],
  // Code in guides stays ink on paper, like the rest of the type.
  markdown: { syntaxHighlight: false },
});
