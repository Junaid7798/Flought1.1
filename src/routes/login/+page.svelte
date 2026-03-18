<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { $t as t } from '$lib/i18n';

	// ── State ─────────────────────────────────────────────────────────────────

	let email = $state('');
	let sending = $state(false);
	let sent = $state(false);
	let errorMsg = $state('');

	// ── OAuth ─────────────────────────────────────────────────────────────────

	async function signInWithGoogle() {
		errorMsg = '';
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: { redirectTo: `${location.origin}/map` },
		});
		if (error) errorMsg = t('login.error');
	}

	async function signInWithGitHub() {
		errorMsg = '';
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'github',
			options: { redirectTo: `${location.origin}/map` },
		});
		if (error) errorMsg = t('login.error');
	}

	// ── Magic link ────────────────────────────────────────────────────────────

	async function sendMagicLink() {
		if (!email.trim()) return;
		sending = true;
		errorMsg = '';
		const { error } = await supabase.auth.signInWithOtp({
			email: email.trim(),
			options: { emailRedirectTo: `${location.origin}/map` },
		});
		sending = false;
		if (error) {
			errorMsg = t('login.error');
		} else {
			sent = true;
		}
	}

	function handleEmailKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') sendMagicLink();
	}
</script>

<div class="login-page">
	<div class="card">
		<!-- Brand -->
		<div class="brand">
			<span class="brand-name">Flought</span>
			<span class="brand-tagline">{t('login.tagline')}</span>
		</div>

		<!-- OAuth buttons -->
		<div class="oauth-group">
			<button class="btn btn-oauth" onclick={signInWithGoogle}>
				<svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true">
					<path
						fill="currentColor"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						fill="currentColor"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="currentColor"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
					/>
					<path
						fill="currentColor"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
				{t('login.google')}
			</button>

			<button class="btn btn-oauth" onclick={signInWithGitHub}>
				<svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true">
					<path
						fill="currentColor"
						d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
					/>
				</svg>
				{t('login.github')}
			</button>
		</div>

		<!-- Divider -->
		<div class="divider" role="separator">
			<span>{t('login.emailLabel')}</span>
		</div>

		<!-- Magic link -->
		{#if sent}
			<p class="sent-msg">
				{t('login.emailSent').replace('{email}', email.trim())}
			</p>
		{:else}
			<div class="email-group">
				<input
					type="email"
					class="email-input"
					bind:value={email}
					placeholder={t('login.emailPlaceholder')}
					aria-label={t('login.emailLabel')}
					autocomplete="email"
					onkeydown={handleEmailKeydown}
					disabled={sending}
				/>
				<button class="btn btn-primary" onclick={sendMagicLink} disabled={sending || !email.trim()}>
					{sending ? '…' : t('login.emailCta')}
				</button>
			</div>
		{/if}

		{#if errorMsg}
			<p class="error" role="alert">{errorMsg}</p>
		{/if}
	</div>
</div>

<style>
	.login-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100dvh;
		background: var(--bg-deep);
		padding: 1.5rem;
	}

	.card {
		width: 100%;
		max-width: 380px;
		background: var(--bg-panel);
		border: 1px solid var(--border-strong);
		border-radius: 16px;
		padding: 2rem 1.75rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	/* Brand */
	.brand {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		margin-bottom: 0.5rem;
	}

	.brand-name {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}

	.brand-tagline {
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	/* Buttons */
	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.625rem;
		width: 100%;
		min-height: 44px;
		border-radius: 8px;
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition: opacity 0.15s;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn:not(:disabled):active {
		opacity: 0.8;
	}

	.oauth-group {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.btn-oauth {
		background: var(--bg-surface);
		color: var(--text-primary);
		border: 1px solid var(--border-strong);
	}

	.btn-oauth:not(:disabled):hover {
		background: var(--bg-hover);
	}

	.btn-primary {
		background: var(--color-brand);
		color: var(--bg-deep);
		font-weight: 600;
		flex-shrink: 0;
	}

	.btn-primary:not(:disabled):hover {
		opacity: 0.9;
	}

	/* Provider icon */
	.provider-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	/* Divider */
	.divider {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: var(--text-muted);
		font-size: 0.8125rem;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--border-strong);
	}

	/* Email group */
	.email-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.email-input {
		width: 100%;
		min-height: 44px;
		padding: 0 0.875rem;
		background: var(--bg-surface);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.9375rem;
		outline: none;
		box-sizing: border-box;
	}

	.email-input::placeholder {
		color: var(--text-muted);
	}

	.email-input:focus {
		border-color: var(--color-brand);
	}

	.email-input:disabled {
		opacity: 0.5;
	}

	/* Feedback */
	.sent-msg {
		font-size: 0.875rem;
		color: var(--color-forge);
		text-align: center;
		padding: 0.5rem 0;
		margin: 0;
	}

	.error {
		font-size: 0.8125rem;
		color: var(--color-inbox);
		text-align: center;
		margin: 0;
	}

	@media (max-width: 767px) {
		.card {
			padding: 1.5rem 1.25rem;
		}
	}
</style>
