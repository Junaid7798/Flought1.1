import { describe, it, expect } from 'vitest';
import { extractLinks } from './linkParser';

describe('extractLinks — basic', () => {
  it('extracts a single wikilink', () => {
    expect(extractLinks('See [[My Note]] for details.')).toEqual(['My Note']);
  });

  it('extracts multiple wikilinks from one line', () => {
    expect(extractLinks('[[Alpha]] and [[Beta]] are linked.')).toEqual(['Alpha', 'Beta']);
  });

  it('extracts wikilinks across multiple lines', () => {
    const content = 'See [[First]].\nAlso [[Second]].';
    expect(extractLinks(content)).toEqual(['First', 'Second']);
  });

  it('returns empty array when no wikilinks present', () => {
    expect(extractLinks('Plain text with no links.')).toEqual([]);
  });
});

describe('extractLinks — edge cases', () => {
  it('ignores empty brackets [[]]', () => {
    expect(extractLinks('This has [[]] empty brackets.')).toEqual([]);
  });

  it('ignores whitespace-only brackets [[ ]]', () => {
    expect(extractLinks('This has [[ ]] whitespace brackets.')).toEqual([]);
  });

  it('ignores nested/triple brackets [[[x]]]', () => {
    // [[[x]]] contains [ inside, so inner text has [ — the regex [^\[\]]+ won't match
    expect(extractLinks('Nested [[[x]]] brackets.')).toEqual([]);
  });

  it('ignores brackets with [ or ] inside inner text', () => {
    expect(extractLinks('Bad [[a[b]c]] link.')).toEqual([]);
  });

  it('handles wikilinks with pipe aliases — extracts full inner text', () => {
    // [[target|alias]] — full inner text returned (caller can split on |)
    expect(extractLinks('See [[Project Alpha|Alpha]].')).toEqual(['Project Alpha|Alpha']);
  });

  it('trims whitespace from inner text', () => {
    expect(extractLinks('[[ Spaced Link ]]')).toEqual(['Spaced Link']);
  });
});

describe('extractLinks — code block exclusion', () => {
  it('ignores wikilinks inside fenced code blocks (backtick)', () => {
    const content = '```\n[[Inside Code]]\n```\nOutside [[Real Link]].';
    expect(extractLinks(content)).toEqual(['Real Link']);
  });

  it('ignores wikilinks inside fenced code blocks (tilde)', () => {
    const content = '~~~\n[[Inside Tilde Block]]\n~~~\n[[Outside]].';
    expect(extractLinks(content)).toEqual(['Outside']);
  });

  it('ignores wikilinks inside inline code spans', () => {
    const content = 'Use `[[not a link]]` and [[real link]].';
    expect(extractLinks(content)).toEqual(['real link']);
  });

  it('handles content with no code blocks normally', () => {
    const content = '[[A]] and [[B]]';
    expect(extractLinks(content)).toEqual(['A', 'B']);
  });
});
