<script lang="ts">
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { getUserProfile, getDefaultLibrary, getUserSettings, createThought, updateThought } from '$lib/db';
	import { initializeShortcuts, onAction, destroyShortcuts } from '$lib/ShortcutManager';
	import Sidebar from '../components/layout/Sidebar.svelte';
	import Topbar from '../components/layout/Topbar.svelte';
	import MobileDock from '../components/layout/MobileDock.svelte';
	import SparkInput from '../components/capture/SparkInput.svelte';
	import CommandPalette from '../components/search/CommandPalette.svelte';
	import ToastManager from '../components/layout/ToastManager.svelte';

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

		// Initialize global shortcut manager with user overrides
		const settings = await getUserSettings();
		initializeShortcuts(settings?.keyboard_shortcuts ?? {});

		// Wire actions
		onAction('commandPalette', () => {
			uiStore.commandPaletteOpen = !uiStore.commandPaletteOpen;
		});
		onAction('goMap',    () => { uiStore.activeView = 'map'; });
		onAction('goEditor', () => { uiStore.activeView = 'editor'; });
		onAction('goFocus',  () => { uiStore.activeView = 'focus'; });

		ready = true;
	});

	// ── Web Drag-and-Drop (.md file import) ───────────────────────────────────

	function handleDragOver(e: DragEvent) {
		// Must preventDefault to allow drop
		e.preventDefault();
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		const libraryId = uiStore.activeLibraryId;
		if (!libraryId || !e.dataTransfer) return;

		const files = Array.from(e.dataTransfer.files).filter(
			(f) => f.name.endsWith('.md')
		);
		if (files.length === 0) return;

		// Import first .md file — create thought, then navigate to it
		const file = files[0];
		const title = file.name.replace(/\.md$/i, '');
		const content = await file.text();

		const id = await createThought(libraryId, title);
		if (content.trim()) {
			await updateThought(id, { content });
		}
		goto(`/thought/${id}`);
	}

	onMount(() => {
		window.addEventListener('dragover', handleDragOver);
		window.addEventListener('drop', handleDrop);
	});

	onDestroy(() => {
		window.removeEventListener('dragover', handleDragOver);
		window.removeEventListener('drop', handleDrop);
		uiStore.searchWorker?.terminate();
		uiStore.searchWorker = null;
		destroyShortcuts();
	});

	// ── Derived ───────────────────────────────────────────────────────────────

	const isOnboarding = $derived(
		$page.url.pathname.startsWith('/onboarding') ||
		$page.url.pathname.startsWith('/login')
	);
</script>

{#if isOnboarding}
	{@render children()}
{:else if ready}
	<div class="shell" style="--sidebar-width: {uiStore.sidebarWidth}px">
		<!-- Desktop sidebar -->
		<Sidebar activeLibraryId={uiStore.activeLibraryId} />

		<!-- Main content column -->
		<div class="main-col">
			<!-- Desktop topbar: view tabs + search + settings -->
			<Topbar />

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

	<!-- Ghost toast stack -->
	<ToastManager />
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
