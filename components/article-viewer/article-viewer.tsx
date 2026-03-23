/**
 * ArticleViewer Component
 *
 * USE CASE:
 * Main article viewing interface with split-pane layout showing:
 * - Left: Original article content with highlighted citations
 * - Right: AI-generated summary with clickable citation markers
 * - Bottom: User notes section with auto-save
 *
 * IMPORTANT FEATURES:
 * - Citation system: Click citation [1] in summary → highlights source text in article
 * - Bidirectional navigation: Click highlighted text → see which summary points reference it
 * - Auto-scroll to source when citation clicked
 * - Dictionary lookup on text selection (right-click)
 * - Responsive layout (stacks vertically on mobile)
 *
 * INTEGRATION:
 * Typically accessed from dashboard when user clicks "Open" on an article card.
 * Receives article ID as prop or URL parameter, fetches full article data.
 *
 * PROPS:
 * - articleId: ID of the article to display
 * - onClose: Callback when user closes the viewer
 */
'use client'

import { useState, useEffect, useRef } from 'react'
import { Article } from '@/lib/supabase/types'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { ArticleContentPane } from './article-content-pane'
import { SummaryPane } from './summary-pane'
import { DictionaryPopup } from './dictionary-popup'
import { UserNotesInput } from '../user-notes-input'
import { Skeleton } from '@/components/ui/skeleton'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDictionaryLookup } from '@/lib/dictionary/use-dictionary-lookup'

type ArticleViewerProps = {
	articleId: string
	onClose?: () => void
}

export function ArticleViewer({ articleId, onClose }: ArticleViewerProps) {
	const [article, setArticle] = useState<Article | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [activeCitationId, setActiveCitationId] = useState<string | null>(null)
	const [dictionaryPosition, setDictionaryPosition] = useState<{
		x: number
		y: number
	} | null>(null)
	const contentPaneRef = useRef<HTMLDivElement>(null)

	// Dictionary lookup hook
	const {
		definition,
		isLoading: isDictionaryLoading,
		error: dictionaryError,
		lookupWord,
		clearDefinition,
	} = useDictionaryLookup()

	// Fetch article data
	useEffect(() => {
		const fetchArticle = async () => {
			try {
				setIsLoading(true)
				setError(null)

				const supabase = getSupabaseBrowserClient()
				const { data, error: fetchError } = await supabase
					.from('articles')
					.select('*')
					.eq('id', articleId)
					.single()

				if (fetchError) throw fetchError
				if (!data) throw new Error('Article not found')

				setArticle(data as Article)
			} catch (err) {
				console.error('Error fetching article:', err)
				setError(err instanceof Error ? err.message : 'Failed to load article')
			} finally {
				setIsLoading(false)
			}
		}

		fetchArticle()
	}, [articleId])

	// Handle citation click (from summary)
	const handleCitationClick = (citationId: string) => {
		setActiveCitationId(citationId)

		// Scroll to the highlighted text in the article content
		if (contentPaneRef.current) {
			const element = contentPaneRef.current.querySelector(
				`[data-citation-id="${citationId}"]`
			)
			if (element) {
				element.scrollIntoView({ behavior: 'smooth', block: 'center' })
			}
		}
	}

	// Handle highlight click (from article content)
	const handleHighlightClick = (citationId: string) => {
		setActiveCitationId(citationId)
	}

	// Handle text selection for dictionary lookup
	const handleTextSelect = (
		text: string,
		position: { x: number; y: number }
	) => {
		// Extract first word if multiple words selected
		const firstWord = text.split(/\s+/)[0]
		setDictionaryPosition(position)
		lookupWord(firstWord)
	}

	// Handle notes update
	const handleNotesUpdate = async (notes: string) => {
		if (!article) return

		try {
			const supabase = getSupabaseBrowserClient()
			const {
				data: { user },
			} = await supabase.auth.getUser()

			if (!user) return

			const { error } = await supabase
				.from('articles')
				.update({ user_notes: notes })
				.eq('id', articleId)
				.eq('user_id', user.id)

			if (error) throw error

			// Update local state
			setArticle({ ...article, user_notes: notes })
		} catch (err) {
			console.error('Error updating notes:', err)
		}
	}

	// Loading state
	if (isLoading) {
		return (
			<div className="flex h-screen flex-col bg-gradient-to-br from-[#02050b] via-[#050c1d] to-[#071426]">
				<div className="flex items-center justify-between border-b border-slate-700/50 bg-slate-900/50 px-6 py-4">
					<Skeleton className="h-8 w-96" />
					{onClose && (
						<Button variant="ghost" size="icon" onClick={onClose}>
							<X className="h-5 w-5" />
						</Button>
					)}
				</div>
				<div className="flex flex-1 gap-4 p-6">
					<Skeleton className="h-full flex-1" />
					<Skeleton className="h-full w-96" />
				</div>
			</div>
		)
	}

	// Error state
	if (error || !article) {
		return (
			<div className="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-[#02050b] via-[#050c1d] to-[#071426] text-slate-100">
				<p className="text-lg text-red-400">{error || 'Article not found'}</p>
				{onClose && (
					<Button onClick={onClose} className="mt-4">
						Go Back
					</Button>
				)}
			</div>
		)
	}

	return (
		<div className="flex h-screen flex-col bg-gradient-to-br from-[#02050b] via-[#050c1d] to-[#071426] text-slate-100">
			{/* Header */}
			<header className="flex items-center justify-between border-b border-slate-700/50 bg-slate-900/50 px-6 py-4">
				<div className="flex-1">
					<h1 className="text-2xl font-bold text-white">{article.title}</h1>
					{article.author && (
						<p className="mt-1 text-sm text-slate-400">by {article.author}</p>
					)}
				</div>
				{onClose && (
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="ml-4 text-slate-400 hover:text-white"
					>
						<X className="h-5 w-5" />
					</Button>
				)}
			</header>

			{/* Main content area - split pane layout */}
			<div className="flex flex-1 gap-4 overflow-hidden p-6">
				{/* Left pane: Article content */}
				<div className="flex-1 overflow-hidden" ref={contentPaneRef}>
					<ArticleContentPane
						content={article.content}
						highlights={article.ai_highlights}
						activeCitationId={activeCitationId}
						onHighlightClick={handleHighlightClick}
						onTextSelect={handleTextSelect}
					/>
				</div>

				{/* Right pane: AI Summary */}
				<div className="w-96 overflow-hidden">
					<SummaryPane
						summary={article.ai_summary}
						keyPoints={article.ai_key_points}
						highlights={article.ai_highlights}
						activeCitationId={activeCitationId}
						onCitationClick={handleCitationClick}
					/>
				</div>
			</div>

			{/* Bottom: User notes */}
			<div className="border-t border-slate-700/50 bg-slate-900/30 px-6 py-4">
				<UserNotesInput
					initialNotes={article.user_notes || ''}
					onSave={handleNotesUpdate}
					placeholder="Add your personal notes about this article..."
				/>
			</div>

			{/* Dictionary popup */}
			{(definition || isDictionaryLoading || dictionaryError) &&
				dictionaryPosition && (
					<DictionaryPopup
						definition={definition}
						isLoading={isDictionaryLoading}
						error={dictionaryError}
						onClose={clearDefinition}
						position={dictionaryPosition || { x: 0, y: 0 }}
					/>
				)}
		</div>
	)
}
