import type { Client } from "./content";

type Theme = NonNullable<Client["data"]["theme"]>;
type Scheme = NonNullable<Theme["light"]>;

/**
 * Vlak's color tokens derived from a client's paper and ink. Every hairline,
 * fill, and secondary tone is a mix of the two, so two brand colors are enough.
 */
const tokens = ({ paper, ink, fill }: Scheme) => `
  --bg: ${paper};
  --text: ${ink};
  --accent: ${ink};
  --text-secondary: color-mix(in srgb, ${ink} 64%, ${paper});
  --divider: color-mix(in srgb, ${ink} 10%, transparent);
  --divider-subtle: color-mix(in srgb, ${ink} 6%, transparent);
  --table-alt: color-mix(in srgb, ${ink} 3%, transparent);
  --grid-line: color-mix(in srgb, ${ink} 5%, transparent);
  --control-border: color-mix(in srgb, ${ink} 40%, transparent);
  --control-fill: ${fill ?? `color-mix(in srgb, ${ink} 8%, ${paper})`};`;

/**
 * CSS that dresses a client space in the client's brand, matching Vlak's scheme selectors.
 * Selectors are doubled (:root:root) so they beat the site's own unlayered defaults
 * wherever the bundled stylesheet lands in <head>.
 */
export function themeCss(theme: Theme | undefined): string {
  if (!theme) return "";
  const css: string[] = [];
  if (theme.font) {
    css.push(`:root:root { --font-sans: "${theme.font.family}", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }`);
  }
  if (theme.light) {
    const light = tokens(theme.light);
    css.push(`:root:root[data-theme="light"] { ${light} }`);
    css.push(`@media not (prefers-color-scheme: dark) { :root:root:not([data-theme="dark"]) { ${light} } }`);
  }
  if (theme.dark) {
    const dark = tokens(theme.dark);
    css.push(`:root:root[data-theme="dark"] { ${dark} }`);
    css.push(`@media (prefers-color-scheme: dark) { :root:root:not([data-theme="light"]) { ${dark} } }`);
  }
  return css.join("\n");
}
