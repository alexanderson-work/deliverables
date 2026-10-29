// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";

export default defineConfig({
  // Set this to the subdomain once it's live.
  site: "https://clients.alexanderson.work",
  trailingSlash: "always",
  // Pages load ahead when a link is hovered, so changing pages is near instant.
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  integrations: [react(), mdx()],
  // Code in guides stays ink on paper, like the rest of the type.
  markdown: { syntaxHighlight: false },
});
