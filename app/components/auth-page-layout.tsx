'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, ShieldCheck, ListOrdered } from 'lucide-react'

type AuthPageLayoutProps = {
	title: string
	intro: string
	steps: string[]
	children: ReactNode
}

export function AuthPageLayout({
	title,
	intro,
	steps,
	children,
}: AuthPageLayoutProps) {
	return (
		<div className="flex min-h-screen flex-col bg-gradient-to-br from-[#02050b] via-[#050c1d] to-[#071426] text-slate-100">
			<header className="border-b border-white/10 bg-slate-950/40 backdrop-blur">
				<div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
					<div className="space-y-1">
						<Badge
							variant="outline"
							className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
						>
							<ShieldCheck className="mr-1 h-3 w-3" />
							Supabase Auth Demo
						</Badge>
						<h1 className="text-2xl font-semibold text-white">{title}</h1>
					</div>
					<Link
						href="/"
						className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
					>
						<ArrowLeft className="h-4 w-4" />
						Back home
					</Link>
				</div>
			</header>

			<main className="mx-auto w-full max-w-5xl px-6 py-12">
				<div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
					<Card className="border-white/10 bg-white/5 p-8 backdrop-blur">
						<div className="flex items-start gap-3">
							<div className="rounded-lg bg-emerald-500/10 p-2">
								<ListOrdered className="h-5 w-5 text-emerald-300" />
							</div>
							<div className="flex-1">
								<p className="text-lg font-medium text-white/90">{intro}</p>
								<Separator className="my-4 bg-white/10" />
								<ol className="space-y-2 text-sm text-slate-300">
									{steps.map((step, index) => (
										<li key={step} className="flex items-start gap-3">
											<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-300">
												{index + 1}
											</span>
											<span className="pt-0.5">{step}</span>
										</li>
									))}
								</ol>
							</div>
						</div>
					</Card>
					<div className="flex flex-col gap-6">{children}</div>
				</div>
			</main>
		</div>
	)
}
