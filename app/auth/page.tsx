import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { redirect } from 'next/navigation'
import AuthForm from './auth-form'
import { AuthPageLayout } from './components/auth-page-layout'

export default async function AuthPage({
	searchParams,
}: {
	searchParams: Promise<{ method?: string }>
}) {
	const supabase = await createSupabaseServerClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	// Redirect to dashboard if already authenticated
	if (user) {
		redirect('/dashboard')
	}

	const params = await searchParams
	const method = params.method === 'google' ? 'google' : 'email'

	return (
		<AuthPageLayout title="Authentication">
			<AuthForm user={user} defaultMethod={method} />
		</AuthPageLayout>
	)
}
