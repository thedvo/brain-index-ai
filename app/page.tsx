import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, Mail, Chrome } from 'lucide-react'

const demos = [
	{
		href: '/auth/email-password',
		title: 'Email + Password',
		icon: Mail,
		description:
			'Classic credentials flow with Supabase-managed sessions and a React listener that never goes stale.',
		highlights: [
			'Toggle sign in/sign up',
			'Show the session panel',
			'Explain password rules',
		],
		theme: {
			card: 'border-emerald-400/30 hover:border-emerald-300/60',
			gradient: 'from-[#0a2416] via-[#04130d] to-[#0f3022]',
			iconBg: 'bg-emerald-500/10',
			iconColor: 'text-emerald-300',
			badge: 'bg-emerald-500/20 text-emerald-200',
		},
	},
	{
		href: '/auth/google-login',
		title: 'Google Login',
		icon: Chrome,
		description:
			'Demonstrate social login via signInWithOAuth plus the automatic UI sync powered by onAuthStateChange.',
		highlights: [
			'Redirect URLs',
			'Call signInWithOAuth',
			'Watch session update',
		],
		theme: {
			card: 'border-blue-400/30 hover:border-blue-300/60',
			gradient: 'from-[#060f24] via-[#07122e] to-[#0f2346]',
			iconBg: 'bg-blue-500/10',
			iconColor: 'text-blue-300',
			badge: 'bg-blue-500/20 text-blue-200',
		},
	},
] as const

export default function Home() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-[#02050b] via-[#050c1d] to-[#071426] text-slate-100">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16">
				<header className="space-y-4">
					<Badge
						variant="outline"
						className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
					>
						Supabase × Next.js
					</Badge>
					<h1 className="text-4xl font-semibold text-white drop-shadow-sm">
						Two auth flows.
					</h1>
					<p className="text-base text-slate-400">
						Production-ready Supabase auth blueprints with real session
						listeners.
					</p>
				</header>
				<section className="grid gap-6 md:grid-cols-2">
					{demos.map((demo) => {
						const Icon = demo.icon
						const theme = demo.theme
						return (
							<Link key={demo.href} href={demo.href} className="group">
								<Card
									className={`relative overflow-hidden border bg-gradient-to-br p-6 transition-all hover:-translate-y-1 ${theme.card} ${theme.gradient}`}
								>
									<div className="flex items-start justify-between">
										<div className={`rounded-lg p-2.5 ${theme.iconBg}`}>
											<Icon className={`h-5 w-5 ${theme.iconColor}`} />
										</div>
										<ArrowUpRight
											className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${theme.iconColor}`}
										/>
									</div>
									<h3 className="mt-4 text-xl font-semibold text-white">
										{demo.title}
									</h3>
									<p className="mt-2 text-sm text-slate-300">
										{demo.description}
									</p>
									<ul className="mt-4 space-y-1.5 text-xs text-slate-400">
										{demo.highlights.map((highlight) => (
											<li key={highlight} className="flex items-start gap-2">
												<span
													className={`mt-1 h-1 w-1 shrink-0 rounded-full ${theme.badge}`}
												/>
												<span>{highlight}</span>
											</li>
										))}
									</ul>
								</Card>
							</Link>
						)
					})}
				</section>
			</div>
		</div>
	)
}
