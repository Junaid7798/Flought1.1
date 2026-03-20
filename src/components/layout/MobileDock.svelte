<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { goto } from "$app/navigation";
	import { Map, PenLine, Plus, X, Search, Settings } from "lucide-svelte";
	import { Capacitor } from "@capacitor/core";
	import { Keyboard } from "@capacitor/keyboard";
	import { Haptics, ImpactStyle } from "@capacitor/haptics";
	import { $t as t } from "$lib/i18n";
	import { uiStore } from "$lib/stores/uiStore.svelte";
	import { page } from "$app/stores";
	import { getThoughtsByLibrary, type Thought } from "$lib/db";
	import SparkInput from "../capture/SparkInput.svelte";

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		libraryId: string;
	}
	let { libraryId }: Props = $props();

	// ── State ─────────────────────────────────────────────────────────────────

	let captureOpen = $state(false);
	let dockHidden = $state(false);
	let thoughts = $state<Thought[]>([]);
	let thoughtSub: { unsubscribe(): void } | null = null;

	// ── Derived ───────────────────────────────────────────────────────────────

	const activePath = $derived($page.url.pathname);

	// ── Keyboard listeners (native only) ──────────────────────────────────────

	onMount(() => {
		thoughtSub = getThoughtsByLibrary(libraryId).subscribe((v) => {
			thoughts = v;
		});

		if (!Capacitor.isNativePlatform()) return;
		Keyboard.addListener("keyboardWillShow", () => {
			dockHidden = true;
		});
		Keyboard.addListener("keyboardWillHide", () => {
			dockHidden = false;
		});
	});

	onDestroy(() => {
		thoughtSub?.unsubscribe();
		if (!Capacitor.isNativePlatform()) return;
		Keyboard.removeAllListeners();
	});

	// ── Haptics helper ────────────────────────────────────────────────────────

	async function haptic(style: ImpactStyle = ImpactStyle.Light) {
		if (!Capacitor.isNativePlatform()) return;
		try {
			await Haptics.impact({ style });
		} catch {}
	}

	// ── Handlers ──────────────────────────────────────────────────────────────

	async function selectTab(view: "map" | "editor" | "search" | "settings") {
		captureOpen = false;
		await haptic();

		if (view === "editor") {
			const targetId = uiStore.focusedNodeId;
			if (targetId) {
				await goto(`/thought/${targetId}`);
			} else {
				const recent = thoughts
					.filter((t) => !t.is_deleted)
					.sort(
						(a, b) =>
							new Date(b.updated_at).getTime() -
							new Date(a.updated_at).getTime(),
					)[0];
				if (recent) {
					await goto(`/thought/${recent.id}`);
				} else {
					uiStore.activeView = "editor";
					await goto("/map"); // Map handles the view state
				}
			}
		} else if (view === "map") {
			uiStore.activeView = "map";
			await goto("/map");
		} else if (view === "search") {
			uiStore.commandPaletteOpen = true;
		} else if (view === "settings") {
			await goto("/settings");
		}
	}

	async function toggleCapture() {
		await haptic(ImpactStyle.Medium);
		captureOpen = !captureOpen;
	}

	function closeCapture() {
		captureOpen = false;
	}

	function handleBackdropKeydown(e: KeyboardEvent) {
		if (e.key === "Enter" || e.key === " ") closeCapture();
	}
</script>

<!-- Backdrop -->
{#if captureOpen}
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		class="backdrop"
		role="button"
		aria-label="Close capture"
		onclick={closeCapture}
		onkeydown={handleBackdropKeydown}
	></div>
{/if}

<!-- Bottom sheet -->
<div class="sheet" class:sheet-open={captureOpen} aria-hidden={!captureOpen}>
	<div class="sheet-handle-row">
		<div class="sheet-handle" aria-hidden="true"></div>
		<button class="sheet-close" onclick={closeCapture} aria-label="Close">
			<X size={18} />
		</button>
	</div>
	<SparkInput {libraryId} />
</div>

<!-- Dock -->
<nav class="dock" class:dock-hidden={dockHidden} aria-label="Navigation">
	<button
		class="dock-tab"
		class:active={uiStore.activeView === "map" &&
			activePath === "/map" &&
			!captureOpen}
		onclick={() => selectTab("map")}
		aria-label={t("nav.map")}
		aria-current={uiStore.activeView === "map" &&
		activePath === "/map" &&
		!captureOpen
			? "page"
			: undefined}
	>
		<Map size={22} />
		<span class="tab-label">{t("nav.map")}</span>
	</button>

	<button
		class="dock-tab"
		class:active={uiStore.commandPaletteOpen}
		onclick={() => selectTab("search")}
		aria-label={t("nav.search")}
	>
		<Search size={22} />
		<span class="tab-label">{t("nav.search")}</span>
	</button>

	<button
		class="dock-tab capture-tab"
		class:active={captureOpen}
		onclick={toggleCapture}
		aria-label={t("capture.prompt")}
		aria-expanded={captureOpen}
	>
		<div class="capture-pip">
			<Plus size={24} />
		</div>
	</button>

	<button
		class="dock-tab"
		class:active={(uiStore.activeView === "editor" ||
			activePath.startsWith("/thought/")) &&
			!captureOpen}
		onclick={() => selectTab("editor")}
		aria-label={t("nav.editor")}
		aria-current={(uiStore.activeView === "editor" ||
			activePath.startsWith("/thought/")) &&
		!captureOpen
			? "page"
			: undefined}
	>
		<PenLine size={22} />
		<span class="tab-label">{t("nav.editor")}</span>
	</button>

	<button
		class="dock-btn"
		class:active={uiStore.isSettingsOpen}
		onclick={() => { uiStore.isSettingsOpen = true; }}
		aria-label={t('nav.settings')}
	>
		<Settings size={20} strokeWidth={2} />
	</button>
</nav>

<style>
	/* ── Backdrop ────────────────────────────────────────────────────────── */

	.backdrop {
		position: fixed;
		inset: 0;
		background: var(--overlay-backdrop);
		z-index: 59;
		animation: fadeIn var(--transition-base) ease forwards;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* ── Bottom sheet ────────────────────────────────────────────────────── */

	.sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--glass-panel);
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		border-top: 1px solid var(--border-strong);
		border-radius: var(--radius-xl) var(--radius-xl) 0 0;
		z-index: 60;
		transform: translateY(100%);
		opacity: 0;
		transition:
			transform var(--transition-slow) cubic-bezier(0.34, 1.56, 0.64, 1),
			opacity var(--transition-base) ease;
		pointer-events: none;
	}

	.sheet.sheet-open {
		transform: translateY(0);
		opacity: 1;
		pointer-events: auto;
	}

	.sheet-handle-row {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-sm) var(--spacing-md) 0;
		position: relative;
	}

	.sheet-handle {
		width: 36px;
		height: 4px;
		border-radius: var(--radius-pill);
		background: var(--border-strong);
	}

	.sheet-close {
		position: absolute;
		right: var(--spacing-sm);
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: var(--size-touch);
		min-height: var(--size-touch);
		padding: 0;
		transition: color var(--transition-fast);
	}

	.sheet-close:hover {
		color: var(--text-primary);
	}

	/* ── Dock ────────────────────────────────────────────────────────────── */

	.dock {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: calc(var(--dock-height) + env(safe-area-inset-bottom));
		padding-bottom: env(safe-area-inset-bottom);
		background: var(--glass-panel);
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		border-top: 1px solid var(--border-separator);
		display: flex;
		align-items: stretch;
		z-index: 70;
		display: none;
		transition:
			transform var(--transition-base) ease,
			opacity var(--transition-fast) ease;
	}

	@media (max-width: 767px) {
		.dock {
			display: flex;
		}
	}

	.dock.dock-hidden {
		transform: translateY(100%);
		opacity: 0;
		pointer-events: none;
	}

	/* ── Tabs ────────────────────────────────────────────────────────────── */

	.dock-tab {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		min-height: 44px;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		font-family: inherit;
		transition:
			color var(--transition-fast),
			transform var(--transition-fast);
		padding: 0;
	}

	.dock-tab:hover,
	.dock-tab.active {
		color: var(--color-brand);
	}

	.dock-tab:active {
		transform: scale(0.92);
	}

	.dock-tab:focus-visible {
		outline: 2px solid var(--color-brand);
		outline-offset: -4px;
		border-radius: var(--radius-sm);
	}

	.dock-tab::before {
		content: "";
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%) scaleX(0);
		width: 20px;
		height: 2px;
		border-radius: 0 0 var(--radius-sm) var(--radius-sm);
		background: var(--color-brand);
		transition: transform var(--transition-fast);
	}

	.dock-tab.active::before {
		transform: translateX(-50%) scaleX(1);
	}

	.capture-tab::before {
		display: none;
	}

	.tab-label {
		font-size: 0.625rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	/* ── Capture tab ─────────────────────────────────────────────────────── */

	.capture-tab {
		flex: 0 0 72px;
	}

	.capture-pip {
		width: 48px;
		height: 48px;
		border-radius: var(--radius-lg);
		background: var(--gradient-brand);
		color: var(--bg-deep);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--shadow-md);
		transition:
			opacity var(--transition-fast),
			transform var(--transition-fast);
	}

	.capture-tab:hover .capture-pip,
	.capture-tab.active .capture-pip {
		opacity: 0.9;
	}

	.capture-tab:active .capture-pip {
		transform: scale(0.92);
	}
</style>
