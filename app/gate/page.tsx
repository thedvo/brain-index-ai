/**
 * Purpose: Password gate page that controls access to the entire application
 * Key Parts: Form for password entry, cookie-based authentication
 * Used By: Middleware redirects unauthenticated users here
 * Why: Prevents unauthorized API usage and controls costs during beta
 */

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import GateForm from './gate-form'

export default async function GatePage() {
	// Check if user already has valid access
	// If cookie exists, redirect to home page
	const cookieStore = await cookies()
	const hasAccess = cookieStore.get('app_access')

	if (hasAccess) {
		redirect('/')
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<div className="w-full max-w-md">
				<div className="mb-8 text-center">
					<h1 className="text-3xl font-bold mb-2">Brain Index AI</h1>
					<p className="text-muted-foreground">
						Enter the access password to continue
					</p>
				</div>
				<GateForm />
			</div>
		</div>
	)
}
