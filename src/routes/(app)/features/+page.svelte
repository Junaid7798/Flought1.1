<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Map, FileText, Zap, Search, Keyboard, Sparkles, Calendar, Link2, Cloud, Target, List, ArrowRight } from 'lucide-svelte';
	import { $t as t } from '$lib/i18n';

	const features = [
		{
			icon: Map,
			title: 'Knowledge Graph',
			desc: 'See all your thoughts as a connected force-directed graph. Pan, zoom, and explore relationships visually.',
			shortcut: null,
			action: () => goto('/map'),
			cta: 'Open Graph',
		},
		{
			icon: Link2,
			title: 'Wikilinks',
			desc: 'Type [[title]] to create bidirectional links between thoughts. Autocomplete suggests matching titles as you type.',
			shortcut: null,
			action: () => goto('/editor'),
			cta: 'Try in Editor',
		},
		{
			icon: Sparkles,
			title: 'Serendipity Collider',
			desc: 'Daily random connection suggestions between unrelated thoughts. Discover hidden patterns in your thinking.',
			shortcut: null,
			action: () => goto('/map'),
			cta: 'See Suggestions',
		},
		{
			icon: Target,
			title: 'Triage Dots',
			desc: 'New thoughts get a pulsing brand dot until you open them. Keeps your sidebar clean and intentional.',
			shortcut: null,
			action: () => goto('/editor'),
			cta: 'Capture a Thought',
		},
		{
			icon: Calendar,
			title: 'Activity Calendar',
			desc: '28-day heat map showing your writing activity. See patterns in when you think and write most.',
			shortcut: null,
			action: () => goto('/map'),
			cta: 'View Activity',
		},
		{
			icon: Zap,
			title: 'Focus Mode',
			desc: 'Click a pipeline stage to dim unrelated thoughts on the graph. See only what matters right now.',
			shortcut: null,
			action: () => goto('/focus'),
			cta: 'Enter Focus',
		},
		{
			icon: Search,
			title: 'Command Palette',
			desc: 'Fast fuzzy search across all thoughts. Navigate, create, and switch without touching the mouse.',
			shortcut: 'Cmd+K',
			action: () => goto('/map'),
			cta: 'Open Search',
		},
		{
			icon: Keyboard,
			title: 'Keyboard Shortcuts',
			desc: 'Full keyboard navigation. Jump between views, create thoughts, and manage your graph without a mouse.',
			shortcut: null,
			action: () => goto('/settings'),
			cta: 'View Shortcuts',
		},
		{
			icon: FileText,
			title: 'Document Outline',
			desc: 'Jump to any heading in your thought. Auto-generated from markdown headers for quick navigation.',
			shortcut: null,
			action: () => goto('/editor'),
			cta: 'Try Editor',
		},
		{
			icon: Cloud,
			title: 'Google Drive Sync',
			desc: 'Automatic encrypted backup to Google Drive. Your thoughts stay synced across all your devices.',
			shortcut: null,
			action: () => goto('/settings'),
			cta: 'Configure Sync',
		},
		{
			icon: List,
			title: 'Stage Pipeline',
			desc: 'Track ideas from Inbox to Archive. Four stages help you organize the lifecycle of every thought.',
			shortcut: null,
			action: () => goto('/map'),
			cta: 'View Pipeline',
		},
	];

	let carouselEl = $state<HTMLDivElement | null>(null);
	let autoScrollInterval: ReturnType<typeof setInterval>;

	onMount(() => {
		if (!carouselEl) return;

		autoScrollInterval = setInterval(() => {
			if (!carouselEl) return;
			const card = carouselEl.querySelector('.card');
			if (!card) return;
			
			const cardWidth = card.clientWidth + 24; // width + gap
			const maxScroll = carouselEl.scrollWidth - carouselEl.clientWidth;
			
			if (carouselEl.scrollLeft >= maxScroll - 10) {
				carouselEl.scrollTo({ left: 0, behavior: 'smooth' });
			} else {
				carouselEl.scrollBy({ left: cardWidth, behavior: 'smooth' });
			}
		}, 4000);

		const stopScroll = () => clearInterval(autoScrollInterval);
		carouselEl.addEventListener('touchstart', stopScroll, { passive: true });
		carouselEl.addEventListener('wheel', stopScroll, { passive: true });

		return () => stopScroll();
	});

</script>

<div class="page">
	<div class="header">
		<h1 class="title">Features</h1>
		<p class="subtitle">Experience the core of Flought. Swipe to explore.</p>
	</div>

	<div class="carousel-container">
		<div class="carousel" role="list" bind:this={carouselEl}>
			{#each features as feature, i}
				<article class="card" role="listitem">
					<div class="card-icon">
						<feature.icon size={26} strokeWidth={1.8} />
					</div>
					<h3 class="card-title">{feature.title}</h3>
					<p class="card-desc">{feature.desc}</p>
					
					<div class="card-footer">
						{#if feature.shortcut}
							<div class="shortcut-tip">
								<span class="tip-label">Shortcut</span>
								<kbd>{feature.shortcut}</kbd>
							</div>
						{/if}
						<button class="card-cta" onclick={feature.action} type="button">
							{feature.cta}
							<ArrowRight size={14} strokeWidth={2} />
						</button>
					</div>
				</article>
			{/each}
		</div>
		
		<div class="carousel-hint">
			<div class="scroll-dash"></div>
			<span>Scroll to explore {features.length} features</span>
		</div>
	</div>
</div>

<style>
	.page {
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow-x: hidden;
		overflow-y: auto;
		background-color: var(--bg-deep);
		padding-bottom: 4rem;
	}

	.header {
		padding: 4rem 2rem 2rem;
		max-width: 900px;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;
	}

	.title {
		font-size: 2.5rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.04em;
		margin: 0 0 0.5rem;
	}

	.subtitle {
		font-size: 1.1rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.carousel-container {
		position: relative;
		width: 100%;
		margin-top: 1rem;
	}

	.carousel {
		display: flex;
		gap: 24px;
		overflow-x: auto;
		overflow-y: hidden;
		padding: 0 2rem 3rem;
		scroll-snap-type: x mandatory;
		scrollbar-width: none; /* Hide for Firefox */
		-ms-overflow-style: none;  /* Hide for IE/Edge */
	}

	.carousel::-webkit-scrollbar {
		display: none; /* Hide for Chrome, Safari, Opera */
	}

	.card {
		flex: 0 0 320px;
		scroll-snap-align: center;
		background: var(--glass-surface);
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		border: 1px solid var(--border-strong);
		border-radius: 20px;
		padding: 2.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		box-shadow: var(--shadow-md);
		transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.4s;
	}

	.card:hover {
		transform: translateY(-8px);
		border-color: var(--color-brand);
	}

	.card-icon {
		width: 56px;
		height: 56px;
		border-radius: 14px;
		background: var(--brand-tint);
		color: var(--color-brand);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px var(--brand-tint);
	}

	.card-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
		letter-spacing: -0.02em;
	}

	.card-desc {
		font-size: 0.9375rem;
		color: var(--text-secondary);
		line-height: 1.6;
		margin: 0;
		flex: 1;
	}

	.card-footer {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		margin-top: 1rem;
	}

	.shortcut-tip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: var(--bg-deep);
		border-radius: 10px;
		border: 1px solid var(--border);
	}

	.tip-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.card-cta {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		background: var(--color-brand);
		color: #000;
		border: none;
		border-radius: 10px;
		padding: 0.75rem 1.25rem;
		font-size: 0.9375rem;
		font-weight: 700;
		cursor: pointer;
		transition: transform 0.2s, filter 0.2s;
	}

	.card-cta:hover {
		transform: scale(1.02);
		filter: brightness(1.1);
	}

	.carousel-hint {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.scroll-dash {
		width: 40px;
		height: 2px;
		background: var(--border-strong);
		position: relative;
	}

	.scroll-dash::after {
		content: '';
		position: absolute;
		left: 0;
		width: 14px;
		height: 100%;
		background: var(--color-brand);
		animation: dashSlide 3s infinite linear;
	}

	@keyframes dashSlide {
		0% { transform: translateX(0); }
		100% { transform: translateX(26px); }
	}

	/* ── Mobile ─────────────────────────────────────────────────────────── */

	@media (max-width: 767px) {
		.header {
			padding: 2rem 1.5rem 1.5rem;
		}

		.title {
			font-size: 2rem;
		}

		.carousel {
			padding: 0 1.5rem 2rem;
			gap: 16px;
		}

		.card {
			flex: 0 0 calc(100vw - 4rem);
			padding: 2rem;
		}
	}
</style>
