<script lang="ts">
	import { onMount } from 'svelte';
	import { $t as t } from '$lib/i18n';
	import { FEATURE_CONFIG } from '$lib/config';

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		thoughts: { updated_at: string }[];
	}
	let { thoughts }: Props = $props();

	// ── State ─────────────────────────────────────────────────────────────────

	// RGBA values resolved from CSS var on mount — never hardcoded
	let brandR = $state(34);
	let brandG = $state(211);
	let brandB = $state(238);

	onMount(() => {
		const style = getComputedStyle(document.documentElement);
		const raw = style.getPropertyValue('--color-brand').trim();
		// Parse hex → r,g,b. Falls back to defaults above if parsing fails.
		const match = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(raw);
		if (match) {
			brandR = parseInt(match[1], 16);
			brandG = parseInt(match[2], 16);
			brandB = parseInt(match[3], 16);
		}
	});

	// ── Bucket thoughts into calendar days ────────────────────────────────────

	const DAYS = FEATURE_CONFIG.THERMAL_CALENDAR_DAYS;

	const buckets = $derived(() => {
		const now = Date.now();
		const counts = new Array<number>(DAYS).fill(0);
		for (const th of thoughts) {
			const ts = new Date(th.updated_at).getTime();
			const dayAgo = Math.floor((now - ts) / 86_400_000);
			if (dayAgo >= 0 && dayAgo < DAYS) {
				counts[DAYS - 1 - dayAgo]++;
			}
		}
		return counts;
	});

	// ── Level mapping ─────────────────────────────────────────────────────────

	function level(count: number): 0 | 1 | 2 | 3 | 4 {
		if (count === 0) return 0;
		if (count <= 2)  return 1;
		if (count <= 5)  return 2;
		if (count <= 10) return 3;
		return 4;
	}

	function cellBackground(count: number): string {
		const l = level(count);
		if (l === 0) return 'var(--bg-surface)';
		const alpha = l === 1 ? 0.25 : l === 2 ? 0.55 : l === 3 ? 0.80 : 1.0;
		return `rgba(${brandR},${brandG},${brandB},${alpha})`;
	}
</script>

{#if thoughts.length > 0}
	<div class="calendar" aria-label={t('feature.calendar.heading')}>
		<span class="cal-heading">{t('feature.calendar.heading')}</span>
		<div class="grid" style="--cols: 7; --rows: {Math.ceil(DAYS / 7)}">
			{#each buckets() as count, i}
				<div
					class="cell"
					style="background: {cellBackground(count)}"
					title="{count} thought{count !== 1 ? 's' : ''} on day {i + 1}"
					aria-label="{count} thought{count !== 1 ? 's' : ''}"
					role="img"
				></div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.calendar {
		padding: 0.5rem 1rem 0.375rem;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.cal-heading {
		font-size: 0.625rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(var(--cols), 10px);
		grid-template-rows: repeat(var(--rows), 10px);
		gap: 3px;
	}

	.cell {
		width: 10px;
		height: 10px;
		border-radius: 2px;
		transition: opacity 120ms;
	}

	.cell:hover {
		opacity: 0.75;
	}
</style>
