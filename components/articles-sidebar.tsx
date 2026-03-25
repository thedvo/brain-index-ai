/**
 * ArticlesSidebar Component
 *
 * ChatGPT-style collapsible sidebar that shows:
 * - Session info at the top
 * - List of saved articles with titles and status
 * - Quick navigation to any article
 * - + button to add new articles (focuses input bar)
 *
 * FEATURES:
 * - Mobile: Sheet drawer from left
 * - Desktop: Collapsible sidebar with hamburger button
 * - Grouped by date (Today, Yesterday, This Week, Older)
 * - Click article → navigate to viewer
 * - Hover highlights with smooth transitions
 */
'use client'

import { Article } from '@/lib/supabase/types'
import { User } from '@supabase/supabase-js'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
	Menu,
	Plus,
	FileText,
	Loader2,
	CheckCircle2,
	XCircle,
	ChevronLeft,
	ChevronRight,
	LogOut,
	UserCircle,
	Mail,
	Trash2,
	X,
} from 'lucide-react'
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type ArticlesSidebarProps = {
	articles: Article[]
	user: User | null
	onSignOut: () => void
	onNewArticle: () => void // Callback to focus article input bar
	onArticleDelete?: (articleId: string) => void // Callback to delete article
	currentArticleId?: string // Highlight current article
}

export function ArticlesSidebar({
	articles,
	user,
	onSignOut,
	onNewArticle,
	onArticleDelete,
	currentArticleId,
}: ArticlesSidebarProps) {
	const [open, setOpen] = useState(false) // Mobile drawer state
	const [collapsed, setCollapsed] = useState(false) // Desktop collapse state
	const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null)
	const [isDeleting, setIsDeleting] = useState(false)
	const router = useRouter()

	// Group articles by date
	const groupedArticles = groupArticlesByDate(articles)

	const handleArticleClick = (articleId: string) => {
		router.push(`/articles/${articleId}`)
		setOpen(false) // Close mobile drawer after navigation
	}

	const handleNewArticle = () => {
		router.push('/dashboard')
		onNewArticle()
		setOpen(false)
	}

	const handleDeleteArticle = async (
		articleId: string,
		e: React.MouseEvent
	) => {
		e.stopPropagation() // Prevent navigation when clicking delete
		setDeleteArticleId(articleId)
	}

	const handleDeleteConfirm = async () => {
		if (!deleteArticleId || !onArticleDelete) return

		setIsDeleting(true)
		try {
			const response = await fetch(`/api/articles/${deleteArticleId}`, {
				method: 'DELETE',
			})

			if (!response.ok) {
				throw new Error('Failed to delete article')
			}

			toast.success('Article deleted')
			onArticleDelete(deleteArticleId)
			setDeleteArticleId(null)
		} catch (error) {
			console.error('Error deleting article:', error)
			toast.error('Failed to delete article')
		} finally {
			setIsDeleting(false)
		}
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'completed':
				return <CheckCircle2 className="h-3 w-3 text-green-500" />
			case 'processing':
				return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
			case 'failed':
				return <XCircle className="h-3 w-3 text-red-500" />
			case 'pending':
				return <Loader2 className="h-3 w-3 text-slate-500 animate-spin" />
			default:
				return <FileText className="h-3 w-3 text-slate-500" />
		}
	}

	const getPublicationName = (url: string) => {
		try {
			const urlObj = new URL(url)
			return urlObj.hostname.replace('www.', '')
		} catch {
			return null
		}
	}

	const renderArticleList = () => {
		return (
			<div className="flex flex-col gap-6">
				{/* Session Info Card - Compact */}
				{user && (
					<div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
						<div className="flex items-center justify-between mb-2">
							<Badge
								variant="default"
								className="bg-emerald-500/20 text-emerald-200 border-emerald-500/30"
							>
								<CheckCircle2 className="mr-1 h-3 w-3" />
								Active
							</Badge>
						</div>
						<div className="space-y-2 text-xs text-slate-300">
							<div className="flex items-center gap-2 truncate">
								<Mail className="h-3 w-3 flex-shrink-0 text-slate-400" />
								<span className="truncate">{user.email}</span>
							</div>
						</div>
						<Separator className="my-2 bg-slate-700" />
						<Button
							onClick={onSignOut}
							variant="ghost"
							size="sm"
							className="w-full justify-start text-xs text-slate-400 hover:text-white"
						>
							<LogOut className="h-3 w-3 mr-2" />
							Sign out
						</Button>
					</div>
				)}

				{/* New Article Button */}
				<Button
					onClick={handleNewArticle}
					className="w-full bg-blue-600 hover:bg-blue-700 text-white"
				>
					<Plus className="h-4 w-4 mr-2" />
					New Article
				</Button>

				{/* Grouped Articles */}
				{Object.entries(groupedArticles).map(([group, groupArticles]) => (
					<div key={group} className="flex flex-col gap-2">
						<h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
							{group}
						</h3>
						<div className="flex flex-col gap-1">
							{groupArticles.map((article) => (
								<div
									key={article.id}
									className={cn(
										'group flex items-start gap-2 p-2 rounded-lg transition-colors duration-150 relative',
										'hover:bg-slate-800/50',
										currentArticleId === article.id
											? 'bg-slate-700/50 border border-blue-500/30'
											: 'border border-transparent'
									)}
								>
									<button
										onClick={() => handleArticleClick(article.id)}
										className="flex items-start gap-2 flex-1 min-w-0 text-left"
									>
										<div className="flex-shrink-0 mt-1">
											{getStatusIcon(article.processing_status)}
										</div>
										<div className="flex-1 min-w-0">
											<div className="text-sm text-slate-200 line-clamp-2 leading-tight">
												{article.title}
											</div>
											<div className="flex flex-wrap items-center gap-1.5 mt-1">
												{getPublicationName(article.url) && (
													<Badge
														variant="secondary"
														className="bg-blue-500/10 text-blue-300 border-blue-500/20 text-[9px] px-1 py-0 h-4"
													>
														{getPublicationName(article.url)}
													</Badge>
												)}
												{article.author && (
													<span className="text-[10px] text-slate-400">
														by {article.author}
													</span>
												)}
											</div>
											<div className="text-xs text-slate-500 mt-1">
												{formatDistanceToNow(new Date(article.created_at), {
													addSuffix: true,
												})}
											</div>
										</div>
									</button>
									{onArticleDelete && (
										<Button
											variant="ghost"
											size="icon"
											onClick={(e) => handleDeleteArticle(article.id, e)}
											className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400 flex-shrink-0"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									)}
								</div>
							))}
						</div>
					</div>
				))}

				{articles.length === 0 && (
					<div className="text-center text-slate-500 text-sm py-8">
						No articles saved yet
					</div>
				)}
			</div>
		)
	}

	return (
		<>
			{/* Mobile: Sheet Drawer */}
			<div className="lg:hidden">
				<Sheet open={open} onOpenChange={setOpen}>
					<SheetTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="fixed top-4 left-4 z-50 bg-slate-900/80 backdrop-blur-sm border border-slate-700 hover:bg-slate-800"
						>
							<Menu className="h-5 w-5" />
						</Button>
					</SheetTrigger>
					<SheetContent
						side="left"
						className="w-80 bg-slate-900 border-slate-700 overflow-y-auto"
					>
						<SheetHeader>
							<SheetTitle className="text-slate-100">Saved Articles</SheetTitle>
						</SheetHeader>
						<div className="mt-6">{renderArticleList()}</div>
					</SheetContent>
				</Sheet>
			</div>

			{/* Desktop: Collapsible Sidebar */}
			<aside
				className={cn(
					'hidden lg:flex lg:flex-col border-r border-slate-700 bg-slate-900/30 overflow-y-auto transition-all duration-300',
					collapsed ? 'lg:w-16' : 'lg:w-64'
				)}
			>
				<div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 p-4 flex items-center justify-between">
					{!collapsed && (
						<button
							onClick={() => router.push('/dashboard')}
							className="text-lg font-semibold text-slate-100 hover:text-white transition-colors cursor-pointer"
						>
							Brain Index AI
						</button>
					)}
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setCollapsed(!collapsed)}
						className="text-slate-400 hover:text-slate-200"
					>
						{collapsed ? (
							<Menu className="h-5 w-5" />
						) : (
							<X className="h-5 w-5" />
						)}
					</Button>
				</div>
				{collapsed ? (
					<div className="flex-1 flex flex-col items-center gap-4 py-4">
						{/* New Article Icon Button */}
						<Button
							variant="ghost"
							size="icon"
							onClick={handleNewArticle}
							className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
							title="New Article"
						>
							<Plus className="h-5 w-5" />
						</Button>
						{/* User Profile Icon */}
						{user && (
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setCollapsed(false)}
								className="text-slate-400 hover:text-slate-200"
								title="View Profile"
							>
								<UserCircle className="h-5 w-5" />
							</Button>
						)}
					</div>
				) : (
					<div className="flex-1 p-4">{renderArticleList()}</div>
				)}
			</aside>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={!!deleteArticleId}
				onOpenChange={(open) => !open && setDeleteArticleId(null)}
			>
				<AlertDialogContent className="bg-slate-900 border-slate-700">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-slate-100">
							Delete Article
						</AlertDialogTitle>
						<AlertDialogDescription className="text-slate-400">
							Are you sure you want to delete this article? This action cannot
							be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
							disabled={isDeleting}
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-red-600 hover:bg-red-700 text-white"
							disabled={isDeleting}
						>
							{isDeleting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Deleting...
								</>
							) : (
								'Delete'
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}

// Helper function to group articles by date
function groupArticlesByDate(articles: Article[]) {
	const groups: Record<string, Article[]> = {
		Today: [],
		Yesterday: [],
		'This Week': [],
		Older: [],
	}

	articles.forEach((article) => {
		const date = new Date(article.created_at)
		if (isToday(date)) {
			groups['Today'].push(article)
		} else if (isYesterday(date)) {
			groups['Yesterday'].push(article)
		} else if (isThisWeek(date, { weekStartsOn: 0 })) {
			groups['This Week'].push(article)
		} else {
			groups['Older'].push(article)
		}
	})

	// Remove empty groups
	return Object.fromEntries(
		Object.entries(groups).filter(([_, articles]) => articles.length > 0)
	)
}
