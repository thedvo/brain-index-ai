/**
 * POST /api/articles/save
 * Parses and saves an article to the database
 * Returns existing article if already saved (prevents duplicates)
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseArticleFromURL } from '@/lib/article-parser'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import type { ArticleInsert } from '@/lib/supabase/types'

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

		// STEP 3: Check if article already exists (UNIQUE constraint on user_id + url)
		const { data: existingArticle, error: checkError } = await supabase
			.from('articles')
			.select('*')
			.eq('user_id', user.id)
			.eq('url', url)
			.single()

		if (existingArticle) {
			return NextResponse.json(
				{
					article: existingArticle,
					message: 'Article already saved',
					alreadyExists: true,
				},
				{ status: 200 }
			)
		}

		// STEP 4: Parse article from URL (fetch, extract, sanitize)
		console.log(`Parsing article: ${url}`)
		const parsed = await parseArticleFromURL(url)

		// STEP 5: Prepare article data for database insertion
		const articleData: ArticleInsert = {
			user_id: user.id,
			url: parsed.url,
			title: parsed.title,
			author: parsed.author ?? undefined,
			author_url: parsed.author_url ?? undefined,
			published_date: parsed.publishedDate ?? undefined,
			content: parsed.content,
			word_count: parsed.wordCount,
			// AI fields start as undefined, will be populated by background job
			ai_summary: undefined,
			ai_key_points: [],
			ai_highlights: [],
			user_notes: undefined,
			processing_status: 'pending', // Will trigger AI processing
		}

		// STEP 6: Insert article into database
		const { data: savedArticle, error: insertError } = await supabase
			.from('articles')
			.insert(articleData)
			.select()
			.single()

		if (insertError) {
			console.error('Database insert error:', insertError)
			throw new Error(`Failed to save article: ${insertError.message}`)
		}

		console.log(`Article saved successfully: ${savedArticle.id}`)

		return NextResponse.json(
			{
				article: savedArticle,
				message: 'Article saved successfully',
				alreadyExists: false,
			},
			{ status: 201 }
		)
	} catch (error) {
		console.error('Article save error:', error)

		const errorMessage =
			error instanceof Error ? error.message : 'Failed to save article'

		return NextResponse.json(
			{
				error: errorMessage,
				details:
					'Could not parse or save article. The URL may be invalid, paywalled, or not contain readable content.',
			},
			{ status: 500 }
		)
	}
}
