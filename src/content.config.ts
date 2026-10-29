import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const link = z.object({
  title: z.string(),
  description: z.string().optional(),
  href: z.string(),
  meta: z.string().optional(),
});

const file = z.object({ label: z.string(), href: z.string() });

const brand = z.object({
  intro: z.string().optional(),
  /** Primary downloads shown at the top of the brand page. */
  downloads: z.array(file).default([]),
  /** Tile backgrounds for "light" and "dark" previews. */
  grounds: z.object({ light: z.string(), dark: z.string() }).default({ light: "#FFFFFF", dark: "#141210" }),
  assets: z
    .array(
      z.object({
        group: z.string(),
        description: z.string().optional(),
        columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(2),
        items: z.array(
          z.object({
            name: z.string(),
            /** An image, or an .mp4/.webm that plays muted on a loop. */
            preview: z.string(),
            poster: z.string().optional(),
            ground: z.enum(["light", "dark", "image"]).default("light"),
            files: z.array(file).default([]),
          }),
        ),
      }),
    )
    .default([]),
  colors: z
    .array(
      z.object({
        name: z.string(),
        hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        cmyk: z.string().optional(),
        usage: z.string().optional(),
      }),
    )
    .default([]),
  colorNote: z.string().optional(),
  type: z
    .array(
      z.object({
        name: z.string(),
        role: z.string(),
        description: z.string().optional(),
        href: z.string().optional(),
      }),
    )
    .default([]),
  /** Rules for using the brand, written for AI tools (llms.txt, brand.md): what to do and not do. */
  rules: z.array(z.string()).default([]),
});

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const scheme = z.object({ paper: hex, ink: hex, fill: hex.optional() });

/** A client space can wear the client's own brand: type, colors, logo, and favicon. */
const theme = z.object({
  font: z
    .object({
      /** Family for body text and UI. */
      body: z.string().regex(/^[\w -]+$/),
      /** Family for headings; defaults to the body family. */
      heading: z
        .string()
        .regex(/^[\w -]+$/)
        .optional(),
      /** A stylesheet that defines the families: a path in public/ or a font service URL. */
      stylesheet: z.string(),
      /** Font files to preload, usually the Latin subsets of the body and heading faces. */
      preload: z.array(z.string()).default([]),
    })
    .optional(),
  light: scheme.optional(),
  dark: scheme.optional(),
  /** Logo lockup for the header, one per scheme. */
  logo: z.object({ light: z.string(), dark: z.string() }).optional(),
  favicon: z.string().optional(),
});

/** One file per client: src/content/clients/<slug>.yaml. The slug is the URL. */
const clients = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/clients" }),
  schema: z.object({
    name: z.string(),
    summary: z.string(),
    /** Shared guides from src/content/guides/shared to include, by file name. */
    sharedGuides: z.array(z.string()).default([]),
    /** Shown on the overview as a short list of facts. */
    project: z
      .array(z.object({ label: z.string(), value: z.string(), href: z.string().optional() }))
      .default([]),
    theme: theme.optional(),
    brand: brand.optional(),
    resources: z.array(z.object({ group: z.string(), items: z.array(link) })).default([]),
    /** Notes for AI tools beyond the brand rules, such as how to approach work on the website. */
    agents: z.array(z.string()).default([]),
  }),
});

const video = z.object({
  /** An .mp4/.webm file, or a Loom, YouTube, or Vimeo link. */
  src: z.string(),
  poster: z.string().optional(),
  captions: z.string().optional(),
});

/**
 * Guides live in src/content/guides/<client-slug>/ or src/content/guides/shared/.
 * Entry ids come out as "<folder>/<file>", e.g. "justifi/framer-basics".
 */
const guides = defineCollection({
  loader: glob({ pattern: "*/*.{md,mdx}", base: "./src/content/guides" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    /** Guides with the same section are grouped in the sidebar and on the overview. */
    section: z.string().default("Guides"),
    order: z.number().default(100),
    duration: z.string().optional(),
    updated: z.coerce.date().optional(),
    video: video.optional(),
  }),
});

export const collections = { clients, guides };
