/**
 * /api/tags/[id]
 * Individual tag operations
 * PATCH - Update tag name or color
 * DELETE - Delete tag
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'

/**
 * PATCH /api/tags/[id]
 * Updates a tag's name or color
 */
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

		// STEP 2: Extract tag ID from URL and update data from request
		const { id: tagId } = await params
		const { tag_name, color } = await request.json()

		// Validate at least one field is provided
		if (!tag_name && !color) {
			return NextResponse.json(
				{ error: 'Must provide tag_name or color to update' },
				{ status: 400 }
			)
		}

		// STEP 3: Build update object from provided fields
		const updateData: { tag_name?: string; color?: string } = {}
		if (tag_name) updateData.tag_name = tag_name.trim()
		if (color) updateData.color = color

		// STEP 4: Update tag in database (RLS ensures user owns this tag)
		const { data: updatedTag, error } = await supabase
			.from('tags')
			.update(updateData)
			.eq('id', tagId)
			.eq('user_id', user.id)
			.select()
			.single()

		if (error) {
			if (error.code === 'PGRST116') {
				return NextResponse.json(
					{ error: 'Tag not found or access denied' },
					{ status: 404 }
				)
			}

			// Check for unique constraint violation
			if (error.code === '23505') {
				return NextResponse.json(
					{ error: 'A tag with this name already exists' },
					{ status: 409 }
				)
			}

			console.error('Database update error:', error)
			throw new Error(`Failed to update tag: ${error.message}`)
		}

		return NextResponse.json({
			tag: updatedTag,
			message: 'Tag updated successfully',
		})
	} catch (error) {
		console.error('Tag update error:', error)
		const errorMessage =
			error instanceof Error ? error.message : 'Failed to update tag'
		return NextResponse.json({ error: errorMessage }, { status: 500 })
	}
}

/**
 * DELETE /api/tags/[id]
 * Deletes a tag (also removes all article_tags associations via CASCADE)
 */
export async function DELETE(
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

		// STEP 2: Extract tag ID from URL
		const { id: tagId } = await params

		// STEP 3: Delete tag (CASCADE automatically removes article_tags associations)
		const { error } = await supabase
			.from('tags')
			.delete()
			.eq('id', tagId)
			.eq('user_id', user.id)

		if (error) {
			console.error('Database delete error:', error)
			throw new Error(`Failed to delete tag: ${error.message}`)
		}

		return NextResponse.json({
			message: 'Tag deleted successfully',
		})
	} catch (error) {
		console.error('Tag deletion error:', error)
		const errorMessage =
			error instanceof Error ? error.message : 'Failed to delete tag'
		return NextResponse.json({ error: errorMessage }, { status: 500 })
	}
}
