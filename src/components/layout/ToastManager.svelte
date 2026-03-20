<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toasts, dismissToast } from '$lib/stores/toastStore.svelte';
	import { Info, AlertCircle, X } from 'lucide-svelte';
</script>

<!-- Ghost toast stack — fixed bottom-centre, above mobile dock -->
<div class="toast-region" aria-live="polite" aria-atomic="false">
	{#each toasts as toast (toast.id)}
		<div
			class="toast"
			class:toast--error={toast.type === 'error'}
			class:toast--info={toast.type === 'info'}
			in:fly={{ y: 20, duration: 200 }}
			out:fly={{ y: 20, duration: 200 }}
			role="status"
		>
			<div class="toast-content">
				{#if toast.type === 'error'}
					<AlertCircle size={15} class="toast-icon icon-error" />
				{:else}
					<Info size={15} class="toast-icon icon-info" />
				{/if}
				<span class="toast-msg">{toast.message}</span>
			</div>
			<button
				class="toast-dismiss"
				onclick={() => dismissToast(toast.id)}
				type="button"
				aria-label="Dismiss"
			>
				<X size={14} />
			</button>
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
		justify-content: space-between;
		gap: 0.75rem;
		background: rgba(10, 10, 20, 0.85);
		backdrop-filter: blur(12px) saturate(180%);
		-webkit-backdrop-filter: blur(12px) saturate(180%);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-lg);
		padding: 0.625rem 0.875rem;
		font-size: 0.875rem;
		color: var(--text-primary);
		pointer-events: all;
		box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.5);
		min-width: 240px;
		max-width: 320px;
	}

	.toast-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	:global(.toast-icon) {
		flex-shrink: 0;
	}

	:global(.icon-info) { color: var(--color-brand); }
	:global(.icon-error) { color: var(--color-error); }

	.toast--error {
		border-color: rgba(255, 68, 68, 0.3);
		background: rgba(40, 0, 0, 0.8);
	}

	.toast--info {
		border-color: rgba(34, 211, 238, 0.3);
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
