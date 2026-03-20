<script lang="ts">
	interface Props {
		width?: string;
		height?: string;
		radius?: string;
		className?: string; // Svelte 5 style for extra classes
	}

	let { width = '100%', height = '12px', radius = 'var(--radius-sm)', className = '' }: Props = $props();
</script>

<div
	class="skeleton {className}"
	style="width: {width}; height: {height}; border-radius: {radius};"
	aria-hidden="true"
></div>

<style>
	.skeleton {
		background: linear-gradient(
			90deg,
			rgba(255, 255, 255, 0.03) 25%,
			rgba(255, 255, 255, 0.06) 50%,
			rgba(255, 255, 255, 0.03) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite linear;
		display: inline-block;
		overflow: hidden;
		flex-shrink: 0;
	}

	@keyframes shimmer {
		from { background-position: 200% 0; }
		to   { background-position: -200% 0; }
	}

	/* Pulse fallback if reduced motion is preferred */
	@media (prefers-reduced-motion: reduce) {
		.skeleton {
			animation: pulse 2s infinite ease-in-out;
			background: rgba(255, 255, 255, 0.04);
		}
	}

	@keyframes pulse {
		0%, 100% { opacity: 0.5; }
		50% { opacity: 1; }
	}
</style>
