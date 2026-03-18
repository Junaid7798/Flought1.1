<script lang="ts">
	import { $t as t } from '$lib/i18n';
	import { createThought } from '$lib/db';
	import { showToast } from '$lib/stores/toastStore.svelte';

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		libraryId: string;
	}
	let { libraryId }: Props = $props();

	// ── State ─────────────────────────────────────────────────────────────────

	let value = $state('');
	let inputEl = $state<HTMLInputElement | null>(null);
	let bouncing = $state(false);

	// ── Handlers ──────────────────────────────────────────────────────────────

	async function submit() {
		const text = value.trim();
		if (!text) return;
		await createThought(libraryId, text);
		value = '';
		triggerBounce();
		const stage = t('stage.1');
		showToast(t('toast.captured').replace('{stage}', stage));
	}

	function triggerBounce() {
		bouncing = false;
		// Force a reflow so the class toggle is picked up as a new animation
		requestAnimationFrame(() => {
			bouncing = true;
			setTimeout(() => { bouncing = false; }, 180);
		});
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			submit();
		} else if (e.key === 'Escape') {
			value = '';
			inputEl?.blur();
		}
	}
</script>

<div class="spark-wrap">
	<div class="spark-inner" class:bounce={bouncing}>
		<span class="spark-icon" aria-hidden="true">+</span>
		<input
			class="spark-input"
			type="text"
			bind:value
			bind:this={inputEl}
			onkeydown={handleKeydown}
			placeholder={t('capture.prompt')}
			maxlength={300}
			aria-label={t('capture.prompt')}
		/>
	</div>
</div>

<style>
	.spark-wrap {
		width: 100%;
		padding: 0.5rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.spark-inner {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		background: var(--bg-panel);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 0 1rem;
		min-height: 52px;
		transition: border-color 150ms;
		/* Static glow — not animated, so no rule violation */
		box-shadow: 0 0 0 0 transparent;
	}

	/* Focused state: show border and glow */
	.spark-wrap:focus-within .spark-inner {
		border-color: var(--color-brand);
		box-shadow: 0 0 12px var(--brand-glow);
	}

	/* Bounce animation uses transform only — Rule 9 compliant */
	.spark-inner.bounce {
		animation: spark-bounce 180ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}

	@keyframes spark-bounce {
		0%   { transform: scale(1); }
		40%  { transform: scale(0.97); }
		100% { transform: scale(1); }
	}

	.spark-icon {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text-muted);
		flex-shrink: 0;
		line-height: 1;
		user-select: none;
		transition: color 150ms;
	}

	.spark-wrap:focus-within .spark-icon {
		color: var(--color-brand);
	}

	.spark-input {
		flex: 1;
		background: none;
		border: none;
		outline: none;
		color: var(--text-primary);
		font-size: 0.9375rem;
		font-family: inherit;
		min-height: 44px;
		padding: 0;
	}

	.spark-input::placeholder {
		color: var(--text-muted);
		opacity: 0.4;
	}

	/* Mobile layout is handled by MobileDock (bottom sheet context) */
</style>
