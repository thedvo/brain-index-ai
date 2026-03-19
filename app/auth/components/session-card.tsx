'use client'

import { User } from '@supabase/supabase-js'
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
import { CheckCircle2, Clock, UserCircle, Mail, LogOut } from 'lucide-react'

type SessionCardProps = {
	user: User | null
	onSignOut: () => void
}

export function SessionCard({ user, onSignOut }: SessionCardProps) {
	return (
		<Card className="border-white/10 bg-white/5 backdrop-blur">
			<CardHeader>
				<div className="flex items-start justify-between">
					<div>
						<CardTitle className="text-white">Session</CardTitle>
						<CardDescription className="text-slate-400">
							{user
								? 'Your account is currently signed in.'
								: 'Sign in to view your session details.'}
						</CardDescription>
					</div>
					<Badge
						variant={user ? 'default' : 'secondary'}
						className={
							user
								? 'bg-emerald-500/20 text-emerald-200'
								: 'bg-white/10 text-slate-400'
						}
					>
						{user ? (
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
				{user ? (
					<>
						<div className="space-y-3 text-sm text-slate-200">
							<div className="flex items-center gap-3">
								<UserCircle className="h-4 w-4 text-slate-400" />
								<div className="flex flex-1 items-center justify-between gap-6">
									<span className="text-slate-400">User ID</span>
									<span className="font-mono text-xs">{user.id}</span>
								</div>
							</div>
							<Separator className="bg-white/10" />
							<div className="flex items-center gap-3">
								<Mail className="h-4 w-4 text-slate-400" />
								<div className="flex flex-1 items-center justify-between gap-6">
									<span className="text-slate-400">Email</span>
									<span>{user.email}</span>
								</div>
							</div>
							<Separator className="bg-white/10" />
							<div className="flex items-center gap-3">
								<Clock className="h-4 w-4 text-slate-400" />
								<div className="flex flex-1 items-center justify-between gap-6">
									<span className="text-slate-400">Last sign in</span>
									<span>
										{user.last_sign_in_at
											? new Date(user.last_sign_in_at).toLocaleString()
											: '—'}
									</span>
								</div>
							</div>
						</div>
						<Button
							variant="outline"
							className="mt-6 w-full border-white/10 bg-white/10 text-white hover:bg-white/20"
							onClick={onSignOut}
						>
							<LogOut className="mr-2 h-4 w-4" />
							Sign out
						</Button>
					</>
				) : (
					<div className="rounded-lg border border-dashed border-white/10 bg-slate-900/50 p-5 text-sm text-slate-400">
						Your session details will appear here once you're signed in.
					</div>
				)}
			</CardContent>
		</Card>
	)
}
