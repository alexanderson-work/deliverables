import type { APIRoute } from "astro";
import { siteTitle, studio } from "../site.config";

// The site root says how spaces are laid out, without listing anyone's.
export const GET: APIRoute = () =>
  new Response(
    [
      `# ${siteTitle} by ${studio.name}`,
      "",
      `> Client spaces with brand assets, website guides, and resources, made by ${studio.name} (${studio.url}).`,
      "",
      "Each client space has its own instructions for AI tools. If someone gave you a link into a space, such as https://this-site/<client>/brand/, read /<client>/llms.txt on this site: the first part of the link's path names the space.",
      "",
      "There is no public list of spaces.",
      "",
    ].join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
