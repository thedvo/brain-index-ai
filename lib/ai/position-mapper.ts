/**
 * Maps AI-generated quotes to character positions in the original article text
 * This enables highlighting specific passages in the UI
 *
 * Process flow:
 * 1. findQuotePosition: Search article text for exact quote match
 *    - Normalizes whitespace for flexible matching (handles line breaks, extra spaces)
 *    - Falls back to fuzzy match (first 5 words) if exact match fails
 *    - Returns startChar/endChar positions or null if not found
 *
 * 2. mapHighlightsToPositions: Convert quote strings → positioned Highlight objects
 *    - Finds position for each quote using findQuotePosition
 *    - Assigns citation IDs (h1, h2, h3...) for reference tracking
 *    - Filters out quotes that couldn't be located (returns null → filtered)
 *
 * 3. findMatchingHighlight: Link key point citations to existing highlights
 *    - Matches citation quote against all highlight quotes
 *    - Returns citationId if match found (enables key point → highlight linking)
 *    - Used by summarize.ts to build referencedBy relationships
 */

import type { Highlight } from '../supabase/types'

/**
 * Finds the character position of a quote in the article text
 * @param articleText - Full article plain text
 * @param quote - Exact quote to find
 * @returns Object with start and end character positions, or null if not found
 */
export function findQuotePosition(
	articleText: string,
	quote: string
): { startChar: number; endChar: number } | null {
	// Clean up whitespace for more flexible matching
	const cleanedText = articleText.replace(/\s+/g, ' ').trim()
	const cleanedQuote = quote.replace(/\s+/g, ' ').trim()

	const index = cleanedText.indexOf(cleanedQuote)

	if (index === -1) {
		// Quote not found - try fuzzy matching by looking for first few words
		const firstWords = cleanedQuote.split(' ').slice(0, 5).join(' ')
		const fuzzyIndex = cleanedText.indexOf(firstWords)

		if (fuzzyIndex === -1) {
			return null // Still not found
		}

		// Found partial match - use approximate range
		return {
			startChar: fuzzyIndex,
			endChar: Math.min(fuzzyIndex + cleanedQuote.length, cleanedText.length),
		}
	}

	return {
		startChar: index,
		endChar: index + cleanedQuote.length,
	}
}

/**
 * Maps highlights with their positions in the article
 * Sorts highlights by their position in the article (top to bottom)
 * @param articleText - Full article plain text
 * @param highlights - Array of quote strings from AI
 * @returns Array of Highlight objects with positions, sorted by article order
 */
export function mapHighlightsToPositions(
	articleText: string,
	highlights: string[]
): Highlight[] {
	// First, find positions for all highlights
	const highlightsWithPositions = highlights
		.map((quote, index) => {
			const position = findQuotePosition(articleText, quote)

			if (!position) {
				console.warn(
					`Could not find position for highlight: ${quote.slice(0, 50)}...`
				)
				return null
			}

			return {
				quote,
				originalIndex: index,
				startChar: position.startChar,
				endChar: position.endChar,
			}
		})
		.filter((h): h is NonNullable<typeof h> => h !== null)

	// Sort by position in article (startChar) so citations appear in reading order
	highlightsWithPositions.sort((a, b) => a.startChar - b.startChar)

	// Now assign citation IDs based on sorted order (h1 = first in article, h2 = second, etc.)
	return highlightsWithPositions.map((item, index) => {
		const highlight: Highlight = {
			citationId: `h${index + 1}`,
			sourceText: item.quote,
			startChar: item.startChar,
			endChar: item.endChar,
			referencedBy: [], // Will be populated when key points reference this highlight
		}

		return highlight
	})
}

/**
 * Maps key point citations to existing highlights
 * Returns citation IDs for key points that match highlights
 * @param citation - Citation text from key point
 * @param highlights - Array of mapped highlights
 * @returns Citation ID if found, undefined otherwise
 */
export function findMatchingHighlight(
	citation: string,
	highlights: Highlight[]
): string | undefined {
	const cleanedCitation = citation.replace(/\s+/g, ' ').trim()

	for (const highlight of highlights) {
		const cleanedHighlight = highlight.sourceText.replace(/\s+/g, ' ').trim()

		// Check if citation matches or is contained in a highlight
		if (
			cleanedHighlight.includes(cleanedCitation) ||
			cleanedCitation.includes(cleanedHighlight)
		) {
			return highlight.citationId
		}
	}

	return undefined
}
