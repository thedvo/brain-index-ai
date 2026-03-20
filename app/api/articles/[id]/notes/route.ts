/**
 * PATCH /api/articles/[id]/notes
 * Updates user notes for a specific article
 * Only the article owner can update notes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		// STEP 1: Verify user is authenticated
		const supabase = await createSupabaseServerClient()
		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// STEP 2: Extract article ID from URL path
		const { id: articleId } = await params

		// STEP 3: Parse and validate notes from request body
		const { notes } = await request.json()

		if (typeof notes !== 'string' && notes !== null) {
			return NextResponse.json(
				{ error: 'Notes must be a string or null' },
				{ status: 400 }
			)
		}

		// STEP 4: Update notes in database (RLS ensures user owns this article)
		const { data: updatedArticle, error } = await supabase
			.from('articles')
			.update({ user_notes: notes })
			.eq('id', articleId)
			.eq('user_id', user.id) // Explicit check (redundant with RLS but clearer)
			.select()
			.single()

		if (error) {
			// Check if article doesn't exist or user doesn't own it
			if (error.code === 'PGRST116') {
				return NextResponse.json(
					{ error: 'Article not found or access denied' },
					{ status: 404 }
				)
			}

			console.error('Database update error:', error)
			throw new Error(`Failed to update notes: ${error.message}`)
		}

		return NextResponse.json({
			article: updatedArticle,
			message: 'Notes updated successfully',
		})
	} catch (error) {
		console.error('Notes update error:', error)

		const errorMessage =
			error instanceof Error ? error.message : 'Failed to update notes'

		return NextResponse.json({ error: errorMessage }, { status: 500 })
	}
}
