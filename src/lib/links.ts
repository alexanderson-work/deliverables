/** Absolute http(s) links leave the site. */
export const isExternal = (href?: string) => !!href && /^https?:\/\//i.test(href);

/** Attributes that open an external link in a new tab; nothing for internal links. */
export const newTab = (href?: string) =>
  isExternal(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
