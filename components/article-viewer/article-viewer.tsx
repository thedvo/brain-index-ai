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
import {
	X,
	Moon,
	Sun,
	BookOpen,
	ExternalLink,
	Info,
	Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { ThemeProvider, useTheme } from '@/lib/theme/theme-context'
import { formatAuthorName } from '@/lib/utils'

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
	const [rightPaneWidth, setRightPaneWidth] = useState(512) // Default 512px - larger AI summary
	const [isResizing, setIsResizing] = useState(false)
	const [fontSize, setFontSize] = useState(18) // Default 18px (1.125rem)
	const [fontFamily, setFontFamily] = useState('Georgia') // Default reading font
	const contentPaneRef = useRef<HTMLDivElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)

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

	// Share article function
	const handleShare = async () => {
		if (!article?.url) return

		if (navigator.share) {
			try {
				await navigator.share({
					title: article.title,
					text: article.ai_summary || article.title,
					url: article.url,
				})
			} catch (err) {
				if ((err as Error).name !== 'AbortError') {
					console.error('Error sharing:', err)
				}
			}
		} else {
			// Fallback: copy to clipboard
			try {
				await navigator.clipboard.writeText(article.url)
				alert('Link copied to clipboard!')
			} catch (err) {
				console.error('Error copying to clipboard:', err)
			}
		}
	}

	// Resize handler
	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault()
		setIsResizing(true)
	}

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!isResizing || !containerRef.current) return

			const containerRect = containerRef.current.getBoundingClientRect()
			const newWidth = containerRect.right - e.clientX

			// Clamp width between 280px and 60% of container width
			const minWidth = 280
			const maxWidth = containerRect.width * 0.6
			const clampedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth))

			setRightPaneWidth(clampedWidth)
		}

		const handleMouseUp = () => {
			setIsResizing(false)
		}

		if (isResizing) {
			document.addEventListener('mousemove', handleMouseMove)
			document.addEventListener('mouseup', handleMouseUp)
			document.body.style.cursor = 'col-resize'
			document.body.style.userSelect = 'none'
		}

		return () => {
			document.removeEventListener('mousemove', handleMouseMove)
			document.removeEventListener('mouseup', handleMouseUp)
			document.body.style.cursor = ''
			document.body.style.userSelect = ''
		}
	}, [isResizing])

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
				className="flex h-screen flex-col items-center justify-center gap-4 px-4"
				style={{
					backgroundColor: 'var(--bg-primary)',
					color: 'var(--text-primary)',
				}}
			>
				<div className="text-center max-w-md">
					<div
						className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full"
						style={{
							backgroundColor: 'var(--bg-tertiary)',
							border: '2px solid var(--border-primary)',
						}}
					>
						<X className="h-8 w-8" style={{ color: 'var(--text-tertiary)' }} />
					</div>
					<h2
						className="text-2xl font-bold mb-2"
						style={{ color: 'var(--text-primary)' }}
					>
						{error ? 'Unable to Load Article' : 'Article Not Found'}
					</h2>
					<p
						className="text-base mb-6"
						style={{ color: 'var(--text-secondary)' }}
					>
						{error ||
							'This article may have been deleted or you may not have permission to view it.'}
					</p>
					{onClose && (
						<Button onClick={onClose} size="lg">
							← Back to Dashboard
						</Button>
					)}
				</div>
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
				className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b px-4 sm:px-8 py-4 sm:py-6 gap-3 sm:gap-0"
				style={{
					borderColor: 'var(--border-primary)',
					backgroundColor: 'var(--bg-secondary)',
				}}
			>
				<div className="flex-1 max-w-4xl w-full">
					<h1
						className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 leading-tight"
						style={{ color: 'var(--text-primary)' }}
					>
						{article.title}
					</h1>
					<div className="flex flex-wrap items-center gap-3 text-sm">
						{formatAuthorName(article.author) && (
							<span
								className="font-medium"
								style={{ color: 'var(--text-secondary)' }}
							>
								by {formatAuthorName(article.author)}
							</span>
						)}
						{article.published_date && (
							<>
								{formatAuthorName(article.author) && (
									<span style={{ color: 'var(--text-tertiary)' }}>•</span>
								)}
								<time
									style={{ color: 'var(--text-secondary)' }}
									dateTime={article.published_date}
								>
									Published{' '}
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
								{(formatAuthorName(article.author) ||
									article.published_date) && (
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

					{/* Info popover */}
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								title="Features & Tips"
								style={{ color: 'var(--text-secondary)' }}
							>
								<Info className="h-5 w-5" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80 p-6" align="end">
							<div className="space-y-3">
								<h3 className="font-semibold text-sm mb-2">
									Available Features
								</h3>
								<div className="space-y-2 text-sm">
									<div>
										<div className="font-medium">🌙 Light/Dark Mode Toggle</div>
										<div className="text-muted-foreground text-xs">
											Switch between reading themes
										</div>
									</div>
									<div>
										<div className="font-medium">🔢 Numbered Citations</div>
										<div className="text-muted-foreground text-xs">
											Click [1] to jump to source in article
										</div>
									</div>
									<div>
										<div className="font-medium">↔️ Resizable Panels</div>
										<div className="text-muted-foreground text-xs">
											Drag divider to adjust layout
										</div>
									</div>
									<div>
										<div className="font-medium">💾 Auto-Saved Notes</div>
										<div className="text-muted-foreground text-xs">
											Your notes save automatically
										</div>
									</div>
									<div>
										<div className="font-medium">🔗 Wikipedia Deep Dives</div>
										<div className="text-muted-foreground text-xs">
											Click terms for contextual knowledge
										</div>
									</div>
								</div>
							</div>
						</PopoverContent>
					</Popover>

					{/* Share button */}
					<Button
						variant="ghost"
						size="icon"
						onClick={handleShare}
						title="Share article"
						style={{ color: 'var(--text-secondary)' }}
					>
						<Share2 className="h-5 w-5" />
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
			<div
				ref={containerRef}
				className="flex flex-col lg:flex-row flex-1 gap-0 overflow-hidden px-3 sm:px-6 pt-1 sm:pt-2 pb-3 sm:pb-6"
			>
				{/* Left pane: Article content */}
				<div
					className="flex-1 overflow-hidden min-h-0 pr-0 lg:pr-3"
					ref={contentPaneRef}
					style={{
						minWidth: 0, // Prevent flex item from overflowing
					}}
				>
					<ArticleContentPane
						content={article.content}
						highlights={article.ai_highlights}
						keyPoints={article.ai_key_points}
						activeCitationId={activeCitationId}
						onHighlightClick={handleHighlightClick}
						fontSize={fontSize}
						fontFamily={fontFamily}
						onFontSizeChange={setFontSize}
						onFontFamilyChange={setFontFamily}
					/>
				</div>

				{/* Resize handle - desktop only */}
				<div
					className="hidden lg:flex items-center justify-center w-4 cursor-col-resize hover:bg-blue-500/10 transition-colors relative group"
					onMouseDown={handleMouseDown}
					style={{
						backgroundColor: isResizing ? 'var(--bg-accent)' : undefined,
					}}
				>
					<div
						className="w-0.5 h-16 rounded-full bg-slate-600 group-hover:bg-blue-500 transition-colors"
						style={{
							backgroundColor: isResizing ? 'var(--link-color)' : undefined,
						}}
					/>
				</div>

				{/* Right pane: AI Summary */}
				<div
					className="w-full overflow-hidden min-h-0 lg:min-h-full"
					style={{
						width: window.innerWidth >= 1024 ? `${rightPaneWidth}px` : '100%',
					}}
				>
					<SummaryPane
						summary={article.ai_summary}
						keyPoints={article.ai_key_points}
						highlights={article.ai_highlights}
						importantTerms={article.ai_important_terms || []}
						activeCitationId={activeCitationId}
						onCitationClick={handleCitationClick}
					/>
				</div>
			</div>

			{/* Bottom: User notes */}
			<div
				className="border-t px-3 sm:px-6 py-4"
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
