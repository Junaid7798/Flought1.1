<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { uiStore } from '$lib/stores/uiStore';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div
	class="shell"
	style="--sidebar-width: {uiStore.sidebarWidth}px"
>
	<aside class="sidebar"></aside>
	<main class="main">{@render children()}</main>
</div>

<style>
	.shell {
		display: grid;
		grid-template-columns: var(--sidebar-width) 1fr;
		height: 100dvh;
	}

	.sidebar {
		background-color: var(--bg-panel);
	}

	.main {
		background-color: var(--bg-deep);
		overflow: hidden;
	}
</style>
