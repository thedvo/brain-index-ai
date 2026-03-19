import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import ResetPasswordForm from './reset-password-form'
import { AuthPageLayout } from '../../components/auth-page-layout'

export default async function ResetPasswordPage() {
	const supabase = await createSupabaseServerClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	return (
		<AuthPageLayout title="Reset Password">
			<ResetPasswordForm user={user} />
		</AuthPageLayout>
	)
}
