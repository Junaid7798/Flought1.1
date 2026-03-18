<script lang="ts">
	import { $t as t } from '$lib/i18n';
	import { supabase } from '$lib/supabase';
	import { updateUserSettings } from '$lib/db';

	interface Props {
		status: 'local' | 'synced' | 'syncing' | 'offline' | 'error';
		/** ISO timestamp of last successful sync — used when status = 'synced' */
		lastSyncedAt?: string | null;
	}

	let { status, lastSyncedAt = null }: Props = $props();

	// ── Modal ─────────────────────────────────────────────────────────────────

	let modalOpen = $state(false);
	let connecting = $state(false);
	let isReconnect = $state(false);

	function handleBadgeClick() {
		if (status === 'local') {
			isReconnect = false;
			modalOpen = true;
		} else if (status === 'error') {
			isReconnect = true;
			modalOpen = true;
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) modalOpen = false;
	}

	function handleBackdropKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') modalOpen = false;
	}

	async function connectGoogleDrive() {
		connecting = true;
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				scopes: 'https://www.googleapis.com/auth/drive.appdata',
				redirectTo: `${location.origin}/map`,
			},
		});
		if (error) {
			connecting = false;
			return;
		}
		// Supabase redirects away; on return the (app) layout will detect
		// the new Google token. Mark settings as connected preemptively —
		// if the redirect fails, sync status will revert on next check.
		await updateUserSettings({ sync_connected: true, sync_provider: 'google' });
		modalOpen = false;
		connecting = false;
	}

	// ── Label ─────────────────────────────────────────────────────────────────

	const label = $derived((): string => {
		switch (status) {
			case 'local':   return t('sync.local');
			case 'syncing': return t('sync.syncing');
			case 'offline': return t('sync.offline');
			case 'error':   return t('sync.error');
			case 'synced': {
				if (!lastSyncedAt) return t('sync.justNow');
				const diffMs = Date.now() - new Date(lastSyncedAt).getTime();
				const mins = Math.floor(diffMs / 60_000);
				if (mins < 1)  return t('sync.justNow');
				if (mins === 1) return t('sync.oneMin');
				return t('sync.minsAgo').replace('{n}', String(mins));
			}
		}
	});

	// ── Dot colour CSS var ────────────────────────────────────────────────────

	const dotVar = $derived((): string => {
		switch (status) {
			case 'local':   return 'var(--color-archive)';
			case 'synced':  return 'var(--color-forge)';
			case 'syncing': return 'var(--color-queue)';
			case 'offline': return 'var(--color-inbox)';
			case 'error':   return 'var(--color-error)';
		}
	});
</script>

<!-- Badge (clickable when local) -->
<button
	class="badge"
	class:clickable={status === 'local' || status === 'error'}
	aria-label={label()}
	onclick={handleBadgeClick}
	type="button"
>
	<span
		class="dot"
		class:pulse={status === 'syncing'}
		style="background:{dotVar()};"
	></span>
	<span class="label-text">{label()}</span>
</button>

<!-- Connect modal -->
{#if modalOpen}
	<div
		class="overlay"
		role="dialog"
		aria-modal="true"
		aria-label={isReconnect ? t('sync.reconnectTitle') : t('sync.connectTitle')}
		tabindex="-1"
		onclick={handleBackdropClick}
		onkeydown={handleBackdropKeydown}
	>
		<div class="modal">
			<p class="modal-title">{isReconnect ? t('sync.reconnectTitle') : t('sync.connectTitle')}</p>

			<button
				class="btn btn-connect"
				onclick={connectGoogleDrive}
				disabled={connecting}
				type="button"
			>
				<svg class="drive-icon" viewBox="0 0 24 24" aria-hidden="true">
					<path fill="currentColor" d="M7.71 3.5L1.15 15l3.43 5.98 6.56-11.48L7.71 3.5z"/>
					<path fill="currentColor" d="M16.29 3.5H7.71l6.56 11.48h8.58L16.29 3.5z"/>
					<path fill="currentColor" d="M4.58 20.98h13.72l-3.44-5.98H1.15l3.43 5.98z"/>
				</svg>
				{connecting ? '…' : isReconnect ? t('sync.reconnectCta') : t('sync.connectCta')}
			</button>

			<button
				class="btn btn-cancel"
				onclick={() => (modalOpen = false)}
				type="button"
			>
				{t('sync.connectCancel')}
			</button>
		</div>
	</div>
{/if}

<style>
	/* Badge */
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: none;
		border: none;
		padding: 0;
		cursor: default;
		font-family: inherit;
	}

	.badge.clickable {
		cursor: pointer;
	}

	.dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.dot.pulse {
		animation: pulse 1.4s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50%       { opacity: 0.3; }
	}

	.label-text {
		font-size: 0.75rem;
		color: var(--text-muted);
		white-space: nowrap;
	}

	/* Overlay */
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--overlay-backdrop);
		padding: 1rem;
	}

	/* Modal */
	.modal {
		width: 100%;
		max-width: 340px;
		background: var(--bg-panel);
		border: 1px solid var(--border-strong);
		border-radius: 12px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.modal-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
		text-align: center;
		margin: 0 0 0.25rem;
	}

	/* Buttons */
	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		min-height: 44px;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition: opacity 0.15s;
		font-family: inherit;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn:not(:disabled):active {
		opacity: 0.8;
	}

	.btn-connect {
		background: var(--color-brand);
		color: var(--bg-deep);
		font-weight: 600;
	}

	.btn-connect:not(:disabled):hover {
		opacity: 0.9;
	}

	.btn-cancel {
		background: transparent;
		color: var(--text-muted);
	}

	.btn-cancel:hover {
		color: var(--text-secondary);
	}

	.drive-icon {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}
</style>
