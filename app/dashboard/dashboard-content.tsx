'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { useRouter } from 'next/navigation'
import { SessionCard } from '../auth/components/session-card'
import { ArticleInputBar } from '@/components/article-input-bar'
import { ArticleGrid } from '@/components/article-grid'
import type { Article, Tag } from '@/lib/supabase/types'

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
			// Step 1: Parse the article
			const parseResponse = await fetch('/api/articles/parse', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url }),
			})

			if (!parseResponse.ok) {
				throw new Error('Failed to parse article')
			}

			const parseData = await parseResponse.json()

			// Step 2: Save to database
			const saveResponse = await fetch('/api/articles/save', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					url,
					title: parseData.title,
					author: parseData.author,
					published_date: parseData.published_date,
					content: parseData.content,
					word_count: parseData.word_count,
				}),
			})

			if (!saveResponse.ok) {
				throw new Error('Failed to save article')
			}

			const savedArticle = await saveResponse.json()

			// Step 3: Trigger AI processing in the background
			fetch('/api/ai/process', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ articleId: savedArticle.id }),
			}).catch((error) => {
				console.error('AI processing failed:', error)
			})

			// Step 4: Refresh articles list
			const articlesResponse = await fetch('/api/articles')
			if (articlesResponse.ok) {
				const articlesData = await articlesResponse.json()
				setArticles(articlesData.articles || [])
			}
		} catch (error) {
			console.error('Error saving article:', error)
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
