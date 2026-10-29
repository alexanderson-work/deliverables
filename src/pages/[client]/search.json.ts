import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import type { Client } from "../../lib/content";
import { searchRecords } from "../../lib/search-index";

// One index per client, built with the site and loaded the first time search opens.
export async function getStaticPaths() {
  const clients = await getCollection("clients");
  return clients.map((client) => ({ params: { client: client.id }, props: { client } }));
}

export const GET: APIRoute = async ({ props }) => {
  const records = await searchRecords((props as { client: Client }).client);
  return new Response(JSON.stringify(records), { headers: { "Content-Type": "application/json" } });
};
