<script lang="ts">
	import { goto } from '$app/navigation';
	import { PIPELINE_STATES } from '$lib/config';
	import { getBacklinksForThought, type Thought } from '$lib/db';
	import { $t as t } from '$lib/i18n';

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		thoughtTitle: string;
	}
	let { thoughtTitle }: Props = $props();

	// ── State ─────────────────────────────────────────────────────────────────

	let backlinks = $state<Thought[]>([]);

	// ── Load backlinks on mount and on title change ───────────────────────────
	// data-thought-id set for V2 excerpt hook — reads thought ID from DOM.

	$effect(() => {
		getBacklinksForThought(thoughtTitle).then((results) => {
			backlinks = results;
		});
	});

	// ── Helper — map meta_state → PIPELINE_STATES entry ──────────────────────

	function getStage(metaState: number) {
		return PIPELINE_STATES.find((s) => s.id === metaState) ?? PIPELINE_STATES[0];
	}
</script>

{#if backlinks.length > 0}
	<div class="backlinks" style="opacity: 0; animation: backlinkIn 200ms ease forwards;">
		<p class="backlinks-heading">{t('feature.backlinks.heading')}</p>
		<ul class="backlinks-list">
			{#each backlinks as link}
				<button
					class="backlink-item"
					type="button"
					data-thought-id={link.id}
					onclick={() => goto(`/thought/${link.id}`)}
				>
					<span class="backlink-title">{link.title}</span>
					<span
						class="stage-pill"
						style="background: color-mix(in srgb, var({getStage(link.meta_state).cssVar}) 20%, transparent);
						       color: var({getStage(link.meta_state).cssVar});"
					>
						<!-- Stage colour pill — resolved via CSS var, no hex -->
					</span>
				</button>
			{/each}
		</ul>
	</div>
{/if}

<style>
	@keyframes backlinkIn {
		from { opacity: 0; }
		to   { opacity: 1; }
	}

	.backlinks {
		border-top: 1px solid var(--border);
		margin-top: 3rem;
		padding-top: 1.5rem;
		padding-bottom: 2rem;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
		width: 100%;
		padding-left: 1.5rem;
		padding-right: 1.5rem;
		box-sizing: border-box;
	}

	.backlinks-heading {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin: 0 0 0.75rem;
	}

	.backlinks-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.backlink-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		min-height: 44px;  /* mobile tap target */
		padding: 0.375rem 0.5rem;
		background: none;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition: background 120ms;
	}

	.backlink-item:hover {
		background: var(--bg-hover);
	}

	.backlink-title {
		font-size: 0.875rem;
		color: var(--text-primary);
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.stage-pill {
		display: inline-flex;
		align-items: center;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}
</style>
