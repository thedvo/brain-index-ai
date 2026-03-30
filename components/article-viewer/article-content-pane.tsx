/**
 * ArticleContentPane Component
 *
 * USE CASE:
 * Displays the sanitized HTML content of an article with interactive
 * highlight markers that link to AI summary citations.
 *
 * IMPORTANT FEATURES:
 * - Injects highlight markers into article HTML at specified character positions
 * - Highlights are clickable → shows which summary points reference them
 * - Active citation highlighting (when user clicks citation in summary)
 * - Smooth scroll to highlighted text when citation clicked
 * - Shows key point references as superscript numbers (like footnotes)
 *
 * INTEGRATION:
 * Used inside ArticleViewer component's left pane.
 * Receives highlight data from AI analysis (character positions + citation IDs).
 *
 * PROPS:
 * - content: Sanitized HTML of article body
 * - highlights: Array of highlight objects with positions and citation IDs
 * - keyPoints: Array of key points to show which references each highlight
 * - activeCitationId: Currently selected citation (highlights in different color)
 * - onHighlightClick: Callback when user clicks a highlighted section
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import { Highlight, KeyPoint } from '@/lib/supabase/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { Type, Plus, Minus } from 'lucide-react'

type ArticleContentPaneProps = {
	content: string
	highlights: Highlight[]
	keyPoints: KeyPoint[]
	activeCitationId: string | null
	onHighlightClick: (citationId: string) => void
	fontSize: number
	fontFamily: string
	onFontSizeChange: (size: number) => void
	onFontFamilyChange: (family: string) => void
}

export function ArticleContentPane({
	content,
	highlights,
	keyPoints,
	activeCitationId,
	onHighlightClick,
	fontSize,
	fontFamily,
	onFontSizeChange,
	onFontFamilyChange,
}: ArticleContentPaneProps) {
	const contentRef = useRef<HTMLDivElement>(null)
	const [processedContent, setProcessedContent] = useState<string>('')

	// Process HTML content and inject highlight markers
	useEffect(() => {
		if (!highlights || highlights.length === 0) {
			setProcessedContent(content)
			return
		}

		// Sort highlights by start position (reverse order for injection)
		const sortedHighlights = [...highlights].sort(
			(a, b) => b.startChar - a.startChar
		)

		let processedHtml = content

		// Simple implementation: Try to find and replace exact text matches
		sortedHighlights.forEach((highlight, index) => {
			const { citationId, sourceText } = highlight

			// Find which key points reference this highlight
			const keyPointIndices: number[] = []
			keyPoints.forEach((kp, kpIndex) => {
				if (kp.citations.includes(citationId)) {
					keyPointIndices.push(kpIndex + 1) // 1-indexed for display
				}
			})

			// Create superscript with key point numbers
			const keyPointRefs =
				keyPointIndices.length > 0
					? `<sup class="key-point-ref">${keyPointIndices.join(',')}</sup>`
					: ''

			// Escape special regex characters in sourceText
			const escapedText = sourceText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

			// Replace the text with a highlighted span
			const regex = new RegExp(escapedText, 'g')
			processedHtml = processedHtml.replace(
				regex,
				`<mark class="highlight-marker" data-citation-id="${citationId}">$&${keyPointRefs}</mark>`
			)
		})

		setProcessedContent(processedHtml)
	}, [content, highlights, keyPoints])

	// Add click handlers to highlight markers
	useEffect(() => {
		if (!contentRef.current) return

		const handleClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement
			const marker = target.closest('.highlight-marker')

			if (marker && marker instanceof HTMLElement) {
				const citationId = marker.getAttribute('data-citation-id')
				if (citationId) {
					onHighlightClick(citationId)
				}
			}
		}

		contentRef.current.addEventListener('click', handleClick)

		return () => {
			contentRef.current?.removeEventListener('click', handleClick)
		}
	}, [onHighlightClick])

	// Update active citation markers
	useEffect(() => {
		if (!contentRef.current) return

		// Remove active state from all markers
		const markers = contentRef.current.querySelectorAll('.highlight-marker')
		markers.forEach((marker) => {
			marker.removeAttribute('data-active')
		})

		// Add active state to the selected citation
		if (activeCitationId) {
			const activeMarker = contentRef.current.querySelector(
				`[data-citation-id="${activeCitationId}"]`
			)
			if (activeMarker) {
				activeMarker.setAttribute('data-active', 'true')
			}
		}
	}, [activeCitationId])

	const increaseFontSize = () => {
		onFontSizeChange(Math.min(fontSize + 2, 28))
	}

	const decreaseFontSize = () => {
		onFontSizeChange(Math.max(fontSize - 2, 12))
	}

	return (
		<ScrollArea
			className="h-full rounded-lg border relative"
			style={{
				borderColor: 'var(--border-primary)',
				backgroundColor: 'var(--bg-secondary)',
			}}
		>
			{/* Font controls - positioned in top-right corner */}
			<div className="absolute top-4 right-4 z-10">
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							title="Font settings"
							className="gap-1.5"
							style={{
								backgroundColor: 'var(--bg-secondary)',
								borderColor: 'var(--border-primary)',
							}}
						>
							<Type className="h-4 w-4" />
							<span className="text-xs">Font</span>
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-64" align="end">
						<div className="space-y-4">
							<div>
								<h3 className="font-semibold text-sm mb-2">Font Size</h3>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="icon"
										onClick={decreaseFontSize}
										disabled={fontSize <= 12}
									>
										<Minus className="h-4 w-4" />
									</Button>
									<span className="text-sm font-medium w-16 text-center">
										{fontSize}px
									</span>
									<Button
										variant="outline"
										size="icon"
										onClick={increaseFontSize}
										disabled={fontSize >= 28}
									>
										<Plus className="h-4 w-4" />
									</Button>
								</div>
							</div>
							<div>
								<h3 className="font-semibold text-sm mb-2">Font Family</h3>
								<select
									value={fontFamily}
									onChange={(e) => onFontFamilyChange(e.target.value)}
									className="w-full px-3 py-2 border rounded-md text-sm"
								>
									<option value="Georgia">Georgia (Serif)</option>
									<option value="Merriweather">Merriweather (Serif)</option>
									<option value="Crimson Text">Crimson Text (Serif)</option>
									<option value="Inter">Inter (Sans-serif)</option>
									<option value="Open Sans">Open Sans (Sans-serif)</option>
									<option value="Roboto">Roboto (Sans-serif)</option>
									<option value="Courier New">Courier (Monospace)</option>
								</select>
							</div>
						</div>
					</PopoverContent>
				</Popover>
			</div>

			<div className="p-8 pt-16">
				<style jsx global>{`
					.article-content {
						color: var(--text-primary);
						line-height: 1.8;
						font-size: ${fontSize}px;
						font-family:
							${fontFamily},
							-apple-system,
							BlinkMacSystemFont,
							'Segoe UI',
							Roboto,
							sans-serif;
					}

					.article-content h1,
					.article-content h2,
					.article-content h3,
					.article-content h4,
					.article-content h5,
					.article-content h6 {
						color: var(--text-primary);
						font-weight: 700;
						margin-top: 2rem;
						margin-bottom: 1rem;
						line-height: 1.3;
					}

					.article-content h1 {
						font-size: 2rem;
					}
					.article-content h2 {
						font-size: 1.75rem;
					}
					.article-content h3 {
						font-size: 1.5rem;
					}

					.article-content p {
						margin-bottom: 1.5rem;
					}

					.article-content ul,
					.article-content ol {
						margin-bottom: 1.5rem;
						padding-left: 2rem;
					}

					.article-content li {
						margin-bottom: 0.5rem;
					}

					.article-content a {
						color: var(--link-color);
						text-decoration: underline;
						text-decoration-thickness: 2px;
						text-underline-offset: 2px;
					}

					.article-content a:hover {
						color: var(--link-hover-color);
					}

					.article-content blockquote {
						border-left: 4px solid var(--border-secondary);
						padding-left: 1.5rem;
						margin: 1.5rem 0;
						font-style: italic;
						color: var(--text-secondary);
					}

					.article-content code {
						background: var(--code-bg);
						padding: 0.25rem 0.5rem;
						border-radius: 0.25rem;
						font-size: 0.9em;
						font-family: 'Courier New', monospace;
					}

					.article-content pre {
						background: var(--code-bg);
						padding: 1rem;
						border-radius: 0.5rem;
						overflow-x: auto;
						margin-bottom: 1.5rem;
					}

					/* Images - comprehensive handling for all types */
					.article-content img {
						max-width: 100%;
						height: auto;
						border-radius: 0.5rem;
						margin: 1.5rem auto;
						display: block;
						box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
					}

					/* GIF animations - ensure they play */
					.article-content img[src*='.gif'],
					.article-content img[src*='giphy.com'],
					.article-content img[src*='tenor.com'] {
						max-width: 100%;
						height: auto;
						display: block;
						margin: 1.5rem auto;
					}

					/* Picture element for responsive images */
					.article-content picture {
						display: block;
						margin: 1.5rem auto;
						max-width: 100%;
					}

					.article-content picture img {
						margin: 0 auto;
					}

					/* Images within links */
					.article-content a img {
						transition: opacity 0.2s ease;
					}

					.article-content a img:hover {
						opacity: 0.85;
					}

					/* Inline images (small icons, emoji) */
					.article-content p img,
					.article-content li img {
						display: inline-block;
						margin: 0 0.25rem;
						vertical-align: middle;
						max-height: 1.5em;
						width: auto;
						border-radius: 0.25rem;
					}

					/* Block-level images override inline */
					.article-content p > img:only-child,
					.article-content div > img {
						display: block;
						margin: 1.5rem auto;
						max-height: none;
						max-width: 100%;
					}

					/* Figure elements */
					.article-content figure {
						margin: 2rem 0;
						text-align: center;
						max-width: 100%;
						overflow: hidden;
					}

					.article-content figure img {
						margin: 0 auto 0.5rem;
					}

					.article-content figcaption {
						font-size: 0.875rem;
						font-style: italic;
						color: var(--text-secondary);
						margin-top: 0.5rem;
						padding: 0 1rem;
						line-height: 1.5;
					}

					/* Video elements */
					.article-content video {
						max-width: 100%;
						height: auto;
						border-radius: 0.5rem;
						margin: 1.5rem auto;
						display: block;
						box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
					}

					/* GIF videos (some sites convert GIFs to video) */
					.article-content video[autoplay][loop][muted] {
						max-width: 100%;
						height: auto;
					}

					/* Iframe embeds (YouTube, etc.) */
					.article-content iframe {
						max-width: 100%;
						margin: 1.5rem auto;
						display: block;
						border-radius: 0.5rem;
						border: none;
						box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
					}

					/* Responsive iframe containers */
					.article-content iframe[src*='youtube'],
					.article-content iframe[src*='vimeo'] {
						aspect-ratio: 16 / 9;
						width: 100%;
						height: auto;
						min-height: 300px;
					}

					/* Prevent images from breaking layout on mobile */
					@media (max-width: 768px) {
						.article-content img,
						.article-content picture,
						.article-content figure {
							max-width: 100%;
							overflow: hidden;
						}

						.article-content img {
							border-radius: 0.375rem;
						}
					}

					/* Loading state for lazy-loaded images */
					.article-content img[loading='lazy'] {
						background: var(--bg-tertiary, #f3f4f6);
						min-height: 200px;
					}

					/* Tables */
					.article-content table {
						width: 100%;
						border-collapse: collapse;
						margin: 1.5rem 0;
					}

					.article-content th,
					.article-content td {
						padding: 0.75rem;
						border: 1px solid var(--border-primary);
						text-align: left;
					}

					.article-content th {
						background: var(--bg-tertiary);
						font-weight: 600;
					}

					/* Improve paragraph spacing and readability */
					.article-content p:empty {
						display: none;
					}

					.article-content p + p {
						margin-top: 0;
					}

					/* Horizontal rules */
					.article-content hr {
						border: none;
						border-top: 2px solid var(--border-secondary);
						margin: 2rem 0;
					}

					/* Highlight markers */
					.article-content .highlight-marker {
						background: var(--highlight-bg);
						border-bottom: 2px solid var(--highlight-border);
						cursor: pointer;
						transition: all 0.2s;
						padding: 0.125rem 0.25rem;
						border-radius: 0.25rem;
					}

					.article-content .highlight-marker:hover {
						background: var(--highlight-hover-bg);
						border-bottom-color: var(--highlight-hover-border);
					}

					.article-content .highlight-marker[data-active='true'] {
						background: var(--citation-active-bg);
						border-bottom: 2px solid var(--citation-active-border);
					}

					/* Key point reference numbers */
					.article-content .key-point-ref {
						font-size: 0.75em;
						font-weight: 600;
						color: var(--link-color);
						margin-left: 0.125rem;
						vertical-align: super;
						line-height: 0;
					}
				`}</style>

				<div
					ref={contentRef}
					className="article-content"
					dangerouslySetInnerHTML={{ __html: processedContent }}
				/>
			</div>
		</ScrollArea>
	)
}
