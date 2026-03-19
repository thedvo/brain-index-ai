'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { User } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { AuthPageLayout } from '../../components/auth-page-layout'
import { Button } from '@/components/ui/button'
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
	Chrome,
	LogOut,
	CheckCircle2,
	Clock,
	UserCircle,
	Mail,
	ShieldCheck,
} from 'lucide-react'

type GoogleLoginFormProps = {
	user: User | null
}

export default function GoogleLoginForm({ user }: GoogleLoginFormProps) {
	// create instance of the browser client
	const supabase = getSupabaseBrowserClient()
	// initialize with "user" that is passed in from our server component
	const [currentUser, setCurrentUser] = useState<User | null>(user)

	async function handleSignOut() {
		await supabase.auth.signOut()
		setCurrentUser(null)
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

	// Google Authentication Logic w/ Supabase
	async function handleGoogleLogin() {
		// makes a call to supabase to sign in with OAuth
		await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${window.location.origin}/auth/google-login`,
				skipBrowserRedirect: false,
			},
		})
	}

	return (
		<AuthPageLayout
			title="Google Login"
			intro="Social login via signInWithOAuth with automatic UI sync powered by onAuthStateChange."
			steps={[
				'Click the Google login button',
				'Complete OAuth flow in popup',
				'Watch session update automatically',
			]}
		>
			{/* If user is not logged in, show Google login button */}
			{!currentUser && (
				<Card className="relative overflow-hidden border-blue-500/30 bg-gradient-to-br from-[#050a16] via-[#08142b] to-[#0f2446]">
					<CardHeader className="space-y-1">
						<div className="flex items-center gap-3">
							<div className="rounded-lg bg-blue-500/10 p-2.5">
								<Chrome className="h-6 w-6 text-blue-300" />
							</div>
							<div>
								<Badge
									variant="outline"
									className="mb-1 border-blue-500/30 bg-blue-500/10 text-blue-300"
								>
									OAuth
								</Badge>
								<CardTitle className="text-white">
									Continue with Google
								</CardTitle>
							</div>
							<Badge
								variant="outline"
								className="ml-auto border-amber-500/30 bg-amber-500/10 text-amber-300"
							>
								<ShieldCheck className="mr-1 h-3 w-3" />
								No password storage
							</Badge>
						</div>
						<CardDescription className="text-slate-300">
							Supabase hosts the OAuth flow and returns a ready-to-use session.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							type="button"
							onClick={handleGoogleLogin}
							className="w-full bg-[#1a73e8] text-white hover:bg-[#1662c4]"
							size="lg"
						>
							<Chrome className="mr-2 h-5 w-5" />
							Continue with Google
						</Button>
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
