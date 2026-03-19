'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail } from 'lucide-react'
import { PasswordInput } from './password-input'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'

type Mode = 'signup' | 'signin' | 'forgot-password'

type EmailAuthCardProps = {
	onAuthSuccess?: () => void
}

const CARD_TITLE = {
	signup: 'Create an account',
	'forgot-password': 'Reset password',
	signin: 'Welcome back',
} as const

const SUBMIT_BUTTON_TEXT = {
	signup: 'Create account',
	'forgot-password': 'Send reset link',
	signin: 'Sign in',
} as const

export function EmailAuthCard({ onAuthSuccess }: EmailAuthCardProps) {
	const [mode, setMode] = useState<Mode>('signin')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [status, setStatus] = useState('')
	const supabase = getSupabaseBrowserClient()
	const router = useRouter()

	const resetForm = () => {
		setStatus('')
		setPassword('')
		setConfirmPassword('')
	}

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		if (mode === 'signup' && password !== confirmPassword) {
			setStatus('Passwords do not match')
			return
		}

		const actions = {
			signup: () =>
				supabase.auth.signUp({
					email,
					password,
					options: {
						emailRedirectTo: `${window.location.origin}/welcome`,
					},
				}),
			'forgot-password': () =>
				supabase.auth.resetPasswordForEmail(email, {
					redirectTo: `${window.location.origin}/auth/reset-password`,
				}),
			signin: () => supabase.auth.signInWithPassword({ email, password }),
		}

		const { error } = await actions[mode]()

		if (error) {
			setStatus(error.message)
		} else {
			const messages = {
				signup: 'Check your inbox to confirm the new account.',
				'forgot-password': 'Check your inbox for the password reset link.',
				signin: 'Signed in successfully',
			}
			setStatus(messages[mode])
			onAuthSuccess?.()

			// Redirect to dashboard after successful sign-in
			if (mode === 'signin') {
				router.push('/dashboard')
			}
		}
	}

	return (
		<Card className="relative overflow-hidden border-emerald-500/30 bg-gradient-to-br from-[#05130d] via-[#04100c] to-[#0c2a21]">
			<CardHeader className="space-y-1">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="rounded-lg bg-emerald-500/10 p-2">
							<Mail className="h-5 w-5 text-emerald-300" />
						</div>
						<div>
							<CardTitle className="text-white">{CARD_TITLE[mode]}</CardTitle>
						</div>
					</div>
					{mode !== 'forgot-password' && (
						<div className="flex rounded-lg border border-white/10 bg-white/5 p-1">
							{(['signup', 'signin'] as const).map((option) => (
								<Button
									key={option}
									type="button"
									variant={mode === option ? 'default' : 'ghost'}
									size="sm"
									onClick={() => {
										setMode(option)
										resetForm()
									}}
									className={
										mode === option
											? 'bg-emerald-500/30 text-white hover:bg-emerald-500/40'
											: 'text-slate-400 hover:text-white'
									}
								>
									{option === 'signup' ? 'Sign up' : 'Sign in'}
								</Button>
							))}
						</div>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email" className="text-slate-200">
							Email
						</Label>
						<div className="relative">
							<Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								placeholder="you@email.com"
								className="border-white/10 bg-[#0b1b18] pl-10 text-white placeholder:text-slate-500"
							/>
						</div>
					</div>

					{mode !== 'forgot-password' && (
						<>
							<PasswordInput
								id="password"
								label="Password"
								value={password}
								onChange={setPassword}
							/>
							{mode === 'signup' && (
								<PasswordInput
									id="confirmPassword"
									label="Confirm Password"
									value={confirmPassword}
									onChange={setConfirmPassword}
									placeholder="Re-enter your password"
								/>
							)}
						</>
					)}

					<Button
						type="submit"
						className="w-full bg-emerald-500 text-white hover:bg-emerald-400"
					>
						{SUBMIT_BUTTON_TEXT[mode]}
					</Button>

					{mode === 'signin' && (
						<button
							type="button"
							onClick={() => {
								setMode('forgot-password')
								resetForm()
							}}
							className="w-full text-center text-sm text-slate-400 hover:text-slate-200"
						>
							Forgot password?
						</button>
					)}

					{mode === 'forgot-password' && (
						<button
							type="button"
							onClick={() => setMode('signin')}
							className="w-full text-center text-sm text-slate-400 hover:text-slate-200"
						>
							Back to sign in
						</button>
					)}

					{status && (
						<p
							className="text-sm text-slate-300"
							role="status"
							aria-live="polite"
						>
							{status}
						</p>
					)}
				</form>
			</CardContent>
		</Card>
	)
}
