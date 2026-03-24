'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { useRouter } from 'next/navigation'
import { SessionCard } from '../auth/components/session-card'
import { ArticleInputBar } from '@/components/article-input-bar'
import { ArticleGrid } from '@/components/article-grid'
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

	const supabase = getSupabaseBrowserClient()
	const router = useRouter()

	const handleSignOut = async () => {
		await supabase.auth.signOut()
		setCurrentUser(null)
		router.push('/auth')
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
						toast.error('AI processing failed to start', {
							description: errorData.error || 'Could not start AI analysis',
						})
					} else {
						const data = await response.json()
						console.log('AI processing started:', data)
						toast.info('AI analysis started', {
							description: 'Processing your article...',
						})
					}
				})
				.catch((error) => {
					console.error('AI processing network error:', error)
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
					const updatedArticle = payload.new as Article

					// Update article in local state
					setArticles((prevArticles) =>
						prevArticles.map((article) =>
							article.id === updatedArticle.id ? updatedArticle : article
						)
					)

					// Show toast notification when processing completes
					if (updatedArticle.processing_status === 'completed') {
						toast.success('Article processed!', {
							description: `"${updatedArticle.title}" is ready to view`,
							action: {
								label: 'Open',
								onClick: () => handleArticleClick(updatedArticle.id),
							},
						})
					} else if (updatedArticle.processing_status === 'failed') {
						toast.error('Processing failed', {
							description: `Failed to process "${updatedArticle.title}"`,
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
					const newArticle = payload.new as Article

					// Add new article to local state
					setArticles((prevArticles) => [newArticle, ...prevArticles])

					toast.info('Article saved!', {
						description: `Processing "${newArticle.title}" with AI...`,
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
		<div className="min-h-screen bg-gradient-to-br from-[#02050b] via-[#050c1d] to-[#071426] text-slate-100">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8">
				{/* Header with session info in top-right */}
				<header className="flex items-start justify-between gap-4">
					<div className="space-y-2">
						<h1 className="text-4xl font-bold text-white drop-shadow-sm">
							Brain Index AI
						</h1>
						<p className="text-slate-400">
							Save articles, get AI insights, organize your knowledge
						</p>
					</div>
					<div className="flex-shrink-0">
						<SessionCard user={currentUser} onSignOut={handleSignOut} />
					</div>
				</header>

				{/* Article Input Bar */}
				<div className="w-full">
					<ArticleInputBar onSubmit={handleArticleSubmit} />
				</div>

				{/* Saved Articles Section */}
				<section className="space-y-4">
					<h2 className="text-2xl font-semibold text-white">Saved Articles</h2>
					<ArticleGrid
						articles={articles}
						tags={tags}
						isLoading={isLoading}
						selectedTagIds={selectedTagIds}
						onTagsChange={setSelectedTagIds}
						sortBy={sortBy}
						onSortChange={setSortBy}
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						onArticleClick={handleArticleClick}
					/>
				</section>
			</div>
		</div>
	)
}
