<script lang="ts">
	import { page } from '$app/stores';
	import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-svelte';
	import { goto } from '$app/navigation';
</script>

<div class="error-page">
	<div class="mesh-bg"></div>
	
	<div class="error-container">
		<div class="error-glass">
			<div class="error-icon" aria-hidden="true">
				<AlertTriangle size={42} strokeWidth={1.5} />
			</div>
			
			<h1 class="error-title">View unavailable</h1>
			<p class="error-message">
				{$page.error?.message || "An unexpected error occurred while loading this view."}
			</p>
			
			<div class="error-actions">
				<button class="primary-btn" onclick={() => goto('/map')} type="button">
					<ArrowLeft size={16} />
					Return to Map
				</button>
				<button class="secondary-btn" onclick={() => window.location.reload()} type="button">
					<RefreshCw size={16} />
					Reload
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.error-page {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100dvh;
		background: #020617;
		overflow: hidden;
		color: var(--text-primary);
		font-family: 'Inter', system-ui, sans-serif;
	}

	.mesh-bg {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: 
			radial-gradient(at 0% 0%, rgba(34, 211, 238, 0.15) 0px, transparent 50%),
			radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.1) 0px, transparent 50%),
			radial-gradient(at 0% 100%, rgba(59, 130, 246, 0.1) 0px, transparent 50%);
		filter: blur(80px);
		z-index: 0;
	}

	.error-container {
		position: relative;
		z-index: 10;
		width: 100%;
		max-width: 440px;
		padding: var(--spacing-md);
	}

	.error-glass {
		background: rgba(15, 23, 42, 0.6);
		backdrop-filter: blur(24px) saturate(180%);
		-webkit-backdrop-filter: blur(24px) saturate(180%);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 2rem;
		padding: 3rem 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
	}

	.error-icon {
		color: var(--color-error);
		margin-bottom: 2rem;
		width: 88px;
		height: 88px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 68, 68, 0.08);
		border-radius: 2.5rem;
		box-shadow: inset 0 0 20px rgba(255, 68, 68, 0.1);
	}

	.error-title {
		font-size: 1.75rem;
		font-weight: 800;
		letter-spacing: -0.04em;
		margin: 0 0 1rem;
		color: #fff;
	}

	.error-message {
		color: rgba(255, 255, 255, 0.6);
		font-size: 1rem;
		line-height: 1.6;
		margin: 0 0 2.5rem;
		max-width: 320px;
	}

	.error-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
	}

	.error-actions button {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 0.875rem;
		border-radius: 1rem;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.primary-btn {
		background: #fff;
		color: #020617;
		border: none;
	}

	.primary-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 20px -5px rgba(255, 255, 255, 0.3);
		background: #f8fafc;
	}

	.secondary-btn {
		background: rgba(255, 255, 255, 0.05);
		color: #fff;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.secondary-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
	}
</style>
