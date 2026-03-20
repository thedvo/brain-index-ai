import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from './lib/supabase/server-client'
/**
 * Purpose: Next.js proxy (formerly middleware) for authentication and access control
 * Key Parts: Password gate check, Supabase auth validation, route protection
 * Used By: Next.js automatically runs this on all requests
 * Why: Enforces access control and manages authentication before pages load
 *
 * Runtime assumptions (Next.js 16):
 * - Proxy runs in the Node.js runtime by default (not Edge)
 * - Node runtime grants access to the shared cookie store used by Supabase
 *
 * What happens per request:
 * 1. Check for app_access cookie (password gate)
 * 2. Redirect to /gate if no access (except public routes)
 * 3. Instantiate Supabase server client (shares cookies via `NextResponse`)
 * 4. Call `supabase.auth.getUser()` which refreshes tokens if necessary
 * 5. Redirect anonymous users away from protected routes
 */

// define proxy function and pass in the incoming request
export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl

	// Public routes that don't require password or Supabase auth
	const publicRoutes = ['/gate', '/api/auth/check-password']
	const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

	// Allow public routes to pass through immediately
	if (isPublicRoute) {
		return NextResponse.next()
	}

	// Check for app access cookie (password gate)
	const hasAccess = request.cookies.get('app_access')

	// Redirect to gate if no access cookie
	if (!hasAccess) {
		return NextResponse.redirect(new URL('/gate', request.url))
	}

	// Continue with Supabase auth logic for protected routes
	const response = NextResponse.next({
		request: {
			headers: request.headers,
		},
	})
	// Initialize Supabase server client
	const supabase = await createSupabaseServerClient()
	const {
		data: { user },
	} = await supabase.auth.getUser() // automatically refreshes expired tokens
	console.log({ user })

	// If no authentication and trying to access /protected routes, redirect to /login
	if (!user && pathname.startsWith('/protected')) {
		return NextResponse.redirect(new URL('/login', request.url))
	}

	// Return normal response and let the request continue
	return response
}

// Configure which routes the proxy should run on
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		'/((?!_next/static|_next/image|favicon.ico).*)',
	],
}
