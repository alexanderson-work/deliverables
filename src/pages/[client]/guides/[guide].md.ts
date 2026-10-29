import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getClientGuides, guideSlug, type Client, type Guide } from "../../../lib/content";
import { guideMd } from "../../../lib/agents";

// Each guide as plain Markdown, beside its page: /<client>/guides/<guide>.md
export async function getStaticPaths() {
  const clients = await getCollection("clients");
  const paths = await Promise.all(
    clients.map(async (client) =>
      (await getClientGuides(client)).map((guide) => ({
        params: { client: client.id, guide: guideSlug(guide) },
        props: { client, guide },
      })),
    ),
  );
  return paths.flat();
}

export const GET: APIRoute = async ({ props, site }) => {
  const { client, guide } = props as { client: Client; guide: Guide };
  return new Response(await guideMd(client, guide, site!), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
