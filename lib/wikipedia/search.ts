/**
 * Wikipedia Search Utilities
 *
 * Provides functions to search Wikipedia and retrieve article summaries.
 * Uses the Wikipedia REST API (no API key required).
 */

export interface WikipediaSearchResult {
	title: string
	url: string
	extract: string // Short summary/intro
	thumbnail?: {
		url: string
		width: number
		height: number
	}
}

/**
 * Search Wikipedia for articles matching a query
 * @param query - Search term (e.g., "Machine Learning", "Quantum Computing")
 * @param limit - Maximum number of results to return (default: 5)
 * @returns Array of matching Wikipedia articles with summaries
 */
export async function searchWikipedia(
	query: string,
	limit: number = 5
): Promise<WikipediaSearchResult[]> {
	try {
		// Use Wikipedia REST API search endpoint
		const searchUrl = new URL('https://en.wikipedia.org/w/api.php')
		searchUrl.searchParams.set('action', 'query')
		searchUrl.searchParams.set('format', 'json')
		searchUrl.searchParams.set('generator', 'search')
		searchUrl.searchParams.set('gsrsearch', query)
		searchUrl.searchParams.set('gsrlimit', limit.toString())
		searchUrl.searchParams.set('prop', 'pageimages|extracts')
		searchUrl.searchParams.set('piprop', 'thumbnail')
		searchUrl.searchParams.set('pithumbsize', '300')
		searchUrl.searchParams.set('exintro', '1')
		searchUrl.searchParams.set('explaintext', '1')
		searchUrl.searchParams.set('exsentences', '2')
		searchUrl.searchParams.set('origin', '*') // CORS

		const response = await fetch(searchUrl.toString(), {
			headers: {
				'User-Agent': 'BrainIndexAI/1.0 (Educational Project)',
			},
		})

		if (!response.ok) {
			console.error('Wikipedia search failed:', response.statusText)
			return []
		}

		const data = await response.json()

		if (!data.query?.pages) {
			return []
		}

		// Convert pages object to array and map to our result format
		const results: WikipediaSearchResult[] = Object.values(data.query.pages)
			.filter((page: any) => page.title && page.extract)
			.map((page: any) => ({
				title: page.title,
				url: `https://en.wikipedia.org/wiki/${encodeURIComponent(
					page.title.replace(/ /g, '_')
				)}`,
				extract: page.extract,
				thumbnail: page.thumbnail
					? {
							url: page.thumbnail.source,
							width: page.thumbnail.width,
							height: page.thumbnail.height,
						}
					: undefined,
			}))

		return results.slice(0, limit)
	} catch (error) {
		console.error('Wikipedia search error:', error)
		return []
	}
}

/**
 * Get the best Wikipedia match for a term/topic
 * Returns the top result or null if no good match found
 */
export async function getWikipediaArticle(
	term: string
): Promise<WikipediaSearchResult | null> {
	const results = await searchWikipedia(term, 1)
	return results.length > 0 ? results[0] : null
}

/**
 * Batch search Wikipedia for multiple terms
 * Useful for enriching a list of key terms/topics from an article
 */
export async function batchSearchWikipedia(
	terms: string[],
	limit: number = 1
): Promise<Map<string, WikipediaSearchResult>> {
	const resultMap = new Map<string, WikipediaSearchResult>()

	// Process in parallel but with some rate limiting
	const batchSize = 5
	for (let i = 0; i < terms.length; i += batchSize) {
		const batch = terms.slice(i, i + batchSize)
		const promises = batch.map(async (term) => {
			const results = await searchWikipedia(term, limit)
			if (results.length > 0) {
				resultMap.set(term, results[0])
			}
		})

		await Promise.all(promises)

		// Small delay between batches to be nice to Wikipedia's servers
		if (i + batchSize < terms.length) {
			await new Promise((resolve) => setTimeout(resolve, 200))
		}
	}

	return resultMap
}
