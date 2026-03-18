<script lang="ts">
	import { $t as t } from '$lib/i18n';

	interface Props {
		status: 'local' | 'synced' | 'syncing' | 'offline' | 'error';
		/** ISO timestamp of last successful sync — used when status = 'synced' */
		lastSyncedAt?: string | null;
	}

	let { status, lastSyncedAt = null }: Props = $props();

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

<span class="badge" aria-label={label()}>
	<span
		class="dot"
		class:pulse={status === 'syncing'}
		style="background:{dotVar()};"
	></span>
	<span class="label">{label()}</span>
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
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

	.label {
		font-size: 0.75rem;
		color: var(--text-muted);
		white-space: nowrap;
	}
</style>
