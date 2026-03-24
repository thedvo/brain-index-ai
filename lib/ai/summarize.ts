/**
 * Article summarization using Claude AI
 * Generates summaries, key points, and highlights with source citations
 *
 * Process flow:
 * 1. Send article text to Claude with structured prompt
 * 2. Claude returns: summary text + key points with quote citations + highlight quotes
 * 3. Map each highlight quote to character positions in original article (for UI highlighting)
 * 4. Assign citation IDs (h1, h2, etc.) to each positioned highlight
 * 5. Link key points to their supporting highlights via citation IDs
 * 6. Return structured data ready for database storage and UI rendering
 */

import { anthropic, AI_CONFIG } from './client'
import { SYSTEM_PROMPT, createSummarizationPrompt } from './prompts'
import {
	mapHighlightsToPositions,
	findMatchingHighlight,
} from './position-mapper'
import type { KeyPoint, Highlight } from '../supabase/types'

/**
 * Final result returned by summarizeArticle()
 * Contains fully processed data ready to be stored in the database
 * - Highlights have character positions mapped to article text
 * - Key points have citation IDs that reference specific highlights
 * - CitationIds enable UI to show which quotes support each key point
 */
export interface SummarizationResult {
	summary: string
	keyPoints: KeyPoint[] // Each point has citations: string[] (citation IDs like "h1", "h2")
	highlights: Highlight[] // Each highlight has startChar/endChar positions + referencedBy
}

/**
 * Raw response structure from Claude AI (before processing)
 * Contains unprocessed data that needs to be mapped to article positions
 * - Citations are raw quote strings (not yet mapped to positions)
 * - Highlights are raw quote strings (need character position mapping)
 * - No cross-references between key points and highlights yet
 */
interface ClaudeResponse {
	summary: string
	keyPoints: Array<{
		point: string
		citations: string[] // Raw quote strings from article
	}>
	highlights: string[] // Raw quote strings that need position mapping
}

/**
 * Summarizes an article using Claude AI with citation extraction
 * @param title - Article title
 * @param author - Article author (optional)
 * @param plainText - Full article text content
 * @returns Structured summarization with mapped citations
 */
export async function summarizeArticle(
	title: string,
	author: string | null,
	plainText: string
): Promise<SummarizationResult> {
	// STEP 1: Validate input
	if (!plainText || plainText.trim().length < 100) {
		throw new Error('Article content is too short to summarize')
	}

	// Limit content length to avoid token limits (roughly 100k chars = 25k tokens)
	const contentToSummarize = plainText.slice(0, 100000)

	try {
		// STEP 2: Call Claude API with structured prompt
		console.log(`🤖 Calling Claude API (model: ${AI_CONFIG.model})`)
		const startTime = Date.now()

		const response = await anthropic.messages.create({
			model: AI_CONFIG.model,
			max_tokens: AI_CONFIG.maxTokens,
			temperature: AI_CONFIG.temperature,
			system: SYSTEM_PROMPT,
			messages: [
				{
					role: 'user',
					content: createSummarizationPrompt(title, author, contentToSummarize),
				},
			],
		})

		const duration = ((Date.now() - startTime) / 1000).toFixed(2)
		console.log(`✅ Claude API responded in ${duration}s`)

		// STEP 3: Extract text content from Claude's response
		const textContent = response.content.find((c) => c.type === 'text')
		if (!textContent || textContent.type !== 'text') {
			throw new Error('No text content in Claude response')
		}

		// STEP 4: Parse JSON response from Claude
		console.log(`📝 Parsing Claude response...`)
		const parsed = parseClaudeJSON(textContent.text)
		console.log(
			`✅ Parsed: ${parsed.keyPoints.length} key points, ${parsed.highlights.length} highlights`
		)

		// STEP 5: Map highlights to character positions in article
		console.log(`🔍 Mapping highlights to article positions...`)
		const highlights = mapHighlightsToPositions(plainText, parsed.highlights)

		// STEP 6: Build key points with citation references
		const keyPoints: KeyPoint[] = parsed.keyPoints.map((kp) => {
			// Find which highlights match this key point's citations
			const citationIds = kp.citations
				.map((citation) => findMatchingHighlight(citation, highlights))
				.filter((id): id is string => id !== undefined)

			// Update highlights to track which key points reference them
			citationIds.forEach((citationId) => {
				const highlight = highlights.find((h) => h.citationId === citationId)
				if (highlight && !highlight.referencedBy.includes(kp.point)) {
					highlight.referencedBy.push(kp.point)
				}
			})

			return {
				point: kp.point,
				citations: citationIds,
			}
		})

		return {
			summary: parsed.summary,
			keyPoints,
			highlights,
		}
	} catch (error) {
		console.error('❌ Failed to summarize article:', error)

		// Log detailed error info
		if (error instanceof Error) {
			console.error('Error name:', error.name)
			console.error('Error message:', error.message)
			console.error('Error stack:', error.stack)
		}

		throw new Error(
			`Article summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
		)
	}
}

/**
 * Parses JSON from Claude's response, handling markdown code blocks
 * @param text - Raw text from Claude
 * @returns Parsed JSON object
 */
function parseClaudeJSON(text: string): ClaudeResponse {
	try {
		// Remove markdown code blocks if present
		let jsonText = text.trim()
		if (jsonText.startsWith('```json')) {
			jsonText = jsonText.replace(/^```json\s*/, '').replace(/```\s*$/, '')
		} else if (jsonText.startsWith('```')) {
			jsonText = jsonText.replace(/^```\s*/, '').replace(/```\s*$/, '')
		}

		const parsed = JSON.parse(jsonText)

		// Validate required fields
		if (
			!parsed.summary ||
			!Array.isArray(parsed.keyPoints) ||
			!Array.isArray(parsed.highlights)
		) {
			throw new Error('Invalid response structure from Claude')
		}

		return parsed as ClaudeResponse
	} catch (error) {
		console.error('Failed to parse Claude JSON:', text)
		throw new Error('Could not parse AI response as JSON')
	}
}
