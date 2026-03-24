'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Article } from '@/lib/supabase/types'
import { ArticleViewer } from '@/components/article-viewer'
import { ArticlesSidebar } from '@/components/articles-sidebar'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'

type ArticleViewerWithSidebarProps = {
	articleId: string
	articles: Article[]
	user: User
}

export function ArticleViewerWithSidebar({
	articleId,
	articles: initialArticles,
	user,
}: ArticleViewerWithSidebarProps) {
	const [articles, setArticles] = useState(initialArticles)
	const router = useRouter()
	const supabase = getSupabaseBrowserClient()

	const handleSignOut = async () => {
		await supabase.auth.signOut()
		router.push('/auth')
	}

	const handleNewArticle = () => {
		router.push('/dashboard')
	}

	const handleArticleDelete = (deletedArticleId: string) => {
		setArticles((prev) => prev.filter((a) => a.id !== deletedArticleId))
		// If viewing deleted article, redirect to dashboard
		if (deletedArticleId === articleId) {
			router.push('/dashboard')
		}
	}

	return (
		<div className="flex h-screen bg-gradient-to-br from-[#02050b] via-[#050c1d] to-[#071426]">
			<ArticlesSidebar
				articles={articles}
				user={user}
				onSignOut={handleSignOut}
				onNewArticle={handleNewArticle}
				onArticleDelete={handleArticleDelete}
				currentArticleId={articleId}
			/>
			<div className="flex-1 h-screen">
				<ArticleViewer articleId={articleId} />
			</div>
		</div>
	)
}
