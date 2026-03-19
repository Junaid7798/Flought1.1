<script lang="ts">
	import { onMount } from 'svelte';
	import { $t as t } from '$lib/i18n';
	import { FEATURE_CONFIG } from '$lib/config';
	import { createEdge, getEdgesByLibrary, type Thought, type Edge } from '$lib/db';

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		thoughts: Thought[];
		libraryId: string;
	}
	let { thoughts, libraryId }: Props = $props();

	// ── State ─────────────────────────────────────────────────────────────────

	let nodeA = $state<Thought | null>(null);
	let nodeB = $state<Thought | null>(null);
	let visible = $state(false);
	let accepted = $state(false);

	// V2 hook: semantic scoring function. V2 assigns a real function here.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let collisionFilter: ((a: Thought, b: Thought) => boolean) | null = null;

	// ── Mount — roll or restore pair ──────────────────────────────────────────

	onMount(async () => {
		const now = Date.now();
		const lastStr = localStorage.getItem('serendipity_last');
		const last = lastStr ? parseInt(lastStr, 10) : 0;

		// Check if accepted today (hide for rest of day)
		const acceptedStr = localStorage.getItem('serendipity_accepted');
		const acceptedTs = acceptedStr ? parseInt(acceptedStr, 10) : 0;
		if (now - acceptedTs < FEATURE_CONFIG.SERENDIPITY_INTERVAL_MS) {
			return; // hidden for rest of the day
		}

		if (now - last < FEATURE_CONFIG.SERENDIPITY_INTERVAL_MS) {
			// Restore saved pair
			const aId = localStorage.getItem('serendipity_a');
			const bId = localStorage.getItem('serendipity_b');
			if (aId && bId) {
				const a = thoughts.find((th) => th.id === aId) ?? null;
				const b = thoughts.find((th) => th.id === bId) ?? null;
				if (a && b) {
					nodeA = a;
					nodeB = b;
					visible = true;
				}
			}
			return;
		}

		// Roll a new pair
		if (thoughts.length < 2) return;

		// Get all edges for this library to find unlinked pairs
		const edgeSub = getEdgesByLibrary(libraryId).subscribe((edges: Edge[]) => {
			const linkedIds = new Set<string>();
			for (const e of edges) {
				const src = e.source_id;
				const tgt = e.target_id;
				linkedIds.add(src + '|' + tgt);
				linkedIds.add(tgt + '|' + src);
			}

			const a = thoughts[Math.floor(Math.random() * thoughts.length)];
			const unlinked = thoughts.filter(
				(th) => th.id !== a.id && !linkedIds.has(a.id + '|' + th.id)
			);
			if (unlinked.length === 0) return;

			const b = unlinked[Math.floor(Math.random() * unlinked.length)];

			// Apply V2 collision filter if set
			const filter = collisionFilter as ((a: Thought, b: Thought) => boolean) | null;
			if (filter && !filter(a, b)) return;

			nodeA = a;
			nodeB = b;
			localStorage.setItem('serendipity_a', a.id);
			localStorage.setItem('serendipity_b', b.id);
			localStorage.setItem('serendipity_last', String(now));
			visible = true;

			edgeSub.unsubscribe();
		});
	});

	// ── Create link ───────────────────────────────────────────────────────────

	async function handleCreateLink() {
		if (!nodeA || !nodeB) return;
		await createEdge(libraryId, nodeA.id, nodeB.id);
		accepted = true;
		visible = false;
		localStorage.setItem('serendipity_accepted', String(Date.now()));
	}
</script>

{#if visible && nodeA && nodeB && !accepted}
	<div class="collider" role="region" aria-label={t('feature.serendipity.heading')}>
		<span class="heading">{t('feature.serendipity.heading')}</span>
		<p class="prompt">
			{t('feature.serendipity.prompt')}
			<span class="title-a">{nodeA.title}</span>
			&amp;
			<span class="title-b">{nodeB.title}</span>
			?
		</p>
		<button class="cta-btn" onclick={handleCreateLink} type="button">
			{t('feature.serendipity.cta')}
		</button>
	</div>
{/if}

<style>
	.collider {
		margin: 0.25rem 0.75rem;
		padding: 0.625rem 0.75rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		animation: appear 200ms ease forwards;
	}

	@keyframes appear {
		from { opacity: 0; transform: translateY(4px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	.heading {
		font-size: 0.625rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.prompt {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		line-height: 1.4;
		margin: 0;
	}

	.title-a,
	.title-b {
		color: var(--text-primary);
		font-weight: 500;
	}

	.cta-btn {
		align-self: flex-start;
		background: var(--color-brand);
		color: var(--bg-deep);
		border: none;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 700;
		font-family: inherit;
		cursor: pointer;
		padding: 0.25rem 0.625rem;
		min-height: 28px;
		transition: opacity 120ms;
	}

	.cta-btn:hover {
		opacity: 0.85;
	}
</style>
