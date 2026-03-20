<script lang="ts">
	import { onMount } from 'svelte';
	import { 
		createThought, getThought, updateThought,
		type Thought 
	} from '$lib/db';
	import { showToast } from '$lib/stores/toastStore.svelte';
	import { goto } from '$app/navigation';
	import { 
		CornerDownLeft, PlusCircle, FileText,
		Sparkles 
	} from 'lucide-svelte';
	import { Capacitor } from '@capacitor/core';
	import { Haptics, ImpactStyle } from '@capacitor/haptics';

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		libraryId: string;
		autoFocus?: boolean;
		onCaptured?: () => void;
		icon?: any; 
	}
	let { libraryId, autoFocus = false, onCaptured, icon: Icon = Sparkles }: Props = $props();

	// ── State ─────────────────────────────────────────────────────────────────

	let content = $state('');
	let inputEl = $state<HTMLTextAreaElement | null>(null);
	let isSubmitting = $state(false);
	let isFocused = $state(false);

	// ── Handlers ──────────────────────────────────────────────────────────────

	async function submit(mode: 'default' | 'editor' | 'another' = 'default') {
		if (!content.trim() || isSubmitting) return;
		isSubmitting = true;

		try {
			const title = content.trim().split('\n')[0].slice(0, 100);
			const thoughtId = await createThought(libraryId, title);
			
			// Update with full content and ensure it's in Inbox (1)
			await updateThought(thoughtId, { 
				content: content.trim(),
				meta_state: 1 
			});
			
			const thought = await getThought(thoughtId);
			if (!thought) throw new Error("Failed to retrieve created thought");

			if (Capacitor.isNativePlatform()) {
				try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
			}

			if (mode === 'editor') {
				goto(`/thought/${thought.id}`);
			} else if (mode === 'another') {
				content = '';
				inputEl?.focus();
				showToast("Thought captured!");
			} else {
				content = '';
				onCaptured?.();
			}
		} catch (err) {
			console.error('Capture failed:', err);
			showToast("Failed to capture thought");
		} finally {
			isSubmitting = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
			e.preventDefault();
			submit();
		} 
		else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			submit('editor');
		}
		else if (e.key === 'Enter' && e.shiftKey) {
			e.preventDefault();
			submit('another');
		}
		else if (e.key === 'Escape') {
			content = '';
			onCaptured?.();
		}
	}

	onMount(() => {
		if (autoFocus && inputEl) {
			inputEl.focus();
		}
	});
</script>

<div class="spark-container" class:focused={isFocused}>
	<div class="spark-inner glass">
		<div class="spark-icon-badge">
			<Icon size={18} strokeWidth={2.5} />
		</div>
		
		<textarea
			bind:this={inputEl}
			bind:value={content}
			class="spark-textarea"
			placeholder="Capture a thought..."
			rows="1"
			onkeydown={handleKeydown}
			onfocus={() => { isFocused = true; }}
			onblur={() => { isFocused = false; }}
		></textarea>

		<div class="spark-actions" class:visible={content.length > 0}>
			<button
				class="spark-btn"
				onclick={() => submit('editor')}
				title="Save and Open Editor (⌘Enter)"
				disabled={isSubmitting}
			>
				<FileText size={18} />
				<span class="btn-hint">⌘↵</span>
			</button>
			<button
				class="spark-btn"
				onclick={() => submit('another')}
				title="Save and Add Another (Shift+Enter)"
				disabled={isSubmitting}
			>
				<PlusCircle size={18} />
				<span class="btn-hint">⇧↵</span>
			</button>
			<button
				class="spark-btn primary"
				onclick={() => submit('default')}
				title="Quick Capture (Enter)"
				disabled={isSubmitting}
			>
				<CornerDownLeft size={18} />
				<span class="btn-hint">↵</span>
			</button>
		</div>
	</div>
</div>

<style>
	.spark-container {
		width: 100%;
		transition: transform 0.3s var(--ease-out);
	}

	.spark-container.focused {
		transform: translateY(-2px);
	}

	.spark-inner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-pill);
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		padding: 0 0.75rem 0 0.5rem;
		min-height: 52px;
		box-shadow: var(--shadow-xl);
	}

	.spark-icon-badge {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--brand-tint);
		color: var(--color-brand);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		box-shadow: 0 0 15px var(--brand-glow);
	}

	.spark-textarea {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		color: var(--text-primary);
		font-family: inherit;
		font-size: 1rem;
		padding: 0.875rem 0;
		resize: none;
		height: 24px;
		line-height: 24px;
		max-height: 200px;
	}

	.spark-textarea::placeholder {
		color: var(--text-muted);
		opacity: 0.5;
	}

	.spark-actions {
		display: flex;
		gap: 0.5rem;
		opacity: 0;
		transform: translateX(10px);
		pointer-events: none;
		transition: all 0.25s var(--ease-out);
	}

	.spark-actions.visible {
		opacity: 1;
		transform: translateX(0);
		pointer-events: auto;
	}

	.spark-btn {
		width: 42px;
		height: 42px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-elevated);
		border: none;
		border-radius: 50%;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.25s var(--ease-out);
		position: relative;
		overflow: hidden;
	}

	.spark-btn:hover:not(:disabled) {
		background: var(--bg-hover);
		color: var(--text-primary);
		transform: scale(1.05);
	}

	.spark-btn :global(svg) {
		transition: all 0.2s var(--ease-out);
	}

	.spark-btn:hover :global(svg) {
		opacity: 0;
		transform: scale(0.6) translateY(-10px);
	}

	.btn-hint {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -20%);
		font-size: 0.65rem;
		font-weight: 800;
		opacity: 0;
		transition: all 0.25s var(--ease-out);
		pointer-events: none;
		white-space: nowrap;
	}

	.spark-btn:hover .btn-hint {
		opacity: 1;
		transform: translate(-50%, -50%);
	}

	.spark-btn.primary {
		color: var(--color-brand);
		background: var(--brand-tint);
	}

	.spark-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 600px) {
		.spark-btn {
			width: 44px;
			height: 44px;
		}
		.btn-hint { display: none; }
	}
</style>
