/**
 * API Route: POST /api/ai/process
 * Processes an article with AI to generate summary, key points, and highlights
 * Uses the centralized orchestrator with safeguards against re-processing
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { processArticle, needsProcessing } from '@/lib/jobs/process-article'

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

		// STEP 3: Check if article needs processing (safeguard)
		const shouldProcess = await needsProcessing(articleId, user.id)

		if (!shouldProcess) {
			return NextResponse.json(
				{
					message: 'Article already processed or is currently processing',
					articleId,
				},
				{ status: 200 }
			)
		}

		// STEP 4: Process article using orchestrator
		const result = await processArticle(articleId, user.id)

		// STEP 5: Return result based on processing outcome
		if (result.status === 'completed') {
			return NextResponse.json(
				{
					message: result.message,
					articleId: result.articleId,
					stage: result.stage,
				},
				{ status: 200 }
			)
		} else if (result.status === 'failed') {
			return NextResponse.json(
				{
					error: result.message,
					details: result.error,
					articleId: result.articleId,
				},
				{ status: 500 }
			)
		} else {
			// Processing or pending
			return NextResponse.json(
				{
					message: result.message,
					articleId: result.articleId,
					stage: result.stage,
					status: result.status,
				},
				{ status: 202 } // Accepted (processing)
			)
		}
	} catch (error) {
		console.error('AI processing error:', error)

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
