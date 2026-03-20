<script lang="ts">
	import { Buffer } from 'buffer';
	if (typeof window !== 'undefined') {
		window.Buffer = window.Buffer || Buffer;
		window.process = window.process || { env: {} };
	}

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
	import CaptureModal from '../components/capture/CaptureModal.svelte';
	import FloatingCapture from '../components/capture/FloatingCapture.svelte';
	import CommandPalette from '../components/search/CommandPalette.svelte';
	import SettingsModal from '../components/settings/SettingsModal.svelte';
	import SparkInput from '../components/capture/SparkInput.svelte';
	import ToastManager from '../components/layout/ToastManager.svelte';

	import { gsap } from 'gsap';

	let { children } = $props();
 
	// ── Bootstrap ─────────────────────────────────────────────────────────────
	let ready = $state(false);
	let mainElement = $state<HTMLElement | null>(null);

	let unsubPalette: () => void;
	let unsubSettings: () => void;
	let unsubSidebar: () => void;
	let unsubQuickCapture: () => void;

	// GSAP Sidebar Collapse Animation
	let animatedSidebarWidth = $state(uiStore.sidebarWidth);
	$effect(() => {
		const targetWidth = uiStore.sidebarCollapsed ? 44 : uiStore.sidebarWidth;
		gsap.to({ value: animatedSidebarWidth }, {
			value: targetWidth,
			duration: 0.45,
			ease: 'power3.inOut',
			onUpdate() {
				animatedSidebarWidth = (this as any).targets()[0].value;
			}
		});
	});

	// ── Modern Brand Color System ──────────────────────────────────────────
	function hexToRgba(hex: string, alpha: number) {
		if (!hex || hex.length < 7) return 'rgba(139, 92, 246, 0.1)';
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	const brandStyles = $derived(`
		--color-brand: ${uiStore.brandColor};
		--brand-tint: ${hexToRgba(uiStore.brandColor, 0.1)};
		--brand-glow: ${hexToRgba(uiStore.brandColor, 0.2)};
		--brand-rim: ${hexToRgba(uiStore.brandColor, 0.3)};
		--sidebar-width: ${animatedSidebarWidth}px;
	`);

	// Layout width sync
	$effect(() => {
		document.documentElement.classList.remove('theme-layout-normal', 'theme-layout-wide', 'theme-layout-full');
		if (uiStore.layoutWidth) {
			document.documentElement.classList.add(`theme-layout-${uiStore.layoutWidth}`);
		}
	});

	// GSAP Page Transition
	$effect(() => {
		const path = $page.url.pathname;
		if (ready && mainElement) {
			gsap.fromTo(mainElement, 
				{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }, 
				{ opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power2.out', clearProps: 'all' }
			);
		}
	});

	onMount(async () => {
		// Bootstrap theme — runs on every app load across all platforms.
		// Keeps uiStore, the CSS class, and localStorage in sync.
		// localStorage is read by the inline script in app.html to prevent flash.
		const savedSettings = await getUserSettings();
		if (savedSettings) {
			if (savedSettings.theme === 'modern-light') {
				uiStore.theme = 'modern-light';
				document.documentElement.classList.add('theme-modern-light');
			}
			if (savedSettings.layout_width) {
				uiStore.layoutWidth = savedSettings.layout_width;
			}
			if (savedSettings.brand_color) {
				uiStore.brandColor = savedSettings.brand_color;
			}
		}

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
		unsubPalette = onAction('commandPalette', () => {
			uiStore.commandPaletteOpen = true;
		});

		unsubSettings = onAction('openSettings', () => {
			uiStore.isSettingsOpen = true;
		});

		unsubSidebar = onAction('toggleSidebar', () => {
			uiStore.sidebarCollapsed = !uiStore.sidebarCollapsed;
		});

		unsubQuickCapture = onAction('quickCapture', () => {
			uiStore.isSparkInputOpen = !uiStore.isSparkInputOpen;
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
		unsubPalette();
		unsubSettings();
		unsubSidebar();
		unsubQuickCapture();
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
	<div class="shell glass" style="--sidebar-width: {uiStore.sidebarCollapsed ? '38px' : uiStore.sidebarWidth + 'px'}; --right-sidebar-width: {uiStore.activeView === 'editor' && !uiStore.rightSidebarCollapsed ? uiStore.rightSidebarWidth + 'px' : uiStore.activeView === 'editor' && uiStore.rightSidebarCollapsed ? '38px' : '0px'}; {brandStyles}">
		<!-- Desktop sidebar -->
		<Sidebar activeLibraryId={uiStore.activeLibraryId} />

		<!-- Main content column -->
		<div class="main-col">
			<!-- Desktop topbar: view tabs + search + settings -->
			<Topbar />

			<main class="main" bind:this={mainElement}>
				{@render children()}
			</main>
		</div>
	</div>

	<!-- Mobile dock (fixed, self-contained) -->
	<MobileDock libraryId={uiStore.activeLibraryId} />

	<!-- Command palette (portal-like, fixed overlay) -->
	<CommandPalette libraryId={uiStore.activeLibraryId} />

	<!-- Settings Modal -->
	<SettingsModal />

	<!-- Ghost toast stack -->
	<ToastManager />

	<!-- Universal Capture (FAB + Modal) -->
	<FloatingCapture />
	<CaptureModal />

	{#if uiStore.isSparkInputOpen}
		<SparkInput libraryId={uiStore.activeLibraryId} />
	{/if}
{/if}

<style>
	.shell {
		display: grid;
		grid-template-columns: var(--sidebar-width, 220px) 1fr var(--right-sidebar-width, 0px);
		height: 100%;
		width: 100%;
		overflow: hidden;
		background: var(--bg-deep); /* Fallback */
	}

	.main-col {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.main {
		flex: 1;
		overflow: hidden;
	}

	/* On mobile the dock owns the bottom */
	@media (max-width: 767px) {
		.shell {
			grid-template-columns: 1fr;
		}

		/* Leave room for the fixed MobileDock */
		.main {
			padding-bottom: calc(60px + env(safe-area-inset-bottom));
		}
	}
</style>
