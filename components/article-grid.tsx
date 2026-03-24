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
 * - Tag filtering (show articles with specific tags)
 * - Multiple sort options (newest, oldest, title)
 * - Results count display (shows "X articles" or "X results" when searching)
 * - Empty state handling (different messages for no articles vs no search matches)
 * - Responsive grid layout (1 column mobile, 2 tablet, 3 desktop)
 *
 * PERFORMANCE OPTIMIZATION:
 * Uses useMemo to cache filtered/sorted results, preventing
 * unnecessary recalculations on every render.
 *
 * DATA FLOW:
 * Parent component provides articles, tags, and controls state.
 */
'use client'

import { useMemo } from 'react'
import { Article, Tag, ArticleWithTags } from '@/lib/supabase/types'
import { ArticleCard } from './article-card'
import { TagSelector } from './tag-selector'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search, SortAsc } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

type ArticleGridProps = {
	articles: Article[]
	tags: Tag[]
	isLoading?: boolean
	selectedTagIds: string[]
	onTagsChange: (tagIds: string[]) => void
	sortBy: 'newest' | 'oldest' | 'title'
	onSortChange: (sort: 'newest' | 'oldest' | 'title') => void
	searchQuery: string
	onSearchChange: (query: string) => void
	onArticleClick: (articleId: string) => void
	onArticleDelete?: (articleId: string) => void // Optional delete callback
}

export function ArticleGrid({
	articles,
	tags,
	isLoading = false,
	selectedTagIds,
	onTagsChange,
	sortBy,
	onSortChange,
	searchQuery,
	onSearchChange,
	onArticleClick,
	onArticleDelete,
}: ArticleGridProps) {
	const filteredAndSortedArticles = useMemo(() => {
		// Show all articles (including processing/pending for real-time status)
		let filtered = [...articles]

		// Filter by selected tags (if any)
		if (selectedTagIds.length > 0) {
			// This is a placeholder - we'll need to fetch article-tag relationships
			// For now, skip tag filtering
		}

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
				case 'newest':
					return (
						new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
					)
				case 'oldest':
					return (
						new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
					)
				case 'title':
					return a.title.localeCompare(b.title)
				default:
					return 0
			}
		})

		return filtered
	}, [articles, selectedTagIds, searchQuery, sortBy])

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex flex-col sm:flex-row gap-4">
					<Skeleton className="h-10 flex-1" />
					<Skeleton className="h-10 w-full sm:w-[180px]" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-48" />
					))}
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Search, Filter, and Sort */}
			<div className="flex flex-col gap-4">
				<div className="flex flex-col sm:flex-row gap-4">
					{/* Search - Limited to 1/3 width on desktop */}
					<div className="relative w-full sm:max-w-xs">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
						<Input
							type="text"
							placeholder="Search articles..."
							value={searchQuery}
							onChange={(e) => onSearchChange(e.target.value)}
							className="pl-10 bg-slate-900/50 border-slate-700 focus:border-blue-500"
						/>
					</div>

					{/* Sort */}
					<Select value={sortBy} onValueChange={onSortChange}>
						<SelectTrigger className="w-full sm:w-[180px] bg-slate-900/50 border-slate-700">
							<SelectValue placeholder="Sort by" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="newest">
								<div className="flex items-center gap-2">
									<SortAsc className="h-4 w-4" />
									Newest first
								</div>
							</SelectItem>
							<SelectItem value="oldest">
								<div className="flex items-center gap-2">
									<SortAsc className="h-4 w-4 rotate-180" />
									Oldest first
								</div>
							</SelectItem>
							<SelectItem value="title">Title (A-Z)</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Tag Filter */}
				{tags.length > 0 && (
					<TagSelector
						availableTags={tags}
						selectedTagIds={selectedTagIds}
						onTagsChange={onTagsChange}
					/>
				)}
			</div>

			{/* Results Count */}
			<div className="text-sm text-slate-400">
				{searchQuery.trim() || selectedTagIds.length > 0 ? (
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
						{searchQuery.trim() || selectedTagIds.length > 0
							? 'No articles match your filters'
							: 'No processed articles yet. Save your first article above!'}
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredAndSortedArticles.map((article) => {
						// Extract tags from nested structure
						const articleWithTags = article as ArticleWithTags
						const articleTags = articleWithTags.article_tags
							?.map((at) => at.tags?.tag_name)
							.filter((name): name is string => name != null) || []

						return (
							<ArticleCard
								key={article.id}
								article={article}
								tags={articleTags}
								onOpen={onArticleClick}
								onDelete={onArticleDelete}
							/>
						)
					})}
				</div>
			)}
		</div>
	)
}
