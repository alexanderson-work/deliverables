# Deliverables

Client spaces for Alex Anderson's clients: website guides, brand assets, and resources, one page per client. Built with [Astro](https://astro.build) and the [Vlak](https://vlak.dev) design system.

Each client lives at `/<client>/`, for example `/justifi/`. The home page doesn't list clients, and every page is marked `noindex`, so a space is only reachable by its link.

## Run it

Needs Node 22.23 or newer (24 recommended, see `.nvmrc`).

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

## Add a client

1. Copy `src/content/clients/justifi.yaml` to `src/content/clients/<slug>.yaml`. The file name becomes the URL.
2. Put the client's files in `public/clients/<slug>/` and reference them from the YAML as `/clients/<slug>/...`.
3. Add guides as `.mdx` files in `src/content/guides/<slug>/`.

Every section is optional. Leave out `brand` and there's no brand page; leave out `resources` and there's no resources page.

### Dress a space in the client's brand

A `theme` block swaps Vlak's paper and ink for the client's colors, sets their typefaces, puts their lockup in the header, and uses their icon as the favicon. Every hairline, fill, and secondary tone is mixed from `paper` and `ink`, so two colors per scheme are enough; `fill` is optional.

Self-host open-licensed fonts in `public/clients/<slug>/fonts/` with a small `fonts.css`, and preload the Latin files so text doesn't swap after the first paint. A font service URL also works for `stylesheet`.

```yaml
theme:
  font:
    heading: Mulish
    body: Lato
    stylesheet: /clients/justifi/fonts/fonts.css
    preload:
      - /clients/justifi/fonts/lato-latin-400-normal.woff2
      - /clients/justifi/fonts/mulish-latin-wght-normal.woff2
  light: { paper: "#FFFFFF", ink: "#0D1A27" }
  dark: { paper: "#0D1A27", ink: "#FFFFFF", fill: "#152C42" }
  logo:
    light: /clients/justifi/brand/primary-logo-navy-amber.svg
    dark: /clients/justifi/brand/primary-logo-white-amber.svg
  favicon: /clients/justifi/brand/brand-icon-amber.svg
```

Without a `theme`, a space uses the studio defaults: Vlak's paper and ink, set in Satoshi.

## Write a guide

```mdx
---
title: Publishing & Version History
summary: How changes go live, how to use branches, and how to get an earlier version back.
section: Getting started   # groups guides in the sidebar and on the overview
order: 3                  # reading order across all sections
duration: 6 min read
updated: 2026-09-04
video:                    # optional: an .mp4/.webm, or a Loom, YouTube, or Vimeo link
  src: https://www.loom.com/share/...
---

Body in Markdown. `##` headings become the "On this page" outline.
```

These components work in any guide without importing them:

- `<Callout><p><strong>Lead-in.</strong> Note text.</p></Callout>`
- `<Kbd>Cmd</Kbd> <Kbd>Z</Kbd>`
- `<Figure src="/clients/<slug>/guides/<guide>/1.png" alt="…" caption="…" />`

Inline code that is just a hex color, like `` `#FFA000` ``, gets a color chip.

A guide that applies to several clients can live in `src/content/guides/shared/` and be listed under `sharedGuides` in each client's YAML.

## Search

Each client space has its own search: the field at the top of the sidebar, the search button on phones, or ⌘K / Ctrl K / `/` anywhere. `src/pages/[client]/search.json.ts` builds a per-client index with the site (pages, every guide and each of its sections, brand assets, colors, typefaces, downloads, and resources), so one client's search never sees another's. `src/components/Search.tsx` loads it the first time search is reached for and ranks results with [MiniSearch](https://github.com/lucaong/minisearch): prefix matches, small typos, and code names split at their capitals ("parallax" finds `WithMouseParallax.tsx`). A section result opens its guide at that heading; resources open in a new tab and files download. New guides and assets are indexed automatically.

## AI tools

A client can give an AI assistant the link to their space and it can use the brand properly. Each space publishes, at the same address as its pages:

- `/<client>/llms.txt`: where an AI tool starts ([llms.txt format](https://llmstxt.org)). Instructions for using the brand, then links to everything below.
- `/<client>/brand.md` and `/<client>/brand.json`: every logo variant (with the background it belongs on), color, and typeface, with a direct URL for each file and a CSS snippet.
- `/<client>/guides/<guide>.md`: each guide as plain Markdown.
- `/<client>/llms-full.txt`: all of it in one file.

They're built from the same content as the pages (`src/lib/agents.ts`), so they never drift. Every client page links to them in its `<head>`, and the overview has an "AI tools" section with the link and a starter prompt to copy. The instructions combine standard rules for any brand with the client's own: `brand.rules` (from their brand guidelines) and `agents` (notes such as how to approach the website) in the client's YAML file. `/llms.txt` at the site root explains the layout without listing any clients.

Links are absolute, built from `site` in `astro.config.mjs`: on Vercel that's the project's production domain (so it follows a custom domain once one is added); elsewhere set `SITE_URL`. `robots.txt` keeps search engines and AI training crawlers out but lets AI tools fetch a link a person gave them (Claude-User, ChatGPT-User, Perplexity-User, MistralAI-User), and the AI files and brand assets send `Access-Control-Allow-Origin: *` so browser-based tools can load them.

## Change the look

Vlak's tokens are CSS custom properties. Override them in `src/styles/brand.css` to move the studio defaults toward the Alex Anderson design system; it loads after Vlak and wins without `!important`. Layout and page styles are in `src/styles/site.css`; client themes are generated by `src/lib/theme.ts`.

Type follows vlak.dev's lead: very large titles, then a quick drop. The steps are custom properties at the top of `site.css`: `--t-mark` for the client's name on its overview, `--t-display` for page and guide titles, `--t-section` for section heads, and `--t-subsection` below that; labels and body copy stay small.

The foot of the sidebar (and of the phone menu) is a contact card: the studio photo and an email link with the client named in the subject. The name, email, and photo come from `src/site.config.ts`; the photo is `public/studio/alex-anderson.jpg`.

Motion lives in `src/styles/motion.css`. Fades use Vlak's curve (`--ease`) and durations; anything that moves uses `--ease-glide`, which starts at once and decelerates over a long tail, and hovers arrive quickly and let go slowly. Between pages the old and new pages crossfade on the same curve, so the header and sidebar hold perfectly still; the new page's content arrives one piece after another (title, intro, then each block, 50ms apart); and the sidebar's current-page marker glides to the new item. Switching light and dark crossfades the page; the current page's crumb fades into the header once the title scrolls away; the "On this page" marker glides to the current section; and lazy images fade in as they arrive. All of it stops under reduced motion.

Pages change in place with Astro's `<ClientRouter />` (in `Base.astro`), and pages load ahead when a link is hovered. The sidebar and the theme toggle are marked `transition:persist`, so they stay mounted from page to page and keep their scroll, hover, and focus; `ClientShell.astro` moves the current-page state when the page changes. Because a script now runs once per visit rather than once per page, anything that sets up a page goes through `everyPage()` from `src/lib/page.ts`, which runs it now and again after each swap, with a signal for cleaning up.

The header, sidebar, and "On this page" outline are `position: fixed`, not sticky: Safari repositions sticky elements a frame behind the scroll, which made them shake.

Vlak's module grid shows as faint hairline pairs at every 204px module edge, and the layout sits on it: the content column runs between lines, and boxes (callouts, code, the showcase) are sized so their edges land on them. Vlak draws the grid as a fixed overlay, which shimmered against scrolling rules in Safari, so `site.css` turns that off and paints the same lines (Vlak's `--grid-image` tokens) as the page's own background and the header bar's. The sidebar stays clean.

External links open in a new tab. Templates use `newTab()` from `src/lib/links.ts`, Markdown links in guides go through `ProseLink.astro`, and raw `<a>` tags in MDX need `target="_blank" rel="noopener noreferrer"` written out.

The studio type is [Satoshi](https://www.fontshare.com/fonts/satoshi), loaded from Fontshare's CDN in `src/layouts/Base.astro`. The font files aren't committed: Satoshi's license (ITF Free Font License) allows self-hosting on your own site but not redistributing the files through a public repository. If this repo goes private, the files can move into the project and be served with `@font-face` instead. Headings, labels, and bold use `--weight-strong` (700 for Satoshi).

## Deploy

The repo is set up for Vercel (`vercel.json`): static output, trailing slashes, and an `X-Robots-Tag: noindex` header. Point a subdomain such as `clients.alexanderson.work` at the project and update `site` in `astro.config.mjs`.

Links are unlisted, not private. For anything sensitive, put the client's path behind Vercel's password protection or Cloudflare Access.
