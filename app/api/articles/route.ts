/**
 * GET /api/articles
 * Lists all articles for the authenticated user
 * Supports filtering by processing status, sorting, and pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
	try {
		// STEP 1: Verify user is authenticated
		const supabase = await createSupabaseServerClient()
		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// STEP 2: Parse query parameters (filtering, sorting, pagination)
		const { searchParams } = new URL(request.url)
		const status = searchParams.get('status') // Filter by processing_status
		const sortBy = searchParams.get('sortBy') || 'created_at' // created_at, updated_at, title
		const order = searchParams.get('order') || 'desc' // asc or desc
		const limit = parseInt(searchParams.get('limit') || '50')
		const offset = parseInt(searchParams.get('offset') || '0')

		// STEP 3: Build database query with user's articles
		// Include tags via JOIN
		let query = supabase
			.from('articles')
			.select(`
				*,
				article_tags (
					tag_id,
					tags (
						id,
						tag_name,
						color
					)
				)
			`, { count: 'exact' })
			.eq('user_id', user.id)

		// STEP 4: Apply filters (status, if provided)
		if (
			status &&
			['pending', 'processing', 'completed', 'failed'].includes(status)
		) {
			query = query.eq('processing_status', status)
		}

		// STEP 5: Apply sorting
		const validSortColumns = ['created_at', 'updated_at', 'title', 'word_count']
		const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at'
		query = query.order(sortColumn, { ascending: order === 'asc' })

		// STEP 6: Apply pagination
		query = query.range(offset, offset + limit - 1)

		// STEP 7: Execute query and return results with pagination metadata
		const { data: articles, error, count } = await query

		if (error) {
			console.error('Database query error:', error)
			throw new Error(`Failed to fetch articles: ${error.message}`)
		}

		return NextResponse.json({
			articles: articles || [],
			pagination: {
				total: count || 0,
				limit,
				offset,
				hasMore: (count || 0) > offset + limit,
			},
		})
	} catch (error) {
		console.error('Articles list error:', error)

		const errorMessage =
			error instanceof Error ? error.message : 'Failed to fetch articles'

		return NextResponse.json({ error: errorMessage }, { status: 500 })
	}
}
