/**
 * Universal URL fetcher with support for archive services
 * Handles: regular URLs, archive.is, archive.org, archive.ph
 */

/**
 * Attempts to fetch content from a URL with fallback to archive services
 * @param url - Original URL or archive URL
 * @returns HTML content and final resolved URL
 */
export async function fetchArticleHTML(
	url: string
): Promise<{ html: string; finalUrl: string }> {
	// Detect if URL is already an archive
	const archiveType = detectArchiveService(url)

	if (archiveType) {
		// Already an archive URL, fetch directly
		return await fetchFromURL(url)
	}

	// Try fetching original URL first
	try {
		return await fetchFromURL(url)
	} catch (error) {
		console.warn('Failed to fetch original URL, trying archives...', error)

		// Try archive services as fallback
		const archiveUrls = generateArchiveURLs(url)

		for (const archiveUrl of archiveUrls) {
			try {
				const result = await fetchFromURL(archiveUrl)
				console.log(`Successfully fetched from archive: ${archiveUrl}`)
				return result
			} catch (archiveError) {
				console.warn(`Archive fetch failed: ${archiveUrl}`, archiveError)
			}
		}

		throw new Error(
			`Failed to fetch article from ${url} and all archive services`
		)
	}
}

/**
 * Fetches HTML from a URL with proper headers and retry logic
 */
async function fetchFromURL(
	url: string,
	retryCount = 0
): Promise<{ html: string; finalUrl: string }> {
	const maxRetries = 3
	const baseDelay = 2000 // Start with 2 seconds

	// Add courtesy delay for archive.is to avoid rate limiting
	if (url.includes('archive.is') && retryCount === 0) {
		await new Promise((resolve) => setTimeout(resolve, 1000))
	}

	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				Accept:
					'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.9',
				'Cache-Control': 'no-cache',
			},
			redirect: 'follow',
		})

		// Handle rate limiting (429) with exponential backoff
		if (response.status === 429) {
			if (retryCount < maxRetries) {
				const delay = baseDelay * Math.pow(2, retryCount) // Exponential backoff: 2s, 4s, 8s
				console.log(
					`Rate limited (429) on ${url}. Retrying in ${delay / 1000}s... (attempt ${retryCount + 1}/${maxRetries})`
				)

				// Wait before retrying
				await new Promise((resolve) => setTimeout(resolve, delay))

				// Recursive retry
				return fetchFromURL(url, retryCount + 1)
			} else {
				throw new Error(
					`Rate limit exceeded after ${maxRetries} retries. Please wait a few minutes and try again.`
				)
			}
		}

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		const html = await response.text()
		return { html, finalUrl: response.url }
	} catch (error) {
		// If network error and we have retries left, try again
		if (
			retryCount < maxRetries &&
			(error instanceof TypeError || error.message.includes('fetch'))
		) {
			const delay = baseDelay * Math.pow(2, retryCount)
			console.log(
				`Network error on ${url}. Retrying in ${delay / 1000}s... (attempt ${retryCount + 1}/${maxRetries})`
			)
			await new Promise((resolve) => setTimeout(resolve, delay))
			return fetchFromURL(url, retryCount + 1)
		}

		throw error
	}
}

/**
 * Detects if a URL is from a known archive service
 */
function detectArchiveService(url: string): string | null {
	const archivePatterns = [
		{ pattern: /archive\.(is|today|ph|fo|li|md|vn)/, name: 'archive.is' },
		{ pattern: /web\.archive\.org/, name: 'archive.org' },
		{ pattern: /webcache\.googleusercontent\.com/, name: 'google-cache' },
	]

	for (const { pattern, name } of archivePatterns) {
		if (pattern.test(url)) {
			return name
		}
	}

	return null
}

/**
 * Generates archive URLs for a given original URL
 * Returns array of archive URLs to try in order of reliability
 */
function generateArchiveURLs(originalUrl: string): string[] {
	const encodedUrl = encodeURIComponent(originalUrl)

	return [
		// Archive.org (Wayback Machine) - most reliable, oldest service
		`https://web.archive.org/web/${originalUrl}`,

		// Archive.today family - fast and reliable
		`https://archive.is/${encodedUrl}`,
		`https://archive.ph/${encodedUrl}`,
		`https://archive.today/${encodedUrl}`,
	]
}

/**
 * Extracts original URL from an archive URL
 * Useful for displaying canonical URL to user
 */
export function extractOriginalURL(archiveUrl: string): string | null {
	// Archive.org pattern: https://web.archive.org/web/20201231235959/https://example.com
	const waybackMatch = archiveUrl.match(
		/web\.archive\.org\/web\/\d+\/(https?:\/\/.+)/
	)
	if (waybackMatch) return waybackMatch[1]

	// Archive.is pattern: https://archive.is/abcde or https://archive.is/2024.01.01-123456/https://example.com
	const archiveIsMatch = archiveUrl.match(
		/archive\.(is|today|ph|fo|li|md|vn)\/(?:\d{4}\.\d{2}\.\d{2}-\d+\/)?(https?:\/\/.+)/
	)
	if (archiveIsMatch) return archiveIsMatch[2]

	// If not an archive URL, return as-is
	return archiveUrl
}
