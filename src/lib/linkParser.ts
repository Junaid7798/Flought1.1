/**
 * Extracts [[wikilink]] targets from markdown content.
 *
 * Rules:
 * - Returns the inner text of every [[...]] match
 * - Empty brackets [[]] are ignored
 * - Nested/triple brackets [[[x]]] are ignored
 * - Content inside fenced code blocks (``` or ~~~) is skipped
 * - Content inside inline code (`...`) is skipped
 */
export function extractLinks(content: string): string[] {
  // Strip fenced code blocks first (``` or ~~~, any info string)
  const withoutFenced = content.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n\1[ \t]*$/gm, '');

  // Strip inline code spans
  const withoutInline = withoutFenced.replace(/`[^`]*`/g, '');

  const links: string[] = [];
  // Match [[ ... ]] — require at least one char inside, no [ or ] inside inner text.
  // Negative lookbehind/lookahead ensures [[[x]]] (triple brackets) is not matched.
  const wikilinkRe = /(?<!\[)\[\[([^\[\]]+)\]\](?!\])/g;
  let match: RegExpExecArray | null;

  while ((match = wikilinkRe.exec(withoutInline)) !== null) {
    const inner = match[1].trim();
    if (inner.length > 0) {
      links.push(inner);
    }
  }

  return links;
}
