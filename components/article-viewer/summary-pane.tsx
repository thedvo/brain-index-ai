/**
 * SummaryPane Component
 *
 * USE CASE:
 * Displays AI-generated summary and key points with clickable citation markers
 * that link to source text in the article.
 *
 * IMPORTANT FEATURES:
 * - Renders summary text with inline citation markers [1][2][3]
 * - Citations are clickable → scrolls to and highlights source text in article
 * - Key points displayed as bullet list with citations
 * - Active citation highlighting (different color when selected)
 * - Collapsible sections for better organization
 *
 * INTEGRATION:
 * Used inside ArticleViewer component's right pane.
 * Works in tandem with ArticleContentPane for bidirectional navigation.
 *
 * PROPS:
 * - summary: AI-generated summary text with embedded citation markers
 * - keyPoints: Array of key point objects with text and citation IDs
 * - highlights: Array of highlight objects (for reference)
 * - activeCitationId: Currently selected citation (highlights in different color)
 * - onCitationClick: Callback when user clicks a citation marker
 */
'use client'

import { KeyPoint, Highlight } from '@/lib/supabase/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Sparkles, List } from 'lucide-react'

type SummaryPaneProps = {
	summary?: string
	keyPoints: KeyPoint[]
	highlights: Highlight[]
	activeCitationId: string | null
	onCitationClick: (citationId: string) => void
}

export function SummaryPane({
	summary,
	keyPoints,
	highlights,
	activeCitationId,
	onCitationClick,
}: SummaryPaneProps) {
	// Process summary text to make citations clickable
	const processSummaryText = (text: string) => {
		if (!text) return null

		// Split text by citation pattern [1], [2], etc.
		const citationPattern = /\[(\d+)\]/g
		const parts = []
		let lastIndex = 0
		let match

		while ((match = citationPattern.exec(text)) !== null) {
			// Add text before citation
			if (match.index > lastIndex) {
				parts.push(
					<span key={`text-${lastIndex}`}>
						{text.slice(lastIndex, match.index)}
					</span>
				)
			}

			// Add clickable citation (using h1, h2, etc. format)
			const citationNumber = match[1]
			const citationId = `h${citationNumber}`
			const isActive = activeCitationId === citationId

			parts.push(
				<button
					key={`citation-${match.index}`}
					onClick={() => onCitationClick(citationId)}
					className={`citation-marker ${isActive ? 'active' : ''}`}
					aria-label={`Go to citation ${citationNumber}`}
				>
					[{citationNumber}]
				</button>
			)

			lastIndex = match.index + match[0].length
		}

		// Add remaining text
		if (lastIndex < text.length) {
			parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>)
		}

		return parts.length > 0 ? parts : text
	}

	// Process key point text to make citations clickable
	const processKeyPointText = (point: string, citations: string[]) => {
		return (
			<div className="flex gap-2">
				<span className="flex-1">{point}</span>
				{citations && citations.length > 0 && (
					<div className="flex gap-1">
						{citations.map((citationId, idx) => {
							const isActive = activeCitationId === citationId
							// Extract citation number from citationId (e.g., "h1" -> "1")
							const citationNumber = citationId.replace('h', '')

							return (
								<button
									key={idx}
									onClick={() => onCitationClick(citationId)}
									className={`citation-marker ${isActive ? 'active' : ''}`}
									aria-label={`Go to citation ${citationNumber}`}
								>
									[{citationNumber}]
								</button>
							)
						})}
					</div>
				)}
			</div>
		)
	}

	return (
		<ScrollArea className="h-full">
			<div className="space-y-6">
				<style jsx global>{`
					.citation-marker {
						display: inline-flex;
						align-items: center;
						justify-content: center;
						min-width: 2rem;
						height: 1.5rem;
						padding: 0 0.375rem;
						background: var(--citation-bg);
						border: 1px solid var(--citation-border);
						border-radius: 0.25rem;
						color: var(--citation-text);
						font-size: 0.75rem;
						font-weight: 600;
						cursor: pointer;
						transition: all 0.2s;
						margin: 0 0.125rem;
					}

					.citation-marker:hover {
						background: var(--citation-hover-bg);
						border-color: var(--citation-hover-border);
						color: var(--citation-hover-text);
						transform: translateY(-1px);
					}

					.citation-marker.active {
						background: var(--citation-active-bg);
						border-color: var(--citation-active-border);
						color: var(--citation-active-text);
					}
				`}</style>

				{/* AI Summary Section */}
				<Card
					className="border p-6"
					style={{
						borderColor: 'var(--border-primary)',
						backgroundColor: 'var(--bg-secondary)',
					}}
				>
					<div className="mb-4 flex items-center gap-2">
						<Sparkles
							className="h-5 w-5"
							style={{ color: 'var(--accent-color)' }}
						/>
						<h2
							className="text-xl font-semibold"
							style={{ color: 'var(--text-primary)' }}
						>
							AI Summary
						</h2>
					</div>

					{summary ? (
						<div
							className="space-y-4 leading-relaxed"
							style={{ color: 'var(--text-primary)' }}
						>
							{processSummaryText(summary)}
						</div>
					) : (
						<p className="italic" style={{ color: 'var(--text-tertiary)' }}>
							No summary available. AI processing may still be in progress.
						</p>
					)}
				</Card>

				{/* Key Points Section */}
				{keyPoints && keyPoints.length > 0 && (
					<Card
						className="border p-6"
						style={{
							borderColor: 'var(--border-primary)',
							backgroundColor: 'var(--bg-secondary)',
						}}
					>
						<div className="mb-4 flex items-center gap-2">
							<List
								className="h-5 w-5"
								style={{ color: 'var(--accent-color)' }}
							/>
							<h2
								className="text-xl font-semibold"
								style={{ color: 'var(--text-primary)' }}
							>
								Key Points
							</h2>
						</div>

						<ul className="space-y-3">
							{keyPoints.map((keyPoint, idx) => (
								<li
									key={idx}
									className="flex gap-3 leading-relaxed"
									style={{ color: 'var(--text-primary)' }}
								>
									<span
										className="mt-1.5"
										style={{ color: 'var(--accent-color)' }}
									>
										•
									</span>
									<div className="flex-1">
										{processKeyPointText(keyPoint.point, keyPoint.citations)}
									</div>
								</li>
							))}
						</ul>
					</Card>
				)}

				{/* Highlights Info */}
				{highlights && highlights.length > 0 && (
					<div
						className="rounded-lg border p-4"
						style={{
							borderColor: 'var(--border-secondary)',
							backgroundColor: 'var(--bg-tertiary)',
						}}
					>
						<p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
							💡{' '}
							<strong>
								{new Set(keyPoints.flatMap((kp) => kp.citations || [])).size}
							</strong>{' '}
							citations link this summary to the original article. Click any
							citation marker to jump to the source text.
						</p>
					</div>
				)}
			</div>
		</ScrollArea>
	)
}
