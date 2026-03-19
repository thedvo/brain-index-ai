'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmailAuthCard } from './components/email-auth-card'
import { GoogleAuthCard } from './components/google-auth-card'

type AuthFormProps = {
	user: User | null
	defaultMethod?: 'email' | 'google'
}

export default function AuthForm({
	user,
	defaultMethod = 'email',
}: AuthFormProps) {
	const [currentUser, setCurrentUser] = useState<User | null>(user)
	const supabase = getSupabaseBrowserClient()
	const router = useRouter()

	useEffect(() => {
		// Redirect if already authenticated
		if (currentUser) {
			router.push('/dashboard')
		}
	}, [currentUser, router])

	useEffect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setCurrentUser(session?.user ?? null)
		})
		return () => subscription.unsubscribe()
	}, [supabase])

	return (
		<div className="space-y-6">
			{!currentUser && (
				<Tabs defaultValue={defaultMethod} className="w-full">
					<TabsList className="grid w-full grid-cols-2 bg-white/5 backdrop-blur">
						<TabsTrigger
							value="email"
							className="text-slate-400 hover:text-slate-200 data-active:bg-white/10 data-active:text-white"
						>
							Email & Password
						</TabsTrigger>
						<TabsTrigger
							value="google"
							className="text-slate-400 hover:text-slate-200 data-active:bg-white/10 data-active:text-white"
						>
							Google
						</TabsTrigger>
					</TabsList>

					<TabsContent value="email" className="mt-6">
						<EmailAuthCard />
					</TabsContent>

					<TabsContent value="google" className="mt-6">
						<GoogleAuthCard />
					</TabsContent>
				</Tabs>
			)}
		</div>
	)
}
