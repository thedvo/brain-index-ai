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
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
	ExternalLink,
	FileText,
	Loader2,
	CheckCircle2,
	XCircle,
	MoreVertical,
	Trash2,
	Calendar,
	Save,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { toast } from 'sonner'

type ArticleCardProps = {
	article: Article
	tags?: string[] // Array of tag names
	onOpen: (articleId: string) => void
	onDelete?: (articleId: string) => void // Optional delete callback
}
export function ArticleCard({
	article,
	tags = [],
	onOpen,
	onDelete,
}: ArticleCardProps) {
	const [isDeleting, setIsDeleting] = useState(false)
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)

	const handleOpen = () => {
		onOpen(article.id)
	}

	const handleDeleteClick = () => {
		setShowDeleteDialog(true)
	}

	const handleDeleteConfirm = async () => {
		if (!onDelete) return

		setIsDeleting(true)
		setShowDeleteDialog(false)
		try {
			const response = await fetch(`/api/articles/${article.id}`, {
				method: 'DELETE',
			})

			if (!response.ok) {
				throw new Error('Failed to delete article')
			}

			toast.success('Article deleted')
			onDelete(article.id)
		} catch (error) {
			console.error('Error deleting article:', error)
			toast.error('Failed to delete article', {
				description:
					error instanceof Error ? error.message : 'Please try again',
			})
		} finally {
			setIsDeleting(false)
		}
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
						className="bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse"
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
						className="bg-slate-500/20 text-slate-400 border-slate-500/30 animate-pulse"
					>
						<Loader2 className="h-3 w-3 mr-1 animate-spin" />
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

	const getPublicationName = () => {
		try {
			const url = new URL(article.url)
			return url.hostname.replace('www.', '')
		} catch {
			return null
		}
	}

	return (
		<>
			<div className="relative">
				<Card
					className="bg-slate-900/50 border-slate-700 hover:border-blue-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02] hover:-translate-y-1 overflow-hidden flex flex-col h-full cursor-pointer"
					onClick={handleOpen}
				>
					{/* Cover Image */}
					{article.image_url && (
						<div className="relative h-48 w-full overflow-hidden bg-slate-800 -mt-4 flex-shrink-0">
							<img
								src={article.image_url}
								alt={`Cover image for ${article.title}`}
								className="h-full w-full object-cover"
								onError={(e) => {
									// Hide parent div if image fails to load
									e.currentTarget.parentElement!.style.display = 'none'
								}}
							/>
						</div>
					)}

					<CardHeader className="space-y-2.5">
						<div className="flex items-start justify-between gap-3">
							<CardTitle
								className="text-base font-semibold text-white leading-snug flex-1 line-clamp-2 hover:text-blue-400 transition-colors"
								title={article.title}
							>
								{article.title}
							</CardTitle>
							<div
								className="flex items-center gap-2 flex-shrink-0"
								onClick={(e) => e.stopPropagation()}
							>
								{getStatusBadge()}
								{onDelete && (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 text-slate-400 hover:text-slate-200"
												disabled={isDeleting}
											>
												<MoreVertical className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={handleDeleteClick}
												disabled={isDeleting}
												className="text-red-400 focus:text-red-300"
											>
												<Trash2 className="h-4 w-4 mr-2" />
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							</div>
						</div>

						<CardDescription className="space-y-1.5">
							{/* Publication Info */}
							<div className="flex flex-wrap items-center gap-1.5">
								{getPublicationName() && (
									<Badge
										variant="secondary"
										className="bg-blue-500/10 text-blue-300 border-blue-500/20 text-[10px] px-1.5 py-0"
									>
										{getPublicationName()}
									</Badge>
								)}
								{article.author && (
									<span className="text-xs text-slate-300">
										by {article.author}
									</span>
								)}
							</div>
							{/* Date Context */}
							<div className="flex flex-wrap items-center gap-2.5 text-[11px]">
								{article.published_date && (
									<div className="flex items-center gap-1 text-slate-400">
										<Calendar className="h-2.5 w-2.5" />
										<span>Published {formatDate(article.published_date)}</span>
									</div>
								)}
								<div className="flex items-center gap-1 text-slate-400">
									<Save className="h-2.5 w-2.5" />
									<span>Saved {formatDate(article.created_at)}</span>
								</div>
								{article.word_count && (
									<span className="text-slate-500">
										• {article.word_count.toLocaleString()} words
									</span>
								)}
							</div>
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-3 flex-1">
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
							<div
								className="text-xs text-slate-400 bg-slate-800/30 rounded-md p-2.5 border border-slate-700/50 cursor-zoom-in"
								title={article.user_notes}
							>
								<div className="flex items-center gap-1.5 mb-1">
									<FileText className="h-3 w-3 text-slate-500" />
									<span className="text-[10px] font-medium text-slate-500">
										Your Notes
									</span>
								</div>
								<p className="text-slate-400 line-clamp-1">
									{article.user_notes}
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Floating View Original Link */}
				<a
					href={article.url}
					target="_blank"
					rel="noopener noreferrer"
					onClick={(e) => e.stopPropagation()}
					className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[11px] text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1 font-medium bg-slate-800/90 px-2.5 py-1 rounded-full border border-slate-700 hover:border-blue-500/50 backdrop-blur-sm"
					aria-label={`View original article: ${article.title}`}
				>
					<ExternalLink className="h-2.5 w-2.5" />
					View original
				</a>
			</div>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent className="bg-slate-900 border-slate-700 rounded-2xl shadow-2xl max-w-md">
					<AlertDialogHeader className="space-y-4">
						<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 border-2 border-red-500/20">
							<Trash2 className="h-7 w-7 text-red-500" />
						</div>
						<div className="text-center space-y-2">
							<AlertDialogTitle className="text-xl font-semibold text-white">
								Delete Article?
							</AlertDialogTitle>
							<AlertDialogDescription className="text-sm text-slate-400 leading-relaxed">
								Are you sure you want to delete{' '}
								<span className="font-medium text-slate-300">
									"{article.title}"
								</span>
								? This action cannot be undone and will permanently remove your
								notes and AI analysis.
							</AlertDialogDescription>
						</div>
					</AlertDialogHeader>
					<AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
						<AlertDialogCancel className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750 hover:text-white transition-colors sm:flex-1 font-medium">
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-red-600 hover:bg-red-700 text-white sm:flex-1 font-medium shadow-lg shadow-red-500/20 transition-all"
							disabled={isDeleting}
						>
							{isDeleting ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Deleting...
								</>
							) : (
								<>
									<Trash2 className="h-4 w-4 mr-2" />
									Delete Article
								</>
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
