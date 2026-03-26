/**
 * GET /api/health
 * Health check endpoint to verify server dependencies and configuration
 * Useful for debugging production issues
 */

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
	try {
		// Test jsdom
		let jsdomStatus = 'not loaded'
		try {
			const { JSDOM } = await import('jsdom')
			const dom = new JSDOM('<html><body>test</body></html>')
			jsdomStatus =
				dom.window.document.body.textContent === 'test' ? 'ok' : 'failed'
		} catch (error) {
			jsdomStatus = error instanceof Error ? error.message : 'failed'
		}

		// Test readability
		let readabilityStatus = 'not loaded'
		try {
			const { Readability } = await import('@mozilla/readability')
			readabilityStatus = Readability ? 'ok' : 'failed'
		} catch (error) {
			readabilityStatus = error instanceof Error ? error.message : 'failed'
		}

		// Test sanitize-html
		let sanitizeStatus = 'not loaded'
		try {
			const sanitizeHtml = (await import('sanitize-html')).default
			const result = sanitizeHtml('<p>test</p>')
			sanitizeStatus = result === '<p>test</p>' ? 'ok' : 'failed'
		} catch (error) {
			sanitizeStatus = error instanceof Error ? error.message : 'failed'
		}

		// Check environment variables (without exposing values)
		const envCheck = {
			NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
			NEXT_PUBLIC_SUPABASE_ANON_KEY:
				!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
			ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
			NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
		}

		return NextResponse.json({
			status: 'ok',
			timestamp: new Date().toISOString(),
			runtime: 'nodejs',
			nodeVersion: process.version,
			dependencies: {
				jsdom: jsdomStatus,
				readability: readabilityStatus,
				'sanitize-html': sanitizeStatus,
			},
			environment: {
				NODE_ENV: process.env.NODE_ENV,
				variables: envCheck,
			},
		})
	} catch (error) {
		return NextResponse.json(
			{
				status: 'error',
				error: error instanceof Error ? error.message : 'Unknown error',
				stack:
					process.env.NODE_ENV === 'development' && error instanceof Error
						? error.stack
						: undefined,
			},
			{ status: 500 }
		)
	}
}
