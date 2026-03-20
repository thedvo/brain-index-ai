/**
 * Purpose: API endpoint to verify access password and set authentication cookie
 * Key Parts: Password validation, cookie setting with httpOnly flag
 * Used By: app/gate/gate-form.tsx
 * Why: Centralizes password check logic and securely sets access cookie
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
	try {
		const { password } = await request.json()

		// Validate password against environment variable
		const correctPassword = process.env.APP_ACCESS_PASSWORD

		if (!correctPassword) {
			return NextResponse.json(
				{ error: 'Server configuration error' },
				{ status: 500 }
			)
		}

		if (password !== correctPassword) {
			return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
		}

		// Set secure cookie for 30 days
		// httpOnly prevents JavaScript access, secure requires HTTPS
		const cookieStore = await cookies()
		cookieStore.set('app_access', 'true', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30, // 30 days
			path: '/',
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
	}
}
