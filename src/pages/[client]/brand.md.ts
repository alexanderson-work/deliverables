import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import type { Client } from "../../lib/content";
import { brandMd } from "../../lib/agents";

// The brand page for AI tools: rules, colors, type, and a direct URL for every file.
export async function getStaticPaths() {
  const clients = await getCollection("clients");
  return clients
    .filter((client) => client.data.brand)
    .map((client) => ({ params: { client: client.id }, props: { client } }));
}

export const GET: APIRoute = ({ props, site }) =>
  new Response(brandMd((props as { client: Client }).client, site!), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
