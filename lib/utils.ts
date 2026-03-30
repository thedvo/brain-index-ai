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
 * Validates and normalizes blog platform URLs
 * Handles special cases for Substack, Medium, etc.
 */
function normalizeBlogURL(url: string): string {
	try {
		const urlObj = new URL(url)

		// Handle Substack home feed URLs - these are NOT article URLs
		if (
			urlObj.hostname === 'substack.com' &&
			urlObj.pathname.includes('/home/post/')
		) {
			throw new Error(
				'This is a Substack feed URL, not an article URL. Please use the full article URL (e.g., https://username.substack.com/p/article-title)'
			)
		}

		// Add more blog platform normalizations as needed
		return url
	} catch (error) {
		if (error instanceof Error) throw error
		throw new Error('Invalid URL format')
	}
}

/**
 * Validates a URL string with strict rules:
 * - Must be a valid URL format
 * - Must use http or https protocol
 * - Cannot contain multiple URLs (separated by spaces, commas, or newlines)
 * - Trims whitespace before validation
 * - Normalizes blog platform URLs
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

		// Normalize and validate blog platform URLs
		try {
			const normalized = normalizeBlogURL(trimmed)
			return {
				valid: true,
				url: normalized,
			}
		} catch (error) {
			return {
				valid: false,
				error: 'Invalid blog URL',
				details:
					error instanceof Error
						? error.message
						: 'This URL format is not supported',
			}
		}
	} catch (error) {
		return {
			valid: false,
			error: 'Invalid URL format',
			details: 'Please enter a valid web address (e.g., https://example.com)',
		}
	}
}

/**
 * Formats author names, handling URLs and multiple authors
 *
 * - Extracts author names from URLs (e.g., "/profile/john-doe" → "John Doe")
 * - Handles multiple authors separated by commas, semicolons, or " and "
 * - Capitalizes names and removes dashes/underscores
 * - Returns null for invalid/empty author data
 *
 * @param author - Raw author string from article metadata
 * @returns Formatted author string or null
 *
 * @example
 * formatAuthorName('https://example.com/profile/john-doe') // "John Doe"
 * formatAuthorName('john-smith, jane-doe') // "John Smith, Jane Doe"
 * formatAuthorName('John Smith and Jane Doe') // "John Smith, Jane Doe"
 */
export function formatAuthorName(
	author: string | null | undefined
): string | null {
	if (!author || !author.trim()) return null

	const trimmed = author.trim()

	// Helper to format a single name (remove dashes/underscores, capitalize)
	const formatSingleName = (name: string): string => {
		return name
			.split(/[-_\s]+/) // Split on dashes, underscores, spaces
			.map((word) => {
				// Capitalize first letter, lowercase rest
				return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
			})
			.join(' ')
	}

	// Check if it's a URL
	try {
		const url = new URL(trimmed)
		// Extract last path segment as name
		const pathSegments = url.pathname.split('/').filter(Boolean)
		if (pathSegments.length > 0) {
			const lastSegment = pathSegments[pathSegments.length - 1]
			return formatSingleName(lastSegment)
		}
		return null
	} catch {
		// Not a URL, continue with normal processing
	}

	// Handle multiple authors separated by common delimiters
	// Split by comma, semicolon, " and ", " & "
	const authors = trimmed
		.split(/[,;]|\s+and\s+|\s+&\s+/i)
		.map((name) => name.trim())
		.filter(Boolean)

	// If multiple authors, format each and join with commas
	if (authors.length > 1) {
		return authors
			.map((name) => {
				// Check if individual author is a URL
				try {
					const url = new URL(name)
					const pathSegments = url.pathname.split('/').filter(Boolean)
					if (pathSegments.length > 0) {
						const lastSegment = pathSegments[pathSegments.length - 1]
						return formatSingleName(lastSegment)
					}
					return null
				} catch {
					// Not a URL, format as regular name if it contains dashes/underscores
					if (name.includes('-') || name.includes('_')) {
						return formatSingleName(name)
					}
					return name // Already properly formatted
				}
			})
			.filter(Boolean)
			.join(', ')
	}

	// Single author - format if it has dashes/underscores
	if (trimmed.includes('-') || trimmed.includes('_')) {
		return formatSingleName(trimmed)
	}

	// Already properly formatted
	return trimmed
}
