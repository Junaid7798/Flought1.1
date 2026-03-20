import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { dev } from '$app/environment';

// Validate environment variables at module load
if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
	throw new Error('FATAL: Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

/**
 * Mock session for local development to bypass repeated logins.
 */
const MOCK_SESSION = {
	user: { 
		id: '00000000-0000-0000-0000-000000000000', 
		email: 'dev@flought.local',
		user_metadata: { full_name: 'Developer' }
	},
	access_token: 'mock-dev-token',
	expires_at: 9999999999,
} as any;

export async function getSession() {
	// Bypass in DEV if specifically toggled via localStorage
	if (dev && typeof window !== 'undefined' && localStorage.getItem('flought_dev_bypass') === 'true') {
		return MOCK_SESSION;
	}

	const { data, error } = await supabase.auth.getSession();
	if (error) throw error;
	return data.session;
}

/**
 * Toggle development auth bypass.
 */
export function setDevBypass(enabled: boolean) {
	if (!dev) return;
	if (enabled) {
		localStorage.setItem('flought_dev_bypass', 'true');
		console.log('✅ Auth bypass ENABLED. Reloading...');
	} else {
		localStorage.removeItem('flought_dev_bypass');
		console.log('❌ Auth bypass DISABLED. Reloading...');
	}
	window.location.reload();
}
