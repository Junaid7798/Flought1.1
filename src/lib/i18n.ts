export const DEFAULT_STRINGS: Record<string, string> = {
  'nav.map': 'The Map',
  'nav.editor': 'Editor',
  'nav.focus': 'Focus',
  'capture.prompt': 'Capture a thought...',
  'thought.singular': 'Thought',
  'thought.plural': 'Thoughts',
  'library.singular': 'Library',
  'topic.singular': 'Topic',
  'topic.plural': 'Topics',
  'stage.1': 'Inbox',
  'stage.2': 'Queue',
  'stage.3': 'Forge',
  'stage.4': 'Archive',
  'onboarding.question': 'What will you use Flought for?',
  'onboarding.work': 'Work',
  'onboarding.personal': 'Personal',
};

// Placeholder: once userSettings exists in Dexie, read string_overrides here.
// For now always returns DEFAULT_STRINGS values.
function getOverrides(): Record<string, string> {
  return {};
}

export function $t(key: string): string {
  const overrides = getOverrides();
  return overrides[key] ?? DEFAULT_STRINGS[key] ?? key;
}
