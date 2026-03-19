import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import AuthForm from './auth-form'
import { AuthPageLayout } from '../components/auth-page-layout'

export default async function AuthPage({
	searchParams,
}: {
	searchParams: Promise<{ method?: string }>
}) {
	const supabase = await createSupabaseServerClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	const params = await searchParams
	const method = params.method === 'google' ? 'google' : 'email'

	return (
		<AuthPageLayout title="Authentication">
			<AuthForm user={user} defaultMethod={method} />
		</AuthPageLayout>
	)
}
