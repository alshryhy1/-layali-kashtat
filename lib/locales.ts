export const locales = ["ar", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/** Public href for a locale: Arabic has no prefix; English uses `/en`. */
export function localeHref(locale: Locale | string, path: string = "/"): string {
  const loc: Locale = locale === "en" ? "en" : "ar";
  let p = path || "/";
  if (!p.startsWith("/")) p = `/${p}`;
  // Strip accidental locale prefixes from path
  if (p === "/ar" || p === "/en") p = "/";
  else if (p.startsWith("/ar/")) p = p.slice(3);
  else if (p.startsWith("/en/")) p = p.slice(3);

  if (loc === "ar") return p === "/" ? "/" : p;
  return p === "/" ? "/en" : `/en${p}`;
}
