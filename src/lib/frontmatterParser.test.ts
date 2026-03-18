import { describe, it, expect } from 'vitest';
import { parseFrontmatter, serializeFrontmatter } from './frontmatterParser';

describe('parseFrontmatter', () => {
  it('parses frontmatter and body correctly', () => {
    const input = `---\ntitle: Hello\nstage: 1\n---\nThis is the body.`;
    const { data, body } = parseFrontmatter(input);
    expect(data.title).toBe('Hello');
    expect(data.stage).toBe(1);
    expect(body.trim()).toBe('This is the body.');
  });

  it('returns empty data and full string when no frontmatter', () => {
    const input = 'Just a plain body with no frontmatter.';
    const { data, body } = parseFrontmatter(input);
    expect(data).toEqual({});
    expect(body).toBe(input);
  });

  it('handles multiple YAML keys of different types', () => {
    const input = `---\ntitle: My Note\ntags:\n  - alpha\n  - beta\npriority: 2\ndraft: true\n---\nBody here.`;
    const { data, body } = parseFrontmatter(input);
    expect(data.title).toBe('My Note');
    expect(data.tags).toEqual(['alpha', 'beta']);
    expect(data.priority).toBe(2);
    expect(data.draft).toBe(true);
    expect(body.trim()).toBe('Body here.');
  });
});

describe('serializeFrontmatter', () => {
  it('returns body as-is when data is empty', () => {
    const body = 'No frontmatter needed.';
    expect(serializeFrontmatter({}, body)).toBe(body);
  });

  it('serializes data into a frontmatter block', () => {
    const result = serializeFrontmatter({ title: 'Test', stage: 1 }, 'Body content.');
    expect(result).toContain('---');
    expect(result).toContain('title: Test');
    expect(result).toContain('stage: 1');
    expect(result).toContain('Body content.');
  });
});

describe('roundtrip', () => {
  it('parse → serialize returns equivalent content', () => {
    const original = `---\ntitle: Roundtrip\nstage: 2\ntags:\n  - test\n---\nThe body text.`;
    const { data, body } = parseFrontmatter(original);
    const result = serializeFrontmatter(data, body);
    // Re-parse the serialized result and compare data/body
    const { data: data2, body: body2 } = parseFrontmatter(result);
    expect(data2).toEqual(data);
    expect(body2.trim()).toBe(body.trim());
  });
});
