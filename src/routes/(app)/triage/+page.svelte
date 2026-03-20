<script lang="ts">
	import { onMount } from 'svelte';
	import { liveQuery } from 'dexie';
	import { db, updateThought, softDeleteThought, type Thought } from '$lib/db';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { $t as t } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import {
		Inbox,
		Clock,
		CheckCircle2,
		Trash2,
		ExternalLink,
		Brain,
		Search,
		ChevronRight,
		Calendar
	} from 'lucide-svelte';
	import { PIPELINE_STATES } from '$lib/config';
	import { handleError } from '$lib/errorHandler';

	// ── State ─────────────────────────────────────────────────────────────────

	let activeTab = $state<'untriaged' | 'stale'>('untriaged');

	const STALE_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 days

	const triagedData = liveQuery(async () => {
		try {
			const allThoughts = await db.thoughts
				.filter(t => !t.is_deleted)
				.toArray();
			return {
				untriaged: allThoughts.filter(t => t.is_triaged === false),
				stale: allThoughts.filter(t => {
					if (t.is_triaged === false) return false;
					const lastAction = t.last_viewed_at || new Date(t.updated_at).getTime();
					return (Date.now() - lastAction) > STALE_THRESHOLD;
				}),
			};
		} catch (err) {
			handleError(err, 'triage.liveQuery', false);
			return { untriaged: [] as Thought[], stale: [] as Thought[] };
		}
	});

	const thoughts = $derived(activeTab === 'untriaged' ? ($triagedData?.untriaged ?? []) : ($triagedData?.stale ?? []));

	// ── Actions ───────────────────────────────────────────────────────────────

	async function markTriaged(id: string) {
		await updateThought(id, { is_triaged: true });
	}

	async function deleteThought(id: string) {
		if (confirm('Delete this thought?')) {
			await softDeleteThought(id);
		}
	}

	function formatDate(dateStr: string) {
		const d = new Date(dateStr);
		return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}

	function getTimeAgo(ts: number | string) {
		const val = typeof ts === 'string' ? new Date(ts).getTime() : ts;
		if (!val) return 'Never';
		const diff = Date.now() - val;
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		return `${days}d ago`;
	}

	function getStage(id: number) {
		return PIPELINE_STATES.find(s => s.id === id);
	}
</script>

<div class="triage-page">
	<header class="header">
		<div class="layout-container">
			<div class="header-content">
				<div class="title-row">
					<span class="title-icon">
						<Brain size={24} />
					</span>
					<h1>{t('triage.title')}</h1>
				</div>
				<p class="subtitle">Review and refine your digital baseline.</p>
			</div>
		</div>
	</header>

	<div class="layout-container">
		<div class="tabs">
			<button 
				class="tab" 
				class:active={activeTab === 'untriaged'} 
				onclick={() => activeTab = 'untriaged'}
			>
				<div class="tab-inner">
					<Inbox size={16} />
					<span>{t('triage.untriaged.heading')}</span>
					{#if $triagedData?.untriaged?.length}
						<span class="count">{$triagedData.untriaged.length}</span>
					{/if}
				</div>
				{#if activeTab === 'untriaged'}<div class="tab-indicator"></div>{/if}
			</button>
			
			<button 
				class="tab" 
				class:active={activeTab === 'stale'} 
				onclick={() => activeTab = 'stale'}
			>
				<div class="tab-inner">
					<Clock size={16} />
					<span>{t('triage.stale.heading')}</span>
					{#if $triagedData?.stale?.length}
						<span class="count">{$triagedData.stale.length}</span>
					{/if}
				</div>
				{#if activeTab === 'stale'}<div class="tab-indicator"></div>{/if}
			</button>
		</div>
	</div>

	<main class="content">
		<div class="layout-container">
			{#if thoughts.length === 0}
			<div class="empty-state">
				<div class="empty-icon-wrap">
					<CheckCircle2 size={48} strokeWidth={1} />
				</div>
				<h2>{t('triage.empty')}</h2>
				<p>Your workspace is lean and focused.</p>
				<button class="cta-btn" onclick={() => goto('/map')}>Back to Map</button>
			</div>
		{:else}
			<div class="thought-grid">
				{#each thoughts as thought (thought.id)}
					{@const stage = getStage(thought.meta_state)}
					<div class="thought-card">
						<div class="card-header">
							<span class="stage-tag" style="--stage-color: {stage?.colour || 'transparent'}">
								{stage ? t('stage.' + stage.id) : '...'}
							</span>
							<span class="date">{getTimeAgo(thought.updated_at)}</span>
						</div>
						
						<h3 class="thought-title">{thought.title || t('search.untitled')}</h3>
						
						{#if thought.content}
							<p class="excerpt">{thought.content.slice(0, 100)}{thought.content.length > 100 ? '...' : ''}</p>
						{/if}
						
						<div class="card-footer">
							<div class="actions">
								{#if !thought.is_triaged}
									<button 
										class="action-btn primary" 
										onclick={() => markTriaged(thought.id)}
										title="Mark as triaged"
									>
										<CheckCircle2 size={16} />
										<span>Triaged</span>
									</button>
								{/if}
								<button 
									class="action-btn" 
									onclick={() => goto(`/thought/${thought.id}`)}
									title="Open editor"
								>
									<ExternalLink size={16} />
								</button>
								<button 
									class="action-btn danger" 
									onclick={() => deleteThought(thought.id)}
									title="Delete"
								>
									<Trash2 size={16} />
								</button>
							</div>
							
							{#if thought.word_count}
								<span class="meta-item">
									{thought.word_count} words
								</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
		</div>
	</main>
</div>

<style>
	.triage-page {
		min-height: 100%;
		background: var(--bg-deep);
		color: var(--text-primary);
		display: flex;
		flex-direction: column;
	}

	.header {
		padding: 3rem 1.5rem 1.5rem;
		background: linear-gradient(to bottom, var(--bg-surface), var(--bg-deep));
	}


	.title-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.title-icon {
		color: var(--color-brand);
	}

	h1 {
		font-size: 2rem;
		font-weight: 800;
		letter-spacing: -0.03em;
		margin: 0;
	}

	.subtitle {
		color: var(--text-muted);
		font-size: 1rem;
	}

	/* Tabs */
	.tabs {
		display: flex;
		gap: 2rem;
		padding: 0 1.5rem;
		border-bottom: 1px solid var(--border-separator);
		width: 100%;
	}

	.tab {
		background: none;
		border: none;
		padding: 1rem 0;
		cursor: pointer;
		position: relative;
		color: var(--text-muted);
		transition: color 0.2s;
	}

	.tab.active {
		color: var(--text-primary);
	}

	.tab-inner {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.count {
		background: var(--bg-strong);
		padding: 2px 6px;
		border-radius: 10px;
		font-size: 0.7rem;
		min-width: 1.5rem;
		text-align: center;
	}

	.tab-indicator {
		position: absolute;
		bottom: -1px;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--color-brand);
		border-radius: 2px 2px 0 0;
		box-shadow: 0 -2px 10px var(--color-brand-glow);
	}

	/* Content */
	.content {
		padding: 2rem 1.5rem;
		width: 100%;
		flex: 1;
	}

	.thought-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.thought-card {
		background: var(--glass-panel);
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		border: 1px solid var(--border-separator);
		border-radius: 16px;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		transition: transform 0.2s, border-color 0.2s;
	}

	.thought-card:hover {
		border-color: var(--border-strong);
		transform: translateY(-2px);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.stage-tag {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--stage-color);
		background: color-mix(in srgb, var(--stage-color) 15%, transparent);
		padding: 2px 8px;
		border-radius: 4px;
	}

	.date {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.thought-title {
		font-size: 1.125rem;
		font-weight: 700;
		margin: 0;
		color: var(--text-primary);
		line-height: 1.3;
	}

	.excerpt {
		font-size: 0.875rem;
		color: var(--text-secondary);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
		line-height: 1.5;
		margin: 0;
	}

	.card-footer {
		margin-top: auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 1rem;
		border-top: 1px solid var(--border-separator);
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-btn {
		background: var(--bg-surface);
		border: 1px solid var(--border-separator);
		color: var(--text-secondary);
		padding: 6px;
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		transition: all 0.2s;
	}

	.action-btn span {
		font-size: 0.75rem;
		font-weight: 600;
	}

	.action-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
		border-color: var(--border-strong);
	}

	.action-btn.primary {
		color: var(--color-brand);
		background: color-mix(in srgb, var(--color-brand) 10%, var(--bg-surface));
		padding: 6px 10px;
	}

	.action-btn.primary:hover {
		background: color-mix(in srgb, var(--color-brand) 20%, var(--bg-surface));
	}

	.action-btn.danger:hover {
		color: var(--color-error);
		background: color-mix(in srgb, var(--color-error) 10%, var(--bg-surface));
	}

	.meta-item {
		font-size: 0.7rem;
		color: var(--text-muted);
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		gap: 1rem;
	}

	.empty-icon-wrap {
		width: 100px;
		height: 100px;
		background: var(--bg-surface);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-forge);
		margin-bottom: 1rem;
		box-shadow: 0 0 30px color-mix(in srgb, var(--color-forge) 10%, transparent);
	}

	h2 {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
	}

	.empty-state p {
		color: var(--text-muted);
		max-width: 300px;
		margin: 0 auto;
	}

	.cta-btn {
		margin-top: 1rem;
		background: var(--color-brand);
		color: var(--bg-deep);
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 12px;
		font-weight: 700;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.cta-btn:hover {
		transform: scale(1.02);
	}

	@media (max-width: 600px) {
		.header {
			padding-top: 4rem;
		}
		
		h1 {
			font-size: 1.5rem;
		}
		
		.thought-grid {
			grid-template-columns: 1fr;
		}
		
		.tabs {
			gap: 1rem;
		}
		
		.tab-inner span:not(.count) {
			display: none;
		}
	}
</style>
