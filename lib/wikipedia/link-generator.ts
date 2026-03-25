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
 * Calculate relevance score between search term and Wikipedia result
 * Returns a score from 0 (not relevant) to 1 (highly relevant)
 */
function calculateRelevanceScore(
	searchTerm: string,
	resultTitle: string
): number {
	const normalizeText = (text: string) =>
		text
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9\s]/g, '')

	const normalizedTerm = normalizeText(searchTerm)
	const normalizedTitle = normalizeText(resultTitle)

	// Exact match (ignoring case/punctuation)
	if (normalizedTerm === normalizedTitle) {
		return 1.0
	}

	// Title contains the full term
	if (normalizedTitle.includes(normalizedTerm)) {
		return 0.9
	}

	// Term contains the full title (rare but possible)
	if (normalizedTerm.includes(normalizedTitle)) {
		return 0.85
	}

	// Check for significant word overlap
	const termWords = normalizedTerm.split(/\s+/).filter((w) => w.length > 2)
	const titleWords = normalizedTitle.split(/\s+/).filter((w) => w.length > 2)

	if (termWords.length === 0 || titleWords.length === 0) {
		return 0
	}

	const matchingWords = termWords.filter((word) =>
		titleWords.some(
			(titleWord) => titleWord.includes(word) || word.includes(titleWord)
		)
	)

	const overlapRatio =
		matchingWords.length / Math.max(termWords.length, titleWords.length)

	// Need at least 50% word overlap for moderate relevance
	return overlapRatio >= 0.5 ? 0.5 + overlapRatio * 0.3 : 0
}

/**
 * Enrich an array of terms with Wikipedia links and summaries
 * This is meant to be called after AI identifies important terms/topics
 */
export async function enrichTermsWithWikipedia(
	terms: string[]
): Promise<EnrichedTerm[]> {
	const enrichedTerms: EnrichedTerm[] = []

	// Minimum relevance score to accept a search result (0-1 scale)
	const RELEVANCE_THRESHOLD = 0.7

	// Process in small batches to avoid overwhelming Wikipedia API
	const batchSize = 5
	for (let i = 0; i < terms.length; i += batchSize) {
		const batch = terms.slice(i, i + batchSize)

		const batchPromises = batch.map(async (term) => {
			try {
				// Search for the term, get top 3 results to increase match chances
				const results = await searchWikipedia(term, 3)

				if (results.length > 0) {
					// Find the most relevant result
					let bestMatch: WikipediaSearchResult | null = null
					let bestScore = 0

					for (const result of results) {
						const score = calculateRelevanceScore(term, result.title)
						if (score > bestScore) {
							bestScore = score
							bestMatch = result
						}
					}

					// Only use the search result if it meets the relevance threshold
					if (bestMatch && bestScore >= RELEVANCE_THRESHOLD) {
						return {
							term,
							wikipediaUrl: bestMatch.url,
							summary: bestMatch.extract,
							thumbnail: bestMatch.thumbnail?.url,
						}
					} else {
						// Search results weren't relevant enough - use direct URL
						console.log(
							`⚠️ Wikipedia search for "${term}" returned low relevance (${bestScore.toFixed(2)}), using direct URL`
						)
						return {
							term,
							wikipediaUrl: generateWikipediaUrl(term),
						}
					}
				} else {
					// No search results found - return term with generated URL
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
