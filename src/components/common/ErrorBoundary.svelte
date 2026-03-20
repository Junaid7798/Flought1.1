<script lang="ts">
	import { AlertTriangle, RefreshCw } from 'lucide-svelte';

	interface Props {
		children: import('svelte').Snippet;
		fallback?: import('svelte').Snippet;
		name?: string;
	}

	let { children, fallback, name = 'Component' }: Props = $props();

	let error = $state<Error | null>(null);

	// In Svelte 5, we can use a wrapper that try-catches the render or logic.
	// However, template errors are harder to catch.
	// For now, we provide a way to manually set an error state if a child fails its logic.
	
	export function triggerError(err: Error) {
		error = err;
	}

	function reset() {
		error = null;
	}
</script>

{#if error}
	<div class="error-boundary">
		<div class="error-content">
			<span class="error-icon-box">
				<AlertTriangle size={24} />
			</span>
			<div class="error-text">
				<h3>{name} failed to load</h3>
				<p>{error.message}</p>
			</div>
			<button class="reset-btn" onclick={reset} title="Retry">
				<RefreshCw size={16} />
			</button>
		</div>
	</div>
{:else}
	{@render children()}
{/if}

<style>
	.error-boundary {
		padding: 1.5rem;
		background: rgba(255, 68, 68, 0.05);
		border: 1px dashed rgba(255, 68, 68, 0.2);
		border-radius: var(--radius-lg);
		margin: 1rem;
	}

	.error-content {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.error-icon-box {
		color: var(--color-error);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.error-text {
		flex: 1;
	}

	h3 {
		font-size: 0.875rem;
		font-weight: 700;
		margin: 0 0 2px;
		color: var(--text-primary);
	}

	p {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin: 0;
	}

	.reset-btn {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		color: var(--text-secondary);
		width: 32px;
		height: 32px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s;
	}

	.reset-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
		border-color: var(--border-strong);
	}
</style>
