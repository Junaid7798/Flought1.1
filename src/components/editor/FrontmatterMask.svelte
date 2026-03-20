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
		addAlias,
		removeAlias,
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
	let aliasInput = $state('');

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

	// ── Alias handlers ────────────────────────────────────────────────────────

	async function handleAliasBlur() {
		const trimmed = aliasInput.trim();
		if (!trimmed || !thought) return;
		await addAlias(thoughtId, trimmed);
		// Refresh aliases on thought state
		const refreshed = await getThought(thoughtId);
		if (refreshed) thought = refreshed;
		aliasInput = '';
	}

	async function handleRemoveAlias(alias: string) {
		if (!thought) return;
		await removeAlias(thoughtId, alias);
		thought = { ...thought, aliases: thought.aliases.filter((a) => a !== alias) };
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

		<!-- ── Aliases (C.3) ────────────────────────────────────────────────── -->
		<div class="row alias-row">
			<span class="label">{t('feature.aliases')}</span>
			<div class="alias-wrap">
				{#each thought.aliases ?? [] as alias}
					<span class="alias-pill">
						{alias}
						<button
							class="alias-remove"
							type="button"
							aria-label="Remove alias {alias}"
							onclick={() => handleRemoveAlias(alias)}
						>×</button>
					</span>
				{/each}
				<input
					class="alias-input"
					type="text"
					placeholder="Add alias…"
					bind:value={aliasInput}
					onblur={handleAliasBlur}
					onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
					aria-label={t('feature.aliases')}
				/>
			</div>
		</div>

	</div>
{/if}

<style>
	.mask {
		display: flex;
		flex-direction: column;
		gap: 0;
		border-bottom: 1px solid var(--border-subtle);
		background: transparent;
		padding: 1rem 1rem 0.5rem 1rem;
		width: 100%;
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

	/* ── Aliases ───────────────────────────────────────────────────────── */
	.alias-row { align-items: flex-start; padding-top: 0.25rem; padding-bottom: 0.25rem; }

	.alias-wrap {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.375rem;
		flex: 1;
	}

	.alias-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-strong);
		border-radius: 4px;
		padding: 0.125rem 0.375rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.alias-remove {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 0.875rem;
		line-height: 1;
		padding: 0 0.125rem;
		border-radius: 2px;
		transition: color 120ms;
		min-height: 20px; /* kept inside pill — not standalone tap target */
	}

	.alias-remove:hover { color: var(--text-primary); }

	.alias-input {
		background: transparent;
		border: none;
		border-bottom: 1px solid transparent;
		color: var(--text-primary);
		font-size: 0.8125rem;
		font-family: inherit;
		padding: 0.125rem 0;
		outline: none;
		transition: border-color 120ms;
		min-width: 80px;
		min-height: 28px;
	}

	.alias-input:focus { border-bottom-color: var(--color-brand); }
	.alias-input::placeholder { color: var(--text-muted); }
</style>
