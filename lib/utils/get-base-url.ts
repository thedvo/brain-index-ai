/**
 * Returns the base URL for the application
 * Prioritizes NEXT_PUBLIC_SITE_URL if set (for production)
 * Falls back to window.location.origin (for all environments)
 */
export function getBaseURL(): string {
	// In production, use the environment variable if set
	if (process.env.NEXT_PUBLIC_SITE_URL) {
		return process.env.NEXT_PUBLIC_SITE_URL
	}

	// In browser, use current origin
	if (typeof window !== 'undefined') {
		return window.location.origin
	}

	// Fallback for server-side (shouldn't normally be used)
	return 'http://localhost:3000'
}
