/**
 * POST /api/articles/parse
 * Parses an article from a URL and returns preview data (doesn't save to DB)
 * Use case: Show user article details before they confirm saving
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseArticleFromURL } from '@/lib/article-parser'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'

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

		// STEP 2: Extract and validate URL from request
		const { url } = await request.json()

		if (!url || typeof url !== 'string') {
			return NextResponse.json(
				{ error: 'URL is required and must be a string' },
				{ status: 400 }
			)
		}

		// STEP 3: Check if article already exists for this user (prevent duplicates)
		const { data: existingArticle } = await supabase
			.from('articles')
			.select('id, title, url, created_at')
			.eq('user_id', user.id)
			.eq('url', url)
			.single()

		if (existingArticle) {
			return NextResponse.json(
				{
					exists: true,
					article: existingArticle,
					message: 'Article already saved',
				},
				{ status: 200 }
			)
		}

		// STEP 4: Parse article content from URL (with archive fallback)
		const parsed = await parseArticleFromURL(url)

		// STEP 5: Return preview data (article not saved to database yet)
		return NextResponse.json({
			exists: false,
			preview: {
				title: parsed.title,
				author: parsed.author,
				publishedDate: parsed.publishedDate,
				excerpt: parsed.excerpt,
				wordCount: parsed.wordCount,
				url: parsed.url,
			},
		})
	} catch (error) {
		console.error('Article parsing error:', error)

		const errorMessage =
			error instanceof Error ? error.message : 'Failed to parse article'

		return NextResponse.json(
			{
				error: errorMessage,
				details:
					'Could not extract article content. The URL may be invalid, paywalled, or not contain readable article content.',
			},
			{ status: 500 }
		)
	}
}
