/**
 * This file establishes the connection to the Supabase auth backend from our Next.js server.
 *
 * Server Client authenticates inbound requests to our backend.
 *
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getEnvironmentVariables() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error(
			'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
		)
	}

	return { supabaseUrl, supabaseAnonKey }
}

export async function createSupabaseServerClient() {
	// deconstruct environment variables extracted from the function defined above
	const { supabaseUrl, supabaseAnonKey } = getEnvironmentVariables()
	// instantiate cookies store so we can manipulate the cookies which store information about user authentication
	const cookiesStore = await cookies()

	// calling this function returns a fully configured Supabase client that communications with our Supabase authentication backend
	// pass 3 things (supabaseUrl, supabaseAnonKey, cookies configuration) for next.js
	return createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			// reads all cookies from the incoming request so Supabase can figure out who the current user is
			getAll() {
				return cookiesStore.getAll()
			},
			// updates retrieved cookies to refresh user tokens
			setAll(cookiesToSet) {
				try {
					cookiesToSet.forEach(({ name, value, options }) =>
						cookiesStore.set(name, value, options)
					)
				} catch (error) {
					console.log(error)
				}
			},
		},
	})
}
