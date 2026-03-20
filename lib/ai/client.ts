/**
 * Anthropic Claude API client initialization
 * Provides a singleton instance for AI interactions
 *
 * Purpose:
 * - Initializes the Anthropic SDK client for making API calls to Claude
 * - Uses singleton pattern to reuse one client instance across all API calls
 * - Lazy initialization: only creates client when first needed (not at build time)
 *
 * Why lazy initialization?
 * - Next.js builds all routes at compile time (even API routes)
 * - ANTHROPIC_API_KEY might not exist during build (only needed at runtime)
 * - Delaying initialization until first use prevents build-time errors
 *
 * Usage:
 * ```typescript
 * import { anthropic, AI_CONFIG } from './client'
 * const response = await anthropic.messages.create({
 *   model: AI_CONFIG.model,
 *   messages: [...]
 * })
 * ```
 */

import Anthropic from '@anthropic-ai/sdk'

// Singleton instance (initially null, created on first use)
let anthropicInstance: Anthropic | null = null

/**
 * Gets or creates the Anthropic client instance (lazy initialization)
 * Throws error if ANTHROPIC_API_KEY is not configured
 */
export function getAnthropic(): Anthropic {
	if (!anthropicInstance) {
		if (!process.env.ANTHROPIC_API_KEY) {
			throw new Error(
				'ANTHROPIC_API_KEY environment variable is required. Please add it to your .env file.'
			)
		}

		anthropicInstance = new Anthropic({
			apiKey: process.env.ANTHROPIC_API_KEY,
		})
	}

	return anthropicInstance
}

/**
 * Export wrapper that lazily initializes the client
 * Uses a getter so client is only created when .messages is accessed
 * This allows importing 'anthropic' without immediate initialization
 */
export const anthropic = {
	get messages() {
		return getAnthropic().messages
	},
}

/**
 * Claude model configuration used across all AI operations
 *
 * - model: Claude Sonnet (balanced performance and cost)
 * - maxTokens: Limits response length (4096 = ~3000 words, keeps summaries concise)
 * - temperature: 0.3 = deterministic output (same article → similar summary each time)
 *   Higher temp = more creative, lower = more focused and consistent
 */
export const AI_CONFIG = {
	model: 'claude-sonnet-4-0', // Claude Sonnet
	maxTokens: 4096, // Maximum output tokens for summaries
	temperature: 0.3, // Lower temperature for more focused, consistent summaries
} as const
