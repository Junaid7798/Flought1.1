<script lang="ts">
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import SparkInput from './SparkInput.svelte';

	function close() {
		uiStore.isSparkInputOpen = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

{#if uiStore.isSparkInputOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="capture-overlay"
		transition:fade={{ duration: 250 }}
		onclick={close}
	>
		<div
			class="capture-modal"
			transition:scale={{ duration: 450, start: 0.9, opacity: 0, easing: quintOut }}
			onclick={(e) => e.stopPropagation()}
		>
			<div class="modal-header">
				<span class="modal-title">Quick Capture</span>
				<span class="modal-hint">ESC to close</span>
			</div>
			<div class="modal-content">
				<SparkInput
					libraryId={uiStore.activeLibraryId} 
					autoFocus={true}
					onCaptured={close} 
				/>
			</div>
		</div>
	</div>
{/if}

<style>
	.capture-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 3000;
		padding: 1.5rem;
	}

	.capture-modal {
		width: 100%;
		max-width: 600px;
		background: var(--glass-panel);
		border: 1px solid var(--border-strong);
		border-radius: 20px;
		box-shadow: 
			0 0 0 1px rgba(255, 255, 255, 0.05),
			0 20px 50px rgba(0, 0, 0, 0.6),
			0 0 100px var(--brand-glow);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem 0.5rem;
		background: rgba(255, 255, 255, 0.02);
	}

	.modal-title {
		font-size: 0.7rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--text-muted);
		opacity: 0.8;
	}

	.modal-hint {
		font-size: 0.65rem;
		color: var(--text-muted);
		opacity: 0.5;
	}

	.modal-content {
		padding: 0 0.5rem 0.5rem;
	}
</style>
