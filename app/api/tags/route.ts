/**
 * /api/tags
 * CRUD operations for user tags
 * GET - List all tags for authenticated user
 * POST - Create a new tag
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import type { TagInsert } from '@/lib/supabase/types'

/**
 * GET /api/tags
 * Lists all tags for the authenticated user
 */
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

		// STEP 2: Fetch all tags for user (RLS automatically filters by user_id)
		const { data: tags, error } = await supabase
			.from('tags')
			.select('*')
			.eq('user_id', user.id)
			.order('tag_name')

		if (error) {
			console.error('Database query error:', error)
			throw new Error(`Failed to fetch tags: ${error.message}`)
		}

		return NextResponse.json({ tags: tags || [] })
	} catch (error) {
		console.error('Tags list error:', error)
		const errorMessage =
			error instanceof Error ? error.message : 'Failed to fetch tags'
		return NextResponse.json({ error: errorMessage }, { status: 500 })
	}
}

/**
 * POST /api/tags
 * Creates a new tag for the authenticated user
 */
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

		// STEP 2: Extract and validate tag data from request
		const { tag_name, color } = await request.json()

		if (
			!tag_name ||
			typeof tag_name !== 'string' ||
			tag_name.trim().length === 0
		) {
			return NextResponse.json(
				{ error: 'Tag name is required and must be a non-empty string' },
				{ status: 400 }
			)
		}

		// STEP 3: Prepare tag data for insertion
		const tagData: TagInsert = {
			user_id: user.id,
			tag_name: tag_name.trim(),
			color: color || '#3b82f6', // Default blue
		}

		// STEP 4: Insert tag into database (UNIQUE constraint prevents duplicate names)
		const { data: newTag, error } = await supabase
			.from('tags')
			.insert(tagData)
			.select()
			.single()

		if (error) {
			// Check for unique constraint violation
			if (error.code === '23505') {
				return NextResponse.json(
					{ error: 'A tag with this name already exists' },
					{ status: 409 }
				)
			}

			console.error('Database insert error:', error)
			throw new Error(`Failed to create tag: ${error.message}`)
		}

		return NextResponse.json(
			{
				tag: newTag,
				message: 'Tag created successfully',
			},
			{ status: 201 }
		)
	} catch (error) {
		console.error('Tag creation error:', error)
		const errorMessage =
			error instanceof Error ? error.message : 'Failed to create tag'
		return NextResponse.json({ error: errorMessage }, { status: 500 })
	}
}
