'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { SessionCard } from '../auth/components/session-card'
import {
	ArticleInputBar,
	type ArticleInputBarHandle,
} from '@/components/article-input-bar'
import { ArticleGrid } from '@/components/article-grid'
import { ArticlesSidebar } from '@/components/articles-sidebar'
import type { Article, Tag } from '@/lib/supabase/types'
import { toast } from 'sonner'

type DashboardContentProps = {
	user: User
}

export default function DashboardContent({ user }: DashboardContentProps) {
	const [currentUser, setCurrentUser] = useState<User | null>(user)
	const [articles, setArticles] = useState<Article[]>([])
	const [tags, setTags] = useState<Tag[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
	const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest')
	const [searchQuery, setSearchQuery] = useState('')

	const articleInputRef = useRef<ArticleInputBarHandle>(null)

	// Filter articles to only show those from the past 3 days
	const recentArticles = useMemo(() => {
		const threeDaysAgo = new Date()
		threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

		return articles.filter((article) => {
			const createdAt = new Date(article.created_at)
			return createdAt >= threeDaysAgo
		})
	}, [articles])

	const supabase = getSupabaseBrowserClient()
	const router = useRouter()

	const handleSignOut = async () => {
		await supabase.auth.signOut()
		setCurrentUser(null)
		router.push('/auth')
	}

	// Extract first name from email
	const getFirstName = (email: string | undefined): string => {
		if (!email) return 'there'
		const username = email.split('@')[0]
		const firstName = username.split(/[._-]/)[0]
		return firstName.charAt(0).toUpperCase() + firstName.slice(1)
	}

	// Focus article input (called from sidebar)
	const handleFocusInput = () => {
		articleInputRef.current?.focus()
	}

	// Fetch articles and tags
	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true)
			try {
				// Fetch articles
				const articlesResponse = await fetch('/api/articles')
				if (articlesResponse.ok) {
					const articlesData = await articlesResponse.json()
					setArticles(articlesData.articles || [])
				}

				// Fetch tags
				const tagsResponse = await fetch('/api/tags')
				if (tagsResponse.ok) {
					const tagsData = await tagsResponse.json()
					setTags(tagsData.tags || [])
				}
			} catch (error) {
				console.error('Error fetching data:', error)
			} finally {
				setIsLoading(false)
			}
		}

		fetchData()
	}, [])

	// Refresh articles after saving new one
	const handleArticleSubmit = async (url: string) => {
		try {
			// Step 1: Check if article already exists and parse if not
			const parseResponse = await fetch('/api/articles/parse', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url }),
			})

			// Better error handling - check if response is JSON before parsing
			const contentType = parseResponse.headers.get('content-type')
			if (!contentType || !contentType.includes('application/json')) {
				// Server returned HTML error page instead of JSON
				throw new Error(
					`Server error (${parseResponse.status}): Unable to parse article. The URL may be blocked or invalid.`
				)
			}

			if (!parseResponse.ok) {
				const errorData = await parseResponse.json()
				throw new Error(errorData.error || 'Failed to parse article')
			}

			const parseData = await parseResponse.json()

			// If article already exists, navigate to it
			if (parseData.exists && parseData.article) {
				toast.info('Article already saved', {
					description: `"${parseData.article.title}" was saved previously`,
					action: {
						label: 'Open',
						onClick: () => handleArticleClick(parseData.article.id),
					},
				})
				return
			}

			// Step 2: Save to database (using preview data)
			const preview = parseData.preview
			const saveResponse = await fetch('/api/articles/save', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url }),
			})

			// Better error handling for save response too
			const saveContentType = saveResponse.headers.get('content-type')
			if (!saveContentType || !saveContentType.includes('application/json')) {
				throw new Error(
					`Server error (${saveResponse.status}): Unable to save article.`
				)
			}

			if (!saveResponse.ok) {
				const errorData = await saveResponse.json()
				throw new Error(errorData.error || 'Failed to save article')
			}

			const saveData = await saveResponse.json()

			// If save returns existing article, navigate to it
			if (saveData.alreadyExists && saveData.article) {
				toast.info('Article already saved', {
					description: `"${saveData.article.title}" was saved previously`,
					action: {
						label: 'Open',
						onClick: () => handleArticleClick(saveData.article.id),
					},
				})
				return
			}

			const savedArticle = saveData.article

			// OPTIMISTIC UPDATE: Add article to state immediately (don't wait for Realtime)
			setArticles((prevArticles) => [savedArticle, ...prevArticles])

			// Show immediate feedback
			toast.success('Article saved!', {
				description: `"${savedArticle.title}" - AI analysis starting...`,
				duration: 3000,
			})

			// Step 3: Trigger AI processing in the background
			console.log(`Triggering AI processing for article: ${savedArticle.id}`)
			fetch('/api/ai/process', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ articleId: savedArticle.id }),
			})
				.then(async (response) => {
					console.log(`AI process response status: ${response.status}`)
					if (!response.ok) {
						const errorData = await response.json()
						console.error('AI processing failed:', errorData)
						// Update status to failed in local state
						setArticles((prev) =>
							prev.map((a) =>
								a.id === savedArticle.id
									? { ...a, processing_status: 'failed' as const }
									: a
							)
						)
						toast.error('AI processing failed', {
							description: errorData.error || 'Could not analyze article',
						})
					} else {
						const data = await response.json()
						console.log('AI processing started:', data)
						// Update status to processing in local state
						setArticles((prev) =>
							prev.map((a) =>
								a.id === savedArticle.id
									? { ...a, processing_status: 'processing' as const }
									: a
							)
						)
					}
				})
				.catch((error) => {
					console.error('AI processing network error:', error)
					setArticles((prev) =>
						prev.map((a) =>
							a.id === savedArticle.id
								? { ...a, processing_status: 'failed' as const }
								: a
						)
					)
					toast.error('AI processing failed', {
						description: 'Network error - check connection',
					})
				})
		} catch (error) {
			console.error('Error saving article:', error)
			toast.error('Failed to save article', {
				description:
					error instanceof Error ? error.message : 'Unknown error occurred',
			})
			throw error // Re-throw to let ArticleInputBar handle the error state
		}
	}

	// Handle article click
	const handleArticleClick = (articleId: string) => {
		router.push(`/articles/${articleId}`)
	}

	// Handle article deletion
	const handleArticleDelete = (articleId: string) => {
		setArticles((prev) => prev.filter((a) => a.id !== articleId))
	}

	useEffect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			if (!session?.user) {
				router.push('/auth')
			} else {
				setCurrentUser(session.user)
			}
		})
		return () => subscription.unsubscribe()
	}, [supabase, router])

	// Subscribe to article updates for real-time status changes
	useEffect(() => {
		if (!currentUser) return

		const channel = supabase
			.channel('articles-changes')
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'articles',
					filter: `user_id=eq.${currentUser.id}`,
				},
				(payload) => {
					console.log('Realtime UPDATE event received:', payload)
					const updatedArticle = payload.new as Article
					const oldArticle = payload.old as Article

					// Update article in local state
					setArticles((prevArticles) =>
						prevArticles.map((article) =>
							article.id === updatedArticle.id ? updatedArticle : article
						)
					)

					// Show toast notification when status changes
					if (
						oldArticle.processing_status !== 'processing' &&
						updatedArticle.processing_status === 'processing'
					) {
						toast.info('Processing started', {
							description: `Analyzing "${updatedArticle.title}"...`,
							duration: 2000,
						})
					} else if (
						oldArticle.processing_status !== 'completed' &&
						updatedArticle.processing_status === 'completed'
					) {
						toast.success('Article ready!', {
							description: `"${updatedArticle.title}" has been analyzed`,
							action: {
								label: 'Open',
								onClick: () => handleArticleClick(updatedArticle.id),
							},
							duration: 5000,
						})
					} else if (
						oldArticle.processing_status !== 'failed' &&
						updatedArticle.processing_status === 'failed'
					) {
						toast.error('Processing failed', {
							description: `Could not analyze "${updatedArticle.title}"`,
						})
					}
				}
			)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'articles',
					filter: `user_id=eq.${currentUser.id}`,
				},
				(payload) => {
					console.log('Realtime INSERT event received:', payload)
					const newArticle = payload.new as Article

					// Check if article already exists (from optimistic update)
					setArticles((prevArticles) => {
						const exists = prevArticles.some((a) => a.id === newArticle.id)
						if (exists) {
							console.log('Article already in state, skipping INSERT')
							return prevArticles
						}
						return [newArticle, ...prevArticles]
					})
				}
			)
			.subscribe()

		return () => {
			supabase.removeChannel(channel)
		}
	}, [currentUser, supabase, router])

	if (!currentUser) {
		return null
	}

	return (
		<div className="flex min-h-screen bg-gradient-to-br from-[#02050b] via-[#050c1d] to-[#071426] text-slate-100">
			{/* Sidebar */}
			<ArticlesSidebar
				articles={articles}
				user={currentUser}
				onSignOut={handleSignOut}
				onNewArticle={handleFocusInput}
				onArticleDelete={handleArticleDelete}
			/>

			{/* Main Content */}
			<div className="flex-1 overflow-y-auto">
				<div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8 px-4 sm:px-6 pt-16 sm:pt-20 pb-6 sm:pb-8">
					{/* Greeting Header */}
					<div className="space-y-3">
						<div className="flex items-center gap-3">
							<div className="relative">
								<Sparkles
									className="h-10 w-10 sm:h-12 sm:w-12 text-transparent bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 bg-clip-text"
									style={{
										filter: 'drop-shadow(0 0 8px rgba(148, 163, 184, 0.5))',
									}}
								/>
								<Sparkles className="absolute inset-0 h-10 w-10 sm:h-12 sm:w-12 text-blue-200/30 animate-pulse" />
							</div>
							<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
								Brain Index AI
							</h1>
						</div>
						<p className="text-lg sm:text-xl text-slate-300">
							Save articles, unlock AI insights, organize your knowledge.
						</p>
					</div>

					{/* Article Input Bar - Narrower Width */}
					<div className="w-full max-w-3xl">
						<ArticleInputBar
							ref={articleInputRef}
							onSubmit={handleArticleSubmit}
							disabled={isLoading}
						/>
					</div>

					{/* Saved Articles Section */}
					<section className="space-y-4">
						<h2 className="text-xl sm:text-2xl font-semibold text-white">
							Saved Articles (Past 3 Days)
						</h2>
						<ArticleGrid
							articles={recentArticles}
							tags={tags}
							isLoading={isLoading}
							selectedTagIds={selectedTagIds}
							onTagsChange={setSelectedTagIds}
							sortBy={sortBy}
							onSortChange={setSortBy}
							searchQuery={searchQuery}
							onSearchChange={setSearchQuery}
							onArticleClick={handleArticleClick}
							onArticleDelete={handleArticleDelete}
						/>
					</section>
				</div>
			</div>
		</div>
	)
}
