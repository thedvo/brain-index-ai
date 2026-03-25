/**
 * FeaturesShowcase Component
 *
 * Displays the main features of Brain Index AI in a clean, column layout.
 * Used on auth page to showcase benefits and on dashboard as a reminder.
 */
'use client'

import { Sparkles, Highlighter, List, Globe, Pencil, Zap } from 'lucide-react'

interface Feature {
	icon: React.ReactNode
	title: string
	description: string
}

const features: Feature[] = [
	{
		icon: <Sparkles className="h-6 w-6" />,
		title: 'AI-Powered Summaries',
		description:
			'Get instant, intelligent summaries that capture the essence of any article in seconds.',
	},
	{
		icon: <Highlighter className="h-6 w-6" />,
		title: 'Smart Highlights',
		description:
			'Automatically identify and highlight the most important passages with citation links.',
	},
	{
		icon: <List className="h-6 w-6" />,
		title: 'Key Points Extraction',
		description:
			'Extract and organize the main takeaways into easy-to-scan bullet points.',
	},
	{
		icon: <Globe className="h-6 w-6" />,
		title: 'Wikipedia Context',
		description:
			'Enrich your understanding with relevant Wikipedia links for important terms and concepts.',
	},
	{
		icon: <Pencil className="h-6 w-6" />,
		title: 'Personal Notes',
		description:
			'Add your own thoughts and insights directly to articles with auto-save functionality.',
	},
	{
		icon: <Zap className="h-6 w-6" />,
		title: 'Instant Processing',
		description:
			'Articles are parsed and analyzed in real-time, ready for you to explore immediately.',
	},
]

export function FeaturesShowcase() {
	return (
		<section className="w-full border-t border-slate-700/50 bg-slate-900/30 backdrop-blur-sm mt-12 sm:mt-16">
			<div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
				<div className="text-center mb-10 sm:mb-12">
					<h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
						Why Brain Index AI?
					</h2>
					<p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
						Transform how you read and retain information with AI-powered
						article analysis
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
					{features.map((feature, index) => (
						<div
							key={index}
							className="flex flex-col items-start gap-3 p-5 rounded-lg border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 hover:border-blue-500/30 transition-all duration-200"
						>
							<div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
								{feature.icon}
							</div>
							<div className="space-y-1.5">
								<h3 className="text-base sm:text-lg font-semibold text-white">
									{feature.title}
								</h3>
								<p className="text-sm text-slate-400 leading-relaxed">
									{feature.description}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}
