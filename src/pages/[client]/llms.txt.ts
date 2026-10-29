import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import type { Client } from "../../lib/content";
import { llmsTxt } from "../../lib/agents";

// Where an AI tool starts: instructions for this client's brand and links to everything.
export async function getStaticPaths() {
  const clients = await getCollection("clients");
  return clients.map((client) => ({ params: { client: client.id }, props: { client } }));
}

export const GET: APIRoute = async ({ props, site }) =>
  new Response(await llmsTxt((props as { client: Client }).client, site!), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
