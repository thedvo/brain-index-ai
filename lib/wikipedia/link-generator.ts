/**
 * Wikipedia Link Generator
 *
 * Converts terms/topics into properly formatted Wikipedia URLs
 * and enriches them with metadata.
 */

import { searchWikipedia, type WikipediaSearchResult } from './search'

export interface EnrichedTerm {
	term: string
	wikipediaUrl?: string
	summary?: string
	thumbnail?: string
}

/**
 * Generate Wikipedia URL from a term
 * Handles proper encoding and formatting
 */
export function generateWikipediaUrl(term: string): string {
	// Wikipedia URLs use underscores instead of spaces
	const formattedTerm = term
		.trim()
		.replace(/\s+/g, '_')
		// Capitalize first letter of each word for better matching
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join('_')

	return `https://en.wikipedia.org/wiki/${encodeURIComponent(formattedTerm)}`
}

/**
 * Enrich an array of terms with Wikipedia links and summaries
 * This is meant to be called after AI identifies important terms/topics
 */
export async function enrichTermsWithWikipedia(
	terms: string[]
): Promise<EnrichedTerm[]> {
	const enrichedTerms: EnrichedTerm[] = []

	// Process in small batches to avoid overwhelming Wikipedia API
	const batchSize = 5
	for (let i = 0; i < terms.length; i += batchSize) {
		const batch = terms.slice(i, i + batchSize)

		const batchPromises = batch.map(async (term) => {
			try {
				// Search for the term
				const results = await searchWikipedia(term, 1)

				if (results.length > 0) {
					const result = results[0]
					return {
						term,
						wikipediaUrl: result.url,
						summary: result.extract,
						thumbnail: result.thumbnail?.url,
					}
				} else {
					// No exact match found - return term with generated URL
					return {
						term,
						wikipediaUrl: generateWikipediaUrl(term),
					}
				}
			} catch (error) {
				console.error(`Failed to enrich term "${term}":`, error)
				// Return basic enriched term on error
				return {
					term,
					wikipediaUrl: generateWikipediaUrl(term),
				}
			}
		})

		const batchResults = await Promise.allSettled(batchPromises)

		// Extract successful results
		batchResults.forEach((result) => {
			if (result.status === 'fulfilled') {
				enrichedTerms.push(result.value)
			}
		})

		// Rate limit between batches
		if (i + batchSize < terms.length) {
			await new Promise((resolve) => setTimeout(resolve, 300))
		}
	}

	return enrichedTerms
}

/**
 * Validate that a Wikipedia URL exists and returns a valid page
 * Used to check if generated URLs actually work
 */
export async function validateWikipediaUrl(url: string): Promise<boolean> {
	try {
		const response = await fetch(url, {
			method: 'HEAD',
			headers: {
				'User-Agent': 'BrainIndexAI/1.0 (Educational Project)',
			},
		})

		return response.ok
	} catch (error) {
		console.error('Wikipedia URL validation failed:', error)
		return false
	}
}

/**
 * Extract Wikipedia URLs from text (if any are already present)
 * Useful for detecting if article already contains Wikipedia links
 */
export function extractWikipediaUrls(text: string): string[] {
	const wikipediaRegex =
		/https?:\/\/(?:en\.)?wikipedia\.org\/wiki\/[^\s\)\]]+/gi
	const matches = text.match(wikipediaRegex)
	return matches || []
}
