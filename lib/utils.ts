import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function for merging Tailwind CSS classes.
 * Automatically installed by shadcn/ui.
 *
 * Combines two libraries:
 * - clsx: Handles conditional classes (e.g., cn("base", isActive && "active"))
 * - twMerge: Intelligently merges Tailwind classes and resolves conflicts
 *
 * Example:
 * cn("text-red-500", "text-blue-500") → "text-blue-500" (last value wins)
 * cn("px-4 py-2", className) → merges default styles with custom className prop
 *
 * Used by all shadcn components to combine default styles with user overrides.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

/**
 * URL Validation Result
 */
export type URLValidationResult =
	| { valid: true; url: string }
	| { valid: false; error: string; details?: string }

/**
 * Validates a URL string with strict rules:
 * - Must be a valid URL format
 * - Must use http or https protocol
 * - Cannot contain multiple URLs (separated by spaces, commas, or newlines)
 * - Trims whitespace before validation
 *
 * @param input - The URL string to validate
 * @returns Validation result with either the cleaned URL or error details
 *
 * @example
 * validateURL('https://example.com') // { valid: true, url: 'https://example.com' }
 * validateURL('not-a-url') // { valid: false, error: 'Invalid URL format' }
 * validateURL('ftp://example.com') // { valid: false, error: 'Invalid protocol' }
 * validateURL('url1.com url2.com') // { valid: false, error: 'Multiple URLs detected' }
 */
export function validateURL(input: string): URLValidationResult {
	const trimmed = input.trim()

	// Check for empty input
	if (!trimmed) {
		return {
			valid: false,
			error: 'URL is required',
			details: 'Please enter a URL',
		}
	}

	// Check for multiple URLs (separated by spaces, commas, or newlines)
	// This prevents users from pasting multiple URLs at once
	const hasMultipleURLs =
		/[\s,;]+https?:\/\//i.test(trimmed) || // Check for http:// or https:// after whitespace/comma
		/\n/.test(trimmed) || // Check for newlines
		(trimmed.match(/https?:\/\//gi) || []).length > 1 // Count protocol occurrences

	if (hasMultipleURLs) {
		return {
			valid: false,
			error: 'Multiple URLs detected',
			details: 'Please submit one URL at a time',
		}
	}

	// Validate URL format using native URL constructor
	try {
		const url = new URL(trimmed)

		// Only allow http and https protocols
		if (url.protocol !== 'http:' && url.protocol !== 'https:') {
			return {
				valid: false,
				error: 'Invalid protocol',
				details: 'Only HTTP and HTTPS URLs are supported',
			}
		}

		// Check for valid hostname (not just 'localhost' or IP without proper format)
		if (!url.hostname || url.hostname.length < 1) {
			return {
				valid: false,
				error: 'Invalid hostname',
				details: 'URL must have a valid domain name',
			}
		}

		return {
			valid: true,
			url: trimmed,
		}
	} catch (error) {
		return {
			valid: false,
			error: 'Invalid URL format',
			details: 'Please enter a valid web address (e.g., https://example.com)',
		}
	}
}
