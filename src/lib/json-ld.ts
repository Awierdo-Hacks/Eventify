/**
 * Serialise structured data for a <script type="application/ld+json"> tag.
 * `<` is escaped so text supplied by users (a business name, a description)
 * can never close the script element and inject markup.
 */
export function jsonLd(data: unknown): { __html: string } {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}
