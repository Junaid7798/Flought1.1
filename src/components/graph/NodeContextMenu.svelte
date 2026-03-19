<script lang="ts">
	import { goto } from '$app/navigation';
	import { Capacitor } from '@capacitor/core';
	import { Haptics, ImpactStyle } from '@capacitor/haptics';
	import { $t as t } from '$lib/i18n';
	import { PIPELINE_STATES } from '$lib/config';
	import { updateThought, softDeleteThought, getUserSettings, updateUserSettings } from '$lib/db';
	import { showToast } from '$lib/stores/toastStore.svelte';

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		thoughtId: string;
		thoughtTitle: string;
		currentStage: number;
		isPinned: boolean;
		x: number;
		y: number;
		onclose: () => void;
	}
	let { thoughtId, thoughtTitle, currentStage, isPinned, x, y, onclose }: Props = $props();

	// ── Stage submenu ─────────────────────────────────────────────────────────

	let stageOpen = $state(false);

	// ── Actions ───────────────────────────────────────────────────────────────

	function handleOpen() {
		onclose();
		goto(`/thought/${thoughtId}`);
	}

	function handleCopyWikilink() {
		navigator.clipboard.writeText('[[' + thoughtTitle + ']]')
			.then(() => showToast(t('feature.copyWikilink.success')))
			.catch(() => showToast(t('feature.copyWikilink.error'), 'error'));
		onclose();
	}

	async function handleChangeStage(stageId: 1 | 2 | 3 | 4) {
		onclose();
		if (Capacitor.isNativePlatform()) {
			await Haptics.impact({ style: ImpactStyle.Light });
		}
		await updateThought(thoughtId, { meta_state: stageId });
	}

	async function handlePin() {
		onclose();
		const settings = await getUserSettings();
		if (!settings) return;
		const ids = new Set<string>(settings.pinned_thought_ids ?? []);
		if (isPinned) {
			ids.delete(thoughtId);
		} else {
			ids.add(thoughtId);
		}
		await updateUserSettings({ pinned_thought_ids: [...ids] });
	}

	async function handleDelete() {
		onclose();
		await softDeleteThought(thoughtId);
	}

	// ── Click outside ─────────────────────────────────────────────────────────

	function handleBackdrop() {
		onclose();
	}
</script>

<!-- Invisible backdrop to close on click outside -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="backdrop" onpointerdown={handleBackdrop}></div>

<div
	class="context-menu"
	style="left: {x}px; top: {y}px"
	role="menu"
	aria-label="Node context menu"
>
	<button class="menu-item" role="menuitem" onclick={handleOpen}>
		{t('context.open')}
	</button>

	<button class="menu-item" role="menuitem" onclick={handleCopyWikilink}>
		{t('graph.copyWikilink')}
	</button>

	<div class="menu-item-wrap">
		<button
			class="menu-item"
			role="menuitem"
			onclick={() => { stageOpen = !stageOpen; }}
			aria-expanded={stageOpen}
		>
			{t('context.changeStage')}
			<span class="submenu-arrow">›</span>
		</button>

		{#if stageOpen}
			<div class="submenu" role="menu">
				{#each PIPELINE_STATES as state}
					<button
						class="menu-item"
						class:active={state.id === currentStage}
						role="menuitem"
						onclick={() => handleChangeStage(state.id)}
					>
						<span class="stage-dot" style="background: var({state.cssVar})"></span>
						{t(`stage.${state.id}`)}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<button class="menu-item" role="menuitem" onclick={handlePin}>
		{isPinned ? t('context.unpin') : t('context.pin')}
	</button>

	<button class="menu-item menu-item--danger" role="menuitem" onclick={handleDelete}>
		{t('context.delete')}
	</button>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 999;
	}

	.context-menu {
		position: fixed;
		z-index: 1000;
		min-width: 160px;
		background: var(--glass-surface);
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		border: 1px solid var(--border-strong);
		border-radius: 10px;
		padding: 4px 0;
		box-shadow: 0 8px 32px var(--shadow-dropdown);
	}

	.menu-item-wrap {
		position: relative;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		min-height: 36px;
		padding: 0 12px;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-secondary);
		font-size: 0.8125rem;
		font-family: inherit;
		text-align: left;
		transition: background 100ms, color 100ms;
	}

	.menu-item:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.menu-item.active {
		color: var(--color-brand);
	}

	.menu-item--danger:hover {
		color: var(--color-error);
	}

	.submenu-arrow {
		margin-left: auto;
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.submenu {
		position: absolute;
		left: 100%;
		top: 0;
		min-width: 140px;
		background: var(--glass-surface);
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		border: 1px solid var(--border-strong);
		border-radius: 10px;
		padding: 4px 0;
		box-shadow: 0 8px 32px var(--shadow-dropdown);
	}

	.stage-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}
</style>
