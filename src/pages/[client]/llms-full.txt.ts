import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import type { Client } from "../../lib/content";
import { llmsFull } from "../../lib/agents";

// The instructions, the brand guide, and every guide in one file, for tools that read once.
export async function getStaticPaths() {
  const clients = await getCollection("clients");
  return clients.map((client) => ({ params: { client: client.id }, props: { client } }));
}

export const GET: APIRoute = async ({ props, site }) =>
  new Response(await llmsFull((props as { client: Client }).client, site!), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
