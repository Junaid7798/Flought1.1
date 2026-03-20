<script lang="ts">
	import { Sparkles } from 'lucide-svelte';
	import { uiStore } from '$lib/stores/uiStore.svelte';

	function toggle() {
		uiStore.isSparkInputOpen = !uiStore.isSparkInputOpen;
	}
</script>

<div class="fab-container">
	<button
		class="fab"
		class:active={uiStore.isSparkInputOpen}
		onclick={toggle}
		title="Quick Capture (Cmd+J)"
	>
		<div class="fab-bg"></div>
		<div class="fab-icon">
			<Sparkles size={24} strokeWidth={2.2} />
		</div>
	</button>
</div>

<style>
	.fab-container {
		position: fixed;
		bottom: 2rem;
		right: 2.5rem;
		z-index: 1000;
		pointer-events: none;
	}

	.fab {
		pointer-events: auto;
		position: relative;
		width: 64px;
		height: 64px;
		border-radius: 32px;
		border: none;
		background: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #000;
		transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
		box-shadow: 
			0 10px 40px rgba(0, 0, 0, 0.4),
			0 0 15px var(--brand-glow);
	}

	.fab-bg {
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: var(--color-brand);
		transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s;
		z-index: 1;
	}

	.fab-icon {
		position: relative;
		z-index: 2;
		transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.fab:hover .fab-bg {
		transform: scale(1.1);
		filter: brightness(1.1);
	}

	.fab:active {
		transform: scale(0.9) translateY(2px);
	}

	.fab.active {
		transform: rotate(135deg) scale(0.8);
	}

	.fab.active .fab-bg {
		background: var(--text-muted);
	}

	/* Hide FAB on mobile as the dock has a capture button */
	@media (max-width: 767px) {
		.fab-container {
			display: none;
		}
	}
</style>
