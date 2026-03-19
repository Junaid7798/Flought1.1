<script lang="ts">
	import { onMount } from 'svelte';
	import { $t as t } from '$lib/i18n';
	import { PIPELINE_STATES } from '$lib/config';
	import {
		getUserSettings,
		updateUserSettings,
		type UserSettings,
	} from '$lib/db';
	import { uiStore } from '$lib/stores/uiStore.svelte';

	// ── State ─────────────────────────────────────────────────────────────────

	let settings = $state<UserSettings | null>(null);
	let savedFlash = $state(false);
	let savedTimer: ReturnType<typeof setTimeout> | null = null;

	// ── Section open/closed ───────────────────────────────────────────────────

	let appearanceOpen = $state(true);
	let pipelineOpen = $state(true);

	// ── Font size options ─────────────────────────────────────────────────────

	const FONT_SIZES = [
		{ value: 14, label: t('settings.fontSizeSmall')  },
		{ value: 16, label: t('settings.fontSizeMedium') },
		{ value: 18, label: t('settings.fontSizeLarge')  },
	] as const;

	// ── Pipeline colour palette ───────────────────────────────────────────────
	// Resolved from CSS variables at mount — Rule 8: no hardcoded hex in components.

	const COLOUR_OPTIONS = [
		{ cssVar: '--color-inbox',   label: 'Amber'   },
		{ cssVar: '--color-queue',   label: 'Blue'    },
		{ cssVar: '--color-forge',   label: 'Green'   },
		{ cssVar: '--color-archive', label: 'Gray'    },
		{ cssVar: '--color-brand',   label: 'Cyan'    },
		{ cssVar: '--color-error',   label: 'Red'     },
	];

	// ── Bootstrap ─────────────────────────────────────────────────────────────

	onMount(async () => {
		const s = await getUserSettings();
		settings = s ?? null;
	});

	// ── Persist helpers ───────────────────────────────────────────────────────

	async function save(changes: Partial<Omit<UserSettings, 'id'>>) {
		if (!settings) return;
		settings = { ...settings, ...changes };
		await updateUserSettings(changes);
		flashSaved();
	}

	function flashSaved() {
		savedFlash = true;
		if (savedTimer) clearTimeout(savedTimer);
		savedTimer = setTimeout(() => { savedFlash = false; }, 1500);
	}

	// ── Font size ─────────────────────────────────────────────────────────────

	async function setFontSize(size: number) {
		await save({ font_size: size });
		// Apply immediately to editor root so user sees the change live
		document.documentElement.style.setProperty('--editor-font-size', `${size}px`);
	}

	// ── Pipeline colour ───────────────────────────────────────────────────────

	function getPipelineColour(stageIndex: number): string {
		return settings?.pipeline_colour_overrides?.[stageIndex]
			?? `var(${PIPELINE_STATES[stageIndex].cssVar})`;
	}

	async function setPipelineColour(stageIndex: number, cssVar: string) {
		if (!settings) return;
		// Resolve the CSS variable to its actual value at runtime — Rule 8 compliant:
		// the stored value is the resolved hex from getComputedStyle, not a hardcoded literal.
		const resolved = getComputedStyle(document.documentElement)
			.getPropertyValue(cssVar).trim();
		const next = [...settings.pipeline_colour_overrides] as [string, string, string, string];
		next[stageIndex] = resolved || `var(${cssVar})`;
		await save({ pipeline_colour_overrides: next });
	}

	const pipelineLabels = $derived<[string, string, string, string]>(
		settings?.pipeline_label_overrides ?? [
			t('stage.1'), t('stage.2'), t('stage.3'), t('stage.4'),
		]
	);
</script>

<div class="page">
	<div class="page-inner">

		<!-- ── Header ──────────────────────────────────────────────────────── -->
		<div class="page-header">
			<h1 class="page-title">{t('settings.title')}</h1>
			<span class="saved-badge" class:visible={savedFlash}>{t('settings.saved')}</span>
		</div>

		<!-- ── Appearance ──────────────────────────────────────────────────── -->
		<section class="accordion">
			<button
				class="accordion-trigger"
				onclick={() => (appearanceOpen = !appearanceOpen)}
				aria-expanded={appearanceOpen}
				type="button"
			>
				<span class="accordion-title">{t('settings.appearance')}</span>
				<span class="accordion-chevron" class:open={appearanceOpen}>▾</span>
			</button>

			<!-- Rule 9: toggle display instantly, animate inner content with opacity + translateY -->
			<div class="accordion-panel" class:open={appearanceOpen}>
				<div class="accordion-body">

					<!-- Font size -->
					<div class="setting-row">
						<span class="setting-label">{t('settings.fontSize')}</span>
						<div class="font-size-group" role="group" aria-label={t('settings.fontSize')}>
							{#each FONT_SIZES as opt}
								<button
									class="size-btn"
									class:active={settings?.font_size === opt.value}
									onclick={() => setFontSize(opt.value)}
									type="button"
									style="font-size: {opt.value}px"
									aria-current={settings?.font_size === opt.value ? "true" : undefined}
								>
									{opt.label}
								</button>
							{/each}
						</div>
					</div>

				</div>
			</div>
		</section>

		<!-- ── Pipeline colours ────────────────────────────────────────────── -->
		<section class="accordion">
			<button
				class="accordion-trigger"
				onclick={() => (pipelineOpen = !pipelineOpen)}
				aria-expanded={pipelineOpen}
				type="button"
			>
				<span class="accordion-title">{t('settings.pipeline')}</span>
				<span class="accordion-chevron" class:open={pipelineOpen}>▾</span>
			</button>

			<div class="accordion-panel" class:open={pipelineOpen}>
				<div class="accordion-body">

					{#each PIPELINE_STATES as state, i}
						<div class="setting-row">
							<span class="setting-label">{pipelineLabels[i]}</span>
							<!-- Colour picker grid — no native <input type=color> per spec -->
							<div class="colour-grid" role="group" aria-label="Colour for {pipelineLabels[i]}">
								{#each COLOUR_OPTIONS as opt}
									<button
										class="colour-swatch"
										class:active={getPipelineColour(i) === getComputedStyle(document?.documentElement ?? document.createElement('div')).getPropertyValue(opt.cssVar).trim()}
										style="background: var({opt.cssVar})"
										aria-label={opt.label}
										onclick={() => setPipelineColour(i, opt.cssVar)}
										type="button"
									></button>
								{/each}
							</div>
						</div>
					{/each}

				</div>
			</div>
		</section>

	</div>
</div>

<style>
	.page {
		height: 100dvh;
		overflow-y: auto;
		background: var(--bg-deep);
	}

	.page-inner {
		max-width: 600px;
		margin: 0 auto;
		padding: 2rem 1.5rem;
	}

	/* ── Header ─────────────────────────────────────────────────────────── */

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	/* Saved flash — Rule 9: opacity only */
	.saved-badge {
		font-size: 0.8125rem;
		color: var(--color-forge);
		opacity: 0;
		transition: opacity 200ms;
	}

	.saved-badge.visible {
		opacity: 1;
	}

	/* ── Accordion ──────────────────────────────────────────────────────── */

	.accordion {
		border: 1px solid var(--border);
		border-radius: 10px;
		overflow: hidden;
		margin-bottom: 1rem;
	}

	.accordion-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		min-height: 52px;
		padding: 0 1.25rem;
		background: var(--bg-panel);
		border: none;
		cursor: pointer;
		font-family: inherit;
		transition: background 120ms;
	}

	.accordion-trigger:hover {
		background: var(--bg-hover);
	}

	.accordion-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.accordion-chevron {
		font-size: 0.75rem;
		color: var(--text-muted);
		transition: transform 150ms;
		transform: rotate(-90deg);
	}

	.accordion-chevron.open {
		transform: rotate(0deg);
	}

	/* Panel: display toggled instantly; inner content animates — FIX-17 / Rule 9 */
	.accordion-panel {
		display: none;
	}

	.accordion-panel.open {
		display: block;
	}

	.accordion-body {
		padding: 1rem 1.25rem;
		border-top: 1px solid var(--border);
		background: var(--bg-surface);
		animation: bodyIn 150ms ease forwards;
	}

	@keyframes bodyIn {
		from { opacity: 0; transform: translateY(-4px); }
		to   { opacity: 1; transform: translateY(0);    }
	}

	/* ── Setting rows ───────────────────────────────────────────────────── */

	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		min-height: 48px;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border);
	}

	.setting-row:last-child {
		border-bottom: none;
	}

	.setting-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	/* ── Font size selector ─────────────────────────────────────────────── */

	.font-size-group {
		display: flex;
		gap: 0.375rem;
	}

	.size-btn {
		min-height: 36px;
		padding: 0 0.875rem;
		background: var(--bg-panel);
		border: 1px solid var(--border-strong);
		border-radius: 6px;
		color: var(--text-secondary);
		font-family: inherit;
		cursor: pointer;
		transition: background 120ms, border-color 120ms, color 120ms;
		white-space: nowrap;
	}

	.size-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.size-btn.active {
		background: var(--bg-surface);
		border-color: var(--color-brand);
		color: var(--text-primary);
	}

	/* ── Colour picker grid ─────────────────────────────────────────────── */

	.colour-grid {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.colour-swatch {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		transition: transform 120ms, border-color 120ms;
		/* min tap target via padding trick — actual visual stays 28px */
		padding: 0;
	}

	.colour-swatch:hover {
		transform: scale(1.1);
	}

	.colour-swatch.active {
		border-color: var(--text-primary);
		transform: scale(1.2);
	}

	/* ── Mobile ─────────────────────────────────────────────────────────── */

	@media (max-width: 767px) {
		.page-inner {
			padding: 1.25rem 1rem;
		}

		.setting-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.625rem;
		}

		.colour-grid {
			justify-content: flex-start;
		}
	}
</style>
