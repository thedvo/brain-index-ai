/**
 * AI module index - Central export point for all AI functionality
 *
 * This is a "barrel file" that re-exports everything from the AI module.
 * Benefits:
 * - Clean imports: `import { summarizeArticle } from '@/lib/ai'`
 *   instead of: `import { summarizeArticle } from '@/lib/ai/summarize'`
 * - Single source of truth for what's public API vs internal implementation
 * - Makes refactoring easier (can move files without changing import paths)
 *
 * Module structure:
 * - client.ts: Anthropic API initialization and configuration
 * - prompts.ts: System prompts and templates for Claude
 * - position-mapper.ts: Maps AI quotes to article character positions
 * - summarize.ts: Main orchestration (calls Claude, processes response)
 *
 */

// Anthropic client and model configuration
export { anthropic, AI_CONFIG } from './client'

// Prompt templates for Claude AI
export { SYSTEM_PROMPT, createSummarizationPrompt } from './prompts'

// Main summarization function (primary entry point)
export { summarizeArticle } from './summarize'
export type { SummarizationResult } from './summarize'

// Position mapping utilities (used internally by summarize.ts, exported for testing)
export {
	findQuotePosition,
	mapHighlightsToPositions,
	findMatchingHighlight,
} from './position-mapper'
