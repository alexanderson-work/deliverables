/**
 * Files for AI tools. A client can hand an assistant the link to their space and
 * it finds, at /<client>/llms.txt, instructions for using the brand and a direct
 * URL for every logo, color, typeface, and guide. Everything is built from the
 * same content as the pages, so the two never drift apart.
 */
import { andList, getClientGuides, guideSlug, guideUrl, clientUrl, formatDate, type Client, type Guide } from "./content";
import { isExternal } from "./links";
import { studio } from "../site.config";

type Brand = NonNullable<Client["data"]["brand"]>;

/** An absolute URL for a path on this site; other sites' links pass through. */
const absolute = (href: string, site: URL) => new URL(href, site).href;

export const agentFiles = (client: Client, site: URL) => {
  const base = absolute(clientUrl(client), site);
  return {
    llms: `${base}llms.txt`,
    full: `${base}llms-full.txt`,
    brandMd: `${base}brand.md`,
    brandJson: `${base}brand.json`,
    guide: (guide: Guide) => `${base}guides/${guideSlug(guide)}.md`,
  };
};

/** A prompt a person can paste into an AI tool along with the link. */
export const starterPrompt = (client: Client, site: URL) =>
  `Use ${client.data.name}'s official brand and website guides from ${agentFiles(client, site).llms}. ` +
  `Read its instructions first, then use the files it links to instead of recreating anything.`;

const grounds = (brand: Brand) => ({
  light: `light backgrounds (such as ${brand.grounds.light})`,
  dark: `dark backgrounds (such as ${brand.grounds.dark})`,
  image: "its own, as a finished image",
});

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

const weights: Record<string, number> = {
  thin: 100,
  extralight: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

/** "Mulish Bold" → Mulish at 700. */
function face(name: string) {
  const words = name.split(" ");
  const weight = weights[words.at(-1)!.toLowerCase()];
  return weight ? { family: words.slice(0, -1).join(" "), weight } : { family: name, weight: 400 };
}

const cssName = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** A Google Fonts stylesheet for the brand's typefaces, when they come from Google Fonts. */
function googleFonts(brand: Brand) {
  const families = brand.type
    .filter((t) => t.href?.startsWith("https://fonts.google.com/"))
    .map((t) => face(t.name));
  if (!families.length) return undefined;
  const query = families.map((f) => `family=${f.family.replace(/ /g, "+")}:wght@${f.weight}`).join("&");
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}

/** How to use the brand: rules every brand gets, then the client's own. */
function brandRules(brand: Brand) {
  return [
    "Use logo files exactly as they are. Never redraw, retype, recolor, stretch, rotate, crop, or add effects to a logo; download the file and place it.",
    "Prefer SVG. Use PNG only where SVG isn't supported.",
    `Match each logo to its background: use the variants marked for light backgrounds on ${brand.grounds.light} or other light colors, and the ones marked for dark backgrounds on ${brand.grounds.dark} or other dark colors.`,
    "Use the exact color values listed. Don't approximate them or add colors that aren't here.",
    ...brand.rules,
  ];
}

/** Everything an AI tool should know before it starts: the brand rules and the client's notes. */
export function instructions(client: Client) {
  const { name, brand, agents } = client.data;
  return [
    `Everything linked here is current and approved by ${name}. Use these files instead of searching elsewhere or recreating anything.`,
    ...(brand ? brandRules(brand) : []),
    ...agents,
    `If something isn't covered here, ask the person you're working with, or suggest they contact ${studio.name} (${studio.email}).`,
  ];
}

const bullets = (lines: string[]) => lines.map((line) => `- ${line}`).join("\n");

/** /<client>/llms.txt, in the llms.txt format (llmstxt.org). */
export async function llmsTxt(client: Client, site: URL) {
  const { name, summary, deliverables, brand, resources } = client.data;
  const files = agentFiles(client, site);
  const guides = await getClientGuides(client);
  const out = [
    `# ${name}${deliverables.length ? `: ${andList(deliverables)}` : ""}`,
    "",
    `> ${summary} Delivered by ${studio.name} (${studio.url}). People see these at ${absolute(clientUrl(client), site)}; this file is the version for AI tools.`,
    "",
    "## Instructions for AI tools",
    "",
    bullets(instructions(client)),
  ];
  if (brand) {
    out.push(
      "",
      "## Brand",
      "",
      bullets([
        `[Brand guide](${files.brandMd}): every logo, color, and typeface, with rules and a direct URL for each file`,
        `[Brand data (JSON)](${files.brandJson}): the same, structured`,
        ...brand.downloads.map((file) => `[${file.label}](${absolute(file.href, site)})`),
      ]),
    );
  }
  if (guides.length) {
    out.push("", "## Website guides", "");
    for (const guide of guides) out.push(`- [${guide.data.title}](${files.guide(guide)}): ${guide.data.summary}`);
  }
  if (resources.length) {
    out.push("", "## Resources", "");
    for (const group of resources) {
      for (const item of group.items) {
        const note = [item.description, item.meta].filter(Boolean).join(" ");
        out.push(`- [${item.title}](${absolute(item.href, site)})${note ? `: ${note}` : ""}`);
      }
    }
  }
  out.push(
    "",
    "## Optional",
    "",
    `- [Everything in one file](${files.full}): these instructions, the brand guide, and every guide in full`,
  );
  return out.join("\n") + "\n";
}

/** /<client>/brand.md: the brand page for AI tools, with rules and every file's URL. */
export function brandMd(client: Client, site: URL) {
  const { name } = client.data;
  const brand = client.data.brand!;
  const ground = grounds(brand);
  const out = [
    `# ${name} brand`,
    "",
    brand.intro ?? `The official logo files, colors, and typefaces for ${name}.`,
    "",
    `Web version: ${absolute(`${clientUrl(client)}brand/`, site)}`,
    "",
    "## Rules",
    "",
    bullets(brandRules(brand)),
  ];

  if (brand.downloads.length) {
    out.push("", "## Downloads", "", bullets(brand.downloads.map((file) => `[${file.label}](${absolute(file.href, site)})`)));
  }

  for (const group of brand.assets) {
    out.push("", `## ${group.group}`, "");
    if (group.description) out.push(group.description, "");
    out.push("| Variant | Use on | Files |", "| --- | --- | --- |");
    for (const item of group.items) {
      const files = item.files.map((file) => `[${file.label}](${absolute(file.href, site)})`).join(", ");
      out.push(`| ${item.name} | ${ground[item.ground]} | ${files} |`);
    }
  }

  if (brand.colors.length) {
    out.push("", "## Colors", "");
    if (brand.colorNote) out.push(brand.colorNote, "");
    out.push("| Name | Hex | RGB | CMYK | Use |", "| --- | --- | --- | --- | --- |");
    for (const color of brand.colors) {
      out.push(
        `| ${color.name} | ${color.hex.toUpperCase()} | ${rgb(color.hex).join(", ")} | ${color.cmyk ?? ""} | ${color.usage ?? ""} |`,
      );
    }
  }

  if (brand.type.length) {
    out.push("", "## Typography", "", "| Typeface | Role | Use | Get it |", "| --- | --- | --- | --- |");
    for (const t of brand.type) {
      out.push(`| ${t.name} | ${t.role} | ${t.description ?? ""} | ${t.href ? `[${t.href}](${t.href})` : ""} |`);
    }
  }

  // Ready to paste into code: the colors and type as CSS.
  const fonts = googleFonts(brand);
  const tokens = [
    ...brand.colors.map((c) => `  --${cssName(name)}-${cssName(c.name)}: ${c.hex.toUpperCase()};`),
    ...brand.type.map((t) => `  --${cssName(name)}-font-${cssName(t.role)}: "${face(t.name).family}", system-ui, sans-serif;`),
  ];
  if (tokens.length) {
    out.push("", "## For code", "");
    if (fonts) out.push(`Load the typefaces from Google Fonts: ${fonts}`, "");
    out.push("```css", ":root {", ...tokens, "}", "```");
  }

  return out.join("\n") + "\n";
}

/** /<client>/brand.json: the same brand, structured. */
export function brandJson(client: Client, site: URL) {
  const { name } = client.data;
  const brand = client.data.brand!;
  const files = agentFiles(client, site);
  return {
    name,
    description: brand.intro,
    page: absolute(`${clientUrl(client)}brand/`, site),
    instructions: files.llms,
    rules: brandRules(brand),
    downloads: brand.downloads.map((file) => ({ label: file.label, url: absolute(file.href, site) })),
    backgrounds: brand.grounds,
    assets: brand.assets.map((group) => ({
      group: group.group,
      description: group.description,
      variants: group.items.map((item) => ({
        name: item.name,
        background: item.ground,
        files: item.files.map((file) => ({
          format: file.label,
          url: absolute(file.href, site),
          ...(isExternal(file.href) ? { hosted: "external" } : {}),
        })),
      })),
    })),
    colors: brand.colors.map((color) => ({
      name: color.name,
      hex: color.hex.toUpperCase(),
      rgb: rgb(color.hex),
      cmyk: color.cmyk,
      usage: color.usage,
    })),
    colorNote: brand.colorNote,
    typography: brand.type.map((t) => ({ ...face(t.name), name: t.name, role: t.role, usage: t.description, url: t.href })),
    googleFonts: googleFonts(brand),
  };
}

const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** The few kinds of HTML the guides use inline (callouts, links, emphasis) as Markdown. */
const inlineHtml = (html: string, link: (href: string) => string) =>
  html
    .replace(/<a\s[^>]*?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, (_, href, text) => `[${text}](${link(href)})`)
    .replace(/<\/?(?:strong|b)>/g, "**")
    .replace(/<\/?(?:em|i)>/g, "_")
    .replace(/<code>([\s\S]*?)<\/code>/g, "`$1`")
    .replace(/<Kbd>([\s\S]*?)<\/Kbd>/g, "`$1`")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<summary>([\s\S]*?)<\/summary>/g, "**$1**\n\n")
    .replace(/<\/?details[^>]*>/g, "")
    .replace(/<p>/g, "")
    .replace(/<\/p>/g, "\n\n")
    .replace(/&(\w+);/g, (m, name) => entities[name] ?? m);

const attrs = (tag: string) => Object.fromEntries([...tag.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));

/** /<client>/guides/<guide>.md: a guide as plain Markdown, with absolute links. */
export async function guideMd(client: Client, guide: Guide, site: URL) {
  const files = agentFiles(client, site);
  const page = new URL(guideUrl(client, guide), site);
  const guidePath = new RegExp(`^${clientUrl(client)}guides/([^/]+)/$`);
  // Links to other guides point at their Markdown; everything else, absolute.
  const link = (href: string) => {
    const url = new URL(href, page);
    const other = url.origin === page.origin && url.pathname.match(guidePath);
    return other ? `${absolute(`${clientUrl(client)}guides/${other[1]}.md`, site)}${url.hash}` : url.href;
  };

  // Code stays exactly as written; the prose around it is converted.
  const body = (guide.body ?? "")
    .split(/(```[\s\S]*?```)/)
    .map((part, i) => {
      if (i % 2) return part;
      return inlineHtml(
        part
          .replace(/^import .*$/gm, "")
          .replace(/<Figure\s[^>]*\/>/g, (tag) => {
            const { src, alt = "", caption } = attrs(tag);
            return `![${alt}](${link(src)})${caption ? `\n\n_${caption}_` : ""}`;
          })
          .replace(/<Callout[^>]*>([\s\S]*?)<\/Callout>/g, (_, inner: string) =>
            inlineHtml(inner, link)
              .replace(/\n\s*\n\s*/g, "\n\n")
              .trim()
              .split("\n")
              .map((line) => `> ${line.trim()}`.trimEnd())
              .join("\n"),
          )
          .replace(/\]\(([^)\s]+)\)/g, (_, href) => `](${link(href)})`),
        link,
      );
    })
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const { title, summary, section, duration, updated, video } = guide.data;
  const facts = [section, duration, updated && `Updated ${formatDate(updated)}`].filter(Boolean).join(" · ");
  return [
    `# ${title}`,
    "",
    summary,
    "",
    `${client.data.name} website guide${facts ? ` · ${facts}` : ""}`,
    `Web version: ${page.href}`,
    ...(video ? [`Video: ${absolute(video.src, site)}`] : []),
    `More for AI tools: ${files.llms}`,
    "",
    "---",
    "",
    body,
    "",
  ].join("\n");
}

/** /<client>/llms-full.txt: the instructions, the brand guide, and every guide, in one file. */
export async function llmsFull(client: Client, site: URL) {
  const guides = await getClientGuides(client);
  const parts = [await llmsTxt(client, site)];
  if (client.data.brand) parts.push(brandMd(client, site));
  for (const guide of guides) parts.push(await guideMd(client, guide, site));
  return parts.join("\n---\n\n");
}
