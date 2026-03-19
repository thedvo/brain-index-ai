'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { useRouter } from 'next/navigation'
import { SessionCard } from '../auth/components/session-card'

type DashboardContentProps = {
	user: User
}

export default function DashboardContent({ user }: DashboardContentProps) {
	const [currentUser, setCurrentUser] = useState<User | null>(user)
	const supabase = getSupabaseBrowserClient()
	const router = useRouter()

	const handleSignOut = async () => {
		await supabase.auth.signOut()
		setCurrentUser(null)
		router.push('/auth')
	}

	useEffect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			if (!session?.user) {
				router.push('/auth')
			} else {
				setCurrentUser(session.user)
			}
		})
		return () => subscription.unsubscribe()
	}, [supabase, router])

	if (!currentUser) {
		return null
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#02050b] via-[#050c1d] to-[#071426] text-slate-100">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16">
				<header className="space-y-4">
					<h1 className="text-5xl font-bold text-white drop-shadow-sm">
						Dashboard
					</h1>
					<p className="text-lg text-slate-300 max-w-3xl">
						Welcome to Brain Index AI.
					</p>
				</header>

				<SessionCard user={currentUser} onSignOut={handleSignOut} />
			</div>
		</div>
	)
}
