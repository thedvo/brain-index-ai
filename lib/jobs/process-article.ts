/**
 * Article Processing Orchestrator
 *
 * Centralized logic for processing articles through the complete pipeline:
 * 1. Parse article from URL
 * 2. Save to database
 * 3. Generate AI summary, highlights, and key points
 *
 * IMPORTANT SAFEGUARDS:
 * - Prevents re-processing of already completed articles
 * - Ensures AI summaries are permanent (never regenerated)
 * - Updates processing status at each stage
 * - Handles errors gracefully with status updates
 */

import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { summarizeArticle } from '@/lib/ai'
import { extractPlainText } from '@/lib/article-parser/extract'
import type {
	ProcessingStatus,
	Highlight,
	KeyPoint,
} from '@/lib/supabase/types'

export type ProcessingStage = 'parsing' | 'analyzing' | 'complete' | 'error'

export interface ProcessingProgress {
	articleId: string
	stage: ProcessingStage
	status: ProcessingStatus
	message: string
	error?: string
}

/**
 * Main orchestrator function for processing an article with AI
 * Returns progress updates throughout the pipeline
 */
export async function processArticle(
	articleId: string,
	userId: string
): Promise<ProcessingProgress> {
	const supabase = await createSupabaseServerClient()

	try {
		// STEP 1: Fetch article and verify ownership
		const { data: article, error: fetchError } = await supabase
			.from('articles')
			.select('*')
			.eq('id', articleId)
			.eq('user_id', userId)
			.single()

		if (fetchError || !article) {
			throw new Error('Article not found or access denied')
		}

		// SAFEGUARD: Check if article is already processed
		if (article.processing_status === 'completed') {
			console.log(`Article ${articleId} already processed, skipping`)
			return {
				articleId,
				stage: 'complete',
				status: 'completed',
				message: 'Article already processed',
			}
		}

		// SAFEGUARD: Check if article is currently being processed
		if (article.processing_status === 'processing') {
			console.log(`Article ${articleId} is already being processed`)
			return {
				articleId,
				stage: 'analyzing',
				status: 'processing',
				message: 'Article is currently processing',
			}
		}

		// STEP 2: Update status to 'processing'
		console.log(`Setting article ${articleId} status to 'processing'`)
		await updateArticleStatus(supabase, articleId, 'processing')

		// STEP 3: Extract plain text from HTML content for AI analysis
		console.log(`Extracting plain text from article content`)
		const plainText = extractPlainText(article.content)
		console.log(`Extracted ${plainText.length} characters for AI analysis`)

		// STEP 4: Generate AI summary with citations (ANALYZING STAGE)
		console.log(`Calling Claude AI for article: ${article.title}`)
		const aiResult = await summarizeArticle(
			article.title,
			article.author ?? null,
			plainText
		)
		console.log(`AI processing completed, updating database...`)

		// STEP 5: Update article with AI results (PERMANENT STORAGE)
		const { error: updateError } = await supabase
			.from('articles')
			.update({
				ai_summary: aiResult.summary,
				ai_key_points: aiResult.keyPoints as KeyPoint[],
				ai_highlights: aiResult.highlights as Highlight[],
				ai_important_terms: aiResult.importantTerms || [],
				processing_status: 'completed' as ProcessingStatus,
			})
			.eq('id', articleId)

		if (updateError) {
			console.error('Failed to save AI results to database:', updateError)
			throw updateError
		}

		console.log(`✅ AI processing completed successfully for: ${article.title}`)

		return {
			articleId,
			stage: 'complete',
			status: 'completed',
			message: 'Article processed successfully',
		}
	} catch (error) {
		console.error('❌ Article processing error:', error)

		// Update article status to 'failed'
		try {
			console.log(`Setting article ${articleId} status to 'failed'`)
			await updateArticleStatus(supabase, articleId, 'failed')
		} catch (statusError) {
			console.error('Failed to update status to failed:', statusError)
		}

		return {
			articleId,
			stage: 'error',
			status: 'failed',
			message: 'Processing failed',
			error: error instanceof Error ? error.message : 'Unknown error',
		}
	}
}

/**
 * Helper function to update article processing status
 */
async function updateArticleStatus(
	supabase: any,
	articleId: string,
	status: ProcessingStatus
): Promise<void> {
	const { error } = await supabase
		.from('articles')
		.update({ processing_status: status })
		.eq('id', articleId)

	if (error) {
		console.error('Failed to update article status:', error)
	}
}

/**
 * Check if an article needs processing
 * Returns true if article is pending or failed
 */
export async function needsProcessing(
	articleId: string,
	userId: string
): Promise<boolean> {
	const supabase = await createSupabaseServerClient()

	const { data: article, error } = await supabase
		.from('articles')
		.select('processing_status')
		.eq('id', articleId)
		.eq('user_id', userId)
		.single()

	if (error || !article) {
		return false
	}

	// Only process if status is 'pending' or 'failed'
	return (
		article.processing_status === 'pending' ||
		article.processing_status === 'failed'
	)
}
