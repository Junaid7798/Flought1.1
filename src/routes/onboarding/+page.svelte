<script lang="ts">
	import { goto } from '$app/navigation';
	import { $t as t } from '$lib/i18n';
	import { BLUEPRINTS, type Blueprint } from '$lib/blueprints';
	import {
		initUserProfile,
		applyBlueprint,
		markOnboardingComplete,
	} from '$lib/db';

	// ── State ─────────────────────────────────────────────────────────────────

	type Step = 'name' | 'category' | 'blueprint';
	type Category = 'work' | 'personal';

	let step = $state<Step>('name');
	let name = $state('');
	let category = $state<Category | null>(null);
	let submitting = $state(false);

	// ── Derived ───────────────────────────────────────────────────────────────

	const nameValid = $derived(name.trim().length > 0);

	const blueprintList = $derived(
		Object.entries(BLUEPRINTS)
			.filter(([, bp]) => bp.category === category)
			.slice(0, 5) as [string, Blueprint][]
	);

	// ── Handlers ──────────────────────────────────────────────────────────────

	function submitName() {
		if (!nameValid) return;
		step = 'category';
	}

	function selectCategory(cat: Category) {
		category = cat;
		step = 'blueprint';
	}

	async function selectBlueprint(useCase: string) {
		if (submitting) return;
		submitting = true;
		await initUserProfile(name.trim(), useCase);
		await applyBlueprint(useCase);
		await markOnboardingComplete();
		goto('/map');
	}

	function handleNameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') submitName();
	}

	let nameInputEl = $state<HTMLInputElement | null>(null);
	$effect(() => {
		nameInputEl?.focus();
	});
</script>

<svelte:head>
	<title>Welcome — Flought</title>
</svelte:head>

<div class="page">
	<!-- Step 1: Name -->
	{#if step === 'name'}
		<div class="card" aria-live="polite">
			<p class="eyebrow">Flought</p>
			<h1 class="heading">{t('onboarding.name.label')}</h1>
			<input
				class="name-input"
				type="text"
				placeholder={t('onboarding.name.placeholder')}
				bind:value={name}
				bind:this={nameInputEl}
				onkeydown={handleNameKeydown}
				maxlength={60}
				aria-label={t('onboarding.name.label')}
			/>
			<button
				class="cta"
				onclick={submitName}
				disabled={!nameValid}
				aria-disabled={!nameValid}
			>
				{t('onboarding.name.cta')}
			</button>
		</div>

	<!-- Step 2: Category -->
	{:else if step === 'category'}
		<div class="card" aria-live="polite">
			<p class="eyebrow">Hi, {name.trim()}</p>
			<h1 class="heading">{t('onboarding.category.label')}</h1>
			<div class="category-grid">
				<button class="category-btn" onclick={() => selectCategory('work')}>
					<span class="category-icon">💼</span>
					<span class="category-label">{t('onboarding.work')}</span>
					<span class="category-sub">{t('onboarding.category.work.sub')}</span>
				</button>
				<button class="category-btn" onclick={() => selectCategory('personal')}>
					<span class="category-icon">🌱</span>
					<span class="category-label">{t('onboarding.personal')}</span>
					<span class="category-sub">{t('onboarding.category.personal.sub')}</span>
				</button>
			</div>
		</div>

	<!-- Step 3: Blueprint -->
	{:else if step === 'blueprint'}
		<div class="card wide" aria-live="polite">
			<p class="eyebrow">{name.trim()}</p>
			<h1 class="heading">{t('onboarding.blueprint.label')}</h1>
			<p class="sub">{t('onboarding.blueprint.sub')}</p>
			<div class="blueprint-grid">
				{#each blueprintList as [useCase, bp]}
					<button
						class="blueprint-btn"
						onclick={() => selectBlueprint(useCase)}
						disabled={submitting}
					>
						<span class="blueprint-label">{bp.label}</span>
						<span class="blueprint-hook">{bp.kineticHookInstruction}</span>
						<span class="pipeline-tags">
							{#each bp.pipelineLabels as pl}
								<span class="pip">{pl}</span>
							{/each}
						</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.page {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--bg-deep);
		padding: 1.5rem;
		box-sizing: border-box;
	}

	/* ── Card ─────────────────────────────────────────────────────────────── */

	.card {
		width: 100%;
		max-width: 480px;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.card.wide {
		max-width: 640px;
	}

	.eyebrow {
		font-size: 0.8125rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-brand);
		margin: 0;
	}

	.heading {
		font-size: clamp(1.5rem, 4vw, 2rem);
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
		line-height: 1.2;
	}

	.sub {
		font-size: 0.9375rem;
		color: var(--text-secondary);
		margin: -0.5rem 0 0;
	}

	/* ── Name step ────────────────────────────────────────────────────────── */

	.name-input {
		width: 100%;
		background: var(--bg-surface);
		border: 1px solid var(--border-strong);
		border-radius: 10px;
		color: var(--text-primary);
		font-size: 1.0625rem;
		font-family: inherit;
		padding: 0.875rem 1rem;
		box-sizing: border-box;
		outline: none;
		transition: border-color 200ms;
		min-height: 44px;
	}

	.name-input::placeholder {
		color: var(--text-muted);
	}

	.name-input:focus {
		border-color: var(--color-brand);
	}

	.cta {
		width: 100%;
		min-height: 52px;
		background: var(--color-brand);
		color: var(--bg-deep);
		border: none;
		border-radius: 10px;
		font-size: 1rem;
		font-weight: 700;
		font-family: inherit;
		cursor: pointer;
		transition: opacity 150ms;
	}

	.cta:disabled {
		opacity: 0.35;
		cursor: default;
	}

	/* ── Category step ────────────────────────────────────────────────────── */

	.category-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.category-btn {
		min-height: 140px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.375rem;
		padding: 1.25rem;
		background: var(--bg-surface);
		border: 1.5px solid var(--border);
		border-radius: 12px;
		cursor: pointer;
		transition: border-color 150ms, background 150ms;
		text-align: left;
	}

	.category-btn:hover,
	.category-btn:focus-visible {
		border-color: var(--color-brand);
		background: var(--bg-hover);
		outline: none;
	}

	.category-icon {
		font-size: 1.75rem;
		line-height: 1;
		margin-bottom: 0.25rem;
	}

	.category-label {
		font-size: 1.0625rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.category-sub {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		line-height: 1.4;
	}

	/* ── Blueprint step ───────────────────────────────────────────────────── */

	.blueprint-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.blueprint-btn {
		width: 100%;
		min-height: 80px;
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-rows: auto auto;
		align-items: start;
		gap: 0.25rem 1rem;
		padding: 1rem 1.25rem;
		background: var(--bg-surface);
		border: 1.5px solid var(--border);
		border-radius: 12px;
		cursor: pointer;
		text-align: left;
		transition: border-color 150ms, background 150ms;
	}

	.blueprint-btn:hover,
	.blueprint-btn:focus-visible {
		border-color: var(--color-brand);
		background: var(--bg-hover);
		outline: none;
	}

	.blueprint-btn:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.blueprint-label {
		grid-column: 1;
		grid-row: 1;
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.blueprint-hook {
		grid-column: 1;
		grid-row: 2;
		font-size: 0.8125rem;
		color: var(--text-secondary);
	}

	.pipeline-tags {
		grid-column: 2;
		grid-row: 1 / 3;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		align-items: flex-end;
		align-self: center;
	}

	.pip {
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--color-brand);
		background: var(--brand-tint);
		border-radius: 4px;
		padding: 0.125rem 0.4rem;
		white-space: nowrap;
	}

	/* ── Mobile ───────────────────────────────────────────────────────────── */

	@media (max-width: 480px) {
		.category-grid {
			grid-template-columns: 1fr;
		}

		.category-btn {
			min-height: 44px;
			flex-direction: row;
			align-items: center;
			gap: 0.75rem;
		}

		.category-icon {
			margin-bottom: 0;
			font-size: 1.5rem;
		}

		.pipeline-tags {
			display: none;
		}
	}
</style>
