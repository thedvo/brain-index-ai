/**
 * DELETE /api/articles/[id]
 *
 * Deletes an article and its associated data (tags, highlights, notes)
 * CASCADE delete handled by database foreign key constraints
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'

type Params = {
	params: Promise<{
		id: string
	}>
}

export async function DELETE(request: NextRequest, { params }: Params) {
	try {
		const resolvedParams = await params
		const articleId = resolvedParams.id

		if (!articleId) {
			return NextResponse.json(
				{ error: 'Article ID required' },
				{ status: 400 }
			)
		}

		const supabase = await createSupabaseServerClient()

		// Check authentication
		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Delete article (CASCADE will handle article_tags deletion)
		const { error: deleteError } = await supabase
			.from('articles')
			.delete()
			.eq('id', articleId)
			.eq('user_id', user.id) // Ensure user owns the article

		if (deleteError) {
			console.error('Error deleting article:', deleteError)
			return NextResponse.json(
				{ error: 'Failed to delete article' },
				{ status: 500 }
			)
		}

		return NextResponse.json({ success: true }, { status: 200 })
	} catch (error) {
		console.error('Unexpected error in DELETE /api/articles/[id]:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
