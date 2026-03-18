<script lang="ts">
	interface Props {
		x: number;
		y: number;
		onselect: (item: SlashItem) => void;
		onclose: () => void;
	}

	export interface SlashItem {
		label: string;
		syntax: string;
	}

	let { x, y, onselect, onclose }: Props = $props();

	const ITEMS: SlashItem[] = [
		{ label: 'Heading 1',  syntax: '# '     },
		{ label: 'Heading 2',  syntax: '## '    },
		{ label: 'Checkbox',   syntax: '- [ ] ' },
	];

	let activeIndex = $state(0);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = (activeIndex + 1) % ITEMS.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = (activeIndex - 1 + ITEMS.length) % ITEMS.length;
		} else if (e.key === 'Enter') {
			e.preventDefault();
			onselect(ITEMS[activeIndex]);
		} else if (e.key === 'Escape') {
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop click to close -->
<div
	class="backdrop"
	role="presentation"
	onmousedown={onclose}
></div>

<div
	class="menu"
	style="left:{x}px; top:{y}px;"
	role="listbox"
	aria-label="Slash command menu"
>
	{#each ITEMS as item, i}
		<button
			class="menu-item"
			class:active={i === activeIndex}
			role="option"
			aria-selected={i === activeIndex}
			onmousedown={(e) => { e.preventDefault(); onselect(item); }}
			onmouseenter={() => (activeIndex = i)}
			type="button"
		>
			{item.label}
		</button>
	{/each}
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 49;
	}

	.menu {
		position: fixed;
		z-index: 50;
		background: var(--bg-surface);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		padding: 0.25rem;
		min-width: 160px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	}

	.menu-item {
		display: flex;
		align-items: center;
		width: 100%;
		min-height: 36px;
		padding: 0 0.75rem;
		background: none;
		border: none;
		border-radius: 6px;
		color: var(--text-secondary);
		font-size: 0.875rem;
		font-family: inherit;
		text-align: left;
		cursor: pointer;
		transition: background 80ms, color 80ms;
	}

	.menu-item.active {
		background: var(--bg-hover);
		color: var(--text-primary);
	}
</style>
