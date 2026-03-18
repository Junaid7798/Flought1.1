<script lang="ts">
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { getUserProfile, getDefaultLibrary } from '$lib/db';
	import Sidebar from '../components/layout/Sidebar.svelte';
	import MobileDock from '../components/layout/MobileDock.svelte';
	import SparkInput from '../components/capture/SparkInput.svelte';
	import CommandPalette from '../components/search/CommandPalette.svelte';

	let { children } = $props();

	// ── Bootstrap ─────────────────────────────────────────────────────────────

	let ready = $state(false);

	onMount(async () => {
		// Skip guard on auth and onboarding routes
		if (
			$page.url.pathname.startsWith('/onboarding') ||
			$page.url.pathname.startsWith('/login')
		) {
			ready = true;
			return;
		}

		const profile = await getUserProfile();
		if (!profile || !profile.onboarding_complete) {
			goto('/onboarding');
			return;
		}

		// Seed the active library if not already set
		if (!uiStore.activeLibraryId) {
			const lib = await getDefaultLibrary();
			uiStore.activeLibraryId = lib.id;
		}

		// Start search worker and store in uiStore so any route can access it
		uiStore.searchWorker = new Worker(new URL('../workers/searchWorker.ts', import.meta.url), {
			type: 'module',
		});

		ready = true;

		// Global Cmd+K / Ctrl+K shortcut
		window.addEventListener('keydown', handleGlobalKeydown);
	});

	onDestroy(() => {
		uiStore.searchWorker?.terminate();
		uiStore.searchWorker = null;
		window.removeEventListener('keydown', handleGlobalKeydown);
	});

	// ── Derived ───────────────────────────────────────────────────────────────

	const isOnboarding = $derived(
		$page.url.pathname.startsWith('/onboarding') ||
		$page.url.pathname.startsWith('/login')
	);

	// ── Handlers ──────────────────────────────────────────────────────────────

	function handleGlobalKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			uiStore.commandPaletteOpen = !uiStore.commandPaletteOpen;
		}
	}
</script>

{#if isOnboarding}
	{@render children()}
{:else if ready}
	<div class="shell" style="--sidebar-width: {uiStore.sidebarWidth}px">
		<!-- Desktop sidebar -->
		<Sidebar activeLibraryId={uiStore.activeLibraryId} />

		<!-- Main content column -->
		<div class="main-col">
			<main class="main">
				{@render children()}
			</main>

			<!-- Desktop capture bar -->
			<div class="desktop-spark">
				<SparkInput libraryId={uiStore.activeLibraryId} />
			</div>
		</div>
	</div>

	<!-- Mobile dock (fixed, self-contained) -->
	<MobileDock libraryId={uiStore.activeLibraryId} />

	<!-- Command palette (portal-like, fixed overlay) -->
	<CommandPalette libraryId={uiStore.activeLibraryId} />
{/if}

<style>
	.shell {
		display: grid;
		grid-template-columns: var(--sidebar-width) 1fr;
		height: 100dvh;
		overflow: hidden;
	}

	.main-col {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		overflow: hidden;
		background-color: var(--bg-deep);
	}

	.main {
		flex: 1;
		overflow: hidden;
	}

	.desktop-spark {
		flex-shrink: 0;
		border-top: 1px solid var(--border);
		background: var(--bg-deep);
	}

	/* On mobile the dock owns the bottom — hide the desktop spark bar */
	@media (max-width: 767px) {
		.shell {
			grid-template-columns: 1fr;
		}

		.desktop-spark {
			display: none;
		}

		/* Leave room for the fixed MobileDock */
		.main {
			padding-bottom: calc(60px + env(safe-area-inset-bottom));
		}
	}
</style>
