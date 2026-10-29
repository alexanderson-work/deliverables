import { bySection, clientUrl, getClientGuides, guideUrl, type Client } from "../lib/content";

export interface NavItem {
  label: string;
  href: string;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

/** The navigation every page in a client space shares. */
export async function clientNav(client: Client): Promise<NavGroup[]> {
  const base = clientUrl(client);
  const guides = await getClientGuides(client);
  return [
    {
      items: [
        { label: "Overview", href: base },
        ...(client.data.brand ? [{ label: "Brand assets", href: `${base}brand/` }] : []),
        ...(client.data.resources.length ? [{ label: "Resources", href: `${base}resources/` }] : []),
      ],
    },
    ...bySection(guides).map(({ section, guides }) => ({
      label: section,
      items: guides.map((g) => ({ label: g.data.title, href: guideUrl(client, g) })),
    })),
  ];
}
