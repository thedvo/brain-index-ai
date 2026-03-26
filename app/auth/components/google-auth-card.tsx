'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Chrome, ShieldCheck } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { getBaseURL } from '@/lib/utils/get-base-url'

type GoogleAuthCardProps = {
	onAuthSuccess?: () => void
}

export function GoogleAuthCard({ onAuthSuccess }: GoogleAuthCardProps) {
	const supabase = getSupabaseBrowserClient()

	const handleGoogleLogin = async () => {
		await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${getBaseURL()}/auth`,
			},
		})
		onAuthSuccess?.()
	}

	return (
		<Card className="relative overflow-hidden border-blue-500/30 bg-gradient-to-br from-[#050a16] via-[#08142b] to-[#0f2446]">
			<CardHeader className="space-y-3">
				<div className="flex items-center gap-3">
					<div className="rounded-lg bg-blue-500/10 p-2.5">
						<Chrome className="h-6 w-6 text-blue-300" />
					</div>
					<div>
						<CardTitle className="text-white">Continue with Google</CardTitle>
					</div>
					<Badge
						variant="outline"
						className="ml-auto border-amber-500/30 bg-amber-500/10 text-amber-300"
					>
						<ShieldCheck className="mr-1 h-3 w-3" />
						No password storage
					</Badge>
				</div>
				<p className="text-sm text-slate-300">
					Sign in with your existing Google account for quick and secure access.
				</p>
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
	)
}
