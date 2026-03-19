<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Map, FileText, Zap, Search, Settings } from 'lucide-svelte';
	import { $t as t } from '$lib/i18n';
	import { uiStore } from '$lib/stores/uiStore.svelte';

	// ── Derived ───────────────────────────────────────────────────────────────

	const currentPath = $derived($page.url.pathname);

	const tabs = [
		{ id: 'map',    label: 'Map',    icon: Map,      href: '/map'    },
		{ id: 'editor', label: 'Editor', icon: FileText,  href: '/editor' },
		{ id: 'focus',  label: 'Focus',  icon: Zap,       href: '/focus'  },
	] as const;

	// Determine which tab is active from the URL
	const activeTab = $derived(
		currentPath.startsWith('/thought') || currentPath === '/editor' ? 'editor' :
		currentPath.startsWith('/focus')   ? 'focus'  : 'map'
	);
</script>

<header class="topbar">
	<!-- View switcher tabs -->
	<div class="tabs" role="tablist" aria-label={t('nav.views')}>
		{#each tabs as tab}
			<button
				class="tab"
				class:tab--active={activeTab === tab.id}
				role="tab"
				aria-selected={activeTab === tab.id}
				onclick={() => goto(tab.href)}
				type="button"
			>
				<tab.icon size={15} strokeWidth={activeTab === tab.id ? 2.2 : 1.7} />
				<span class="tab-label">{tab.label}</span>
				{#if activeTab === tab.id}
					<span class="tab-indicator"></span>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Right actions -->
	<div class="actions">
		<button
			class="action-btn"
			onclick={() => { uiStore.commandPaletteOpen = true; }}
			aria-label={t('search.ariaLabel')}
			type="button"
		>
			<Search size={16} strokeWidth={1.7} />
			<span class="action-label">{t('search.placeholder')}</span>
			<kbd class="shortcut">⌘K</kbd>
		</button>

		<button
			class="icon-btn"
			onclick={() => goto('/settings')}
			aria-label={t('nav.settings')}
			type="button"
			class:icon-btn--active={currentPath.startsWith('/settings')}
		>
			<Settings size={16} strokeWidth={1.7} />
		</button>
	</div>
</header>

<style>
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 48px;
		padding: 0 1rem 0 0.75rem;
		background: var(--bg-panel);
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
		gap: 0.5rem;
	}

	/* ── Tabs ──────────────────────────────────────────────────────────────── */

	.tabs {
		display: flex;
		align-items: center;
		gap: 0.125rem;
		height: 100%;
	}

	.tab {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.375rem;
		height: 100%;
		padding: 0 0.875rem;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-family: inherit;
		font-weight: 500;
		transition: color 120ms;
		white-space: nowrap;
	}

	.tab:hover {
		color: var(--text-secondary);
	}

	.tab--active {
		color: var(--text-primary);
	}

	.tab-indicator {
		position: absolute;
		bottom: 0;
		left: 0.875rem;
		right: 0.875rem;
		height: 2px;
		background: var(--color-brand);
		border-radius: 2px 2px 0 0;
	}

	.tab-label {
		font-size: 0.8125rem;
	}

	/* ── Actions ───────────────────────────────────────────────────────────── */

	.actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		height: 32px;
		padding: 0 0.75rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		cursor: pointer;
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-family: inherit;
		transition: border-color 120ms, color 120ms;
		white-space: nowrap;
	}

	.action-btn:hover {
		border-color: var(--color-brand);
		color: var(--text-secondary);
	}

	.action-label {
		font-size: 0.75rem;
	}

	.shortcut {
		font-size: 0.6875rem;
		color: var(--text-muted);
		background: var(--bg-hover);
		border: 1px solid var(--border-strong);
		border-radius: 4px;
		padding: 0.0625rem 0.3125rem;
		font-family: inherit;
		margin-left: 0.25rem;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: none;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		color: var(--text-muted);
		transition: background 120ms, color 120ms;
	}

	.icon-btn:hover {
		background: var(--bg-hover);
		color: var(--text-secondary);
	}

	.icon-btn--active {
		color: var(--color-brand);
		background: var(--brand-tint);
	}

	/* ── Mobile: hide on small screens (MobileDock handles nav) ───────────── */
	@media (max-width: 767px) {
		.topbar {
			display: none;
		}
	}
</style>
