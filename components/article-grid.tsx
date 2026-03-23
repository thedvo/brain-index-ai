/**
 * ArticleGrid Component
 *
 * USE CASE:
 * Main container for displaying successfully processed articles in a
 * searchable and sortable grid layout. Provides the primary navigation
 * interface for browsing the article collection.
 *
 * IMPORTANT FEATURES:
 * - Automatically filters to show only completed articles (processing_status === 'completed')
 * - Multi-criteria search (searches across title, author, and notes)
 * - Multiple sort options:
 *   * Date (newest first / oldest first)
 *   * Title (A-Z / Z-A)
 * - Results count display (shows "X articles" or "X results" when searching)
 * - Empty state handling (different messages for no articles vs no search matches)
 * - Responsive grid layout:
 *   * 1 column on mobile
 *   * 2 columns on tablet (md)
 *   * 3 columns on desktop (lg)
 *
 * PERFORMANCE OPTIMIZATION:
 * Uses useMemo to cache filtered/sorted results, preventing
 * unnecessary recalculations on every render. Only recomputes
 * when articles array, searchQuery, or sortBy change.
 *
 * DATA FLOW:
 * Parent component provides:
 * - articles: Array of Article objects from database (all statuses)
 * - articleTags: Map of article IDs to tag name arrays
 * - onOpenArticle: Callback for navigation to article viewer
 *
 * INTEGRATION:
 * Typically used in dashboard page, connected to Supabase
 * articles table with real-time updates via Realtime subscriptions.
 */
'use client'

import { useState, useMemo } from 'react'
import { Article } from '@/lib/supabase/types'
import { ArticleCard } from './article-card'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search, SortAsc } from 'lucide-react'

type ArticleGridProps = {
	articles: Article[]
	articleTags?: Record<string, string[]> // Map of article ID to tag names
	onOpenArticle: (articleId: string) => void
}

type SortOption = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'

export function ArticleGrid({
	articles,
	articleTags = {},
	onOpenArticle,
}: ArticleGridProps) {
	const [searchQuery, setSearchQuery] = useState('')
	const [sortBy, setSortBy] = useState<SortOption>('date-desc')

	const filteredAndSortedArticles = useMemo(() => {
		// Only show successfully processed articles
		let filtered = articles.filter(
			(article) => article.processing_status === 'completed'
		)

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(
				(article) =>
					article.title.toLowerCase().includes(query) ||
					article.author?.toLowerCase().includes(query) ||
					article.user_notes?.toLowerCase().includes(query)
			)
		}

		// Sort
		filtered.sort((a, b) => {
			switch (sortBy) {
				case 'date-desc':
					return (
						new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
					)
				case 'date-asc':
					return (
						new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
					)
				case 'title-asc':
					return a.title.localeCompare(b.title)
				case 'title-desc':
					return b.title.localeCompare(a.title)
				default:
					return 0
			}
		})

		return filtered
	}, [articles, searchQuery, sortBy])

	return (
		<div className="space-y-6">
			{/* Search and Sort */}
			<div className="flex flex-col sm:flex-row gap-4">
				{/* Search */}
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
					<Input
						type="text"
						placeholder="Search articles..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10 bg-slate-900/50 border-slate-700 focus:border-blue-500"
					/>
				</div>

				{/* Sort */}
				<Select
					value={sortBy}
					onValueChange={(value: string) => setSortBy(value as SortOption)}
				>
					<SelectTrigger className="w-full sm:w-[180px] bg-slate-900/50 border-slate-700">
						<SelectValue placeholder="Sort by" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="date-desc">
							<div className="flex items-center gap-2">
								<SortAsc className="h-4 w-4" />
								Newest first
							</div>
						</SelectItem>
						<SelectItem value="date-asc">
							<div className="flex items-center gap-2">
								<SortAsc className="h-4 w-4 rotate-180" />
								Oldest first
							</div>
						</SelectItem>
						<SelectItem value="title-asc">Title (A-Z)</SelectItem>
						<SelectItem value="title-desc">Title (Z-A)</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Results Count */}
			<div className="text-sm text-slate-400">
				{searchQuery.trim() ? (
					<span>
						{filteredAndSortedArticles.length}{' '}
						{filteredAndSortedArticles.length === 1 ? 'result' : 'results'}
					</span>
				) : (
					<span>
						{filteredAndSortedArticles.length}{' '}
						{filteredAndSortedArticles.length === 1 ? 'article' : 'articles'}
					</span>
				)}
			</div>

			{/* Grid */}
			{filteredAndSortedArticles.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-slate-400">
						{searchQuery.trim()
							? 'No articles match your search'
							: 'No processed articles yet'}
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredAndSortedArticles.map((article) => (
						<ArticleCard
							key={article.id}
							article={article}
							tags={articleTags[article.id] || []}
							onOpen={onOpenArticle}
						/>
					))}
				</div>
			)}
		</div>
	)
}
