<script lang="ts">
	import { $t as t } from '$lib/i18n';
	import { PIPELINE_STATES } from '$lib/config';
	import type { Thought } from '$lib/db';

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		thoughts: Thought[];
	}
	let { thoughts }: Props = $props();

	// ── Derived ──────────────────────────────────────────────────────────────

	const total = $derived(thoughts.length);

	const stagePcts = $derived(
		PIPELINE_STATES.map((s) => {
			const count = thoughts.filter((th) => th.meta_state === s.id).length;
			return {
				id: s.id,
				cssVar: s.cssVar,
				label: t(`stage.${s.id}`),
				count,
				pct: total > 0 ? count / total : 0,
			};
		})
	);
</script>

{#if total > 0}
	<div class="momentum" aria-label={t('momentum.label')}>
		<p class="momentum-heading">{t('momentum.label')}</p>
		{#each stagePcts as stage}
			<div class="bar-row">
				<span class="bar-label">{stage.label}</span>
				<div class="bar-track">
					<div
						class="bar-fill"
						style="
							transform: scaleX({stage.pct});
							background: var({stage.cssVar});
						"
					></div>
				</div>
				<span class="bar-pct">{Math.round(stage.pct * 100)}%</span>
			</div>
		{/each}
	</div>
{/if}

<style>
	.momentum {
		padding: 0.5rem 0;
	}

	.momentum-heading {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		padding: 0.5rem 1rem 0.375rem;
		margin: 0;
	}

	.bar-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 1rem;
		min-height: 28px;
	}

	.bar-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		min-width: 3.5rem;
		flex-shrink: 0;
	}

	.bar-track {
		flex: 1;
		max-width: var(--momentum-bar-width);
		height: 6px;
		background: var(--bg-hover);
		border-radius: 3px;
		overflow: hidden;
	}

	.bar-fill {
		width: 100%;
		height: 100%;
		border-radius: 3px;
		transform-origin: left;
		transition: transform 300ms;
	}

	.bar-pct {
		font-size: 0.6875rem;
		color: var(--text-muted);
		min-width: 2.5rem;
		text-align: right;
	}
</style>
