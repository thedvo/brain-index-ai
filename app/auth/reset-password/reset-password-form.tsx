'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lock, CheckCircle2 } from 'lucide-react'
import { PasswordInput } from '../components/password-input'

type ResetPasswordFormProps = {
	user: User | null
}

export default function ResetPasswordForm({ user }: ResetPasswordFormProps) {
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [status, setStatus] = useState('')
	const [isSuccess, setIsSuccess] = useState(false)
	const supabase = getSupabaseBrowserClient()
	const router = useRouter()

	async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()

		// Validate password confirmation
		if (newPassword !== confirmPassword) {
			setStatus('Passwords do not match')
			return
		}

		if (newPassword.length < 6) {
			setStatus('Password must be at least 6 characters')
			return
		}

		const { error } = await supabase.auth.updateUser({
			password: newPassword,
		})

		if (error) {
			setStatus(error.message)
		} else {
			setStatus('Password updated successfully!')
			setIsSuccess(true)
			setTimeout(() => {
				router.push('/auth')
			}, 2000)
		}
	}

	return (
		<Card className="relative overflow-hidden border-emerald-500/30 bg-gradient-to-br from-[#05130d] via-[#04100c] to-[#0c2a21]">
			<CardHeader className="space-y-1">
				<div className="flex items-center gap-2">
					<div className="rounded-lg bg-emerald-500/10 p-2">
						<Lock className="h-5 w-5 text-emerald-300" />
					</div>
					<div>
						<Badge
							variant="outline"
							className="mb-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
						>
							Password Reset
						</Badge>
						<CardTitle className="text-white">Set new password</CardTitle>
					</div>
				</div>
				<CardDescription className="text-slate-300">
					Enter your new password below. Make sure it's at least 6 characters.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{isSuccess ? (
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<CheckCircle2 className="mb-4 h-12 w-12 text-emerald-300" />
						<p className="text-lg font-medium text-white">Password updated!</p>
						<p className="mt-2 text-sm text-slate-400">
							Redirecting you to sign in...
						</p>
					</div>
				) : (
					<form onSubmit={handleResetPassword} className="space-y-4">
						<PasswordInput
							id="newPassword"
							label="New Password"
							value={newPassword}
							onChange={setNewPassword}
							placeholder="At least 6 characters"
						/>
						<PasswordInput
							id="confirmPassword"
							label="Confirm New Password"
							value={confirmPassword}
							onChange={setConfirmPassword}
							placeholder="Re-enter your new password"
						/>
						<Button
							type="submit"
							className="w-full bg-emerald-500 text-white hover:bg-emerald-400"
						>
							Update password
						</Button>
						{status && !isSuccess && (
							<p
								className="text-sm text-slate-300"
								role="status"
								aria-live="polite"
							>
								{status}
							</p>
						)}
					</form>
				)}
			</CardContent>
		</Card>
	)
}
