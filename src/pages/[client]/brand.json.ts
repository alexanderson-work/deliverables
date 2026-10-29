import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import type { Client } from "../../lib/content";
import { brandJson } from "../../lib/agents";

// The brand as structured data, for tools that would rather parse than read.
export async function getStaticPaths() {
  const clients = await getCollection("clients");
  return clients
    .filter((client) => client.data.brand)
    .map((client) => ({ params: { client: client.id }, props: { client } }));
}

export const GET: APIRoute = ({ props, site }) =>
  new Response(JSON.stringify(brandJson((props as { client: Client }).client, site!), null, 2), {
    headers: { "Content-Type": "application/json" },
  });
