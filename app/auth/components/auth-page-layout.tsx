'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

type AuthPageLayoutProps = {
	title: string
	children: ReactNode
}

export function AuthPageLayout({ title, children }: AuthPageLayoutProps) {
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
							Brain Index AI
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

			<main className="mx-auto w-full max-w-2xl px-6 py-12">
				<div className="flex flex-col gap-6">{children}</div>
			</main>
		</div>
	)
}
