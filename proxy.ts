import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from './lib/supabase/server-client'
/**
 * Next.js proxy (formerly middleware) entry point responsible for basic auth gating.
 *
 * Runtime assumptions due to conflicting docs (Next.js 16):
 * - Proxy runs in the Node.js runtime by default (not Edge)
 * - Node runtime grants access to the shared cookie store used by Supabase
 *
 * What happens per request:
 * - Instantiate the Supabase server client (shares cookies via `NextResponse`)
 * - Call `supabase.auth.getUser()` which refreshes tokens if necessary
 * - Redirect anonymous users away from `/protected` routes to `/login`
 *
 * Add extra path checks or redirects here when you need more complex routing rules.
 */

// define proxy function and pass in the incoming request
export async function proxy(request: NextRequest) {
	const response = NextResponse.next({
		request: {
			headers: request.headers,
		},
	})
	// intialize Supabase server client
	const supabase = await createSupabaseServerClient()
	const {
		data: { user },
	} = await supabase.auth.getUser() // call getUser which automatically refreshes expired tokens and gives us the authenticated user if there is one
	console.log({ user })

	// Finally, check if the user exists.
	// If no authentication and trying to access /protected routes, redirect to /login/
	if (!user && request.nextUrl.pathname.startsWith('/protected')) {
		return NextResponse.redirect(new URL('/login', request.url))
	}

	// return normal response if user is authenticated and let the request continue
	return response
}
