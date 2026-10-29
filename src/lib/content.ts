import { getCollection, getEntry, type CollectionEntry } from "astro:content";

export type Client = CollectionEntry<"clients">;
export type Guide = CollectionEntry<"guides">;

/** The URL segment of a guide: its file name. */
export const guideSlug = (guide: Guide) => guide.id.split("/").pop()!;

export const clientUrl = (client: Client | string) =>
  `/${typeof client === "string" ? client : client.id}/`;

export const guideUrl = (client: Client | string, guide: Guide) =>
  `${clientUrl(client)}guides/${guideSlug(guide)}/`;

/** A client's own guides plus the shared guides it lists, in reading order. */
export async function getClientGuides(client: Client): Promise<Guide[]> {
  const own = await getCollection("guides", (g) => g.id.startsWith(`${client.id}/`));
  const shared = await Promise.all(
    client.data.sharedGuides.map(async (name) => {
      const guide = await getEntry("guides", `shared/${name}`);
      if (!guide) throw new Error(`${client.id}: shared guide "${name}" not found`);
      return guide;
    }),
  );
  return [...own, ...shared].sort(
    (a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title),
  );
}

export const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** An anchor id from a heading: "Logo animation" → "logo-animation". */
export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Two-digit guide numbers: 01, 02, … */
export const pad = (n: number) => String(n).padStart(2, "0");

/** Guides grouped by their section, keeping reading order. */
export function bySection(guides: Guide[]): { section: string; guides: Guide[] }[] {
  const groups = new Map<string, Guide[]>();
  for (const guide of guides) {
    const list = groups.get(guide.data.section) ?? [];
    list.push(guide);
    groups.set(guide.data.section, list);
  }
  return [...groups].map(([section, guides]) => ({ section, guides }));
}
