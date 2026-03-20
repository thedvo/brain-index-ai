/**
 * API Route: POST /api/ai/process
 * Processes an article with AI to generate summary, key points, and highlights
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { summarizeArticle } from '@/lib/ai'
import { extractPlainText } from '@/lib/article-parser/extract'

export async function POST(request: NextRequest) {
	try {
		// STEP 1: Verify user is authenticated
		const supabase = await createSupabaseServerClient()
		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// STEP 2: Extract article ID from request
		const { articleId } = await request.json()

		if (!articleId || typeof articleId !== 'string') {
			return NextResponse.json(
				{ error: 'Article ID is required' },
				{ status: 400 }
			)
		}

		// STEP 3: Fetch article from database (verify ownership via RLS)
		const { data: article, error: fetchError } = await supabase
			.from('articles')
			.select('*')
			.eq('id', articleId)
			.eq('user_id', user.id)
			.single()

		if (fetchError || !article) {
			return NextResponse.json(
				{ error: 'Article not found or access denied' },
				{ status: 404 }
			)
		}

		// STEP 4: Check if article already has AI summary (prevent reprocessing)
		if (article.processing_status === 'completed' && article.ai_summary) {
			return NextResponse.json(
				{
					message: 'Article already processed',
					article,
				},
				{ status: 200 }
			)
		}

		// STEP 5: Update status to 'processing'
		await supabase
			.from('articles')
			.update({ processing_status: 'processing' })
			.eq('id', articleId)

		// STEP 6: Extract plain text from HTML content for AI analysis
		const plainText = extractPlainText(article.content)

		// STEP 7: Generate AI summary with citations
		console.log(`Processing article with AI: ${article.title}`)
		const aiResult = await summarizeArticle(
			article.title,
			article.author,
			plainText
		)

		// STEP 8: Update article with AI results
		const { data: updatedArticle, error: updateError } = await supabase
			.from('articles')
			.update({
				ai_summary: aiResult.summary,
				ai_key_points: aiResult.keyPoints,
				ai_highlights: aiResult.highlights,
				processing_status: 'completed',
			})
			.eq('id', articleId)
			.select()
			.single()

		if (updateError) {
			throw updateError
		}

		console.log(`AI processing completed for article: ${article.title}`)

		return NextResponse.json(
			{
				message: 'Article processed successfully',
				article: updatedArticle,
			},
			{ status: 200 }
		)
	} catch (error) {
		console.error('AI processing error:', error)

		// Try to update article status to 'failed' if we have articleId
		try {
			const supabase = await createSupabaseServerClient()
			const { articleId } = await request.json()
			if (articleId) {
				await supabase
					.from('articles')
					.update({ processing_status: 'failed' })
					.eq('id', articleId)
			}
		} catch {
			// Ignore errors in error handler
		}

		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: 'Failed to process article with AI',
			},
			{ status: 500 }
		)
	}
}
