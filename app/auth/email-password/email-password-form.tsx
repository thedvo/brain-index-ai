'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { AuthPageLayout } from '../../components/auth-page-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
	Mail,
	Lock,
	LogOut,
	CheckCircle2,
	Clock,
	UserCircle,
} from 'lucide-react'

type EmailPasswordFormProps = {
	user: User | null
}

// two possible option states of the form
type Mode = 'signup' | 'signin'

export default function EmailPasswordForm({ user }: EmailPasswordFormProps) {
	// allows user to toggle between different modes of the form
	const [mode, setMode] = useState<Mode>('signin')

	// form input fields
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')

	// provides user context on successful/failed form submission
	const [status, setStatus] = useState('')

	// create instance of the browser client
	const supabase = getSupabaseBrowserClient()

	// initialize with "user" that is passed in from our server component
	const [currentUser, setCurrentUser] = useState<User | null>(user)

	async function handleSignOut() {
		await supabase.auth.signOut()
		setCurrentUser(null)
		setStatus('Signed out successfully')
	}

	// listener that runs whenever the authentication state changes
	// the component will rerender automatically whenever the session changes
	useEffect(() => {
		// inside the callbackm we receive the event and the updated session
		const { data: listener } = supabase.auth.onAuthStateChange(
			(_event, session) => {
				// use the session to set current user which instantly updates the UI
				setCurrentUser(session?.user ?? null)
			}
		)
		// cleanup. when the component unmounts, unsubscribe from the listener to prevent memory leaks
		return () => {
			listener?.subscription.unsubscribe()
		}
	}, [supabase])

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		// prevents page reload on form submission
		event.preventDefault()

		// check form mode
		if (mode === 'signup') {
			const { error, data } = await supabase.auth.signUp({
				email,
				password,
				options: {
					// set URL we want the user redirected to once signed up/in
					// NOTE: ADD THIS LINK IN THE SUPABASE DASHBOARD (URL Configuration --> Redirect URLs)
					// TODO: create /welcome route page
					emailRedirectTo: `${window.location.origin}/welcome`,
				},
			})
			if (error) {
				setStatus(error.message)
			} else {
				setStatus('Check your inbox to confirm the new account.')
			}
			// if mode is 'signin'
		} else {
			const { error, data } = await supabase.auth.signInWithPassword({
				email,
				password,
			})
			if (error) {
				setStatus(error.message)
			} else {
				setStatus('Signed in successfully')
			}
		}
	}

	return (
		<AuthPageLayout
			title="Email + Password"
			intro="Classic credentials—users enter details, Supabase secures the rest while getSession + onAuthStateChange keep the UI live."
			steps={[
				'Toggle between sign up and sign in.',
				'Submit to watch the session card refresh instantly.',
				'Sign out to reset the listener.',
			]}
		>
			{/* if user is NOT logged in display signup/signin form */}
			{!currentUser && (
				<Card className="relative overflow-hidden border-emerald-500/30 bg-gradient-to-br from-[#05130d] via-[#04100c] to-[#0c2a21]">
					<CardHeader className="space-y-1">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="rounded-lg bg-emerald-500/10 p-2">
									<Mail className="h-5 w-5 text-emerald-300" />
								</div>
								<div>
									<Badge
										variant="outline"
										className="mb-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
									>
										Credentials
									</Badge>
									<CardTitle className="text-white">
										{mode === 'signup' ? 'Create an account' : 'Welcome back'}
									</CardTitle>
								</div>
							</div>
							<div className="flex rounded-lg border border-white/10 bg-white/5 p-1">
								{(['signup', 'signin'] as Mode[]).map((option) => (
									<Button
										key={option}
										type="button"
										variant={mode === option ? 'default' : 'ghost'}
										size="sm"
										onClick={() => {
											setMode(option)
											setStatus('')
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
										onChange={(event) => setEmail(event.target.value)}
										required
										placeholder="you@email.com"
										className="border-white/10 bg-[#0b1b18] pl-10 text-white placeholder:text-slate-500"
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="password" className="text-slate-200">
									Password
								</Label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
									<Input
										id="password"
										type="password"
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										required
										minLength={6}
										placeholder="At least 6 characters"
										className="border-white/10 bg-[#0b1b18] pl-10 text-white placeholder:text-slate-500"
									/>
								</div>
							</div>
							<Button
								type="submit"
								className="w-full bg-emerald-500 text-white hover:bg-emerald-400"
							>
								{mode === 'signup' ? 'Create account' : 'Sign in'}
							</Button>
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
			)}
			<Card className="border-white/10 bg-white/5 backdrop-blur">
				<CardHeader>
					<div className="flex items-start justify-between">
						<div>
							<CardTitle className="text-white">Session</CardTitle>
							<CardDescription className="text-slate-400">
								{currentUser
									? 'Hydrated by getSession + onAuthStateChange.'
									: 'Sign in to hydrate this panel instantly.'}
							</CardDescription>
						</div>
						<Badge
							variant={currentUser ? 'default' : 'secondary'}
							className={
								currentUser
									? 'bg-emerald-500/20 text-emerald-200'
									: 'bg-white/10 text-slate-400'
							}
						>
							{currentUser ? (
								<>
									<CheckCircle2 className="mr-1 h-3 w-3" />
									Active
								</>
							) : (
								<>
									<Clock className="mr-1 h-3 w-3" />
									Idle
								</>
							)}
						</Badge>
					</div>
				</CardHeader>
				<CardContent>
					{currentUser ? (
						<>
							<div className="space-y-3 text-sm text-slate-200">
								<div className="flex items-center gap-3">
									<UserCircle className="h-4 w-4 text-slate-400" />
									<div className="flex flex-1 items-center justify-between gap-6">
										<span className="text-slate-400">User ID</span>
										<span className="font-mono text-xs">{currentUser.id}</span>
									</div>
								</div>
								<Separator className="bg-white/10" />
								<div className="flex items-center gap-3">
									<Mail className="h-4 w-4 text-slate-400" />
									<div className="flex flex-1 items-center justify-between gap-6">
										<span className="text-slate-400">Email</span>
										<span>{currentUser.email}</span>
									</div>
								</div>
								<Separator className="bg-white/10" />
								<div className="flex items-center gap-3">
									<Clock className="h-4 w-4 text-slate-400" />
									<div className="flex flex-1 items-center justify-between gap-6">
										<span className="text-slate-400">Last sign in</span>
										<span>
											{currentUser.last_sign_in_at
												? new Date(currentUser.last_sign_in_at).toLocaleString()
												: '—'}
										</span>
									</div>
								</div>
							</div>
							<Button
								variant="outline"
								className="mt-6 w-full border-white/10 bg-white/10 text-white hover:bg-white/20"
								onClick={handleSignOut}
							>
								<LogOut className="mr-2 h-4 w-4" />
								Sign out
							</Button>
						</>
					) : (
						<div className="rounded-lg border border-dashed border-white/10 bg-slate-900/50 p-5 text-sm text-slate-400">
							Session metadata will show up here after a successful sign in.
						</div>
					)}
				</CardContent>
			</Card>
		</AuthPageLayout>
	)
}
