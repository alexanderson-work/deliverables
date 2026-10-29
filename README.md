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

## Change the look

Vlak's tokens are CSS custom properties. Override them in `src/styles/brand.css` to move the site toward the Alex Anderson design system; it loads after Vlak and wins without `!important`. Layout and page styles are in `src/styles/site.css`.

Type is [Satoshi](https://www.fontshare.com/fonts/satoshi), loaded from Fontshare's CDN in `src/layouts/Base.astro`. The font files aren't committed: Satoshi's license (ITF Free Font License) allows self-hosting on your own site but not redistributing the files through a public repository. If this repo goes private, the files can move into the project and be served with `@font-face` instead. Headings, labels, and bold use `--weight-strong` (700 for Satoshi).

## Deploy

The repo is set up for Vercel (`vercel.json`): static output, trailing slashes, and an `X-Robots-Tag: noindex` header. Point a subdomain such as `clients.alexanderson.work` at the project and update `site` in `astro.config.mjs`.

Links are unlisted, not private. For anything sensitive, put the client's path behind Vercel's password protection or Cloudflare Access.
