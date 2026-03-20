/**
 * Purpose: Client-side form component for password gate authentication
 * Key Parts: Password input, validation, cookie setting via API
 * Used By: app/gate/page.tsx
 * Why: Handles user interaction and password verification (requires 'use client')
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

export default function GateForm() {
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()

	// Submit password to API for verification
	// 1. Call /api/auth/check-password endpoint
	// 2. If valid, cookie is set and user is redirected
	// 3. If invalid, show error message
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		console.log('Form submitted with password:', password)
		setError('')
		setIsLoading(true)

		try {
			console.log('Sending request to /api/auth/check-password')
			const response = await fetch('/api/auth/check-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password }),
			})

			console.log('Response status:', response.status)
			const data = await response.json()
			console.log('Response data:', data)

			if (response.ok) {
				// Success - redirect to home
				console.log('Password accepted, redirecting...')
				router.push('/')
				router.refresh()
			} else {
				console.error('Password rejected:', data.error)
				setError(data.error || 'Invalid password')
			}
		} catch (err) {
			console.error('Request failed:', err)
			setError('Something went wrong. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Access Required</CardTitle>
				<CardDescription>
					This app is currently in beta and requires a password
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Input
							type="password"
							placeholder="Enter password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							disabled={isLoading}
							autoFocus
							autoComplete="new-password"
							name="gate-password"
							data-1p-ignore
							data-lpignore="true"
							aria-label="Access password"
						/>
						{error && (
							<p className="text-sm text-destructive" role="alert">
								{error}
							</p>
						)}
					</div>
					<Button
						type="submit"
						className="w-full"
						disabled={isLoading || !password}
					>
						{isLoading ? 'Checking...' : 'Enter'}
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}
