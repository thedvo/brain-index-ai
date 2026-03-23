import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { redirect } from 'next/navigation'
import { ArticleViewer } from '@/components/article-viewer'

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

	return (
		<div className="h-screen">
			<ArticleViewer articleId={id} />
		</div>
	)
}
