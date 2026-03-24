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
import { UserNotesInput } from '../user-notes-input'
import { Skeleton } from '@/components/ui/skeleton'
import { X, Moon, Sun, BookOpen, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeProvider, useTheme } from '@/lib/theme/theme-context'

type ArticleViewerProps = {
	articleId: string
	onClose?: () => void
}

function ArticleViewerContent({ articleId, onClose }: ArticleViewerProps) {
	const { theme, setTheme } = useTheme()
	const [article, setArticle] = useState<Article | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [activeCitationId, setActiveCitationId] = useState<string | null>(null)
	const contentPaneRef = useRef<HTMLDivElement>(null)

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

	// Theme cycling function
	const cycleTheme = () => {
		const themes: Array<'light' | 'dark' | 'sepia'> = ['light', 'dark', 'sepia']
		const currentIndex = themes.indexOf(theme)
		const nextIndex = (currentIndex + 1) % themes.length
		setTheme(themes[nextIndex])
	}

	// Loading state
	if (isLoading) {
		return (
			<div
				className="flex h-screen flex-col"
				style={{ backgroundColor: 'var(--bg-primary)' }}
			>
				<div
					className="flex items-center justify-between border-b px-8 py-6"
					style={{
						borderColor: 'var(--border-primary)',
						backgroundColor: 'var(--bg-secondary)',
					}}
				>
					<Skeleton className="h-10 w-96" />
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
			<div
				className="flex h-screen flex-col items-center justify-center"
				style={{
					backgroundColor: 'var(--bg-primary)',
					color: 'var(--text-primary)',
				}}
			>
				<p className="text-lg" style={{ color: 'var(--text-primary)' }}>
					{error || 'Article not found'}
				</p>
				{onClose && (
					<Button onClick={onClose} className="mt-4">
						Go Back
					</Button>
				)}
			</div>
		)
	}

	return (
		<div
			className="flex h-screen flex-col"
			style={{
				backgroundColor: 'var(--bg-primary)',
				color: 'var(--text-primary)',
			}}
		>
			{/* Header */}
			<header
				className="flex items-center justify-between border-b px-8 py-6"
				style={{
					borderColor: 'var(--border-primary)',
					backgroundColor: 'var(--bg-secondary)',
				}}
			>
				<div className="flex-1 max-w-4xl">
					<h1
						className="text-3xl font-bold mb-3 leading-tight"
						style={{ color: 'var(--text-primary)' }}
					>
						{article.title}
					</h1>
					<div className="flex flex-wrap items-center gap-3 text-sm">
						{article.author && (
							<span
								className="font-medium"
								style={{ color: 'var(--text-secondary)' }}
							>
								by {article.author}
							</span>
						)}
						{article.published_date && (
							<>
								{article.author && (
									<span style={{ color: 'var(--text-tertiary)' }}>•</span>
								)}
								<time
									style={{ color: 'var(--text-secondary)' }}
									dateTime={article.published_date}
								>
									{new Date(article.published_date).toLocaleDateString(
										'en-US',
										{
											year: 'numeric',
											month: 'long',
											day: 'numeric',
										}
									)}
								</time>
							</>
						)}
						{article.url && (
							<>
								{(article.author || article.published_date) && (
									<span style={{ color: 'var(--text-tertiary)' }}>•</span>
								)}
								<a
									href={article.url}
									target="_blank"
									rel="noopener noreferrer"
									className="hover:underline inline-flex items-center gap-1"
									style={{ color: 'var(--link-color)' }}
								>
									{new URL(article.url).hostname.replace('www.', '')}
									<ExternalLink className="h-3 w-3" />
								</a>
							</>
						)}
						{article.word_count && (
							<>
								<span style={{ color: 'var(--text-tertiary)' }}>•</span>
								<span style={{ color: 'var(--text-tertiary)' }}>
									{article.word_count.toLocaleString()} words
								</span>
							</>
						)}
					</div>
				</div>
				<div className="ml-4 flex items-center gap-2">
					{/* Theme toggle */}
					<Button
						variant="ghost"
						size="icon"
						onClick={cycleTheme}
						title={`Switch theme (${theme})`}
						style={{ color: 'var(--text-secondary)' }}
					>
						{theme === 'dark' && <Moon className="h-5 w-5" />}
						{theme === 'light' && <Sun className="h-5 w-5" />}
						{theme === 'sepia' && <BookOpen className="h-5 w-5" />}
					</Button>
					{onClose && (
						<Button
							variant="ghost"
							size="icon"
							onClick={onClose}
							style={{ color: 'var(--text-secondary)' }}
						>
							<X className="h-5 w-5" />
						</Button>
					)}
				</div>
			</header>

			{/* Main content area - split pane layout */}
			<div className="flex flex-1 gap-4 overflow-hidden p-6">
				{/* Left pane: Article content */}
				<div className="flex-1 overflow-hidden" ref={contentPaneRef}>
					<ArticleContentPane
						content={article.content}
						highlights={article.ai_highlights}
						keyPoints={article.ai_key_points}
						activeCitationId={activeCitationId}
						onHighlightClick={handleHighlightClick}
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
			<div
				className="border-t px-6 py-4"
				style={{
					borderColor: 'var(--border-primary)',
					backgroundColor: 'var(--bg-secondary)',
				}}
			>
				<UserNotesInput
					initialNotes={article.user_notes || ''}
					onSave={handleNotesUpdate}
					placeholder="Add your personal notes about this article..."
				/>
			</div>
		</div>
	)
}

// Wrap with ThemeProvider
export function ArticleViewer(props: ArticleViewerProps) {
	return (
		<ThemeProvider>
			<ArticleViewerContent {...props} />
		</ThemeProvider>
	)
}
