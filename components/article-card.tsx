/**
 * ArticleCard Component
 *
 * USE CASE:
 * Display individual article as a card in the dashboard grid.
 * Provides at-a-glance summary of article metadata, processing status,
 * tags, and user notes with quick actions.
 *
 * IMPORTANT FEATURES:
 * - Processing status badges (Ready/Processing/Pending/Failed)
 *   * Green (Ready): AI processing complete, ready to read
 *   * Blue (Processing): Currently being processed by AI
 *   * Gray (Pending): Queued for processing
 *   * Red (Failed): Processing error occurred
 * - Relative date formatting ("2 hours ago", "3 days ago")
 * - Tag display with overflow handling (shows first 3, "+N more" badge)
 * - Notes preview box (truncates at 120 chars with ellipsis)
 * - Hover effects with color transitions
 * - Word count display for reading time estimation
 *
 * VISUAL DESIGN:
 * - Color-coded status indicators for quick scanning
 * - Border color changes on hover (blue glow effect)
 * - External link to original article source
 * - Shadow effect on hover for depth perception
 *
 * INTEGRATION:
 * Used within ArticleGrid component, typically rendered in a
 * responsive grid layout (1-3 columns based on screen size).
 */
'use client'

import { Article } from '@/lib/supabase/types'
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
	ExternalLink,
	FileText,
	Loader2,
	CheckCircle2,
	XCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type ArticleCardProps = {
	article: Article
	tags?: string[] // Array of tag names
	onOpen: (articleId: string) => void
}
export function ArticleCard({ article, tags = [], onOpen }: ArticleCardProps) {
	const handleOpen = () => {
		onOpen(article.id)
	}

	const getStatusBadge = () => {
		switch (article.processing_status) {
			case 'completed':
				return (
					<Badge
						variant="default"
						className="bg-green-500/20 text-green-400 border-green-500/30"
					>
						<CheckCircle2 className="h-3 w-3 mr-1" />
						Ready
					</Badge>
				)
			case 'processing':
				return (
					<Badge
						variant="default"
						className="bg-blue-500/20 text-blue-400 border-blue-500/30"
					>
						<Loader2 className="h-3 w-3 mr-1 animate-spin" />
						Processing
					</Badge>
				)
			case 'failed':
				return (
					<Badge
						variant="destructive"
						className="bg-red-500/20 text-red-400 border-red-500/30"
					>
						<XCircle className="h-3 w-3 mr-1" />
						Failed
					</Badge>
				)
			case 'pending':
				return (
					<Badge
						variant="secondary"
						className="bg-slate-500/20 text-slate-400 border-slate-500/30"
					>
						<Loader2 className="h-3 w-3 mr-1" />
						Pending
					</Badge>
				)
		}
	}

	const truncateText = (text: string, maxLength: number) => {
		if (text.length <= maxLength) return text
		return text.slice(0, maxLength) + '...'
	}

	const formatDate = (dateString: string) => {
		try {
			return formatDistanceToNow(new Date(dateString), { addSuffix: true })
		} catch {
			return 'Recently'
		}
	}

	return (
		<Card className="bg-slate-900/50 border-slate-700 hover:border-blue-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10">
			<CardHeader className="space-y-3">
				<div className="flex items-start justify-between gap-3">
					<CardTitle className="text-lg font-semibold text-slate-100 line-clamp-2 leading-snug">
						{article.title}
					</CardTitle>
					{getStatusBadge()}
				</div>

				<CardDescription className="space-y-1">
					{article.author && (
						<div className="text-sm text-slate-400">by {article.author}</div>
					)}
					<div className="text-xs text-slate-500">
						{article.published_date
							? formatDate(article.published_date)
							: formatDate(article.created_at)}
						{article.word_count && (
							<span className="ml-2">
								• {article.word_count.toLocaleString()} words
							</span>
						)}
					</div>
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-3">
				{/* Tags */}
				{tags.length > 0 && (
					<div className="flex flex-wrap gap-1.5">
						{tags.slice(0, 3).map((tag) => (
							<Badge
								key={tag}
								variant="outline"
								className="text-xs bg-slate-800/50 border-slate-600 text-slate-300"
							>
								{tag}
							</Badge>
						))}
						{tags.length > 3 && (
							<Badge
								variant="outline"
								className="text-xs bg-slate-800/50 border-slate-600 text-slate-400"
							>
								+{tags.length - 3} more
							</Badge>
						)}
					</div>
				)}

				{/* Notes Preview */}
				{article.user_notes && (
					<div className="text-sm text-slate-400 bg-slate-800/30 rounded-md p-3 border border-slate-700/50">
						<div className="flex items-center gap-2 mb-1">
							<FileText className="h-3.5 w-3.5 text-slate-500" />
							<span className="text-xs font-medium text-slate-500">
								Your Notes
							</span>
						</div>
						<p className="text-slate-400 line-clamp-2">
							{truncateText(article.user_notes, 120)}
						</p>
					</div>
				)}
			</CardContent>

			<CardFooter className="flex justify-between items-center pt-4 border-t border-slate-700/50">
				<a
					href={article.url}
					target="_blank"
					rel="noopener noreferrer"
					className="text-xs text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-1"
				>
					<ExternalLink className="h-3 w-3" />
					View original
				</a>

				<Button
					onClick={handleOpen}
					size="sm"
					className="bg-blue-600 hover:bg-blue-700 text-white"
				>
					Open
				</Button>
			</CardFooter>
		</Card>
	)
}
