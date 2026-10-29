import { render } from "astro:content";
import { clientUrl, getClientGuides, guideUrl, slug, type Client } from "./content";
import { isExternal } from "./links";

/** One thing a reader can find: a page, a guide, a section of a guide, or a brand asset. */
export interface SearchRecord {
  id: number;
  kind: "page" | "guide" | "section" | "asset" | "color" | "type" | "file" | "resource";
  /** Results are listed under this: the guide's title, "Brand assets", "Resources". */
  group: string;
  title: string;
  /** Indexed lightly: a section's guide, so "cms publish" finds the CMS guide's publishing section. */
  context?: string;
  text: string;
  keywords?: string;
  url: string;
  hint?: string;
  swatch?: string;
}

const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Inline Markdown to plain text: link syntax, tags, and emphasis marks go; the words stay. */
const inline = (source = "") =>
  source
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(\w+);/g, (m, name) => entities[name] ?? m)
    .replace(/\*\*|__|`|~~/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Rendered headings have typographic quotes; the source has straight ones. */
const straight = (text: string) => text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

/** An MDX body to plain text, without imports, comments, code blocks, list marks, or table rules. */
export const plain = (source = "") =>
  inline(
    source
      .replace(/^import .*$/gm, "")
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/^\s*(?:[-*+]|\d+\.|>)\s+/gm, "")
      .replace(/^\s*\|?[\s:|-]+\|[\s:|-]*$/gm, "")
      .replace(/\|/g, " "),
  );

/** A client's search index: everything in their space, and nothing from anyone else's. */
export async function searchRecords(client: Client): Promise<SearchRecord[]> {
  const base = clientUrl(client);
  const { name, summary, brand, resources } = client.data;
  const records: Omit<SearchRecord, "id">[] = [];
  const add = (record: Omit<SearchRecord, "id">) => records.push(record);

  add({ kind: "page", group: "Pages", title: "Overview", text: summary, keywords: name, url: base });
  if (brand) {
    add({
      kind: "page",
      group: "Pages",
      title: "Brand assets",
      text: brand.intro ?? `The official logo files, colors, and typefaces for ${name}.`,
      keywords: "logos colors typefaces downloads",
      url: `${base}brand/`,
    });
  }
  if (resources.length) {
    add({
      kind: "page",
      group: "Pages",
      title: "Resources",
      text: `Links and files for running ${name} day to day.`,
      keywords: resources.map((group) => group.group).join(" "),
      url: `${base}resources/`,
    });
  }

  add({
    kind: "page",
    group: "Pages",
    title: "AI tools",
    text: `Give an AI tool the link to ${name}'s space and it can use the brand and website guides correctly.`,
    keywords: "ai llms agent assistant chatgpt claude prompt",
    url: `${base}#ai`,
  });

  // Each guide, then each of its sections, so a result can land on the right heading.
  const guides = await getClientGuides(client);
  for (const guide of guides) {
    const { title, summary, section } = guide.data;
    const url = guideUrl(client, guide);
    const { headings } = await render(guide);
    // [intro, "##", heading, body, "###", heading, body, …]
    const parts = (guide.body ?? "").split(/^(#{2,3}) +(.+)$/m);
    add({
      kind: "guide",
      group: title,
      title,
      text: `${summary} ${plain(parts[0])}`,
      keywords: section,
      url,
      hint: section,
    });
    let next = 0;
    for (let p = 1; p < parts.length; p += 3) {
      const heading = straight(inline(parts[p + 1]));
      const at = headings.findIndex((h, n) => n >= next && h.depth === parts[p].length && straight(h.text) === heading);
      if (at >= 0) next = at + 1;
      add({
        kind: "section",
        group: title,
        title: at >= 0 ? headings[at].text : heading,
        context: title,
        text: plain(parts[p + 2]),
        url: at >= 0 ? `${url}#${headings[at].slug}` : url,
      });
    }
  }

  if (brand) {
    const page = `${base}brand/`;
    for (const file of brand.downloads) {
      add({ kind: "file", group: "Brand assets", title: file.label, text: "Download", keywords: "download", url: file.href });
    }
    for (const group of brand.assets) {
      add({
        kind: "asset",
        group: "Brand assets",
        title: group.group,
        text: [group.description, group.items.map((item) => item.name).join(", ")].filter(Boolean).join(" "),
        keywords: [...new Set(group.items.flatMap((item) => item.files.map((file) => file.label)))].join(" "),
        url: `${page}#${slug(group.group)}`,
        hint: `${group.items.length} ${group.items.length === 1 ? "file set" : "file sets"}`,
      });
    }
    for (const color of brand.colors) {
      const rgb = [1, 3, 5].map((n) => parseInt(color.hex.slice(n, n + 2), 16)).join(" ");
      add({
        kind: "color",
        group: "Brand assets",
        title: color.name,
        text: color.usage ?? "",
        keywords: `color colour ${color.hex} ${color.hex.slice(1)} rgb ${rgb} ${color.cmyk ? `cmyk ${color.cmyk}` : ""}`,
        url: `${page}#colors`,
        hint: color.hex.toUpperCase(),
        swatch: color.hex,
      });
    }
    for (const face of brand.type) {
      add({
        kind: "type",
        group: "Brand assets",
        title: face.name,
        text: [face.role, face.description].filter(Boolean).join(". "),
        keywords: "typeface font type typography",
        url: `${page}#type`,
        hint: face.role,
      });
    }
  }

  for (const group of resources) {
    for (const item of group.items) {
      add({
        kind: isExternal(item.href) ? "resource" : /\.\w+$/.test(item.href) ? "file" : "page",
        group: "Resources",
        title: item.title,
        text: item.description ?? "",
        keywords: [group.group, item.meta].filter(Boolean).join(" "),
        url: item.href,
        hint: item.meta,
      });
    }
  }

  return records.map((record, id) => ({ id, ...record }));
}
