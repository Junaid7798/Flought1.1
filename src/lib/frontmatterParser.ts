import matter from 'gray-matter';

export interface ParsedContent {
  data: Record<string, unknown>;
  body: string;
}

/**
 * Parse frontmatter from a markdown string.
 * Returns { data, body } where data is the YAML key/value map
 * and body is the markdown content after the frontmatter block.
 * If no frontmatter is present, data is {} and body is the full string.
 */
export function parseFrontmatter(content: string): ParsedContent {
  const result = matter(content);
  return {
    data: result.data as Record<string, unknown>,
    body: result.content,
  };
}

/**
 * Serialize data and body back into a frontmatter string.
 * If data is empty, returns body as-is (no --- block added).
 */
export function serializeFrontmatter(data: Record<string, unknown>, body: string): string {
  if (Object.keys(data).length === 0) {
    return body;
  }
  return matter.stringify(body, data);
}
