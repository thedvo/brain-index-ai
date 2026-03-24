import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { redirect } from 'next/navigation'
import { ArticleViewerWithSidebar } from './article-viewer-with-sidebar'

type ArticlePageProps = {
	params: Promise<{ id: string }>
}

export default async function ArticlePage({ params }: ArticlePageProps) {
	const { id } = await params
	const supabase = await createSupabaseServerClient()

	// Check authentication
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		redirect('/auth')
	}

	// Fetch article to verify it exists and belongs to user
	const { data: article, error } = await supabase
		.from('articles')
		.select('id')
		.eq('id', id)
		.eq('user_id', user.id)
		.single()

	if (error || !article) {
		redirect('/dashboard')
	}

	// Fetch all articles for sidebar
	const { data: articles } = await supabase
		.from('articles')
		.select('*')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })

	return (
		<ArticleViewerWithSidebar 
			articleId={id} 
			articles={articles || []}
			user={user}
		/>
	)
}
