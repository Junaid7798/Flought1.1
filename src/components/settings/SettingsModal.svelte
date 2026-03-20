<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import {
		ChevronLeft,
		ChevronRight,
		Download,
		Info,
		Cloud,
		CloudOff,
		Sparkles,
		Map,
		Keyboard,
		Palette,
		Database,
		Box,
		X,
		Search,
		Monitor,
		Smartphone,
		Cpu,
		Maximize2,
		Activity,
		Github,
		ExternalLink
	} from "lucide-svelte";
	import { Capacitor } from "@capacitor/core";
	import { Keyboard as CapKeyboard } from "@capacitor/keyboard";
	import { $t as t } from "$lib/i18n";
	import { PIPELINE_STATES, INPUT_CONSTRAINTS } from "$lib/config";
	import {
		initializeShortcuts,
		DEFAULT_BINDINGS,
	} from "$lib/ShortcutManager";
	import type { Action } from "$lib/ShortcutManager";
	import {
		getUserSettings,
		updateUserSettings,
		type UserSettings,
	} from "$lib/db";
	import { uiStore } from "$lib/stores/uiStore.svelte";
	import { fade, slide, fly } from "svelte/transition";
	import { PLUGINS } from "$lib/plugins";
	import { goto } from "$app/navigation";
	import JSZip from 'jszip';
	import { parseFrontmatter, serializeFrontmatter } from '$lib/frontmatterParser';
	import { eventBus } from '$lib/eventBus';
	import { showToast } from '$lib/stores/toastStore.svelte';

	// ── State ─────────────────────────────────────────────────────────────────

	let settings = $state<UserSettings | null>(null);
	let savedFlash = $state(false);
	let savedTimer: ReturnType<typeof setTimeout> | null = null;
	let totalWords = $state(0);
	let activeTab = $state<string>("appearance");
	let searchQuery = $state("");

	// ── ZIP Import State ──────────────────────────────────────────────────────
	let importPreviewOpen = $state(false);
	let importStats = $state({ total: 0, new: 0, duplicates: 0 });
	let duplicateStrategy = $state<'skip' | 'overwrite' | 'copy'>('skip');
	let parsedThoughtsCache = $state<any[]>([]);
	let isImporting = $state(false);
	let isExporting = $state(false);
	let exportProgress = $state('');
	let importProgress = $state('');

	// ── Tabs ──────────────────────────────────────────────────────────────────

	const TABS = [
		{ id: "general", label: "General", icon: Database, group: "Options" },
		{ id: "appearance", label: "Appearance", icon: Palette, group: "Options" },
		{ id: "pipeline", label: "Pipeline", icon: Activity, group: "Options" },
		{ id: "hotkeys", label: "Hotkeys", icon: Keyboard, group: "Options" },
		{ id: "sync", label: "Sync", icon: Cloud, group: "Options" },
		{ id: "plugins", label: "Core plugins", icon: Box, group: "Plugins" },
		{ id: "about", label: "About", icon: Info, group: "Plugins" },
	];

	// ── Options ───────────────────────────────────────────────────────────────

	const FONT_SIZES = [
		{ value: 14, label: "Small" },
		{ value: 16, label: "Normal" },
		{ value: 18, label: "Large" },
	] as const;

	const COLOUR_OPTIONS = [
		{ cssVar: "--color-inbox", label: "Amber" },
		{ cssVar: "--color-queue", label: "Blue" },
		{ cssVar: "--color-forge", label: "Green" },
		{ cssVar: "--color-archive", label: "Gray" },
		{ cssVar: "--color-brand", label: "Cyan" },
		{ cssVar: "--color-error", label: "Red" },
	];

	const BRAND_PRESETS = [
		{ value: "#8B5CF6", label: "Flought Purple" },
		{ value: "#3B82F6", label: "Sapphire" },
		{ value: "#10B981", label: "Emerald" },
		{ value: "#F59E0B", label: "Amber" },
		{ value: "#F43F5E", label: "Rose" },
		{ value: "#64748B", label: "Slate" },
	];

	const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.userAgent);
	const isDesktopCapable =
		!Capacitor.isNativePlatform() &&
		!window.matchMedia("(hover: none)").matches;

	let labelDrafts = $state<[string, string, string, string]>([
		"",
		"",
		"",
		"",
	]);
	let recordingAction = $state<Action | null>(null);
	let recordError = $state("");

	const ACTION_META = [
		{
			id: "commandPalette" as Action,
			labelKey: "shortcuts.commandPalette",
			descKey: "shortcuts.commandPalette.desc",
		},
		{
			id: "newThought" as Action,
			labelKey: "shortcuts.newThought",
			descKey: "shortcuts.newThought.desc",
		},
		{
			id: "focusSearch" as Action,
			labelKey: "shortcuts.focusSearch",
			descKey: "shortcuts.focusSearch.desc",
		},
		{
			id: "goMap" as Action,
			labelKey: "shortcuts.goMap",
			descKey: "shortcuts.goMap.desc",
		},
		{
			id: "goEditor" as Action,
			labelKey: "shortcuts.goEditor",
			descKey: "shortcuts.goEditor.desc",
		},
		{
			id: "goFocus" as Action,
			labelKey: "shortcuts.goFocus",
			descKey: "shortcuts.goFocus.desc",
		},
		{
			id: "openSettings" as Action,
			labelKey: "shortcuts.openSettings",
			descKey: "shortcuts.openSettings.desc",
		},
		{
			id: "toggleSidebar" as Action,
			labelKey: "shortcuts.toggleSidebar",
			descKey: "shortcuts.toggleSidebar.desc",
		},
		{
			id: "quickCapture" as Action,
			labelKey: "shortcuts.quickCapture",
			descKey: "shortcuts.quickCapture.desc",
		},
	] as const;

	function closeSettings() {
		uiStore.isSettingsOpen = false;
	}

	function handleBackdropKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeSettings();
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────

	onMount(async () => {
		const s = await getUserSettings();
		settings = s ?? null;

		labelDrafts = (s?.pipeline_label_overrides as [
			string,
			string,
			string,
			string,
		]) ?? [t("stage.1"), t("stage.2"), t("stage.3"), t("stage.4")];

		if (s?.theme) uiStore.theme = s.theme as "modern-dark" | "modern-light";

		if (s?.font_size) {
			document.documentElement.style.setProperty(
				"--editor-font-size",
				`${s.font_size}px`,
			);
		}

		if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
			CapKeyboard.addListener("keyboardWillHide", () => {
				(document.activeElement as HTMLElement)?.blur();
			});
		}

		const { db } = await import("$lib/db");
		const thoughts = await db.thoughts
			.filter((t) => !t.is_deleted)
			.toArray();
		totalWords = thoughts.reduce((sum, t) => {
			return (
				sum +
				(t.content?.trim().split(/\s+/).filter(Boolean).length ?? 0)
			);
		}, 0);
	});

	// ── Handlers ──────────────────────────────────────────────────────────────

	async function save(changes: Partial<Omit<UserSettings, "id">>) {
		if (!settings) return;
		settings = { ...settings, ...changes };
		await updateUserSettings(changes);
		flashSaved();
	}

	function flashSaved() {
		savedFlash = true;
		if (savedTimer) clearTimeout(savedTimer);
		savedTimer = setTimeout(() => {
			savedFlash = false;
		}, 1500);
	}

	async function setTheme(theme: "modern-dark" | "modern-light") {
		uiStore.theme = theme;
		document.documentElement.classList.toggle(
			"theme-modern-light",
			theme === "modern-light",
		);
		try {
			if (theme === "modern-light")
				localStorage.setItem("flought_theme", "modern-light");
			else localStorage.removeItem("flought_theme");
		} catch (_) {}
		await save({ theme });
	}

	async function setFontSize(size: number) {
		await save({ font_size: size });
		document.documentElement.style.setProperty(
			"--editor-font-size",
			`${size}px`,
		);
	}

	async function setLayoutWidth(width: "normal" | "wide" | "full") {
		uiStore.layoutWidth = width;
		document.documentElement.classList.remove(
			"theme-layout-normal",
			"theme-layout-wide",
			"theme-layout-full",
		);
		document.documentElement.classList.add(`theme-layout-${width}`);
		await save({ layout_width: width });
	}

	async function setBrandColor(color: string) {
		uiStore.brandColor = color;
		await save({ brand_color: color });
	}

	async function togglePlugin(pluginId: string) {
		if (!settings) return;
		const current = settings.enabled_plugins || [];
		const next = current.includes(pluginId)
			? current.filter((id) => id !== pluginId)
			: [...current, pluginId];
		await save({ enabled_plugins: next });
	}

	function getPipelineColour(stageIndex: number): string {
		return (
			settings?.pipeline_colour_overrides?.[stageIndex] ??
			`var(${PIPELINE_STATES[stageIndex].cssVar})`
		);
	}

	async function setPipelineColour(stageIndex: number, cssVar: string) {
		if (!settings) return;
		const resolved = getComputedStyle(document.documentElement)
			.getPropertyValue(cssVar)
			.trim();
		const next = [...settings.pipeline_colour_overrides] as [
			string,
			string,
			string,
			string,
		];
		next[stageIndex] = resolved || `var(${cssVar})`;
		await save({ pipeline_colour_overrides: next });
	}

	async function saveLabelAt(i: number) {
		const trimmed = labelDrafts[i].trim();
		if (!trimmed) {
			labelDrafts[i] =
				settings?.pipeline_label_overrides?.[i] ?? t(`stage.${i + 1}`);
			return;
		}
		const current = (settings?.pipeline_label_overrides ?? [
			t("stage.1"),
			t("stage.2"),
			t("stage.3"),
			t("stage.4"),
		]) as [string, string, string, string];
		const next = [...current] as [string, string, string, string];
		next[i] = trimmed;
		await save({ pipeline_label_overrides: next });
	}

	function buildCombo(e: KeyboardEvent): string {
		const parts: string[] = [];
		if (e.metaKey) parts.push(isMac ? "cmd" : "ctrl");
		if (e.ctrlKey && !e.metaKey) parts.push("ctrl");
		if (e.altKey) parts.push("alt");
		if (e.shiftKey) parts.push("shift");
		parts.push(e.key.toLowerCase());
		return parts.join("+");
	}

	function getDisplayBinding(actionId: Action): string {
		const raw =
			settings?.keyboard_shortcuts?.[actionId] ??
			DEFAULT_BINDINGS[actionId];
		return raw
			.replace("cmd", isMac ? "⌘" : "Ctrl")
			.replace("ctrl", "Ctrl")
			.replace("alt", isMac ? "⌥" : "Alt")
			.replace("shift", "⇧")
			.split("+")
			.map((p) => (p.length === 1 ? p.toUpperCase() : p))
			.join("+");
	}

	function startRecording(actionId: Action) {
		recordingAction = actionId;
		recordError = "";

		function captureKey(e: KeyboardEvent) {
			e.preventDefault();
			e.stopPropagation();
			if (["Meta", "Control", "Alt", "Shift"].includes(e.key)) return;
			if (e.key === "Escape") {
				window.removeEventListener("keydown", captureKey, true);
				recordingAction = null;
				return;
			}
			if (!e.metaKey && !e.ctrlKey && !e.altKey) {
				recordError = t("shortcuts.errorNoModifier");
				window.removeEventListener("keydown", captureKey, true);
				recordingAction = null;
				return;
			}
			const combo = buildCombo(e);
			window.removeEventListener("keydown", captureKey, true);
			commitShortcut(actionId, combo);
		}

		window.addEventListener("keydown", captureKey, true);
	}

	async function commitShortcut(actionId: Action, rawCombo: string) {
		const next = {
			...(settings?.keyboard_shortcuts ?? {}),
			[actionId]: rawCombo,
		};
		await save({ keyboard_shortcuts: next });
		initializeShortcuts(next);
		recordingAction = null;
		recordError = "";
	}

	async function resetShortcut(actionId: Action) {
		const next = { ...(settings?.keyboard_shortcuts ?? {}) };
		delete next[actionId];
		await save({ keyboard_shortcuts: next });
		initializeShortcuts(next);
	}

	async function exportAsJSON() {
		const { db } = await import("$lib/db");
		const thoughts = await db.thoughts
			.filter((t) => !t.is_deleted)
			.toArray();
		const edges = await db.edges.filter((e) => !e.is_deleted).toArray();
		const libraries = await db.libraries
			.filter((l) => !l.is_deleted)
			.toArray();

		const payload = {
			version: 1,
			exportedAt: new Date().toISOString(),
			libraries,
			thoughts,
			edges,
		};

		const blob = new Blob([JSON.stringify(payload, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `flought-export-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function exportAsZip() {
		try {
			isExporting = true;
			exportProgress = "Preparing thoughts...";
			
			const { db } = await import("$lib/db");
			const thoughts = await db.thoughts.filter(t => !t.is_deleted).toArray();
			
			const zip = new JSZip();
			
			for (let i = 0; i < thoughts.length; i++) {
				const t = thoughts[i];
				exportProgress = `Packing ${i + 1} of ${thoughts.length}...`;
				
				const parsed = parseFrontmatter(t.content || "");
				
				const data = { ...parsed.data };
				if (!data.title) data.title = t.title || "Untitled";
				if (!data.stage && t.meta_state) data.stage = t.meta_state;
				
				const fullContent = serializeFrontmatter(data, parsed.body || "");
				const safeTitle = (data.title as string).replace(/[^a-z0-9]/gi, '-').toLowerCase() + `_${t.id.slice(0, 4)}`;
				zip.file(`${safeTitle}.md`, fullContent);
			}
			
			exportProgress = "Generating Archive...";
			const content = await zip.generateAsync({ type: 'blob' });
			
			const url = URL.createObjectURL(content);
			const a = document.createElement("a");
			a.href = url;
			a.download = `flought-export-${new Date().toISOString().slice(0, 10)}.zip`;
			a.click();
			URL.revokeObjectURL(url);
			
			isExporting = false;
			showToast(`Exported ${thoughts.length} thoughts to ZIP`);
		} catch (error: any) {
			isExporting = false;
			showToast(`Export failed: ${error.message || 'Unknown error'}`, "error");
			console.error("[Flought ZIP Export Error]:", error);
		}
	}

	async function importFromZip(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		if (!file.name.endsWith('.zip')) {
			showToast("Please select a .zip file", "error");
			return;
		}
		if (file.size > 50 * 1024 * 1024) {
			showToast("ZIP file too large (max 50MB)", "error");
			return;
		}

		try {
			isImporting = true;
			importProgress = "Reading ZIP...";
			
			const zip = new JSZip();
			const contents = await zip.loadAsync(file);
			
			const { db } = await import("$lib/db");
			const existingThoughts = await db.thoughts.filter(t => !t.is_deleted).toArray();
			const existingTitles = new Set(existingThoughts.map(t => t.title.toLowerCase()));
			
			const mdFiles = Object.keys(contents.files).filter(name => name.endsWith('.md') && !contents.files[name].dir);
			
			parsedThoughtsCache = [];
			let newCount = 0;
			let dupCount = 0;
			
			for (let i = 0; i < mdFiles.length; i++) {
				const filename = mdFiles[i];
				importProgress = `Parsing ${i + 1} of ${mdFiles.length}...`;
				const text = await contents.files[filename].async("text");
				
				const parsed = parseFrontmatter(text);
				const title = (parsed.data.title as string) || filename.replace(/\.md$/, '').replace(/[-_]/g, ' ');
				const stage = typeof parsed.data.stage === 'number' ? parsed.data.stage : 1;
				
				const isDup = existingTitles.has(title.toLowerCase());
				if (isDup) dupCount++;
				else newCount++;
				
				parsedThoughtsCache.push({ title, content: text, isDup, stage });
			}
			
			importStats = { total: mdFiles.length, new: newCount, duplicates: dupCount };
			isImporting = false;
			
			if (mdFiles.length === 0) {
				showToast("No .md files found in ZIP", "error");
			} else {
				importPreviewOpen = true;
			}
			
		} catch (err) {
			isImporting = false;
			showToast("Failed to read ZIP file", "error");
			console.error(err);
		}
		target.value = '';
	}

	async function commitImport() {
		try {
			isImporting = true;
			importPreviewOpen = false;
			
			const { db, createThought, updateThought } = await import("$lib/db");
			const libraryId = uiStore.activeLibraryId || 'default';
			
			const existingThoughts = await db.thoughts.filter(t => !t.is_deleted).toArray();
			const titleMap = new globalThis.Map<string, string>();
			for (const t of existingThoughts) {
				titleMap.set(t.title.toLowerCase(), t.id);
			}

			let skipped = 0;
			let imported = 0;

			for (let i = 0; i < parsedThoughtsCache.length; i++) {
				const pt = parsedThoughtsCache[i];
				importProgress = `Saving ${i + 1} of ${parsedThoughtsCache.length}...`;
				
				if (pt.isDup) {
					if (duplicateStrategy === 'skip') {
						skipped++;
						continue;
					} else if (duplicateStrategy === 'overwrite') {
						const existingId = titleMap.get(pt.title.toLowerCase());
						if (existingId) {
							await updateThought(existingId, { content: pt.content, meta_state: pt.stage });
							imported++;
							continue;
						}
					}
				}
				
				await createThought(libraryId, pt.title, true, pt.content);
				imported++;
			}
			
			isImporting = false;
			showToast(`Imported ${imported} thoughts${skipped > 0 ? ` (${skipped} skipped)` : ''}`);
			eventBus.emit({ type: 'library.switched', payload: { id: libraryId } });
			
		} catch (e) {
			isImporting = false;
			showToast("Error during import commit", "error");
			console.error(e);
		}
	}
</script>

{#if uiStore.isSettingsOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="settings-backdrop" role="presentation" onclick={closeSettings}></div>

<div class="settings-modal" in:fly={{ y: 20, duration: 400 }} aria-modal="true" role="dialog" tabindex="-1" onkeydown={handleBackdropKeydown}>
	<!-- Sidebar -->
	<aside class="sidebar">
		<div class="sidebar-header">
			<div class="search-box">
				<Search size={14} class="search-icon" />
				<input type="text" placeholder="Search settings..." bind:value={searchQuery} />
			</div>
		</div>

		<nav class="nav">
			{#each ["Options", "Plugins"] as group}
				<div class="nav-group">
					<h3 class="group-label">{group}</h3>
					{#each TABS.filter(t => t.group === group) as tab}
						<button 
							class="nav-item" 
							class:active={activeTab === tab.id}
							onclick={() => activeTab = tab.id}
						>
							<tab.icon size={16} strokeWidth={1.8} />
							<span>{tab.label}</span>
						</button>
					{/each}
				</div>
			{/each}
		</nav>

		<div class="sidebar-footer">
			<button class="footer-btn" onclick={closeSettings}>
				<X size={16} />
				<span>Close</span>
			</button>
		</div>
	</aside>

	<!-- Content -->
	<main class="content">
		<header class="content-header">
			<button class="back-btn" aria-label="Back" onclick={closeSettings}>
				<ChevronLeft size={20} />
				<span>Back</span>
			</button>
			<h2 class="current-tab-title">
				{TABS.find(t => t.id === activeTab)?.label}
			</h2>
			<button class="close-btn" aria-label="Close" onclick={closeSettings}>
				<X size={20} />
			</button>
		</header>

		<div class="content-body" in:fade={{ duration: 200 }}>
			{#if activeTab === 'appearance'}
				<div class="setting-group">
					<h4 class="group-title">Visuals</h4>
					
					<div class="setting-item">
						<div class="item-info">
							<span class="item-label">Theme</span>
							<span class="item-desc">Switch between Obsidian Dark and Silver Light</span>
						</div>
						<div class="btn-group">
							<button 
								class:selected={uiStore.theme === 'modern-dark'} 
								onclick={() => setTheme('modern-dark')}
							>Dark</button>
							<button 
								class:selected={uiStore.theme === 'modern-light'} 
								onclick={() => setTheme('modern-light')}
							>Light</button>
						</div>
					</div>

					<div class="setting-item">
						<div class="item-info">
							<span class="item-label">Accent Color</span>
							<span class="item-desc">Changes the primary glow of Flought</span>
						</div>
						<div class="color-presets">
							{#each BRAND_PRESETS as p}
								<button 
									class="color-dot" 
									class:active={uiStore.brandColor === p.value}
									style="background: {p.value}"
									onclick={() => setBrandColor(p.value)}
									title={p.label}
								></button>
							{/each}
						</div>
					</div>
				</div>

				<div class="setting-group">
					<h4 class="group-title">Interface</h4>
					
					<div class="setting-item">
						<div class="item-info">
							<span class="item-label">Font Size</span>
							<span class="item-desc">Adjust the global writing size</span>
						</div>
						<div class="btn-group">
							{#each FONT_SIZES as f}
								<button 
									class:selected={settings?.font_size === f.value} 
									onclick={() => setFontSize(f.value)}
								>{f.label}</button>
							{/each}
						</div>
					</div>

					<div class="setting-item">
						<div class="item-info">
							<span class="item-label">Layout Width</span>
							<span class="item-desc">Control the maximum width of the editor canvas</span>
						</div>
						<div class="btn-group">
							{#each ['normal', 'wide', 'full'] as w}
								<button 
									class:selected={settings?.layout_width === w} 
									onclick={() => setLayoutWidth(w as any)}
									style="text-transform: capitalize;"
								>{w}</button>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			{#if activeTab === 'general'}
				<div class="setting-group">
					<h4 class="group-title">Vault Stats</h4>
					<div class="stats-row">
						<div class="stat-card">
							<span class="stat-value">{totalWords.toLocaleString()}</span>
							<span class="stat-label">Words Authored</span>
						</div>
						<div class="stat-card">
							<span class="stat-value">1</span>
							<span class="stat-label">Local Vaults</span>
						</div>
					</div>
				</div>

				<div class="setting-group">
					<h4 class="group-title">Data Management</h4>
					<div class="setting-item">
						<div class="item-info">
							<span class="item-label">JSON Export</span>
							<span class="item-desc">Download a complete backup of all thoughts and links</span>
						</div>
						<button class="action-btn" onclick={exportAsJSON}>
							<Download size={14} />
							<span>Export JSON</span>
						</button>
					</div>

					<div class="setting-item">
						<div class="item-info">
							<span class="item-label">Markdown ZIP Export</span>
							<span class="item-desc">Download a backup of your thoughts as native Markdown files</span>
						</div>
						<button class="action-btn" onclick={exportAsZip} disabled={isExporting}>
							<Download size={14} />
							<span>{isExporting ? exportProgress : 'Export Vault'}</span>
						</button>
					</div>

					<div class="setting-item">
						<div class="item-info">
							<span class="item-label">Markdown ZIP Import</span>
							<span class="item-desc">Import a package of .md files to inject into Flought</span>
						</div>
						<button class="action-btn" onclick={() => document.getElementById('zip-import-input')?.click()} disabled={isImporting}>
							<Download size={14} style="transform: rotate(180deg);" />
							<span>{isImporting ? importProgress : 'Import Vault'}</span>
						</button>
						<input id="zip-import-input" type="file" accept=".zip" style="display: none;" onchange={importFromZip} />
					</div>
				</div>
			{/if}

			{#if activeTab === 'pipeline'}
				<div class="setting-group">
					<h4 class="group-title">Stage Customization</h4>
					<p class="section-hint">Define how your thoughts flow through the pipeline.</p>
					
					<div class="pipeline-editor">
						{#each PIPELINE_STATES as state, i}
							<div class="pipeline-item">
								<div class="color-picker-simple">
									<div class="current-swatch" style="background: {getPipelineColour(i)}"></div>
									<div class="swatch-menu">
										{#each COLOUR_OPTIONS as opt}
											<button 
												onclick={() => setPipelineColour(i, opt.cssVar)}
												style="background: var({opt.cssVar})"
												title={opt.label}
											></button>
										{/each}
									</div>
								</div>
								<input 
									type="text" 
									bind:value={labelDrafts[i]} 
									onblur={() => saveLabelAt(i)}
									maxlength={30}
								/>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if activeTab === 'hotkeys'}
				<div class="setting-group">
					<h4 class="group-title">Shortcuts</h4>
					<p class="section-hint">Speed up your workflow with keyboard bindings.</p>
					
					<div class="shortcuts-list">
						{#each ACTION_META as am}
							<div class="shortcut-item">
								<div class="item-info">
									<span class="item-label">{t(am.labelKey)}</span>
									<span class="item-desc">{t(am.descKey)}</span>
								</div>
								<div class="shortcut-action">
									<kbd>{getDisplayBinding(am.id)}</kbd>
									<button 
										class="rec-btn" 
										class:recording={recordingAction === am.id}
										onclick={() => startRecording(am.id)}
									>
										{recordingAction === am.id ? 'PRESS KEYS' : 'Update'}
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if activeTab === 'sync'}
				<div class="setting-group">
					<h4 class="group-title">Cloud Integration</h4>
					<div class="sync-status-panel">
						<div class="sync-icon-box" class:synced={uiStore.syncStatus === 'synced'}>
							{#if uiStore.syncStatus === 'synced'}
								<Cloud size={32} />
							{:else}
								<CloudOff size={32} />
							{/if}
						</div>
						<div class="sync-details">
							<span class="sync-title">
								{uiStore.syncStatus === 'synced' ? 'Your data is safe' : 'Local-only workspace'}
							</span>
							<p class="sync-para">
								Flought uses end-to-end encryption to sync your vault via your private Google Drive space.
							</p>
							<button class="primary-btn">Connect Google Drive</button>
						</div>
					</div>
				</div>
			{/if}

			{#if activeTab === 'plugins'}
				<div class="setting-group">
					<h4 class="group-title">Installed Extensions</h4>
					<div class="plugins-grid">
						{#each PLUGINS as p}
							<div class="plugin-card" class:unavail={!p.is_available}>
								<div class="card-head">
									<span class="p-name">{p.name}</span>
									{#if p.is_available}
										<button 
											class="p-toggle" 
											class:on={settings?.enabled_plugins?.includes(p.id)}
											onclick={() => togglePlugin(p.id)}
											aria-label="Toggle {p.name} plugin"
											aria-pressed={settings?.enabled_plugins?.includes(p.id)}
											type="button"
										>
											<div class="handle"></div>
										</button>
									{:else}
										<span class="p-badge">Coming Soon</span>
									{/if}
								</div>
								<p class="p-summary">{p.description}</p>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if activeTab === 'about'}
				<div class="about-hero">
					<img src="/logo.png" alt="Flought Logo" width="64" height="64" />
					<h2 class="app-v">Flought V2.0.4</h2>
					<p class="credit">Built for thinkers, by thinkers.</p>
				</div>

				<div class="setting-group">
					<h4 class="group-title">Resources</h4>
					<div class="links-list">
						<a href="https://github.com/flought" class="ext-link">
							<Github size={14} />
							<span>Source Code</span>
							<ExternalLink size={12} class="m-left" />
						</a>
						<a href="/features" class="ext-link">
							<Sparkles size={14} />
							<span>Documentation</span>
							<ExternalLink size={12} class="m-left" />
						</a>
					</div>
				</div>
			{/if}
		</div>
	</main>
</div>
{/if}

{#if importPreviewOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="settings-backdrop" style="z-index: 10000; background: rgba(0,0,0,0.8);" role="presentation"></div>
	<div class="import-preview-modal" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10001; background: var(--bg-primary); padding: 24px; border-radius: 12px; border: 1px solid var(--border-light); width: 400px; box-shadow: 0 10px 40px rgba(0,0,0,0.6);" in:fly={{ y: 20 }}>
		<h3 style="margin-bottom: 16px; font-weight: 600; font-size: 1.2rem; display: flex; align-items: center; gap: 8px;">
			<Sparkles size={18} color="var(--color-brand)" /> Import Preview
		</h3>
		
		<p style="margin-bottom: 16px; color: var(--text-secondary);">Found <strong>{importStats.total}</strong> markdown files within the ZIP archive.</p>
		
		<div style="background: var(--bg-elevated); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
			<div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: var(--text-primary);">
				<span><span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--color-forge); margin-right: 8px;"></span>New thoughts</span>
				<strong>{importStats.new}</strong>
			</div>
			<div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
				<span><span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--color-archive); margin-right: 8px;"></span>Duplicates found</span>
				<strong>{importStats.duplicates}</strong>
			</div>
		</div>

		{#if importStats.duplicates > 0}
			<div style="margin-bottom: 24px;">
				<div style="display: block; margin-bottom: 12px; font-size: 0.9rem; color: var(--text-secondary); font-weight: 500;">How should duplicates be handled?</div>
				<div style="display: flex; flex-direction: column; gap: 10px;">
					<label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
						<input type="radio" value="skip" bind:group={duplicateStrategy}>
						<span><strong>Skip</strong> (Ignore the imported file)</span>
					</label>
					<label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
						<input type="radio" value="overwrite" bind:group={duplicateStrategy}>
						<span><strong>Overwrite</strong> (Replace existing data)</span>
					</label>
					<label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
						<input type="radio" value="copy" bind:group={duplicateStrategy}>
						<span><strong>Copy</strong> (Keep both, naming may conflict)</span>
					</label>
				</div>
			</div>
		{/if}

		<div style="display: flex; justify-content: flex-end; gap: 12px;">
			<button class="action-btn" style="background: var(--bg-elevated);" onclick={() => { importPreviewOpen = false; parsedThoughtsCache = []; }}>
				Cancel
			</button>
			<button class="action-btn" style="background: var(--color-brand); color: white;" onclick={commitImport}>
				Confirm Import
			</button>
		</div>
	</div>
{/if}

<style>
	.settings-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(8px);
		z-index: 999;
	}

	.settings-modal {
		position: fixed;
		top: 40px;
		bottom: 40px;
		right: 40px;
		left: 40px;
		max-width: 1200px;
		margin: 0 auto;
		background: var(--bg-deep);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-xl);
		z-index: 1000;
		display: flex;
		color: var(--text-muted);
		font-family: var(--font-main);
		box-shadow: var(--shadow-xl);
		overflow: hidden;
	}

	@media (max-width: 767px) {
		.settings-modal {
			top: 0;
			bottom: 0;
			right: 0;
			left: 0;
			border-radius: 0;
			border: none;
		}
	}

	/* Sidebar */
	.sidebar {
		width: 240px;
		background: rgba(0, 0, 0, 0.15);
		border-right: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		padding: 40px 12px 12px;
	}

	.sidebar-header {
		margin-bottom: 24px;
	}

	.search-box {
		position: relative;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 6px;
		display: flex;
		align-items: center;
		padding: 0 10px;
		border: 1px solid transparent;
		transition: all 0.2s;
	}

	.search-box:focus-within {
		border-color: var(--color-brand);
		background: rgba(255, 255, 255, 0.08);
	}

	.search-box input {
		background: transparent;
		border: none;
		color: var(--color-text);
		font-size: 13px;
		height: 32px;
		width: 100%;
		outline: none;
		padding-left: 6px;
	}

	.nav {
		flex: 1;
		overflow-y: auto;
	}

	.nav-group {
		margin-bottom: 24px;
	}

	.group-label {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 600;
		margin-bottom: 8px;
		padding-left: 12px;
		opacity: 0.4;
	}

	.nav-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 7px 12px;
		border-radius: 6px;
		font-size: 13px;
		color: var(--color-text-dim);
		transition: all 0.15s;
		cursor: pointer;
		border: none;
		background: transparent;
		text-align: left;
	}

	.nav-item:hover {
		background: rgba(255, 255, 255, 0.05);
		color: var(--color-text);
	}

	.nav-item.active {
		background: rgba(var(--color-brand-rgb), 0.15);
		color: var(--color-brand);
		font-weight: 500;
	}

	.sidebar-footer {
		margin-top: auto;
		padding-top: 12px;
		border-top: 1px solid var(--color-border);
	}

	.footer-btn {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		border-radius: 6px;
		font-size: 13px;
		cursor: pointer;
		border: none;
		background: transparent;
		color: var(--color-text-dim);
		opacity: 0.7;
	}

	.footer-btn:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.05);
	}

	/* Main Content */
	.content {
		flex: 1;
		display: flex;
		flex-direction: column;
		background: var(--color-bg);
	}

	.content-header {
		height: 80px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 40px 48px 20px;
	}

	.current-tab-title {
		font-size: 24px;
		font-weight: 700;
		color: var(--color-text);
		letter-spacing: -0.5px;
		flex: 1;
		text-align: center;
	}

	.back-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 6px;
		cursor: pointer;
		border: none;
		background: transparent;
		color: var(--color-text-dim);
		transition: all 0.2s;
		font-weight: 600;
		font-size: 14px;
	}

	.back-btn:hover {
		color: var(--color-text);
		transform: translateX(-2px);
	}

	.back-btn span {
		display: none;
	}
	
	@media (min-width: 600px) {
		.back-btn span {
			display: inline;
		}
		.back-btn {
			width: auto;
		}
	}

	.close-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		cursor: pointer;
		border: none;
		background: transparent;
		color: var(--color-text-dim);
		transition: all 0.2s;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		color: var(--color-text);
		transform: rotate(90deg);
	}

	.content-body {
		flex: 1;
		overflow-y: auto;
		padding: 0 48px 48px;
		max-width: 800px;
	}

	.setting-group {
		margin-bottom: 40px;
	}

	.group-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 16px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--color-border);
	}

	.setting-item {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 16px 0;
		gap: 24px;
	}

	.item-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.item-label {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-text);
	}

	.item-desc {
		font-size: 12px;
		opacity: 0.6;
		line-height: 1.5;
	}

	/* Controls */
	.btn-group {
		display: flex;
		background: rgba(255, 255, 255, 0.05);
		padding: 3px;
		border-radius: 8px;
		border: 1px solid var(--color-border);
	}

	.btn-group button {
		padding: 6px 14px;
		font-size: 12px;
		border-radius: 6px;
		border: none;
		background: transparent;
		color: var(--color-text-dim);
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-group button:hover {
		color: var(--color-text);
	}

	.btn-group button.selected {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-text);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.color-presets {
		display: flex;
		gap: 12px;
	}

	.color-dot {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.color-dot:hover {
		transform: scale(1.15);
	}

	.color-dot.active {
		border-color: var(--border-strong);
		transform: scale(1.1);
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 13px;
		font-weight: 500;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--color-border);
		color: var(--color-text);
		cursor: pointer;
		transition: all 0.2s;
	}

	.action-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: var(--color-brand);
	}

	/* Pipeline View */
	.pipeline-editor {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.pipeline-item {
		display: flex;
		align-items: center;
		gap: 16px;
		background: rgba(255, 255, 255, 0.03);
		padding: 8px 12px;
		border-radius: 8px;
		border: 1px solid var(--color-border);
	}

	.color-picker-simple {
		position: relative;
		cursor: pointer;
	}

	.current-swatch {
		width: 24px;
		height: 24px;
		border-radius: 6px;
	}

	.swatch-menu {
		position: absolute;
		top: 100%;
		left: 0;
		display: none;
		grid-template-columns: repeat(3, 1fr);
		gap: 4px;
		background: var(--color-bg-alt);
		padding: 6px;
		border-radius: 6px;
		border: 1px solid var(--color-border);
		z-index: 10;
		margin-top: 4px;
	}

	.color-picker-simple:hover .swatch-menu {
		display: grid;
	}

	.swatch-menu button {
		width: 18px;
		height: 18px;
		border-radius: 4px;
		border: none;
		cursor: pointer;
	}

	.pipeline-item input {
		flex: 1;
		background: transparent;
		border: none;
		color: var(--color-text);
		font-size: 14px;
		outline: none;
	}

	/* Shortcuts */
	.shortcuts-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.shortcut-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 8px;
		border: 1px solid var(--color-border);
	}

	.shortcut-action {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	kbd {
		background: rgba(255, 255, 255, 0.1);
		padding: 4px 8px;
		border-radius: 4px;
		font-family: monospace;
		font-size: 11px;
		color: var(--color-brand);
		border: 1px solid rgba(var(--color-brand-rgb), 0.3);
	}

	.rec-btn {
		font-size: 11px;
		padding: 4px 10px;
		border-radius: 4px;
		border: 1px solid var(--color-border);
		background: transparent;
		color: var(--color-text-dim);
		cursor: pointer;
	}

	.rec-btn.recording {
		background: var(--color-error);
		color: white;
		border-color: var(--color-error);
	}

	/* Plugins */
	.plugins-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 16px;
	}

	.plugin-card {
		padding: 20px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 12px;
		border: 1px solid var(--color-border);
		transition: all 0.2s;
	}

	.plugin-card:hover:not(.unavail) {
		border-color: var(--color-brand);
		background: rgba(255, 255, 255, 0.05);
	}

	.card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
	}

	.p-name {
		font-weight: 600;
		color: var(--color-text);
	}

	.p-toggle {
		width: 36px;
		height: 20px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		padding: 2px;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.p-toggle.on {
		background: var(--color-brand);
	}

	.p-toggle .handle {
		width: 16px;
		height: 16px;
		background: white;
		border-radius: 50%;
		transition: inherit;
	}

	.p-toggle.on .handle {
		transform: translateX(16px);
	}

	.p-summary {
		font-size: 12px;
		opacity: 0.5;
		line-height: 1.6;
	}

	.unavail {
		opacity: 0.5;
	}

	.p-badge {
		font-size: 10px;
		background: rgba(255, 255, 255, 0.1);
		padding: 2px 6px;
		border-radius: 4px;
	}

	/* About */
	.about-hero {
		text-align: center;
		padding: 40px 0;
		border-bottom: 1px solid var(--color-border);
		margin-bottom: 40px;
	}

	.app-v {
		margin-top: 16px;
		font-size: 20px;
		color: var(--color-text);
	}

	.credit {
		font-size: 13px;
		opacity: 0.5;
		margin-top: 4px;
	}

	.links-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.ext-link {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 8px;
		text-decoration: none;
		color: var(--color-text);
		font-size: 14px;
		transition: all 0.2s;
	}

	.ext-link:hover {
		background: rgba(255, 255, 255, 0.06);
		color: var(--color-brand);
	}

	/* Stats */
	.stats-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	.stat-card {
		padding: 24px;
		background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
		border-radius: 16px;
		border: 1px solid var(--color-border);
		text-align: center;
	}

	.stat-value {
		display: block;
		font-size: 32px;
		font-weight: 800;
		color: var(--color-text);
		margin-bottom: 4px;
	}

	.stat-label {
		font-size: 12px;
		opacity: 0.4;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.sync-status-panel {
		display: flex;
		gap: 24px;
		padding: 24px;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 16px;
		border: 1px solid var(--color-border);
	}

	.sync-icon-box {
		width: 64px;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		color: var(--color-text-dim);
	}

	.sync-icon-box.synced {
		background: rgba(var(--color-brand-rgb), 0.1);
		color: var(--color-brand);
	}

	.sync-details {
		flex: 1;
	}

	.sync-title {
		font-size: 18px;
		font-weight: 600;
		color: var(--color-text);
		display: block;
		margin-bottom: 8px;
	}

	.sync-para {
		font-size: 13px;
		opacity: 0.6;
		margin-bottom: 20px;
		line-height: 1.6;
	}

	.primary-btn {
		padding: 10px 24px;
		background: var(--color-brand);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.primary-btn:hover {
		filter: brightness(1.1);
		transform: translateY(-1px);
	}
</style>
