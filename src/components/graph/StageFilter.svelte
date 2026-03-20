<script lang="ts">
	import { PIPELINE_STATES } from '$lib/config';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { $t as t } from '$lib/i18n';

	const stages = PIPELINE_STATES;
</script>
<div class="stage-filter" role="group" aria-label="Filter by stage">
	{#each stages as stage}
		<button
			class="stage-dot"
			class:active={uiStore.focusedStageId === stage.id}
			style:--accent={stage.colour}
			onclick={() => {
				if (uiStore.focusedStageId === stage.id) {
					uiStore.focusedStageId = null;
				} else {
					uiStore.focusedStageId = stage.id;
				}
			}}
			title={t('stage.' + stage.id)}
		>
			<span class="dot"></span>
			<span class="label">{t('stage.' + stage.id)}</span>
		</button>
	{/each}
</div>

<style>
	.stage-filter {
		display: flex;
		gap: 0.5rem;
		background: var(--glass-panel);
		backdrop-filter: var(--glass-blur-sm);
		-webkit-backdrop-filter: var(--glass-blur-sm);
		border: 1px solid var(--border-strong);
		padding: 0.375rem;
		border-radius: 20px;
		pointer-events: auto;
	}

	.stage-dot {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.75rem 0.25rem 0.375rem;
		border-radius: 14px;
		border: 1px solid transparent;
		background: none;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
		color: var(--text-muted);
	}

	.stage-dot:hover {
		background: var(--bg-hover);
		color: var(--text-secondary);
	}

	.stage-dot.active {
		background: var(--accent);
		color: var(--text-primary);
		border-color: rgba(255,255,255,0.1);
		font-weight: 700;
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 10px var(--accent);
		transition: transform 0.2s;
	}

	.stage-dot.active .dot {
		background: var(--bg-deep);
		box-shadow: none;
		transform: scale(0.8);
	}

	.label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	@media (max-width: 600px) {
		.label {
			display: none;
		}
		.stage-dot {
			padding: 0.4rem;
		}
		.stage-filter {
			gap: 0.25rem;
		}
	}
</style>
