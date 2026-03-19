/**
 * Browser Client manages the user session and login flow inside the browser
 */
'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

type SupabaseSchema = Record<string, never>

let client: SupabaseClient<SupabaseSchema> | null = null

export function getSupabaseBrowserClient(): SupabaseClient<SupabaseSchema> {
	if (client) {
		return client
	}

	// assign environment variables
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error(
			'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
		)
	}

	// create an instance of the browser client using the environment variables
	client = createBrowserClient<SupabaseSchema>(supabaseUrl, supabaseAnonKey)

	// this client can be used in the signup/signin form
	return client
}
