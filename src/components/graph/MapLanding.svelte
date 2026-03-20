<script lang="ts">
	import { $t as t } from '$lib/i18n';
	import { PIPELINE_STATES } from '$lib/config';
	import { uiStore } from '$lib/stores/uiStore.svelte';

	// ── Props ─────────────────────────────────────────────────────────────────
	interface Props {
		stageCounts: Record<number, number>;
		totalCount: number;
		onSelectStage: (stageId: number | null) => void;
	}
	let { stageCounts, totalCount, onSelectStage }: Props = $props();

	// ── Orb data (exclude Archive = stage 4) ─────────────────────────────────
	const activeStages = PIPELINE_STATES.filter(s => s.id !== 4);

	let exiting = $state(false);

	function selectOrb(stageId: number | null) {
		exiting = true;
		setTimeout(() => onSelectStage(stageId), 400);
	}
</script>

<div class="landing-overlay" class:exiting>
	<!-- Ambient glow behind the full-graph orb -->
	<div class="ambient-glow"></div>

	<!-- Full Graph Orb -->
	<button
		class="orb orb-full"
		type="button"
		onclick={() => selectOrb(null)}
		aria-label={t('map.landing.fullGraph')}
	>
		<span class="orb-ring"></span>
		<span class="orb-count">{totalCount}</span>
		<span class="orb-label">{t('map.landing.fullGraph')}</span>
	</button>

	<p class="explore-hint">{t('map.landing.explore')}</p>

	<!-- Stage orbs row -->
	<div class="stage-row">
		{#each activeStages as stage (stage.id)}
			{@const count = stageCounts[stage.id] ?? 0}
			<button
				class="orb orb-stage"
				type="button"
				style="--orb-color: {stage.colour}"
				onclick={() => selectOrb(stage.id)}
				aria-label={t(`stage.${stage.id}`)}
			>
				<span class="orb-ring"></span>
				<span class="orb-count">{count}</span>
				<span class="orb-label">{t(`stage.${stage.id}`)}</span>
			</button>
		{/each}
	</div>

	<!-- Archive text link -->
	<button
		class="archive-link"
		type="button"
		onclick={() => selectOrb(4)}
	>
		{t('map.landing.archive')} ({stageCounts[4] ?? 0})
	</button>
</div>

<style>
	.landing-overlay {
		position: absolute;
		inset: 0;
		z-index: 20;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		background: rgba(6, 6, 14, 0.75);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		transition: opacity 0.4s ease, transform 0.4s ease;
	}

	.landing-overlay.exiting {
		opacity: 0;
		transform: scale(1.05);
		pointer-events: none;
	}

	/* ── Ambient glow ───────────────────────────────────────────────────── */

	.ambient-glow {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 320px;
		height: 320px;
		transform: translate(-50%, -60%);
		border-radius: 50%;
		background: radial-gradient(circle, rgba(34, 211, 238, 0.08) 0%, transparent 70%);
		pointer-events: none;
		animation: pulse-glow 4s ease-in-out infinite;
	}

	@keyframes pulse-glow {
		0%, 100% { opacity: 0.6; transform: translate(-50%, -60%) scale(1); }
		50% { opacity: 1; transform: translate(-50%, -60%) scale(1.1); }
	}

	/* ── Orb base ───────────────────────────────────────────────────────── */

	.orb {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border: none;
		background: none;
		cursor: pointer;
		transition: transform 0.25s ease;
	}

	.orb:hover {
		transform: scale(1.08);
	}

	.orb:active {
		transform: scale(0.96);
	}

	.orb-ring {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		border: 2px solid var(--orb-color, var(--color-brand));
		opacity: 0.5;
		transition: opacity 0.2s, box-shadow 0.2s;
	}

	.orb:hover .orb-ring {
		opacity: 1;
		box-shadow: 0 0 20px var(--orb-color, var(--color-brand)),
		            0 0 40px color-mix(in srgb, var(--orb-color, var(--color-brand)) 30%, transparent);
	}

	/* ── Full Graph orb ────────────────────────────────────────────────── */

	.orb-full {
		--orb-color: var(--color-brand);
		width: 140px;
		height: 140px;
		border-radius: 50%;
	}

	.orb-full .orb-count {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-brand);
		line-height: 1;
	}

	.orb-full .orb-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-top: 4px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	/* ── Stage orbs ────────────────────────────────────────────────────── */

	.stage-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2rem;
	}

	.orb-stage {
		width: 80px;
		height: 80px;
		border-radius: 50%;
	}

	.orb-stage .orb-count {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--orb-color);
		line-height: 1;
	}

	.orb-stage .orb-label {
		font-size: 0.65rem;
		color: var(--text-muted);
		margin-top: 2px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* ── Explore hint ──────────────────────────────────────────────────── */

	.explore-hint {
		font-size: 0.8125rem;
		color: var(--text-muted);
		margin: 0;
		letter-spacing: 0.02em;
	}

	/* ── Archive link ──────────────────────────────────────────────────── */

	.archive-link {
		margin-top: 0.5rem;
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 0.75rem;
		cursor: pointer;
		text-decoration: underline;
		text-decoration-color: transparent;
		text-underline-offset: 3px;
		transition: color 0.2s, text-decoration-color 0.2s;
	}

	.archive-link:hover {
		color: var(--text-secondary);
		text-decoration-color: var(--text-secondary);
	}

	/* ── Mobile ─────────────────────────────────────────────────────────── */

	@media (max-width: 767px) {
		.landing-overlay {
			gap: 1rem;
			padding: 1rem;
		}

		.orb-full {
			width: 110px;
			height: 110px;
		}

		.orb-full .orb-count {
			font-size: 1.5rem;
		}

		.stage-row {
			gap: 1.25rem;
		}

		.orb-stage {
			width: 64px;
			height: 64px;
		}

		.orb-stage .orb-count {
			font-size: 1rem;
		}
	}
</style>
