<script lang="ts">
	import { onMount } from 'svelte';
	import { Capacitor } from '@capacitor/core';
	import { Haptics, ImpactStyle } from '@capacitor/haptics';
	import { $t as t } from '$lib/i18n';
	import { PIPELINE_STATES } from '$lib/config';
	import { parseFrontmatter, serializeFrontmatter } from '$lib/frontmatterParser';
	import {
		getThought,
		getUserSettings,
		updateThought,
		type Thought,
		type UserSettings,
	} from '$lib/db';
	import { eventBus } from '$lib/eventBus';

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		thoughtId: string;
	}
	let { thoughtId }: Props = $props();

	// ── State ─────────────────────────────────────────────────────────────────

	let thought = $state<Thought | null>(null);
	let settings = $state<UserSettings | null>(null);
	let yamlData = $state<Record<string, unknown>>({});

	// ── Pipeline labels (settings overrides or i18n fallback) ─────────────────

	const pipelineLabels = $derived<[string, string, string, string]>(
		settings?.pipeline_label_overrides ?? [t('stage.1'), t('stage.2'), t('stage.3'), t('stage.4')]
	);

	// ── Custom YAML keys (everything except reserved fields) ──────────────────

	const RESERVED_KEYS = new Set(['meta_state', 'created_at', 'updated_at', 'id']);

	const customKeys = $derived(
		Object.keys(yamlData).filter((k) => !RESERVED_KEYS.has(k))
	);

	// ── Formatted date ────────────────────────────────────────────────────────

	const createdFormatted = $derived(() => {
		if (!thought) return '';
		return new Intl.DateTimeFormat(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		}).format(new Date(thought.created_at));
	});

	// ── Bootstrap ─────────────────────────────────────────────────────────────

	onMount(async () => {
		const [t, s] = await Promise.all([getThought(thoughtId), getUserSettings()]);
		thought = t ?? null;
		settings = s ?? null;
		if (!thought) return;
		const parsed = parseFrontmatter(thought.content);
		yamlData = parsed.data;
	});

	// ── Handlers ──────────────────────────────────────────────────────────────

	async function handleStageChange(e: Event) {
		if (!thought) return;
		const newState = Number((e.target as HTMLSelectElement).value) as 1 | 2 | 3 | 4;

		if (Capacitor.isNativePlatform()) {
			await Haptics.impact({ style: ImpactStyle.Light });
		}
		thought = { ...thought, meta_state: newState };
		await updateThought(thoughtId, { meta_state: newState });
		eventBus.emit({ type: 'thought.stage_changed', payload: { id: thoughtId, meta_state: newState } });
	}

	async function handleCustomKeyChange(key: string, value: string) {
		if (!thought) return;
		const updatedData = { ...yamlData, [key]: value };
		yamlData = updatedData;

		// Re-serialize into content
		const parsed = parseFrontmatter(thought.content);
		const newContent = serializeFrontmatter(updatedData, parsed.body);
		thought = { ...thought, content: newContent };
		await updateThought(thoughtId, { content: newContent });
	}
</script>

{#if thought}
	<div class="mask" role="region" aria-label={t('editor.stage')}>

		<!-- ── Stage selector ──────────────────────────────────────────────── -->
		<div class="row">
			<span class="label">{t('editor.stage')}</span>
			<select
				class="stage-select"
				value={thought.meta_state}
				onchange={handleStageChange}
				aria-label={t('editor.stage')}
			>
				{#each PIPELINE_STATES as state, i}
					<option value={state.id} style="color: var({state.cssVar})">
						{pipelineLabels[i]}
					</option>
				{/each}
			</select>
		</div>

		<!-- ── Created date (read-only) ────────────────────────────────────── -->
		<div class="row">
			<span class="label">{t('editor.created')}</span>
			<span class="value-static">{createdFormatted()}</span>
		</div>

		<!-- ── Custom YAML keys ─────────────────────────────────────────────── -->
		{#each customKeys as key}
			<div class="row">
				<span class="label">{key}</span>
				<input
					class="value-input"
					type="text"
					value={String(yamlData[key] ?? '')}
					oninput={(e) => handleCustomKeyChange(key, (e.target as HTMLInputElement).value)}
					aria-label={key}
				/>
			</div>
		{/each}

	</div>
{/if}

<style>
	.mask {
		display: flex;
		flex-direction: column;
		gap: 0;
		border-bottom: 1px solid var(--border);
		background: var(--bg-panel);
		padding: 0.5rem 0;
		/* Align with the editor's 600px column */
		max-width: 600px;
		margin: 0 auto;
		width: 100%;
		padding-left: 1.5rem;
		padding-right: 1.5rem;
		box-sizing: border-box;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-height: 36px;
		padding: 0.125rem 0;
	}

	.label {
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted);
		min-width: 72px;
		flex-shrink: 0;
	}

	.stage-select {
		background: var(--bg-surface);
		border: 1px solid var(--border-strong);
		border-radius: 6px;
		color: var(--text-primary);
		font-size: 0.8125rem;
		font-family: inherit;
		padding: 0.25rem 0.5rem;
		min-height: 34px;
		cursor: pointer;
		outline: none;
		transition: border-color 120ms;
	}

	.stage-select:hover {
		border-color: var(--border-strong);
		background: var(--bg-hover);
	}

	.stage-select:focus {
		border-color: var(--color-brand);
	}

	.value-static {
		font-size: 0.8125rem;
		color: var(--text-secondary);
	}

	.value-input {
		flex: 1;
		background: transparent;
		border: none;
		border-bottom: 1px solid transparent;
		color: var(--text-primary);
		font-size: 0.8125rem;
		font-family: inherit;
		padding: 0.125rem 0;
		outline: none;
		transition: border-color 120ms;
		min-height: 34px;
	}

	.value-input:focus {
		border-bottom-color: var(--color-brand);
	}

	.value-input::placeholder {
		color: var(--text-muted);
	}
</style>
