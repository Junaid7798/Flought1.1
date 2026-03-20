<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Map, FileText, Zap, Search, Settings, HelpCircle, BookOpen, PanelLeftOpen, PanelLeftClose, PanelRightOpen, PanelRightClose } from 'lucide-svelte';
	import { $t as t } from '$lib/i18n';
	import { uiStore } from '$lib/stores/uiStore.svelte';

	// ── Derived ───────────────────────────────────────────────────────────────

	const currentPath = $derived($page.url.pathname);

	const tabs = [
		{ id: 'map',    label: 'Map',    icon: Map,      href: '/map'    },
		{ id: 'triage', label: 'Triage', icon: BookOpen, href: '/triage' },
		{ id: 'editor', label: 'Editor', icon: FileText,  href: '/editor' },
		{ id: 'focus',  label: 'Focus',  icon: Zap,       href: '/focus'  },
	] as const;

	const activeTab = $derived(
		currentPath.startsWith('/thought') || currentPath === '/editor' ? 'editor' :
		currentPath.startsWith('/focus')   ? 'focus'  : 
		currentPath.startsWith('/triage')  ? 'triage' : 'map'
	);
</script>

<header class="topbar">
	<div class="left-section">
		<button
			class="icon-btn sidebar-toggle"
			onclick={() => { uiStore.sidebarCollapsed = !uiStore.sidebarCollapsed; }}
			aria-label={uiStore.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
			type="button"
		>
			{#if uiStore.sidebarCollapsed}
				<PanelLeftOpen size={16} strokeWidth={1.7} />
			{:else}
				<PanelLeftClose size={16} strokeWidth={1.7} />
			{/if}
		</button>
		
		<div class="tabs-divider"></div>

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
	</div>

	<div class="actions">
		<button
			class="search-btn"
			onclick={() => { uiStore.commandPaletteOpen = true; }}
			aria-label={t('search.ariaLabel')}
			type="button"
		>
			<Search size={14} strokeWidth={1.8} />
			<span class="search-label">{t('search.placeholder')}</span>
			<kbd>Cmd+K</kbd>
		</button>

		<button
			class="icon-btn"
			onclick={() => goto('/features')}
			aria-label="Feature guide"
			title="Feature guide"
			type="button"
			class:icon-btn--active={currentPath.startsWith('/features')}
		>
			<HelpCircle size={16} strokeWidth={1.7} />
		</button>

		<button
			class="icon-btn"
			onclick={() => { uiStore.isSettingsOpen = true; }}
			aria-label={t('nav.settings')}
			type="button"
			class:icon-btn--active={uiStore.isSettingsOpen}
		>
			<Settings size={16} strokeWidth={1.7} />
		</button>

		{#if activeTab === 'editor'}
			<div class="tabs-divider"></div>
			<button
				class="icon-btn sidebar-toggle right"
				onclick={() => { uiStore.rightSidebarCollapsed = !uiStore.rightSidebarCollapsed; }}
				aria-label={uiStore.rightSidebarCollapsed ? "Expand right sidebar" : "Collapse right sidebar"}
				type="button"
			>
				{#if uiStore.rightSidebarCollapsed}
					<PanelRightOpen size={16} strokeWidth={1.7} />
				{:else}
					<PanelRightClose size={16} strokeWidth={1.7} />
				{/if}
			</button>
		{/if}
	</div>
</header>

<style>
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: var(--topbar-height);
		padding: 0 var(--spacing-md) 0 var(--spacing-sm);
		background: var(--glass-panel);
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		border-bottom: 1px solid var(--border-separator);
		flex-shrink: 0;
		gap: var(--spacing-xs);
	}

	.left-section {
		display: flex;
		align-items: center;
		height: 100%;
		gap: var(--spacing-xs);
	}

	.tabs-divider {
		width: 1px;
		height: 16px;
		background: var(--border-subtle);
		margin: 0 var(--spacing-xs);
	}
	
	.sidebar-toggle.right {
		margin-left: -2px;
	}

	/* ── Tabs ────────────────────────────────────────────────────────────── */

	.tabs {
		display: flex;
		align-items: center;
		gap: 2px;
		height: 100%;
	}

	.tab {
		position: relative;
		display: flex;
		align-items: center;
		gap: 6px;
		height: 100%;
		padding: 0 var(--spacing-sm);
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		font-size: 0.9375rem;
		font-family: inherit;
		font-weight: 500;
		transition: color var(--transition-fast);
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
		left: var(--spacing-sm);
		right: var(--spacing-sm);
		height: 2px;
		background: var(--color-brand);
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
		animation: indicatorIn var(--transition-fast) ease forwards;
	}

	@keyframes indicatorIn {
		from { transform: scaleX(0); opacity: 0; }
		to   { transform: scaleX(1); opacity: 1; }
	}

	.tab-label {
		font-size: 0.8125rem;
	}

	/* ── Actions ─────────────────────────────────────────────────────────── */

	.actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.search-btn {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		height: 32px;
		padding: 0 var(--spacing-sm);
		background: var(--glass-surface);
		backdrop-filter: var(--glass-blur-sm);
		-webkit-backdrop-filter: var(--glass-blur-sm);
		border: 1px solid var(--border);
		border-radius: var(--radius-pill);
		cursor: pointer;
		color: var(--text-muted);
		font-size: 0.75rem;
		font-family: inherit;
		transition: border-color var(--transition-fast), color var(--transition-fast), background var(--transition-fast);
		white-space: nowrap;
	}

	.search-btn:hover {
		border-color: var(--color-brand);
		color: var(--text-secondary);
		background: var(--bg-hover);
	}

	.search-label {
		font-size: 0.75rem;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control);
		height: var(--size-control);
		background: none;
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		color: var(--text-muted);
		transition: background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
	}

	.icon-btn:hover {
		background: var(--bg-hover);
		color: var(--text-secondary);
		transform: scale(1.05);
	}

	.icon-btn--active {
		color: var(--color-brand);
		background: var(--brand-tint);
	}

	/* ── Mobile ──────────────────────────────────────────────────────────── */

	@media (max-width: 767px) {
		.topbar {
			display: none;
		}
	}
</style>
