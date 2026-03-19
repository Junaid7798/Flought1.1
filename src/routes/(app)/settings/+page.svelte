<script lang="ts">
	import { onMount } from 'svelte';
	import { ChevronDown } from 'lucide-svelte';
	import { Capacitor } from '@capacitor/core';
	import { Keyboard } from '@capacitor/keyboard';
	import { $t as t } from '$lib/i18n';
	import { PIPELINE_STATES, INPUT_CONSTRAINTS } from '$lib/config';
	import { initializeShortcuts, DEFAULT_BINDINGS } from '$lib/ShortcutManager';
	import type { Action } from '$lib/ShortcutManager';
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
	let pipelineOpen   = $state(true);
	let shortcutsOpen  = $state(true);

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

	// ── Platform capability ───────────────────────────────────────────────────
	// Computed once — stable for the lifetime of this component.
	// userAgent is used (not deprecated navigator.platform).
	// isDesktopCapable: true on desktop browsers + Tauri; false on Android/iOS + touch-only Web.

	const isMac            = /Mac|iPhone|iPod|iPad/.test(navigator.userAgent);
	const isDesktopCapable = !Capacitor.isNativePlatform() && !window.matchMedia('(hover: none)').matches;

	// ── Stage label drafts ────────────────────────────────────────────────────

	let labelDrafts = $state<[string, string, string, string]>(['', '', '', '']);

	// ── Keyboard shortcut recorder ────────────────────────────────────────────

	let recordingAction = $state<Action | null>(null);
	let recordError     = $state('');

	// Action metadata — UI-only, not stored, not reactive
	const ACTION_META = [
		{ id: 'commandPalette' as Action, labelKey: 'shortcuts.commandPalette', descKey: 'shortcuts.commandPalette.desc' },
		{ id: 'newThought'     as Action, labelKey: 'shortcuts.newThought',     descKey: 'shortcuts.newThought.desc'     },
		{ id: 'focusSearch'    as Action, labelKey: 'shortcuts.focusSearch',    descKey: 'shortcuts.focusSearch.desc'    },
		{ id: 'goMap'          as Action, labelKey: 'shortcuts.goMap',          descKey: 'shortcuts.goMap.desc'          },
		{ id: 'goEditor'       as Action, labelKey: 'shortcuts.goEditor',       descKey: 'shortcuts.goEditor.desc'       },
		{ id: 'goFocus'        as Action, labelKey: 'shortcuts.goFocus',        descKey: 'shortcuts.goFocus.desc'        },
	] as const;

	// ── Bootstrap ─────────────────────────────────────────────────────────────

	onMount(async () => {
		const s = await getUserSettings();
		settings = s ?? null;

		// Populate label drafts from DB (fall back to i18n defaults)
		labelDrafts = (s?.pipeline_label_overrides as [string,string,string,string]) ?? [
			t('stage.1'), t('stage.2'), t('stage.3'), t('stage.4'),
		];

		// Sync theme into uiStore (layout already bootstrapped the class, but uiStore
		// might be stale if user navigated directly to /settings)
		if (s?.theme) uiStore.theme = s.theme as 'midnight' | 'light';

		// iOS only: force blur when the native keyboard is dismissed via "Done" button
		// so onblur fires and stage labels save correctly.
		// This pattern is already used in MobileDock.svelte.
		if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
			Keyboard.addListener('keyboardWillHide', () => {
				(document.activeElement as HTMLElement)?.blur();
			});
		}
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

	// ── Theme ─────────────────────────────────────────────────────────────────

	async function setTheme(theme: 'midnight' | 'light') {
		uiStore.theme = theme;
		document.documentElement.classList.toggle('theme-light', theme === 'light');
		// Persist to localStorage so app.html inline script prevents flash on reload
		try {
			if (theme === 'light') localStorage.setItem('flought_theme', 'light');
			else localStorage.removeItem('flought_theme');
		} catch (_) {}
		await save({ theme });
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

	// ── Stage label ───────────────────────────────────────────────────────────
	// Saved on blur only — never on keystroke (performance rule).

	async function saveLabelAt(i: number) {
		const trimmed = labelDrafts[i].trim();
		if (!trimmed) {
			// Revert to saved value if user clears the field
			labelDrafts[i] = settings?.pipeline_label_overrides?.[i] ?? t(`stage.${i + 1}`);
			return;
		}
		const current = (settings?.pipeline_label_overrides ?? [
			t('stage.1'), t('stage.2'), t('stage.3'), t('stage.4'),
		]) as [string, string, string, string];
		const next = [...current] as [string, string, string, string];
		next[i] = trimmed;
		await save({ pipeline_label_overrides: next });
	}

	// ── Keyboard shortcuts ────────────────────────────────────────────────────
	// Only active when isDesktopCapable — not called from mobile template paths.

	function buildCombo(e: KeyboardEvent): string {
		const parts: string[] = [];
		if (e.metaKey)              parts.push(isMac ? 'cmd' : 'ctrl');
		if (e.ctrlKey && !e.metaKey) parts.push('ctrl');
		if (e.altKey)               parts.push('alt');
		if (e.shiftKey)             parts.push('shift');
		parts.push(e.key.toLowerCase());
		return parts.join('+');
	}

	function getDisplayBinding(actionId: Action): string {
		const raw = settings?.keyboard_shortcuts?.[actionId] ?? DEFAULT_BINDINGS[actionId];
		return raw
			.replace('cmd',   isMac ? '⌘' : 'Ctrl')
			.replace('ctrl',  'Ctrl')
			.replace('alt',   isMac ? '⌥' : 'Alt')
			.replace('shift', '⇧')
			.split('+')
			.map(p => p.length === 1 ? p.toUpperCase() : p)
			.join('+');
	}

	function startRecording(actionId: Action) {
		recordingAction = actionId;
		recordError = '';

		function captureKey(e: KeyboardEvent) {
			e.preventDefault();
			e.stopPropagation();

			// Ignore bare modifier presses — wait for the actual key
			if (['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) return;

			// Escape = cancel recording
			if (e.key === 'Escape') {
				window.removeEventListener('keydown', captureKey, true);
				recordingAction = null;
				return;
			}

			// Require at least one modifier key
			if (!e.metaKey && !e.ctrlKey && !e.altKey) {
				recordError = t('shortcuts.errorNoModifier');
				window.removeEventListener('keydown', captureKey, true);
				recordingAction = null;
				return;
			}

			// Block OS-reserved combos
			const combo = buildCombo(e);
			const forbidden = ['cmd+w', 'cmd+q', 'ctrl+w', 'ctrl+q', 'ctrl+alt+delete'];
			if (forbidden.includes(combo)) {
				recordError = t('shortcuts.errorForbidden');
				window.removeEventListener('keydown', captureKey, true);
				recordingAction = null;
				return;
			}

			window.removeEventListener('keydown', captureKey, true);
			commitShortcut(actionId, combo);
		}

		window.addEventListener('keydown', captureKey, true); // capture phase
	}

	async function commitShortcut(actionId: Action, rawCombo: string) {
		const next = { ...(settings?.keyboard_shortcuts ?? {}), [actionId]: rawCombo };
		await save({ keyboard_shortcuts: next });
		initializeShortcuts(next); // re-applies bindings in ShortcutManager without re-attaching listener
		recordingAction = null;
		recordError = '';
	}

	async function resetShortcut(actionId: Action) {
		const next = { ...(settings?.keyboard_shortcuts ?? {}) };
		delete next[actionId]; // ShortcutManager falls back to DEFAULT_BINDINGS for missing keys
		await save({ keyboard_shortcuts: next });
		initializeShortcuts(next);
	}

	function isDefaultBinding(actionId: Action): boolean {
		const current = settings?.keyboard_shortcuts?.[actionId];
		return !current || current === DEFAULT_BINDINGS[actionId];
	}

	// ── Pipeline labels (derived) ─────────────────────────────────────────────

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
				<span class="accordion-chevron" class:open={appearanceOpen}>
					<ChevronDown size={15} strokeWidth={2} />
				</span>
			</button>

			<div class="accordion-panel" class:open={appearanceOpen}>
				<div class="accordion-body">

					<!-- Theme -->
					<div class="setting-row">
						<span class="setting-label">{t('settings.theme')}</span>
						<div class="font-size-group" role="group" aria-label={t('settings.theme')}>
							{#each [['midnight', t('settings.themeMidnight')], ['light', t('settings.themeLight')]] as [val, label]}
								<button
									class="size-btn"
									class:active={uiStore.theme === val}
									onclick={() => setTheme(val as 'midnight' | 'light')}
									type="button"
									aria-current={uiStore.theme === val ? 'true' : undefined}
								>{label}</button>
							{/each}
						</div>
					</div>

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

		<!-- ── Pipeline colours + labels ───────────────────────────────────── -->
		<section class="accordion">
			<button
				class="accordion-trigger"
				onclick={() => (pipelineOpen = !pipelineOpen)}
				aria-expanded={pipelineOpen}
				type="button"
			>
				<span class="accordion-title">{t('settings.pipeline')}</span>
				<span class="accordion-chevron" class:open={pipelineOpen}>
					<ChevronDown size={15} strokeWidth={2} />
				</span>
			</button>

			<div class="accordion-panel" class:open={pipelineOpen}>
				<div class="accordion-body">

					<!-- Stage colour pickers -->
					{#each PIPELINE_STATES as state, i}
						<div class="setting-row">
							<span class="setting-label">{pipelineLabels[i]}</span>
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

					<!-- Stage label rename inputs -->
					<!-- Saved on blur only — never on keystroke (performance rule) -->
					<!-- scrollIntoView on focus ensures the field is visible above the iOS virtual keyboard -->
					<div class="setting-row stage-labels-row">
						<span class="setting-label">{t('settings.stageLabels')}</span>
						<div class="stage-label-inputs">
							{#each PIPELINE_STATES as state, i}
								<div class="stage-label-item">
									<span class="stage-dot" style="background: var({state.cssVar})"></span>
									<input
										class="stage-label-input"
										type="text"
										bind:value={labelDrafts[i]}
										placeholder={t('settings.stageLabelPlaceholder')}
										maxlength={INPUT_CONSTRAINTS.stageLabelMaxLength}
										aria-label="Name for stage {i + 1}"
										onfocus={(e) => (e.target as HTMLElement)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })}
										onblur={() => saveLabelAt(i)}
									/>
								</div>
							{/each}
						</div>
					</div>

				</div>
			</div>
		</section>

		<!-- ── Keyboard Shortcuts ───────────────────────────────────────────── -->
		<!-- Shown only on desktop-capable platforms (desktop browsers + Tauri).  -->
		<!-- Hidden on Android/iOS Capacitor and touch-only Web PWA.              -->
		{#if isDesktopCapable}
		<section class="accordion">
			<button
				class="accordion-trigger"
				onclick={() => (shortcutsOpen = !shortcutsOpen)}
				aria-expanded={shortcutsOpen}
				type="button"
			>
				<span class="accordion-title">{t('settings.shortcuts')}</span>
				<span class="accordion-chevron" class:open={shortcutsOpen}>
					<ChevronDown size={15} strokeWidth={2} />
				</span>
			</button>

			<div class="accordion-panel" class:open={shortcutsOpen}>
				<div class="accordion-body">
					<p class="shortcuts-hint">{t('settings.shortcutsHint')}</p>

					{#each ACTION_META as action}
						<div class="setting-row shortcut-row">
							<div class="shortcut-info">
								<span class="setting-label">{t(action.labelKey)}</span>
								<span class="shortcut-desc">{t(action.descKey)}</span>
							</div>
							<div class="shortcut-controls">
								<kbd class="kbd">{getDisplayBinding(action.id)}</kbd>
								<button
									class="size-btn record-btn"
									class:recording={recordingAction === action.id}
									onclick={() => startRecording(action.id)}
									disabled={recordingAction !== null && recordingAction !== action.id}
									type="button"
									aria-label="Record shortcut for {t(action.labelKey)}"
								>
									{recordingAction === action.id ? t('shortcuts.recording') : t('shortcuts.record')}
								</button>
								{#if !isDefaultBinding(action.id)}
									<button
										class="reset-link"
										onclick={() => resetShortcut(action.id)}
										type="button"
									>{t('shortcuts.reset')}</button>
								{/if}
							</div>
						</div>
					{/each}

					{#if recordError}
						<p class="error-text">{recordError}</p>
					{/if}
				</div>
			</div>
		</section>
		{/if}

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
		display: flex;
		align-items: center;
		color: var(--text-muted);
		transition: transform 150ms;
		transform: rotate(-90deg);
	}

	.accordion-chevron.open {
		transform: rotate(0deg);
	}

	/* Panel: display toggled instantly; inner content animates — Rule 9 */
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

	/* ── Font size / theme selector ─────────────────────────────────────── */

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
		padding: 0;
	}

	.colour-swatch:hover {
		transform: scale(1.1);
	}

	.colour-swatch.active {
		border-color: var(--text-primary);
		transform: scale(1.2);
	}

	/* ── Stage label inputs ─────────────────────────────────────────────── */

	.stage-labels-row {
		align-items: flex-start;
		padding-top: 0.75rem;
	}

	.stage-label-inputs {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 200px;
	}

	.stage-label-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.stage-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.stage-label-input {
		flex: 1;
		background: var(--bg-panel);
		border: 1px solid var(--border-strong);
		border-radius: 6px;
		color: var(--text-primary);
		font-family: inherit;
		font-size: 0.875rem;
		padding: 0.375rem 0.625rem;
		min-height: 44px; /* mobile tap target minimum */
		outline: none;
		transition: border-color 120ms;
	}

	.stage-label-input:focus {
		border-color: var(--color-brand);
	}

	/* ── Keyboard shortcuts ─────────────────────────────────────────────── */

	.shortcuts-hint {
		font-size: 0.8125rem;
		color: var(--text-muted);
		margin: 0 0 0.75rem;
	}

	.shortcut-row {
		align-items: center;
		gap: 0.75rem;
	}

	.shortcut-info {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		flex: 1;
		min-width: 0;
	}

	.shortcut-desc {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.shortcut-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	/* Keyboard badge */
	.kbd {
		display: inline-flex;
		align-items: center;
		padding: 0.2rem 0.5rem;
		background: var(--bg-panel);
		border: 1px solid var(--border-strong);
		border-radius: 4px;
		font-family: monospace;
		font-size: 0.75rem;
		color: var(--text-secondary);
		white-space: nowrap;
		user-select: none;
	}

	/* Record button */
	.record-btn {
		min-height: 32px;
		padding: 0 0.75rem;
		font-size: 0.8125rem;
	}

	.record-btn.recording {
		border-color: var(--color-brand);
		color: var(--color-brand);
		animation: recordPulse 1s ease-in-out infinite;
	}

	/* Rule 9: opacity-only animation */
	@keyframes recordPulse {
		0%, 100% { opacity: 1; }
		50%       { opacity: 0.5; }
	}

	/* Reset link */
	.reset-link {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 0.75rem;
		font-family: inherit;
		cursor: pointer;
		padding: 0.25rem 0.375rem;
		border-radius: 4px;
		transition: color 120ms;
	}

	.reset-link:hover {
		color: var(--color-error);
	}

	/* Error message */
	.error-text {
		font-size: 0.8125rem;
		color: var(--color-error);
		margin: 0.5rem 0 0;
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

		.shortcut-row {
			flex-direction: column;
			align-items: flex-start;
		}

		.shortcut-controls {
			width: 100%;
			justify-content: flex-start;
		}
	}
</style>
