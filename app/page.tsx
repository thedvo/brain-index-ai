import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, Mail, Chrome, Shield, Sparkles } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'

const authMethods = [
	{
		href: '/auth?method=email',
		title: 'Email & Password',
		icon: Mail,
		description:
			'Full control over your credentials with standard authentication.',
		features: [
			'Create account with email',
			'Secure password protection',
			'Password recovery available',
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
		href: '/auth?method=google',
		title: 'Continue with Google',
		icon: Chrome,
		description: 'Quick, secure, and no password to remember.',
		features: [
			'One-click authentication',
			'Google security protection',
			'Faster setup process',
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

export default async function Home() {
	const supabase = await createSupabaseServerClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#02050b] via-[#050c1d] to-[#071426] text-slate-100">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16">
				<header className="space-y-4">
					<h1 className="text-5xl font-bold text-white drop-shadow-sm">
						Brain Index AI
					</h1>
					<p className="text-lg text-slate-300 max-w-3xl">
						Smart personal knowledge base with AI-powered article analysis.
						Users save articles → get AI summaries with detailed highlights →
						add personal notes → organize with tags.
					</p>
					<div className="flex gap-3 pt-2">
						<Badge
							variant="outline"
							className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
						>
							Semantic Search
						</Badge>
						<Badge
							variant="outline"
							className="border-blue-500/30 bg-blue-500/10 text-blue-300"
						>
							AI-Powered
						</Badge>
						<Badge
							variant="outline"
							className="border-purple-500/30 bg-purple-500/10 text-purple-300"
						>
							Personal Knowledge
						</Badge>
					</div>
				</header>
				<Separator className="bg-white/10" />
				<div>
					{user ? (
						<Card className="relative overflow-hidden border-purple-500/30 bg-gradient-to-br from-[#0f0520] via-[#0a0315] to-[#160a2e] p-8">
							<div className="flex items-start justify-between">
								<div className="space-y-4">
									<div className="flex items-center gap-3">
										<div className="rounded-lg bg-purple-500/10 p-2.5">
											<Sparkles className="h-6 w-6 text-purple-300" />
										</div>
										<h2 className="text-2xl font-semibold text-white">
											Welcome Back!
										</h2>
									</div>
									<p className="text-slate-300">
										You're already signed in as{' '}
										<span className="font-medium text-purple-300">
											{user.email}
										</span>
									</p>
									<Link href="/dashboard">
										<Button
											size="lg"
											className="bg-purple-500 text-white hover:bg-purple-600"
										>
											Go to Dashboard
											<ArrowUpRight className="ml-2 h-4 w-4" />
										</Button>
									</Link>
								</div>
							</div>
						</Card>
					) : (
						<>
							<div className="mb-6">
								<h2 className="text-2xl font-semibold text-white">
									Get Started
								</h2>
								<p className="mt-2 text-sm text-slate-400">
									Choose your preferred authentication method.
								</p>
							</div>
							<section className="grid gap-6 md:grid-cols-2">
								{authMethods.map((method) => {
									const Icon = method.icon
									const theme = method.theme
									return (
										<Link
											key={method.href}
											href={method.href}
											className="group"
										>
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
													{method.title}
												</h3>
												<p className="mt-2 text-sm text-slate-300">
													{method.description}
												</p>
												<ul className="mt-4 space-y-2 text-xs text-slate-400">
													{method.features.map((feature) => (
														<li
															key={feature}
															className="flex items-start gap-2"
														>
															<Shield
																className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${theme.iconColor}`}
															/>
															<span>{feature}</span>
														</li>
													))}
												</ul>
											</Card>
										</Link>
									)
								})}
							</section>
						</>
					)}
				</div>
			</div>
		</div>
	)
}
