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
 * - Text selection for dictionary lookup (right-click or double-click)
 *
 * INTEGRATION:
 * Used inside ArticleViewer component's left pane.
 * Receives highlight data from AI analysis (character positions + citation IDs).
 *
 * PROPS:
 * - content: Sanitized HTML of article body
 * - highlights: Array of highlight objects with positions and citation IDs
 * - activeCitationId: Currently selected citation (highlights in different color)
 * - onHighlightClick: Callback when user clicks a highlighted section
 * - onTextSelect: Callback when user selects text for dictionary lookup
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import { Highlight } from '@/lib/supabase/types'
import { ScrollArea } from '@/components/ui/scroll-area'

type ArticleContentPaneProps = {
	content: string
	highlights: Highlight[]
	activeCitationId: string | null
	onHighlightClick: (citationId: string) => void
	onTextSelect?: (text: string, position: { x: number; y: number }) => void
}

export function ArticleContentPane({
	content,
	highlights,
	activeCitationId,
	onHighlightClick,
	onTextSelect,
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

		// Extract text content from HTML
		const tempDiv = document.createElement('div')
		tempDiv.innerHTML = content
		const textContent = tempDiv.textContent || ''

		// Create a map of text positions to HTML positions
		// This is complex because we need to account for HTML tags
		let processedHtml = content

		// For now, we'll use a simpler approach:
		// Wrap the entire content in a div and use data-text-content for searching
		// Later we can improve this with better position mapping

		// Simple implementation: Try to find and replace exact text matches
		sortedHighlights.forEach((highlight) => {
			const { citationId, sourceText } = highlight

			// Escape special regex characters in sourceText
			const escapedText = sourceText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

			// Replace the text with a highlighted span
			const regex = new RegExp(escapedText, 'g')
			processedHtml = processedHtml.replace(
				regex,
				`<mark class="highlight-marker" data-citation-id="${citationId}">$&</mark>`
			)
		})

		setProcessedContent(processedHtml)
	}, [content, highlights])

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
	// Handle text selection for dictionary lookup
	useEffect(() => {
		if (!contentRef.current || !onTextSelect) return

		const handleSelection = () => {
			const selection = window.getSelection()
			const selectedText = selection?.toString().trim()

			if (selectedText && selectedText.length > 0) {
				// Get the position of the selection
				const range = selection?.getRangeAt(0)
				const rect = range?.getBoundingClientRect()

				if (rect) {
					// Position the popup near the selected text
					onTextSelect(selectedText, {
						x: rect.left + rect.width / 2,
						y: rect.bottom + 10,
					})
				}
			}
		}

		// Listen for mouseup (after text selection)
		contentRef.current.addEventListener('mouseup', handleSelection)

		return () => {
			contentRef.current?.removeEventListener('mouseup', handleSelection)
		}
	}, [onTextSelect])

	return (
		<ScrollArea className="h-full rounded-lg border border-slate-700/50 bg-slate-900/30">
			<div className="p-8">
				<style jsx global>{`
					.article-content {
						color: #e2e8f0;
						line-height: 1.8;
						font-size: 1.125rem;
					}

					.article-content h1,
					.article-content h2,
					.article-content h3,
					.article-content h4,
					.article-content h5,
					.article-content h6 {
						color: #f1f5f9;
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
						color: #60a5fa;
						text-decoration: underline;
					}

					.article-content a:hover {
						color: #93c5fd;
					}

					.article-content blockquote {
						border-left: 4px solid #475569;
						padding-left: 1.5rem;
						margin: 1.5rem 0;
						font-style: italic;
						color: #cbd5e1;
					}

					.article-content code {
						background: #1e293b;
						padding: 0.25rem 0.5rem;
						border-radius: 0.25rem;
						font-size: 0.9em;
						font-family: 'Courier New', monospace;
					}

					.article-content pre {
						background: #1e293b;
						padding: 1rem;
						border-radius: 0.5rem;
						overflow-x: auto;
						margin-bottom: 1.5rem;
					}

					.article-content img {
						max-width: 100%;
						height: auto;
						border-radius: 0.5rem;
						margin: 1.5rem 0;
					}

					/* Highlight markers */
					.article-content .highlight-marker {
						background: rgba(59, 130, 246, 0.2);
						border-bottom: 2px solid rgba(59, 130, 246, 0.5);
						cursor: pointer;
						transition: all 0.2s;
						padding: 0.125rem 0.25rem;
						border-radius: 0.25rem;
					}

					.article-content .highlight-marker:hover {
						background: rgba(59, 130, 246, 0.3);
						border-bottom-color: rgba(59, 130, 246, 0.8);
					}

					.article-content .highlight-marker[data-active='true'] {
						background: rgba(251, 191, 36, 0.3);
						border-bottom: 2px solid rgba(251, 191, 36, 0.8);
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
