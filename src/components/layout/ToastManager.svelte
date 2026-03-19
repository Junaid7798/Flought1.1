<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toasts, dismissToast } from '$lib/stores/toastStore.svelte';
</script>

<!-- Ghost toast stack — fixed bottom-centre, above mobile dock -->
<div class="toast-region" aria-live="polite" aria-atomic="false">
	{#each toasts as toast (toast.id)}
		<div
			class="toast"
			class:toast--error={toast.type === 'error'}
			class:toast--info={toast.type === 'info'}
			in:fly={{ y: 20, duration: 220 }}
			out:fly={{ y: 20, duration: 180 }}
			role="status"
		>
			<span class="toast-msg">{toast.message}</span>
			<button
				class="toast-dismiss"
				onclick={() => dismissToast(toast.id)}
				type="button"
				aria-label="Dismiss"
			>×</button>
		</div>
	{/each}
</div>

<style>
	.toast-region {
		position: fixed;
		bottom: calc(80px + env(safe-area-inset-bottom));
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		z-index: 9000;
		pointer-events: none;
	}

	.toast {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: var(--bg-hover);
		border: 1px solid var(--border-strong);
		border-radius: 999px;
		padding: 0.5rem 1rem 0.5rem 1.125rem;
		font-size: 0.875rem;
		color: var(--text-primary);
		pointer-events: all;
		/* No box-shadow animation — just static shadow, Rule 9 compliant */
		box-shadow: 0 4px 24px var(--shadow-dropdown);
		white-space: nowrap;
	}

	.toast--error {
		border-color: var(--color-error);
	}

	.toast--info {
		border-color: var(--color-brand);
	}

	.toast-msg {
		line-height: 1.4;
	}

	.toast-dismiss {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		padding: 0;
		min-width: 20px;
		min-height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 120ms;
	}

	.toast-dismiss:hover {
		color: var(--text-primary);
	}

	/* On desktop, sit above spark bar instead of mobile dock */
	@media (min-width: 768px) {
		.toast-region {
			bottom: calc(72px + env(safe-area-inset-bottom));
		}
	}
</style>
