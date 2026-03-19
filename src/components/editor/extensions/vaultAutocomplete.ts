import { autocompletion, type CompletionContext, type CompletionResult } from '@codemirror/autocomplete';
import type { Extension } from '@codemirror/state';
import { FEATURE_CONFIG } from '$lib/config';

// vaultCompletionSource is exported for V2 semantic wrapper — same function,
// V2 will wrap it with a semantic scoring function without changing this file.
export function vaultCompletionSource(terms: string[]) {
	return function (context: CompletionContext): CompletionResult | null {
		// Match [[wikilinks or regular words
		const wikiMatch = context.matchBefore(/\[\[[\w\s]*/);
		const wordMatch = context.matchBefore(/\w+/);
		const match = wikiMatch ?? wordMatch;
		if (!match || (match.from === match.to && !context.explicit)) return null;

		const query = wikiMatch
			? match.text.slice(2).toLowerCase()  // strip [[ prefix
			: match.text.toLowerCase();

		const options = terms
			.filter((term) => term.toLowerCase().includes(query))
			.slice(0, 20)
			.map((term) => {
				const isPrefix = term.toLowerCase().startsWith(query);
				return {
					label:  term,
					boost:  isPrefix ? 2 : 1,
					apply:  wikiMatch ? '[[' + term + ']]' : term,
				};
			});

		if (options.length === 0) return null;

		return {
			from:    match.from,
			options,
		};
	};
}

export function createVaultAutocomplete(terms: string[]): Extension {
	return autocompletion({
		override: [vaultCompletionSource(terms)],
		closeOnBlur: true,
		maxRenderedOptions: 20,
	});
}
